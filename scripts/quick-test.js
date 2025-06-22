const mysql = require("mysql2/promise")
const bcrypt = require("bcryptjs")

async function quickTest() {
  console.log("⚡ Test rapide de connexion\n")

  try {
    const db = await mysql.createConnection({
      host: "localhost",
      user: "root",
      password: "passer",
      database: "sensante",
    })

    // Test admin
    const [admins] = await db.execute("SELECT * FROM administrateurs WHERE email = ?", ["admin@sensante.sn"])
    if (admins.length > 0) {
      const isValid = await bcrypt.compare("admin123", admins[0].mot_de_passe)
      console.log(`👨‍💼 Admin: ${isValid ? "✅ PRÊT" : "❌ PROBLÈME"}`)
    } else {
      console.log("👨‍💼 Admin: ❌ NON TROUVÉ")
    }

    // Test médecin
    const [medecins] = await db.execute("SELECT * FROM medecins WHERE email = ?", ["medecin@sensante.sn"])
    if (medecins.length > 0) {
      const isValid = await bcrypt.compare("medecin123", medecins[0].mot_de_passe)
      console.log(`👨‍⚕️ Médecin: ${isValid ? "✅ PRÊT" : "❌ PROBLÈME"}`)
    } else {
      console.log("👨‍⚕️ Médecin: ❌ NON TROUVÉ")
    }

    await db.end()
    console.log("\n🚀 Si tout est ✅, lancez: npm start")
  } catch (error) {
    console.error("❌ Erreur:", error)
  }
}

quickTest()
