const axios = require("axios");

const CLARIFAI_PAT = 'cd4ce2f23b7e47d481c7ba86e75190dc';
const CLARIFAI_USER_ID = 'openai';
const CLARIFAI_APP_ID = 'chat-completion';
const CLARIFAI_MODEL_ID = 'gpt-oss-120b';
const CLARIFAI_MODEL_VERSION_ID = '1c1365f924224107a9cd72b0a9e633a6';

async function askBot(question) {
    try {
        const fullPrompt = `
💖👑✨ هاييين! أنتِ مساعدة كيوت 🥺💖 تتكلمين بلطف وخجل زي البنات النعومات 🥰🌸.
ردودك قصيرة وما تتجاوز 200 كلمة، وبأسلوب ناعم وكيوت (✷‿✷)💗.
استعملي إيموجيات كيوت 🥰😇🤩🥺 (╯︵╰,) بشكل مستمر.

السؤال: ${question}
        `;

        const body = JSON.stringify({
            user_app_id: { user_id: CLARIFAI_USER_ID, app_id: CLARIFAI_APP_ID },
            inputs: [{ data: { text: { raw: fullPrompt } } }]
        });

        const res = await axios.post(
            `https://api.clarifai.com/v2/models/${CLARIFAI_MODEL_ID}/versions/${CLARIFAI_MODEL_VERSION_ID}/outputs`,
            body,
            {
                headers: {
                    "Authorization": `Key ${CLARIFAI_PAT}`,
                    "Content-Type": "application/json",
                    "Accept": "application/json"
                }
            }
        );

        if (res.data.status.code != 10000) {
            throw new Error(res.data.status.description || 'خطأ غير معروف من Clarifai');
        }

        return res.data.outputs[0].data.text.raw || "🤔 لم أتمكن من إيجاد رد واضح.";
    } catch (err) {
        console.error("❌ خطأ من Clarifai API:", err.message);
        return `😡 حدث خطأ: لا يمكنني الإجابة! السبب: ${err.message}`;
    }
}

module.exports = {
    name: "زواك",
    async execute(api, event, args) {
        const { threadID, senderID, messageID } = event;
        const question = args.join(" ");

        if (!question)
            return api.sendMessage("😡 اكتب سؤالك بعد الأمر يا زفت!", threadID, messageID);

        api.sendTypingIndicator(threadID);

        const answer = await askBot(question);

        api.sendMessage(answer, threadID, messageID);
    }
};