<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>إدارة بوت WS3-FCA</title>
    <style>
        /* إضافة نمط جديد لزر إعادة التشغيل */
        .control-buttons button { 
            width: 48%; /* لترتيب الأزرار جنبًا إلى جنب */
            margin-bottom: 10px;
        }
        .control-buttons { 
            display: flex; 
            justify-content: space-between; 
            margin-top: 15px; 
        }
        .restart-btn { 
            background-color: #ffc107; /* لون مميز لزر إعادة التشغيل */
            color: #333; 
        }
        .restart-btn:hover { 
            background-color: #e0a800; 
        }

        /* الأنماط الأصلية */
        body { font-family: Tahoma, sans-serif; margin: 20px; background-color: #f4f4f9; color: #333; }
        .container { max-width: 600px; margin: auto; background: #fff; padding: 20px; border-radius: 8px; box-shadow: 0 0 10px rgba(0, 0, 0, 0.1); }
        h1 { color: #007bff; text-align: center; }
        input[type="email"], input[type="password"] { width: 98%; padding: 10px; margin-bottom: 10px; border: 1px solid #ccc; border-radius: 4px; box-sizing: border-box; }
        textarea { width: 98%; min-height: 100px; padding: 10px; margin-bottom: 10px; border: 1px solid #ccc; border-radius: 4px; resize: vertical; }
        /* تعديل نمط زر "تسجيل الدخول" ليناسب الحاوية الجديدة */
        #loginForm button[type="submit"] { background-color: #28a745; color: white; padding: 10px 15px; border: none; border-radius: 4px; cursor: pointer; font-size: 16px; width: 100%; }
        #loginForm button[type="submit"]:hover { background-color: #218838; }
        .message { margin-top: 15px; padding: 10px; border-radius: 4px; }
        .success { background-color: #d4edda; color: #155724; border: 1px solid #c3e6cb; }
        .error { background-color: #f8d7da; color: #721c24; border: 1px solid #f5c6cb; }
        .divider { text-align: center; margin: 15px 0; color: #555; }
    </style>
</head>
<body>
    <div class="container">
        <h1>إدارة بوت WS3-FCA</h1> <p>اختر طريقة تسجيل الدخول: بيانات الاعتماد أو الكوكيز.</p>

        <form id="loginForm">
            <label for="email">البريد الإلكتروني:</label>
            <input type="email" id="email" name="email" placeholder="أدخل البريد الإلكتروني">
            
            <label for="password">كلمة السر:</label>
            <input type="password" id="password" name="password" placeholder="أدخل كلمة السر">
            
            <div class="divider">--- أو ---</div>
            
            <label for="appState">الكوكيز (اختياري، يطغى على الإيميل/كلمة السر):</label>
            <textarea id="appState" name="appState" placeholder='[{"key":"value","domain":".facebook.com"}, ...]'></textarea>
            
            <button type="submit">تسجيل الدخول وتشغيل البوت</button>
        </form>

        <div class="control-buttons">
            <button id="restartBotButton" class="restart-btn" type="button">إعادة تشغيل البوت 🔄</button>
            <button id="stopBotButton" class="restart-btn" type="button" style="background-color: #dc3545; color: white;">إيقاف البوت 🛑</button>
        </div>

        <div id="statusMessage" class="message" style="display: none;"></div>
    </div>

    <script>
        const statusMessage = document.getElementById('statusMessage');

        /**
         * وظيفة لإرسال طلب إلى الخادم وإظهار الرسالة
         * @param {string} endpoint - مسار API (مثل /start-bot, /restart-bot)
         * @param {string} method - طريقة الطلب (مثل POST, GET)
         * @param {Object} bodyData - بيانات الجسم المراد إرسالها (إذا كان هناك)
         */
        async function sendBotCommand(endpoint, method = 'POST', bodyData = null) {
            statusMessage.style.display = 'block';
            statusMessage.className = 'message';
            statusMessage.textContent = 'جاري إرسال الطلب...';

            try {
                const fetchOptions = {
                    method: method,
                    headers: { 'Content-Type': 'application/json' },
                };
                if (bodyData) {
                    fetchOptions.body = JSON.stringify(bodyData);
                }

                const response = await fetch(endpoint, fetchOptions);
                const result = await response.json();

                if (response.ok) {
                    statusMessage.className = 'message success';
                    statusMessage.textContent = result.message;
                } else {
                    statusMessage.className = 'message error';
                    statusMessage.textContent = result.error || 'حدث خطأ غير معروف.';
                }
            } catch (error) {
                statusMessage.className = 'message error';
                statusMessage.textContent = 'فشل الاتصال بخادم البوت.';
                console.error('Frontend Error:', error);
            }
        }

        // 1. معالج حدث زر "تسجيل الدخول وتشغيل البوت" (تم تعديله لاستخدام وظيفة sendBotCommand)
        document.getElementById('loginForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('email').value.trim();
            const password = document.getElementById('password').value.trim();
            const appState = document.getElementById('appState').value.trim();
            
            let bodyData = {};
            
            if (appState) {
                try {
                    JSON.parse(appState); 
                    bodyData = { appState: appState };
                } catch (error) {
                    statusMessage.style.display = 'block';
                    statusMessage.className = 'message error';
                    statusMessage.textContent = 'خطأ في تنسيق الكوكيز (JSON غير صالح).';
                    return;
                }
            } else if (email && password) {
                bodyData = { email: email, password: password };
            } else {
                statusMessage.style.display = 'block';
                statusMessage.className = 'message error';
                statusMessage.textContent = 'يجب إدخال البريد الإلكتروني وكلمة السر أو لصق الكوكيز.';
                return;
            }

            await sendBotCommand('/start-bot', 'POST', bodyData);
        });

        // 2. معالج حدث زر "إعادة تشغيل البوت" (الجديد)
        document.getElementById('restartBotButton').addEventListener('click', async () => {
            // يتم إرسال طلب إعادة التشغيل إلى مسار جديد في الخادم (يفترض /restart-bot)
            await sendBotCommand('/restart-bot', 'POST'); 
        });

        // 3. معالج حدث زر "إيقاف البوت" (الجديد)
        document.getElementById('stopBotButton').addEventListener('click', async () => {
            // يتم إرسال طلب إيقاف التشغيل إلى مسار جديد في الخادم (يفترض /stop-bot)
            await sendBotCommand('/stop-bot', 'POST'); 
        });
    </script>
</body>
</html>
