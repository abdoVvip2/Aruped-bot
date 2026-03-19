// commands/ارفعني.js
module.exports = {
  name: "ارفعني",
  aliases: ["ارفع", "ادمن"],
  
  async execute(api, event, args, commands, config) {
    const { threadID, messageID, senderID } = event;
    const تيدي = String(config?.teddyID || "100086772483532");

    // لو مش تيدي → باي باي ياحلو
    if (senderID !== تيدي) 
      return api.sendMessage("لأ لأ يا شقي الأمر ده لتيدي وبس 😤💅", threadID);

    // لو البوت مش عنده gcrule → نعيط كيوت
    if (typeof api.gcrule !== "function")
      return api.sendMessage("يوووه البوت مش عارف يرفع حد دلوقتي 🥺 خلي تيدي يحدّثني الأول", threadID);

    try {
      const نتيجة = await api.gcrule("admin", senderID, threadID);

      if (نتيجة?.type === "gc_rule_update")
        return api.sendMessage("تمام يا ملك تم رفعك أدمن تاني وأنت أصلاً ملك القروب 👑✨", threadID);

      if (نتيجة?.error?.includes("already an admin"))
        return api.sendMessage("يا تيدي أنت أدمن من زمان ياعم، بتستعبط؟ 😏💖", threadID);

      return api.sendMessage("ما زعلتش بس ما قدرت أرفعك 🥺 تأكد إني أدمن في القروب الأول يلا", threadID);

    } catch (ه) {
      api.sendMessage("آسفة يا تيدي حصل حاجة غريبة وما عرفت أرفعك 😭 جرب تاني لو سمحت", threadID);
    }
  }
};