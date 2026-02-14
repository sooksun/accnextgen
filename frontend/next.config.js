const path = require('path')

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // ระบุ root directory เพื่อแก้ warning เกี่ยวกับ multiple lockfiles
  outputFileTracingRoot: path.join(__dirname, '../'),
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '**',
        port: '',
        pathname: '/**',
      },
      // สำหรับ Production Server ให้เพิ่ม hostname ที่ต้องการ
      // {
      //   protocol: 'http',
      //   hostname: 'YOUR_SERVER_IP',
      //   port: '',
      //   pathname: '/**',
      // },
    ],
  },
  // เพิ่มการจัดการ error สำหรับ production
  onDemandEntries: {
    maxInactiveAge: 25 * 1000,
    pagesBufferLength: 2,
  },
  // เพิ่มการ log error
  logging: {
    fetches: {
      fullUrl: true,
    },
  },
}

module.exports = nextConfig

