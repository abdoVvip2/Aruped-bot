const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');
const { exec } = require('child_process');

module.exports = {
    name: "تبون",
    async execute(api, event, args) {
        const { threadID, messageID, senderID } = event;
        const cacheDir = path.join(__dirname, 'cache');
        const bgPath = path.join(cacheDir, 'T.jpg');
        const avatarPath = path.join(cacheDir, `avatar_${senderID}.png`);
        const avatarCirclePath = path.join(cacheDir, `avatar_circle_${senderID}.png`);
        const outputPath = path.join(cacheDir, `output_${senderID}.png`);

        try {
            // ما لمست ولا اسم ملف ولا رقم ولا طريقة عملك أبدًا يا قلبي

            if (!await fs.exists(bgPath)) {
                return api.sendMessage("يوووه يا قمر T.jpg ضايعة من الكاش حطيها بليز قبل ما أعيط 🥺💕", threadID, messageID ? messageID : null);
            }

            const photoUrl = `https://graph.facebook.com/${senderID}/picture?width=512&height=512&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`;

            await axios.get(photoUrl, { responseType: 'stream' })
                .then(r => r.data.pipe(fs.createWriteStream(avatarPath)))
                .then(() => new Promise((res, rej) => {
                    // الأرقام زي ما هي بالضبط ما غيرت ولا بكسل
                    const newSize = 128;
                    const radius = newSize / 2;
                    const xPos = 167;
                    const yPos = 35;

                    const maskCmd = `convert "${avatarPath}" -resize ${newSize}x${newSize} \\( -size ${newSize}x${newSize} xc:none -fill white -draw "circle ${radius},${radius} ${radius},1" \\) -alpha set -compose copy_opacity -composite "${avatarCirclePath}"`;
                    const compositeCmd = `convert "${bgPath}" "${avatarCirclePath}" -geometry +${xPos}+${yPos} -composite "${outputPath}"`;

                    exec(maskCmd, (err) => {
                        if (err) return rej(err);
                        exec(compositeCmd, (err) => err ? rej(err) : res());
                    });
                }));

            api.sendMessage({
                body: "هاكي يا ملكة تبون الجروب رسمي دلوقتي يلا استهبلي عليهم كلهم",
                attachment: fs.createReadStream(outputPath)
            }, threadID, messageID ? messageID : null);

        } catch (error) {
            api.sendMessage("آه يا روحي التبون خجل النهاردة وما رضي يلبس التاج جربي تاني بعد شوية بليز", threadID, messageID ? messageID : null);
        } finally {
            fs.unlink(avatarPath).catch(() => {});
            fs.unlink(avatarCirclePath).catch(() => {});
            fs.unlink(outputPath).catch(() => {});
        }
    }
};