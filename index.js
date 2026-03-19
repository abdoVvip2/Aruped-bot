const login = require("fca-horizon-remake");
const fs = require("fs-extra");
const path = require("path");
const express = require("express");
const bodyParser = require("body-parser");

const app = express();
const PORT = process.env.PORT || 3000;

// 1. الإعدادات العامة (قائمة الأدمن الآن مصفوفة مفتوحة)
const config = {
    prefix: ".",
    appStatePath: path.join(__dirname, "j.json"),
    // أضف أي عدد من الـ IDs هنا، افصل بينهم بفاصلة
    admins: ["100086772483532", "ID_أدمن_ثاني", "ID_أدمن_ثالث"], 
    owner: "100086772483532",
    cooldown: 3000 
};

// دالة للتحقق هل المستخدم أدمن أم لا
const isAdmin = (senderID) => config.admins.includes(String(senderID)) || senderID === config.owner;

app.use(bodyParser.json());

// --- نظام تحميل الملفات (Command Loader) ---
function loadHandlers(dirName) {
    const commands = new Map();
    const fullPath = path.join(__dirname, dirName);

    if (!fs.existsSync(fullPath)) {
        fs.ensureDirSync(fullPath);
        return commands;
    }

    const files = fs.readdirSync(fullPath).filter(f => f.endsWith(".js"));
    for (const file of files) {
        try {
            const filePath = path.join(fullPath, file);
            delete require.cache[require.resolve(filePath)];
            const handler = require(filePath);
            if (handler.name && typeof handler.execute === 'function') {
                commands.set(handler.name.toLowerCase(), handler);
            }
        } catch (e) { console.error(`❌ خطأ في تحميل ${file}:`, e.message); }
    }
    return commands;
}

// --- المستمع الرئيسي ---
function startListener(api, commands) {
    api.setOptions({ forceLogin: true, online: true, listenEvents: true, selfListen: false });

    api.listenMqtt(async (err, event) => {
        if (err) {
            console.error("❌ خطأ في الاستماع، إعادة التشغيل...");
            return process.exit(1); 
        }

        if (!event.body || !event.body.startsWith(config.prefix)) return;

        const args = event.body.slice(config.prefix.length).trim().split(/ +/);
        const cmdName = args.shift()?.toLowerCase();
        const senderID = String(event.senderID);

        const command = commands.get(cmdName);
        if (!command) return;

        // التحقق من صلاحية الأدمن إذا كان الأمر يتطلب ذلك
        if (command.adminOnly && !isAdmin(senderID)) {
            return api.sendMessage("⚠️ هذا الأمر مخصص للأدمن فقط.", event.threadID);
        }

        try {
            await command.execute(api, event, args, config);
        } catch (e) {
            console.error(`❌ خطأ في تنفيذ ${cmdName}:`, e);
            api.sendMessage(`⚠️ حدث خطأ داخلي أثناء تنفيذ الأمر.`, event.threadID);
        }
    });
}

async function startBot() {
    if (!fs.existsSync(config.appStatePath)) {
        console.error("❌ ملف j.json مفقود! ارفع ملف الكوكيز الخاص بك.");
        return;
    }

    const commands = loadHandlers("commands");
    const appState = JSON.parse(fs.readFileSync(config.appStatePath, "utf8"));

    login({ appState }, (err, api) => {
        if (err) return console.error("❌ فشل الدخول: تأكد من ملف j.json");
        console.log(`✅ البوت يعمل الآن باسم ID: ${api.getCurrentUserID()}`);
        startListener(api, commands);
    });
}

app.get("/", (req, res) => res.send("Bot is Running!"));
app.listen(PORT, () => {
    console.log(`🌐 Server online on port ${PORT}`);
    startBot();
});