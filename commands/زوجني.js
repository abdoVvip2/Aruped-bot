const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');
const { exec } = require('child_process');

module.exports = {
    name: "زوجني",
    async execute(api, event, args) {
        const { threadID, messageID, senderID, mentions } = event;
        const cacheFolder = path.join(__dirname, 'cache');
        
        const basePath = path.join(cacheFolder, 'm.png');
        const imagePath1 = path.join(cacheFolder, '1.png');
        const imagePath2 = path.join(cacheFolder, '2.png');
        const outputPath = path.join(cacheFolder, 'combined_logo.png');
        
        let targetID;
        let bodyText = "";

        try {
            if (Object.keys(mentions).length > 0) {
                targetID = Object.keys(mentions)[0];
            } else {
                const threadInfo = await api.getThreadInfo(threadID);
                const members = threadInfo.participantIDs.filter(id => id !== senderID);

                if (members.length === 0) {
                    return api.sendMessage("❌ | لا يوجد أعضاء في هذا الكروب.", threadID, messageID);
                }

                targetID = members[Math.floor(Math.random() * members.length)];
            }
            
            const targetName = event.mentions[targetID] || "عضو عشوائي";
            let lovePercent = Math.floor(Math.random() * 101);
            let funnyComments = [
                "💩 نسبة الحب بينكم زي جودة انترنت الجزائر 😂",
                "🍉 النسبة عالية بس انت شكلك بطيخة مكسورة 💀",
                "🧟‍♂️ العلاقة دي محتاجة شيخ يرقيها يا حبيبي",
                "🐒 حبكم زي همبرجر بارد... يتاكل بالعافية",
                "🍔 حبكم زي همبرجر بارد... يتاكل بالعافية",
                "🚽 بصراحة النسبة حلوة، بس مكانكم الطبيعي المرحاض 👀",
                "🥴 لو الحب ده فيلم، كان طلع فيلم هندي مدته 6 ساعات",
                "🐟 ريحة الحب طالعة سمك معفن 😷",
                "🧨 علاقتكم تنفجر في أي لحظة… انتبهوا يا كوارث!",
                "👽 الحب ده مش طبيعي… واضح إنه من كوكب المريخ.",
                "💔 | لا تقلق، معظم العلاقات الفاشلة تبدأ بنسبة حب عالية.",
                "😂 | إذا كان هذا هو الحب، فأنا أفضل أن أكون عازباً للأبد.",
                "😈 | حبكم مثل وجبة ماك... لذيذة في البداية ثم تأتيك حرقة المعدة.",
                "🤢 | النسبة تقول إنكما ستتزوجان، لكن المشكلة هي من سيطبخ؟",
                "🤡 | حبكم مثل نكتة سخيفة... الجميع يضحك عليها.",
                "🤯 | هذا الحب يحتاج إلى وثيقة تأمين ضد الحريق.",
                "🤖 | حاسوبي يحترق من قوة حبكم... يرجى الابتعاد!",
                "🌪️ | حبكم مثل إعصار، يدمر كل شيء في طريقه.",
                "🤦‍♀️ | يا حبيبي، هذه النسبة لا تكفي حتى لتشغيل لمبة!",
                "💀 | بصراحة، أرجو أن لا تتكاثروا..."
            ];
            let randomComment = funnyComments[Math.floor(Math.random() * funnyComments.length)];

            api.sendMessage(
                `💘 تبع الحب بينك وبين ${targetName}: ${lovePercent}%\n${randomComment}`,
                threadID,
                messageID
            );
            
            const photoUrl1 = `https://graph.facebook.com/${senderID}/picture?height=720&width=720&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`;
            const photoUrl2 = `https://graph.facebook.com/${targetID}/picture?height=720&width=720&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`;
            

            if (!fs.existsSync(basePath)) {
                return api.sendMessage(
                    "⚠️ خطأ: الملف المطلوب 'm.png' غير موجود في مجلد 'cache'.",
                    threadID,
                    messageID
                );
            }

            const [response1, response2] = await Promise.all([
                axios.get(photoUrl1, { responseType: 'stream' }),
                axios.get(photoUrl2, { responseType: 'stream' })
            ]);

            await Promise.all([
                new Promise((resolve, reject) => {
                    response1.data.pipe(fs.createWriteStream(imagePath1)).on('finish', resolve).on('error', reject);
                }),
                new Promise((resolve, reject) => {
                    response2.data.pipe(fs.createWriteStream(imagePath2)).on('finish', resolve).on('error', reject);
                })
            ]);

            const maskCmd1 = `convert "${imagePath1}" -resize 300x300 \\( -size 300x300 xc:none -fill white -draw "circle 150,150 150,1" \\) -alpha set -compose copy_opacity -composite "${imagePath1}"`;
            const maskCmd2 = `convert "${imagePath2}" -resize 300x300 \\( -size 300x300 xc:none -fill white -draw "circle 150,150 150,1" \\) -alpha set -compose copy_opacity -composite "${imagePath2}"`;
            const compositeCmd = `convert "${basePath}" "${imagePath1}" -geometry +100+150 -composite "${imagePath2}" -geometry +550+150 -composite "${outputPath}"`;

            await new Promise((resolve, reject) => {
                exec(maskCmd1, (err) => {
                    if (err) return reject(err);
                    exec(maskCmd2, (err) => {
                        if (err) return reject(err);
                        exec(compositeCmd, (err) => {
                            if (err) return reject(err);
                            resolve();
                        });
                    });
                });
            });

            await api.sendMessage({
                body: bodyText,
                attachment: fs.createReadStream(outputPath)
            }, threadID, messageID);
            
        } catch (error) {
            console.error("❌ خطأ في أمر زوجني:", error.message);
            api.sendMessage("❌ | عذرًا، حدث خطأ أثناء معالجة الصور. يرجى التأكد من تثبيت ImageMagick ووجود ملف 'm.png'.", threadID, messageID);
        } finally {
            fs.remove(imagePath1).catch(() => {});
            fs.remove(imagePath2).catch(() => {});
            fs.remove(outputPath).catch(() => {});
        }
    }
};
