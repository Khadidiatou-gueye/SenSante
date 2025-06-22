const express = require("express")
const mysql = require("mysql2/promise")
const bcrypt = require("bcryptjs") // Utilisation de bcryptjs pour éviter les problèmes Windows
const jwt = require("jsonwebtoken")
const cors = require("cors")
const path = require("path")

const app = express()
const PORT = 3000
const JWT_SECRET = "sensante_secret_key_2024"

// ================================
// CONFIGURATION ET MIDDLEWARE
// ================================

app.use(cors())
app.use(express.json())
app.use(express.static("public"))

// Configuration de la base de données
const configBD = {
  host: "localhost",
  user: "root",
  password: "passer",
  database: "sensante",
}

// Variable globale pour la connexion
let connexionBD

// ================================
// FONCTIONS UTILITAIRES
// ================================

// Connexion à la base de données
async function connecterBD() {
  try {
    connexionBD = await mysql.createConnection(configBD)
    console.log("✅ Connexion à MySQL réussie")

    // Vérifier et créer la colonne role si nécessaire
    await verifierStructureBD()
  } catch (erreur) {
    console.error("❌ Erreur de connexion à MySQL:", erreur)
    process.exit(1)
  }
}

// Vérifier la structure de la base de données
async function verifierStructureBD() {
  try {
    // Vérifier si la colonne role existe
    const [colonnes] = await connexionBD.execute("SHOW COLUMNS FROM medecins LIKE 'role'")

    if (colonnes.length === 0) {
      console.log("🔧 Ajout de la colonne 'role' à la table medecins...")
      await connexionBD.execute("ALTER TABLE medecins ADD COLUMN role VARCHAR(20) DEFAULT 'medecin'")
      console.log("✅ Colonne 'role' ajoutée")
    }
  } catch (erreur) {
    console.error("⚠️ Erreur lors de la vérification de la structure:", erreur)
  }
}

// Fonction d'audit - enregistre toutes les actions importantes
async function enregistrerAudit(action, utilisateurId, details) {
  try {
    await connexionBD.execute(
      "INSERT INTO audit (action, utilisateur_id, details, date_action) VALUES (?, ?, ?, NOW())",
      [action, utilisateurId, JSON.stringify(details)],
    )
  } catch (erreur) {
    console.error("Erreur lors de l'enregistrement d'audit:", erreur)
  }
}

// ================================
// MIDDLEWARE D'AUTHENTIFICATION
// ================================

// Vérifier le token JWT
function verifierToken(req, res, next) {
  const token = req.headers.authorization?.split(" ")[1]

  if (!token) {
    return res.status(401).json({ erreur: "Token manquant" })
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET)
    req.utilisateur = decoded
    next()
  } catch (erreur) {
    return res.status(401).json({ erreur: "Token invalide" })
  }
}

// Vérifier si l'utilisateur est administrateur
function verifierAdmin(req, res, next) {
  if (req.utilisateur.role !== "admin") {
    return res.status(403).json({ erreur: "Accès réservé aux administrateurs" })
  }
  next()
}

// ================================
// ROUTES D'AUTHENTIFICATION
// ================================

// Route de connexion
app.post("/api/connexion", async (req, res) => {
  try {
    const { email, motDePasse } = req.body

    console.log(`🔐 Tentative de connexion pour: ${email}`)

    // Rechercher l'utilisateur par email
    const [utilisateurs] = await connexionBD.execute("SELECT * FROM medecins WHERE email = ?", [email])

    if (utilisateurs.length === 0) {
      console.log(`❌ Utilisateur non trouvé: ${email}`)
      await enregistrerAudit("TENTATIVE_CONNEXION_ECHEC", null, { email, raison: "utilisateur_inexistant" })
      return res.status(401).json({ erreur: "Identifiants invalides" })
    }

    const utilisateur = utilisateurs[0]
    console.log(`👤 Utilisateur trouvé: ${utilisateur.nom} ${utilisateur.prenom} (${utilisateur.role || "medecin"})`)

    // Vérifier le mot de passe
    const motDePasseValide = await bcrypt.compare(motDePasse, utilisateur.mot_de_passe)

    if (!motDePasseValide) {
      console.log(`❌ Mot de passe invalide pour: ${email}`)
      await enregistrerAudit("TENTATIVE_CONNEXION_ECHEC", utilisateur.id, { email, raison: "mot_de_passe_invalide" })
      return res.status(401).json({ erreur: "Identifiants invalides" })
    }

    // Créer le token JWT
    const token = jwt.sign(
      {
        id: utilisateur.id,
        email: utilisateur.email,
        nom: utilisateur.nom,
        prenom: utilisateur.prenom,
        role: utilisateur.role || "medecin",
        site_id: utilisateur.site_id,
      },
      JWT_SECRET,
      { expiresIn: "8h" },
    )

    // Enregistrer la connexion réussie
    await enregistrerAudit("CONNEXION_REUSSIE", utilisateur.id, { email, role: utilisateur.role || "medecin" })

    console.log(`✅ Connexion réussie pour: ${email} (${utilisateur.role || "medecin"})`)

    // Réponse avec le token et les infos utilisateur
    res.json({
      token,
      utilisateur: {
        id: utilisateur.id,
        nom: utilisateur.nom,
        prenom: utilisateur.prenom,
        email: utilisateur.email,
        role: utilisateur.role || "medecin",
        site_id: utilisateur.site_id,
      },
    })
  } catch (erreur) {
    console.error("Erreur lors de la connexion:", erreur)
    res.status(500).json({ erreur: "Erreur serveur" })
  }
})

