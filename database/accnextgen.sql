-- phpMyAdmin SQL Dump
-- version 5.2.0
-- https://www.phpmyadmin.net/
--
-- Host: localhost:3306
-- Generation Time: Feb 13, 2026 at 08:17 AM
-- Server version: 8.0.30
-- PHP Version: 8.1.10

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `accnextgen`
--

-- --------------------------------------------------------

--
-- Table structure for table `attachment`
--

CREATE TABLE `attachment` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `fileName` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `mimeType` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `url` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `uploadedAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `orderId` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `documentId` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `expenseId` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `paymentId` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `projectId` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `customer`
--

CREATE TABLE `customer` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `type` enum('COMPANY','SCHOOL','INDIVIDUAL') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'COMPANY',
  `taxId` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `address` text COLLATE utf8mb4_unicode_ci,
  `email` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `phone` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `customer`
--

INSERT INTO `customer` (`id`, `name`, `type`, `taxId`, `address`, `email`, `phone`, `createdAt`, `updatedAt`) VALUES
('cust-company-001', 'บริษัท ดิจิทัล โซลูชั่น จำกัด', 'COMPANY', '0105500012345', '456 อาคารสมาร์ท ชั้น 10 ถ.รัชดาภิเษก แขวงดินแดง เขตดินแดง กรุงเทพมหานคร 10400', 'info@digital-solution.co.th', '02-987-6543', '2026-02-11 21:20:45.729', '2026-02-11 21:20:45.729'),
('cust-school-001', 'โรงเรียนสาธิตแห่งมหาวิทยาลัยตัวอย่าง', 'SCHOOL', '0994000012345', '123 ถ.พหลโยธิน แขวงลาดยาว เขตจตุจักร กรุงเทพมหานคร 10900', 'admin@satit-example.ac.th', '02-123-4567', '2026-02-11 21:20:45.720', '2026-02-11 21:20:45.720');

-- --------------------------------------------------------

--
-- Table structure for table `customerunit`
--

CREATE TABLE `customerunit` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `customerId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `contactName` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `contactPhone` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `contactEmail` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `customerunit`
--

INSERT INTO `customerunit` (`id`, `customerId`, `name`, `contactName`, `contactPhone`, `contactEmail`, `createdAt`, `updatedAt`) VALUES
('unit-academic-001', 'cust-school-001', 'ฝ่ายวิชาการ', 'อ.สมศรี ปราดเปรื่อง', '02-123-4567 ต่อ 301', 'academic@satit-example.ac.th', '2026-02-11 21:20:45.727', '2026-02-11 21:20:45.727'),
('unit-it-001', 'cust-school-001', 'ฝ่าย IT', 'คุณสมชาย เก่งเทค', '02-123-4567 ต่อ 201', 'it@satit-example.ac.th', '2026-02-11 21:20:45.726', '2026-02-11 21:20:45.726'),
('unit-phadsu-001', 'cust-school-001', 'งานพัสดุ', 'คุณสมหญิง ใจดี', '02-123-4567 ต่อ 101', 'procurement@satit-example.ac.th', '2026-02-11 21:20:45.723', '2026-02-11 21:20:45.723');

-- --------------------------------------------------------

--
-- Table structure for table `document`
--

CREATE TABLE `document` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `type` enum('QUOTATION','INVOICE','TAX_INVOICE_RECEIPT') COLLATE utf8mb4_unicode_ci NOT NULL,
  `number` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `issueDate` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `customerId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `orderId` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `projectId` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `subTotal` decimal(12,2) NOT NULL,
  `vatRate` decimal(5,2) NOT NULL,
  `vatAmount` decimal(12,2) NOT NULL,
  `grandTotal` decimal(12,2) NOT NULL,
  `note` text COLLATE utf8mb4_unicode_ci,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `document`
--

INSERT INTO `document` (`id`, `type`, `number`, `issueDate`, `customerId`, `orderId`, `projectId`, `subTotal`, `vatRate`, `vatAmount`, `grandTotal`, `note`, `createdAt`, `updatedAt`) VALUES
('cmlik8e5h0001j5wk4e4ls1uy', 'QUOTATION', 'QT-2602-0001', '2026-02-11 00:00:00.000', 'cust-school-001', NULL, NULL, '0.00', '7.00', '0.00', '0.00', 'sdfsdf', '2026-02-11 21:46:54.245', '2026-02-11 21:46:54.245'),
('cmlik9rpl0003j5wktidn4uv5', 'INVOICE', 'INV-2602-0001', '2026-02-11 00:00:00.000', 'cust-school-001', NULL, NULL, '0.00', '7.00', '0.00', '0.00', ' ttertettertet', '2026-02-11 21:47:58.473', '2026-02-11 21:47:58.473'),
('cmljjj53l0004j5m0f0g4j1r7', 'QUOTATION', 'QT-2602-0002', '2026-02-12 00:00:00.000', 'cust-school-001', NULL, NULL, '3499.00', '7.00', '244.93', '3743.93', NULL, '2026-02-12 14:15:02.290', '2026-02-12 14:15:02.290');

-- --------------------------------------------------------

--
-- Table structure for table `documentitem`
--

CREATE TABLE `documentitem` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `documentId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `productId` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `name` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `unit` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'ชิ้น',
  `qty` int NOT NULL DEFAULT '1',
  `unitPrice` decimal(12,2) NOT NULL,
  `lineTotal` decimal(12,2) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `documentitem`
--

INSERT INTO `documentitem` (`id`, `documentId`, `productId`, `name`, `description`, `unit`, `qty`, `unitPrice`, `lineTotal`) VALUES
('cmljjj53m0006j5m0weqi14qt', 'cmljjj53l0004j5m0f0g4j1r7', 'cmlikxnwa0000j5pgtu7xmc2m', 'กระดาษ A4 80 แกรม (5 รีม)', NULL, 'ชิ้น', 1, '750.00', '750.00'),
('cmljjj53m0007j5m09t45co6r', 'cmljjj53l0004j5m0f0g4j1r7', 'cmlim77d8000vj59oameg7yzu', 'กระดาษทิชชู่ Scott 24 ม้วน', NULL, 'ชิ้น', 1, '259.00', '259.00'),
('cmljjj53m0008j5m0exr9djvp', 'cmljjj53l0004j5m0f0g4j1r7', 'cmlim76i8000cj59oeo4xguog', 'กระเป๋าเอกสาร Samsonite', NULL, 'ชิ้น', 1, '2490.00', '2490.00');

-- --------------------------------------------------------

--
-- Table structure for table `expense`
--

CREATE TABLE `expense` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `expenseDate` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `vendorName` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `category` enum('INVENTORY_PURCHASE','SHIPPING_OUT','PLATFORM_FEE','MARKETING','SOFTWARE_CLOUD','SALARY_FREELANCE','TRAVEL_COMM','OFFICE_SUPPLIES','OTHER') COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `hasVat` tinyint(1) NOT NULL DEFAULT '0',
  `subTotal` decimal(12,2) NOT NULL,
  `vatRate` decimal(5,2) NOT NULL,
  `vatAmount` decimal(12,2) NOT NULL,
  `grandTotal` decimal(12,2) NOT NULL,
  `paymentMethod` enum('CASH','TRANSFER','CARD','OTHER') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'TRANSFER',
  `paidAmount` decimal(12,2) DEFAULT NULL,
  `relatedOrderId` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `relatedProjectId` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `expense`
--

INSERT INTO `expense` (`id`, `expenseDate`, `vendorName`, `category`, `description`, `hasVat`, `subTotal`, `vatRate`, `vatAmount`, `grandTotal`, `paymentMethod`, `paidAmount`, `relatedOrderId`, `relatedProjectId`, `createdAt`, `updatedAt`) VALUES
('cmlikal530004j5wkxuhlgttt', '2026-02-11 00:00:00.000', 'sdfsdfsdfsd', 'OTHER', 'fsdfsdfsdfsdfsdfsdfsdfsd', 1, '2.00', '7.00', '0.14', '2.14', 'TRANSFER', NULL, 'cmlijjikr0001j5gsp9hlzxrr', 'project-sample-001', '2026-02-11 21:48:36.615', '2026-02-12 04:09:39.717');

-- --------------------------------------------------------

--
-- Table structure for table `monthlyclose`
--

CREATE TABLE `monthlyclose` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `year` int NOT NULL,
  `month` int NOT NULL,
  `closedAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `note` text COLLATE utf8mb4_unicode_ci
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `monthlysummary`
--

CREATE TABLE `monthlysummary` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `year` int NOT NULL,
  `month` int NOT NULL,
  `revenueSubTotal` decimal(12,2) NOT NULL,
  `revenueVat` decimal(12,2) NOT NULL,
  `expenseSubTotal` decimal(12,2) NOT NULL,
  `expenseVat` decimal(12,2) NOT NULL,
  `vatOutput` decimal(12,2) NOT NULL,
  `vatInput` decimal(12,2) NOT NULL,
  `vatPayable` decimal(12,2) NOT NULL,
  `whtBaseAmount` decimal(12,2) NOT NULL,
  `whtTaxAmount` decimal(12,2) NOT NULL,
  `pnlRevenue` decimal(12,2) NOT NULL,
  `pnlCogs` decimal(12,2) NOT NULL,
  `pnlGrossProfit` decimal(12,2) NOT NULL,
  `pnlOpex` decimal(12,2) NOT NULL,
  `pnlOperatingProfit` decimal(12,2) NOT NULL,
  `generatedAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `order`
--

