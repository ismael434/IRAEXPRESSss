CREATE DATABASE IF NOT EXISTS ira_express CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE ira_express;

CREATE TABLE utilisateurs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nom VARCHAR(100) NOT NULL,
    telephone VARCHAR(20) NOT NULL UNIQUE,
    email VARCHAR(150) DEFAULT NULL,
    mot_de_passe VARCHAR(255) NOT NULL,
    role ENUM('client','commercant','livreur','admin') NOT NULL DEFAULT 'client',
    quartier VARCHAR(100) DEFAULT NULL,
    adresse TEXT DEFAULT NULL,
    statut ENUM('actif','suspendu','en_attente') NOT NULL DEFAULT 'actif',
    date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE boutiques (
    id INT AUTO_INCREMENT PRIMARY KEY,
    utilisateur_id INT NOT NULL,
    nom_boutique VARCHAR(150) NOT NULL,
    description TEXT DEFAULT NULL,
    logo VARCHAR(255) DEFAULT NULL,
    quartier VARCHAR(100) DEFAULT NULL,
    date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (utilisateur_id) REFERENCES utilisateurs(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nom VARCHAR(100) NOT NULL,
    icone VARCHAR(50) DEFAULT NULL,
    slug VARCHAR(100) NOT NULL UNIQUE
) ENGINE=InnoDB;

INSERT INTO categories (nom, icone, slug) VALUES
('Gaz domestique', 'gaz.svg', 'gaz-domestique'),
('Denrées alimentaires', 'alimentation.svg', 'denrees-alimentaires'),
('Matériaux de construction', 'materiaux.svg', 'materiaux-construction'),
('Livraison de colis', 'colis.svg', 'livraison-colis');

CREATE TABLE produits (
    id INT AUTO_INCREMENT PRIMARY KEY,
    boutique_id INT NOT NULL,
    categorie_id INT NOT NULL,
    nom VARCHAR(150) NOT NULL,
    description TEXT DEFAULT NULL,
    prix DECIMAL(10,2) NOT NULL,
    stock INT NOT NULL DEFAULT 0,
    photo VARCHAR(255) DEFAULT NULL,
    statut ENUM('disponible','rupture','desactive') NOT NULL DEFAULT 'disponible',
    date_ajout TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (boutique_id) REFERENCES boutiques(id) ON DELETE CASCADE,
    FOREIGN KEY (categorie_id) REFERENCES categories(id)
) ENGINE=InnoDB;

CREATE TABLE commandes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    client_id INT NOT NULL,
    boutique_id INT NOT NULL,
    livreur_id INT DEFAULT NULL,
    adresse_livraison TEXT NOT NULL,
    quartier_livraison VARCHAR(100) DEFAULT NULL,
    telephone_contact VARCHAR(20) NOT NULL,
    montant_total DECIMAL(10,2) NOT NULL DEFAULT 0,
    frais_livraison DECIMAL(10,2) NOT NULL DEFAULT 500,
    statut ENUM('en_attente','confirmee','en_preparation','attribuee','en_livraison','livree','annulee') NOT NULL DEFAULT 'en_attente',
    mode_paiement ENUM('a_la_livraison','mobile_money') NOT NULL DEFAULT 'a_la_livraison',
    date_commande TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    date_livraison TIMESTAMP NULL DEFAULT NULL,
    FOREIGN KEY (client_id) REFERENCES utilisateurs(id),
    FOREIGN KEY (boutique_id) REFERENCES boutiques(id),
    FOREIGN KEY (livreur_id) REFERENCES utilisateurs(id)
) ENGINE=InnoDB;

CREATE TABLE commande_produits (
    id INT AUTO_INCREMENT PRIMARY KEY,
    commande_id INT NOT NULL,
    produit_id INT NOT NULL,
    quantite INT NOT NULL DEFAULT 1,
    prix_unitaire DECIMAL(10,2) NOT NULL,
    FOREIGN KEY (commande_id) REFERENCES commandes(id) ON DELETE CASCADE,
    FOREIGN KEY (produit_id) REFERENCES produits(id)
) ENGINE=InnoDB;

CREATE TABLE livreurs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    utilisateur_id INT NOT NULL,
    type_vehicule ENUM('moto','velo','voiture','a_pied') NOT NULL DEFAULT 'moto',
    disponible TINYINT(1) NOT NULL DEFAULT 1,
    FOREIGN KEY (utilisateur_id) REFERENCES utilisateurs(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE avis (
    id INT AUTO_INCREMENT PRIMARY KEY,
    client_id INT NOT NULL,
    boutique_id INT NOT NULL,
    note TINYINT NOT NULL,
    commentaire TEXT DEFAULT NULL,
    date_avis TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (client_id) REFERENCES utilisateurs(id),
    FOREIGN KEY (boutique_id) REFERENCES boutiques(id)
) ENGINE=InnoDB;

INSERT INTO utilisateurs (nom, telephone, mot_de_passe, role, statut)
VALUES ('Administrateur IRA', '90000000', '$2y$10$8K1p/a0dURXAM7iIu.qO2eQL4Nq8Xy0Zt6zQzYQ1z6VJZk9Bq5jFa', 'admin', 'actif');