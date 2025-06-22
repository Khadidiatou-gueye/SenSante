const bcrypt = require("bcryptjs")

async function generateHash() {
  console.log("🔐 Générateur de hashs manuels\n")

  // Générer hash pour admin123
  const adminHash = await bcrypt.hash("admin123", 10)
  console.log("👨‍💼 Hash pour 'admin123':")
  console.log(adminHash)
  console.log()

  // Générer hash pour medecin123
  const medecinHash = await bcrypt.hash("medecin123", 10)
  console.log("👨‍⚕️ Hash pour 'medecin123':")
  console.log(medecinHash)
  console.log()

  // Test des hashs
  console.log("🧪 Test des hashs générés:")
  const adminTest = await bcrypt.compare("admin123", adminHash)
  const medecinTest = await bcrypt.compare("medecin123", medecinHash)

  console.log(`Admin test: ${adminTest ? "✅" : "❌"}`)
  console.log(`Médecin test: ${medecinTest ? "✅" : "❌"}`)
  console.log()

  console.log("📋 INSTRUCTIONS:")
  console.log("1. Copiez les hashs ci-dessus")
  console.log("2. Ouvrez phpMyAdmin ou MySQL Workbench")
  console.log("3. Exécutez les requêtes SQL suivantes:")
  console.log()
  console.log("-- Mettre à jour l'admin:")
  console.log(`UPDATE administrateurs SET mot_de_passe = '${adminHash}' WHERE email = 'admin@sensante.sn';`)
  console.log()
  console.log("-- Mettre à jour le médecin:")
  console.log(`UPDATE medecins SET mot_de_passe = '${medecinHash}' WHERE email = 'medecin@sensante.sn';`)
}

generateHash()
