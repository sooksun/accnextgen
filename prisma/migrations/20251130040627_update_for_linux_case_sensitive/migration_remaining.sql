-- Migration: Complete remaining column renames for transactions and attachments tables
-- This script checks if columns exist before renaming

-- ============================================
-- 4. transactions table (remaining)
-- ============================================
SET FOREIGN_KEY_CHECKS = 0;

-- Drop foreign keys temporarily
SET @fk_exists = (
  SELECT COUNT(*)
  FROM information_schema.TABLE_CONSTRAINTS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'transactions'
    AND CONSTRAINT_NAME = 'transactions_academicYearId_fkey'
);
SET @sql = IF(@fk_exists > 0,
  'ALTER TABLE `transactions` DROP FOREIGN KEY `transactions_academicYearId_fkey`',
  'SELECT "FK already dropped" AS message'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @fk_exists = (
  SELECT COUNT(*)
  FROM information_schema.TABLE_CONSTRAINTS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'transactions'
    AND CONSTRAINT_NAME = 'transactions_categoryId_fkey'
);
SET @sql = IF(@fk_exists > 0,
  'ALTER TABLE `transactions` DROP FOREIGN KEY `transactions_categoryId_fkey`',
  'SELECT "FK already dropped" AS message'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @fk_exists = (
  SELECT COUNT(*)
  FROM information_schema.TABLE_CONSTRAINTS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'transactions'
    AND CONSTRAINT_NAME = 'transactions_memberId_fkey'
);
SET @sql = IF(@fk_exists > 0,
  'ALTER TABLE `transactions` DROP FOREIGN KEY `transactions_memberId_fkey`',
  'SELECT "FK already dropped" AS message'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Rename columns (check if exists first)
SET @col_exists = (
  SELECT COUNT(*)
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'transactions'
    AND COLUMN_NAME = 'txnDate'
);
SET @sql = IF(@col_exists > 0,
  'ALTER TABLE `transactions` CHANGE COLUMN `txnDate` `txn_date` DATETIME(3) NOT NULL',
  'SELECT "Column txnDate already renamed" AS message'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @col_exists = (
  SELECT COUNT(*)
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'transactions'
    AND COLUMN_NAME = 'academicYearId'
);
SET @sql = IF(@col_exists > 0,
  'ALTER TABLE `transactions` CHANGE COLUMN `academicYearId` `academic_year_id` VARCHAR(191) NOT NULL',
  'SELECT "Column academicYearId already renamed" AS message'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @col_exists = (
  SELECT COUNT(*)
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'transactions'
    AND COLUMN_NAME = 'categoryId'
);
SET @sql = IF(@col_exists > 0,
  'ALTER TABLE `transactions` CHANGE COLUMN `categoryId` `category_id` VARCHAR(191) NOT NULL',
  'SELECT "Column categoryId already renamed" AS message'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @col_exists = (
  SELECT COUNT(*)
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'transactions'
    AND COLUMN_NAME = 'memberId'
);
SET @sql = IF(@col_exists > 0,
  'ALTER TABLE `transactions` CHANGE COLUMN `memberId` `member_id` VARCHAR(191) NOT NULL',
  'SELECT "Column memberId already renamed" AS message'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @col_exists = (
  SELECT COUNT(*)
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'transactions'
    AND COLUMN_NAME = 'createdAt'
);
SET @sql = IF(@col_exists > 0,
  'ALTER TABLE `transactions` CHANGE COLUMN `createdAt` `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)',
  'SELECT "Column createdAt already renamed" AS message'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @col_exists = (
  SELECT COUNT(*)
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'transactions'
    AND COLUMN_NAME = 'updatedAt'
);
SET @sql = IF(@col_exists > 0,
  'ALTER TABLE `transactions` CHANGE COLUMN `updatedAt` `updated_at` DATETIME(3) NOT NULL',
  'SELECT "Column updatedAt already renamed" AS message'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Modify description to TEXT if needed
ALTER TABLE `transactions` MODIFY COLUMN `description` TEXT NULL;

-- Update indexes
SET @index_exists = (
  SELECT COUNT(*)
  FROM information_schema.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'transactions'
    AND INDEX_NAME = 'transactions_txnDate_idx'
);
SET @sql = IF(@index_exists > 0,
  'DROP INDEX `transactions_txnDate_idx` ON `transactions`',
  'SELECT "Index already dropped" AS message'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @index_exists = (
  SELECT COUNT(*)
  FROM information_schema.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'transactions'
    AND INDEX_NAME = 'transactions_academicYearId_idx'
);
SET @sql = IF(@index_exists > 0,
  'DROP INDEX `transactions_academicYearId_idx` ON `transactions`',
  'SELECT "Index already dropped" AS message'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @index_exists = (
  SELECT COUNT(*)
  FROM information_schema.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'transactions'
    AND INDEX_NAME = 'transactions_categoryId_idx'
);
SET @sql = IF(@index_exists > 0,
  'DROP INDEX `transactions_categoryId_idx` ON `transactions`',
  'SELECT "Index already dropped" AS message'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @index_exists = (
  SELECT COUNT(*)
  FROM information_schema.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'transactions'
    AND INDEX_NAME = 'transactions_memberId_idx'
);
SET @sql = IF(@index_exists > 0,
  'DROP INDEX `transactions_memberId_idx` ON `transactions`',
  'SELECT "Index already dropped" AS message'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Create new indexes (check if exists first)
SET @index_exists = (
  SELECT COUNT(*)
  FROM information_schema.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'transactions'
    AND INDEX_NAME = 'transactions_txn_date_idx'
);
SET @sql = IF(@index_exists = 0,
  'CREATE INDEX `transactions_txn_date_idx` ON `transactions`(`txn_date`)',
  'SELECT "Index already exists" AS message'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @index_exists = (
  SELECT COUNT(*)
  FROM information_schema.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'transactions'
    AND INDEX_NAME = 'transactions_academic_year_id_idx'
);
SET @sql = IF(@index_exists = 0,
  'CREATE INDEX `transactions_academic_year_id_idx` ON `transactions`(`academic_year_id`)',
  'SELECT "Index already exists" AS message'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @index_exists = (
  SELECT COUNT(*)
  FROM information_schema.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'transactions'
    AND INDEX_NAME = 'transactions_category_id_idx'
);
SET @sql = IF(@index_exists = 0,
  'CREATE INDEX `transactions_category_id_idx` ON `transactions`(`category_id`)',
  'SELECT "Index already exists" AS message'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @index_exists = (
  SELECT COUNT(*)
  FROM information_schema.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'transactions'
    AND INDEX_NAME = 'transactions_member_id_idx'
);
SET @sql = IF(@index_exists = 0,
  'CREATE INDEX `transactions_member_id_idx` ON `transactions`(`member_id`)',
  'SELECT "Index already exists" AS message'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Recreate foreign keys (check if exists first)
SET @fk_exists = (
  SELECT COUNT(*)
  FROM information_schema.TABLE_CONSTRAINTS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'transactions'
    AND CONSTRAINT_NAME = 'transactions_academic_year_id_fkey'
);
SET @sql = IF(@fk_exists = 0,
  'ALTER TABLE `transactions` ADD CONSTRAINT `transactions_academic_year_id_fkey` FOREIGN KEY (`academic_year_id`) REFERENCES `academic_years`(`id`) ON DELETE CASCADE ON UPDATE CASCADE',
  'SELECT "FK already exists" AS message'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @fk_exists = (
  SELECT COUNT(*)
  FROM information_schema.TABLE_CONSTRAINTS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'transactions'
    AND CONSTRAINT_NAME = 'transactions_category_id_fkey'
);
SET @sql = IF(@fk_exists = 0,
  'ALTER TABLE `transactions` ADD CONSTRAINT `transactions_category_id_fkey` FOREIGN KEY (`category_id`) REFERENCES `transaction_categories`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE',
  'SELECT "FK already exists" AS message'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @fk_exists = (
  SELECT COUNT(*)
  FROM information_schema.TABLE_CONSTRAINTS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'transactions'
    AND CONSTRAINT_NAME = 'transactions_member_id_fkey'
);
SET @sql = IF(@fk_exists = 0,
  'ALTER TABLE `transactions` ADD CONSTRAINT `transactions_member_id_fkey` FOREIGN KEY (`member_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE',
  'SELECT "FK already exists" AS message'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET FOREIGN_KEY_CHECKS = 1;

-- ============================================
-- 5. attachments table
-- ============================================
SET FOREIGN_KEY_CHECKS = 0;

-- Drop foreign keys temporarily
SET @fk_exists = (
  SELECT COUNT(*)
  FROM information_schema.TABLE_CONSTRAINTS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'attachments'
    AND CONSTRAINT_NAME = 'attachments_transactionId_fkey'
);
SET @sql = IF(@fk_exists > 0,
  'ALTER TABLE `attachments` DROP FOREIGN KEY `attachments_transactionId_fkey`',
  'SELECT "FK already dropped" AS message'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @fk_exists = (
  SELECT COUNT(*)
  FROM information_schema.TABLE_CONSTRAINTS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'attachments'
    AND CONSTRAINT_NAME = 'attachments_uploadedBy_fkey'
);
SET @sql = IF(@fk_exists > 0,
  'ALTER TABLE `attachments` DROP FOREIGN KEY `attachments_uploadedBy_fkey`',
  'SELECT "FK already dropped" AS message'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Rename fileHash if exists
SET @col_exists = (
  SELECT COUNT(*)
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'attachments'
    AND COLUMN_NAME = 'fileHash'
);
SET @sql = IF(@col_exists > 0,
  'ALTER TABLE `attachments` CHANGE COLUMN `fileHash` `file_hash` VARCHAR(32) NULL',
  'SELECT "Column fileHash already renamed" AS message'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Rename other columns
SET @col_exists = (
  SELECT COUNT(*)
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'attachments'
    AND COLUMN_NAME = 'fileName'
);
SET @sql = IF(@col_exists > 0,
  'ALTER TABLE `attachments` CHANGE COLUMN `fileName` `file_name` VARCHAR(191) NOT NULL',
  'SELECT "Column fileName already renamed" AS message'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @col_exists = (
  SELECT COUNT(*)
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'attachments'
    AND COLUMN_NAME = 'filePath'
);
SET @sql = IF(@col_exists > 0,
  'ALTER TABLE `attachments` CHANGE COLUMN `filePath` `file_path` VARCHAR(191) NOT NULL',
  'SELECT "Column filePath already renamed" AS message'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @col_exists = (
  SELECT COUNT(*)
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'attachments'
    AND COLUMN_NAME = 'mimeType'
);
SET @sql = IF(@col_exists > 0,
  'ALTER TABLE `attachments` CHANGE COLUMN `mimeType` `mime_type` VARCHAR(191) NOT NULL',
  'SELECT "Column mimeType already renamed" AS message'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @col_exists = (
  SELECT COUNT(*)
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'attachments'
    AND COLUMN_NAME = 'fileSize'
);
SET @sql = IF(@col_exists > 0,
  'ALTER TABLE `attachments` CHANGE COLUMN `fileSize` `file_size` INTEGER NOT NULL',
  'SELECT "Column fileSize already renamed" AS message'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @col_exists = (
  SELECT COUNT(*)
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'attachments'
    AND COLUMN_NAME = 'transactionId'
);
SET @sql = IF(@col_exists > 0,
  'ALTER TABLE `attachments` CHANGE COLUMN `transactionId` `transaction_id` VARCHAR(191) NOT NULL',
  'SELECT "Column transactionId already renamed" AS message'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @col_exists = (
  SELECT COUNT(*)
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'attachments'
    AND COLUMN_NAME = 'uploadedBy'
);
SET @sql = IF(@col_exists > 0,
  'ALTER TABLE `attachments` CHANGE COLUMN `uploadedBy` `uploaded_by` VARCHAR(191) NOT NULL',
  'SELECT "Column uploadedBy already renamed" AS message'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @col_exists = (
  SELECT COUNT(*)
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'attachments'
    AND COLUMN_NAME = 'uploadedAt'
);
SET @sql = IF(@col_exists > 0,
  'ALTER TABLE `attachments` CHANGE COLUMN `uploadedAt` `uploaded_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)',
  'SELECT "Column uploadedAt already renamed" AS message'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Modify column types
ALTER TABLE `attachments`
  MODIFY COLUMN `file_name` VARCHAR(255) NOT NULL,
  MODIFY COLUMN `file_path` VARCHAR(500) NOT NULL,
  MODIFY COLUMN `mime_type` VARCHAR(100) NOT NULL;

-- Update indexes
SET @index_exists = (
  SELECT COUNT(*)
  FROM information_schema.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'attachments'
    AND INDEX_NAME = 'attachments_transactionId_idx'
);
SET @sql = IF(@index_exists > 0,
  'DROP INDEX `attachments_transactionId_idx` ON `attachments`',
  'SELECT "Index already dropped" AS message'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @index_exists = (
  SELECT COUNT(*)
  FROM information_schema.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'attachments'
    AND INDEX_NAME = 'attachments_fileHash_idx'
);
SET @sql = IF(@index_exists > 0,
  'DROP INDEX `attachments_fileHash_idx` ON `attachments`',
  'SELECT "Index already dropped" AS message'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @index_exists = (
  SELECT COUNT(*)
  FROM information_schema.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'attachments'
    AND INDEX_NAME = 'attachments_fileHash_key'
);
SET @sql = IF(@index_exists > 0,
  'DROP INDEX `attachments_fileHash_key` ON `attachments`',
  'SELECT "Index already dropped" AS message'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Create new indexes (check if exists first)
SET @index_exists = (
  SELECT COUNT(*)
  FROM information_schema.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'attachments'
    AND INDEX_NAME = 'attachments_transaction_id_idx'
);
SET @sql = IF(@index_exists = 0,
  'CREATE INDEX `attachments_transaction_id_idx` ON `attachments`(`transaction_id`)',
  'SELECT "Index already exists" AS message'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @index_exists = (
  SELECT COUNT(*)
  FROM information_schema.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'attachments'
    AND INDEX_NAME = 'attachments_file_hash_idx'
);
SET @sql = IF(@index_exists = 0,
  'CREATE INDEX `attachments_file_hash_idx` ON `attachments`(`file_hash`)',
  'SELECT "Index already exists" AS message'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @index_exists = (
  SELECT COUNT(*)
  FROM information_schema.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'attachments'
    AND INDEX_NAME = 'attachments_file_hash_key'
);
SET @sql = IF(@index_exists = 0,
  'CREATE UNIQUE INDEX `attachments_file_hash_key` ON `attachments`(`file_hash`)',
  'SELECT "Index already exists" AS message'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Recreate foreign keys (check if exists first)
SET @fk_exists = (
  SELECT COUNT(*)
  FROM information_schema.TABLE_CONSTRAINTS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'attachments'
    AND CONSTRAINT_NAME = 'attachments_transaction_id_fkey'
);
SET @sql = IF(@fk_exists = 0,
  'ALTER TABLE `attachments` ADD CONSTRAINT `attachments_transaction_id_fkey` FOREIGN KEY (`transaction_id`) REFERENCES `transactions`(`id`) ON DELETE CASCADE ON UPDATE CASCADE',
  'SELECT "FK already exists" AS message'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @fk_exists = (
  SELECT COUNT(*)
  FROM information_schema.TABLE_CONSTRAINTS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'attachments'
    AND CONSTRAINT_NAME = 'attachments_uploaded_by_fkey'
);
SET @sql = IF(@fk_exists = 0,
  'ALTER TABLE `attachments` ADD CONSTRAINT `attachments_uploaded_by_fkey` FOREIGN KEY (`uploaded_by`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE',
  'SELECT "FK already exists" AS message'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET FOREIGN_KEY_CHECKS = 1;

