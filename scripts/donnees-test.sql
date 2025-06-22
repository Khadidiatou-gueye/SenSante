-- Données de test pour SenSanté
USE sensante;

-- Insertion des sites
INSERT INTO sites (nom, adresse, telephone) VALUES
('Hôpital Principal Dakar', 'Avenue Cheikh Anta Diop, Dakar', '+221 33 123 45 67'),
('Clinique de Thiès', 'Route de Saint-Louis, Thiès', '+221 33 987 65 43'),
('Centre Médical Kaolack', 'Quartier Médina, Kaolack', '+221 33 456 78 90');

-- Insertion des médecins (mots de passe hashés avec bcrypt)
-- Mot de passe par défaut: "motdepasse123"
INSERT INTO medecins (nom, prenom, email, mot_de_passe, specialite, site_id) VALUES
('Diop', 'Amadou', 'amadou.diop@sensante.sn', '$2b$10$rQZ8kqXvqKqKqKqKqKqKqOqKqKqKqKqKqKqKqKqKqKqKqKqKqKqKq', 'Cardiologie', 1),
('Ndiaye', 'Fatou', 'fatou.ndiaye@sensante.sn', '$2b$10$rQZ8kqXvqKqKqKqKqKqKqOqKqKqKqKqKqKqKqKqKqKqKqKqKqKqKq', 'Pédiatrie', 1),
('Fall', 'Moussa', 'moussa.fall@sensante.sn', '$2b$10$rQZ8kqXvqKqKqKqKqKqKqOqKqKqKqKqKqKqKqKqKqKqKqKqKqKqKq', 'Médecine Générale', 2),
('Sarr', 'Aïssatou', 'aissatou.sarr@sensante.sn', '$2b$10$rQZ8kqXvqKqKqKqKqKqKqOqKqKqKqKqKqKqKqKqKqKqKqKqKqKqKq', 'Gynécologie', 3);

-- Insertion des patients
INSERT INTO patients (nom, prenom, age, telephone, adresse, antecedents, site_id) VALUES
('Ba', 'Ousmane', 45, '+221 77 123 45 67', 'Médina, Dakar', 'Hypertension artérielle', 1),
('Sow', 'Mariama', 32, '+221 76 987 65 43', 'Plateau, Dakar', 'Diabète type 2', 1),
('Cissé', 'Ibrahim', 28, '+221 78 456 78 90', 'Centre-ville, Thiès', 'Aucun antécédent notable', 2),
('Diouf', 'Khady', 55, '+221 77 321 65 87', 'Médina, Kaolack', 'Asthme chronique', 3);

-- Insertion des consultations
INSERT INTO consultations (patient_id, medecin_id, diagnostic, notes, traitement) VALUES
(1, 1, 'Hypertension non contrôlée', 'Patient présente une tension élevée malgré le traitement', 'Ajustement de la médication antihypertensive'),
(2, 2, 'Contrôle diabète', 'Glycémie stable, bon suivi du régime', 'Continuer le traitement actuel'),
(3, 3, 'Consultation de routine', 'Examen général normal', 'Aucun traitement nécessaire'),
(4, 4, 'Crise d\'asthme légère', 'Essoufflement suite à effort physique', 'Bronchodilatateur en cas de besoin');

-- Insertion des prescriptions
INSERT INTO prescriptions (consultation_id, medicaments, posologie, duree) VALUES
(1, 'Amlodipine 10mg', '1 comprimé par jour le matin', '30 jours'),
(2, 'Metformine 850mg', '1 comprimé matin et soir', '30 jours'),
(4, 'Salbutamol inhalateur', '2 bouffées en cas de crise', 'Au besoin');
