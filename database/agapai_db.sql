-- agapai_db.sql
CREATE DATABASE agapai_db;
USE agapai_db;


-- LOOKUP TABLE (parent)

CREATE TABLE roles (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    role_name VARCHAR(50) NOT NULL UNIQUE
) COMMENT='Stores user types: Admin and User';

CREATE TABLE location (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    loc_name VARCHAR(100) NOT NULL UNIQUE
);

CREATE TABLE event_type (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    event_type_name VARCHAR(50) NOT NULL UNIQUE
    COMMENT 'parent category: Fall, Inactivity'	
);


-- DEPENDEENT TABLE (child/main)

CREATE TABLE users (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    firstname VARCHAR(100),
    lastname VARCHAR(100),
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role_id BIGINT,
    FOREIGN KEY (role_id) REFERENCES roles(id)
);

CREATE TABLE camera (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    cam_name VARCHAR(100) NOT NULL,
    cam_status BOOLEAN DEFAULT TRUE,
    stream_url VARCHAR(255) COMMENT 'the url for livefeed',
    loc_id BIGINT,
    FOREIGN KEY (loc_id) REFERENCES location(id)
);

CREATE TABLE event_class (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    class_name VARCHAR(100) NOT NULL,
    event_type_id BIGINT NOT NULL,
    FOREIGN KEY (event_type_id) REFERENCES event_type(id)
);



-- CORE TABLE (child/main)

CREATE TABLE event_logs (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    event_status VARCHAR(50) DEFAULT 'unacknowledged',
    file_path VARCHAR(255),

    -- FK
    cam_id BIGINT,
    event_class_id BIGINT,
    ack_by_user_id BIGINT NULL,
    
    -- FK ref
    FOREIGN KEY (cam_id) REFERENCES camera(id),
    FOREIGN KEY (event_class_id) REFERENCES event_class(id),
    FOREIGN KEY (ack_by_user_id) REFERENCES users(id)
);