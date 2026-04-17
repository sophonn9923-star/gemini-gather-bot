const { GoogleGenerativeAI } = require("@google/generative-ai");
const OpenAI = require("openai");
require("dotenv").config();

// ตั้งค่า Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const gemini = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

// ตั้งค่า ChatGPT
const chatgpt = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function startCollaboration(userTask) {
  console.log(`🚀 เริ่มงาน: ${userTask}`);

  // 1. ส่งงานให้ Gemini เริ่มต้น
  console.log("🤖 Gemini กำลังร่างแผนงาน...");
  const geminiResult = await gemini.generateContent(`คุณคือผู้เชี่ยวชาญด้านเทคนิค จงร่างแผนงานสำหรับงานนี้: ${userTask}`);
  const geminiDraft = geminiResult.response.text();
  console.log("--- ร่างจาก Gemini ---");
  console.log(geminiDraft);

  // 2. ส่งร่างของ Gemini ให้ ChatGPT ตรวจสอบและปรับปรุง
  console.log("\n🤖 ChatGPT กำลังตรวจสอบและสรุปผล...");
  const chatgptResult = await chatgpt.chat.completions.create({
    model: "gpt-4o",
    messages: [
      { role: "system", content: "คุณคือผู้ตรวจงาน (Reviewer) จงอ่านร่างแผนงานจาก Gemini และปรับปรุงให้สมบูรณ์ที่สุด พร้อมสรุปเป็นข้อๆ" },
      { role: "user", content: geminiDraft }
    ],
  });

  const finalWork = chatgptResult.choices[0].message.content;
  console.log("--- ผลงานสุดท้าย (Final Result) ---");
  console.log(finalWork);
  
  return finalWork;
}

// ทดสอบสั่งงาน
const myTask = "ออกแบบแผนการทำ Predictive Maintenance สำหรับมอเตอร์โรงงาน";
startCollaboration(myTask);

// ส่วนของ Web Server สำหรับ Render (ห้ามลบ)
const express = require('express');
const app = express();
app.get('/', (req, res) => res.send('AI Collaboration Service is Running!'));
app.listen(process.env.PORT || 3000);
