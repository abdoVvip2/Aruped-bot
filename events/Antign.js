const fs = require('fs');
const path = require('path');

const officialNamesDBPath = path.join(__dirname, '..', 'cache', 'group_names.json');
const vandalismLogPath = path.join(__dirname, '..', 'cache', 'rename_log.json');

function readDB(filePath) {
    if (!fs.existsSync(filePath)) return {};
    return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
}

function writeDB(filePath, data) {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

module.exports = async function(api, event) {
    try {
        if (event.type !== "event" || event.logMessageType !== "log:thread-name") {
            return;
        }

        const threadID = event.threadID;
        const authorID = event.author;
        const botID = api.getCurrentUserID();

        if (authorID === botID) return;

        const officialNamesDB = readDB(officialNamesDBPath);
        const officialName = officialNamesDB[threadID];

        if (!officialName) return;
        
        const threadInfo = await api.getThreadInfo(threadID);
        const adminIDs = threadInfo.adminIDs.map(admin => admin.id);

        // 🚨 إذا اللي غيّر الاسم مو أدمن
        if (!adminIDs.includes(authorID)) {
            const perpetratorInfo = await api.getUserInfo(authorID);
            const perpetratorName = perpetratorInfo[authorID]?.name || "عضو غير معروف";
            const newName = event.logMessageData.name;

            api.sendMessage(
                `🚫 تم اكتشاف محاولة تغيير اسم المجموعة من قبل "${perpetratorName}" (سيتم طرده وإرجاع الاسم الرسمي).`,
                threadID
            );
            
            // ✅ إرجاع الاسم الرسمي
            api.gcname(officialName, threadID, (err) => {
                if (!err) {
                    api.sendMessage(`✅ تم إرجاع الاسم إلى: "${officialName}"`, threadID);
                }
            });

            // ✅ طرد العضو المخرب
            api.gcmember("remove", [authorID], threadID);

            // --- تسجيل الحادثة ---
            const logDB = readDB(vandalismLogPath);
            if (!logDB[threadID]) {
                logDB[threadID] = [];
            }

            const newLogEntry = {
                name: perpetratorName,
                id: authorID,
                profileLink: `https://www.facebook.com/profile.php?id=${authorID}`,
                changedTo: newName,
                timestamp: new Date().toLocaleString("ar-EG", { timeZone: "Africa/Cairo" }),
                action: "تم الطرد بسبب محاولة تغيير اسم المجموعة بدون صلاحيات."
            };

            logDB[threadID].push(newLogEntry);
            writeDB(vandalismLogPath, logDB);
        }

    } catch (error) {
        console.error("خطأ في حدث حماية الاسم:", error);
    }
};