CREATE TABLE `order` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `code` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `customerId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` enum('DRAFT','INVOICED','PAID','CLOSED','VOID') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'DRAFT',
  `orderDate` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `subTotal` decimal(12,2) NOT NULL,
  `vatRate` decimal(5,2) NOT NULL,
  `vatAmount` decimal(12,2) NOT NULL,
  `grandTotal` decimal(12,2) NOT NULL,
  `note` text COLLATE utf8mb4_unicode_ci,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `order`
--

INSERT INTO `order` (`id`, `code`, `customerId`, `status`, `orderDate`, `subTotal`, `vatRate`, `vatAmount`, `grandTotal`, `note`, `createdAt`, `updatedAt`) VALUES
('cmlijjikr0001j5gsp9hlzxrr', 'ORD-2602-0002', 'cust-company-001', 'DRAFT', '2026-02-11 21:27:33.575', '2300.00', '7.00', '161.00', '2461.00', '', '2026-02-11 21:27:33.579', '2026-02-11 21:27:33.579'),
('cmlimxlhz0001j5a8rskdw6lh', 'ORD-2602-0003', 'cust-company-001', 'PAID', '2026-02-11 23:02:29.394', '39690.00', '7.00', '2778.30', '42468.30', '', '2026-02-11 23:02:29.399', '2026-02-12 14:28:04.445'),
('order-sample-001', 'ORD-2602-0001', 'cust-company-001', 'DRAFT', '2026-02-01 00:00:00.000', '15000.00', '7.00', '1050.00', '16050.00', NULL, '2026-02-11 21:20:45.731', '2026-02-11 21:20:45.731');

-- --------------------------------------------------------

--
-- Table structure for table `orderitem`
--

CREATE TABLE `orderitem` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `orderId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `qty` int NOT NULL DEFAULT '1',
  `unitPrice` decimal(12,2) NOT NULL,
  `lineTotal` decimal(12,2) NOT NULL,
  `productId` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `unit` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'ชิ้น'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `orderitem`
--

INSERT INTO `orderitem` (`id`, `orderId`, `name`, `qty`, `unitPrice`, `lineTotal`, `productId`, `unit`) VALUES
('cmlijarvn0000j5zco3xpvis8', 'order-sample-001', 'เมาส์ไร้สาย Logitech M590', 5, '1200.00', '6000.00', NULL, 'ชิ้น'),
('cmlijarvn0001j5zcxu6qthqn', 'order-sample-001', 'คีย์บอร์ด Mechanical TKL', 3, '3000.00', '9000.00', NULL, 'ชิ้น'),
('cmlijjikr0002j5gssryiaeoq', 'cmlijjikr0001j5gsp9hlzxrr', 'sdfsdfsdfsd', 1, '2300.00', '2300.00', NULL, 'ชิ้น'),
('cmlimxlhz0003j5a842soibit', 'cmlimxlhz0001j5a8rskdw6lh', 'RAM Kingston Fury Beast DDR5 16GB', 1, '1890.00', '1890.00', 'cmlilvs3l000qj5vciojx3mqd', 'ชิ้น'),
('cmlimxlhz0004j5a8jl5qi30g', 'cmlimxlhz0001j5a8rskdw6lh', 'Apple Watch SE 2nd Gen 40mm', 1, '8900.00', '8900.00', 'cmlilvy920014j5vc8zyavmdy', 'ชิ้น'),
('cmlimxlhz0005j5a83qc7sq77', 'cmlimxlhz0001j5a8rskdw6lh', 'iPhone 15 128GB', 1, '28900.00', '28900.00', 'cmlilvy8a000yj5vcbxcn7m5s', 'ชิ้น');

-- --------------------------------------------------------

--
-- Table structure for table `payment`
--

CREATE TABLE `payment` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `receivedAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `method` enum('CASH','TRANSFER','CARD','OTHER') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'TRANSFER',
  `amount` decimal(12,2) NOT NULL,
  `note` text COLLATE utf8mb4_unicode_ci,
  `orderId` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `documentId` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `product`
--

CREATE TABLE `product` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `sku` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `name` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `category` enum('GOODS','SERVICE') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'GOODS',
  `unit` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'ชิ้น',
  `unitPrice` decimal(12,2) NOT NULL,
  `isActive` tinyint(1) NOT NULL DEFAULT '1',
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL,
  `discount` decimal(12,2) DEFAULT NULL,
  `imageUrl` text COLLATE utf8mb4_unicode_ci,
  `scrapedAt` datetime(3) DEFAULT NULL,
  `sourceUrl` text COLLATE utf8mb4_unicode_ci,
  `groupId` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `product`
--

