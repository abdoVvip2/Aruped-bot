const fs = require("fs");
const path = require("path");

module.exports = {
    name: "اوامر",
    aliases: ["menu", "help"],
    execute: async (api, event, args, config) => {
        const { threadID, messageID } = event;
        
        // مسار المجلد
        const commandsDir = path.join(__dirname, "../../commands");
        
        // جلب الملفات وقراءة محتواها لاستخراج الـ Name
        const commandFiles = fs.readdirSync(commandsDir).filter(f => f.endsWith(".js"));
        const commandsList = [];

        commandFiles.forEach(file => {
            try {
                // حذف الكاش لضمان قراءة التحديثات الجديدة
                delete require.cache[require.resolve(path.join(commandsDir, file))];
                const cmd = require(path.join(commandsDir, file));
                if (cmd.name) {
                    commandsList.push({
                        name: cmd.name,
                        description: cmd.description || "لا يوجد وصف"
                    });
                }
            } catch (e) {
                console.error(`خطأ في قراءة ملف ${file}:`, e);
            }
        });

        // إعدادات الصفحات (5 أوامر)
        const page = parseInt(args[0]) || 1;
        const commandsPerPage = 5;
        const totalPages = Math.ceil(commandsList.length / commandsPerPage);

        if (page > totalPages || page < 1) return api.sendMessage("⚠️ صفحة غير موجودة.", threadID, messageID);

        const start = (page - 1) * commandsPerPage;
        const paginatedCommands = commandsList.slice(start, start + commandsPerPage);

        let msg = `╭─────────────╮\n`;
        msg += `   📜 الأوامر الملكية (${page}/${totalPages})\n`;
        msg += `╰─────────────╯\n\n`;

        paginatedCommands.forEach((cmd, index) => {
            msg += ` ${start + index + 1}. 『 ${config.prefix}${cmd.name} 』\n`;
            msg += ` 📝 ${cmd.description}\n\n`; // أضفنا الوصف ليكون الشكل أفخم
        });

        msg += `───────────────\n💡 اكتب ${config.prefix}اوامر ${page + 1} للمزيد`;

        return api.sendMessage(msg, threadID, messageID);
    }
};
