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

module.exports = async function(api, event) {
    const { threadID, senderID, userID, messageID } = event;

    try {
        const db = readDB();
        const isMuted = db[threadID]?.muted;

        // --- هنا تم التعديل ---
        if (isMuted && (event.type === "message" || event.type === "message_reply") && senderID) {
            const botID = api.getCurrentUserID();
            if (senderID === botID) return;

            const threadInfo = await api.getThreadInfo(threadID);
            const adminIDs = threadInfo.adminIDs.map(e => e.id);

            if (!adminIDs.includes(senderID)) {
                api.gcmember("remove", [senderID], threadID);
            }
        }
        // --- نهاية التعديل ---

        if (event.type === "message_reaction" && db[threadID]?.messageID === event.messageID) {
            const reactorID = userID;
            const threadInfo = await api.getThreadInfo(threadID);
            const adminIDs = threadInfo.adminIDs.map(e => e.id);

            if (adminIDs.includes(reactorID)) {
                delete db[threadID];
                writeDB(db);
                const unmuteMessage = `✅ [ تـم رفـع السيطـــرة ] ✅

بعد تدخل أحد المشرفين، تم السماح لكم بالثرثرة مرة أخرى.

لكن تذكروا، نحن نراقب دائمًا...`;
                api.sendMessage(unmuteMessage, threadID);
            }
        }
    } catch (error) {
        if (error.error !== 1545012) {
             console.error("خطأ في حدث antichat:", error);
        }
    }
};
