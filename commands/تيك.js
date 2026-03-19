const axios = require("axios");

module.exports = {
    name: "تيك",
    aliases: ["tiktok", "tt"],
    description: "تحميل فيديوهات تيك توك بدون علامة مائية",
    execute: async (api, event, args, config) => {
        const { threadID, messageID } = event;
        const url = args[0];

        if (!url || !url.includes("tiktok.com")) {
            return api.sendMessage("⚠️ يرجى وضع رابط فيديو تيك توك صحيح بعد الأمر.\nمثال: .تيك [الرابط]", threadID, messageID);
        }

        api.sendMessage("⏳ جاري معالجة الفيديو، انتظر قليلاً...", threadID, messageID);

        try {
            // سنستخدم API مجاني ومشهور
            const res = await axios.get(`https://api.tiklydown.eu.org/api/download?url=${encodeURIComponent(url)}`);
            const videoUrl = res.data.video.noWatermark;

            const stream = await axios.get(videoUrl, { responseType: "stream" });
            
            return api.sendMessage({
                body: "✅ تم التحميل بنجاح بواسطة بوتك!",
                attachment: stream.data
            }, threadID, messageID);

        } catch (e) {
            console.error(e);
            return api.sendMessage("❌ عذراً، فشل تحميل الفيديو. قد يكون الرابط خاصاً أو الـ API متوقف حالياً.", threadID, messageID);
        }
    }
};
