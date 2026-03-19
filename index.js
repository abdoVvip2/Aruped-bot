const { login } = require("ws3-fca");
const fs = require("fs");
const path = require("path");
const express = require("express");
const bodyParser = require("body-parser");

const app = express();
const PORT = process.env.PORT || 3000;

// إعدادات البوت
const config = {
    prefix: ".",
    appStatePath: "j.json",
    admins: ["100086772483532"], 
    owner: "100086772483532", 
};

let botApi = null;
let isBotRunning = false;

app.use(bodyParser.json());

// --- [ وظائف تحميل الأوامر ] ---
function loadHandlers(dirPath, isCommand = true) {
    const fullPath = path.join(__dirname, dirPath);
    const handlers = isCommand ? { commands: new Map(), adminCommands: new Map(), blockers: [] } : [];

    if (!fs.existsSync(fullPath)) {
        fs.mkdirSync(fullPath, { recursive: true });
        return handlers;
    }

    const files = fs.readdirSync(fullPath).filter(file => file.endsWith(".js"));
    for (const file of files) {
        try {
            const handler = require(path.join(fullPath, file));
            if (isCommand) {
                const mapKey = dirPath === "admin" ? "adminCommands" : "commands";
                if (handler.name && typeof handler.execute === 'function') {
                    handlers[mapKey].set(handler.name.toLowerCase(), handler);
                }
            } else if (typeof handler === 'function') {
                handlers.push(handler);
            }
        } catch (err) {
            console.error(`❌ خطأ في ${file}:`, err.message);
        }
    }
    return handlers;
}

// --- [ تشغيل المستمع ] ---
function startListener(api, handlers) {
    api.setOptions({ listenEvents: true, selfListen: false });

    api.listenMqtt(async (err, event) => {
        if (err) return console.error("❌ خطأ في الاستماع:", err);

        // تشغيل الـ Events
        for (const handler of handlers.eventHandlers) {
            try { await handler(api, event, config); } catch (e) {}
        }

        if (!event.body || !event.body.startsWith(config.prefix)) return;

        const args = event.body.slice(config.prefix.length).trim().split(/ +/);
        const cmdName = args.shift().toLowerCase();
        
        // البحث عن الأمر في القوائم
        const command = handlers.commandHandlers.commands.get(cmdName) || 
                        handlers.commandHandlers.adminCommands.get(cmdName);

        if (command) {
            if (handlers.commandHandlers.adminCommands.has(cmdName) && !config.admins.includes(event.senderID)) {
                return api.sendMessage("🚫 هذا الأمر للمشرفين فقط.", event.threadID);
            }
            try {
                await command.execute(api, event, args, config);
            } catch (e) {
                api.sendMessage("⚠️ حدث خطأ داخلي.", event.threadID);
            }
        }
    });
}

// --- [ وظيفة التشغيل الرئيسية ] ---
async function startBot() {
    if (isBotRunning) return;

    const commandHandlers = { 
        commands: loadHandlers("commands", true).commands, 
        adminCommands: loadHandlers("admin", true).adminCommands,
        blockers: [] 
    };
    const eventHandlers = loadHandlers("events", false);
    const handlers = { commandHandlers, eventHandlers };

    try {
        if (!fs.existsSync(config.appStatePath)) {
            console.log("⚠️ ملف j.json غير موجود. ارفعه لكي يعمل البوت.");
            return;
        }

        const appState = JSON.parse(fs.readFileSync(config.appStatePath, "utf8"));
        
        login({ appState }, (err, api) => {
            if (err) return console.error("❌ فشل Login:", err);
            
            botApi = api;
            isBotRunning = true;
            console.log("✅ [SUCCESS] البوت متصل الآن عبر ws3-fca!");
            startListener(api, handlers);
        });
    } catch (e) {
        console.error("❌ خطأ في التشغيل:", e.message);
    }
}

// --- [ المسارات والتشغيل ] ---
app.get('/', (req, res) => res.send('Bot Status: Online & Running!'));

app.listen(PORT, () => {
    console.log(`🌐 Server active on port ${PORT}`);
    startBot();
});
