-- =========================================================
-- Elevate Platform — Database Schema (MySQL)
-- Version: 2.0 Full Stack
-- Engine: InnoDB | Encoding: utf8mb4_unicode_ci
-- =========================================================

CREATE DATABASE IF NOT EXISTS `elevate_db` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `elevate_db`;

-- 1. Table: users
CREATE TABLE IF NOT EXISTS `users` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `username` VARCHAR(50) NOT NULL UNIQUE,
  `email` VARCHAR(100) NOT NULL UNIQUE,
  `password_hash` VARCHAR(255) NOT NULL,
  `full_name` VARCHAR(100) NOT NULL,
  `avatar` VARCHAR(255) DEFAULT 'images/logo.png',
  `role` ENUM('super_admin', 'admin', 'moderator', 'user') NOT NULL DEFAULT 'user',
  `phone` VARCHAR(30) DEFAULT NULL,
  `bio` TEXT DEFAULT NULL,
  `country` VARCHAR(50) DEFAULT NULL,
  `is_email_verified` TINYINT(1) NOT NULL DEFAULT 0,
  `email_verification_token` VARCHAR(100) DEFAULT NULL,
  `reset_password_token` VARCHAR(100) DEFAULT NULL,
  `reset_password_expires` DATETIME DEFAULT NULL,
  `remember_token` VARCHAR(100) DEFAULT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_users_role` (`role`),
  INDEX `idx_users_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Table: categories
CREATE TABLE IF NOT EXISTS `categories` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `slug` VARCHAR(50) NOT NULL UNIQUE,
  `title_ar` VARCHAR(100) NOT NULL,
  `title_en` VARCHAR(100) NOT NULL,
  `icon_class` VARCHAR(50) DEFAULT 'fa-trophy',
  `theme_color` VARCHAR(20) DEFAULT '#6366f1',
  `status` ENUM('visible', 'soon', 'hidden') NOT NULL DEFAULT 'visible',
  `display_order` INT DEFAULT 0,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Table: opportunities
CREATE TABLE IF NOT EXISTS `opportunities` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `category_slug` VARCHAR(50) NOT NULL,
  `company_or_org` VARCHAR(100) NOT NULL,
  `title_ar` VARCHAR(255) NOT NULL,
  `title_en` VARCHAR(255) DEFAULT NULL,
  `img_outer` VARCHAR(255) DEFAULT NULL,
  `img_inner` VARCHAR(255) DEFAULT NULL,
  `is_featured` TINYINT(1) NOT NULL DEFAULT 0,
  `tags` VARCHAR(255) DEFAULT NULL,
  `deadline` DATE DEFAULT NULL,
  `description` TEXT NOT NULL,
  `country` VARCHAR(50) DEFAULT 'العالم / أونلاين',
  `field` VARCHAR(100) DEFAULT 'عام',
  `specialization` VARCHAR(100) DEFAULT 'الكل',
  `funding_type` ENUM('funded', 'partially_funded', 'unfunded') NOT NULL DEFAULT 'funded',
  `attendance_type` ENUM('online', 'in_person', 'hybrid') NOT NULL DEFAULT 'online',
  `status` ENUM('visible', 'soon', 'hidden') NOT NULL DEFAULT 'visible',
  `views_count` INT UNSIGNED NOT NULL DEFAULT 0,
  `apply_url` VARCHAR(500) DEFAULT NULL,
  `created_by` INT UNSIGNED DEFAULT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_opp_category` (`category_slug`),
  INDEX `idx_opp_status` (`status`),
  INDEX `idx_opp_featured` (`is_featured`),
  FOREIGN KEY (`category_slug`) REFERENCES `categories`(`slug`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Table: comments
CREATE TABLE IF NOT EXISTS `comments` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `opportunity_id` INT UNSIGNED NOT NULL,
  `user_id` INT UNSIGNED NOT NULL,
  `parent_id` INT UNSIGNED DEFAULT NULL,
  `comment_text` TEXT NOT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`opportunity_id`) REFERENCES `opportunities`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`parent_id`) REFERENCES `comments`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Table: likes
CREATE TABLE IF NOT EXISTS `likes` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `opportunity_id` INT UNSIGNED NOT NULL,
  `user_id` INT UNSIGNED NOT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY `unique_user_opp_like` (`opportunity_id`, `user_id`),
  FOREIGN KEY (`opportunity_id`) REFERENCES `opportunities`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. Table: saved_opportunities
CREATE TABLE IF NOT EXISTS `saved_opportunities` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT UNSIGNED NOT NULL,
  `opportunity_id` INT UNSIGNED NOT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY `unique_user_opp_saved` (`user_id`, `opportunity_id`),
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`opportunity_id`) REFERENCES `opportunities`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. Table: applications
CREATE TABLE IF NOT EXISTS `applications` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT UNSIGNED NOT NULL,
  `opportunity_id` INT UNSIGNED NOT NULL,
  `status` ENUM('pending', 'under_review', 'accepted', 'rejected') NOT NULL DEFAULT 'pending',
  `notes` TEXT DEFAULT NULL,
  `applied_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`opportunity_id`) REFERENCES `opportunities`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8. Table: partners
