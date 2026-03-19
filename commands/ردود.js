// commands/ردود.js
const fs = require("fs");
const path = require("path");
const DB_PATH = path.join(__dirname, "..", "data", "replies.json");

function loadDB() {
  if (!fs.existsSync(DB_PATH)) {
    fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
    fs.writeFileSync(DB_PATH, JSON.stringify({ global: {}, groups: {} }, null, 2));
  }
  try {
    return JSON.parse(fs.readFileSync(DB_PATH, "utf-8"));
  } catch {
    const newDB = { global: {}, groups: {} };
    fs.writeFileSync(DB_PATH, JSON.stringify(newDB, null, 2));
    return newDB;
  }
}

function saveDB(db) {
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
}

module.exports = {
  name: "ردود",
  aliases: ["reply", "replies"],
  description: "إضافة وعرض وحذف الردود التلقائية",

  async execute(api, event, args) {
    const { threadID, messageID, senderID } = event;
    const isGroup = threadID !== senderID;
    const db = loadDB();

    if (args.length === 0) {
      return api.sendMessage(
        "🔹 أوامر الردود:\n\n" +
        "• ردود كلمة=الرد → إضافة\n" +
        "• ردود عرض → عرض الكل\n" +
        "• ردود حذف كلمة → حذف رد معين",
        threadID, messageID
      );
    }

    const fullCmd = args.join(" ").trim();

    // إضافة رد
    if (fullCmd.includes("=")) {
      let [key, ...valParts] = fullCmd.split("=");
      const trigger = key.trim();
      const reply = valParts.join("=").trim();

      if (!trigger || !reply) {
        return api.sendMessage("❌ الصيغة: ردود كلمة=الرد", threadID, messageID);
      }

      const keyLower = trigger.toLowerCase();

      if (isGroup) {
        db.groups[threadID] = db.groups[threadID] || {};
        db.groups[threadID][keyLower] = reply;
      } else {
        db.global[keyLower] = reply;
      }

      saveDB(db);
      return api.sendMessage(
        `✅ تمت الإضافة ${isGroup ? "في القروب" : "عام"}:\n\n"${trigger}" → "${reply}"`,
        threadID, messageID
      );
    }

    // عرض الردود
    if (["عرض", "list", "show"].includes(fullCmd)) {
      const globalReplies = Object.entries(db.global);
      const groupReplies = isGroup && db.groups[threadID] ? Object.entries(db.groups[threadID]) : [];

      const all = [...globalReplies, ...groupReplies];
      if (all.length === 0) {
        return api.sendMessage("😔 مافي ردود مضافة بعد", threadID, messageID);
      }

      const list = all.map(([k, v], i) => `${i+1}. ${k} → ${v}`).join("\n");
      const type = isGroup ? "(القروب + العام)" : "(العام فقط)";
      return api.sendMessage(`📋 الردود المتاحة ${type} [${all.length}]:\n\n${list}`, threadID, messageID);
    }

    // حذف رد
    if (fullCmd.startsWith("حذف ")) {
      const keyToDelete = fullCmd.slice(5).trim().toLowerCase();
      if (!keyToDelete) return api.sendMessage("اكتب اسم الرد اللي تبي تحذفه", threadID, messageID);

      let deleted = false;
      let from = "";

      if (isGroup && db.groups[threadID]?.[keyToDelete]) {
        delete db.groups[threadID][keyToDelete];
        if (Object.keys(db.groups[threadID]).length === 0) delete db.groups[threadID];
        deleted = true;
        from = "القروب";
      } else if (db.global[keyToDelete]) {
        delete db.global[keyToDelete];
        deleted = true;
        from = "العام";
      }

      if (deleted) {
        saveDB(db);
        return api.sendMessage(`🗑️ تم حذف "${keyToDelete}" من ${from}`, threadID, messageID);
      } else {
        return api.sendMessage(`❌ مافي رد باسم "${keyToDelete}"`, threadID, messageID);
      }
    }

    // لو كتب حاجة غلط
    api.sendMessage("الأمر غلط، استخدم:\nردود عرض\nردود كلمة=الرد\nردود حذف كلمة", threadID, messageID);
  }
};