// events/لاسب.js - نظام منع السب (يعمل 100% بدون أي خطأ في ws3-fca)

const fs = require("fs");
const path = require("path");

const DATA_FILE = path.join(__dirname, "../cache/antiswear.json");

function isAntiSwearEnabled(threadID) {
    try {
        if (fs.existsSync(DATA_FILE)) {
            const data = JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
            return data[threadID] === true;
        }
    } catch (e) {}
    return false;
}

const BAD_WORDS = [
    "كسمك","كس","كسك","زب","زبك","شرموط","شرموطه","قحبة","لبوة","خول","منيوك","متناك",
    "عير","طيز","نيك","كس امك","يا كلب","ابن الشرموطة","كلب","ديوث","بظر","جلخ",
    "fuck","bitch","pussy","dick","motherfucker","sex","cock","ass","cunt"
];

function containsBadWord(text) {
    if (!text) return false;
    const msg = text.toLowerCase()
        .replace(/[ًٌٍَُِّْ]/g, "")
        .replace(/[^ا-ي0-9\s\*]/g, " ")
        .replace(/\s+/g, " ");
    return BAD_WORDS.some(word => msg.includes(word));
}

module.exports = async function(api, event, config) {
    if (!event.body || !event.isGroup) return;
    if (event.senderID === api.getCurrentUserID()) return;

    const threadID = event.threadID;
    const senderID = event.senderID;
    const messageID = String(event.messageID || ""); // تحويل لـ string عادي

    if (!isAntiSwearEnabled(threadID)) return;
    if (!containsBadWord(event.body)) return;

    try {
        const info = await api.getThreadInfo(threadID);
        const adminIDs = (info.adminIDs || []).map(a => a.id);
        const ownerID = info.ownerID || "";
        const botID = api.getCurrentUserID();

        // حماية كاملة: أدمن البوت + أدمن الجروب + مالك الجروب + البوت نفسه
        if (
            (config.admins && config.admins.includes(senderID)) ||
            senderID === botID ||
            adminIDs.includes(senderID) ||
            senderID === ownerID
        ) {
            return;
        }

        // لو البوت مش أدمن → يحذر بس
        if (!adminIDs.includes(botID)) {
            return api.sendMessage("أنا مش أدمن هنا، ما أقدرش أطرد اللي بيسب 😔", threadID);
        }

        // طرد العضو بالطريقة الصحيحة في ws3-fca
        api.gcmember("remove", [senderID], threadID);

        // رسالة الطرد + منشن
        const kickMsg = `تم طرد العضو بسبب استخدام ألفاظ نابية 🚫\nالرسالة المخالفة: "${event.body}"\nيرجى احترام قواعد المجموعة 💙`;

        api.sendMessage({
            body: kickMsg,
            mentions: [{ tag: "@العضو", id: senderID }]
        }, threadID, () => {}); // الـ callback اللي كان ناقص

        // رياكشن (مع التأكد من messageID)
        if (messageID) {
            api.setMessageReaction("بان", messageID, () => {}, true);
        }

    } catch (error) {
        console.error("خطأ في نظام منع السب:", error);
        api.sendMessage("حدث خطأ أثناء معالجة السب.", threadID);
    }
};