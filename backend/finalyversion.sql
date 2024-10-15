CREATE DATABASE IF NOT EXISTS `goalcast` 
  DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;

USE `goalcast`;

SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT;
SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS;
SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION;
SET NAMES utf8mb4;
SET @OLD_TIME_ZONE=@@TIME_ZONE;
SET TIME_ZONE='+00:00';
SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0;
SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0;
SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO';
SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0;

DROP TABLE IF EXISTS `arbitros_partidas`;
CREATE TABLE `arbitros_partidas` (
  `arbitro_id` int NOT NULL,
  `partida_id` int NOT NULL,
  PRIMARY KEY (`arbitro_id`,`partida_id`),
  KEY `partida_id` (`partida_id`),
  CONSTRAINT `arbitros_partidas_ibfk_1` FOREIGN KEY (`arbitro_id`) REFERENCES `usuarios` (`id`),
  CONSTRAINT `arbitros_partidas_ibfk_2` FOREIGN KEY (`partida_id`) REFERENCES `partidas` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

DROP TABLE IF EXISTS `avaliacoes_quadras`;
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

DROP TABLE IF EXISTS `jogador`;
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

DROP TABLE IF EXISTS `partidas`;
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

DROP TABLE IF EXISTS `partidas_jogadores`;
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

DROP TABLE IF EXISTS `quadras`;
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

DROP TABLE IF EXISTS `usuarios`;
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

DROP TABLE IF EXISTS `videos`;
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
)
