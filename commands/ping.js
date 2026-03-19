module.exports = {
    name: "ماركو",
    aliases: ["ping", "test"],
    description: "أمر لاختبار استجابة البوت",
    execute: async (api, event, args, config) => {
        const { threadID, messageID } = event;
        
        return api.sendMessage(
            "🏓 بونج! (Pong)\n\nالبوت بولو يعمل
            threadID, 
            messageID
        );
    }
};
