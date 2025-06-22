const express = require("express")
const mysql = require("mysql2/promise")
const bcrypt = require("bcryptjs")
const jwt = require("jsonwebtoken")
const cors = require("cors")
const path = require("path")

const app = express()
const PORT = 3000
const JWT_SECRET = "sensante_secret_2024"

app.use(cors())
app.use(express.json())
app.use(express.static("public"))

// Connexion base de données
const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "passer",
  database: "sensante",
})

// Middleware d'authentification
const auth = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1]
  if (!token) return res.status(401).json({ error: "Token manquant" })

  try {
    req.user = jwt.verify(token, JWT_SECRET)
    next()
  } catch {
    res.status(401).json({ error: "Token invalide" })
  }
}

// Fonction d'audit
const audit = async (action, userType, userId, details = {}) => {
  try {
    await (await db).execute(
      "INSERT INTO audit (action, utilisateur_type, utilisateur_id, details) VALUES (?, ?, ?, ?)",
      [action, userType, userId, JSON.stringify(details)],
    )
  } catch (err) {
    console.error("Erreur audit:", err)
  }
}

// ROUTES

// Connexion
app.post("/api/login", async (req, res) => {
  const { email, password } = req.body

  try {
    // Vérifier admin
    const [admins] = await (await db).execute("SELECT * FROM administrateurs WHERE email = ?", [email])
    if (admins.length > 0) {
      const admin = admins[0]
      if (await bcrypt.compare(password, admin.mot_de_passe)) {
        const token = jwt.sign({ id: admin.id, type: "admin", email: admin.email }, JWT_SECRET, { expiresIn: "8h" })
        await audit("CONNEXION", "admin", admin.id)
        return res.json({ token, user: { ...admin, type: "admin" } })
      }
    }

    // Vérifier médecin
    const [medecins] = await (await db).execute("SELECT * FROM medecins WHERE email = ?", [email])
    if (medecins.length > 0) {
      const medecin = medecins[0]
      if (await bcrypt.compare(password, medecin.mot_de_passe)) {
        const token = jwt.sign(
          { id: medecin.id, type: "medecin", email: medecin.email, site_id: medecin.site_id },
          JWT_SECRET,
          { expiresIn: "8h" },
        )
        await audit("CONNEXION", "medecin", medecin.id)
        return res.json({ token, user: { ...medecin, type: "medecin" } })
      }
    }

    res.status(401).json({ error: "Identifiants invalides" })
  } catch (err) {
    res.status(500).json({ error: "Erreur serveur" })
  }
})

// Dashboard
app.get("/api/dashboard", auth, async (req, res) => {
  try {
    if (req.user.type === "admin") {
      const [patients] = await (await db).execute("SELECT COUNT(*) as total FROM patients")
      const [medecins] = await (await db).execute("SELECT COUNT(*) as total FROM medecins")
      const [consultations] = await (await db).execute("SELECT COUNT(*) as total FROM consultations")
      const [sites] = await (await db).execute("SELECT COUNT(*) as total FROM sites")

      res.json({
        patients: patients[0].total,
        medecins: medecins[0].total,
        consultations: consultations[0].total,
        sites: sites[0].total,
      })
    } else {
      const [patients] = await (await db).execute("SELECT COUNT(*) as total FROM patients WHERE site_id = ?", [
        req.user.site_id,
      ])
      const [consultations] = await (await db).execute(
        "SELECT COUNT(*) as total FROM consultations c JOIN patients p ON c.patient_id = p.id WHERE p.site_id = ? AND c.medecin_id = ?",
        [req.user.site_id, req.user.id],
      )

      res.json({
        patients: patients[0].total,
        consultations: consultations[0].total,
      })
    }
  } catch (err) {
    res.status(500).json({ error: "Erreur serveur" })
  }
})

