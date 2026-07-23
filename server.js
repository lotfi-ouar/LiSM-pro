import http from 'http';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { fileURLToPath } from 'url';
import { spawn } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 5000;
let cloudflareUrl = '';

// دالة لتشغيل نفق الاتصال التلقائي المشفر (مع نظام التبديل الذكي بين Cloudflare و Localtunnel لتفادي خطأ 1033)
let tunnelProcess = null;
let fallbackTimeout = null;

function startSecureTunnel() {
    console.log("⚙️ جاري بدء تشغيل نفق Cloudflare (الخيار الرئيسي)...");
    
    tunnelProcess = spawn('npx', ['--yes', 'cloudflared', 'tunnel', '--url', `http://localhost:${PORT}`], { shell: true });
    
    const handleOutput = (data) => {
        const str = data.toString();
        const match = str.match(/https:\/\/[a-zA-Z0-9\-]+\.trycloudflare\.com/);
        if (match) {
            cloudflareUrl = match[0];
            if (fallbackTimeout) {
                clearTimeout(fallbackTimeout);
                fallbackTimeout = null;
            }
            console.log(`\n======================================================`);
            console.log(`🚀 رابط نفق Cloudflare المشفر والنشط: ${cloudflareUrl}`);
            console.log(`======================================================\n`);
            updateBatFile(cloudflareUrl);
        }
    };

    tunnelProcess.stdout.on('data', handleOutput);
    tunnelProcess.stderr.on('data', handleOutput);
    tunnelProcess.on('error', (err) => {
        console.error("⚠️ خطأ نفق Cloudflare:", err.message);
    });

    fallbackTimeout = setTimeout(() => {
        if (!cloudflareUrl) {
            console.log("⚠️ نفق Cloudflare لم يستجب. جاري التبديل إلى نفق Localtunnel البديل...");
            if (tunnelProcess) {
                try {
                    tunnelProcess.kill();
                } catch (e) {}
            }
            startLocaltunnelFallback();
        }
    }, 12000);

    tunnelProcess.on('close', (code) => {
        if (cloudflareUrl && !cloudflareUrl.includes('localtunnel.me')) {
            console.log(`⚠️ تم إغلاق نفق Cloudflare برمز ${code}. إعادة التشغيل...`);
            setTimeout(startSecureTunnel, 5000);
        }
    });
}

function startLocaltunnelFallback() {
    console.log("⚙️ جاري بدء تشغيل نفق Localtunnel البديل في الخلفية...");
    
    tunnelProcess = spawn('npx', ['--yes', 'localtunnel', '--port', PORT.toString()], { shell: true });
    
    const handleLocaltunnelOutput = (data) => {
        const str = data.toString();
        const match = str.match(/https:\/\/[a-zA-Z0-9\-]+\.localtunnel\.me/);
        if (match) {
            cloudflareUrl = match[0];
            console.log(`\n======================================================`);
            console.log(`🚀 رابط نفق Localtunnel المشفر والنشط: ${cloudflareUrl}`);
            console.log(`======================================================\n`);
            updateBatFile(cloudflareUrl);
        }
    };

    tunnelProcess.stdout.on('data', handleLocaltunnelOutput);
    tunnelProcess.stderr.on('data', handleLocaltunnelOutput);
    tunnelProcess.on('error', (err) => {
        console.error("⚠️ خطأ نفق Localtunnel:", err.message);
    });

    tunnelProcess.on('close', (code) => {
        console.log(`⚠️ تم إغلاق نفق Localtunnel برمز ${code}. إعادة التشغيل بعد 5 ثوانٍ...`);
        setTimeout(startLocaltunnelFallback, 5000);
    });
}

function updateBatFile(url) {
    try {
        const batPath = path.join(__dirname, 'رابط_الهاتف_الآمن_HTTPS.bat');
        const batContent = '@echo off\r\nchcp 65001 > nul\r\ntitle رابط المزامنة والكاميرا الآمن لجهاز الآيفون\r\necho ==========================================================\r\necho 🌐 الرابط المشفر والآمن لتشغيل الكاميرا بالآيفون 🌐\r\necho ==========================================================\r\necho.\\necho افتح الرابط التالي مباشرة من متصفح الآيفون الخاص بك:\\r\necho.\\necho ' + url + '\r\necho.\\r\necho ==========================================================\r\necho اضغط أي زر لإغلاق هذه النافذة...\r\npause > nul\r\n';
        fs.writeFileSync(batPath, batContent, 'utf8');
    } catch (e) {
        console.error('❌ فشل تحديث ملف الـ BAT لرابط الآيفون:', e.message);
    }
}

