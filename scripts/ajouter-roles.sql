-- Ajouter la colonne role à la table medecins
ALTER TABLE medecins ADD COLUMN role VARCHAR(20) DEFAULT 'medecin';

-- Créer un compte administrateur
INSERT INTO medecins (nom, prenom, email, mot_de_passe, specialite, site_id, role) VALUES
('Admin', 'Système', 'admin@sensante.sn', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Administration', 1, 'admin');

-- Mettre à jour les médecins existants
UPDATE medecins SET role = 'medecin' WHERE role IS NULL;
