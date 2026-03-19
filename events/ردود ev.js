// events/autoReply.js
const fs = require("fs");
const path = require("path");
const DB_PATH = path.join(__dirname, "..", "data", "replies.json");

let cache = null;
let lastRead = 0;

function loadReplies() {
  const now = Date.now();
  if (cache && now - lastRead < 2000) return cache; // كاش لمدة 2 ثانية

  try {
    const data = fs.readFileSync(DB_PATH, "utf-8");
    cache = JSON.parse(data);
    lastRead = now;
    return cache;
  } catch {
    return { global: {}, groups: {} };
  }
}

module.exports = async function autoReply(api, event) {
  const { threadID, senderID, body } = event;
  if (!body) return;
  if (threadID === senderID) return; // ما يردش في الخاص (اختياري)
  if (event.isGroup === false) return; // اختياري: يشتغل فقط في القروبات

  const msg = body.trim().toLowerCase();
  const db = loadReplies();

  const groupReplies = db.groups[threadID] || {};
  const allReplies = { ...db.global, ...groupReplies };

  for (const [trigger, reply] of Object.entries(allReplies)) {
    if (msg.includes(trigger)) {
      // تأخير عشوائي عشان ما يبدو روبوت
      setTimeout(() => {
        api.sendMessage(reply, threadID);
      }, Math.random() * 1500 + 500);
      return; // يرد على أول تطابق فقط
    }
  }
};