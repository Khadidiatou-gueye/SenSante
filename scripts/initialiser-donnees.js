const bcrypt = require("bcrypt")
const mysql = require("mysql2/promise")

const configBD = {
  host: "localhost",
  user: "root",
  password: "passer",
  database: "sensante",
}

async function initialiserDonnees() {
  let connexion

  try {
    connexion = await mysql.createConnection(configBD)
    console.log("✅ Connexion à MySQL réussie")

    // Hasher le mot de passe par défaut
    const motDePasseHash = await bcrypt.hash("motdepasse123", 10)
    console.log("🔐 Mot de passe hashé:", motDePasseHash)

    // Insérer les médecins avec des mots de passe hashés
    await connexion.execute(
      `
      INSERT IGNORE INTO medecins (nom, prenom, email, mot_de_passe, specialite, site_id) VALUES
      ('Diop', 'Amadou', 'amadou.diop@sensante.sn', ?, 'Cardiologie', 1),
      ('Ndiaye', 'Fatou', 'fatou.ndiaye@sensante.sn', ?, 'Pédiatrie', 1),
      ('Fall', 'Moussa', 'moussa.fall@sensante.sn', ?, 'Médecine Générale', 2),
      ('Sarr', 'Aïssatou', 'aissatou.sarr@sensante.sn', ?, 'Gynécologie', 3)
    `,
      [motDePasseHash, motDePasseHash, motDePasseHash, motDePasseHash],
    )

    console.log("✅ Données initialisées avec succès")
    console.log("📧 Comptes de test créés:")
    console.log("   - amadou.diop@sensante.sn / motdepasse123")
    console.log("   - fatou.ndiaye@sensante.sn / motdepasse123")
    console.log("   - moussa.fall@sensante.sn / motdepasse123")
    console.log("   - aissatou.sarr@sensante.sn / motdepasse123")
  } catch (erreur) {
    console.error("❌ Erreur:", erreur)
  } finally {
    if (connexion) {
      await connexion.end()
    }
  }
}

initialiserDonnees()
