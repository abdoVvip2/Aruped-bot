module.exports = {
    name: "بينج",
    aliases: ["ping", "test"],
    description: "أمر لاختبار استجابة البوت",
    execute: async (api, event, args, config) => {
        const { threadID, messageID } = event;
        
        return api.sendMessage(
            "🏓 بونج! (Pong)\n\nالبوت يعمل بنجاح على سيرفر Render المستقر! ✅", 
            threadID, 
            messageID
        );
    }
};
