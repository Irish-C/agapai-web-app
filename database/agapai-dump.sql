-- MySQL dump 10.13  Distrib 8.0.44, for Win64 (x86_64)
--
-- Host: localhost    Database: agapai_db
-- ------------------------------------------------------
-- Server version	8.0.44

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `camera`
--

DROP TABLE IF EXISTS `camera`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `camera` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `cam_name` varchar(100) NOT NULL,
  `cam_status` tinyint(1) DEFAULT '1',
  `stream_url` varchar(255) NOT NULL,
  `loc_id` bigint NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_camera_loc_id` (`loc_id`),
  KEY `idx_camera_loc` (`loc_id`),
  CONSTRAINT `camera_ibfk_1` FOREIGN KEY (`loc_id`) REFERENCES `location` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=15 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `camera`
--

LOCK TABLES `camera` WRITE;
/*!40000 ALTER TABLE `camera` DISABLE KEYS */;
INSERT INTO `camera` VALUES (1,'Cam 01',1,'https://agapai.local/streams/cam_01',1),(2,'Cam 02',1,'https://agapai.local/streams/cam_02',8);
/*!40000 ALTER TABLE `camera` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `event_class`
--

DROP TABLE IF EXISTS `event_class`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `event_class` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `class_name` varchar(100) NOT NULL,
  `event_type_id` bigint NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_event_class_type_id` (`event_type_id`),
  KEY `idx_class_type` (`event_type_id`),
  CONSTRAINT `event_class_ibfk_1` FOREIGN KEY (`event_type_id`) REFERENCES `event_type` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `event_class`
--

LOCK TABLES `event_class` WRITE;
/*!40000 ALTER TABLE `event_class` DISABLE KEYS */;
INSERT INTO `event_class` VALUES (1,'Backward Fall',1),(2,'Forward Fall',1),(3,'Lying Down',2),(4,'Sideward Fall',1),(5,'Backward',1);
/*!40000 ALTER TABLE `event_class` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `event_logs`
--

DROP TABLE IF EXISTS `event_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `event_logs` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `timestamp` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `event_status` varchar(20) DEFAULT 'unacknowledged',
  `file_path` varchar(255) DEFAULT NULL,
  `cam_id` bigint DEFAULT NULL,
  `event_class_id` bigint DEFAULT NULL,
  `ack_by_user_id` bigint DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_event_logs_cam_id` (`cam_id`),
  KEY `idx_log_cam` (`cam_id`),
  KEY `idx_log_class` (`event_class_id`),
  KEY `idx_log_ack_user` (`ack_by_user_id`),
  KEY `idx_log_timestamp` (`timestamp` DESC),
  CONSTRAINT `event_logs_ibfk_1` FOREIGN KEY (`cam_id`) REFERENCES `camera` (`id`),
  CONSTRAINT `event_logs_ibfk_2` FOREIGN KEY (`event_class_id`) REFERENCES `event_class` (`id`),
  CONSTRAINT `event_logs_ibfk_3` FOREIGN KEY (`ack_by_user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=86 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `event_logs`
--

LOCK TABLES `event_logs` WRITE;
/*!40000 ALTER TABLE `event_logs` DISABLE KEYS */;
INSERT INTO `event_logs` VALUES (74,'2025-11-10 15:59:59','unacknowledged','/storage/events/2025-11-11/cam_02_inactivity_12345678.910.jpg',1,3,NULL),(75,'2025-11-10 15:59:59','unacknowledged','/storage/events/2025-11-10/cam_02_inactivity_1112131415.jpg',1,4,NULL),(76,'2025-11-10 16:10:22','unacknowledged','/storage/events/2025-11-11/cam_01_fall_001.mp4',1,1,NULL),(77,'2025-11-10 16:45:33','acknowledged','/storage/events/2025-11-11/cam_03_fall_002.mp4',NULL,1,2),(78,'2025-11-10 17:12:47','unacknowledged','/storage/events/2025-11-11/cam_02_inactivity_003.jpg',1,3,NULL),(79,'2025-11-10 17:34:59','acknowledged','/storage/events/2025-11-11/cam_01_sidefall_004.mp4',1,2,1),(80,'2025-11-10 18:15:10','unacknowledged','/storage/events/2025-11-11/cam_04_inactivity_005.jpg',NULL,3,NULL),(81,'2025-11-10 19:02:00','acknowledged','/storage/events/2025-11-11/cam_03_fall_006.mp4',NULL,1,2),(82,'2025-11-10 19:40:27','unacknowledged','/storage/events/2025-11-11/cam_05_inactivity_007.jpg',NULL,4,NULL),(83,'2025-11-10 20:05:44','acknowledged','/storage/events/2025-11-11/cam_01_forwardfall_008.mp4',1,2,2),(84,'2025-11-10 20:56:12','unacknowledged','/storage/events/2025-11-11/cam_02_inactivity_009.jpg',2,3,NULL),(85,'2025-11-10 21:21:33','acknowledged','/storage/events/2025-11-11/cam_04_fall_010.mp4',NULL,1,1);
/*!40000 ALTER TABLE `event_logs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `event_type`
--

DROP TABLE IF EXISTS `event_type`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `event_type` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `event_type_name` varchar(50) NOT NULL COMMENT 'parent category: Fall, Inactivity',
  PRIMARY KEY (`id`),
  UNIQUE KEY `event_type_name` (`event_type_name`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `event_type`
--

LOCK TABLES `event_type` WRITE;
/*!40000 ALTER TABLE `event_type` DISABLE KEYS */;
INSERT INTO `event_type` VALUES (1,'Fall'),(2,'Inactivity');
/*!40000 ALTER TABLE `event_type` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `location`
--

DROP TABLE IF EXISTS `location`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `location` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `loc_name` varchar(100) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `loc_name` (`loc_name`)
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `location`
--

LOCK TABLES `location` WRITE;
/*!40000 ALTER TABLE `location` DISABLE KEYS */;
INSERT INTO `location` VALUES (7,'Chapel'),(2,'Charbel'),(3,'Emmanuel'),(6,'Gabriel'),(8,'Hallway'),(4,'Lima'),(1,'Sebastian');
/*!40000 ALTER TABLE `location` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `roles`
--

DROP TABLE IF EXISTS `roles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `roles` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `role_name` varchar(50) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `role_name` (`role_name`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='Stores user types: Admin and User';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `roles`
--

LOCK TABLES `roles` WRITE;
/*!40000 ALTER TABLE `roles` DISABLE KEYS */;
INSERT INTO `roles` VALUES (1,'Admin'),(2,'User');
/*!40000 ALTER TABLE `roles` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `firstname` varchar(100) NOT NULL,
  `lastname` varchar(100) NOT NULL,
  `username` varchar(50) NOT NULL,
  `password` varchar(255) NOT NULL,
  `role_id` bigint DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`),
  KEY `idx_users_role_id` (`role_id`),
  KEY `idx_user_role` (`role_id`),
  CONSTRAINT `users_ibfk_1` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,'Cess','Mulan','cessmulan','$2b$12$dL4yk2hnNy72E7M43OhojuJC0M9AgeP3w5Uq/f1DU3HP50kRCI7pO',1),(2,'Lady','Elsa','ladyelsa','$2b$12$RV54i/FKlbblY51df1N9N.AXlVQb3lljg1BqlvEMFxsDgjlLgYY/u',2),(3,' Jane','Doe','janedoe','$2b$12$msgJoRtDr7rJoYwcLRJ5Ie81P2F8AOtVsnNcoJIEKcqV2qhKo3466',2);
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-11-24  3:03:40
