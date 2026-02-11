/*
  Warnings:

  - A unique constraint covering the columns `[fileHash]` on the table `attachments` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE `attachments` ADD COLUMN `fileHash` VARCHAR(191) NULL;

-- CreateIndex
CREATE UNIQUE INDEX `attachments_fileHash_key` ON `attachments`(`fileHash`);

-- CreateIndex
CREATE INDEX `attachments_fileHash_idx` ON `attachments`(`fileHash`);