// ================================
// ROUTES DASHBOARD
// ================================

// Dashboard avec gestion des rôles
app.get("/api/dashboard", verifierToken, async (req, res) => {
  try {
    console.log(`📊 Chargement dashboard pour: ${req.utilisateur.email} (${req.utilisateur.role})`)

    if (req.utilisateur.role === "admin") {
      // Dashboard admin - statistiques globales
      const [statsPatients] = await connexionBD.execute("SELECT COUNT(*) as total_patients FROM patients")

      const [statsConsultations] = await connexionBD.execute(
        "SELECT COUNT(*) as total_consultations FROM consultations",
      )

      const [statsMedecins] = await connexionBD.execute(
        "SELECT COUNT(*) as total_medecins FROM medecins WHERE role = 'medecin'",
      )

      const [statsSites] = await connexionBD.execute("SELECT COUNT(*) as total_sites FROM sites")

      // Consultations récentes (toutes)
      const [consultationsRecentes] = await connexionBD.execute(
        `SELECT c.*, p.nom as nom_patient, p.prenom as prenom_patient, 
                m.nom as nom_medecin, m.prenom as prenom_medecin
         FROM consultations c 
         JOIN patients p ON c.patient_id = p.id 
         JOIN medecins m ON c.medecin_id = m.id
         ORDER BY c.date_consultation DESC 
         LIMIT 10`,
      )

      await enregistrerAudit("CONSULTATION_DASHBOARD_ADMIN", req.utilisateur.id, {
        total_patients: statsPatients[0].total_patients,
        total_consultations: statsConsultations[0].total_consultations,
      })

      res.json({
        type: "admin",
        statistiques: {
          total_patients: statsPatients[0].total_patients,
          total_consultations: statsConsultations[0].total_consultations,
          total_medecins: statsMedecins[0].total_medecins,
          total_sites: statsSites[0].total_sites,
        },
        consultations_recentes: consultationsRecentes,
      })
    } else {
      // Dashboard médecin - statistiques personnelles
      const [statsPatientsTotal] = await connexionBD.execute(
        "SELECT COUNT(*) as total_patients_site FROM patients WHERE site_id = ?",
        [req.utilisateur.site_id],
      )

      const [statsConsultationsMedecin] = await connexionBD.execute(
        `SELECT COUNT(*) as total_consultations_medecin 
         FROM consultations c 
         JOIN patients p ON c.patient_id = p.id 
         WHERE p.site_id = ? AND c.medecin_id = ?`,
        [req.utilisateur.site_id, req.utilisateur.id],
      )

      const [statsPatientsConsultes] = await connexionBD.execute(
        `SELECT COUNT(DISTINCT c.patient_id) as patients_consultes 
         FROM consultations c 
         JOIN patients p ON c.patient_id = p.id 
         WHERE p.site_id = ? AND c.medecin_id = ?`,
        [req.utilisateur.site_id, req.utilisateur.id],
      )

      const [consultationsRecentes] = await connexionBD.execute(
        `SELECT c.*, p.nom as nom_patient, p.prenom as prenom_patient 
         FROM consultations c 
         JOIN patients p ON c.patient_id = p.id 
         WHERE p.site_id = ? AND c.medecin_id = ?
         ORDER BY c.date_consultation DESC 
         LIMIT 5`,
        [req.utilisateur.site_id, req.utilisateur.id],
      )

      const [consultationsSemaine] = await connexionBD.execute(
        `SELECT COUNT(*) as consultations_semaine 
         FROM consultations c 
         JOIN patients p ON c.patient_id = p.id 
         WHERE p.site_id = ? AND c.medecin_id = ? 
         AND c.date_consultation >= DATE_SUB(NOW(), INTERVAL 7 DAY)`,
        [req.utilisateur.site_id, req.utilisateur.id],
      )

      await enregistrerAudit("CONSULTATION_DASHBOARD_MEDECIN", req.utilisateur.id, {
        total_patients_site: statsPatientsTotal[0].total_patients_site,
        total_consultations_medecin: statsConsultationsMedecin[0].total_consultations_medecin,
        patients_consultes: statsPatientsConsultes[0].patients_consultes,
      })

      res.json({
        type: "medecin",
        statistiques: {
          total_patients_site: statsPatientsTotal[0].total_patients_site,
          total_consultations_medecin: statsConsultationsMedecin[0].total_consultations_medecin,
          patients_consultes: statsPatientsConsultes[0].patients_consultes,
          consultations_semaine: consultationsSemaine[0].consultations_semaine,
        },
        consultations_recentes: consultationsRecentes,
      })
    }
  } catch (erreur) {
    console.error("Erreur lors de la récupération du dashboard:", erreur)
    res.status(500).json({ erreur: "Erreur serveur" })
  }
})