INSERT INTO `product` (`id`, `sku`, `name`, `description`, `category`, `unit`, `unitPrice`, `isActive`, `createdAt`, `updatedAt`, `discount`, `imageUrl`, `scrapedAt`, `sourceUrl`, `groupId`) VALUES
('cmlikxnwa0000j5pgtu7xmc2m', 'PAP-A4-80', 'กระดาษ A4 80 แกรม (5 รีม)', 'กระดาษถ่ายเอกสาร A4 80 แกรม แพ็ค 5 รีม', 'GOODS', 'ชิ้น', '750.00', 1, '2026-02-11 22:06:33.275', '2026-02-11 22:22:41.760', '50.00', 'https://picsum.photos/seed/PAP-A4-80/200/200', '2026-02-11 22:22:39.113', 'https://shop.example.com/paper-a4', 'cmlilif690000j5vcwc0evjmy'),
('cmlikxnww0001j5pgcx0cld22', 'INK-HP680-BK', 'หมึกพิมพ์ HP 680 Black', 'หมึกพิมพ์แท้ HP 680 สีดำ', 'GOODS', 'ชิ้น', '450.00', 1, '2026-02-11 22:06:33.297', '2026-02-11 22:22:41.778', NULL, 'https://picsum.photos/seed/INK-HP680-BK/200/200', '2026-02-11 22:22:39.113', 'https://shop.example.com/ink-hp680-bk', 'cmlilif690000j5vcwc0evjmy'),
('cmlikxnx10002j5pghfv6cdjg', 'INK-HP680-CL', 'หมึกพิมพ์ HP 680 Color', 'หมึกพิมพ์แท้ HP 680 สี', 'GOODS', 'ชิ้น', '520.00', 1, '2026-02-11 22:06:33.302', '2026-02-11 22:22:41.793', '30.00', 'https://picsum.photos/seed/INK-HP680-CL/200/200', '2026-02-11 22:22:39.113', 'https://shop.example.com/ink-hp680-cl', 'cmlilif690000j5vcwc0evjmy'),
('cmlikxnx50003j5pgjtmlpe20', 'PEN-05-BOX', 'ปากกาลูกลื่น 0.5mm (กล่อง 12 ด้าม)', 'ปากกาลูกลื่น 0.5mm กล่อง 12 ด้าม', 'GOODS', 'ชิ้น', '180.00', 1, '2026-02-11 22:06:33.305', '2026-02-11 22:22:41.822', NULL, 'https://picsum.photos/seed/PEN-05-BOX/200/200', '2026-02-11 22:22:39.113', 'https://shop.example.com/pen-05', 'cmlilif880001j5vc2k7vxddp'),
('cmlikxnxa0004j5pg2ycadxt2', 'FLD-A4-W', 'แฟ้มสันกว้าง A4', NULL, 'GOODS', 'ชิ้น', '45.00', 1, '2026-02-11 22:06:33.310', '2026-02-11 22:22:41.838', '5.00', NULL, '2026-02-11 22:22:39.113', 'https://shop.example.com/folder-a4', 'cmlilif880001j5vc2k7vxddp'),
('cmlikxnxe0005j5pga0ivf3yo', 'NB-A5-LN', 'สมุดบันทึก A5 มีเส้น', NULL, 'GOODS', 'ชิ้น', '65.00', 1, '2026-02-11 22:06:33.315', '2026-02-11 22:22:41.851', NULL, 'https://picsum.photos/seed/NB-A5-LN/200/200', '2026-02-11 22:22:39.113', 'https://shop.example.com/notebook-a5', 'cmlilif880001j5vc2k7vxddp'),
('cmlikxnxj0006j5pguqemoo9e', 'GLU-UHU-21', 'กาวแท่ง UHU 21g', NULL, 'GOODS', 'ชิ้น', '35.00', 1, '2026-02-11 22:06:33.320', '2026-02-11 22:22:41.866', NULL, NULL, '2026-02-11 22:22:39.113', 'https://shop.example.com/glue-uhu', 'cmlilif880001j5vc2k7vxddp'),
('cmlikxnxn0007j5pgge9c5shj', 'CLP-108', 'คลิปหนีบกระดาษ No.108 (กล่อง)', NULL, 'GOODS', 'ชิ้น', '25.00', 1, '2026-02-11 22:06:33.323', '2026-02-11 22:22:41.876', NULL, 'https://picsum.photos/seed/CLP-108/200/200', '2026-02-11 22:22:39.113', 'https://shop.example.com/clip-108', 'cmlilif880001j5vc2k7vxddp'),
('cmlikxnxr0008j5pg2i0l8syz', 'STP-MAX-10', 'เครื่องเย็บกระดาษ MAX HD-10', NULL, 'GOODS', 'ชิ้น', '220.00', 1, '2026-02-11 22:06:33.328', '2026-02-11 22:22:41.888', '20.00', 'https://picsum.photos/seed/STP-MAX-10/200/200', '2026-02-11 22:22:39.113', 'https://shop.example.com/stapler-max', 'cmlilif880001j5vc2k7vxddp'),
('cmlikxnxv0009j5pg9z23o18p', 'STW-10', 'ลวดเย็บ No.10 (กล่อง)', NULL, 'GOODS', 'ชิ้น', '15.00', 1, '2026-02-11 22:06:33.332', '2026-02-11 22:22:41.898', NULL, NULL, '2026-02-11 22:22:39.113', 'https://shop.example.com/staple-wire', 'cmlilif880001j5vc2k7vxddp'),
('cmlikxnxz000aj5pg635b2l76', 'PC-DELL-V', 'คอมพิวเตอร์ Dell Vostro i5/8GB/256SSD', 'Dell Vostro Desktop i5-13400/8GB/256SSD', 'GOODS', 'ชิ้น', '18500.00', 1, '2026-02-11 22:06:33.335', '2026-02-11 22:22:41.915', '1500.00', 'https://picsum.photos/seed/PC-DELL-V/200/200', '2026-02-11 22:22:39.113', 'https://shop.example.com/dell-vostro', 'cmlilifau0002j5vcpaxeyydi'),
('cmlikxny3000bj5pgkz28e1pv', 'MON-24', 'จอมอนิเตอร์ 24 นิ้ว IPS', NULL, 'GOODS', 'ชิ้น', '4500.00', 1, '2026-02-11 22:06:33.340', '2026-02-11 22:22:41.922', '300.00', 'https://picsum.photos/seed/MON-24/200/200', '2026-02-11 22:22:39.113', 'https://shop.example.com/monitor-24', 'cmlilifau0002j5vcpaxeyydi'),
('cmlikxny8000cj5pgevyy47l2', 'KB-USB', 'คีย์บอร์ด USB', NULL, 'GOODS', 'ชิ้น', '350.00', 1, '2026-02-11 22:06:33.345', '2026-02-11 22:22:41.929', NULL, 'https://picsum.photos/seed/KB-USB/200/200', '2026-02-11 22:22:39.113', 'https://shop.example.com/keyboard', 'cmlilifau0002j5vcpaxeyydi'),
('cmlikxnye000dj5pg5qboakot', 'MS-LOGI-W', 'เมาส์ไร้สาย Logitech M185', NULL, 'GOODS', 'ชิ้น', '490.00', 1, '2026-02-11 22:06:33.350', '2026-02-11 22:22:41.937', '40.00', 'https://picsum.photos/seed/MS-LOGI-W/200/200', '2026-02-11 22:22:39.113', 'https://shop.example.com/mouse-logi', 'cmlilifau0002j5vcpaxeyydi'),
('cmlikxnyh000ej5pggkssykrn', 'RTR-WIFI6', 'เราเตอร์ WiFi 6 AX1500', NULL, 'GOODS', 'ชิ้น', '1890.00', 1, '2026-02-11 22:06:33.354', '2026-02-11 22:22:41.954', '200.00', 'https://picsum.photos/seed/RTR-WIFI6/200/200', '2026-02-11 22:22:39.113', 'https://shop.example.com/router-wifi6', 'cmlilifbw0003j5vc7zicw2aq'),
('cmlikxnyk000fj5pgp5xww9gf', 'SVC-NET-INST', 'บริการติดตั้งระบบเครือข่าย', 'ติดตั้งระบบ LAN/WiFi สำหรับสำนักงาน', 'SERVICE', 'งาน', '5000.00', 1, '2026-02-11 22:06:33.357', '2026-02-11 22:06:33.357', NULL, NULL, NULL, NULL, NULL),
('cmlikxnyp000gj5pgd8gy6lhn', 'SVC-PC-REPAIR', 'บริการซ่อมคอมพิวเตอร์', NULL, 'SERVICE', 'ครั้ง', '800.00', 1, '2026-02-11 22:06:33.362', '2026-02-11 22:06:33.362', NULL, NULL, NULL, NULL, NULL),
('cmlikxnys000hj5pgs6krezcv', 'SVC-WEB-DESIGN', 'บริการออกแบบเว็บไซต์', NULL, 'SERVICE', 'โครงการ', '25000.00', 1, '2026-02-11 22:06:33.365', '2026-02-11 22:06:33.365', NULL, NULL, NULL, NULL, NULL),
('cmlikxnyx000ij5pgjs4tuqlt', 'SVC-MAINT-M', 'บริการดูแลระบบรายเดือน', 'ดูแลเซิร์ฟเวอร์ + แก้ปัญหา IT', 'SERVICE', 'เดือน', '3500.00', 1, '2026-02-11 22:06:33.369', '2026-02-11 22:06:33.369', NULL, NULL, NULL, NULL, NULL),
('cmlikxnz0000jj5pg5wc96vmh', 'SVC-TRAIN-D', 'บริการฝึกอบรม IT (ต่อวัน)', NULL, 'SERVICE', 'วัน', '8000.00', 1, '2026-02-11 22:06:33.373', '2026-02-11 22:06:33.373', NULL, NULL, NULL, NULL, NULL),
('cmlikxnz3000kj5pgv2cth3t6', 'SVC-SOFT-DEV', 'บริการพัฒนาซอฟต์แวร์', NULL, 'SERVICE', 'โครงการ', '50000.00', 1, '2026-02-11 22:06:33.376', '2026-02-11 22:06:33.376', NULL, NULL, NULL, NULL, NULL),
('cmlikxnz8000lj5pg2pcw8d32', 'SVC-BACKUP-CL', 'บริการสำรองข้อมูล Cloud', NULL, 'SERVICE', 'เดือน', '1500.00', 1, '2026-02-11 22:06:33.381', '2026-02-11 22:06:33.381', NULL, NULL, NULL, NULL, NULL),
('cmlikxnzc000mj5pg2kjki2lu', 'SVC-SEC-AUDIT', 'บริการตรวจสอบความปลอดภัยระบบ', NULL, 'SERVICE', 'ครั้ง', '15000.00', 1, '2026-02-11 22:06:33.385', '2026-02-11 22:06:33.385', NULL, NULL, NULL, NULL, NULL),
('cmlil8tit0000j5asz1jxmo2b', 'PAP-001', 'กระดาษ A4 80 แกรม', NULL, 'GOODS', 'ชิ้น', '150.00', 1, '2026-02-11 22:15:13.781', '2026-02-11 22:22:53.535', '10.00', 'https://picsum.photos/seed/PAP-001/200/200', '2026-02-11 22:22:53.448', 'https://shop.example.com/paper-a4', 'cmlilif690000j5vcwc0evjmy'),
('cmlil8tj40001j5asarihyade', 'INK-CAN-47', 'หมึกพิมพ์ Canon PG-47 Black', NULL, 'GOODS', 'ชิ้น', '390.00', 1, '2026-02-11 22:15:13.793', '2026-02-11 22:22:53.549', NULL, 'https://picsum.photos/seed/INK-CAN-47/200/200', '2026-02-11 22:22:53.448', 'https://shop.example.com/ink-canon', 'cmlilif690000j5vcwc0evjmy'),
('cmlil8tjh0002j5asyzqrkkns', 'PEN-MAGIC-12', 'ปากกาเมจิก 12 สี', NULL, 'GOODS', 'ชิ้น', '85.00', 1, '2026-02-11 22:15:13.805', '2026-02-11 22:22:53.567', '5.00', NULL, '2026-02-11 22:22:53.448', 'https://shop.example.com/pen-magic', 'cmlilif880001j5vc2k7vxddp'),
('cmlil8tju0003j5asf8zz4nc3', 'FLD-A4-001', 'แฟ้มเอกสาร A4 สันกว้าง', NULL, 'GOODS', 'ชิ้น', '42.00', 1, '2026-02-11 22:15:13.818', '2026-02-11 22:22:53.580', NULL, NULL, '2026-02-11 22:22:53.448', NULL, 'cmlilif880001j5vc2k7vxddp'),
('cmlil8tk30004j5aszlwt2w8y', 'USB-32G', 'USB Flash Drive 32GB', NULL, 'GOODS', 'ชิ้น', '199.00', 1, '2026-02-11 22:15:13.827', '2026-02-11 22:22:53.605', '20.00', 'https://picsum.photos/seed/USB-32G/200/200', '2026-02-11 22:22:53.448', 'https://shop.example.com/usb-32g', 'cmlilifau0002j5vcpaxeyydi'),
('cmlil8tkd0005j5aszsv0y6wu', 'SVC-PRINT', 'บริการติดตั้งเครื่องพิมพ์', NULL, 'GOODS', 'ชิ้น', '500.00', 1, '2026-02-11 22:15:13.837', '2026-02-11 22:22:53.624', NULL, NULL, '2026-02-11 22:22:53.448', NULL, 'cmlilioc20004j5vchqw40mh3'),
('cmlil8tkl0006j5ast5u9lle6', 'SVC-NB-REP', 'บริการซ่อม Notebook', NULL, 'GOODS', 'ชิ้น', '1200.00', 1, '2026-02-11 22:15:13.846', '2026-02-11 22:22:53.633', '100.00', NULL, '2026-02-11 22:22:53.448', 'https://shop.example.com/repair', 'cmlilioc20004j5vchqw40mh3'),
('cmlilvs1n0007j5vcixz4niu1', 'JIB-NB001', 'Notebook Lenovo IdeaPad 3 15IAU7 i5/8GB/512SSD', NULL, 'GOODS', 'ชิ้น', '16990.00', 1, '2026-02-11 22:33:04.955', '2026-02-11 22:33:04.955', '2000.00', 'https://picsum.photos/seed/JIB-NB001/200/200', '2026-02-11 22:33:04.894', 'https://www.jib.co.th/web/product/readProduct/40/40', 'cmlilvs1h0005j5vcxzjp8yc2'),
('cmlilvs1u0009j5vcp1g45smf', 'JIB-NB002', 'Notebook ASUS VivoBook 15 OLED i7/16GB/512SSD', NULL, 'GOODS', 'ชิ้น', '24990.00', 1, '2026-02-11 22:33:04.962', '2026-02-11 22:33:04.962', '3000.00', 'https://picsum.photos/seed/JIB-NB002/200/200', '2026-02-11 22:33:04.894', 'https://www.jib.co.th/web/product/readProduct/41/41', 'cmlilvs1h0005j5vcxzjp8yc2'),
('cmlilvs24000cj5vcq1qfo85l', 'JIB-MON01', 'Monitor LG 27UL550 27\" 4K IPS', NULL, 'GOODS', 'ชิ้น', '7990.00', 1, '2026-02-11 22:33:04.972', '2026-02-11 22:33:04.972', '1000.00', 'https://picsum.photos/seed/JIB-MON01/200/200', '2026-02-11 22:33:04.894', 'https://www.jib.co.th/web/product/readProduct/42/42', 'cmlilvs21000aj5vc949fbxhs'),
('cmlilvs2g000fj5vcnev82fc4', 'JIB-PRN01', 'Printer HP LaserJet M111a', NULL, 'GOODS', 'ชิ้น', '3990.00', 1, '2026-02-11 22:33:04.984', '2026-02-11 22:33:04.984', '500.00', 'https://picsum.photos/seed/JIB-PRN01/200/200', '2026-02-11 22:33:04.894', 'https://www.jib.co.th/web/product/readProduct/43/43', 'cmlilvs2c000dj5vcbsx5onpc'),
('cmlilvs2r000ij5vcf04pu0fj', 'JIB-KB01', 'Keyboard Logitech K380 Multi-Device', NULL, 'GOODS', 'ชิ้น', '1290.00', 1, '2026-02-11 22:33:04.995', '2026-02-11 22:33:04.995', '200.00', 'https://picsum.photos/seed/JIB-KB01/200/200', '2026-02-11 22:33:04.894', 'https://www.jib.co.th/web/product/readProduct/44/44', 'cmlilvs2n000gj5vc70ni1on3'),
('cmlilvs2x000kj5vcur118j9p', 'JIB-MS01', 'Mouse Razer DeathAdder Essential', NULL, 'GOODS', 'ชิ้น', '890.00', 1, '2026-02-11 22:33:05.002', '2026-02-11 22:33:05.002', '100.00', 'https://picsum.photos/seed/JIB-MS01/200/200', '2026-02-11 22:33:04.894', 'https://www.jib.co.th/web/product/readProduct/45/45', 'cmlilvs2n000gj5vc70ni1on3'),
('cmlilvs39000nj5vcw1plvgoe', 'JIB-SSD01', 'SSD Samsung 870 EVO 1TB', NULL, 'GOODS', 'ชิ้น', '2490.00', 1, '2026-02-11 22:33:05.013', '2026-02-11 22:33:05.013', '300.00', 'https://picsum.photos/seed/JIB-SSD01/200/200', '2026-02-11 22:33:04.894', 'https://www.jib.co.th/web/product/readProduct/46/46', 'cmlilvs35000lj5vc168svl5d'),
('cmlilvs3l000qj5vciojx3mqd', 'JIB-RAM01', 'RAM Kingston Fury Beast DDR5 16GB', NULL, 'GOODS', 'ชิ้น', '1890.00', 1, '2026-02-11 22:33:05.025', '2026-02-11 22:33:05.025', NULL, 'https://picsum.photos/seed/JIB-RAM01/200/200', '2026-02-11 22:33:04.894', 'https://www.jib.co.th/web/product/readProduct/47/47', 'cmlilvs3h000oj5vc2yicq9nf'),
('cmlilvy7s000tj5vcnp0eoj10', 'BNN-MBA-M3', 'MacBook Air 13\" M3 8/256GB', NULL, 'GOODS', 'ชิ้น', '37900.00', 0, '2026-02-11 22:33:12.952', '2026-02-11 22:48:41.712', NULL, 'https://picsum.photos/seed/BNN-MBA-M3/200/200', '2026-02-11 22:33:12.917', 'https://www.bnn.in.th/th/p/mac/macbook-air-m3', 'cmlilvy7m000rj5vczbswbvja'),
('cmlilvy7y000vj5vcjb4sppei', 'BNN-MBP-M3P', 'MacBook Pro 14\" M3 Pro 18/512GB', NULL, 'GOODS', 'ชิ้น', '64900.00', 1, '2026-02-11 22:33:12.958', '2026-02-11 22:33:12.958', '2000.00', 'https://picsum.photos/seed/BNN-MBP-M3P/200/200', '2026-02-11 22:33:12.917', 'https://www.bnn.in.th/th/p/mac/macbook-pro-m3pro', 'cmlilvy7m000rj5vczbswbvja'),
('cmlilvy8a000yj5vcbxcn7m5s', 'BNN-IP15-128', 'iPhone 15 128GB', NULL, 'GOODS', 'ชิ้น', '28900.00', 1, '2026-02-11 22:33:12.970', '2026-02-11 22:33:12.970', '1000.00', 'https://picsum.photos/seed/BNN-IP15-128/200/200', '2026-02-11 22:33:12.917', 'https://www.bnn.in.th/th/p/iphone/iphone-15', 'cmlilvy85000wj5vcvw6wpyth'),
('cmlilvy8o0011j5vckhhzpsgm', 'BNN-IPAD10', 'iPad 10th Gen WiFi 64GB', NULL, 'GOODS', 'ชิ้น', '14900.00', 1, '2026-02-11 22:33:12.985', '2026-02-11 22:33:12.985', '500.00', 'https://picsum.photos/seed/BNN-IPAD10/200/200', '2026-02-11 22:33:12.917', 'https://www.bnn.in.th/th/p/ipad/ipad-10', 'cmlilvy8j000zj5vctj6evmkw'),
('cmlilvy920014j5vc8zyavmdy', 'BNN-AW-SE', 'Apple Watch SE 2nd Gen 40mm', NULL, 'GOODS', 'ชิ้น', '8900.00', 1, '2026-02-11 22:33:12.998', '2026-02-11 22:33:12.998', NULL, 'https://picsum.photos/seed/BNN-AW-SE/200/200', '2026-02-11 22:33:12.917', 'https://www.bnn.in.th/th/p/apple-watch/apple-watch-se', 'cmlilvy8x0012j5vc8s7n09uc'),
('cmlilvy9f0017j5vcxp28ut63', 'BNN-AP-PRO2', 'AirPods Pro 2nd Gen USB-C', NULL, 'GOODS', 'ชิ้น', '8690.00', 1, '2026-02-11 22:33:13.012', '2026-02-11 22:33:13.012', '300.00', 'https://picsum.photos/seed/BNN-AP-PRO2/200/200', '2026-02-11 22:33:12.917', 'https://www.bnn.in.th/th/p/accessories/airpods-pro-2', 'cmlilvy990015j5vcxgd5iu1f'),
('cmlilw4pq001aj5vca4o28u3p', 'LZD-001', 'เก้าอี้สำนักงาน รุ่น Ergonomic Mesh', NULL, 'GOODS', 'ชิ้น', '3490.00', 1, '2026-02-11 22:33:21.375', '2026-02-11 22:33:21.375', '500.00', 'https://picsum.photos/seed/LZD-001/200/200', '2026-02-11 22:33:21.333', 'https://www.lazada.co.th/products/i1001.html', 'cmlilw4pk0018j5vc7fqxms2l'),
('cmlilw4px001cj5vcss35dwe1', 'LZD-002', 'โต๊ะทำงานไม้ 120x60 cm', NULL, 'GOODS', 'ชิ้น', '2990.00', 1, '2026-02-11 22:33:21.381', '2026-02-11 22:33:21.381', '300.00', 'https://picsum.photos/seed/LZD-002/200/200', '2026-02-11 22:33:21.333', 'https://www.lazada.co.th/products/i1002.html', 'cmlilw4pk0018j5vc7fqxms2l'),
('cmlilw4q2001ej5vc6bv5vu9e', 'LZD-003', 'ตู้เก็บเอกสาร 3 ลิ้นชัก', NULL, 'GOODS', 'ชิ้น', '1890.00', 1, '2026-02-11 22:33:21.386', '2026-02-11 22:33:21.386', '200.00', 'https://picsum.photos/seed/LZD-003/200/200', '2026-02-11 22:33:21.333', 'https://www.lazada.co.th/products/i1003.html', 'cmlilw4pk0018j5vc7fqxms2l'),
('cmlilw4q8001gj5vcm82r08o9', 'LZD-004', 'หมึก Epson 003 Original (4 สี)', NULL, 'GOODS', 'ชิ้น', '920.00', 1, '2026-02-11 22:33:21.393', '2026-02-11 22:33:21.393', '80.00', 'https://picsum.photos/seed/LZD-004/200/200', '2026-02-11 22:33:21.333', 'https://www.lazada.co.th/products/i1004.html', 'cmlilif690000j5vcwc0evjmy'),
('cmlilw4qf001ij5vceu3czya9', 'LZD-005', 'กล่องเก็บเอกสาร A4 ชุด 5 ใบ', NULL, 'GOODS', 'ชิ้น', '250.00', 1, '2026-02-11 22:33:21.399', '2026-02-11 22:33:21.399', '30.00', 'https://picsum.photos/seed/LZD-005/200/200', '2026-02-11 22:33:21.333', 'https://www.lazada.co.th/products/i1005.html', 'cmlilif690000j5vcwc0evjmy'),
('cmlilwbh9001lj5vcokia43p8', 'LT-001', 'กระดาษ A4 80g Navigator 500 แผ่น', NULL, 'GOODS', 'ชิ้น', '175.00', 1, '2026-02-11 22:33:30.141', '2026-02-11 22:33:30.141', '10.00', 'https://picsum.photos/seed/LT-001/200/200', '2026-02-11 22:33:30.082', 'https://www.lotuss.com/th/product/paper-navigator', 'cmlilwbh4001jj5vcvfgum3xr'),
('cmlilwbhf001nj5vcqvnrt2kr', 'LT-002', 'ปากกาเมจิก ตราม้า 12 สี', NULL, 'GOODS', 'ชิ้น', '65.00', 1, '2026-02-11 22:33:30.147', '2026-02-11 22:33:30.147', NULL, 'https://picsum.photos/seed/LT-002/200/200', '2026-02-11 22:33:30.082', 'https://www.lotuss.com/th/product/pen-horse-12', 'cmlilwbh4001jj5vcvfgum3xr'),
('cmlilwbhl001pj5vceub88mvu', 'LT-003', 'เทปกาว OPP ใส 2 นิ้ว x 100 หลา', NULL, 'GOODS', 'ชิ้น', '45.00', 1, '2026-02-11 22:33:30.154', '2026-02-11 22:33:30.154', '5.00', 'https://picsum.photos/seed/LT-003/200/200', '2026-02-11 22:33:30.082', 'https://www.lotuss.com/th/product/tape-opp-100y', 'cmlilwbh4001jj5vcvfgum3xr'),
('cmlilwbi0001sj5vcr82kn12e', 'LT-004', 'กาแฟ Nescafe 3in1 30 ซอง', NULL, 'GOODS', 'ชิ้น', '189.00', 1, '2026-02-11 22:33:30.168', '2026-02-11 22:33:30.168', '20.00', 'https://picsum.photos/seed/LT-004/200/200', '2026-02-11 22:33:30.082', 'https://www.lotuss.com/th/product/nescafe-3in1-30', 'cmlilwbhw001qj5vcb9oq719d'),
('cmlilwbi5001uj5vcci4thsgg', 'LT-005', 'น้ำดื่ม Nestle Pure Life 1.5L x6', NULL, 'GOODS', 'ชิ้น', '79.00', 1, '2026-02-11 22:33:30.174', '2026-02-11 22:33:30.174', NULL, 'https://picsum.photos/seed/LT-005/200/200', '2026-02-11 22:33:30.082', 'https://www.lotuss.com/th/product/nestle-water-6', 'cmlilwbhw001qj5vcb9oq719d'),
('cmlilwbx3001xj5vcxqbt3qif', 'BC-001', 'กระดาษชำระ Cellox 24 ม้วน', NULL, 'GOODS', 'ชิ้น', '249.00', 1, '2026-02-11 22:33:30.712', '2026-02-11 22:33:30.712', '30.00', 'https://picsum.photos/seed/BC-001/200/200', '2026-02-11 22:33:30.635', 'https://www.bigc.co.th/product/tissue-cellox-24', 'cmlilwbw1001vj5vcxzn9om6p'),
('cmlilwbxa001zj5vctpw0qpna', 'BC-002', 'สบู่เหลวล้างมือ Dettol 500ml', NULL, 'GOODS', 'ชิ้น', '119.00', 1, '2026-02-11 22:33:30.719', '2026-02-11 22:33:30.719', '10.00', 'https://picsum.photos/seed/BC-002/200/200', '2026-02-11 22:33:30.635', 'https://www.bigc.co.th/product/dettol-hand-soap', 'cmlilwbw1001vj5vcxzn9om6p'),
('cmlilwbxh0021j5vctk6a0q04', 'BC-003', 'ถุงขยะ ชนิดหนา 30x40 นิ้ว 15 ใบ', NULL, 'GOODS', 'ชิ้น', '55.00', 1, '2026-02-11 22:33:30.725', '2026-02-11 22:33:30.725', NULL, 'https://picsum.photos/seed/BC-003/200/200', '2026-02-11 22:33:30.635', 'https://www.bigc.co.th/product/trash-bag-30x40', 'cmlilwbw1001vj5vcxzn9om6p'),
('cmlilwbxr0023j5vc65dkaejl', 'BC-004', 'น้ำยาทำความสะอาด Ajax 900ml', NULL, 'GOODS', 'ชิ้น', '89.00', 1, '2026-02-11 22:33:30.736', '2026-02-11 22:33:30.736', '10.00', 'https://picsum.photos/seed/BC-004/200/200', '2026-02-11 22:33:30.635', 'https://www.bigc.co.th/product/ajax-cleaner', 'cmlilwbw1001vj5vcxzn9om6p'),
('cmlilwbya0026j5vc24rrbkq5', 'BC-005', 'แบตเตอรี่ AA Energizer Max 8 ก้อน', NULL, 'GOODS', 'ชิ้น', '179.00', 1, '2026-02-11 22:33:30.755', '2026-02-11 22:33:30.755', '20.00', 'https://picsum.photos/seed/BC-005/200/200', '2026-02-11 22:33:30.635', 'https://www.bigc.co.th/product/energizer-aa-8', 'cmlilwby60024j5vc2jmtqyxk'),
('cmlilwcb80029j5vc01dey5jv', 'LNW-001', 'กระเป๋าเอกสาร หนัง PU สีดำ', NULL, 'GOODS', 'ชิ้น', '590.00', 1, '2026-02-11 22:33:31.220', '2026-02-11 22:33:31.220', '50.00', 'https://picsum.photos/seed/LNW-001/200/200', '2026-02-11 22:33:31.185', 'https://myshop.lnwshop.com/product/1', 'cmlilwcb30027j5vc80qo17an'),
('cmlilwcbd002bj5vcd8bebsae', 'LNW-002', 'ปากกาหมึกซึม Parker Jotter', NULL, 'GOODS', 'ชิ้น', '790.00', 1, '2026-02-11 22:33:31.225', '2026-02-11 22:33:31.225', NULL, 'https://picsum.photos/seed/LNW-002/200/200', '2026-02-11 22:33:31.185', 'https://myshop.lnwshop.com/product/2', 'cmlilif880001j5vc2k7vxddp'),
('cmlilwcbi002dj5vcnpazaot5', 'LNW-003', 'สมุดวาดภาพ Canson A3 20 แผ่น', NULL, 'GOODS', 'ชิ้น', '185.00', 1, '2026-02-11 22:33:31.230', '2026-02-11 22:33:31.230', '15.00', 'https://picsum.photos/seed/LNW-003/200/200', '2026-02-11 22:33:31.185', 'https://myshop.lnwshop.com/product/3', 'cmlilif880001j5vc2k7vxddp'),
('cmlilwcbr002gj5vcgs3iwltp', 'LNW-004', 'แท่นชาร์จ USB-C 65W PD', NULL, 'GOODS', 'ชิ้น', '890.00', 1, '2026-02-11 22:33:31.239', '2026-02-11 22:33:31.239', '100.00', 'https://picsum.photos/seed/LNW-004/200/200', '2026-02-11 22:33:31.185', 'https://myshop.lnwshop.com/product/4', 'cmlilwcbo002ej5vc164zgvfn'),
('cmlilwcby002ij5vc25wdohhg', 'LNW-005', 'เคส iPad Air ฝาพับ Smart Cover', NULL, 'GOODS', 'ชิ้น', '450.00', 1, '2026-02-11 22:33:31.247', '2026-02-11 22:33:31.247', '50.00', 'https://picsum.photos/seed/LNW-005/200/200', '2026-02-11 22:33:31.185', 'https://myshop.lnwshop.com/product/5', 'cmlilvy990015j5vcxgd5iu1f'),
('cmlilwcos002kj5vcqbnohdei', 'SPE-001', 'ปากกาลูกลื่น Pilot G-1 0.5mm กล่อง 12 ด้าม', NULL, 'GOODS', 'ชิ้น', '156.00', 1, '2026-02-11 22:33:31.708', '2026-02-11 22:33:31.708', '20.00', 'https://picsum.photos/seed/SPE-001/200/200', '2026-02-11 22:33:31.676', 'https://shopee.co.th/product/1/1001', 'cmlilif880001j5vc2k7vxddp'),
('cmlilwcoy002mj5vcmf218vui', 'SPE-002', 'กระดาษถ่ายเอกสาร A4 80 แกรม Double A (500 แผ่น)', NULL, 'GOODS', 'ชิ้น', '165.00', 1, '2026-02-11 22:33:31.714', '2026-02-11 22:33:31.714', '15.00', 'https://picsum.photos/seed/SPE-002/200/200', '2026-02-11 22:33:31.676', 'https://shopee.co.th/product/1/1002', 'cmlilif690000j5vcwc0evjmy'),
('cmlilwcp2002oj5vcew13a1dd', 'SPE-003', 'เครื่องคิดเลข Casio MX-12B 12 หลัก', NULL, 'GOODS', 'ชิ้น', '295.00', 1, '2026-02-11 22:33:31.718', '2026-02-11 22:33:31.718', '30.00', 'https://picsum.photos/seed/SPE-003/200/200', '2026-02-11 22:33:31.676', 'https://shopee.co.th/product/1/1003', 'cmlilif690000j5vcwc0evjmy'),
('cmlilwcp7002qj5vc54jpd52j', 'SPE-004', 'แฟ้มเอกสาร A4 คละสี 12 แฟ้ม', NULL, 'GOODS', 'ชิ้น', '120.00', 1, '2026-02-11 22:33:31.724', '2026-02-11 22:33:31.724', '10.00', 'https://picsum.photos/seed/SPE-004/200/200', '2026-02-11 22:33:31.676', 'https://shopee.co.th/product/1/1004', 'cmlilif690000j5vcwc0evjmy'),
('cmlilwcpf002sj5vc2d81zsqc', 'SPE-005', 'สายLAN Cat6 10 เมตร', NULL, 'GOODS', 'ชิ้น', '89.00', 1, '2026-02-11 22:33:31.731', '2026-02-11 22:33:31.731', NULL, 'https://picsum.photos/seed/SPE-005/200/200', '2026-02-11 22:33:31.676', 'https://shopee.co.th/product/1/1005', 'cmlilifbw0003j5vc7zicw2aq'),
('cmlim6h3a0002j59ons1j5tsn', 'LZD-API-001', 'โต๊ะทำงาน L-Shape 150x120cm', NULL, 'GOODS', 'ชิ้น', '5990.00', 1, '2026-02-11 22:41:23.974', '2026-02-11 22:41:23.974', '800.00', 'https://picsum.photos/seed/LZD-API-001/200/200', '2026-02-11 22:41:22.985', 'https://www.lazada.co.th/products/i2001.html', 'cmlim6h330000j59o13mydg8q'),
('cmlim6h3g0004j59o4uqt8c9s', 'LZD-API-002', 'เก้าอี้สำนักงาน Ergonomic Pro', NULL, 'GOODS', 'ชิ้น', '8990.00', 1, '2026-02-11 22:41:23.981', '2026-02-11 22:41:23.981', '1500.00', 'https://picsum.photos/seed/LZD-API-002/200/200', '2026-02-11 22:41:22.985', 'https://www.lazada.co.th/products/i2002.html', 'cmlim6h330000j59o13mydg8q'),
('cmlim6h3m0006j59ocwcftu28', 'LZD-API-003', 'ชั้นวางหนังสือ 5 ชั้น ไม้จริง', NULL, 'GOODS', 'ชิ้น', '2490.00', 1, '2026-02-11 22:41:23.986', '2026-02-11 22:41:23.986', '300.00', 'https://picsum.photos/seed/LZD-API-003/200/200', '2026-02-11 22:41:22.985', 'https://www.lazada.co.th/products/i2003.html', 'cmlim6h330000j59o13mydg8q'),
('cmlim6h3s0008j59ofmi65v8n', 'LZD-API-004', 'ไวท์บอร์ด 90x120cm พร้อมขาตั้ง', NULL, 'GOODS', 'ชิ้น', '1590.00', 0, '2026-02-11 22:41:23.993', '2026-02-11 22:59:39.268', '200.00', 'https://picsum.photos/seed/LZD-API-004/200/200', '2026-02-11 22:41:22.985', 'https://www.lazada.co.th/products/i2004.html', 'cmlilif690000j5vcwc0evjmy'),
('cmlim76hz000aj59ohv4itwjb', 'LNW-API-001', 'ปากกา Parker IM Ballpoint', NULL, 'GOODS', 'ชิ้น', '890.00', 1, '2026-02-11 22:41:56.903', '2026-02-11 23:01:12.772', '100.00', 'https://picsum.photos/seed/LNW-API-001/200/200', '2026-02-11 23:01:11.351', 'https://myshop.lnwshop.com/product/1', 'cmlilif880001j5vc2k7vxddp'),
('cmlim76i8000cj59oeo4xguog', 'LNW-API-002', 'กระเป๋าเอกสาร Samsonite', NULL, 'GOODS', 'ชิ้น', '2490.00', 1, '2026-02-11 22:41:56.912', '2026-02-11 23:01:12.794', '300.00', 'https://picsum.photos/seed/LNW-API-002/200/200', '2026-02-11 23:01:11.351', 'https://myshop.lnwshop.com/product/2', 'cmlilwcb30027j5vc80qo17an'),
('cmlim76ii000ej59ohcm0svyx', 'LNW-API-003', 'แท่นชาร์จ Anker 65W GaN', NULL, 'GOODS', 'ชิ้น', '1290.00', 1, '2026-02-11 22:41:56.922', '2026-02-11 23:01:12.904', '150.00', 'https://picsum.photos/seed/LNW-API-003/200/200', '2026-02-11 23:01:11.351', 'https://myshop.lnwshop.com/product/3', 'cmlilwcbo002ej5vc164zgvfn'),
('cmlim76in000gj59o096z9lz8', 'LNW-API-004', 'สายชาร์จ USB-C to C 2m', NULL, 'GOODS', 'ชิ้น', '290.00', 1, '2026-02-11 22:41:56.927', '2026-02-11 23:01:12.944', NULL, 'https://picsum.photos/seed/LNW-API-004/200/200', '2026-02-11 23:01:11.351', 'https://myshop.lnwshop.com/product/4', 'cmlilwcbo002ej5vc164zgvfn'),
('cmlim76xr000ij59o4686e9vu', 'SPE-API-001', 'เครื่องพิมพ์ HP Smart Tank 515 WiFi', NULL, 'GOODS', 'ชิ้น', '4990.00', 1, '2026-02-11 22:41:57.471', '2026-02-11 22:41:57.471', '500.00', 'https://picsum.photos/seed/SPE-API-001/200/200', '2026-02-11 22:41:57.437', 'https://shopee.co.th/product/shop1/i001', 'cmlilvs2c000dj5vcbsx5onpc'),
('cmlim76xx000kj59osl8j2xoo', 'SPE-API-002', 'กระดาษ A4 Navigator 80g (5 รีม)', NULL, 'GOODS', 'ชิ้น', '850.00', 1, '2026-02-11 22:41:57.477', '2026-02-11 22:41:57.477', '50.00', 'https://picsum.photos/seed/SPE-API-002/200/200', '2026-02-11 22:41:57.437', 'https://shopee.co.th/product/shop1/i002', 'cmlilif690000j5vcwc0evjmy'),
('cmlim76y8000nj59ov45gv64m', 'SPE-API-003', 'หมึกเติม Epson 003 แท้ 4 สี', NULL, 'GOODS', 'ชิ้น', '920.00', 1, '2026-02-11 22:41:57.488', '2026-02-11 22:41:57.488', '80.00', 'https://picsum.photos/seed/SPE-API-003/200/200', '2026-02-11 22:41:57.437', 'https://shopee.co.th/product/shop1/i003', 'cmlim76y4000lj59o2j3z5ii7'),
('cmlim76yd000pj59o7q159r2z', 'SPE-API-004', 'แฟ้มซอง A4 สีใส (20 ซอง)', NULL, 'GOODS', 'ชิ้น', '89.00', 1, '2026-02-11 22:41:57.493', '2026-02-11 22:41:57.493', '10.00', 'https://picsum.photos/seed/SPE-API-004/200/200', '2026-02-11 22:41:57.437', 'https://shopee.co.th/product/shop1/i004', 'cmlilif690000j5vcwc0evjmy'),
('cmlim76yi000rj59obh0hnfgu', 'SPE-API-005', 'เครื่องเย็บกระดาษ SDI Heavy Duty', NULL, 'GOODS', 'ชิ้น', '350.00', 1, '2026-02-11 22:41:57.498', '2026-02-11 22:41:57.498', '40.00', 'https://picsum.photos/seed/SPE-API-005/200/200', '2026-02-11 22:41:57.437', 'https://shopee.co.th/product/shop1/i005', 'cmlilif690000j5vcwc0evjmy'),
('cmlim77d1000tj59olau2fnc4', 'BC-API-001', 'น้ำยาล้างจาน Sunlight 900ml', NULL, 'GOODS', 'ชิ้น', '69.00', 1, '2026-02-11 22:41:58.022', '2026-02-11 22:41:58.022', '10.00', 'https://picsum.photos/seed/BC-API-001/200/200', '2026-02-11 22:41:57.989', 'https://www.bigc.co.th/product/sunlight-900', 'cmlilwbw1001vj5vcxzn9om6p'),
('cmlim77d8000vj59oameg7yzu', 'BC-API-002', 'กระดาษทิชชู่ Scott 24 ม้วน', NULL, 'GOODS', 'ชิ้น', '259.00', 1, '2026-02-11 22:41:58.029', '2026-02-11 22:41:58.029', '30.00', 'https://picsum.photos/seed/BC-API-002/200/200', '2026-02-11 22:41:57.989', 'https://www.bigc.co.th/product/scott-tissue-24', 'cmlilwbw1001vj5vcxzn9om6p'),
('cmlim77de000xj59onl9lip32', 'BC-API-003', 'ถ่าน Panasonic Eneloop AA 4 ก้อน', NULL, 'GOODS', 'ชิ้น', '450.00', 1, '2026-02-11 22:41:58.035', '2026-02-11 22:41:58.035', '50.00', 'https://picsum.photos/seed/BC-API-003/200/200', '2026-02-11 22:41:57.989', 'https://www.bigc.co.th/product/eneloop-aa-4', 'cmlilwby60024j5vc2jmtqyxk'),
('cmlim77dj000zj59oo8xe0o3x', 'BC-API-004', 'แอลกอฮอล์เจล Dettol 500ml', NULL, 'GOODS', 'ชิ้น', '149.00', 1, '2026-02-11 22:41:58.040', '2026-02-11 22:41:58.040', '20.00', 'https://picsum.photos/seed/BC-API-004/200/200', '2026-02-11 22:41:57.989', 'https://www.bigc.co.th/product/dettol-gel-500', 'cmlilwbw1001vj5vcxzn9om6p');

