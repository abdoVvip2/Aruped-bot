const fs = require('fs');
const path = require('path');

// 1. تحديد المسارات بدقة متناهية (نظام الرادار)
// الملف j.json والـ database سيكونا في المجلد الرئيسي للمشروع لضمان الوصول
const dbPath = path.join(__dirname, '..', 'muted_chats.json');
const cacheDir = path.join(__dirname, 'cache'); 
const imagePath = path.join(cacheDir, 's.png');

// دالة القراءة (مع حماية من الانهيار)
function readDB() {
    try {
        if (!fs.existsSync(dbPath)) {
            fs.writeFileSync(dbPath, JSON.stringify({}), 'utf-8');
            return {};
        }
        return JSON.parse(fs.readFileSync(dbPath, 'utf-8'));
    } catch (e) {
        console.error("❌ خطأ في قراءة قاعدة البيانات:", e);
        return {};
    }
}

// دالة الكتابة
function writeDB(data) {
    try {
        fs.writeFileSync(dbPath, JSON.stringify(data, null, 2), 'utf-8');
    } catch (e) {
        console.error("❌ خطأ في حفظ البيانات:", e);
    }
}

module.exports = {
    name: "اسكتو",
    aliases: ["صمت"],
    description: "تفعيل نظام الصمت المحلي",
    
    async execute(api, event, args, config) {
        const { threadID, senderID, messageID } = event;
        
        try {
            // التحقق من الصلاحيات (مشرفين أو صاحب البوت)
            const threadInfo = await api.getThreadInfo(threadID);
            const adminIDs = threadInfo.adminIDs.map(e => e.id);

            if (!adminIDs.includes(senderID) && senderID !== config.owner) {
                return api.sendMessage("🚫 | هذا الأمر للمشرفين فقط يا بطل.", threadID, messageID);
            }

            // التأكد من وجود الصورة قبل البدء
            if (!fs.existsSync(imagePath)) {
                console.log("المسار الذي بحثت فيه:", imagePath);
                return api.sendMessage(`❌ | خطأ: ملف s.png غير موجود في:\n/commands/cache/`, threadID, messageID);
            }

            // 1. إرسال النص
            const warningText = `⚠️ [ تفعيل نظام الصمت ] ⚠️\n\nيُمنع الكلام نهائياً لغير المشرفين.\nسيتم طرد أي مخالف فوراً.\n\n👇 تفاعل مع الصورة أدناه لفك الحظر.`;
            await api.sendMessage(warningText, threadID);

            // 2. إرسال الصورة
            const info = await api.sendMessage({
                attachment: fs.createReadStream(imagePath)
            }, threadID);

            // 3. التخزين المحلي
            const db = readDB();
            db[threadID] = { 
                muted: true, 
                triggerMessageID: info.messageID,
                time: Date.now()
            };
            writeDB(db);

            console.log(`✅ [MUTE] المجموعة ${threadID} دخلت وضع الصمت.`);

        } catch (error) {
            console.error("🚨 خطأ في أمر اسكتو:", error);
            api.sendMessage("⚠️ حدث خطأ تقني داخلي.", threadID, messageID);
        }
    }
};