// Patients
app.get("/api/patients", auth, async (req, res) => {
  try {
    let query = "SELECT p.*, s.nom as site_nom FROM patients p JOIN sites s ON p.site_id = s.id"
    let params = []

    if (req.user.type === "medecin") {
      query += " WHERE p.site_id = ?"
      params = [req.user.site_id]
    }

    const [patients] = await (await db).execute(query, params)
    res.json(patients)
  } catch (err) {
    res.status(500).json({ error: "Erreur serveur" })
  }
})

app.post("/api/patients", auth, async (req, res) => {
  const { nom, prenom, age, telephone, adresse, antecedents } = req.body
  const site_id = req.user.type === "admin" ? req.body.site_id : req.user.site_id

  try {
    const [result] = await (await db).execute(
      "INSERT INTO patients (nom, prenom, age, telephone, adresse, antecedents, site_id) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [nom, prenom, age, telephone, adresse, antecedents, site_id],
    )

    await audit("CREATION_PATIENT", req.user.type, req.user.id, { patient_id: result.insertId, nom, prenom })
    res.json({ success: true, id: result.insertId })
  } catch (err) {
    res.status(500).json({ error: "Erreur serveur" })
  }
})

// Consultations
app.get("/api/consultations", auth, async (req, res) => {
  try {
    let query = `SELECT c.*, p.nom as patient_nom, p.prenom as patient_prenom, 
                 m.nom as medecin_nom, m.prenom as medecin_prenom, s.nom as site_nom
                 FROM consultations c 
                 JOIN patients p ON c.patient_id = p.id 
                 JOIN medecins m ON c.medecin_id = m.id
                 JOIN sites s ON p.site_id = s.id`
    let params = []

    if (req.user.type === "medecin") {
      query += " WHERE p.site_id = ?"
      params = [req.user.site_id]
    }

    query += " ORDER BY c.date_consultation DESC"

    const [consultations] = await (await db).execute(query, params)
    res.json(consultations)
  } catch (err) {
    res.status(500).json({ error: "Erreur serveur" })
  }
})

app.post("/api/consultations", auth, async (req, res) => {
  const { patient_id, diagnostic, notes, traitement } = req.body

  try {
    const [result] = await (await db).execute(
      "INSERT INTO consultations (patient_id, medecin_id, diagnostic, notes, traitement) VALUES (?, ?, ?, ?, ?)",
      [patient_id, req.user.id, diagnostic, notes, traitement],
    )

    await audit("CREATION_CONSULTATION", req.user.type, req.user.id, { consultation_id: result.insertId, patient_id })
    res.json({ success: true, id: result.insertId })
  } catch (err) {
    res.status(500).json({ error: "Erreur serveur" })
  }
})

// Audit (admin seulement)
app.get("/api/audit", auth, async (req, res) => {
  if (req.user.type !== "admin") {
    return res.status(403).json({ error: "Accès refusé" })
  }

  try {
    const [logs] = await (await db).execute(`
      SELECT a.*, 
             CASE 
               WHEN a.utilisateur_type = 'admin' THEN (SELECT CONCAT(nom, ' ', prenom) FROM administrateurs WHERE id = a.utilisateur_id)
               WHEN a.utilisateur_type = 'medecin' THEN (SELECT CONCAT(nom, ' ', prenom) FROM medecins WHERE id = a.utilisateur_id)
             END as utilisateur_nom
      FROM audit a 
      ORDER BY a.date_action DESC 
      LIMIT 50
    `)
    res.json(logs)
  } catch (err) {
    res.status(500).json({ error: "Erreur serveur" })
  }
})

// Sites (admin seulement)
app.get("/api/sites", auth, async (req, res) => {
  if (req.user.type !== "admin") {
    return res.status(403).json({ error: "Accès refusé" })
  }

  try {
    const [sites] = await (await db).execute("SELECT * FROM sites")
    res.json(sites)
  } catch (err) {
    res.status(500).json({ error: "Erreur serveur" })
  }
})

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"))
})

app.listen(PORT, () => {
  console.log(`🏥 SenSanté démarré sur http://localhost:${PORT}`)
  console.log("👨‍💼 Admin: admin@sensante.sn / admin123")
  console.log("👨‍⚕️ Médecin: medecin@sensante.sn / medecin123")
})