-- --------------------------------------------------------

--
-- Table structure for table `productgroup`
--

CREATE TABLE `productgroup` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `sortOrder` int NOT NULL DEFAULT '0',
  `isActive` tinyint(1) NOT NULL DEFAULT '1',
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `productgroup`
--

INSERT INTO `productgroup` (`id`, `name`, `description`, `sortOrder`, `isActive`, `createdAt`, `updatedAt`) VALUES
('cmlilif690000j5vcwc0evjmy', 'อุปกรณ์สำนักงาน', NULL, 0, 1, '2026-02-11 22:22:41.745', '2026-02-11 22:22:41.745'),
('cmlilif880001j5vc2k7vxddp', 'เครื่องเขียน', NULL, 0, 1, '2026-02-11 22:22:41.816', '2026-02-11 22:22:41.816'),
('cmlilifau0002j5vcpaxeyydi', 'คอมพิวเตอร์', NULL, 0, 1, '2026-02-11 22:22:41.910', '2026-02-11 22:22:41.910'),
('cmlilifbw0003j5vc7zicw2aq', 'อุปกรณ์เครือข่าย', NULL, 0, 1, '2026-02-11 22:22:41.949', '2026-02-11 22:22:41.949'),
('cmlilioc20004j5vchqw40mh3', 'บริการ IT', NULL, 0, 1, '2026-02-11 22:22:53.619', '2026-02-11 22:22:53.619'),
('cmlilvs1h0005j5vcxzjp8yc2', 'โน้ตบุ๊ค', NULL, 0, 1, '2026-02-11 22:33:04.950', '2026-02-11 22:33:04.950'),
('cmlilvs21000aj5vc949fbxhs', 'จอมอนิเตอร์', NULL, 0, 1, '2026-02-11 22:33:04.970', '2026-02-11 22:33:04.970'),
('cmlilvs2c000dj5vcbsx5onpc', 'เครื่องพิมพ์', NULL, 0, 1, '2026-02-11 22:33:04.980', '2026-02-11 22:33:04.980'),
('cmlilvs2n000gj5vc70ni1on3', 'อุปกรณ์ต่อพ่วง', NULL, 0, 1, '2026-02-11 22:33:04.991', '2026-02-11 22:33:04.991'),
('cmlilvs35000lj5vc168svl5d', 'สตอเรจ', NULL, 0, 1, '2026-02-11 22:33:05.010', '2026-02-11 22:33:05.010'),
('cmlilvs3h000oj5vc2yicq9nf', 'อุปกรณ์คอมพิวเตอร์', NULL, 0, 1, '2026-02-11 22:33:05.021', '2026-02-11 22:33:05.021'),
('cmlilvy7m000rj5vczbswbvja', 'Mac', NULL, 0, 1, '2026-02-11 22:33:12.946', '2026-02-11 22:33:12.946'),
('cmlilvy85000wj5vcvw6wpyth', 'iPhone', NULL, 0, 1, '2026-02-11 22:33:12.966', '2026-02-11 22:33:12.966'),
('cmlilvy8j000zj5vctj6evmkw', 'iPad', NULL, 0, 1, '2026-02-11 22:33:12.980', '2026-02-11 22:33:12.980'),
('cmlilvy8x0012j5vc8s7n09uc', 'Apple Watch', NULL, 0, 1, '2026-02-11 22:33:12.993', '2026-02-11 22:33:12.993'),
('cmlilvy990015j5vcxgd5iu1f', 'อุปกรณ์เสริม', NULL, 0, 1, '2026-02-11 22:33:13.005', '2026-02-11 22:33:13.005'),
('cmlilw4pk0018j5vc7fqxms2l', 'เฟอร์นิเจอร์สำนักงาน', NULL, 0, 1, '2026-02-11 22:33:21.368', '2026-02-11 22:33:21.368'),
('cmlilwbh4001jj5vcvfgum3xr', 'เครื่องเขียนและอุปกรณ์', NULL, 0, 1, '2026-02-11 22:33:30.137', '2026-02-11 22:33:30.137'),
('cmlilwbhw001qj5vcb9oq719d', 'เครื่องดื่ม', NULL, 0, 1, '2026-02-11 22:33:30.164', '2026-02-11 22:33:30.164'),
('cmlilwbw1001vj5vcxzn9om6p', 'ของใช้สำนักงาน', NULL, 0, 1, '2026-02-11 22:33:30.674', '2026-02-11 22:33:30.674'),
('cmlilwby60024j5vc2jmtqyxk', 'อุปกรณ์ไฟฟ้า', NULL, 0, 1, '2026-02-11 22:33:30.750', '2026-02-11 22:33:30.750'),
('cmlilwcb30027j5vc80qo17an', 'กระเป๋า', NULL, 0, 1, '2026-02-11 22:33:31.216', '2026-02-11 22:33:31.216'),
('cmlilwcbo002ej5vc164zgvfn', 'อุปกรณ์ไอที', NULL, 0, 1, '2026-02-11 22:33:31.236', '2026-02-11 22:33:31.236'),
('cmlim6h330000j59o13mydg8q', 'เฟอร์นิเจอร์', NULL, 0, 1, '2026-02-11 22:41:23.967', '2026-02-11 22:41:23.967'),
('cmlim76y4000lj59o2j3z5ii7', 'หมึกพิมพ์', NULL, 0, 1, '2026-02-11 22:41:57.484', '2026-02-11 22:41:57.484');

