-- SenSanté - Base de données complète
CREATE DATABASE IF NOT EXISTS sensante;
USE sensante;

-- Table des sites médicaux
CREATE TABLE sites (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nom VARCHAR(100) NOT NULL,
    adresse TEXT,
    telephone VARCHAR(20),
    date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table des administrateurs (séparée)
CREATE TABLE administrateurs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nom VARCHAR(50) NOT NULL,
    prenom VARCHAR(50) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    mot_de_passe VARCHAR(255) NOT NULL,
    date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table des médecins (séparée)
CREATE TABLE medecins (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nom VARCHAR(50) NOT NULL,
    prenom VARCHAR(50) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    mot_de_passe VARCHAR(255) NOT NULL,
    specialite VARCHAR(100),
    site_id INT NOT NULL,
    date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (site_id) REFERENCES sites(id)
);

-- Table des patients
CREATE TABLE patients (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nom VARCHAR(50) NOT NULL,
    prenom VARCHAR(50) NOT NULL,
    age INT,
    telephone VARCHAR(20),
    adresse TEXT,
    antecedents TEXT,
    site_id INT NOT NULL,
    date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (site_id) REFERENCES sites(id)
);

-- Table des consultations
CREATE TABLE consultations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    patient_id INT NOT NULL,
    medecin_id INT NOT NULL,
    diagnostic TEXT,
    notes TEXT,
    traitement TEXT,
    date_consultation TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (patient_id) REFERENCES patients(id),
    FOREIGN KEY (medecin_id) REFERENCES medecins(id)
);

-- Table d'audit
CREATE TABLE audit (
    id INT AUTO_INCREMENT PRIMARY KEY,
    action VARCHAR(100) NOT NULL,
    utilisateur_type ENUM('admin', 'medecin') NOT NULL,
    utilisateur_id INT NOT NULL,
    details JSON,
    date_action TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    adresse_ip VARCHAR(45)
);

-- Données initiales
INSERT INTO sites (nom, adresse, telephone) VALUES
('Hôpital Principal Dakar', 'Avenue Cheikh Anta Diop, Dakar', '+221 33 123 45 67'),
('Clinique de Thiès', 'Route de Saint-Louis, Thiès', '+221 33 987 65 43');

-- Admin par défaut (mot de passe: admin123)
INSERT INTO administrateurs (nom, prenom, email, mot_de_passe) VALUES
('Admin', 'Système', 'admin@sensante.sn', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi');

-- Médecin par défaut (mot de passe: medecin123)
INSERT INTO medecins (nom, prenom, email, mot_de_passe, specialite, site_id) VALUES
('Diop', 'Amadou', 'medecin@sensante.sn', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Cardiologie', 1);

-- Patients de test
INSERT INTO patients (nom, prenom, age, telephone, site_id) VALUES
('Ba', 'Ousmane', 45, '+221 77 123 45 67', 1),
('Sow', 'Mariama', 32, '+221 76 987 65 43', 1);