function getDbFilePath(storeId) {
    const dbFileName = (storeId === 'main' || !storeId) ? 'database.json' : `database_${storeId}.json`;
    const dataDir = process.env.DATA_DIR || __dirname;
    const filePath = path.join(dataDir, dbFileName);
    if (!fs.existsSync(filePath)) {
        fs.writeFileSync(filePath, JSON.stringify({
            storeSettings: { name: storeId === 'main' ? "متجري الذكي" : `محل جديد (${storeId})`, type: "grocery", initialized: false },
            products: [],
            transactions: [],
            debts: [],
            supplierDebts: [],
            users: [
                { id: "admin", displayName: "المدير العام", username: "admin", password: "123", role: "admin", canOverridePrice: true }
            ]
        }, null, 2));
    }
    return filePath;
}

let dbVersions = {};
function getDbVersion(storeId) {
    const sId = storeId || 'main';
    if (!dbVersions[sId]) {
        dbVersions[sId] = Date.now();
    }
    return dbVersions[sId];
}
function updateDbVersion(storeId) {
    const sId = storeId || 'main';
    dbVersions[sId] = Date.now();
    return dbVersions[sId];
}

// دالة ذكية لمعرفة الـ IP الداخلي الحقيقي لجهاز الكمبيوتر بـ Wi-Fi المحل
function getLocalIpAddress() {
    const interfaces = os.networkInterfaces();
    let preferredIp = null;
    let fallbackIp = null;

    for (const name of Object.keys(interfaces)) {
        for (const iface of interfaces[name]) {
            if (iface.family === 'IPv4' && !iface.internal) {
                const ip = iface.address;
                // تجاهل عناوين الوصلات الوهمية و Tailscale (169.254.x.x)
                if (ip.startsWith('169.254.')) continue;

                const nameLower = name.toLowerCase();
                if (nameLower.includes('wi-fi') || nameLower.includes('wifi') || nameLower.includes('ethernet') || nameLower.includes('ايثرنت')) {
                    return ip;
                }
                if (ip.startsWith('192.168.') || ip.startsWith('10.') || ip.startsWith('172.')) {
                    preferredIp = ip;
                } else {
                    fallbackIp = ip;
                }
            }
        }
    }
    return preferredIp || fallbackIp || '127.0.0.1';
}

