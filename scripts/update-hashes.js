const mysql = require("mysql2/promise")
const bcrypt = require("bcryptjs")

async function updateHashes() {
  console.log("🔐 Mise à jour des hashs de mots de passe\n")

  try {
    const db = await mysql.createConnection({
      host: "localhost",
      user: "root",
      password: "passer",
      database: "sensante",
    })

    console.log("✅ Connexion MySQL réussie")

    // 1. Générer les nouveaux hashs
    console.log("🔧 Génération des nouveaux hashs...")
    const adminHash = await bcrypt.hash("admin123", 10)
    const medecinHash = await bcrypt.hash("medecin123", 10)

    console.log("📝 Nouveaux hashs:")
    console.log("Admin:", adminHash)
    console.log("Médecin:", medecinHash)
    console.log()

    // 2. Test des hashs avant mise à jour
    console.log("🧪 Test des hashs...")
    const adminTest = await bcrypt.compare("admin123", adminHash)
    const medecinTest = await bcrypt.compare("medecin123", medecinHash)

    console.log(`Admin hash test: ${adminTest ? "✅" : "❌"}`)
    console.log(`Médecin hash test: ${medecinTest ? "✅" : "❌"}`)

    if (!adminTest || !medecinTest) {
      console.log("❌ Erreur dans la génération des hashs!")
      return
    }

    // 3. Mettre à jour l'admin
    console.log("\n👨‍💼 Mise à jour du hash admin...")
    const [adminResult] = await db.execute("UPDATE administrateurs SET mot_de_passe = ? WHERE email = ?", [
      adminHash,
      "admin@sensante.sn",
    ])
    console.log(`✅ Admin mis à jour (${adminResult.affectedRows} ligne(s))`)

    // 4. Mettre à jour le médecin
    console.log("👨‍⚕️ Mise à jour du hash médecin...")
    const [medecinResult] = await db.execute("UPDATE medecins SET mot_de_passe = ? WHERE email = ?", [
      medecinHash,
      "medecin@sensante.sn",
    ])
    console.log(`✅ Médecin mis à jour (${medecinResult.affectedRows} ligne(s))`)

    // 5. Vérification finale
    console.log("\n🔍 Vérification finale...")

    // Test admin en base
    const [adminDB] = await db.execute("SELECT * FROM administrateurs WHERE email = ?", ["admin@sensante.sn"])
    if (adminDB.length > 0) {
      const adminFinalTest = await bcrypt.compare("admin123", adminDB[0].mot_de_passe)
      console.log(`Admin en base: ${adminFinalTest ? "✅ VALIDE" : "❌ INVALIDE"}`)
    }

    // Test médecin en base
    const [medecinDB] = await db.execute("SELECT * FROM medecins WHERE email = ?", ["medecin@sensante.sn"])
    if (medecinDB.length > 0) {
      const medecinFinalTest = await bcrypt.compare("medecin123", medecinDB[0].mot_de_passe)
      console.log(`Médecin en base: ${medecinFinalTest ? "✅ VALIDE" : "❌ INVALIDE"}`)
    }

    await db.end()

    console.log("\n🎉 MISE À JOUR TERMINÉE!")
    console.log("📧 Comptes prêts:")
    console.log("   👨‍💼 admin@sensante.sn / admin123")
    console.log("   👨‍⚕️ medecin@sensante.sn / medecin123")
    console.log("\n🚀 Redémarrez le serveur: npm start")
  } catch (error) {
    console.error("❌ Erreur:", error)
  }
}

updateHashes()
