/**
 * ไฟล์สตาร์ทสำหรับ Passenger / โฮสต์ที่ต้องชี้ไปที่ไฟล์ .js
 * ใช้เมื่อ panel ต้องการ "Application startup file" เป็น path ไฟล์
 *
 * บนเซิร์ฟเวอร์: อัปโหลดโปรเจกต์แล้วรัน npm install && npm run build
 * จากนั้นตั้ง Application startup file = server.js
 */
const { createServer } = require("http");
const { parse } = require("url");
const next = require("next");

const dev = process.env.NODE_ENV !== "production";
const hostname = "localhost";
const port = parseInt(process.env.PORT || "3000", 10);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error("Error handling request", req.url, err);
      res.statusCode = 500;
      res.end("Internal server error");
    }
  })
    .once("error", (err) => {
      console.error(err);
      process.exit(1);
    })
    .listen(port, () => {
      console.log(`> Ready on http://${hostname}:${port}`);
    });
});
