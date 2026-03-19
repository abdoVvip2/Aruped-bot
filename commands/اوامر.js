const fs = require("fs");
const path = require("path");

module.exports = {
    name: "اوامر",
    aliases: ["menu", "help"],
    execute: async (api, event, args, config) => {
        const { threadID, messageID } = event;
        
        // استخدام المسار الحالي للملف لضمان عدم الضياع
        const commandsDir = __dirname; 
        
        try {
            const commandFiles = fs.readdirSync(commandsDir).filter(f => f.endsWith(".js"));
            let msg = "📜 قائمة الأوامر المتاحة:\n\n";

            commandFiles.forEach((file, index) => {
                const cmd = require(path.join(commandsDir, file));
                if (cmd.name) {
                    msg += `${index + 1}. .${cmd.name}\n`;
                }
            });

            return api.sendMessage(msg, threadID, messageID);
        } catch (error) {
            console.error(error);
            return api.sendMessage("❌ فشل في قراءة المجلد: " + error.message, threadID, messageID);
        }
    }
};