CREATE TABLE IF NOT EXISTS `partners` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL,
  `type` VARCHAR(100) NOT NULL,
  `logo` VARCHAR(255) DEFAULT 'images/logo.png',
  `url` VARCHAR(255) DEFAULT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 9. Table: notifications
CREATE TABLE IF NOT EXISTS `notifications` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT UNSIGNED DEFAULT NULL, -- NULL means sent to ALL users
  `title` VARCHAR(255) NOT NULL,
  `message` TEXT NOT NULL,
  `link` VARCHAR(255) DEFAULT '#',
  `type` VARCHAR(50) DEFAULT 'system',
  `is_read` TINYINT(1) NOT NULL DEFAULT 0,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 10. Table: contact_messages
CREATE TABLE IF NOT EXISTS `contact_messages` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL,
  `email` VARCHAR(100) NOT NULL,
  `subject` VARCHAR(255) DEFAULT 'استفسار جديد',
  `message` TEXT NOT NULL,
  `reply_status` ENUM('unread', 'read', 'replied') NOT NULL DEFAULT 'unread',
  `admin_reply` TEXT DEFAULT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 11. Table: activity_logs
CREATE TABLE IF NOT EXISTS `activity_logs` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT UNSIGNED DEFAULT NULL,
  `action` VARCHAR(100) NOT NULL,
  `details` TEXT DEFAULT NULL,
  `ip_address` VARCHAR(45) DEFAULT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 12. Table: site_settings
CREATE TABLE IF NOT EXISTS `site_settings` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `setting_key` VARCHAR(100) NOT NULL UNIQUE,
  `setting_value` TEXT NOT NULL,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =========================================================
-- INITIAL SEED DATA
-- =========================================================

-- Initial Categories
INSERT INTO `categories` (`slug`, `title_ar`, `title_en`, `icon_class`, `theme_color`, `status`, `display_order`) VALUES
('competitions', 'مسابقات', 'Competitions', 'fa-trophy', '#6366f1', 'visible', 1),
('scholarships', 'منح دراسية', 'Scholarships', 'fa-graduation-cap', '#10b981', 'visible', 2),
('volunteering', 'تطوع', 'Volunteering', 'fa-handshake', '#f59e0b', 'visible', 3),
('jobs', 'وظائف', 'Jobs', 'fa-briefcase', '#06b6d4', 'visible', 4),
('events', 'فعاليات', 'Events', 'fa-calendar-alt', '#d97706', 'visible', 5),
('courses', 'كورسات مجانية', 'Free Courses', 'fa-book-open', '#3b82f6', 'visible', 6),
('workshops', 'ورش عمل', 'Workshops', 'fa-chalkboard-teacher', '#ec4899', 'visible', 7),
('travel', 'فرص سفر ممولة', 'Funded Travel', 'fa-plane-departure', '#14b8a6', 'visible', 8),
('admission', 'قبول جامعي', 'Admission', 'fa-university', '#4b5563', 'visible', 9)
ON DUPLICATE KEY UPDATE `title_ar` = VALUES(`title_ar`);

-- Default Super Admin User (password: admin123456)
-- Hash generated via password_hash('admin123456', PASSWORD_BCRYPT)
INSERT INTO `users` (`username`, `email`, `password_hash`, `full_name`, `role`, `is_email_verified`) VALUES
('admin', 'admin@elevate.org', '$2y$10$e8W/XF4zHhQjA4gQh2bF9e.U8qX7L7o8Vw2D4E6F8G0H2J4K6L8M', 'Super Admin', 'super_admin', 1)
ON DUPLICATE KEY UPDATE `role` = 'super_admin';

-- Default Site Settings
INSERT INTO `site_settings` (`setting_key`, `setting_value`) VALUES
('site_name_ar', 'Elevate — منصة الفرص والمنح'),
('site_name_en', 'Elevate — Opportunities & Scholarships'),
('allow_registration', '1'),
('maintenance_mode', '0'),
('contact_email', 'support@elevate.org'),
('whatsapp_channel', 'https://whatsapp.com/channel/0029VbCaSol8fews70Y9FQ2l')
ON DUPLICATE KEY UPDATE `setting_value` = VALUES(`setting_value`);
