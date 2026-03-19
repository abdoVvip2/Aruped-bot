const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, '..', 'cache', 'group_names.json');

// --- تم تحديث هذه الدالة ---
function readDB() {
    // التأكد من وجود المجلد، وإن لم يكن موجودًا، يتم إنشاؤه
    const dir = path.dirname(dbPath);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }

    // التأكد من وجود الملف، وإن لم يكن موجودًا، يتم إنشاؤه
    if (!fs.existsSync(dbPath)) {
        fs.writeFileSync(dbPath, JSON.stringify({}));
    }
    return JSON.parse(fs.readFileSync(dbPath, 'utf-8'));
}

function writeDB(data) {
    fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
}

module.exports = {
    name: "اسم",
    async execute(api, event, args) {
        try {
            const newTitle = args.join(" ");
            const threadID = event.threadID;
            const senderID = event.senderID;

            const threadInfo = await api.getThreadInfo(threadID);
            const adminIDs = threadInfo.adminIDs.map(admin => admin.id);

            if (!adminIDs.includes(senderID)) {
                return api.sendMessage("🚫 هذا الأمر مخصص للمشرفين فقط.", threadID, event.messageID);
            }

            if (!newTitle) {
                return api.sendMessage("يرجى كتابة الاسم الجديد بعد الأمر.", threadID, event.messageID);
            }

            api.gcname(newTitle, threadID, (err) => {
                if (err) {
                    console.error("فشل تغيير اسم المجموعة:", err);
                    return api.sendMessage("حدث خطأ، لا يمكنني تغيير الاسم.", threadID, event.messageID);
                }

                const db = readDB();
                db[threadID] = newTitle;
                writeDB(db);
                api.sendMessage(`✅ تم تغيير اسم المجموعة إلى "${newTitle}" وحفظه كالاسم الرسمي.`, threadID);
            });
        } catch (error) {
            console.error("خطأ في أمر اسم:", error);
            api.sendMessage("حدث خطأ أثناء تنفيذ الأمر.", threadID, event.messageID);
        }
    }
};