-- --------------------------------------------------------

--
-- Table structure for table `project`
--

CREATE TABLE `project` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `code` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `customerId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `unitId` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `title` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `startDate` datetime(3) DEFAULT NULL,
  `endDate` datetime(3) DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `project`
--

INSERT INTO `project` (`id`, `code`, `customerId`, `unitId`, `title`, `startDate`, `endDate`, `createdAt`, `updatedAt`) VALUES
('project-sample-001', 'PRJ-2602-0001', 'cust-school-001', 'unit-it-001', 'พัฒนาระบบจัดการเรียนการสอนออนไลน์', '2026-02-01 00:00:00.000', '2026-06-30 00:00:00.000', '2026-02-11 21:20:45.736', '2026-02-12 14:08:44.575');

-- --------------------------------------------------------

--
-- Table structure for table `projectmilestone`
--

CREATE TABLE `projectmilestone` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `projectId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `title` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `amount` decimal(12,2) NOT NULL,
  `dueDate` datetime(3) DEFAULT NULL,
  `isBilled` tinyint(1) NOT NULL DEFAULT '0'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `projectmilestone`
--

INSERT INTO `projectmilestone` (`id`, `projectId`, `title`, `amount`, `dueDate`, `isBilled`) VALUES
('cmljjb1nc0000j5m0saucr13e', 'project-sample-001', 'งวดที่ 1: วิเคราะห์ระบบและออกแบบ', '50000.00', '2026-03-01 00:00:00.000', 0),
('cmljjb1nc0001j5m078tfmbzd', 'project-sample-001', 'งวดที่ 2: พัฒนาระบบ1', '100000.00', '2026-04-30 00:00:00.000', 0),
('cmljjb1nc0002j5m0wb06h35v', 'project-sample-001', 'งวดที่ 3: ทดสอบและส่งมอบ1', '50000.00', '2026-06-30 00:00:00.000', 0);

