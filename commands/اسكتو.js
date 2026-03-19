const fs = require('fs');
const path = require('path');

// تحديد مسار قاعدة البيانات
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
            // التحقق من صلاحيات المشرف
            const threadInfo = await api.getThreadInfo(threadID);
            const adminIDs = threadInfo.adminIDs.map(e => e.id);

            if (!adminIDs.includes(senderID)) {
                return api.sendMessage("🚫 | هذا الأمر مخصص للمشرفين فقط.", threadID, messageID);
            }

            // 1. إرسال النص التحذيري أولاً
            const warningText = `⚠️ [ تفعيل نظام الصمت ] ⚠️\n\nيُمنع الكلام نهائياً لغير المشرفين.\nسيتم طرد أي مخالف فوراً.\n\n👇 تفاعل مع الصورة أدناه لفك الحظر.`;
            await api.sendMessage(warningText, threadID);

            // 2. إرسال الصورة بشكل منفصل
            const imagePath = path.join(__dirname, 'commands', 'cache', 's.png');
            
            if (!fs.existsSync(imagePath)) {
                return api.sendMessage("❌ | خطأ: ملف الصورة s.png غير موجود في الكاش.", threadID);
            }

            const info = await api.sendMessage({
                attachment: fs.createReadStream(imagePath)
            }, threadID);

            // 3. تخزين ID الصورة حصراً ليكون هو مفتاح فك الحظر عبر التفاعل
            const db = readDB();
            db[threadID] = { 
                muted: true, 
                messageID: info.messageID // هذا الـ ID الخاص بالصورة فقط
            };
            writeDB(db);

        } catch (error) {
            console.error("خطأ في تنفيذ الأمر:", error);
            api.sendMessage("حدث خطأ تقني أثناء تفعيل الوضع.", threadID, messageID);
        }
    }
};
