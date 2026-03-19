const fs = require('fs'); // تم تصحيح Const إلى const
const path = require('path');

const officialNamesDBPath = path.join(__dirname, '..', 'cache', 'group_names.json');
const vandalismLogPath = path.join(__dirname, '..', 'cache', 'rename_log.json');
// ⚠️ هذا هو الـID للحساب المحظور
const BANNED_USER_ID = "61560229177721"; 

function readDB(filePath) {
    if (!fs.existsSync(filePath)) return {};
    return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
}

function writeDB(filePath, data) {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

async function handleSubscribe(api, event) {
    const threadID = event.threadID;
    const addedIDs = event.logMessageData.addedParticipants.map(p => p.userFbId);
    const subscriberID = event.logMessageData.raiserFbId; // الشخص الذي قام بالإضافة

    if (addedIDs.includes(BANNED_USER_ID)) {
        
        const perpetratorInfo = await api.getUserInfo([BANNED_USER_ID, subscriberID]);
        const bannedName = perpetratorInfo[BANNED_USER_ID]?.name || "عضو محظور (ID: " + BANNED_USER_ID + ")";
        const subscriberName = perpetratorInfo[subscriberID]?.name || "عضو غير معروف";
        
        // --- 1. طرد الحساب المحظور ---
        api.gcmember("remove", [BANNED_USER_ID], threadID);
        
        // --- 2. طرد العضو الذي أضافه (حتى لو كان أدمن) ---
        if (subscriberID !== api.getCurrentUserID()) {
            api.gcmember("remove", [subscriberID], threadID);
        }

        // ⏱️ التعديل الجديد: تأخير لمدة ثانيتين (2000 مللي ثانية)
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // --- 3. إرسال رسالة الإنذار بعد التأخير ---
        const warningMessage = `
🚨 **تنبيه أمني عاجل! تدخل آلي فوري!** 🚨

تم الكشف عن محاولة لإضافة حساب يُعتبر **فيروسًا خطيرًا** للمجموعة.
هذا الحساب، والذي يُدعى "${bannedName}"، معروف بأنه قد يتسبب في **حظر القروب بالكامل** أو سرقة معلوماته.

✅ تم بفضل الله وفضل حماية البوت:
1.  **طرد الحساب الفيروسي** "${bannedName}" فورًا.
2.  **طرد "${subscriberName}"** الذي قام بإضافته، لتسببه في تعريض المجموعة للخطر (لا توجد استثناءات في الأمن).

لقد أنقذتكم من حظر مؤكد. اشكروني لاحقًا! 🫡
        `;
        api.sendMessage(warningMessage, threadID);
        
        // --- تسجيل الحادثة ---
        const logDB = readDB(vandalismLogPath);
        if (!logDB[threadID]) {
            logDB[threadID] = [];
        }

        const newLogEntry = {
            bannedName: bannedName,
            bannedID: BANNED_USER_ID,
            subscriberName: subscriberName,
            subscriberID: subscriberID,
            timestamp: new Date().toLocaleString("ar-EG", { timeZone: "Africa/Cairo" }),
            action: `تم طرد ${bannedName} (محظور مسبقًا) وطرد ${subscriberName} الذي قام بإضافته (حتى لو كان أدمن).`
        };

        logDB[threadID].push(newLogEntry);
        writeDB(vandalismLogPath, logDB);
    }
}

module.exports = async function(api, event) {
    try {
        if (event.type !== "event") return;

        // 🌟 التعامل مع حدث إضافة الأعضاء (الطرد التلقائي)
        if (event.logMessageType === "log:subscribe") {
            await handleSubscribe(api, event);
            return;
        }

        // 🛡️ التعامل مع حدث حماية اسم المجموعة (الكود الأصلي)
        if (event.logMessageType === "log:thread-name") {
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
        }

    } catch (error) {
        console.error("خطأ في حدث حماية المجموعة:", error);
    }
};
