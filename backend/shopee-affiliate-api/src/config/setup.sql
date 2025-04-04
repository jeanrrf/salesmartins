-- Criação de tabelas para o projeto shopee_analytics

-- Tabela de usuários
CREATE TABLE IF NOT EXISTS `users` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `username` VARCHAR(255) NOT NULL UNIQUE,
  `email` VARCHAR(255) NOT NULL UNIQUE,
  `password` VARCHAR(255) NOT NULL,
  `role` ENUM('admin', 'user') DEFAULT 'user',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Tabela de categorias (precisa ser criada antes de products)
CREATE TABLE IF NOT EXISTS `categories` (
  `id` VARCHAR(100) PRIMARY KEY,
  `name` VARCHAR(255) NOT NULL,
  `parent_id` VARCHAR(100),
  `level` INT DEFAULT 1,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_parent` (`parent_id`)
);

-- Tabela de produtos
CREATE TABLE IF NOT EXISTS `products` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `item_id` VARCHAR(255) NOT NULL UNIQUE,
  `name` VARCHAR(255) NOT NULL,
  `price` DECIMAL(10, 2) DEFAULT 0.00,
  `original_price` DECIMAL(10, 2) DEFAULT 0.00,
  `image_url` TEXT,
  `category_id` VARCHAR(100),
  `category_name` VARCHAR(255),
  `commission_rate` DECIMAL(5, 4) DEFAULT 0.00,
  `rating_star` DECIMAL(3, 1) DEFAULT 0.0,
  `sales` INT DEFAULT 0,
  `shop_id` VARCHAR(100),
  `shop_name` VARCHAR(255),
  `created_by` INT,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_category` (`category_id`),
  INDEX `idx_shop` (`shop_id`),
  FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE SET NULL
);

-- Tabela de links de afiliados
CREATE TABLE IF NOT EXISTS `affiliate_links` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL,
  `original_url` TEXT NOT NULL,
  `affiliate_url` TEXT NOT NULL,
  `name` VARCHAR(255),
  `product_details` TEXT,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
);

-- Tabela de estatísticas
CREATE TABLE IF NOT EXISTS `stats` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `link_id` INT NOT NULL,
  `clicks` INT DEFAULT 0,
  `conversions` INT DEFAULT 0,
  `revenue` DECIMAL(10, 2) DEFAULT 0.00,
  `date` DATE NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`link_id`) REFERENCES `affiliate_links`(`id`) ON DELETE CASCADE,
  UNIQUE KEY `link_date_unique` (`link_id`, `date`)
);

-- Tabela de logs de reparo de categorias (sem chaves estrangeiras por enquanto)
CREATE TABLE IF NOT EXISTS `category_repair_logs` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `product_id` INT NOT NULL,
  `old_category_id` VARCHAR(100),
  `new_category_id` VARCHAR(100) NOT NULL,
  `repaired_by` INT NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de tags
CREATE TABLE IF NOT EXISTS `tags` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `tag_name` VARCHAR(100) NOT NULL UNIQUE,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Tabela de relação entre produtos e tags
CREATE TABLE IF NOT EXISTS `product_tags` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `product_id` INT NOT NULL,
  `tag_id` INT NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`tag_id`) REFERENCES `tags`(`id`) ON DELETE CASCADE,
  UNIQUE KEY `product_tag_unique` (`product_id`, `tag_id`)
);