const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, '..', 'cache', 'muted_chats.json');

function readDB() {
    const dir = path.dirname(dbPath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    if (!fs.existsSync(dbPath)) fs.writeFileSync(dbPath, JSON.stringify({}));
    return JSON.parse(fs.readFileSync(dbPath, 'utf-8'));
}

function writeDB(data) {
    fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
}

module.exports = {
    name: "اسكتو",
    aliases: ["صمت"],
    
    async execute(api, event) {
        const { threadID, senderID, messageID } = event;
        try {
            // --- هنا تم التصحيح ---
            const threadInfo = await api.getThreadInfo(threadID);
            const adminIDs = threadInfo.adminIDs.map(e => e.id);

            if (!adminIDs.includes(senderID)) {
                return api.sendMessage("🚫 | هذا الأمر مخصص للمشرفين فقط.", threadID, messageID);
            }

            const muteMessageText = `🎮 [ نظـــام السيطـــرة مُفعّـــل ] 🎮

يا أعضاء، لقد تجاوزتم حدود الثرثرة.🔰〽️☣️🚸⚠️⭕🚸☢️〽️☣️🔰❌
بناءً عليه، قررت الإدارة إغلاق أفواهكم مؤقتًا. 🤫〽️⭕〽️☢️〽️⚠️

القاعدة بسيطة: الصمت التام.☢️⚠️⚠️☣️🚸

أي همسة، حرف، أو حتى ملصق من أي عضو (غير مشرف) سيعني طرده خارج أسوار هذه المجموعة بلا عودة.

هل تجرؤ على اختبار النظام؟ نحن ننتظر. 😉

للمشرفين فقط: تفاعل مع هذه الرسالة لإعادة فتح أبواب الكلام.`;

            const info = await api.sendMessage(muteMessageText, threadID);

            const imagePath = path.join(__dirname, 'cache', 's.png');
            if (fs.existsSync(imagePath)) {
                api.sendMessage({
                    attachment: fs.createReadStream(imagePath)
                }, threadID);
            } else {
                console.log("تحذير: ملف s.png غير موجود في مجلد الكاش.");
            }

            const db = readDB();
            db[threadID] = { muted: true, messageID: info.messageID };
            writeDB(db);

        } catch (error) {
            console.error("خطأ في أمر اسكتو:", error);
            api.sendMessage("حدث خطأ أثناء تفعيل وضع الصمت.", threadID, messageID);
        }
    }
};
