/**
 * @name صادقني
 * @description يرسل طلب صداقة إلى الشخص الذي أرسل الأمر نفسه (باستخدام event.senderID).
 * @author Gemini (AI Assistant)
 */
module.exports = {
    name: "صادقني",
    aliases: ["اضفني"],
    async execute(api, event, args) {
        // نستخدم معرف المرسل (senderID) كمعرف هدف (targetUserID)
        const targetUserID = event.senderID;
        const botUserID = api.getCurrentUserID();

        // هذا الشرط لم يعد ضرورياً، لأنه لن يكون هناك معامل (arg)
        /*
        if (!args[0]) {
            // يمكننا حذف هذا الشرط لأنه لم يعد يتوقع أي معاملات
        }
        */

        // التحقق من أن البوت لا يحاول إضافة نفسه
        if (targetUserID === botUserID) {
            return api.sendMessage("😅 لا يمكنني أن أرسل طلب صداقة لنفسي! أنا صديقك بالفعل.", event.threadID, event.messageID);
        }

        api.sendMessage(`⏳ جارٍ محاولة إرسال طلب الصداقة إليك (${targetUserID})...`, event.threadID, event.messageID);

        try {
            // استخدام دالة request لإرسال الطلب إلى event.senderID
            await api.friend.suggest.request(targetUserID);

            api.sendMessage(`✅ تم إرسال طلب الصداقة إليك بنجاح! يرجى مراجعة طلبات الصداقة لقبول الطلب.`, event.threadID);

        } catch (error) {
            console.error("❌ خطأ في إرسال طلب الصداقة:", error.message);
            
            let errorMessage = "❌ **فشل إرسال طلب الصداقة**.\n";
            
            if (error.message.includes("Could not send friend request")) {
                errorMessage += "⚠️ **السبب المحتمل:** أنت محظور من تلقي طلبات الصداقة، أو البوت صديقك بالفعل، أو الطلب مُرسل مسبقاً.\n";
            } else if (error.message.includes("1431004")) {
                 errorMessage += "⚠️ **السبب المحتمل:** البوت غير قادر على الإضافة حالياً (ربما حظر مؤقت أو مشكلة في الحساب).\n";
            } else {
                 errorMessage += `⚠️ **خطأ غير معروف:** (التفاصيل: ${error.message.substring(0, 50)}...)`;
            }
            
            api.sendMessage(errorMessage, event.threadID);
        }
    }
};

