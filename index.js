const { Game } = require("@gathertown/gather-game-client");
const { GoogleGenerativeAI } = require("@google/generative-ai");
require("dotenv").config(); // สำหรับดึงค่าจาก Environment Variables

// --- 1. การตั้งค่า Gemini API ---
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// ปรับแต่งบุคลิกของบอทที่นี่ (System Instruction)
const model = genAI.getGenerativeModel({
model: "gemini-1.5-flash",
systemInstruction: "คุณคือ Gemini AI ผู้ช่วยอัจฉริยะประจำออฟฟิศของคุณแมน (คุณแมนเป็นผู้เชี่ยวชาญด้าน Predictive Maintenance และ Vibration Analysis) คุณมีหน้าที่ต้อนรับแขก ให้ข้อมูลทั่วไป และช่วยเหลือคุณแมนด้วยความสุภาพและเป็นมืออาชีพ"
});

// --- 2. การตั้งค่าการเชื่อมต่อ Gather.town ---
// ดึงค่ามาจาก Environment Variables ใน Render
const SPACE_ID = process.env.SPACE_ID;
const API_KEY = process.env.GATHER_API_KEY;

// สร้าง Instance ของเกม
const game = new Game(SPACE_ID, () => Promise.resolve({ apiKey: API_KEY }));

// เริ่มต้นการเชื่อมต่อ
game.connect();

// --- 3. ส่วนการทำงาน (Logic) ---

// เมื่อบอทเชื่อมต่อสำเร็จ
game.subscribeToConnection((connected) => {
if (connected) {
console.log("✅ Gemini Bot ออนไลน์ในออฟฟิศของคุณแมนแล้ว!");

// ตั้งชื่อให้บอทในเกม (เลือกเปลี่ยนได้ตามใจชอบ)
game.setName("Gemini Assistant");

// ตั้งสถานะ (Status)
game.setTextStatus("พร้อมช่วยเหลือครับ 🦾");
} else {
console.log("❌ การเชื่อมต่อล้มเหลว...");
}
});

// เมื่อมีคนพิมพ์ Chat (แบบ Nearby หรือ Private)
game.subscribeToEvent("playerChats", async (data, context) => {
const messageText = data.playerChats.contents;
const senderName = context.player.name || "คุณ";
const isDirectChat = data.playerChats.messageType === "whisper"; // เช็คว่าเป็นแชทส่วนตัวไหม

// ป้องกันบอทตอบแชทตัวเอง
if (context.playerId === game.completePlayer.id) return;

console.log(💬 ได้รับข้อความจาก ${senderName}: ${messageText});

try {
// ส่งข้อความไปให้ Gemini ประมวลผล
const prompt = คุณแมนชื่อว่า 'แมน' ตอนนี้คุณกำลังคุยกับ ${senderName} ในออฟฟิศเสมือน เขาพูดว่า: "${messageText}";
const result = await model.generateContent(prompt);
const responseText = result.response.text();

// ส่งคำตอบกลับไปในช่องแชทเดิม
game.chat(
  data.playerChats.recipient, // ส่งกลับหาคนเดิม
  [], 
  data.playerChats.mapId, 
  { contents: responseText }
);

console.log(`🤖 ตอบกลับ: ${responseText}`);
} catch (error) {
console.error("⚠️ เกิดข้อผิดพลาดกับ Gemini API:", error);
game.chat(data.playerChats.recipient, [], data.playerChats.mapId, {
contents: "ขออภัยครับ ดูเหมือนระบบประมวลผลของผมจะขัดข้องนิดหน่อย",
});
}
});

// --- 4. ป้องกันบอทหลับ (สำหรับ Render Free Tier) ---
// สร้าง HTTP Server ง่ายๆ เพื่อให้ Render ตรวจสอบว่าแอปยังรันอยู่
const http = require("http");
const server = http.createServer((req, res) => {
res.writeHead(200, { "Content-Type": "text/plain" });
res.end("Gemini Bot is running!\n");
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
console.log(🌐 Web server listening on port ${PORT});
});