-- --------------------------------------------------------

--
-- Table structure for table `setting`
--

CREATE TABLE `setting` (
  `key` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `value` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `updatedAt` datetime(3) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `setting`
--

INSERT INTO `setting` (`key`, `value`, `updatedAt`) VALUES
('CARRIER_DEFAULT', 'Flash Express', '2026-02-11 21:20:45.718'),
('COMPANY_ADDRESS', '123/45 ถ.สุขุมวิท แขวงคลองเตย เขตคลองเตย กรุงเทพมหานคร 10110', '2026-02-11 21:20:45.715'),
('COMPANY_BRANCH', '00000', '2026-02-11 21:20:45.716'),
('COMPANY_NAME', 'หจก. ตัวอย่าง เทคโนโลยี', '2026-02-11 21:20:45.710'),
('COMPANY_TAXID', '0123456789012', '2026-02-11 21:20:45.713'),
('DEFAULT_WHT_SERVICE_RATE', '3.00', '2026-02-11 21:20:45.701'),
('DOC_PREFIX_INV', 'INV', '2026-02-11 21:20:45.705'),
('DOC_PREFIX_QUOT', 'QT', '2026-02-11 21:20:45.704'),
('DOC_PREFIX_TAX', 'TX', '2026-02-11 21:20:45.707'),
('VAT_RATE', '7.00', '2026-02-11 21:20:45.692');

-- --------------------------------------------------------

--
-- Table structure for table `shipment`
--

CREATE TABLE `shipment` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `orderId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `carrier` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `trackingNo` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `shippedAt` datetime(3) DEFAULT NULL,
  `shippingFee` decimal(12,2) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `user`
--

CREATE TABLE `user` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `passwordHash` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `role` enum('ADMIN','STAFF') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'STAFF',
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `withholdingtax`
--

CREATE TABLE `withholdingtax` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `documentId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `rate` decimal(5,2) NOT NULL,
  `baseAmount` decimal(12,2) NOT NULL,
  `taxAmount` decimal(12,2) NOT NULL,
  `certificateNo` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `certificateDate` datetime(3) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `withholdingtax`
--

INSERT INTO `withholdingtax` (`id`, `documentId`, `rate`, `baseAmount`, `taxAmount`, `certificateNo`, `certificateDate`) VALUES
('cmljjj53m0009j5m0ur8dbz3f', 'cmljjj53l0004j5m0f0g4j1r7', '3.00', '3499.00', '104.97', '223232', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `_prisma_migrations`
--

CREATE TABLE `_prisma_migrations` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `checksum` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `finished_at` datetime(3) DEFAULT NULL,
  `migration_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `logs` text COLLATE utf8mb4_unicode_ci,
  `rolled_back_at` datetime(3) DEFAULT NULL,
  `started_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `applied_steps_count` int UNSIGNED NOT NULL DEFAULT '0'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `_prisma_migrations`
--

INSERT INTO `_prisma_migrations` (`id`, `checksum`, `finished_at`, `migration_name`, `logs`, `rolled_back_at`, `started_at`, `applied_steps_count`) VALUES
('64b78b46-d72f-4c87-8726-d5f6a52a5528', '1e442533ac32088314354fbe100b8c110603b4c219fb18038dda1ec9e8953b36', '2025-11-29 21:08:40.241', '20251130040627_update_for_linux_case_sensitive', '', NULL, '2025-11-29 21:08:40.241', 0),
('757587ca-cba1-4746-965a-0b389114e191', '062f16f5f1d0112089a90dfbbc2d2c49dec4cf8c10b8cb87ea7ae41b0f916c48', '2025-11-28 13:53:45.639', '20251128135345_accnextgen', NULL, NULL, '2025-11-28 13:53:45.331', 1),
('efe57291-5b32-4683-b68a-4ac8c02af1ce', '922f7cc2d392d40454851ebc11fe25947831819ebe53764150f724fc32c78c8e', '2025-11-29 05:03:21.615', '20251129050321_add_file_hash_nullable', NULL, NULL, '2025-11-29 05:03:21.593', 1);

--
-- Indexes for dumped tables
--

--
-- Indexes for table `attachment`
--
ALTER TABLE `attachment`
  ADD PRIMARY KEY (`id`),
  ADD KEY `Attachment_orderId_fkey` (`orderId`),
  ADD KEY `Attachment_documentId_fkey` (`documentId`),
  ADD KEY `Attachment_expenseId_fkey` (`expenseId`),
  ADD KEY `Attachment_paymentId_fkey` (`paymentId`),
  ADD KEY `Attachment_projectId_fkey` (`projectId`);

--
-- Indexes for table `customer`
--
ALTER TABLE `customer`
  ADD PRIMARY KEY (`id`),
  ADD KEY `Customer_name_idx` (`name`),
  ADD KEY `Customer_type_idx` (`type`);

--
-- Indexes for table `customerunit`
--
ALTER TABLE `customerunit`
  ADD PRIMARY KEY (`id`),
  ADD KEY `CustomerUnit_customerId_name_idx` (`customerId`,`name`);

--
-- Indexes for table `document`
--
ALTER TABLE `document`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `Document_number_key` (`number`),
  ADD KEY `Document_type_issueDate_idx` (`type`,`issueDate`),
  ADD KEY `Document_customerId_issueDate_idx` (`customerId`,`issueDate`),
  ADD KEY `Document_orderId_fkey` (`orderId`),
  ADD KEY `Document_projectId_fkey` (`projectId`);

--
-- Indexes for table `documentitem`
--
ALTER TABLE `documentitem`
  ADD PRIMARY KEY (`id`),
  ADD KEY `DocumentItem_documentId_fkey` (`documentId`),
  ADD KEY `DocumentItem_productId_fkey` (`productId`);

--
-- Indexes for table `expense`
--
ALTER TABLE `expense`
  ADD PRIMARY KEY (`id`),
  ADD KEY `Expense_expenseDate_idx` (`expenseDate`),
  ADD KEY `Expense_category_expenseDate_idx` (`category`,`expenseDate`);

--
-- Indexes for table `monthlyclose`
--
ALTER TABLE `monthlyclose`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `MonthlyClose_year_month_key` (`year`,`month`),
  ADD KEY `MonthlyClose_year_month_idx` (`year`,`month`);

--
-- Indexes for table `monthlysummary`
--
ALTER TABLE `monthlysummary`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `MonthlySummary_year_month_key` (`year`,`month`);

--
-- Indexes for table `order`
--
ALTER TABLE `order`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `Order_code_key` (`code`),
  ADD KEY `Order_status_orderDate_idx` (`status`,`orderDate`),
  ADD KEY `Order_customerId_orderDate_idx` (`customerId`,`orderDate`);

--
-- Indexes for table `orderitem`
--
ALTER TABLE `orderitem`
  ADD PRIMARY KEY (`id`),
  ADD KEY `OrderItem_orderId_fkey` (`orderId`),
  ADD KEY `OrderItem_productId_fkey` (`productId`);

--
-- Indexes for table `payment`
--
ALTER TABLE `payment`
  ADD PRIMARY KEY (`id`),
  ADD KEY `Payment_receivedAt_idx` (`receivedAt`),
  ADD KEY `Payment_orderId_fkey` (`orderId`),
  ADD KEY `Payment_documentId_fkey` (`documentId`);

--
-- Indexes for table `product`
--
ALTER TABLE `product`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `Product_sku_key` (`sku`),
  ADD KEY `Product_name_idx` (`name`),
  ADD KEY `Product_category_isActive_idx` (`category`,`isActive`),
  ADD KEY `Product_groupId_idx` (`groupId`);

--
-- Indexes for table `productgroup`
--
ALTER TABLE `productgroup`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `ProductGroup_name_key` (`name`),
  ADD KEY `ProductGroup_sortOrder_name_idx` (`sortOrder`,`name`);

--
-- Indexes for table `project`
--
ALTER TABLE `project`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `Project_code_key` (`code`),
  ADD KEY `Project_customerId_unitId_idx` (`customerId`,`unitId`),
  ADD KEY `Project_unitId_fkey` (`unitId`);

--
-- Indexes for table `projectmilestone`
--
ALTER TABLE `projectmilestone`
  ADD PRIMARY KEY (`id`),
  ADD KEY `ProjectMilestone_projectId_fkey` (`projectId`);

--
-- Indexes for table `setting`
--
ALTER TABLE `setting`
  ADD PRIMARY KEY (`key`);

--
-- Indexes for table `shipment`
--
ALTER TABLE `shipment`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `Shipment_orderId_key` (`orderId`);

--
-- Indexes for table `user`
--
ALTER TABLE `user`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `User_email_key` (`email`),
  ADD KEY `User_email_idx` (`email`);

--
-- Indexes for table `withholdingtax`
--
ALTER TABLE `withholdingtax`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `WithholdingTax_documentId_key` (`documentId`);

--
-- Indexes for table `_prisma_migrations`
--
ALTER TABLE `_prisma_migrations`
  ADD PRIMARY KEY (`id`);

--
-- Constraints for dumped tables
--

--
-- Constraints for table `attachment`
--
ALTER TABLE `attachment`
  ADD CONSTRAINT `Attachment_documentId_fkey` FOREIGN KEY (`documentId`) REFERENCES `document` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `Attachment_expenseId_fkey` FOREIGN KEY (`expenseId`) REFERENCES `expense` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `Attachment_orderId_fkey` FOREIGN KEY (`orderId`) REFERENCES `order` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `Attachment_paymentId_fkey` FOREIGN KEY (`paymentId`) REFERENCES `payment` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `Attachment_projectId_fkey` FOREIGN KEY (`projectId`) REFERENCES `project` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Constraints for table `customerunit`
--
ALTER TABLE `customerunit`
  ADD CONSTRAINT `CustomerUnit_customerId_fkey` FOREIGN KEY (`customerId`) REFERENCES `customer` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `document`
--
ALTER TABLE `document`
  ADD CONSTRAINT `Document_customerId_fkey` FOREIGN KEY (`customerId`) REFERENCES `customer` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT `Document_orderId_fkey` FOREIGN KEY (`orderId`) REFERENCES `order` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `Document_projectId_fkey` FOREIGN KEY (`projectId`) REFERENCES `project` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Constraints for table `documentitem`
--
ALTER TABLE `documentitem`
  ADD CONSTRAINT `DocumentItem_documentId_fkey` FOREIGN KEY (`documentId`) REFERENCES `document` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `DocumentItem_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `product` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Constraints for table `order`
--
ALTER TABLE `order`
  ADD CONSTRAINT `Order_customerId_fkey` FOREIGN KEY (`customerId`) REFERENCES `customer` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

--
-- Constraints for table `orderitem`
--
ALTER TABLE `orderitem`
  ADD CONSTRAINT `OrderItem_orderId_fkey` FOREIGN KEY (`orderId`) REFERENCES `order` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `OrderItem_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `product` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Constraints for table `payment`
--
ALTER TABLE `payment`
  ADD CONSTRAINT `Payment_documentId_fkey` FOREIGN KEY (`documentId`) REFERENCES `document` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `Payment_orderId_fkey` FOREIGN KEY (`orderId`) REFERENCES `order` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Constraints for table `product`
--
ALTER TABLE `product`
  ADD CONSTRAINT `Product_groupId_fkey` FOREIGN KEY (`groupId`) REFERENCES `productgroup` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Constraints for table `project`
--
ALTER TABLE `project`
  ADD CONSTRAINT `Project_customerId_fkey` FOREIGN KEY (`customerId`) REFERENCES `customer` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT `Project_unitId_fkey` FOREIGN KEY (`unitId`) REFERENCES `customerunit` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Constraints for table `projectmilestone`
--
ALTER TABLE `projectmilestone`
  ADD CONSTRAINT `ProjectMilestone_projectId_fkey` FOREIGN KEY (`projectId`) REFERENCES `project` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `shipment`
--
ALTER TABLE `shipment`
  ADD CONSTRAINT `Shipment_orderId_fkey` FOREIGN KEY (`orderId`) REFERENCES `order` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `withholdingtax`
--
ALTER TABLE `withholdingtax`
  ADD CONSTRAINT `WithholdingTax_documentId_fkey` FOREIGN KEY (`documentId`) REFERENCES `document` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
