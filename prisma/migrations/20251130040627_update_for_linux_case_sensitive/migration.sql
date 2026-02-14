-- Migration: Rename columns from camelCase to snake_case for Linux compatibility
-- This migration renames all columns to snake_case while preserving data
-- Using ALGORITHM=INPLACE for foreign key column renames

-- ============================================
-- 1. users table
-- ============================================
ALTER TABLE `users` 
  CHANGE COLUMN `createdAt` `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  CHANGE COLUMN `updatedAt` `updated_at` DATETIME(3) NOT NULL,
  ALGORITHM=INPLACE;

-- ============================================
-- 2. academic_years table
-- ============================================
ALTER TABLE `academic_years`
  CHANGE COLUMN `startDate` `start_date` DATETIME(3) NOT NULL,
  CHANGE COLUMN `endDate` `end_date` DATETIME(3) NOT NULL,
  CHANGE COLUMN `isActive` `is_active` BOOLEAN NOT NULL DEFAULT true,
  CHANGE COLUMN `createdAt` `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  CHANGE COLUMN `updatedAt` `updated_at` DATETIME(3) NOT NULL,
  ALGORITHM=INPLACE;

-- ============================================
-- 3. transaction_categories table
-- ============================================
ALTER TABLE `transaction_categories`
  MODIFY COLUMN `description` TEXT NULL,
  CHANGE COLUMN `createdAt` `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  CHANGE COLUMN `updatedAt` `updated_at` DATETIME(3) NOT NULL,
  ALGORITHM=INPLACE;

-- ============================================
-- 4. transactions table
-- ============================================
-- Note: Must drop foreign keys first, then rename, then recreate
-- This is required for MySQL to allow column renames on FK columns
SET FOREIGN_KEY_CHECKS = 0;

-- Drop foreign keys temporarily
ALTER TABLE `transactions` DROP FOREIGN KEY IF EXISTS `transactions_academicYearId_fkey`;
ALTER TABLE `transactions` DROP FOREIGN KEY IF EXISTS `transactions_categoryId_fkey`;
ALTER TABLE `transactions` DROP FOREIGN KEY IF EXISTS `transactions_memberId_fkey`;

-- Rename columns
ALTER TABLE `transactions`
  MODIFY COLUMN `description` TEXT NULL,
  CHANGE COLUMN `txnDate` `txn_date` DATETIME(3) NOT NULL,
  CHANGE COLUMN `academicYearId` `academic_year_id` VARCHAR(191) NOT NULL,
  CHANGE COLUMN `categoryId` `category_id` VARCHAR(191) NOT NULL,
  CHANGE COLUMN `memberId` `member_id` VARCHAR(191) NOT NULL,
  CHANGE COLUMN `createdAt` `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  CHANGE COLUMN `updatedAt` `updated_at` DATETIME(3) NOT NULL,
  ALGORITHM=INPLACE;

-- Update indexes to use new column names
-- Note: These DROP statements may fail if indexes don't exist, but that's ok
-- We'll catch errors and continue
SET @index_exists = (
  SELECT COUNT(*)
  FROM information_schema.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'transactions'
    AND INDEX_NAME = 'transactions_txnDate_idx'
);
SET @sql = IF(@index_exists > 0,
  'DROP INDEX `transactions_txnDate_idx` ON `transactions`',
  'SELECT "Index transactions_txnDate_idx does not exist" AS message'
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
  'SELECT "Index transactions_academicYearId_idx does not exist" AS message'
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
  'SELECT "Index transactions_categoryId_idx does not exist" AS message'
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
  'SELECT "Index transactions_memberId_idx does not exist" AS message'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

CREATE INDEX `transactions_txn_date_idx` ON `transactions`(`txn_date`);
CREATE INDEX `transactions_academic_year_id_idx` ON `transactions`(`academic_year_id`);
CREATE INDEX `transactions_category_id_idx` ON `transactions`(`category_id`);
CREATE INDEX `transactions_member_id_idx` ON `transactions`(`member_id`);

-- Recreate foreign keys with new column names
ALTER TABLE `transactions` 
  ADD CONSTRAINT `transactions_academic_year_id_fkey` FOREIGN KEY (`academic_year_id`) REFERENCES `academic_years`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `transactions_category_id_fkey` FOREIGN KEY (`category_id`) REFERENCES `transaction_categories`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT `transactions_member_id_fkey` FOREIGN KEY (`member_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

SET FOREIGN_KEY_CHECKS = 1;

-- ============================================
-- 5. attachments table
-- ============================================
-- Rename fileHash column if it exists (from previous migration)
SET @column_exists = (
  SELECT COUNT(*)
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'attachments'
    AND COLUMN_NAME = 'fileHash'
);
SET @sql = IF(@column_exists > 0,
  'ALTER TABLE `attachments` CHANGE COLUMN `fileHash` `file_hash` VARCHAR(32) NULL',
  'SELECT "fileHash column does not exist, skipping rename" AS message'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Drop foreign keys temporarily to allow column rename
SET FOREIGN_KEY_CHECKS = 0;
ALTER TABLE `attachments` DROP FOREIGN KEY IF EXISTS `attachments_transactionId_fkey`;
ALTER TABLE `attachments` DROP FOREIGN KEY IF EXISTS `attachments_uploadedBy_fkey`;

-- Rename existing columns
ALTER TABLE `attachments`
  CHANGE COLUMN `fileName` `file_name` VARCHAR(191) NOT NULL,
  CHANGE COLUMN `filePath` `file_path` VARCHAR(191) NOT NULL,
  CHANGE COLUMN `mimeType` `mime_type` VARCHAR(191) NOT NULL,
  CHANGE COLUMN `fileSize` `file_size` INTEGER NOT NULL,
  CHANGE COLUMN `transactionId` `transaction_id` VARCHAR(191) NOT NULL,
  CHANGE COLUMN `uploadedBy` `uploaded_by` VARCHAR(191) NOT NULL,
  CHANGE COLUMN `uploadedAt` `uploaded_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  ALGORITHM=INPLACE;

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
  'SELECT "Index attachments_transactionId_idx does not exist" AS message'
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
  'SELECT "Index attachments_fileHash_idx does not exist" AS message'
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
  'SELECT "Index attachments_fileHash_key does not exist" AS message'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

CREATE INDEX `attachments_transaction_id_idx` ON `attachments`(`transaction_id`);
CREATE INDEX `attachments_file_hash_idx` ON `attachments`(`file_hash`);
CREATE UNIQUE INDEX `attachments_file_hash_key` ON `attachments`(`file_hash`);

-- Recreate foreign keys with new column names
ALTER TABLE `attachments`
  ADD CONSTRAINT `attachments_transaction_id_fkey` FOREIGN KEY (`transaction_id`) REFERENCES `transactions`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `attachments_uploaded_by_fkey` FOREIGN KEY (`uploaded_by`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

SET FOREIGN_KEY_CHECKS = 1;
