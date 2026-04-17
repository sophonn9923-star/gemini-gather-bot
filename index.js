const { Game } = require("@gathertown/gather-game-client");
const { GoogleGenerativeAI } = require("@google/generative-ai");
require("dotenv").config();

// --- 1. การตั้งค่า Gemini API ---
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const model = genAI.getGenerativeModel({ 
  model: "gemini-1.5-flash",
  systemInstruction: "คุณคือ Gemini AI ผู้ช่วยอัจฉริยะประจำออฟฟิศเสมือนของคุณแมน คุณมีหน้าที่ต้อนรับแขกและช่วยเหลือคุณแมนด้วยความสุภาพ"
});

// --- 2. การตั้งค่าการเชื่อมต่อ Gather.town ---
const SPACE_ID = process.env.SPACE_ID;
const API_KEY = process.env.GATHER_API_KEY;

const game = new Game(SPACE_ID, () => Promise.resolve({ apiKey: API_KEY }));

game.connect();

// --- 3. ส่วนการทำงาน (Logic) ---

game.subscribeToConnection((connected) => {
  if (connected) {
    console.log("✅ Gemini Bot ออนไลน์ในออฟฟิศของคุณแมนแล้ว!");
    game.setName("Gemini Assistant");
    game.setTextStatus("พร้อมช่วยเหลือครับ 🦾");
  } else {
    console.log("❌ การเชื่อมต่อล้มเหลว...");
  }
});

game.subscribeToEvent("playerChats", async (data, context) => {
  const messageText = data.playerChats.contents;
  const senderName = context.player.name || "คุณ";

  // ป้องกันบอทตอบแชทตัวเอง
  if (context.playerId === game.completePlayer.id) return;

  // แก้ไขจุดที่เคย Error: ใช้เครื่องหมาย Backtick ครอบข้อความ
  console.log(`💬 ได้รับข้อความจาก ${senderName}: ${messageText}`);

  try {
    const prompt = `คุณกำลังคุยกับ ${senderName} ในออฟฟิศเสมือน เขาพูดว่า: "${messageText}"`;
    const result = await model.generateContent(prompt);
    const responseText = result.response.text();

    game.chat(
      data.playerChats.recipient, 
      [], 
      data.playerChats.mapId, 
      { contents: responseText }
    );
    
    console.log(`🤖 ตอบกลับ: ${responseText}`);

  } catch (error) {
    console.error("⚠️ Gemini API Error:", error);
  }
});

// --- 4. ส่วนป้องกันบอทหลับ (Web Server สำหรับ Render) ---
const http = require("http");
const server = http.createServer((req, res) => {
  res.writeHead(200, { "Content-Type": "text/plain" });
  res.end("Bot is running\n");
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`🌐 Server running on port ${PORT}`);
});
