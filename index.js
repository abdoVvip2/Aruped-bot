const { execSync } = require('child_process');
const fs = require('fs');
const express = require('express');
const app = express();

// 1. تشغيل السيرفر فوراً لإرضاء المنصة
app.get('/', (req, res) => res.send('جاري ترويض السيرفر...'));
app.listen(process.env.PORT || 3000);

console.log("🛠️ بدأت عملية الترويض القسري...");

try {
    // 2. أمر سحري لتثبيت المكتبة في مجلد العمل الحالي فوراً
    console.log("⏳ جاري سحب المكتبة من المخازن العالمية...");
    execSync('npm install fca-horizon-remake --no-save', { stdio: 'inherit' });
    
    // 3. محاولة الاستدعاء بعد التثبيت المباشر
    const login = require("fca-horizon-remake");
    console.log("✅ تم اصطياد المكتبة بنجاح! السيرفر خضع للأمر.");

    // 4. كود البوت الخاص بك
    const appState = JSON.parse(fs.readFileSync('j.json', 'utf8'));
    login({appState}, (err, api) => {
        if(err) return console.error("❌ خطأ كوكيز:", err);
        console.log("🚀 البوت انطلق الآن!");
        api.listenMqtt((err, msg) => {
            if(!err && msg.body === "فحص") api.sendMessage("أنا حي أرزق! 🚀", msg.threadID);
        });
    });

} catch (e) {
    console.log("❌ فشل الترويض: " + e.message);
}
