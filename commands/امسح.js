module.exports = {
    name: "مسح",
    async execute(api, event) {
        const { threadID, messageID, senderID, isGroup, messageReply } = event;

        // لو مش ريبلاي أو في الخاص → نمسح الأمر وبس ونختفي زي الأميرات
        if (!messageReply || !isGroup) {
            return api.unsendMessage(messageID);
        }

        // باي باي لرسالة البوت اللي رديتي عليها
        api.unsendMessage(messageReply.messageID);

        // وباي باي للأمر نفسه عشان الجروب يفضل نضيف وكيوت
        api.unsendMessage(messageID);

        // مفيش كلام… بس همسة صغيرة في قلبك: "تم يا حلوة"
    }
};