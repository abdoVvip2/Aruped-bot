const login = require("fca-horizon-remake");
const express = require("express");
const fs = require("fs");
const app = express();

const PORT = process.env.PORT || 3000;
app.get('/', (req, res) => res.send('Bot is Live!'));
app.listen(PORT, () => console.log(`Listening on port ${PORT}`));

if (!fs.existsSync('j.json')) {
    console.error("❌ ملف j.json مفقود!");
    process.exit(1);
}

try {
    const appState = JSON.parse(fs.readFileSync('j.json', 'utf8'));
    login({appState}, (err, api) => {
        if(err) return console.error("❌ خطأ تسجيل دخول:", err);
        
        console.log("✅ البوت يعمل الآن بنجاح على Render!");
        
        api.listenMqtt((err, message) => {
            if(err || !message || !message.body) return;
            
            if(message.body.toLowerCase() === "فحص") {
                api.sendMessage("الاستجابة سريعة على سيرفر Render المستقر! 🚀", message.threadID);
            }
        });
    });
} catch (e) {
    console.error("❌ خطأ في قراءة ملف الكوكيز:", e.message);
}