// ================================
// ROUTES PATIENTS
// ================================

// Lister tous les patients (admin voit tout, médecin voit son site)
app.get("/api/patients", verifierToken, async (req, res) => {
  try {
    let query, params

    if (req.utilisateur.role === "admin") {
      query = "SELECT p.*, s.nom as nom_site FROM patients p JOIN sites s ON p.site_id = s.id ORDER BY p.nom, p.prenom"
      params = []
    } else {
      query = "SELECT * FROM patients WHERE site_id = ? ORDER BY nom, prenom"
      params = [req.utilisateur.site_id]
    }

    const [patients] = await connexionBD.execute(query, params)

    await enregistrerAudit("CONSULTATION_LISTE_PATIENTS", req.utilisateur.id, {
      nombre_patients: patients.length,
      role: req.utilisateur.role,
    })

    res.json(patients)
  } catch (erreur) {
    console.error("Erreur lors de la récupération des patients:", erreur)
    res.status(500).json({ erreur: "Erreur serveur" })
  }
})

// Créer un nouveau patient
app.post("/api/patients", verifierToken, async (req, res) => {
  try {
    const { nom, prenom, age, telephone, adresse, antecedents } = req.body

    // Validation des données
    if (!nom || !prenom || !age) {
      return res.status(400).json({ erreur: "Nom, prénom et âge sont obligatoires" })
    }

    const [resultat] = await connexionBD.execute(
      `INSERT INTO patients (nom, prenom, age, telephone, adresse, antecedents, site_id, date_creation) 
       VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
      [nom, prenom, age, telephone, adresse, antecedents, req.utilisateur.site_id],
    )

    await enregistrerAudit("CREATION_PATIENT", req.utilisateur.id, {
      patient_id: resultat.insertId,
      nom: nom,
      prenom: prenom,
    })

    res.status(201).json({
      message: "Patient créé avec succès",
      id: resultat.insertId,
    })
  } catch (erreur) {
    console.error("Erreur lors de la création du patient:", erreur)
    res.status(500).json({ erreur: "Erreur serveur" })
  }
})

// Récupérer un patient spécifique
app.get("/api/patients/:id", verifierToken, async (req, res) => {
  try {
    let query, params

    if (req.utilisateur.role === "admin") {
      query = "SELECT * FROM patients WHERE id = ?"
      params = [req.params.id]
    } else {
      query = "SELECT * FROM patients WHERE id = ? AND site_id = ?"
      params = [req.params.id, req.utilisateur.site_id]
    }

    const [patients] = await connexionBD.execute(query, params)

    if (patients.length === 0) {
      return res.status(404).json({ erreur: "Patient non trouvé" })
    }

    await enregistrerAudit("CONSULTATION_PATIENT", req.utilisateur.id, {
      patient_id: req.params.id,
    })

    res.json(patients[0])
  } catch (erreur) {
    console.error("Erreur lors de la récupération du patient:", erreur)
    res.status(500).json({ erreur: "Erreur serveur" })
  }
})

// ================================
// ROUTES CONSULTATIONS
// ================================

// Lister toutes les consultations
app.get("/api/consultations", verifierToken, async (req, res) => {
  try {
    let query, params

    if (req.utilisateur.role === "admin") {
      query = `SELECT c.*, 
                      p.nom as nom_patient, p.prenom as prenom_patient,
                      m.nom as nom_medecin, m.prenom as prenom_medecin,
                      s.nom as nom_site
               FROM consultations c 
               JOIN patients p ON c.patient_id = p.id 
               JOIN medecins m ON c.medecin_id = m.id
               JOIN sites s ON p.site_id = s.id
               ORDER BY c.date_consultation DESC`
      params = []
    } else {
      query = `SELECT c.*, 
                      p.nom as nom_patient, p.prenom as prenom_patient,
                      m.nom as nom_medecin, m.prenom as prenom_medecin
               FROM consultations c 
               JOIN patients p ON c.patient_id = p.id 
               JOIN medecins m ON c.medecin_id = m.id
               WHERE p.site_id = ?
               ORDER BY c.date_consultation DESC`
      params = [req.utilisateur.site_id]
    }

    const [consultations] = await connexionBD.execute(query, params)

    await enregistrerAudit("CONSULTATION_LISTE_CONSULTATIONS", req.utilisateur.id, {
      nombre_consultations: consultations.length,
      role: req.utilisateur.role,
    })

    res.json(consultations)
  } catch (erreur) {
    console.error("Erreur lors de la récupération des consultations:", erreur)
    res.status(500).json({ erreur: "Erreur serveur" })
  }
})

// Créer une nouvelle consultation
app.post("/api/consultations", verifierToken, async (req, res) => {
  try {
    const { patient_id, diagnostic, notes, traitement } = req.body

    // Validation des données
    if (!patient_id || !diagnostic) {
      return res.status(400).json({ erreur: "Patient et diagnostic sont obligatoires" })
    }

    // Vérifier que le patient existe et est accessible
    let query, params
    if (req.utilisateur.role === "admin") {
      query = "SELECT * FROM patients WHERE id = ?"
      params = [patient_id]
    } else {
      query = "SELECT * FROM patients WHERE id = ? AND site_id = ?"
      params = [patient_id, req.utilisateur.site_id]
    }

    const [patients] = await connexionBD.execute(query, params)

    if (patients.length === 0) {
      return res.status(403).json({ erreur: "Accès non autorisé à ce patient" })
    }

    const [resultat] = await connexionBD.execute(
      `INSERT INTO consultations (patient_id, medecin_id, diagnostic, notes, traitement, date_consultation) 
       VALUES (?, ?, ?, ?, ?, NOW())`,
      [patient_id, req.utilisateur.id, diagnostic, notes, traitement],
    )

    await enregistrerAudit("CREATION_CONSULTATION", req.utilisateur.id, {
      consultation_id: resultat.insertId,
      patient_id: patient_id,
      diagnostic: diagnostic,
    })

    res.status(201).json({
      message: "Consultation enregistrée avec succès",
      id: resultat.insertId,
    })
  } catch (erreur) {
    console.error("Erreur lors de la création de la consultation:", erreur)
    res.status(500).json({ erreur: "Erreur serveur" })
  }
})

// Récupérer les consultations d'un patient spécifique
app.get("/api/patients/:id/consultations", verifierToken, async (req, res) => {
  try {
    let query, params

    if (req.utilisateur.role === "admin") {
      query = `SELECT c.*, m.nom as nom_medecin, m.prenom as prenom_medecin 
               FROM consultations c 
               JOIN medecins m ON c.medecin_id = m.id 
               WHERE c.patient_id = ?
               ORDER BY c.date_consultation DESC`
      params = [req.params.id]
    } else {
      query = `SELECT c.*, m.nom as nom_medecin, m.prenom as prenom_medecin 
               FROM consultations c 
               JOIN medecins m ON c.medecin_id = m.id 
               JOIN patients p ON c.patient_id = p.id 
               WHERE c.patient_id = ? AND p.site_id = ?
               ORDER BY c.date_consultation DESC`
      params = [req.params.id, req.utilisateur.site_id]
    }

    const [consultations] = await connexionBD.execute(query, params)

    await enregistrerAudit("CONSULTATION_HISTORIQUE", req.utilisateur.id, {
      patient_id: req.params.id,
      nombre_consultations: consultations.length,
    })

    res.json(consultations)
  } catch (erreur) {
    console.error("Erreur lors de la récupération des consultations:", erreur)
    res.status(500).json({ erreur: "Erreur serveur" })
  }
})

// ================================
// ROUTES PRESCRIPTIONS
// ================================

// Créer une prescription
app.post("/api/prescriptions", verifierToken, async (req, res) => {
  try {
    const { consultation_id, medicaments, posologie, duree } = req.body

    // Validation des données
    if (!consultation_id || !medicaments) {
      return res.status(400).json({ erreur: "Consultation et médicaments sont obligatoires" })
    }

    const [resultat] = await connexionBD.execute(
      `INSERT INTO prescriptions (consultation_id, medicaments, posologie, duree, date_prescription) 
       VALUES (?, ?, ?, ?, NOW())`,
      [consultation_id, medicaments, posologie, duree],
    )

    await enregistrerAudit("CREATION_PRESCRIPTION", req.utilisateur.id, {
      prescription_id: resultat.insertId,
      consultation_id: consultation_id,
      medicaments: medicaments,
    })

    res.status(201).json({
      message: "Prescription créée avec succès",
      id: resultat.insertId,
    })
  } catch (erreur) {
    console.error("Erreur lors de la création de la prescription:", erreur)
    res.status(500).json({ erreur: "Erreur serveur" })
  }
})

// ================================
// ROUTES AUDIT (ADMIN SEULEMENT)
// ================================

// Récupérer les logs d'audit - ADMIN SEULEMENT
app.get("/api/audit", verifierToken, verifierAdmin, async (req, res) => {
  try {
    const [logs] = await connexionBD.execute(`
      SELECT a.*, m.nom as nom_medecin, m.prenom as prenom_medecin 
      FROM audit a 
      LEFT JOIN medecins m ON a.utilisateur_id = m.id 
      ORDER BY a.date_action DESC 
      LIMIT 100
    `)

    await enregistrerAudit("CONSULTATION_AUDIT", req.utilisateur.id, {
      nombre_logs: logs.length,
    })

    res.json(logs)
  } catch (erreur) {
    console.error("Erreur lors de la récupération des logs d'audit:", erreur)
    res.status(500).json({ erreur: "Erreur interne du serveur" })
  }
})

// ================================
// ROUTES STATIQUES
// ================================

// Route pour servir le frontend
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"))
})

// Route de test pour vérifier que le serveur fonctionne
app.get("/api/test", (req, res) => {
  res.json({
    message: "Serveur SenSanté opérationnel",
    timestamp: new Date().toISOString(),
  })
})

// ================================
// GESTION DES ERREURS
// ================================

// Middleware de gestion des erreurs 404
app.use((req, res) => {
  console.log(`❌ Route non trouvée: ${req.method} ${req.url}`)
  res.status(404).json({ erreur: "Route non trouvée" })
})

// Middleware de gestion des erreurs globales
app.use((err, req, res, next) => {
  console.error("Erreur serveur:", err)
  res.status(500).json({ erreur: "Erreur interne du serveur" })
})

// ================================
// DÉMARRAGE DU SERVEUR
// ================================

async function demarrerServeur() {
  try {
    // Connexion à la base de données
    await connecterBD()

    // Démarrage du serveur HTTP
    app.listen(PORT, () => {
      console.log(`🚀 Serveur SenSanté démarré sur http://localhost:${PORT}`)
      console.log(`📊 Dashboard: http://localhost:${PORT}`)
      console.log(`🔧 API Test: http://localhost:${PORT}/api/test`)
      console.log(`📝 Comptes disponibles:`)
      console.log(`   👨‍💼 Admin: admin@sensante.sn / admin123`)
      console.log(`   👨‍⚕️ Médecin: amadou.diop@sensante.sn / motdepasse123`)
      console.log(`   👨‍⚕️ Médecin: fatou.ndiaye@sensante.sn / motdepasse123`)
    })
  } catch (erreur) {
    console.error("❌ Erreur lors du démarrage du serveur:", erreur)
    process.exit(1)
  }
}

// Gestion propre de l'arrêt du serveur
process.on("SIGINT", async () => {
  console.log("\n🛑 Arrêt du serveur en cours...")
  if (connexionBD) {
    await connexionBD.end()
    console.log("✅ Connexion MySQL fermée")
  }
  process.exit(0)
})

// Démarrer l'application
const demarrarServeur = demarrerServeur
demarrarServeur()
