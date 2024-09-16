CREATE DATABASE  IF NOT EXISTS `goalcast` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci */ /*!80016 DEFAULT ENCRYPTION='N' */;
USE `goalcast`;
-- MySQL dump 10.13  Distrib 8.0.36, for Win64 (x86_64)
--
-- Host: localhost    Database: goalcast
-- ------------------------------------------------------
-- Server version	8.0.37

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `arbitros_partidas`
--

DROP TABLE IF EXISTS `arbitros_partidas`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `arbitros_partidas` (
  `arbitro_id` int NOT NULL,
  `partida_id` int NOT NULL,
  PRIMARY KEY (`arbitro_id`,`partida_id`),
  KEY `partida_id` (`partida_id`),
  CONSTRAINT `arbitros_partidas_ibfk_1` FOREIGN KEY (`arbitro_id`) REFERENCES `usuarios` (`id`),
  CONSTRAINT `arbitros_partidas_ibfk_2` FOREIGN KEY (`partida_id`) REFERENCES `partidas` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `avaliacoes_quadras`
--

DROP TABLE IF EXISTS `avaliacoes_quadras`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `avaliacoes_quadras` (
  `id` int NOT NULL AUTO_INCREMENT,
  `quadra_id` varchar(45) DEFAULT NULL,
  `jogador_id` int DEFAULT NULL,
  `nota` int DEFAULT NULL,
  `comentario` text,
  PRIMARY KEY (`id`),
  KEY `quadra_id` (`quadra_id`),
  KEY `jogador_id` (`jogador_id`),
  CONSTRAINT `avaliacoes_quadras_ibfk_1` FOREIGN KEY (`quadra_id`) REFERENCES `quadras` (`id`),
  CONSTRAINT `avaliacoes_quadras_ibfk_2` FOREIGN KEY (`jogador_id`) REFERENCES `usuarios` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `jogador`
--

DROP TABLE IF EXISTS `jogador`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `jogador` (
  `idjogador` int NOT NULL AUTO_INCREMENT,
  `user` varchar(45) NOT NULL,
  `Nascimento` date DEFAULT NULL,
  `Bio` varchar(255) DEFAULT NULL,
  `nCamiseta` int DEFAULT NULL,
  `posicao` varchar(45) DEFAULT NULL,
  `altura` float DEFAULT NULL,
  `peso` float DEFAULT NULL,
  `peDominante` varchar(45) DEFAULT NULL,
  PRIMARY KEY (`idjogador`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `partidas`
--

DROP TABLE IF EXISTS `partidas`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `partidas` (
  `id` int NOT NULL AUTO_INCREMENT,
  `organizador_id` int DEFAULT NULL,
  `quadra_id` varchar(45) DEFAULT NULL,
  `dh_inicio` datetime DEFAULT NULL,
  `dh_fim` datetime DEFAULT NULL,
  `tipo_jogo` varchar(255) DEFAULT NULL,
  `nivel_habilidade` varchar(255) DEFAULT NULL,
  `numero_jogadores` int DEFAULT NULL,
  `valor_partida` decimal(10,2) DEFAULT NULL,
  `status` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `organizador_id` (`organizador_id`),
  KEY `quadra_id` (`quadra_id`),
  CONSTRAINT `partidas_ibfk_1` FOREIGN KEY (`organizador_id`) REFERENCES `usuarios` (`id`),
  CONSTRAINT `partidas_ibfk_2` FOREIGN KEY (`quadra_id`) REFERENCES `quadras` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `partidas_jogadores`
--

DROP TABLE IF EXISTS `partidas_jogadores`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `partidas_jogadores` (
  `partida_id` int NOT NULL,
  `jogador_id` int NOT NULL,
  `confirmacao` varchar(255) DEFAULT NULL,
  `pagamento` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`partida_id`,`jogador_id`),
  KEY `jogador_id` (`jogador_id`),
  CONSTRAINT `partidas_jogadores_ibfk_1` FOREIGN KEY (`partida_id`) REFERENCES `partidas` (`id`),
  CONSTRAINT `partidas_jogadores_ibfk_2` FOREIGN KEY (`jogador_id`) REFERENCES `usuarios` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `quadras`
--

DROP TABLE IF EXISTS `quadras`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `quadras` (
  `id_sequencial` int NOT NULL AUTO_INCREMENT,
  `id` varchar(255) NOT NULL,
  `nome` varchar(255) DEFAULT NULL,
  `endereco` varchar(255) DEFAULT NULL,
  `tipo` varchar(255) DEFAULT NULL,
  `imagens` json DEFAULT NULL,
  `descricao` text,
  `preco_hora` decimal(10,2) DEFAULT NULL,
  `disponibilidade` json DEFAULT NULL,
  `avaliacao_media` decimal(3,2) DEFAULT NULL,
  PRIMARY KEY (`id_sequencial`),
  UNIQUE KEY `id` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `usuarios`
--

DROP TABLE IF EXISTS `usuarios`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `usuarios` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nome` varchar(255) DEFAULT NULL,
  `email` varchar(255) DEFAULT NULL,
  `senha` varchar(255) DEFAULT NULL,
  `tipo_usuario` varchar(255) DEFAULT NULL,
  `foto_perfil` varchar(255) DEFAULT NULL,
  `data_criacao` datetime DEFAULT NULL,
  `ultimo_login` datetime DEFAULT NULL,
  `apelido` varchar(20) DEFAULT NULL,
  `numero_jogador` int DEFAULT NULL,
  `celular` varchar(15) DEFAULT NULL,
  `verificado` tinyint(1) DEFAULT '0',
  `verification_token` varchar(128) DEFAULT NULL,
  `salt` varchar(128) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=60 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `videos`
--

DROP TABLE IF EXISTS `videos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `videos` (
  `id` int NOT NULL AUTO_INCREMENT,
  `partida_id` int DEFAULT NULL,
  `quadra_id` varchar(45) DEFAULT NULL,
  `url` varchar(255) DEFAULT NULL,
  `tipo` varchar(255) DEFAULT NULL,
  `data_criacao` datetime DEFAULT CURRENT_TIMESTAMP,
  `criador_id` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `partida_id` (`partida_id`),
  KEY `videos_ibfk_1` (`quadra_id`),
  KEY `criador_id` (`criador_id`),
  CONSTRAINT `videos_ibfk_1` FOREIGN KEY (`quadra_id`) REFERENCES `quadras` (`id`),
  CONSTRAINT `videos_ibfk_2` FOREIGN KEY (`criador_id`) REFERENCES `usuarios` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=44 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2024-09-16 14:38:31
