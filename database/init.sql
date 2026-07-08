-- Supprimer les tables si elles existent
DROP TABLE IF EXISTS booking_seats;
DROP TABLE IF EXISTS bookings;
DROP TABLE IF EXISTS seats;
DROP TABLE IF EXISTS trips;
DROP TABLE IF EXISTS vehicles;
DROP TABLE IF EXISTS users;

-- Création des tables
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nom VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    telephone VARCHAR(20),
    role ENUM('client', 'admin') DEFAULT 'client',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE vehicles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    type VARCHAR(50) NOT NULL,
    modele VARCHAR(100) NOT NULL,
    capacite INT NOT NULL,
    immatriculation VARCHAR(50) UNIQUE NOT NULL,
    statut ENUM('actif', 'maintenance', 'inactif') DEFAULT 'actif',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE trips (
    id INT AUTO_INCREMENT PRIMARY KEY,
    depart VARCHAR(100) NOT NULL,
    destination VARCHAR(100) NOT NULL,
    date_depart DATETIME NOT NULL,
    date_arrivee DATETIME NOT NULL,
    prix DECIMAL(10, 2) NOT NULL,
    vehicule_id INT,
    places_disponibles INT NOT NULL,
    statut ENUM('programme', 'en_cours', 'termine', 'annule') DEFAULT 'programme',
    FOREIGN KEY (vehicule_id) REFERENCES vehicles(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE bookings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    trip_id INT NOT NULL,
    nb_passagers INT NOT NULL DEFAULT 1,
    prix_total DECIMAL(10, 2) NOT NULL,
    statut ENUM('en_attente', 'confirme', 'annule', 'termine') DEFAULT 'en_attente',
    date_reservation TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (trip_id) REFERENCES trips(id)
);

CREATE TABLE seats (
    id INT AUTO_INCREMENT PRIMARY KEY,
    trip_id INT NOT NULL,
    numero_siege VARCHAR(10) NOT NULL,
    statut ENUM('disponible', 'reserve', 'bloque') DEFAULT 'disponible',
    FOREIGN KEY (trip_id) REFERENCES trips(id),
    UNIQUE KEY unique_siege_trip (trip_id, numero_siege)
);

CREATE TABLE booking_seats (
    id INT AUTO_INCREMENT PRIMARY KEY,
    booking_id INT NOT NULL,
    seat_number VARCHAR(10) NOT NULL,
    FOREIGN KEY (booking_id) REFERENCES bookings(id)
);

-- Insertion des données de test
-- Admin (mot de passe: admin123)
INSERT INTO users (nom, email, password, role) VALUES
('Admin', 'admin@travel.com', '$2b$10$XKoJgAJmBXKkVqJfVLqJzuR3JH.YmTPkFgJKCPRQZEDFBgZqMmLzS', 'admin'),
('Jean Dupont', 'jean@email.com', '$2b$10$XKoJgAJmBXKkVqJfVLqJzuR3JH.YmTPkFgJKCPRQZEDFBgZqMmLzS', 'client');

INSERT INTO vehicles (type, modele, capacite, immatriculation) VALUES
('Bus', 'Mercedes Tourismo', 50, 'AB-123-CD'),
('Bus', 'Volvo 9700', 45, 'EF-456-GH'),
('Minibus', 'Mercedes Sprinter', 20, 'IJ-789-KL');

INSERT INTO trips (depart, destination, date_depart, date_arrivee, prix, vehicule_id, places_disponibles) VALUES
('Paris', 'Lyon', '2024-12-20 08:00:00', '2024-12-20 14:00:00', 35.00, 1, 50),
('Marseille', 'Nice', '2024-12-21 09:00:00', '2024-12-21 12:00:00', 25.00, 2, 45),
('Lyon', 'Paris', '2024-12-22 10:00:00', '2024-12-22 16:00:00', 40.00, 3, 20);

-- Générer des sièges pour chaque trajet
DELIMITER $$
CREATE PROCEDURE generate_seats()
BEGIN
    DECLARE trip_id INT;
    DECLARE vehicle_capacity INT;
    DECLARE i INT;
    DECLARE done INT DEFAULT FALSE;
    DECLARE cur CURSOR FOR 
        SELECT t.id, v.capacite 
        FROM trips t 
        JOIN vehicles v ON t.vehicule_id = v.id;
    DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;
    
    OPEN cur;
    
    read_loop: LOOP
        FETCH cur INTO trip_id, vehicle_capacity;
        IF done THEN
            LEAVE read_loop;
        END IF;
        
        SET i = 1;
        WHILE i <= vehicle_capacity DO
            INSERT INTO seats (trip_id, numero_siege, statut) 
            VALUES (trip_id, CONCAT('A', i), 'disponible');
            SET i = i + 1;
        END WHILE;
    END LOOP;
    
    CLOSE cur;
END$$
DELIMITER ;

CALL generate_seats();
DROP PROCEDURE generate_seats;