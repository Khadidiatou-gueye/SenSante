const mysql = require("mysql2/promise")
const bcrypt = require("bcryptjs")

async function verifyLogin() {
  console.log("🔍 Vérification complète des connexions\n")

  try {
    const db = await mysql.createConnection({
      host: "localhost",
      user: "root",
      password: "passer",
      database: "sensante",
    })

    console.log("✅ Connexion MySQL réussie\n")

    // Vérifier admin
    console.log("👨‍💼 VÉRIFICATION ADMIN:")
    const [admins] = await db.execute("SELECT id, nom, prenom, email, mot_de_passe FROM administrateurs")

    if (admins.length === 0) {
      console.log("❌ Aucun administrateur trouvé!")
    } else {
      console.log(`📊 ${admins.length} administrateur(s) trouvé(s)`)

      for (const admin of admins) {
        console.log(`📧 Email: ${admin.email}`)
        console.log(`👤 Nom: ${admin.prenom} ${admin.nom}`)
        console.log(`🔐 Hash: ${admin.mot_de_passe.substring(0, 20)}...`)

        // Test avec admin123
        const testAdmin = await bcrypt.compare("admin123", admin.mot_de_passe)
        console.log(`🔑 Test "admin123": ${testAdmin ? "✅ VALIDE" : "❌ INVALIDE"}`)
        console.log()
      }
    }

    // Vérifier médecin
    console.log("👨‍⚕️ VÉRIFICATION MÉDECIN:")
    const [medecins] = await db.execute("SELECT id, nom, prenom, email, mot_de_passe, site_id FROM medecins")

    if (medecins.length === 0) {
      console.log("❌ Aucun médecin trouvé!")
    } else {
      console.log(`📊 ${medecins.length} médecin(s) trouvé(s)`)

      for (const medecin of medecins) {
        console.log(`📧 Email: ${medecin.email}`)
        console.log(`👤 Nom: Dr. ${medecin.prenom} ${medecin.nom}`)
        console.log(`🏥 Site ID: ${medecin.site_id}`)
        console.log(`🔐 Hash: ${medecin.mot_de_passe.substring(0, 20)}...`)

        // Test avec medecin123
        const testMedecin = await bcrypt.compare("medecin123", medecin.mot_de_passe)
        console.log(`🔑 Test "medecin123": ${testMedecin ? "✅ VALIDE" : "❌ INVALIDE"}`)
        console.log()
      }
    }

    // Vérifier sites
    console.log("🏥 VÉRIFICATION SITES:")
    const [sites] = await db.execute("SELECT id, nom FROM sites")
    console.log(`📊 ${sites.length} site(s) trouvé(s)`)
    sites.forEach((site) => {
      console.log(`- ${site.nom} (ID: ${site.id})`)
    })

    await db.end()

    console.log("\n📋 RÉSUMÉ:")
    console.log("- Si tous les hashs sont ✅, la connexion devrait marcher")
    console.log("- Si des hashs sont ❌, relancez update-hashes.js")
    console.log("- Puis redémarrez le serveur avec npm start")
  } catch (error) {
    console.error("❌ Erreur:", error)
  }
}

verifyLogin()