const server = http.createServer((req, res) => {
    // تمكين CORS للسماح بالاتصال من أي جهاز بالشبكة المحلية دون قيود متصفح
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }

    // تفكيك الرابط وقراءة المعاملات
    const parsedUrl = new URL(req.url, `http://${req.headers.host}`);
    const pathname = parsedUrl.pathname;

    // 0. استرجاع معلومات عنوان IP للشبكة المحلية وحالة الاتصال لربط الهواتف
    if (pathname === '/api/info' && req.method === 'GET') {
        const localIp = getLocalIpAddress();
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ 
            localIp, 
            port: PORT, 
            localUrl: `http://${localIp}:${PORT}`,
            cloudflareUrl,
            fullUrl: cloudflareUrl || `http://${localIp}:${PORT}`
        }));
        return;
    }

    
    if (pathname === '/api/db' && req.method === 'GET') {
        const storeId = parsedUrl.searchParams.get('storeId') || 'main';
        fs.readFile(getDbFilePath(storeId), 'utf8', (err, data) => {
            if (err) {
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: "فشل قراءة قاعدة البيانات من الخادم" }));
                return;
            }
            res.writeHead(200, { 
                'Content-Type': 'application/json; charset=utf-8',
                'X-DB-Version': getDbVersion(storeId).toString()
            });
            res.end(data);
        });
        return;
    }

    // فحص نسخة وتحديثات قاعدة البيانات بالملي ثانية
    if (pathname === '/api/sync-check' && req.method === 'GET') {
        const storeId = parsedUrl.searchParams.get('storeId') || 'main';
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ dbVersion: getDbVersion(storeId) }));
        return;
    }

    // 2. واجهة المراقبة البعيدة واسترجاع ملخص المحل لحظة بلحظة عن بعد للمالك
    if (pathname === '/api/remote-summary' && req.method === 'GET') {
        const storeId = parsedUrl.searchParams.get('storeId') || 'main';
        fs.readFile(getDbFilePath(storeId), 'utf8', (err, data) => {
            if (err) {
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: "فشل قراءة قاعدة البيانات" }));
                return;
            }
            try {
                const db = JSON.parse(data);
                const todayStr = new Date().toDateString();
                let todaySalesTotal = 0;
                let todaySalesCount = 0;
                let todayProfit = 0;

                (db.transactions || []).forEach(t => {
                    if (new Date(t.timestamp).toDateString() === todayStr) {
                        todaySalesCount++;
                        todaySalesTotal += parseFloat(t.total) || 0;
                        todayProfit += parseFloat(t.profit) || 0;
                    }
                });

                const lowStockCount = (db.products || []).filter(p => (parseFloat(p.qty) || 0) <= 5).length;

                res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
                res.end(JSON.stringify({
                    storeName: db.storeSettings?.name || "متجري الذكي",
                    todaySalesTotal,
                    todaySalesCount,
                    todayProfit,
                    lowStockCount,
                    totalProducts: db.products?.length || 0,
                    dbVersion: getDbVersion(storeId),
                    lastSync: new Date().toISOString()
                }));
            } catch (e) {
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: "خطأ تحليل قاعدة البيانات" }));
            }
        });
        return;
    }

    // مزامنة وحفظ البيانات الجديدة من أي حاسوب كاشير أو للمدير مع النسخ الاحتياطي التلقائي
    if (pathname === '/api/sync' && req.method === 'POST') {
        const storeId = parsedUrl.searchParams.get('storeId') || 'main';
        let body = '';
        req.on('data', chunk => { body += chunk.toString(); });
        req.on('end', () => {
            try {
                const incomingData = JSON.parse(body);
                
                // كتابة وحفظ البيانات الجديدة بالملف المشترك
                fs.writeFile(getDbFilePath(storeId), JSON.stringify(incomingData, null, 2), 'utf8', (err) => {
                    if (err) {
                        res.writeHead(500, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ error: "فشل حفظ البيانات بالخادم المشترك" }));
                        return;
                    }
                    
                    // إنشاء نسخة احتياطية دورية في مجلد backups
                    const dataDir = process.env.DATA_DIR || __dirname;
                    const backupDir = path.join(dataDir, 'backups');
                    if (!fs.existsSync(backupDir)) {
                        fs.mkdirSync(backupDir, { recursive: true });
                    }
                    const backupFileName = `backup_${storeId}_${new Date().toISOString().split('T')[0]}.json`;
                    fs.writeFile(path.join(backupDir, backupFileName), JSON.stringify(incomingData, null, 2), () => {});

                    // تحديث رقم الإصدار لتنبيه بقية الأجهزة فوراً للتحديث!
                    const newVersion = updateDbVersion(storeId);
                    
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ success: true, dbVersion: newVersion }));
                });
            } catch (e) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: "بيانات JSON غير صالحة" }));
            }
        });
        return;
    }

    // تسجيل الأخطاء من متصفح العميل لتشخيص المشاكل البعيدة
    if (pathname === '/api/log-error' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => { body += chunk.toString(); });
        req.on('end', () => {
            try {
                fs.appendFileSync(path.join(__dirname, 'browser_errors.log'), `${new Date().toISOString()} - ${body}\n`, 'utf8');
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: true }));
            } catch (e) {
                res.writeHead(500);
                res.end();
            }
        });
        return;
    }

    // 2. موزع الملفات الاستاتيكية لتصفح البرنامج عبر الشبكة المحلية
    let relativePath = pathname === '/' ? 'index.html' : pathname;
    
    // فك الترميز لتجنب مشاكل الحروف العربية بالروابط ومجلدات المحل
    relativePath = decodeURIComponent(relativePath);
    let filePath = path.join(__dirname, relativePath);
    
    // تأمين مسار المجلد لمنع التصفح خارج مجلد المشروع
    if (!filePath.startsWith(__dirname)) {
        res.writeHead(403);
        res.end('Access Denied');
        return;
    }

    const extname = path.extname(filePath);
    let contentType = 'text/html';
    
    switch (extname) {
        case '.js': contentType = 'text/javascript'; break;
        case '.css': contentType = 'text/css'; break;
        case '.json': contentType = 'application/json'; break;
        case '.png': contentType = 'image/png'; break;
        case '.jpg': contentType = 'image/jpg'; break;
        case '.ico': contentType = 'image/x-icon'; break;
        case '.svg': contentType = 'image/svg+xml'; break;
    }

    fs.readFile(filePath, (err, content) => {
        if (err) {
            if (err.code === 'ENOENT') {
                res.writeHead(404);
                res.end('File Not Found');
            } else {
                res.writeHead(500);
                res.end(`Server Error: ${err.code}`);
            }
        } else {
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(content, 'utf-8');
        }
    });
});

server.listen(PORT, '0.0.0.0', () => {
    const localIp = getLocalIpAddress();
    console.log('\n===============================================================');
    console.log('       🚀 خادم المحل المتزامن (LAN Server) يشتغل بنجاح! 🚀');
    console.log('===============================================================');
    console.log(`  🏠 على هذا الجهاز الرئيسي (المدير): http://localhost:${PORT}`);
    console.log(`  🌐 لتوصيل الحواسيب الأربعة الأخرى، افتح متصفحاتها واكتب:`);
    console.log(`     👉 http://${localIp}:${PORT}`);
    console.log('===============================================================\n');
    
    // تشغيل نفق الاتصال الآمن تلقائياً
    startSecureTunnel();
});
