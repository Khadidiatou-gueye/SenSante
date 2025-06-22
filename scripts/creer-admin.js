const mysql = require("mysql2/promise")
const bcrypt = require("bcryptjs")

async function createAdmin() {
  console.log("👨‍💼 Création de l'administrateur\n")

  try {
    const db = await mysql.createConnection({
      host: "localhost",
      user: "root",
      password: "passer",
      database: "sensante",
    })

    console.log("✅ Connexion MySQL réussie")

    // 1. Vérifier si l'admin existe
    console.log("🔍 Vérification de l'admin existant...")
    const [existingAdmins] = await db.execute("SELECT * FROM administrateurs WHERE email = ?", ["admin@sensante.sn"])

    if (existingAdmins.length > 0) {
      console.log("⚠️ Admin déjà existant, suppression...")
      await db.execute("DELETE FROM administrateurs WHERE email = ?", ["admin@sensante.sn"])
    }

    // 2. Générer le hash du mot de passe
    console.log("🔐 Génération du hash pour 'admin123'...")
    const adminHash = await bcrypt.hash("admin123", 10)
    console.log("✅ Hash généré:", adminHash)

    // 3. Test du hash
    const testHash = await bcrypt.compare("admin123", adminHash)
    console.log(`🧪 Test du hash: ${testHash ? "✅ VALIDE" : "❌ INVALIDE"}`)

    if (!testHash) {
      console.log("❌ Erreur dans la génération du hash!")
      return
    }

    // 4. Créer l'admin
    console.log("👨‍💼 Création de l'administrateur...")
    await db.execute("INSERT INTO administrateurs (nom, prenom, email, mot_de_passe) VALUES (?, ?, ?, ?)", [
      "Admin",
      "Système",
      "admin@sensante.sn",
      adminHash,
    ])

    // 5. Vérification finale
    console.log("🔍 Vérification finale...")
    const [newAdmin] = await db.execute("SELECT * FROM administrateurs WHERE email = ?", ["admin@sensante.sn"])

    if (newAdmin.length > 0) {
      const admin = newAdmin[0]
      console.log("✅ Admin créé avec succès!")
      console.log(`📧 Email: ${admin.email}`)
      console.log(`👤 Nom: ${admin.prenom} ${admin.nom}`)
      console.log(`🆔 ID: ${admin.id}`)

      // Test final du mot de passe
      const finalTest = await bcrypt.compare("admin123", admin.mot_de_passe)
      console.log(`🔑 Test final: ${finalTest ? "✅ VALIDE" : "❌ INVALIDE"}`)
    }

    await db.end()

    console.log("\n🎉 ADMIN CRÉÉ AVEC SUCCÈS!")
    console.log("📧 Compte admin:")
    console.log("   Email: admin@sensante.sn")
    console.log("   Mot de passe: admin123")
    console.log("\n🚀 Vous pouvez maintenant vous connecter!")
  } catch (error) {
    console.error("❌ Erreur:", error)
  }
}

createAdmin()
