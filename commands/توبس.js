const fs = require('fs');
const path = require('path');
const usageDBPath = path.join(__dirname, '..', 'cache', 'commands_usage.json');

function readUsageDB() {
    if (!fs.existsSync(usageDBPath)) {
        return {};
    }
    return JSON.parse(fs.readFileSync(usageDBPath, 'utf-8'));
}

module.exports = {
    name: "توب",
    async execute(api, event, args) {
        try {
            const usageDB = readUsageDB();
            
            const sortedUsers = Object.keys(usageDB).sort((a, b) => usageDB[b] - usageDB[a]);
            const top5Users = sortedUsers.slice(0, 5);
            
            let message = "📊 **أكثر 5 أعضاء استخدامًا للأوامر**\n\n";
            
            if (top5Users.length === 0) {
                message = "لا توجد بيانات استخدام حاليًا. حاول استخدام بعض الأوامر أولاً.";
            } else {
                for (let i = 0; i < top5Users.length; i++) {
                    const userID = top5Users[i];
                    const count = usageDB[userID];
                    let userName = `مستخدم (${userID})`;
                    let profileLink = `https://www.facebook.com/profile.php?id=${userID}`;
                    
                    try {
                        const userInfo = await api.getUserInfo(userID);
                        if (userInfo && userInfo[userID] && userInfo[userID].name) {
                            userName = userInfo[userID].name;
                        }
                    } catch (err) {
                        console.error(`❌ فشل في جلب اسم المستخدم ${userID}:`, err.message);
                    }
                    
                    message += `🥇 ${i + 1}. **${userName}**\n   - عدد الأوامر: ${count}\n   - رابط الحساب: ${profileLink}\n\n`;
                }
            }

            api.sendMessage(message, event.threadID, event.messageID);

        } catch (error) {
            console.error("❌ خطأ في أمر 'استخدامات':", error);
            api.sendMessage("حدث خطأ أثناء جلب البيانات.", event.threadID, event.messageID);
        }
    }
};
