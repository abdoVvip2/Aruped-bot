const login = require("fca-horizon-remake");
const express = require("express");
const fs = require("fs");
const app = express();

// إبقاء السيرفر حياً (Render يحتاج بورت مفتوح)
const PORT = process.env.PORT || 3000;
app.get('/', (req, res) => res.send('Bot is active!'));
app.listen(PORT, () => console.log(`Listening on port ${PORT}`));

// التأكد من وجود ملف الكوكيز
if (!fs.existsSync('j.json')) {
    console.error("❌ ملف j.json مفقود! ارفعه على GitHub.");
    process.exit(1);
}

const appState = JSON.parse(fs.readFileSync('j.json', 'utf8'));

login({appState}, (err, api) => {
    if(err) return console.error("❌ خطأ تسجيل دخول:", err);
    console.log("✅ البوت يعمل الآن بنجاح على Render!");
    
    api.listenMqtt((err, message) => {
        if(err || !message.body) return;
        if(message.body.toLowerCase() === "فحص") {
            api.sendMessage("الاستجابة سريعة على سيرفر Render المستقر! 🚀", message.threadID);
        }
    });
});
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
