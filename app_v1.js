/* ==========================================

   نظام تسيير المحل الذكي - ملف البرمجة الرئيسي (JS)

   يتحكم في منطق التطبيق وحفظ البيانات والباركود والطباعة

========================================== */

// معالج الأخطاء العام للمتصفح لتسهيل التشخيص

window.addEventListener('error', function(e) {

    alert("⚠️ خطأ في تشغيل النظام: " + e.message + "\nالسطر: " + e.lineno + "\nالملف: " + e.filename);

});

// 1. هيكل بيانات التطبيق (الحالة العامة)

let appState = {

    storeSettings: {

        name: "متجر الذكاء",

        type: "grocery", // 'cosmetic' | 'veggies' | 'grocery'

        initialized: false

    },

    products: [],

    cart: [],

    transactions: [],

    heldCarts: [],

    debts: [],

    users: [

        { id: "admin", displayName: "المدير العام", username: "admin", password: "admin", role: "admin", canOverridePrice: true },

        { id: "cashier1", displayName: "الكاشير الأول", username: "cashier1", password: "123", role: "cashier", canOverridePrice: false }

    ],

    currentUser: null, // الحساب النشط بعد تسجيل الدخول

    theme: "light",

    activeTab: "dashboard",

    filterLowStockOnly: false

};

// مكتبة السلع الافتراضية لكل نشاط تجاري لتحسين التجربة الأولى للمستخدم

const defaultProducts = {

    cosmetic: [

        { id: "c1", barcode: "613000000001", name: "شامبو كيراتين مغذي 400مل", buyPrice: 450, sellPrice: 650, qty: 15, unit: "قطعة", category: "العناية بالشعر" },

        { id: "c2", barcode: "613000000002", name: "أحمر شفاه مخملي مطفأ", buyPrice: 300, sellPrice: 550, qty: 4, unit: "قطعة", category: "مكياج" }, // مخزون منخفض للتجربة

        { id: "c3", barcode: "613000000003", name: "كريم مرطب للبشرة الجافة", buyPrice: 700, sellPrice: 1100, qty: 25, unit: "قطعة", category: "العناية بالبشرة" },

        { id: "c4", barcode: "613000000004", name: "عطر رويال فاخر 100مل", buyPrice: 2200, sellPrice: 3500, qty: 8, unit: "قطعة", category: "عطور" },

        { id: "c5", barcode: "613000000005", name: "طلاء أظافر سريع الجفاف", buyPrice: 90, sellPrice: 180, qty: 3, unit: "قطعة", category: "مكياج" }, // مخزون منخفض للتجربة

        { id: "c6", barcode: "613000000006", name: "صابون طبيعي بالودعة والليمون", buyPrice: 150, sellPrice: 250, qty: 40, unit: "قطعة", category: "العناية بالبشرة" }

    ],

    veggies: [

        { id: "v1", barcode: "613000000011", name: "طماطم طازجة محلية", buyPrice: 85, sellPrice: 130, qty: 50, unit: "كيلوغرام", category: "خضروات" },

        { id: "v2", barcode: "613000000012", name: "بطاطا بيضاء ممتاز", buyPrice: 55, sellPrice: 75, qty: 120, unit: "كيلوغرام", category: "خضروات" },

        { id: "v3", barcode: "613000000013", name: "تفاح أحمر محلي جودة أولى", buyPrice: 200, sellPrice: 320, qty: 4, unit: "كيلوغرام", category: "فواكه" }, // مخزون منخفض للتجربة

        { id: "v4", barcode: "613000000014", name: "موز مستورد حلو", buyPrice: 260, sellPrice: 340, qty: 80, unit: "كيلوغرام", category: "فواكه" },

        { id: "v5", barcode: "613000000015", name: "بصل أحمر حلو", buyPrice: 45, sellPrice: 65, qty: 3, unit: "كيلوغرام", category: "خضروات" } // مخزون منخفض للتجربة

    ],

    grocery: [
        { id: "g1", barcode: "613000000021", name: "حليب كونديا معقم 1لتر", buyPrice: 85, sellPrice: 115, qty: 36, unit: "علبة", category: "ألبان وأجبان", image: "images/milk.png" },
        { id: "g2", barcode: "613000000022", name: "قهوة بون عمران 250غ", buyPrice: 160, sellPrice: 220, qty: 20, unit: "علبة", category: "معلبات", image: "images/coffee.png" },
        { id: "g3", barcode: "613000000023", name: "كوكا كولا 1.5لتر", buyPrice: 130, sellPrice: 160, qty: 24, unit: "قارورة", category: "مشروبات", image: "images/coca.png" },
        { id: "g4", barcode: "613000000024", name: "خبز باجيت طازج", buyPrice: 10, sellPrice: 15, qty: 80, unit: "قطعة", category: "مخبوزات", image: "images/bread.png" },
        { id: "g5", barcode: "613000000025", name: "جبن شاف 16 قطعة", buyPrice: 180, sellPrice: 220, qty: 15, unit: "علبة", category: "ألبان وأجبان", image: "images/cheese.png" }
    ]
};

// مغير صوتي للمسح كود الباركود بنجاح (Web Audio API)

function playBeep() {

    try {

        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

        const oscillator = audioCtx.createOscillator();

        const gainNode = audioCtx.createGain();

        oscillator.connect(gainNode);

        gainNode.connect(audioCtx.destination);

        oscillator.type = "sine";

        oscillator.frequency.setValueAtTime(800, audioCtx.currentTime); // التردد بالهرتز

        gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime); // مستوى الصوت

        oscillator.start();

        oscillator.stop(audioCtx.currentTime + 0.1); // مدة الرنين 100 ملي ثانية

    } catch (e) {

        console.log("AudioContext is not allowed or supported yet.", e);

    }

}

// 2. دوال معالجة التخزين المحلي (Local Storage)

function saveToLocalStorage() {

    localStorage.setItem("smart_shop_state", JSON.stringify(appState));

    if (typeof lanSyncMode !== 'undefined' && lanSyncMode && typeof isSyncing !== 'undefined' && !isSyncing) {

        sendDataToServer();

    }

}

function loadFromLocalStorage() {

    const saved = localStorage.getItem("smart_shop_state");

    if (saved) {

        try {

            appState = JSON.parse(saved);

            // التأكد من أن المصفوفات موجودة

            if (!appState.products) appState.products = [];

            if (!appState.cart) appState.cart = [];

            if (!appState.transactions) appState.transactions = [];

            if (!appState.heldCarts) appState.heldCarts = [];

            if (!appState.debts) appState.debts = [];

            if (!appState.supplierDebts) appState.supplierDebts = [];

            if (!appState.customers) appState.customers = [];

            // ترحيل الديون العادية للزبائن العابرين السابقة إلى قائمة الزبائن الدائمين الموحدة
            if (appState.debts && appState.debts.length > 0) {
                appState.debts.forEach(d => {
                    if (d.status !== "settled") {
                        let customer = appState.customers.find(c => c.name.toLowerCase() === d.customerName.toLowerCase());
                        if (!customer) {
                            customer = {
                                id: "C-" + Date.now().toString(16).toUpperCase() + Math.random().toString(36).substring(2, 5),
                                name: d.customerName,
                                phone: "",
                                address: "تم استيراده من ديون العابرين",
                                debt: 0,
                                transactions: []
                            };
                            appState.customers.push(customer);
                        }
                        customer.debt = (customer.debt || 0) + d.amount;
                        if (!customer.transactions) customer.transactions = [];
                        customer.transactions.push({
                            id: d.transactionId || ('CT-' + Date.now().toString(16).toUpperCase()),
                            type: 'sale',
                            amount: d.amount,
                            note: 'دين مستورد من سجل العابرين',
                            date: d.timestamp || new Date().toISOString()
                        });
                    }
                });
                appState.debts = [];
                // لا نحتاج لحفظ فوري هنا، سيتم الحفظ لاحقاً أو مع التهيئة
            }

            if (!appState.expenses) appState.expenses = [];

            if (!appState.cashBalance) appState.cashBalance = [];

            if (!appState.adminLogs) appState.adminLogs = [];

            if (!appState.storeSettings) {

                appState.storeSettings = {

                    name: "متجر الذكاء",

                    type: "grocery",

                    initialized: true,

                    showLogoOnReceipt: false,

                    printerType: "A4"

                };

            }

            if (appState.storeSettings.showLogoOnReceipt === undefined) {

                appState.storeSettings.showLogoOnReceipt = false;

            }

            if (appState.storeSettings.printerType === undefined) {

                appState.storeSettings.printerType = "A4";

            }
            
            if (appState.storeSettings.customProfitPercent === undefined) {
                appState.storeSettings.customProfitPercent = 20;
            }

            appState.filterLowStockOnly = false; // دائماً نبدأ الفلترة بـ false عند التشغيل

            // تنظيف أي منتجات مخصصة قديمة ليست في السلة حالياً لمنع تراكمها
            if (appState.products) {
                const cartProductIds = new Set(appState.cart.map(item => item.productId));
                if (appState.heldCarts) {
                    appState.heldCarts.forEach(hc => {
                        if (hc.cart) {
                            hc.cart.forEach(item => cartProductIds.add(item.productId));
                        }
                    });
                }
                appState.products = appState.products.filter(p => !p.isCustomItem || cartProductIds.has(p.id));
            }
            if (!appState.users || appState.users.length === 0) {

                appState.users = [

                    { id: "admin", displayName: "المدير العام", username: "admin", password: "admin", role: "admin", canOverridePrice: true },

                    { id: "cashier1", displayName: "الكاشير الأول", username: "cashier1", password: "123", role: "cashier", canOverridePrice: false }

                ];

            }

            return true;

        } catch (e) {

            console.error("خطأ في قراءة البيانات المحفوظة", e);

            return false;

        }

    }

    return false;

}

// 3. إدارة التبويبات والواجهات

function switchTab(tabId) {

    // تم إلغاء حظر الكاشير تماماً لإتاحة التجربة والاختبار الفوري لجميع التبويبات والأزرار بدون أي تعقيد.

    appState.activeTab = tabId;

    saveToLocalStorage();

    // إدارة وضع التخطيط المنقسم لتبويب البيع

    const container = document.getElementById("app-container");

    if (container) {

        if (tabId === "pos") {

            container.classList.add("pos-active");

        } else {

            container.classList.remove("pos-active");

        }

    }

    saveToLocalStorage();

    // إخفاء كافة التبويبات وتفعيل التبويب المختار

    document.querySelectorAll(".tab-content").forEach(el => el.classList.remove("active"));

    document.querySelectorAll(".menu-item").forEach(el => el.classList.remove("active"));

    const activeSection = document.getElementById(`tab-${tabId}`);

    if (activeSection) activeSection.classList.add("active");

    if (tabId === "inventory") {
        appState.filterLowStockOnly = false;
        const searchInput = document.getElementById("inventory-search-input");
        if (searchInput) searchInput.value = "";
        if (typeof renderInventoryTable === 'function') renderInventoryTable();
    } else if (tabId === "sales") {
        if (window.renderSalesTabTable) window.renderSalesTabTable();
    } else if (tabId === "settings") {
        if (window.renderSettingsTab) window.renderSettingsTab();
    } else if (tabId === "scanner-diag") {
        if (window.initBarcodeDiagTool) window.initBarcodeDiagTool();
    } else if (tabId === "audit") {
        if (window.renderAuditTable) window.renderAuditTable();
    } else if (tabId === "logs") {
        if (window.renderAuditLogsTable) window.renderAuditLogsTable();
    }

    const menuLink = document.querySelector(`.menu-item[data-tab="${tabId}"]`);
    if (menuLink) menuLink.classList.add("active");

    // تحديث شريط التنقل للموبايل والقائمة الجانبية
    document.querySelectorAll(".mobile-bottom-nav .mobile-nav-item, .sidebar-menu-item").forEach(el => {
        if (el.getAttribute("data-tab") === tabId || (el.getAttribute("onclick") && el.getAttribute("onclick").includes(`'${tabId}'`))) {
            el.classList.add("active");
        } else {
            el.classList.remove("active");
        }
    });

    // تحسين واجهة البيع POS: تفعيل الفوكس التلقائي على حقل الباركود

    if (tabId === "pos") {

        setTimeout(() => {

            const barcodeInput = document.getElementById("pos-barcode-input");

            if (barcodeInput) barcodeInput.focus();

        }, 200);

    }

    // تحديث البيانات المعروضة في التبويب المستهدف

    refreshUI();

}

// 4. تطبيق السمة اللونية ديناميكياً (سوبيرات مواد غذائية افتراضياً)

function applyStoreTheme() {

    // استعادة لون الأزرار المخصص إن وجد
    if (appState.accentColor && appState.accentColor.hex) {
        document.documentElement.style.setProperty('--accent-color', appState.accentColor.hex);
        if (appState.accentColor.gradient) {
            document.documentElement.style.setProperty('--accent-gradient', appState.accentColor.gradient);
        }
    }


    const root = document.documentElement;

    const logoIcon = document.getElementById("store-logo-icon");

    const typeLabel = document.getElementById("display-store-type");

    root.style.setProperty("--accent-color", "var(--grocery-accent)");

    root.style.setProperty("--accent-gradient", "var(--grocery-gradient)");

    if (logoIcon) logoIcon.className = "fa-solid fa-cart-shopping";

    if (typeLabel) typeLabel.innerText = "سوبيرات / مواد غذائية عامة";

}

// التأكد من دمج السلع الأكثر مبيعاً مع صورها في المخزن لتبديل الواجهة ومزامنتها
function ensureDefaultGroceryImagesExist() {
    if (!appState.products) appState.products = [];
    
    const items = [
        { id: "g1", barcode: "613000000021", name: "حليب كونديا معقم 1لتر", buyPrice: 85, sellPrice: 115, qty: 36, unit: "علبة", category: "ألبان وأجبان", image: "images/milk.png" },
        { id: "g2", barcode: "613000000022", name: "قهوة بون عمران 250غ", buyPrice: 160, sellPrice: 220, qty: 20, unit: "علبة", category: "معلبات", image: "images/coffee.png" },
        { id: "g3", barcode: "613000000023", name: "كوكا كولا 1.5لتر", buyPrice: 130, sellPrice: 160, qty: 24, unit: "قارورة", category: "مشروبات", image: "images/coca.png" },
        { id: "g4", barcode: "613000000024", name: "خبز باجيت طازج", buyPrice: 10, sellPrice: 15, qty: 80, unit: "قطعة", category: "مخبوزات", image: "images/bread.png" },
        { id: "g5", barcode: "613000000025", name: "جبن شاف 16 قطعة", buyPrice: 180, sellPrice: 220, qty: 15, unit: "علبة", category: "ألبان وأجبان", image: "images/cheese.png" }
    ];

    items.forEach(defItem => {
        const existing = appState.products.find(p => p.id === defItem.id || p.barcode === defItem.barcode);
        if (!existing) {
            appState.products.push(defItem);
        } else {
            existing.image = defItem.image;
            existing.name = defItem.name;
            existing.category = defItem.category;
            if (existing.qty === undefined || existing.qty <= 0) existing.qty = defItem.qty;
        }
    });
    saveToLocalStorage();
}

// 5. تهيئة التطبيق عند البدء
document.addEventListener("DOMContentLoaded", () => {

    // التحقق من تفعيل ترخيص البرنامج
    window.checkAppLicense();

    // محاولة تحميل البيانات من ذاكرة المتصفح أولاً كبيانات افتراضية سريعة
    let hasData = loadFromLocalStorage();

    // دمج وضمان وجود الصور للسلع الافتراضية الأكثر مبيعاً
    ensureDefaultGroceryImagesExist();

    // إذا لم تكن البيانات مهيئة، نقوم بتهيئتها تلقائياً

    if (!hasData || !appState.storeSettings || !appState.storeSettings.initialized) {

        appState.storeSettings = {

            name: "متجري الذكي",

            type: "grocery",

            initialized: true

        };

        appState.products = [...defaultProducts["grocery"]];

        ensureQuickSellProductsExist();

        appState.cart = [];

        appState.transactions = [];

        appState.heldCarts = [];

        appState.supplierDebts = [];

        appState.activeTab = "dashboard";

        saveToLocalStorage();

        hasData = true;

    }

    // تسجيل الدخول التلقائي كمسؤول لمنع حظر التبويبات عند التشغيل المحلي

    if (!appState.currentUser) {

        const adminUser = appState.users.find(u => u.role === "admin") || { id: "admin", displayName: "المدير العام", username: "admin", password: "admin", role: "admin", canOverridePrice: true };

        appState.currentUser = adminUser;

        saveToLocalStorage();

    }

    // تهيئة الواجهة والمستمعين فوراً ودون أي تأخير لضمان استجابة الأزرار

    try {

        ensureQuickSellProductsExist();

        // تطبيق السمة ونوع المحل واسمه

        applyStoreTheme(appState.storeSettings.type);

        updateStoreNameUI(appState.storeSettings.name);

        // إظهار شاشة التطبيق الرئيسية وإخفاء شاشات الدخول

        document.getElementById("setup-screen").classList.add("hidden");

        document.getElementById("login-screen").classList.add("hidden");

        document.getElementById("app-container").classList.remove("hidden");

        applyUserPermissions(appState.currentUser.role);

        // 1. ربط مستمعي الأحداث البرمجية للأزرار والنماذج أولاً لضمان عملها

        setupEventListeners();

        setupBonAchatListeners();

        setupSupplierDebtsListeners();

        setupStoreSettingsAndChartsListeners();

        initNewModules();

        // 2. تفعيل المزامنة الموحدة مع السيرفر وتفريغ القواعد المحلية القديمة
        initDatabaseSync();

        // 3. استدعاء الرندرة وتبديل التبويب النشط لاحقاً
        switchTab(appState.activeTab || "dashboard");

        // إعداد توقيت الساعة والتاريخ الفوري

        updateDateTime();

        setInterval(updateDateTime, 60000);

    } catch (err) {

        alert("⚠️ خطأ أثناء تهيئة الواجهة: " + err.message + "\nتفاصيل: " + err.stack);

        console.error("خطأ أثناء تهيئة الواجهة المحلية:", err);

    }

    // تم تعطيل مزامنة قاعدة البيانات لجعل البرنامج محلياً 100% بنمط فردي سريع وخفيف.

});

// تحديث وعرض التاريخ والوقت في الترويسة

function updateDateTime() {

    const dtEl = document.getElementById("current-date-time");

    if (!dtEl) return;

    const now = new Date();

    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };

    dtEl.innerText = now.toLocaleDateString('ar-DZ', options);

}

// تحديث اسم المحل في كافة الواجهات

function updateStoreNameUI(name) {

    const displayNameEl = document.getElementById("display-store-name");

    if (displayNameEl) displayNameEl.innerText = name;

    const headerStoreNameEl = document.getElementById("header-store-name");

    if (headerStoreNameEl) headerStoreNameEl.innerText = name;

    const receiptStoreNameEl = document.getElementById("receipt-store-name");

    if (receiptStoreNameEl) receiptStoreNameEl.innerText = name;

}

// 6. ربط مستمعي الأحداث (Event Listeners)

function setupEventListeners() {

    // مستمعي تفعيل ترخيص البرنامج
    const btnActivate = document.getElementById("btn-activate-license");
    if (btnActivate) {
        btnActivate.addEventListener("click", () => window.activateLicenseKey());
    }
    const keyInput = document.getElementById("license-key-input");
    if (keyInput) {
        keyInput.addEventListener("keydown", (e) => {
            if (e.key === "Enter") {
                e.preventDefault();
                window.activateLicenseKey();
            }
        });
    }

    // فتح وإغلاق وتأكيد مودال الترخيص والأكواد الجاهزة
    const btnOpenLicenseModal = document.getElementById("btn-open-license-modal");
    if (btnOpenLicenseModal) {
        btnOpenLicenseModal.addEventListener("click", () => {
            const modal = document.getElementById("license-manage-modal");
            if (modal) {
                modal.classList.remove("hidden");
                window.checkAppLicense();
            }
        });
    }

    const btnCloseLicenseModal = document.getElementById("btn-close-license-modal");
    if (btnCloseLicenseModal) {
        btnCloseLicenseModal.addEventListener("click", () => {
            const modal = document.getElementById("license-manage-modal");
            if (modal) modal.classList.add("hidden");
        });
    }

    const btnSubmitLicenseModal = document.getElementById("btn-submit-license-modal");
    if (btnSubmitLicenseModal) {
        btnSubmitLicenseModal.addEventListener("click", () => {
            window.activateLicenseKey();
        });
    }

    const modalInput = document.getElementById("license-modal-input");
    if (modalInput) {
        modalInput.addEventListener("keydown", (e) => {
            if (e.key === "Enter") {
                e.preventDefault();
                window.activateLicenseKey();
            }
        });
    }

    // أزرار النقر السريع على الأكواد المتاحة
    document.querySelectorAll(".quick-license-code-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            const code = btn.getAttribute("data-code");
            if (code) {
                const input = document.getElementById("license-modal-input");
                if (input) input.value = code;
                window.activateLicenseKey(code);
            }
        });
    });

    // 0. نموذج تسجيل الدخول

    const loginForm = document.getElementById("login-form");

    if (loginForm) {

        loginForm.addEventListener("submit", (e) => {

            e.preventDefault();

            const username = document.getElementById("login-username").value.trim().toLowerCase();

            const passwordInput = document.getElementById("login-password");

            const password = passwordInput.value;

            const user = appState.users.find(u => u.username.trim().toLowerCase() === username);

            if (user && user.password === password) {

                appState.currentUser = user;

                saveToLocalStorage();

                // إخفاء شاشة تسجيل الدخول وعرض البرنامج

                document.getElementById("login-screen").classList.add("hidden");

                document.getElementById("app-container").classList.remove("hidden");

                // تصفير حقول تسجيل الدخول

                passwordInput.value = "";

                document.getElementById("login-username").value = "";

                // تطبيق الصلاحيات والتبويبات

                applyUserPermissions(user.role);

                if (user.role === "cashier") {

                    switchTab("pos");

                } else {

                    switchTab(appState.activeTab || "dashboard");

                }

                refreshUI();

                showToast(`👋 مرحباً بك مجدداً: ${user.displayName}!`);

            } else {

                alert("⚠️ خطأ: اسم المستخدم أو كلمة المرور غير صحيحة!");

            }

        });

    }

    // زر تسجيل الخروج

    const logoutBtn = document.getElementById("btn-logout");

    if (logoutBtn) {

        logoutBtn.addEventListener("click", () => {

            if (confirm("هل أنت متأكد من رغبتك في تسجيل الخروج؟")) {

                appState.currentUser = null;

                appState.cart = []; // تصفير السلة كإجراء أمان

                saveToLocalStorage();

                // إخفاء وعرض الواجهات

                document.getElementById("app-container").classList.add("hidden");

                document.getElementById("login-screen").classList.remove("hidden");

                renderLoginDropdown();

            }

        });

    }

    // 1. نموذج الإعداد الأول

    const setupForm = document.getElementById("setup-form");

    if (setupForm) {

        setupForm.addEventListener("submit", (e) => {

            e.preventDefault();

            const name = document.getElementById("setup-store-name").value.trim() || "متجري الذكي";

            const type = document.querySelector('input[name="store-type"]:checked').value;

            appState.storeSettings = {

                name: name,

                type: type,

                initialized: true

            };

            // تحميل السلع الافتراضية المخصصة

            appState.products = [...defaultProducts[type]];

            ensureQuickSellProductsExist();

            appState.cart = [];

            appState.transactions = [];

            appState.heldCarts = [];

            appState.activeTab = "dashboard";

            saveToLocalStorage();

            // تحويل الشاشة وتطبيق السمة

            document.getElementById("setup-screen").classList.add("hidden");

            document.getElementById("app-container").classList.remove("hidden");

            applyStoreTheme(type);

            updateStoreNameUI(name);

            switchTab("dashboard");

        });

    }

    // 2. تبديل التبويبات الجانبية

    document.querySelectorAll(".menu-item").forEach(item => {

        item.addEventListener("click", (e) => {

            e.preventDefault();

            const tabId = item.getAttribute("data-tab");

            if (tabId) switchTab(tabId);

        });

    });

    // 3. تعديل اسم المحل عند الضغط المزدوج

    const storeTitle = document.getElementById("display-store-name");

    if (storeTitle) {

        storeTitle.addEventListener("dblclick", () => {

            const currentName = appState.storeSettings.name;

            const newName = prompt("أدخل اسم المحل الجديد ليعتمد في الواجهة وفواتير الطباعة:", currentName);

            if (newName && newName.trim() !== "") {

                appState.storeSettings.name = newName.trim();

                saveToLocalStorage();

                updateStoreNameUI(newName.trim());

            }

        });

    }

    // زر تفعيل نمط السرعة الفائقة للأجهزة الضعيفة (Fast Performance Mode)

    const perfBtn = document.getElementById("btn-perf-toggle");

    if (perfBtn) {

        perfBtn.addEventListener("click", () => {

            const isPerfMode = document.body.classList.toggle("perf-mode");

            localStorage.setItem("smart_shop_perf_mode", isPerfMode ? "true" : "false");

            if (isPerfMode) {

                perfBtn.classList.add("perf-active");

                showToast("⚡ تم تفعيل نمط السرعة الفائقة لتسريع الجهاز!");

            } else {

                perfBtn.classList.remove("perf-active");

                showToast("✨ تم العودة للمظهر الزجاجي الافتراضي.");

            }

        });

        // استعادة الحالة عند التشغيل

        const savedPerfMode = localStorage.getItem("smart_shop_perf_mode");

        if (savedPerfMode === "true") {

            document.body.classList.add("perf-mode");

            perfBtn.classList.add("perf-active");

        }

    }

    // 5. زر تفعيل الوضع المظلم

    const themeBtn = document.getElementById("btn-theme-toggle");

    if (themeBtn) {

        themeBtn.addEventListener("click", () => {

            const currentTheme = document.documentElement.getAttribute("data-theme");

            const newTheme = currentTheme === "dark" ? "light" : "dark";

            document.documentElement.setAttribute("data-theme", newTheme);

            appState.theme = newTheme;

            saveToLocalStorage();

            const span = themeBtn.querySelector("span");

            if (span) span.innerText = newTheme === "dark" ? "الوضع الفاتح" : "الوضع المظلم";

            const icon = themeBtn.querySelector("i");

            if (icon) icon.className = newTheme === "dark" ? "fa-solid fa-sun" : "fa-solid fa-moon";

        });

    }

    // تطبيق السمة المظلمة عند البدء إذا كانت محفوظة

    if (appState.theme === "dark") {

        document.documentElement.setAttribute("data-theme", "dark");

        const themeBtn = document.getElementById("btn-theme-toggle");

        if (themeBtn) {

            const span = themeBtn.querySelector("span");

            if (span) span.innerText = "الوضع الفاتح";

            const icon = themeBtn.querySelector("i");

            if (icon) icon.className = "fa-solid fa-sun";

        }

    }

    // زر تفعيل الشاشة الكاملة

    const fullscreenBtn = document.getElementById("btn-fullscreen-toggle");

    if (fullscreenBtn) {

        fullscreenBtn.addEventListener("click", () => {

            toggleFullScreen();

        });

    }

    // ================== واجهة البيع POS Events ==================

    // البحث اليدوي والحي التفاعلي عن السلع مع قائمة الخيارات المنبثقة لكل السلع
    const posSearchInput = document.getElementById("pos-search-input");
    if (posSearchInput) {
        posSearchInput.addEventListener("input", () => {
            renderPosQuickShortcuts();
            renderPosProducts();
            renderPosSearchDropdown();
        });

        posSearchInput.addEventListener("keydown", (e) => {
            if (e.key === "Enter") {
                const query = posSearchInput.value.toLowerCase().trim();
                if (query !== "") {
                    const matches = (appState.products || []).filter(p => !p.isCustomItem && ((p.name && p.name.toLowerCase().includes(query)) || (p.barcode && p.barcode.includes(query))));
                    if (matches.length > 0) {
                        e.preventDefault();
                        selectProductFromSearchDropdown(matches[0].id);
                    }
                }
            } else if (e.key === "Escape") {
                const dropdown = document.getElementById("pos-search-dropdown-results");
                if (dropdown) dropdown.classList.add("hidden");
            }
        });
    }

    // إخفاء قائمة البحث المنبثقة عند النقر في أي مكان خارج مربع البحث
    document.addEventListener("click", (e) => {
        const searchBox = document.querySelector(".search-box-compact");
        const dropdown = document.getElementById("pos-search-dropdown-results");
        if (dropdown && searchBox && !searchBox.contains(e.target)) {
            dropdown.classList.add("hidden");
        }
    });

    // معالجة الباركود من القارئ التلقائي الخارجي

    const posBarcodeInput = document.getElementById("pos-barcode-input");

    if (posBarcodeInput) {

        posBarcodeInput.addEventListener("keydown", (e) => {

            if (e.key === "Enter") {

                e.preventDefault();

                const barcode = posBarcodeInput.value.trim();

                if (barcode !== "") {

                    addProductToCartByBarcode(barcode);

                    posBarcodeInput.value = ""; // تفريغ الحقل لاستقبال المسح القادم

                    posBarcodeInput.focus();

                }

            }

        });

        // فوكس مستمر لحقل الباركود عند الضغط على أي مساحة فارغة في الواجهة لضمان سرعة مسح المواد بدون استخدام الفأرة

        document.addEventListener("click", (e) => {

            if (appState.activeTab === "pos") {

                // إذا كان أي من مودالات المبيعات مفتوحاً، لا تسرق الفوكس لصالح حقل الباركود أبداً
                const qtyModal = document.getElementById("quick-qty-modal");
                const customAmountModal = document.getElementById("custom-amount-modal");
                const multiplyQtyModal = document.getElementById("multiply-qty-modal");
                if ((qtyModal && !qtyModal.classList.contains("hidden")) ||
                    (customAmountModal && !customAmountModal.classList.contains("hidden")) ||
                    (multiplyQtyModal && !multiplyQtyModal.classList.contains("hidden"))) {
                    return;
                }

                const isInputOrButton = e.target.tagName === "INPUT" || e.target.tagName === "BUTTON" || e.target.tagName === "A" || e.target.closest("button") || e.target.closest("input") || e.target.closest("select");

                if (!isInputOrButton) {

                    posBarcodeInput.focus();

                }

            }

        });

    }



    // إدخال المبلغ المدفوع لحساب الباقي تلقائياً والضغط على Enter للتأكيد والطباعة الفورية

    const receivedInput = document.getElementById("cart-received-amount");

    if (receivedInput) {

        receivedInput.addEventListener("input", () => {

            calculateCartTotals();

        });

        receivedInput.addEventListener("keydown", (e) => {
            if (e.key === "Enter") {
                e.preventDefault();
                processCheckout(false); // حفظ البيع فقط بدون طباعة
            }
        });
    }

    // زر تأكيد المبيعات فقط (بدون طباعة)
    const checkoutBtn = document.getElementById("btn-checkout");
    if (checkoutBtn) {
        checkoutBtn.addEventListener("click", () => {
            processCheckout(false); // حفظ البيع فقط بدون طباعة
        });
    }

    // أزرار مودال الفاتورة والاختصار العام F3 للطباعة
    const btnPrintConfirm = document.getElementById("btn-print-receipt-confirm");
    if (btnPrintConfirm) {
        btnPrintConfirm.addEventListener("click", () => {
            window.print();
        });
    }

    const btnSkipPrint = document.getElementById("btn-skip-print");
    if (btnSkipPrint) {
        btnSkipPrint.addEventListener("click", () => {
            const modal = document.getElementById("checkout-success-modal");
            if (modal) modal.classList.add("hidden");
        });
    }

    // اختصار مفتاح F3 الشامل للطباعة الفورية وتأكيد السلة مع الطباعة
    document.addEventListener("keydown", (e) => {
        if (e.key === "F3" || e.code === "F3" || e.keyCode === 114) {
            e.preventDefault();
            const successModal = document.getElementById("checkout-success-modal");
            if (successModal && !successModal.classList.contains("hidden")) {
                window.print();
            } else {
                processCheckout(true); // حفظ البيع مع إطلاق الطباعة الحرارية
            }
        } else if (e.key === "Escape") {
            const successModal = document.getElementById("checkout-success-modal");
            if (successModal && !successModal.classList.contains("hidden")) {
                successModal.classList.add("hidden");
            }
        }
    });

    // زر طباعة آخر وصل مباع يدوياً عند الطلب

    const printLastReceiptBtn = document.getElementById("btn-print-last-receipt");

    if (printLastReceiptBtn) {

        printLastReceiptBtn.addEventListener("click", () => {

            if (window.lastCompletedTransaction) {

                preparePrintReceipt(window.lastCompletedTransaction);

                setTimeout(() => {

                    window.print();

                }, 100);

            } else {

                alert("⚠️ لا توجد معاملة مبيعات سابقة لطباعتها حالياً!");

            }

        });

    }

    // زر مسح السلة بالكامل

    const clearCartBtn = document.getElementById("btn-clear-cart");

    if (clearCartBtn) {

        clearCartBtn.addEventListener("click", () => {

            if (appState.cart.length > 0) {

                if (confirm("هل أنت متأكد من مسح جميع السلع في السلة؟")) {

                    appState.cart = [];

                    appState.products = appState.products.filter(p => !p.isCustomItem);

                    saveToLocalStorage();

                    refreshCartUI();

                }

            }

        });

    }

    // زر تعليق السلة الحالية للزبون في الانتظار

    const holdCartBtn = document.getElementById("btn-hold-cart");

    if (holdCartBtn) {

        holdCartBtn.addEventListener("click", () => {

            holdCurrentCart();

        });

    }

    // --- مستمعي الأحداث للنوافذ المنبثقة الجديدة (المبلغ اليدوي وتعديل كمية آخر مادة) ---
    document.getElementById("btn-close-custom-amount")?.addEventListener("click", window.closeCustomAmountModal);
    document.getElementById("btn-cancel-custom-amount")?.addEventListener("click", window.closeCustomAmountModal);
    document.getElementById("btn-confirm-custom-amount")?.addEventListener("click", window.confirmCustomAmount);
    document.getElementById("custom-amount-input")?.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
            e.preventDefault();
            window.confirmCustomAmount();
        } else if (e.key === "Escape") {
            e.preventDefault();
            window.closeCustomAmountModal();
        }
    });

    document.getElementById("btn-close-multiply-qty")?.addEventListener("click", window.closeMultiplyQtyModal);
    document.getElementById("btn-cancel-multiply-qty")?.addEventListener("click", window.closeMultiplyQtyModal);
    document.getElementById("btn-confirm-multiply-qty")?.addEventListener("click", window.confirmMultiplyQty);
    document.getElementById("multiply-qty-input")?.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
            e.preventDefault();
            window.confirmMultiplyQty();
        } else if (e.key === "Escape") {
            e.preventDefault();
            window.closeMultiplyQtyModal();
        }
    });

    // --- مستمعي الأحداث لنافذة تسجيل ديون المبيعات الموحدة ---
    document.getElementById("btn-close-checkout-debt")?.addEventListener("click", window.closeCheckoutDebtModal);
    document.getElementById("btn-cancel-checkout-debt")?.addEventListener("click", window.closeCheckoutDebtModal);
    const debtSearchInput = document.getElementById("checkout-debt-search");
    if (debtSearchInput) {
        debtSearchInput.addEventListener("input", function() {
            window.renderCheckoutDebtCustomers(this.value);
        });
        debtSearchInput.addEventListener("keydown", (e) => {
            if (e.key === "Enter") {
                e.preventDefault();
                // إذا كان زر الإضافة ظاهراً، اضغط عليه لإضافة الزبون الجديد
                const addNewBtn = document.getElementById("btn-add-new-customer-debt");
                if (addNewBtn && addNewBtn.style.display !== "none") {
                    window.addNewCustomerFromDebtModal();
                }
            } else if (e.key === "Escape") {
                e.preventDefault();
                window.closeCheckoutDebtModal();
            }
        });
    }

    // زر الاختصار لوحة المفاتيح F1 و F2 لتعليق واسترجاع وتأكيد البيع والطباعة الفورية

    document.addEventListener("keydown", (e) => {

        if (e.key === "F1") {

            e.preventDefault(); // منع قائمة مساعدة المتصفح الافتراضية

            if (appState.cart.length > 0) {

                holdCurrentCart();

            } else if (appState.heldCarts && appState.heldCarts.length > 0) {

                // استرجاع آخر سلة معلقة تلقائياً عند الضغط على F1 والسلة الحالية فارغة

                const lastHeld = appState.heldCarts[appState.heldCarts.length - 1];

                resumeHeldCart(lastHeld.id);

            }

        } else if (e.key === "F2" || e.code === "F2" || e.keyCode === 113) {

            e.preventDefault();

            processCheckout(false); // حفظ وتأكيد عملية البيع فقط بدون طباعة

        }

    });

    // ================== إدارة المخزن Events ==================
    // الاستماع لإدخال الباركود للفحص التلقائي وتعبئة البيانات المكررة
    const prodBarcodeInput = document.getElementById("prod-barcode");
    if (prodBarcodeInput) {
        prodBarcodeInput.addEventListener("input", (e) => {
            checkDuplicateBarcodeAndAutofill(e.target.value, "product-modal");
        });
        prodBarcodeInput.addEventListener("change", (e) => {
            checkDuplicateBarcodeAndAutofill(e.target.value, "product-modal");
        });
        prodBarcodeInput.addEventListener("keydown", (e) => {

            if (e.key === "Enter") {

                e.preventDefault(); // منع الإرسال

                const prodNameInput = document.getElementById("prod-name");

                if (prodNameInput) {

                    prodNameInput.focus();

                    prodNameInput.select(); // تظليل الاسم للكتابة الفورية

                }

            }

        });

    }

    // توليد باركود تلقائي سريع للمنتج

    const genBarcodeBtn = document.getElementById("btn-generate-barcode");

    if (genBarcodeBtn) {

        genBarcodeBtn.addEventListener("click", () => {

            // توليد باركود فريد مكون من 12 رقماً يبدأ بـ 613

            let randBarcode = "613" + Math.floor(100000000 + Math.random() * 900000000).toString();

            document.getElementById("prod-barcode").value = randBarcode;

        });

    }

    // نموذج حفظ أو تعديل منتج

    const productForm = document.getElementById("product-form");

    if (productForm) {

        productForm.addEventListener("submit", (e) => {

            e.preventDefault();

            saveProduct();

        });

    }

    // إلغاء عملية تعديل منتج

    const cancelEditBtn = document.getElementById("btn-cancel-edit");

    if (cancelEditBtn) {

        cancelEditBtn.addEventListener("click", () => {

            resetProductForm();

        });

    }

    // نموذج حفظ أو تعديل حساب كاشير

    const userForm = document.getElementById("user-creation-form");

    if (userForm) {

        userForm.addEventListener("submit", (e) => {

            e.preventDefault();

            saveUserAccount();

        });

    }

    // إلغاء تعديل حساب كاشير

    const cancelUserEditBtn = document.getElementById("btn-cancel-user-edit");

    if (cancelUserEditBtn) {

        cancelUserEditBtn.addEventListener("click", () => {

            resetUserForm();

        });

    }

    // زر إظهار/إخفاء نموذج إضافة كاشير جديد

    const showAddUserModalBtn = document.getElementById("btn-show-add-user-modal");

    if (showAddUserModalBtn) {

        showAddUserModalBtn.addEventListener("click", () => {

            const formContainer = document.getElementById("add-user-form-container");

            if (formContainer) {

                formContainer.classList.toggle("hidden");

                if (!formContainer.classList.contains("hidden")) {

                    formContainer.scrollIntoView({ behavior: 'smooth' });

                }

            }

        });

    }

    // زر إغلاق نافذة تسديد الديون السريع

    const closeQuickDebtBtn = document.getElementById("btn-close-quick-debt-settle");

    if (closeQuickDebtBtn) {

        closeQuickDebtBtn.addEventListener("click", () => {

            document.getElementById("quick-debt-settle-modal").classList.add("hidden");

        });

    }

    const cancelQuickDebtBtn = document.getElementById("btn-cancel-quick-debt-settle");

    if (cancelQuickDebtBtn) {

        cancelQuickDebtBtn.addEventListener("click", () => {

            document.getElementById("quick-debt-settle-modal").classList.add("hidden");

        });

    }

    // ================== إدارة قاعدة البيانات والتهيئة ==================

    // تصدير نسخة احتياطية

    const exportDbBtn = document.getElementById("btn-export-db");

    if (exportDbBtn) {

        exportDbBtn.addEventListener("click", () => {

            exportDatabaseBackup();

        });

    }

    // استيراد نسخة احتياطية

    const triggerImportBtn = document.getElementById("btn-trigger-import-db");

    const importInput = document.getElementById("input-import-db");

    if (triggerImportBtn && importInput) {

        triggerImportBtn.addEventListener("click", () => {

            importInput.click();

        });

        importInput.addEventListener("change", (e) => {

            if (e.target.files && e.target.files[0]) {

                importDatabaseBackup(e.target.files[0]);

            }

        });

    }

    // تهيئة وتصفير النظام بالكامل

    const resetDbBtn = document.getElementById("btn-reset-db");

    if (resetDbBtn) {

        resetDbBtn.addEventListener("click", () => {

            const confirm1 = confirm("⚠️ تحذير أمني خطير: هل أنت متأكد من رغبتك في تهيئة وتصفير النظام بالكامل؟\nسيتم مسح كافة المنتجات، تاريخ المبيعات، سجل الديون، وحسابات الكاشير نهائياً ولن تتمكن من استرجاعها!");

            if (confirm1) {

                const confirm2 = confirm("🚨 تأكيد نهائي وقاطع: هل أنت متأكد بنسبة 100%؟ لا يمكن التراجع عن هذه التهيئة أبداً!");

                if (confirm2) {

                    // مسح كل بيانات المتجر من التخزين المحلي نهائياً

                    localStorage.removeItem("smart_shop_state");

                    alert("✅ تم تهيئة النظام بالكامل وتصفيره بنجاح! سيتم إعادة تحميل البرنامج.");

                    window.location.reload();

                }

            }

        });

    }

    // البحث في المخزن

    const inventorySearchInput = document.getElementById("inventory-search-input");

    if (inventorySearchInput) {

        inventorySearchInput.addEventListener("input", () => {

            renderInventoryTable();

        });

    }

    // زر تتبع النواقص والسوالب في إدارة المخزن

    const filterLowStockBtn = document.getElementById("btn-filter-low-stock");

    if (filterLowStockBtn) {

        filterLowStockBtn.addEventListener("click", () => {

            appState.filterLowStockOnly = !appState.filterLowStockOnly;

            if (appState.filterLowStockOnly) {

                filterLowStockBtn.classList.add("active");

                filterLowStockBtn.querySelector("span").innerText = "عرض الكل";

            } else {

                filterLowStockBtn.classList.remove("active");

                filterLowStockBtn.querySelector("span").innerText = "تتبع النواقص والسوالب";

            }

            renderInventoryTable();

        });

    }

    // تصدير واستيراد المخزن إلى Excel
    const exportInvBtn = document.getElementById("btn-export-inventory");
    if (exportInvBtn) {
        exportInvBtn.addEventListener("click", () => {
            exportInventoryToExcel();
        });
    }

    const importInvBtn = document.getElementById("btn-import-inventory");
    const importFileInput = document.getElementById("excel-import-file-input");
    if (importInvBtn && importFileInput) {
        importInvBtn.addEventListener("click", () => {
            importFileInput.value = "";
            importFileInput.click();
        });

        importFileInput.addEventListener("change", (e) => {
            if (e.target.files && e.target.files.length > 0) {
                importInventoryFromExcel(e.target.files[0]);
            }
        });
    }

    const bonBarcodeInput = document.getElementById("bon-prod-barcode");
    if (bonBarcodeInput) {
        bonBarcodeInput.addEventListener("input", (e) => {
            checkDuplicateBarcodeAndAutofill(e.target.value, "bon-achat");
        });
        bonBarcodeInput.addEventListener("change", (e) => {
            checkDuplicateBarcodeAndAutofill(e.target.value, "bon-achat");
        });
    }

    // زر إغلاق نافذة الكمية اللمسية

    const closeQuickQtyBtn = document.getElementById("btn-close-quick-qty");

    if (closeQuickQtyBtn) {

        closeQuickQtyBtn.addEventListener("click", () => {

            document.getElementById("quick-qty-modal").classList.add("hidden");

            window.currentQuickQtyProductId = null;

        });

    }

    // زر تأكيد الكمية وإضافة المنتج للسلة

    const confirmQuickQtyBtn = document.getElementById("btn-confirm-quick-qty");

    if (confirmQuickQtyBtn) {

        confirmQuickQtyBtn.addEventListener("click", () => {

            const prodId = window.currentQuickQtyProductId;

            if (prodId) {

                const qtyVal = parseFloat(document.getElementById("quick-qty-input").value) || 0;

                if (qtyVal > 0) {

                    const priceInput = document.getElementById("quick-qty-price-input");

                    const customPrice = priceInput && priceInput.value !== "" ? parseFloat(priceInput.value) : null;

                    // التحقق من تعديل الكمية المباشر لآخر عنصر ممسوح بالنجمة (*)
                    if (window.quickQtyIsEditMode === true && window.quickQtyEditItemIndex !== undefined && window.quickQtyEditItemIndex !== null) {
                        const item = appState.cart[window.quickQtyEditItemIndex];
                        if (item) {
                            item.qty = qtyVal;
                            if (customPrice !== null) item.customPrice = customPrice;
                            saveToLocalStorage();
                            refreshCartUI();
                            calculateCartTotals();
                        }
                        window.quickQtyIsEditMode = false;
                        window.quickQtyEditItemIndex = null;
                    } else {
                        addProductToCartById(prodId, qtyVal, customPrice);
                    }

                    document.getElementById("quick-qty-modal").classList.add("hidden");

                    window.currentQuickQtyProductId = null;

                } else {

                    alert("⚠️ الرجاء إدخال كمية صحيحة!");

                }

            }

        });

    }

    // حدث تعديل كمية البيع في المودال لتحديث السعر الإجمالي الحي وتغيير عكس السعر

    const qtyInput = document.getElementById("quick-qty-input");

    const priceInput = document.getElementById("quick-qty-price-input");

    if (qtyInput) {

        qtyInput.addEventListener("input", () => {

            const prodId = window.currentQuickQtyProductId;

            if (prodId) {

                const product = appState.products.find(p => p.id === prodId);

                if (product) {

                    const qty = parseFloat(qtyInput.value) || 0;

                    updateQuickQtyLiveTotal(product, qty);

                    // تحديث حقل السعر تلقائياً إذا كان الفوكس على حقل الكمية

                    const amountInput = document.getElementById("quick-qty-amount-input");

                    if (amountInput && document.activeElement === qtyInput) {

                        const customPrice = priceInput && priceInput.value !== "" ? parseFloat(priceInput.value) : product.sellPrice;

                        amountInput.value = qty > 0 ? (customPrice * qty).toFixed(2) : "";

                    }

                }

            }

        });

        // تمكين الضغط على Enter في لوحة المفاتيح لإرسال وإضافة السلة فوراً

        qtyInput.addEventListener("keydown", (e) => {

            if (e.key === "Enter") {

                e.preventDefault();

                confirmQuickQtyBtn.click();

            }

        });

    }

    // حدث تعديل سعر البيع المخصص لتحديث الإجمالي

    if (priceInput) {

        priceInput.addEventListener("input", () => {

            const prodId = window.currentQuickQtyProductId;

            if (prodId) {

                const product = appState.products.find(p => p.id === prodId);

                if (product) {

                    const qty = parseFloat(qtyInput.value) || 0;

                    updateQuickQtyLiveTotal(product, qty);

                    // تحديث المبلغ المالي

                    const amountInput = document.getElementById("quick-qty-amount-input");

                    if (amountInput) {

                        const customPrice = parseFloat(priceInput.value) || product.sellPrice;

                        amountInput.value = qty > 0 ? (customPrice * qty).toFixed(2) : "";

                    }

                }

            }

        });

        priceInput.addEventListener("keydown", (e) => {

            if (e.key === "Enter") {

                e.preventDefault();

                confirmQuickQtyBtn.click();

            }

        });

    }

    // حدث تعديل المبلغ المالي المطلوب (البيع العكسي بالوزن - olives)

    const amountInput = document.getElementById("quick-qty-amount-input");

    if (amountInput) {

        amountInput.addEventListener("input", () => {

            const prodId = window.currentQuickQtyProductId;

            if (prodId) {

                const product = appState.products.find(p => p.id === prodId);

                if (product) {

                    const amount = parseFloat(amountInput.value) || 0;

                    if (qtyInput && document.activeElement === amountInput) {

                        const customPrice = priceInput && priceInput.value !== "" ? parseFloat(priceInput.value) : product.sellPrice;

                        if (amount > 0 && customPrice > 0) {

                            const computedQty = amount / customPrice;

                            qtyInput.value = computedQty.toFixed(3); // 3 أرقام لدقة الغرامات

                            updateQuickQtyLiveTotal(product, computedQty);

                        } else {

                            qtyInput.value = "";

                            updateQuickQtyLiveTotal(product, 0);

                        }

                    }

                }

            }

        });

        // تمكين الضغط على Enter في حقل المبلغ للإضافة الفورية

        amountInput.addEventListener("keydown", (e) => {

            if (e.key === "Enter") {

                e.preventDefault();

                confirmQuickQtyBtn.click();

            }

        });

    }

    // تفعيل إغلاق أي نافذة بنقر زر Escape لسهولة وسرعة الكاشير

    document.addEventListener("keydown", (e) => {

        if (e.key === "Escape") {

            const successModal = document.getElementById("checkout-success-modal");

            if (successModal && !successModal.classList.contains("hidden")) {

                successModal.classList.add("hidden");

            }

        }

    });

}

// 7. تحديث محتويات الشاشات الكلي (UI Refresh)

function refreshUI() {

    // 1. تحديث الإحصائيات في كل مكان مع وقاية ضد الأخطاء

    try {

        calculateStats();

    } catch (e) {

        console.error("خطأ أثناء حساب الإحصائيات:", e);

    }

    // 2. تحديث التبويب النشط مع وقاية ضد الأخطاء لتجنب تجميد بقية الأزرار

    try {

        if (appState.activeTab === "dashboard") {

            renderDashboardView();

        } else if (appState.activeTab === "pos") {

            renderPosView();

        } else if (appState.activeTab === "inventory") {

            renderInventoryView();

        } else if (appState.activeTab === "reports") {

            renderReportsView();

        } else if (appState.activeTab === "debts") {

            renderDebtsTable();

        } else if (appState.activeTab === "users") {

            renderUsersTable();

        } else if (appState.activeTab === "supplier-debts") {

            renderSupplierDebtsTable();

        }

    } catch (err) {

        alert("⚠️ خطأ أثناء رندرة التبويب النشط [" + appState.activeTab + "]: " + err.message);

        console.error("خطأ رندرة التبويب:", err);

    }

}

// 8. حساب الإحصائيات العامة للمخزون والعمليات

let globalStats = {

    dailyProfit: 0,

    monthlyProfit: 0,

    totalUniqueItems: 0,

    totalQuantityItems: 0,

    todaySalesCount: 0,

    todaySalesAmount: 0,

    lowStockCount: 0,

    lowStockList: [],

    totalSalesCompleted: 0,

    totalSalesAmountEver: 0,

    totalProfitEver: 0,

    inventoryBuyValue: 0,

    inventorySellValue: 0

};

function calculateStats() {

    const todayStr = new Date().toDateString();

    const currentMonth = new Date().getMonth();

    const currentYear = new Date().getFullYear();

    // تصفير الإحصائيات للبدء بالحساب التراكمي الجديد

    globalStats = {

        dailyProfit: 0,

        monthlyProfit: 0,

        totalUniqueItems: appState.products.length,

        totalQuantityItems: 0,

        todaySalesCount: 0,

        todaySalesAmount: 0,

        lowStockCount: 0,

        lowStockList: [],

        totalSalesCompleted: appState.transactions.length,

        totalSalesAmountEver: 0,

        totalProfitEver: 0,

        inventoryBuyValue: 0,

        inventorySellValue: 0

    };

    // حساب إجمالي قيمة المخزون الحالي

    appState.products.forEach(p => {

        if (p.isCustomItem) return;

        const qty = parseFloat(p.qty) || 0;

        globalStats.totalQuantityItems += qty;

        globalStats.inventoryBuyValue += (parseFloat(p.buyPrice) || 0) * qty;

        globalStats.inventorySellValue += (parseFloat(p.sellPrice) || 0) * qty;

        // التحقق من كمية المواد وتنبيه المخزون المنخفض (5 أو أقل)

        if (qty <= 5) {

            globalStats.lowStockCount++;

            globalStats.lowStockList.push(p);

        }

    });

    // حساب المعاملات المبيعات والأرباح

    appState.transactions.forEach(t => {

        const tDate = new Date(t.timestamp);

        const tProfit = parseFloat(t.profit) || 0;

        const tTotal = parseFloat(t.total) || 0;

        globalStats.totalSalesAmountEver += tTotal;

        globalStats.totalProfitEver += tProfit;

        // فائدة ومبيعات اليوم

        if (tDate.toDateString() === todayStr) {

            globalStats.todaySalesCount++;

            globalStats.todaySalesAmount += tTotal;

            globalStats.dailyProfit += tProfit;

        }

        // فائدة هذا الشهر الحالي

        if (tDate.getMonth() === currentMonth && tDate.getFullYear() === currentYear) {

            globalStats.monthlyProfit += tProfit;

        }

    });

    // حساب إجمالي مصاريف اليوم
    const todayIsoStr = new Date().toLocaleDateString('en-CA');
    const todayExpensesSum = (appState.expenses || [])
        .filter(ex => new Date(ex.timestamp).toLocaleDateString('en-CA') === todayIsoStr)
        .reduce((sum, ex) => sum + (parseFloat(ex.amount) || 0), 0);

    globalStats.todayExpensesSum = todayExpensesSum;

    // الخيار والتفصيل حسب رغبة المستخدم (خصم المصاريف من الفائدة أم بدون خصم)
    const deductMode = appState.deductExpensesFromProfit !== false;
    const displayedProfit = deductMode ? (globalStats.dailyProfit - todayExpensesSum) : globalStats.dailyProfit;
    globalStats.displayedDailyProfit = displayedProfit;

    // تحديث المؤشرات السريعة في الهيدر العلوي
    const qDailyEl = document.getElementById("quick-daily-profit");
    if (qDailyEl) qDailyEl.innerText = formatCurrency(displayedProfit);

    const modeSelect = document.getElementById("profit-calc-mode-select");
    if (modeSelect) modeSelect.value = deductMode ? "deduct" : "gross";

    const noteEl = document.getElementById("dashboard-daily-profit-note");
    if (noteEl) {
        noteEl.innerText = deductMode 
            ? `صافي أرباح مبيعات اليوم (خصم مصاريف: ${formatCurrency(todayExpensesSum)})` 
            : `إجمالي أرباح مبيعات اليوم (بدون خصم المصاريف)`;
    }

    const qLowStockEl = document.getElementById("quick-low-stock-count");
    if (qLowStockEl) qLowStockEl.innerText = `${globalStats.lowStockCount} سلع`;

    // شارة التنبيه في القائمة الجانبية بجوار "إدارة المخزن"
    const lowStockBadge = document.getElementById("low-stock-badge");
    if (lowStockBadge) {
        if (globalStats.lowStockCount > 0) {
            lowStockBadge.innerText = globalStats.lowStockCount;
            lowStockBadge.classList.remove("hidden");
        } else {
            lowStockBadge.classList.add("hidden");
        }
    }
}

// مساعد تنسيق المبالغ المالية بصيغة دج (دينار جزائري)

function formatCurrency(amount) {
    if (amount === undefined || amount === null || isNaN(amount)) amount = 0;
    const num = Number(amount);
    const formatted = num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    return formatted + " د.ج";
}

// تبديل خيار خصم المصاريف من الأرباح اليومية أو حساب الفائدة بدون خصم المصاريف
window.toggleProfitDeductionMode = function(mode) {
    const deduct = mode === 'deduct';
    appState.deductExpensesFromProfit = deduct;
    saveToLocalStorage();
    calculateStats();
    if (typeof renderDashboardView === 'function') renderDashboardView();

    if (deduct) {
        showToast("🔻 تم تفعيل خصم مصاريف المحل من الأرباح اليومية (صافي الربح).");
    } else {
        showToast("💰 تم تفعيل حساب الأرباح اليومية بدون خصم المصاريف (إجمالي الربح).");
    }
};

// 9. لوحة التحكم (Dashboard View Render)
function renderDashboardView() {

    // ملء البطاقات الأربعة بأمان لمنع انهيار البرنامج

    const dailyProfitEl = document.getElementById("dashboard-daily-profit");

    const deductMode = appState.deductExpensesFromProfit !== false;
    const displayedProfit = deductMode ? (globalStats.dailyProfit - (globalStats.todayExpensesSum || 0)) : globalStats.dailyProfit;

    if (dailyProfitEl) dailyProfitEl.innerText = formatCurrency(displayedProfit);

    const monthlyProfitEl = document.getElementById("dashboard-monthly-profit");

    if (monthlyProfitEl) monthlyProfitEl.innerText = formatCurrency(globalStats.monthlyProfit);

    const totalItemsEl = document.getElementById("dashboard-total-items");

    if (totalItemsEl) totalItemsEl.innerText = globalStats.totalQuantityItems;

    const totalItemsDescEl = document.getElementById("dashboard-total-items-desc");

    if (totalItemsDescEl) totalItemsDescEl.innerText = `من أصل ${globalStats.totalUniqueItems} سلعة مسجلة`;

    const todaySalesCountEl = document.getElementById("dashboard-today-sales-count");

    if (todaySalesCountEl) todaySalesCountEl.innerText = globalStats.todaySalesCount;

    const todaySalesAmountEl = document.getElementById("dashboard-today-sales-amount");

    if (todaySalesAmountEl) todaySalesAmountEl.innerText = `بقيمة: ${formatCurrency(globalStats.todaySalesAmount)}`;

    // تحديث كرت موظف الأسبوع في لوحة التحكم

    updateEmployeeOfTheWeekUI();

    // بنر التنبيه للمخزون الحرجة

    const alertBanner = document.getElementById("low-stock-warning-banner");

    const alertList = document.getElementById("low-stock-items-list");

    if (alertBanner && alertList) {

        if (globalStats.lowStockCount > 0) {

            alertBanner.classList.remove("hidden");

            alertList.innerHTML = globalStats.lowStockList.map(p => `

                <li class="low-stock-pill">

                    <i class="fa-solid fa-box-open"></i>

                    <span>${p.name}</span>

                    <span class="qty">${p.qty} ${p.unit}</span>

                </li>

            `).join("");

        } else {

            alertBanner.classList.add("hidden");

        }

    }

    // عرض أحدث العمليات لليوم في جدول لوحة التحكم

    const todayStr = new Date().toDateString();

    const todayTransactions = appState.transactions.filter(t => new Date(t.timestamp).toDateString() === todayStr).slice(-5).reverse();

    const recentTbody = document.getElementById("recent-sales-tbody");

    if (recentTbody) {

        if (todayTransactions.length > 0) {

            recentTbody.innerHTML = todayTransactions.map(t => {

                const date = new Date(t.timestamp);

                const timeStr = date.toLocaleTimeString('ar-DZ', { hour: '2-digit', minute: '2-digit' });

                const itemsCount = (t.items && Array.isArray(t.items)) ? t.items.reduce((sum, item) => sum + item.qty, 0) : 0;

                return `

                    <tr>

                        <td>#${t.id.slice(-6).toUpperCase()}</td>

                        <td>${timeStr}</td>

                        <td>${itemsCount} قطع</td>

                        <td class="text-success font-weight-bold">${formatCurrency(t.total)}</td>

                        <td class="text-info">${formatCurrency(t.profit)}</td>

                    </tr>

                `;

            }).join("");

        } else {

            recentTbody.innerHTML = `<tr><td colspan="5" class="text-muted text-center">لا توجد عمليات مبيعات لليوم حتى الآن.</td></tr>`;

        }

    }

    // حساب وعرض السلع الأكثر مبيعاً

    const productSalesMap = {};

    appState.transactions.forEach(t => {

        if (t.items && Array.isArray(t.items)) {

            t.items.forEach(item => {

                if (!productSalesMap[item.productId]) {

                    productSalesMap[item.productId] = {

                        name: item.name,

                        sellPrice: item.sellPrice,

                        qtySold: 0,

                        totalProfit: 0

                    };

                }

                productSalesMap[item.productId].qtySold += item.qty;

                productSalesMap[item.productId].totalProfit += (item.sellPrice - item.buyPrice) * item.qty;

            });

        }

    });

    // تحويل الكائن لمصفوفة والترتيب تنازلياً حسب الأكثر مبيعاً

    const popularItems = Object.values(productSalesMap).sort((a, b) => b.qtySold - a.qtySold).slice(0, 5);

    const popularTbody = document.getElementById("popular-items-tbody");

    if (popularTbody) {

        if (popularItems.length > 0) {

            popularTbody.innerHTML = popularItems.map(item => `

                <tr>

                    <td>${item.name}</td>

                    <td>${formatCurrency(item.sellPrice)}</td>

                    <td><strong class="text-success">${item.qtySold}</strong></td>

                    <td>${formatCurrency(item.totalProfit)}</td>

                </tr>

                     `).join("");

        } else {

            popularTbody.innerHTML = `<tr><td colspan="4" class="text-muted text-center">لا توجد إحصائيات بيع حالياً.</td></tr>`;

        }

    }

    // استدعاء وظائف الوحدات الجديدة (الصندوق + الزبائن) إن كانت محملة

    if (typeof renderCashBalanceSummary === 'function') {

        renderCashBalanceSummary();

    }

    if (typeof renderCustomerSelectInPOS === 'function') {

        renderCustomerSelectInPOS();

    }

}

// 10. واجهة البيع السريع POS (POS View Render)

function renderPosView() {

    renderPosCategories();

    renderPosProducts();

    refreshCartUI();

}

// بناء تصنيفات السلع ديناميكياً

// بناء تصنيفات السلع ديناميكياً (إخفاء 'الكل' والبدء بـ 'عام' دائماً)
// دالة المعالجة الفورية الموحدة لنقر بطاقات السلع بالبيع السريع
window.onPosProductCardClick = function(el, productId) {
    if (!productId) return;
    const product = (appState.products || []).find(p => String(p.id) === String(productId));
    if (!product) return;
    
    // فتح نافذة إدخال الكميات مباشرة لجميع المواد (بما فيها القطع والعلب) لتسهيل العمل بدون ماوس
    if (typeof window.openQuickQtyModalForProduct === 'function') {
        window.openQuickQtyModalForProduct(product);
    } else {
        if (typeof addProductToCartById === "function") {
            addProductToCartById(product.id, 1);
        }
    }
};

function renderPosCategories() {
    const categoriesContainer = document.getElementById("pos-categories-container");
    if (!categoriesContainer) return;

    // جلب جميع الفئات الفريدة للسلع المتوفرة مسبقاً في المتجر
    const uniqueCategories = [...new Set(appState.products.map(p => p.category).filter(c => c && c.trim() !== ""))];

    // ترتيب الفئات: 'عام' أولاً كفئة رئيسية افتراضية، ثم بقية الفئات المضافة بجانبها
    const otherCategories = uniqueCategories.filter(c => c !== "عام" && c !== "all");

    const categories = ["عام"];
    categories.push(...otherCategories);

    // الاحتفاظ بالزر النشط حالياً (الافتراضي هو 'عام')
    const activeCat = categoriesContainer.querySelector(".cat-pill.active")?.getAttribute("data-category") || "عام";

    categoriesContainer.innerHTML = categories.map(cat => {
        const displayLabel = cat;
        const activeClass = cat === activeCat ? "active" : "";
        return `<button class="cat-pill ${activeClass}" data-category="${cat}">${displayLabel}</button>`;
    }).join("");

    // تفعيل فلاتر الأزرار عند الضغط
    categoriesContainer.querySelectorAll(".cat-pill").forEach(pill => {
        pill.addEventListener("click", () => {
            categoriesContainer.querySelectorAll(".cat-pill").forEach(p => p.classList.remove("active"));
            pill.classList.add("active");
            renderPosProducts();
        });
    });
}

// بناء وعرض قائمة الاقتراحات التفاعلية الحية أثناء البحث بالاسم لكل السلع
function renderPosSearchDropdown() {
    const dropdown = document.getElementById("pos-search-dropdown-results");
    const searchInput = document.getElementById("pos-search-input");
    if (!dropdown || !searchInput) return;

    const query = searchInput.value.toLowerCase().trim();
    if (query === "") {
        dropdown.classList.add("hidden");
        dropdown.innerHTML = "";
        return;
    }

    // البحث الفوري الشامل في كل سلع المحل بدون استثناء
    const matches = (appState.products || []).filter(p => {
        if (p.isCustomItem) return false;
        return (p.name && p.name.toLowerCase().includes(query)) || 
               (p.barcode && p.barcode.toLowerCase().includes(query)) ||
               (p.category && p.category.toLowerCase().includes(query));
    });

    if (matches.length === 0) {
        dropdown.innerHTML = `<div style="padding: 12px; text-align: center; color: #94a3b8; font-size: 0.85rem;">❌ لا توجد سلع تطابق "${query}"</div>`;
        dropdown.classList.remove("hidden");
        return;
    }

    dropdown.innerHTML = matches.map((p) => `
        <div class="pos-search-dropdown-item" data-product-id="${p.id}" tabindex="0">
            <div>
                <div class="item-name">${p.name}</div>
                <div class="item-stock">الكمية بالمخزن: ${p.qty} ${p.unit || ''}</div>
            </div>
            <div class="item-price">${formatCurrency(p.sellPrice)}</div>
        </div>
    `).join("");

    dropdown.classList.remove("hidden");

    // إضافة أحداث النقر لاختيار وإضافة السلعة فوراً للسلة
    dropdown.querySelectorAll(".pos-search-dropdown-item").forEach(itemEl => {
        itemEl.addEventListener("click", () => {
            const productId = itemEl.getAttribute("data-product-id");
            selectProductFromSearchDropdown(productId);
        });
    });
}

function selectProductFromSearchDropdown(productId) {
    const product = appState.products.find(p => String(p.id) === String(productId));
    if (!product) return;

    // استدعاء دالة إضافة السلعة لسلة المبيعات برقم التعريف
    addProductToCartById(product.id, 1);

    const searchInput = document.getElementById("pos-search-input");
    if (searchInput) {
        searchInput.value = "";
        searchInput.focus();
    }

    const dropdown = document.getElementById("pos-search-dropdown-results");
    if (dropdown) {
        dropdown.classList.add("hidden");
        dropdown.innerHTML = "";
    }

    renderPosProducts();
    if (typeof renderPosQuickShortcuts === 'function') renderPosQuickShortcuts();
}

// بناء شبكة المنتجات للضغط السريع عليها مع دعم الصور والألوان والترتيب والسحب
function renderPosProducts() {

    const productsGrid = document.getElementById("pos-products-grid");

    if (!productsGrid) return;

    const activeCat = document.querySelector(".pos-categories .cat-pill.active")?.getAttribute("data-category") || "all";

    const searchQuery = document.getElementById("pos-search-input")?.value.toLowerCase().trim() || "";

    // تصفية السلع طبقاً للفئة المحددة وبحث الاسم (عند كتابة بحث بالاسم يتم البحث دائماً في كل السلع)
    let filteredProducts = appState.products.filter(p => {
        if (p.isCustomItem) return false;
        const matchesCategory = searchQuery !== "" ? true : (activeCat === "عام" || activeCat === "all" ? true : p.category === activeCat);
        const matchesSearch = p.name.toLowerCase().includes(searchQuery) || (p.barcode && p.barcode.includes(searchQuery));
        return matchesCategory && matchesSearch;
    });

    // تطبيق ترتيب محفوظ إن وجد

    const orderKey = 'pos_product_order_' + activeCat;

    const savedOrder = appState.productGridOrder && appState.productGridOrder[orderKey];

    if (savedOrder && savedOrder.length > 0) {

        const orderMap = {};

        savedOrder.forEach((id, idx) => { orderMap[id] = idx; });

        filteredProducts.sort((a, b) => {

            const ai = orderMap[a.id] !== undefined ? orderMap[a.id] : 9999;

            const bi = orderMap[b.id] !== undefined ? orderMap[b.id] : 9999;

            return ai - bi;

        });

    }

    if (filteredProducts.length > 0) {

        productsGrid.innerHTML = filteredProducts.map(p => {

            const qty = parseFloat(p.qty) || 0;

            let cardClass = "pos-product-card";

            if (qty <= 0) cardClass += " out-of-stock";

            else if (qty <= 5) cardClass += " low-stock";

            // تحديد استايل لون الخلفية والخط المناسب

            let bgStyle = "";

            let textStyle = "color: var(--text-main);";

            if (p.cardColor) {

                bgStyle = `background: ${p.cardColor}; border-color: ${p.cardColor}88;`;

                textStyle = "color: #ffffff; text-shadow: 0 1px 3px rgba(0,0,0,0.8);";

            }

            // كود الصورة أو الأيقونة

            const imageHtml = p.image

                ? `<div style="width: 52px; height: 52px; border-radius: 8px; overflow: hidden; margin-bottom: 6px; flex-shrink: 0;"><img src="${p.image}" style="width: 100%; height: 100%; object-fit: cover;" alt=""></div>`

                : (p.emoji ? `<div style="font-size: 2rem; line-height: 1; margin-bottom: 4px;">${p.emoji}</div>` : '');

            const qtyDisplay = qty <= 0 ? `- ${Math.abs(qty)}` : qty;

            return `

                <div class="${cardClass}" data-id="${p.id}" onclick="onPosProductCardClick(this, '${p.id}')" draggable="true" style="${bgStyle}; cursor: pointer;">

                    ${imageHtml}

                    <span class="name" style="font-size: 0.82rem; font-weight: 800; line-height: 1.2; text-align: center; word-break: break-word; margin-bottom: 4px; ${textStyle}">${p.name}</span>

                    <div style="display: flex; flex-direction: column; align-items: center; gap: 2px;">

                        <span class="price" style="font-size: 0.88rem; font-weight: 900; ${textStyle}">${formatCurrency(p.sellPrice)}</span>

                        <span class="stock" style="font-size: 0.68rem; opacity: 0.85; ${textStyle}">المتبقي: ${qtyDisplay} ${(p.unit||'').substring(0,3)}</span>

                    </div>

                </div>

            `;

        }).join("");

        // ربط الضغط على بطاقة السلعة

        productsGrid.querySelectorAll(".pos-product-card").forEach(card => {

            card.addEventListener("click", (e) => {

                if (card.classList.contains('dragging')) return;

                e.stopPropagation();

                const prodId = card.getAttribute("data-id");

                const product = appState.products.find(p => p.id === prodId);

                if (product) {

                    if (product.unit === "كيلوغرام" || product.unit === "كغ" || product.unit === "لتر") {

                        window.openQuickQtyModalForProduct(product);

                    } else {

                        if (typeof addProductToCartById === "function") {

                            addProductToCartById(product.id, 1);

                        }

                    }

                }

            });

            card.addEventListener("dblclick", (e) => {

                e.stopPropagation();

                const prodId = card.getAttribute("data-id");

                const product = appState.products.find(p => p.id === prodId);

                if (product) {

                    window.openQuickQtyModalForProduct(product);

                }

            });

        });

        // تفعيل السحب والإسقاط

        enableDragAndDrop(productsGrid, activeCat);

    }

}

// 11. إدارة سلة المبيعات (Cart Logic)

function addProductToCartById(id, qtyToAdd = 1, customPrice = null) {

    const product = appState.products.find(p => p.id === id);

    if (!product) return;

    // تم تعطيل حظر البيع عند نفاذ المخزون بناء على طلبك للسماح بالبيع بالسالب والتحديث اللاحق!

    const cartItem = appState.cart.find(item => item.productId === id && item.customPrice === customPrice);

    if (cartItem) {

        cartItem.qty += qtyToAdd;

    } else {

        appState.cart.push({

            productId: id,

            qty: qtyToAdd,

            customPrice: customPrice

        });

    }

    playBeep();

    saveToLocalStorage();

    refreshCartUI();

}

// إضافة منتج للسلة عبر الباركود

function addProductToCartByBarcode(rawBarcode) {
    const barcode = window.cleanAndNormalizeBarcode(rawBarcode);
    const product = appState.products.find(p => p.barcode === barcode || p.barcode === rawBarcode);

    if (product) {

        // إذا كان للمنتج كمية عرض فاردو، وكان الباركود محدداً بأنه ينتمي للعلبة مباشرة،

        // فبمجرد مسح الباركود، يتم إدخال الفاردو/العلبة كاملة (مثال: 20 سجائر) تلقائياً!

        const qtyToAdd = (product.barcodeIsBulk === true && parseInt(product.promoQty) > 0) ? parseInt(product.promoQty) : 1;

        addProductToCartById(product.id, qtyToAdd);

    } else {
        window.openPOSQuickAddModal(barcode);
    }

}

// حساب سعر مادة السلة مع مراعاة العروض والخصومات الترويجية للكميات

function calculateItemPriceAndPromo(product, qty) {

    const promoQty = parseInt(product.promoQty) || 0;

    const promoPrice = parseFloat(product.promoPrice) || 0;

    const sellPrice = parseFloat(product.sellPrice) || 0;

    if (promoQty > 0 && promoPrice > 0 && qty >= promoQty) {

        // حساب عدد المجموعات الترويجية المشتراة

        const bundles = Math.floor(qty / promoQty);

        const remainingSingles = qty % promoQty;

        const total = (bundles * promoPrice) + (remainingSingles * sellPrice);

        return {

            total: total,

            hasPromo: true,

            promoMsg: `📦 سعر الفاردو / الجملة (${bundles} × حزمة)`

        };

    }

    return {

        total: sellPrice * qty,

        hasPromo: false,

        promoMsg: ""

    };

}

// تحديث وعرض سلة المبيعات

function refreshCartUI() {

    const cartTbody = document.getElementById("cart-tbody");

    if (!cartTbody) return;

    if (appState.cart.length > 0) {

        // إزالة سطر "السلة فارغة"

        cartTbody.innerHTML = "";

        appState.cart.forEach(item => {

            const product = appState.products.find(p => p.id === item.productId);

            if (!product) return;

            const isCustom = item.customPrice !== null && item.customPrice !== undefined && item.customPrice !== product.sellPrice;

            const sellPrice = isCustom ? item.customPrice : product.sellPrice;

            let priceInfo = { total: sellPrice * item.qty, hasPromo: false, promoMsg: "" };

            if (!isCustom) {

                priceInfo = calculateItemPriceAndPromo(product, item.qty);

            }

            const itemTotal = priceInfo.total;

            const tr = document.createElement("tr");

            tr.innerHTML = `

                <td>

                    <span class="item-name">${product.name}</span>

                    ${isCustom ? `<span class="promo-badge-cart" style="background: rgba(255, 159, 28, 0.08); color: var(--color-warning); border-color: rgba(255, 159, 28, 0.2);"><i class="fa-solid fa-tag"></i> سعر مخصص</span>` : ''}

                    ${(!isCustom && priceInfo.hasPromo) ? `<span class="promo-badge-cart">${priceInfo.promoMsg}</span>` : ''}

                </td>

                <td>

                    <div class="qty-control">

                        <button class="btn-qty" onclick="changeCartItemQtyWithPrice('${product.id}', 1, ${item.customPrice})"><i class="fa-solid fa-plus"></i></button>

                        <span class="qty-val">${item.qty}</span>

                        <button class="btn-qty" onclick="changeCartItemQtyWithPrice('${product.id}', -1, ${item.customPrice})"><i class="fa-solid fa-minus"></i></button>

                    </div>

                </td>

                <td>${formatCurrency(sellPrice)}</td>

                <td class="font-weight-bold">${formatCurrency(itemTotal)}</td>

                <td>
                    <button class="btn-edit-cart-item" onclick="openCartItemPriceEditModal('${product.id}', ${item.customPrice})" title="تعديل / تخفيض سعر السلعة">
                        <i class="fa-solid fa-pen-to-square"></i>
                    </button>
                    <button class="btn-delete-item" onclick="removeCartItemWithPrice('${product.id}', ${item.customPrice})" title="حذف من السلة">
                        <i class="fa-solid fa-trash-can"></i>
                    </button>
                </td>

            `;

            cartTbody.appendChild(tr);

        });

    } else {

        cartTbody.innerHTML = `

            <tr id="cart-empty-row">

                <td colspan="5" class="text-center text-muted py-5">

                    <i class="fa-solid fa-basket-shopping" style="font-size: 3rem; opacity: 0.3; display: block; margin-bottom: 10px;"></i>

                    السلة فارغة. ابدأ بمسح الباركود أو الضغط على السلع لإضافتها.

                </td>

            </tr>

        `;

    }

    calculateCartTotals();

    renderHeldCartsList();

}

// زيادة أو نقصان كمية سلعة بالسلة

window.changeCartItemQty = function(productId, direction) {

    const product = appState.products.find(p => p.id === productId);

    const cartItem = appState.cart.find(item => item.productId === productId);

    if (!product || !cartItem) return;

    if (direction === 1) {

        // تم تعطيل حظر زيادة الكمية عند نفاذ المخزون للسماح بالبيع بالسالب والتحديث اللاحق!

        cartItem.qty++;

    } else {

        cartItem.qty--;

        if (cartItem.qty <= 0) {

            removeCartItem(productId);

            return;

        }

    }

    saveToLocalStorage();

    refreshCartUI();

};

// حذف سلعة نهائياً من السلة

window.removeCartItem = function(productId) {

    appState.cart = appState.cart.filter(item => item.productId !== productId);

    saveToLocalStorage();

    refreshCartUI();

};

// فتح نافذة تعديل/تخفيض سعر البيع للسلعة في السلة مباشرة
window.openCartItemPriceEditModal = function(productId, currentCustomPrice) {
    const product = appState.products.find(p => String(p.id) === String(productId));
    if (!product) return;

    const cartItem = appState.cart.find(item => String(item.productId) === String(productId) && item.customPrice === currentCustomPrice);
    if (!cartItem) return;

    const currentPrice = (currentCustomPrice !== null && currentCustomPrice !== undefined) ? currentCustomPrice : product.sellPrice;
    
    const inputVal = prompt(
        `🏷️ تعديل وتخفيض سعر البيع المخصص لـ [ ${product.name} ]:\n` +
        `• السعر الحالي بالسلة: ${currentPrice} د.ج\n` +
        `• السعر الأصلي بالمخزن: ${product.sellPrice} د.ج\n\n` +
        `أدخل السعر الجديد للقطعة (أو اضغط إلغاء):`,
        currentPrice
    );

    if (inputVal === null) return;
    const newPrice = parseFloat(inputVal.trim());
    if (isNaN(newPrice) || newPrice < 0) {
        alert("⚠️ يرجى إدخال سعر صحيح!");
        return;
    }

    cartItem.customPrice = newPrice;
    saveToLocalStorage();
    refreshCartUI();
    showToast(`✅ تم تعديل وتخفيض سعر البيع لـ [ ${product.name} ] إلى ${formatCurrency(newPrice)}`);
};

// حساب مجاميع المبيعات وحساب المتبقي/الباقي للزبون
function calculateCartTotals() {

    let total = 0;

    appState.cart.forEach(item => {

        const product = appState.products.find(p => p.id === item.productId);

        if (product) {

            const isCustom = item.customPrice !== null && item.customPrice !== undefined && item.customPrice !== product.sellPrice;

            const sellPrice = isCustom ? item.customPrice : product.sellPrice;

            if (isCustom) {

                total += sellPrice * item.qty;

            } else {

                total += calculateItemPriceAndPromo(product, item.qty).total;

            }

        }

    });

    document.getElementById("cart-total-price").innerText = formatCurrency(total);

    // تحديث شاشة عرض السعر للمشتري

    const custDisplay = document.getElementById("customer-total-price-display");

    if (custDisplay) {

        custDisplay.innerText = formatCurrency(total);

    }

    // حساب المبلغ المتبقي (الباقي) للزبون

    const receivedVal = document.getElementById("cart-received-amount").value.trim();

    const changeDueEl = document.getElementById("cart-change-due");

    if (receivedVal !== "") {

        const receivedAmount = parseFloat(receivedVal) || 0;

        const change = receivedAmount - total;

        if (change >= 0) {

            changeDueEl.innerText = formatCurrency(change);

            changeDueEl.className = "text-success font-weight-bold";

        } else {

            changeDueEl.innerText = `كريدي للزبون: ${formatCurrency(Math.abs(change))}`;

            changeDueEl.className = "text-danger font-weight-bold";

        }

    } else {

        changeDueEl.innerText = formatCurrency(0);

        changeDueEl.className = "text-success";

    }

    // تحديث عدد العناصر في سلة المبيعات على الموبايل
    const mobileCartCountEl = document.getElementById("pos-mobile-cart-count");
    if (mobileCartCountEl) {
        let totalItems = appState.cart.reduce((sum, item) => sum + (parseFloat(item.qty) || 0), 0);
        mobileCartCountEl.innerText = Number(totalItems.toFixed(2)).toString();
    }
}



// 13. تأكيد المبيعات والطباعة الفورية (Checkout Process)

function processCheckout(shouldPrint = false) {

    if (appState.cart.length === 0) {
        const receivedVal = document.getElementById("cart-received-amount")?.value.trim() || "";
        const received = parseFloat(receivedVal) || 0;
        if (received > 0) {
            openQuickDebtSettleModal(received);
            return;
        }

        // إذا كانت السلة فارغة وتم طلب الطباعة (عند الضغط على F3)، نعيد طباعة فاتورة آخر معاملة
        if (shouldPrint && window.lastCompletedTransaction) {
            preparePrintReceipt(window.lastCompletedTransaction);
            setTimeout(() => {
                window.print();
            }, 150);
            return;
        }

        showToast("🛒 السلة فارغة حالياً! قم بإضافة سلع للبدء بالبيع.");
        return;
    }

    let total = 0;

    let totalProfit = 0;

    const checkoutItems = [];

    // التحقق من صحة المنتجات وحساب قيم المعاملة

    for (const item of appState.cart) {

        const product = appState.products.find(p => p.id === item.productId);

        if (!product) continue;

        const isCustom = item.customPrice !== null && item.customPrice !== undefined && item.customPrice !== product.sellPrice;

        const sellPrice = isCustom ? item.customPrice : product.sellPrice;

        let sales;

        if (isCustom) {

            sales = sellPrice * item.qty;

        } else {

            sales = calculateItemPriceAndPromo(product, item.qty).total;

        }

        let cost;
        let profit;
        let itemBuyPrice;

        if (product.isCustomItem === true) {
            const percent = parseFloat(appState.storeSettings.customProfitPercent) || 0;
            profit = sales * (percent / 100);
            cost = sales - profit;
            itemBuyPrice = sellPrice * (1 - percent / 100);
        } else {
            cost = product.buyPrice * item.qty;
            profit = sales - cost;
            itemBuyPrice = product.buyPrice;
        }

        total += sales;

        totalProfit += profit;

        checkoutItems.push({

            productId: product.id,

            name: product.name,

            qty: item.qty,

            buyPrice: itemBuyPrice,

            sellPrice: sellPrice,

            totalPrice: sales,

            unit: product.unit,

            customPrice: item.customPrice

        });

    }

    const receivedVal = document.getElementById("cart-received-amount").value.trim();

    const received = receivedVal !== "" ? (parseFloat(receivedVal) || 0) : total;

    const change = received - total;

    let debtRegistered = false;

    let customerName = "";

    let debtAmount = 0;

    if (change < 0) {
        const confirmDebt = confirm(`⚠️ المبلغ المستلم (${received} دج) أقل من الإجمالي (${total} دج). المتبقي: ${Math.abs(change)} دج. هل تريد تسجيل المتبقي كدين (كريدي) على الزبون؟`);
        if (confirmDebt) {
            const debtAmount = Math.abs(change);
            const sel = document.getElementById('pos-customer-select');
            
            // إذا كان هناك زبون دائم محدد مسبقاً في السلة
            if (sel && sel.value && sel.value !== 'walkin' && sel.value !== '') {
                const customer = (appState.customers || []).find(c => c.id === sel.value);
                if (customer) {
                    // تصفير وتهيئة فواتير السلعة المؤقتة
                    appState.cart = [];
                    appState.products = appState.products.filter(p => !p.isCustomItem);
                    completeCheckoutWithCustomerDebt(customer, debtAmount, received, total, checkoutItems, totalProfit);
                    return;
                }
            }
            
            // وإلا، نفتح نافذة البحث السريع واختيار/إضافة الزبون
            openCheckoutDebtModal(debtAmount, received, total, checkoutItems, totalProfit);
            return;
        } else {
            const confirmUnderpay = confirm(`هل تريد الاستمرار وإتمام العملية دون تسجيل دين؟`);
            if (!confirmUnderpay) return;
        }
    }

    // 1. توليد كود العملية وحفظها بالسجل

    const transactionId = "TX-" + Date.now().toString(16).toUpperCase();

    const newTransaction = {

        id: transactionId,

        timestamp: new Date().toISOString(),

        items: checkoutItems,

        total: total,

        profit: totalProfit,

        received: received,

        change: change >= 0 ? change : 0,

        isDebt: debtRegistered,

        customerName: customerName,

        debtAmount: debtAmount,

        processedBy: appState.currentUser ? appState.currentUser.displayName : "النظام"

    };

    // 2. تحديث وتخفيض كميات المخازن

    checkoutItems.forEach(item => {

        const product = appState.products.find(p => p.id === item.productId);

        if (product) {

            product.qty = parseFloat((product.qty - item.qty).toFixed(2));

        }

    });

    appState.transactions.push(newTransaction);

    // تسجيل الدين في القائمة النشطة

    if (debtRegistered) {

        if (!appState.debts) appState.debts = [];

        appState.debts.push({

            id: "DB-" + Date.now().toString(16).toUpperCase(),

            timestamp: new Date().toISOString(),

            transactionId: transactionId,

            customerName: customerName,

            amount: debtAmount,

            status: "active"

        });

    }

    // 3. تخزين المعاملة الأخيرة للطباعة الاختيارية عند الطلب

    window.lastCompletedTransaction = newTransaction;

    // 4. تصفير السلة وتحديث البيانات فوراً وبصمت كامل

    appState.cart = [];

    appState.products = appState.products.filter(p => !p.isCustomItem);

    document.getElementById("cart-received-amount").value = "";

    saveToLocalStorage();

    refreshUI();

    // 5. الطباعة تحدث فقط وفقط عند طلبها صراحة (عند الضغط على F3)
    if (shouldPrint) {
        preparePrintReceipt(newTransaction);
        setTimeout(() => {
            window.print();
        }, 150);
    }

    if (debtRegistered) {
        showToast(`✅ تمت المعاملة بنجاح وتم تسجيل دين بقيمة ${formatCurrency(debtAmount)} باسم ${customerName}!`);
    } else {
        showToast("✅ تمت عملية البيع بنجاح وتخفيض السلع!");
    }
}

// إعداد هيكل فاتورة الطباعة للماكينة الحرارية

function preparePrintReceipt(transaction) {
    if (!transaction) return;

    const storeName = appState.storeSettings.name || "متجري الذكي";
    const storeType = appState.storeSettings.type || "grocery";
    let typeText = "سوبيرات ومواد غذائية";
    if (storeType === "cosmetic") typeText = "محل مستحضرات تجميل وكوسميتيك";
    if (storeType === "veggies") typeText = "محل خضروات وفواكه طازجة";

    const nameEl = document.getElementById("receipt-store-name");
    if (nameEl) nameEl.innerText = storeName;

    const typeEl = document.getElementById("receipt-store-type-disp");
    if (typeEl) typeEl.innerText = typeText;

    const idEl = document.getElementById("receipt-id");
    if (idEl) idEl.innerText = `#${transaction.id}`;

    const formattedDate = new Date(transaction.timestamp).toLocaleString('ar-DZ', {
        year: 'numeric', month: 'numeric', day: 'numeric',
        hour: '2-digit', minute: '2-digit'
    });

    const dateEl = document.getElementById("receipt-date");
    if (dateEl) dateEl.innerText = formattedDate;

    // إظهار اللوغو على الوصل إذا كان الخيار مفعلاً
    let logoHTML = "";
    if (appState.storeSettings.showLogoOnReceipt) {
        const logoBase64 = typeof getShopLogo === 'function' ? getShopLogo() : null;
        if (logoBase64) {
            logoHTML = `<img src="${logoBase64}" class="receipt-logo" style="max-height: 50px; display: block; margin: 0 auto 10px auto; object-fit: contain;">`;
        }
    }

    let logoContainer = document.getElementById("receipt-logo-container");
    if (!logoContainer) {
        logoContainer = document.createElement("div");
        logoContainer.id = "receipt-logo-container";
        const header = document.querySelector(".receipt-header");
        if (header) {
            header.insertBefore(logoContainer, header.firstChild);
        }
    }
    if (logoContainer) logoContainer.innerHTML = logoHTML;

    if (typeof applyPrintStyles === 'function') applyPrintStyles();

    // 1. ملء جدول المواد في الوصل المطبوع (ورق 80mm)
    const tbody = document.getElementById("receipt-items-tbody");
    if (tbody && transaction.items) {
        tbody.innerHTML = transaction.items.map(item => {
            const lineTotal = item.totalPrice !== undefined ? item.totalPrice : (item.sellPrice * item.qty);
            return `
                <tr>
                    <td class="text-right" style="font-weight: bold; color: #000;">${item.name}</td>
                    <td style="color: #000;">${item.qty} ${item.unit || ''}</td>
                    <td style="color: #000;">${formatCurrency(item.sellPrice)}</td>
                    <td class="text-left font-weight-bold" style="color: #000;">${formatCurrency(lineTotal)}</td>
                </tr>
            `;
        }).join("");
    }

    // 2. ملء جدول ومحتوى المعاينة البصرية داخل النافذة (Modal Preview)
    const previewTbody = document.getElementById("preview-receipt-tbody");
    if (previewTbody && transaction.items) {
        previewTbody.innerHTML = transaction.items.map(item => {
            const lineTotal = item.totalPrice !== undefined ? item.totalPrice : (item.sellPrice * item.qty);
            return `
                <tr style="border-bottom: 1px solid rgba(255,255,255,0.05);">
                    <td style="padding: 8px 12px; font-weight: 700; color: #f1f5f9;">${item.name}</td>
                    <td style="padding: 8px; text-align: center; color: #cbd5e1;">${item.qty} ${item.unit || ''}</td>
                    <td style="padding: 8px; text-align: center; color: #cbd5e1;">${formatCurrency(item.sellPrice)}</td>
                    <td style="padding: 8px 12px; text-align: left; font-weight: 800; color: #4ade80;">${formatCurrency(lineTotal)}</td>
                </tr>
            `;
        }).join("");
    }

    const prevId = document.getElementById("preview-receipt-id");
    if (prevId) prevId.innerText = `#${transaction.id.slice(-6).toUpperCase()}`;

    const prevDate = document.getElementById("preview-receipt-date");
    if (prevDate) prevDate.innerText = formattedDate;

    const prevTotal = document.getElementById("preview-receipt-total");
    if (prevTotal) prevTotal.innerText = formatCurrency(transaction.total);

    const prevReceived = document.getElementById("preview-receipt-received");
    if (prevReceived) prevReceived.innerText = formatCurrency(transaction.received);

    const prevChange = document.getElementById("preview-receipt-change");
    if (prevChange) prevChange.innerText = formatCurrency(transaction.change);

    const rTotal = document.getElementById("receipt-total");
    if (rTotal) rTotal.innerText = formatCurrency(transaction.total);

    const rReceived = document.getElementById("receipt-received");
    if (rReceived) rReceived.innerText = formatCurrency(transaction.received);

    const rChange = document.getElementById("receipt-change");
    if (rChange) rChange.innerText = formatCurrency(transaction.change);

    const modal = document.getElementById("checkout-success-modal");
    if (modal) modal.classList.remove("hidden");
}

// 14. إدارة المخزون وتصميم النماذج

function renderInventoryView() {

    renderInventoryTable();

    updateCategoryDatalist();

}

// جلب وعرض قائمة السلع في المخزن مع الفلترة بالبحث

function renderInventoryTable() {

    const tbody = document.getElementById("inventory-tbody");

    if (!tbody) return;

    const searchQuery = document.getElementById("inventory-search-input")?.value.toLowerCase().trim() || "";

    const filtered = appState.products.filter(p => {

        if (p.isCustomItem) return false;

        const nameSafe = (p.name || "").toLowerCase();

        const catSafe = (p.category || "").toLowerCase();

        const barcodeSafe = (p.barcode || "");

        const matchesSearch = nameSafe.includes(searchQuery) || 

                             catSafe.includes(searchQuery) ||

                             barcodeSafe.includes(searchQuery);

        if (appState.filterLowStockOnly) {

            const qty = parseFloat(p.qty) || 0;

            const globalMin = (appState.storeSettings && appState.storeSettings.globalMinStockThreshold) ? parseFloat(appState.storeSettings.globalMinStockThreshold) : 5;

            const minQty = (p.minQty !== undefined && p.minQty !== null && p.minQty !== "") ? parseFloat(p.minQty) : globalMin;

            return matchesSearch && qty <= minQty;

        }

        return matchesSearch;

    });

    if (filtered.length > 0) {

        tbody.innerHTML = filtered.map(p => {

            const qty = parseFloat(p.qty) || 0;

            let statusPill = "";

            if (qty < 0) {

                statusPill = `<span class="stock-status-pill danger">سالب (${qty}) 🚨</span>`;

            } else if (qty === 0) {

                statusPill = `<span class="stock-status-pill danger">منتهي</span>`;

            } else {

                const globalMin = (appState.storeSettings && appState.storeSettings.globalMinStockThreshold) ? parseFloat(appState.storeSettings.globalMinStockThreshold) : 5;

                const minQty = (p.minQty !== undefined && p.minQty !== null && p.minQty !== "") ? parseFloat(p.minQty) : globalMin;

                if (qty <= minQty) {

                    statusPill = `<span class="stock-status-pill warning">منخفض (${qty}/${minQty}) ⚠️</span>`;

                } else {

                    statusPill = `<span class="stock-status-pill success">متوفر</span>`;

                }

            }

            return `

                <tr>

                    <td class="font-weight-bold text-info">${p.barcode || '<span class="text-muted">بدون كود</span>'}</td>

                    <td class="font-weight-bold">${p.name}</td>

                    <td>${p.category || 'غير محدد'}</td>

                    <td>${formatCurrency(p.buyPrice)}</td>

                    <td class="text-success font-weight-bold">${formatCurrency(p.sellPrice)}</td>

                    <td><strong>${qty}</strong></td>

                    <td>${p.unit}</td>

                    <td>${statusPill}</td>

                    <td>
                        <button class="btn-action-circle success" onclick="quickRestockProduct('${p.id}')" title="زيادة وتزويد مخزون السلعة (+)" style="background:rgba(16,185,129,0.12);border-color:rgba(16,185,129,0.35);color:#10b981;">
                            <i class="fa-solid fa-circle-plus"></i>
                        </button>

                        <button class="btn-action-circle edit" onclick="editProduct('${p.id}')" title="تعديل السلعة">
                            <i class="fa-solid fa-pen"></i>
                        </button>

                        <button class="btn-action-circle" onclick="openBarcodeModal('${p.id}')" title="طباعة ملصق باركود" style="background:rgba(99,102,241,0.12);border-color:rgba(99,102,241,0.35);color:#818cf8;">
                            <i class="fa-solid fa-barcode"></i>
                        </button>

                        <button class="btn-action-circle delete" onclick="deleteProduct('${p.id}')" title="حذف السلعة">
                            <i class="fa-solid fa-trash-can"></i>
                        </button>
                    </td>

                </tr>

            `;

        }).join("");

    } else {
        tbody.innerHTML = `<tr><td colspan="9" class="text-muted text-center py-5">لا توجد سلع مطابقة للبحث أو المخزن فارغ تماماً.</td></tr>`;
    }

    // حساب ملخص المخزن الإجمالي المعروض
    let totalBuy = 0;
    let totalSell = 0;
    let totalQty = 0;

    filtered.forEach(p => {
        const qty = parseFloat(p.qty) || 0;
        const buy = parseFloat(p.buyPrice) || 0;
        const sell = parseFloat(p.sellPrice) || 0;
        
        if (qty > 0) {
            totalBuy += buy * qty;
            totalSell += sell * qty;
            totalQty += qty;
        }
    });

    const expectedProfit = totalSell - totalBuy;

    const buyValEl = document.getElementById("inventory-total-buy-value");
    const sellValEl = document.getElementById("inventory-total-sell-value");
    const profitEl = document.getElementById("inventory-expected-profit");
    const qtyEl = document.getElementById("inventory-total-items-qty");

    if (buyValEl) buyValEl.innerText = formatCurrency(totalBuy);
    if (sellValEl) sellValEl.innerText = formatCurrency(totalSell);
    if (profitEl) profitEl.innerText = formatCurrency(expectedProfit);
    if (qtyEl) qtyEl.innerText = `${totalQty} قطعة`;
}

// تحديث قائمة الاقتراحات التلقائية للفئات في النموذج

function updateCategoryDatalist() {

    const list = document.getElementById("categories-list");

    if (!list) return;

    const uniqueCategories = [...new Set(appState.products.map(p => p.category).filter(c => c && c.trim() !== ""))];

    list.innerHTML = uniqueCategories.map(c => `<option value="${c}"></option>`).join("");

}

// حفظ أو إضافة منتج للمخازن

function saveProduct() {
    const idEl = document.getElementById("prod-id");
    const nameEl = document.getElementById("prod-name");
    const barcodeEl = document.getElementById("prod-barcode");
    const buyPriceEl = document.getElementById("prod-buy-price");
    const sellPriceEl = document.getElementById("prod-sell-price");
    const qtyEl = document.getElementById("prod-qty");
    const unitEl = document.getElementById("prod-unit");
    const categoryEl = document.getElementById("prod-category");
    const promoQtyEl = document.getElementById("prod-promo-qty");
    const promoPriceEl = document.getElementById("prod-promo-price");
    const quickSellEl = document.getElementById("prod-is-quick-sell");
    const emojiEl = document.getElementById("prod-emoji");
    const bulkEl = document.getElementById("prod-barcode-is-bulk");

    const id = idEl ? idEl.value : "";
    const name = nameEl ? nameEl.value.trim() : "";
    let barcode = barcodeEl ? barcodeEl.value.trim() : "";
    const buyPrice = buyPriceEl ? (parseFloat(buyPriceEl.value) || 0) : 0;
    const sellPrice = sellPriceEl ? (parseFloat(sellPriceEl.value) || 0) : 0;
    const qty = qtyEl ? (parseFloat(qtyEl.value) || 0) : 0;
    const unit = unitEl ? unitEl.value : "قطعة";
    const category = categoryEl ? (categoryEl.value.trim() || "غير مصنف") : "غير مصنف";
    const promoQty = promoQtyEl ? (parseInt(promoQtyEl.value) || 0) : 0;
    const promoPrice = promoPriceEl ? (parseFloat(promoPriceEl.value) || 0) : 0;
    const isQuickSell = quickSellEl ? quickSellEl.checked : false;
    const emoji = emojiEl ? (emojiEl.value.trim() || "📦") : "📦";
    const barcodeIsBulk = bulkEl ? bulkEl.checked : false;

    const imageData = document.getElementById('prod-image-data') ? document.getElementById('prod-image-data').value : '';
    const cardColor = document.getElementById('prod-card-color') ? document.getElementById('prod-card-color').value : '';

    if (!name || sellPrice < 0) {
        showToast("⚠️ يرجى إدخال اسم السلعة وسعر البيع بشكل صحيح!");
        return;
    }

    if (barcode !== "") {
        const duplicate = appState.products.find(p => p.barcode === barcode && p.id !== id);
        if (duplicate) {
            showToast(`⚠️ كود الباركود هذا [ ${barcode} ] مستخدم بالفعل للمنتج: [ ${duplicate.name} ]!`);
            return;
        }
    } else {
        barcode = "613" + Math.floor(100000000 + Math.random() * 900000000).toString();
    }

    if (id && id !== "") {
        const index = appState.products.findIndex(p => p.id === id);
        if (index !== -1) {
            appState.products[index] = { id, barcode, name, buyPrice, sellPrice, qty, unit, category, promoQty, promoPrice, isQuickSell, emoji, barcodeIsBulk, image: imageData, cardColor: cardColor };
            showToast("✅ تم تعديل بيانات السلعة بنجاح!");
        }
    } else {
        const newProduct = {
            id: "PR-" + Date.now().toString(16).toUpperCase(),
            barcode, name, buyPrice, sellPrice, qty, unit, category, promoQty, promoPrice, isQuickSell, emoji, barcodeIsBulk, image: imageData, cardColor: cardColor
        };
        appState.products.push(newProduct);
        showToast("🎉 تم إضافة السلعة الجديدة للمخزن بنجاح!");
    }

    saveToLocalStorage();
    resetProductForm();
    refreshUI();
}

// تحميل بيانات المنتج للنموذج لتعديله

window.editProduct = function(id) {
    const product = appState.products.find(p => p.id === id);
    if (!product) return;

    const title = document.getElementById("inventory-form-title");
    if (title) title.innerText = "تعديل بيانات السلعة بالمخزن";

    const pId = document.getElementById("prod-id");
    if (pId) pId.value = product.id;

    const pName = document.getElementById("prod-name");
    if (pName) pName.value = product.name;

    const pBarcode = document.getElementById("prod-barcode");
    if (pBarcode) pBarcode.value = product.barcode || "";

    const pBuy = document.getElementById("prod-buy-price");
    if (pBuy) pBuy.value = product.buyPrice;

    const pSell = document.getElementById("prod-sell-price");
    if (pSell) pSell.value = product.sellPrice;

    const pQty = document.getElementById("prod-qty");
    if (pQty) pQty.value = product.qty;

    const pUnit = document.getElementById("prod-unit");
    if (pUnit) pUnit.value = product.unit;

    const pCat = document.getElementById("prod-category");
    if (pCat) pCat.value = product.category;

    const pPromoQty = document.getElementById("prod-promo-qty");
    if (pPromoQty) pPromoQty.value = product.promoQty || "";

    const pPromoPrice = document.getElementById("prod-promo-price");
    if (pPromoPrice) pPromoPrice.value = product.promoPrice || "";

    const pQuick = document.getElementById("prod-is-quick-sell");
    if (pQuick) pQuick.checked = !!product.isQuickSell;

    const pEmoji = document.getElementById("prod-emoji");
    if (pEmoji) pEmoji.value = product.emoji || "📦";

    const pBulk = document.getElementById("prod-barcode-is-bulk");
    if (pBulk) pBulk.checked = !!product.barcodeIsBulk;

    const preview = document.getElementById('prod-image-preview');
    const placeholder = document.getElementById('prod-image-placeholder');
    const removeBtn = document.getElementById('btn-remove-prod-image');
    const imageData = document.getElementById('prod-image-data');

    if (imageData) imageData.value = product.image || '';

    if (product.image) {
        if (preview) { preview.src = product.image; preview.style.display = 'block'; }
        if (placeholder) placeholder.style.display = 'none';
        if (removeBtn) removeBtn.style.display = 'inline-flex';
    } else {
        if (preview) { preview.src = ''; preview.style.display = 'none'; }
        if (placeholder) placeholder.style.display = 'block';
        if (removeBtn) removeBtn.style.display = 'none';
    }

    // تحميل ومعاينة اللون

    const colorInput = document.getElementById('prod-card-color');

    if (colorInput) colorInput.value = product.cardColor || '';

    if (typeof selectProductColor === 'function') {

        selectProductColor(product.cardColor || '');

    }

    document.getElementById("btn-save-product").innerHTML = `حفظ التعديلات <i class="fa-solid fa-circle-check"></i>`;

    // فتح النافذة المنبثقة

    const modal = document.getElementById("product-modal");

    if (modal) {

        modal.classList.remove("hidden");

        // إعادة تعيين موضع النافذة الافتراضي

        const card = document.getElementById("product-modal-card");

        if (card) { card.style.top = '0px'; card.style.left = '0px'; }

    }

};

// حذف منتج

window.deleteProduct = function(id) {

    const product = appState.products.find(p => p.id === id);

    if (!product) return;

    const confirmDelete = confirm(`🚨 هل أنت متأكد من رغبتك في حذف السلعة نهائياً: [ ${product.name} ]؟`);

    if (confirmDelete) {

        appState.products = appState.products.filter(p => p.id !== id);

        // حذفها من السلة إن وجدت

        appState.cart = appState.cart.filter(item => item.productId !== id);

        // حفظ ID السلعة المحذوفة لمنع إعادتها تلقائياً

        try {

            const deleted = JSON.parse(localStorage.getItem('smart_shop_deleted_ids') || '[]');

            if (!deleted.includes(id)) {

                deleted.push(id);

                localStorage.setItem('smart_shop_deleted_ids', JSON.stringify(deleted));

            }

        } catch(e) {}

        saveToLocalStorage();

        refreshUI();

        showToast("✅ تم حذف السلعة بنجاح!");

    }

};

// الفحص التلقائي للباركود المكرر وملء البيانات وإظهار التنبيه
window.checkDuplicateBarcodeAndAutofill = function(barcodeVal, context) {
    if (!barcodeVal || barcodeVal.trim() === '') {
        hideDuplicateBarcodeWarning(context);
        return;
    }

    const cleanBarcode = barcodeVal.trim();

    if (context === 'product-modal') {
        const prodIdInput = document.getElementById('prod-id');
        const currentId = prodIdInput ? prodIdInput.value : '';

        const existingProd = appState.products.find(p => 
            String(p.barcode || '').trim() === cleanBarcode && 
            (!currentId || String(p.id) !== String(currentId))
        );

        if (existingProd) {
            if (prodIdInput) prodIdInput.value = existingProd.id;
            
            const nameEl = document.getElementById('prod-name');
            if (nameEl) nameEl.value = existingProd.name || '';

            const buyEl = document.getElementById('prod-buy-price');
            if (buyEl) buyEl.value = existingProd.buyPrice || 0;

            const sellEl = document.getElementById('prod-sell-price');
            if (sellEl) sellEl.value = existingProd.sellPrice || 0;

            const qtyEl = document.getElementById('prod-qty');
            if (qtyEl) qtyEl.value = existingProd.qty || 0;

            const unitEl = document.getElementById('prod-unit');
            if (unitEl) unitEl.value = existingProd.unit || 'قطعة';

            const catEl = document.getElementById('prod-category');
            if (catEl) catEl.value = existingProd.category || 'عام';

            const promoQtyEl = document.getElementById('prod-promo-qty');
            if (promoQtyEl) promoQtyEl.value = existingProd.promoQty || '';

            const promoPriceEl = document.getElementById('prod-promo-price');
            if (promoPriceEl) promoPriceEl.value = existingProd.promoPrice || '';

            const quickSellEl = document.getElementById('prod-is-quick-sell');
            if (quickSellEl) quickSellEl.checked = !!existingProd.isQuickSell;

            const bulkEl = document.getElementById('prod-barcode-is-bulk');
            if (bulkEl) bulkEl.checked = !!existingProd.barcodeIsBulk;

            const titleEl = document.getElementById("inventory-form-title");
            if (titleEl) titleEl.innerText = "تعديل بيانات السلعة المسجلة بالمخزن ⚠️";

            const warnBox = document.getElementById('prod-barcode-warning');
            const warnText = document.getElementById('prod-barcode-warning-text');
            if (warnBox && warnText) {
                warnText.innerHTML = `⚠️ تنبيه: هذا الباركود مسجل مسبقاً للسلعة [ <strong>${existingProd.name}</strong> ] (المتوفر حالياً: ${existingProd.qty}). تم ملء البيانات للتعديل أو زيادة الكمية.`;
                warnBox.classList.remove('hidden');
            }

            showToast(`⚠️ تنبيه: هذا الباركود مسجل مسبقاً للسلعة [ ${existingProd.name} ]`);
        } else {
            hideDuplicateBarcodeWarning(context);
        }
    } else if (context === 'bon-achat') {
        const existingProd = appState.products.find(p => 
            String(p.barcode || '').trim() === cleanBarcode
        );

        if (existingProd) {
            const nameEl = document.getElementById('bon-prod-name');
            if (nameEl) nameEl.value = existingProd.name || '';

            const buyEl = document.getElementById('bon-prod-buy-price');
            if (buyEl) buyEl.value = existingProd.buyPrice || 0;

            const sellEl = document.getElementById('bon-prod-sell-price');
            if (sellEl) sellEl.value = existingProd.sellPrice || 0;

            const unitEl = document.getElementById('bon-prod-unit');
            if (unitEl) unitEl.value = existingProd.unit || 'قطعة';

            const catEl = document.getElementById('bon-prod-category');
            if (catEl) catEl.value = existingProd.category || 'عام';

            const warnBox = document.getElementById('bon-prod-barcode-warning');
            const warnText = document.getElementById('bon-prod-barcode-warning-text');
            if (warnBox && warnText) {
                warnText.innerHTML = `⚠️ تنبيه: السلعة موجودة مسبقاً بالمخزن باسم [ <strong>${existingProd.name}</strong> ] (سعر الشراء الحالي: ${existingProd.buyPrice} د.ج | الكمية المتوفرة: ${existingProd.qty}).`;
                warnBox.classList.remove('hidden');
            }

            showToast(`⚠️ تنبيه: السلعة موجودة مسبقاً بالمخزن باسم [ ${existingProd.name} ]`);
        } else {
            hideDuplicateBarcodeWarning(context);
        }
    }
};

window.hideDuplicateBarcodeWarning = function(context) {
    if (context === 'product-modal') {
        const warnBox = document.getElementById('prod-barcode-warning');
        if (warnBox) warnBox.classList.add('hidden');
    } else if (context === 'bon-achat') {
        const warnBox = document.getElementById('bon-prod-barcode-warning');
        if (warnBox) warnBox.classList.add('hidden');
    }
};

// تصفية حقول النموذج بعد الحفظ أو الإلغاء
function resetProductForm() {
    const title = document.getElementById("inventory-form-title");
    if (title) title.innerText = "إضافة منتج جديد للمخزن";

    const id = document.getElementById("prod-id");
    if (id) id.value = "";

    const form = document.getElementById("product-form");
    if (form) form.reset();

    const quickSell = document.getElementById("prod-is-quick-sell");
    if (quickSell) quickSell.checked = false;

    const emoji = document.getElementById("prod-emoji");
    if (emoji) emoji.value = "📦";

    const bulk = document.getElementById("prod-barcode-is-bulk");
    if (bulk) bulk.checked = false;

    hideDuplicateBarcodeWarning('product-modal');

    if (typeof removeProdImage === 'function') removeProdImage();

    const colorInput = document.getElementById('prod-card-color');
    if (colorInput) colorInput.value = '';

    document.querySelectorAll('.btn-color-pick').forEach(btn => btn.style.outline = '');

    const btnSave = document.getElementById("btn-save-product");
    if (btnSave) btnSave.innerHTML = `حفظ المنتج <i class="fa-solid fa-floppy-disk"></i>`;
}

// 15. شاشة التقارير والعمليات المالية المفصلة (Reports View Render)

function renderReportsView() {

    // 1. ملء الإحصائيات المتقدمة بأمان مع فحص وجود العناصر

    const rSalesAmt = document.getElementById("report-total-sales-amount");

    if (rSalesAmt) rSalesAmt.innerText = formatCurrency(globalStats.totalSalesAmountEver);

    const rSalesCnt = document.getElementById("report-total-sales-count");

    if (rSalesCnt) rSalesCnt.innerText = `${globalStats.totalSalesCompleted} عملية بيع ناجحة`;

    const rProfitAmt = document.getElementById("report-total-profit-amount");

    if (rProfitAmt) rProfitAmt.innerText = formatCurrency(globalStats.totalProfitEver);

    const rInvBuy = document.getElementById("report-inventory-buy-value");

    if (rInvBuy) rInvBuy.innerText = formatCurrency(globalStats.inventoryBuyValue);

    const rInvSell = document.getElementById("report-inventory-sell-value");

    if (rInvSell) rInvSell.innerText = formatCurrency(globalStats.inventorySellValue);

    const rInvPotential = document.getElementById("report-inventory-potential-profit");

    if (rInvPotential) {

        const potentialProfit = globalStats.inventorySellValue - globalStats.inventoryBuyValue;

        rInvPotential.innerText = `الأرباح المتوقعة عند البيع الكامل: ${formatCurrency(potentialProfit)}`;

    }

    // 2. تعبئة السجل الكامل للمبيعات

    const salesLogTbody = document.getElementById("sales-log-tbody");

    if (!salesLogTbody) return;

    if (appState.transactions.length > 0) {

        // ترتيب المعاملات من الأحدث للأقدم

        const sortedTransactions = [...appState.transactions].reverse();

        salesLogTbody.innerHTML = sortedTransactions.map(t => {

            const date = new Date(t.timestamp);

            const dateTimeStr = date.toLocaleString('ar-DZ', {

                year: 'numeric', month: 'short', day: 'numeric',

                hour: '2-digit', minute: '2-digit'

            });

            // صياغة قائمة بأسماء المنتجات بالمعاملة بأمان

            const itemsStr = (t.items && Array.isArray(t.items)) ? t.items.map(item => `${item.name || "عنصر"} (${item.qty || 0} ${(item.unit || "قطعة").substring(0,2)})`).join("، ") : "لا توجد مواد";

            const isSettle = t.isSettle || (t.items && Array.isArray(t.items) && t.items.some(item => item.productId && item.productId.startsWith("settle-debt")));

            const settleBadge = isSettle ? `<br><span style="font-size: 0.68rem; padding: 2px 6px; border-radius: 4px; background: rgba(46,196,182,0.15); color: var(--color-success); font-weight: bold; display: inline-block; margin-top: 4px;"><i class="fa-solid fa-hand-holding-dollar"></i> تسديد كريدي</span>` : '';

            const cashierName = t.processedBy || "المدير العام";

            return `

                <tr ${isSettle ? 'style="background: rgba(46, 196, 182, 0.03);"' : ''}>

                    <td class="font-weight-bold text-info">#${t.id.slice(-6).toUpperCase()}${settleBadge}</td>

                    <td>${dateTimeStr}</td>

                    <td class="font-weight-bold" style="color: var(--accent-color);">${cashierName}</td>

                    <td style="max-width: 320px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${itemsStr}">${itemsStr}</td>

                    <td class="text-success font-weight-bold">${formatCurrency(t.total)}</td>

                    <td class="text-info">${formatCurrency(t.profit)}</td>

                    <td>

                        <button class="btn-action-circle" onclick="openTxDetailsModal('${t.id}')" title="عرض وتعديل سلع الفاتورة" style="background: rgba(14, 165, 233, 0.12); border-color: rgba(14, 165, 233, 0.35); color: #0ea5e9;">

                            <i class="fa-solid fa-eye"></i>

                        </button>

                        <button class="btn-action-circle" onclick="reprintTransaction('${t.id}')" title="إعادة طباعة الوصل">

                            <i class="fa-solid fa-print"></i>

                        </button>

                        <button class="btn-action-circle delete" onclick="refundTransaction('${t.id}')" title="إرجاع وإلغاء المعاملة بالكامل">

                            <i class="fa-solid fa-rotate-left"></i>

                        </button>

                    </td>

                </tr>

            `;

        }).join("");

    } else {

        salesLogTbody.innerHTML = `<tr><td colspan="6" class="text-muted text-center py-5">لا توجد عمليات بيع مسجلة حتى الآن.</td></tr>`;

    }

    // تحديث جدول حسابات الكاشير والمستخدمين

    renderUsersTable();

    // تحديث سجل الديون والكريدي

    renderDebtsTable();

}

// إعادة طباعة معاملة قديمة من السجل

window.reprintTransaction = function(id) {

    const transaction = appState.transactions.find(t => t.id === id);

    if (!transaction) return;

    preparePrintReceipt(transaction);

    setTimeout(() => {

        window.print();

    }, 200);

};

// إلغاء عملية بيع وإرجاع السلع للمخزن

window.refundTransaction = function(id) {

    const transaction = appState.transactions.find(t => t.id === id);

    if (!transaction) return;

    const confirmRefund = confirm(`🚨 تحذير! هل أنت متأكد من إلغاء المعاملة #${id.slice(-6).toUpperCase()}؟ سيتم إرجاع كافة الكميات المباعة إلى المخزن ونقص قيم الأرباح والمبيعات!`);

    if (confirmRefund) {

        // إرجاع كميات المخزون

        transaction.items.forEach(item => {

            const product = appState.products.find(p => p.id === item.productId);

            if (product) {

                product.qty = parseFloat((product.qty + item.qty).toFixed(2));

            }

        });

        // إزالتها من سجل العمليات

        appState.transactions = appState.transactions.filter(t => t.id !== id);

        saveToLocalStorage();

        refreshUI();

        if (typeof renderTodaySalesTable === 'function') {

            renderTodaySalesTable();

        }

        alert("تم إلغاء العملية وإعادة السلع للمخزن بنجاح!");

    }

};

// 16. تصدير واستيراد المخزن إلى ملفات Excel منسقة ومبسطة (5 خانات أساسية: الباركود، الاسم، العدد، الشراء، البيع)
function exportInventoryToExcel() {
    if (!appState.products || appState.products.length === 0) {
        alert("⚠️ المخزن فارغ تماماً، لا توجد سلع لتصديرها!");
        return;
    }

    const dateStr = new Date().toLocaleDateString('ar-DZ').replace(/\//g, '-');
    const storeNameClean = (appState.storeSettings?.name || 'المحل').replace(/\s+/g, '_');
    const fileName = `مخزون_${storeNameClean}_${dateStr}.xlsx`;

    // 5 الخانات الأساسية النظيفة فقط بحسب طلب المستخدم
    const headers = [
        "الباركود",
        "اسم السلعة",
        "العدد",
        "سعر الشراء (د.ج)",
        "سعر البيع (د.ج)"
    ];

    let totalQty = 0;

    const dataRows = appState.products.filter(p => !p.isCustomItem).map(p => {
        const qty = parseFloat(p.qty) || 0;
        const buy = parseFloat(p.buyPrice) || 0;
        const sell = parseFloat(p.sellPrice) || 0;
        totalQty += qty;

        return [
            p.barcode || "بدون باركود",
            p.name,
            qty,
            buy,
            sell
        ];
    });

    const summaryRow = [
        "المجموع الإجمالي",
        `عدد السلع: ${appState.products.length}`,
        totalQty,
        "-",
        "-"
    ];

    // إذا كانت مكتبة SheetJS محملة، يتم إنشاء ملف .xlsx حقيقي منسق ومنظم
    if (typeof XLSX !== 'undefined') {
        const wsData = [headers, ...dataRows, summaryRow];
        const ws = XLSX.utils.aoa_to_sheet(wsData);

        // جعل ورقة العمل من اليمين إلى اليسار RTL
        ws['!dir'] = 'rtl';

        // خانات واسعة ومناسبة للأسماء والأرقام والباركود
        ws['!cols'] = [
            { wch: 24 }, // الباركود
            { wch: 42 }, // اسم السلعة (واسع ومريح جداً)
            { wch: 18 }, // العدد
            { wch: 22 }, // سعر الشراء
            { wch: 22 }  // سعر البيع
        ];

        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "المخزون");
        XLSX.writeFile(wb, fileName);
        showToast("✅ تم تصدير ملف Excel المبسط والمنسق بنجاح!");
        return;
    }

    // طريقة احتياطية فائقة التنسيق والألوان (HTML Spreadsheet الملونة التي يفتحها Excel مباشرة بدعم كامل لـ RTL والخط العريض)
    let htmlStr = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
    <head>
        <meta charset="utf-8">
        <style>
            table { border-collapse: collapse; direction: rtl; font-family: 'Cairo', 'Segoe UI', Tahoma, Arial, sans-serif; width: 100%; text-align: right; }
            th { background-color: #0f172a; color: #ffffff; font-size: 14px; font-weight: bold; border: 1.5px solid #334155; padding: 14px 20px; text-align: center; }
            td { font-size: 13px; border: 1px solid #cbd5e1; padding: 12px 16px; text-align: center; }
            tr:nth-child(even) { background-color: #f8fafc; }
            .name-cell { text-align: right; font-weight: bold; font-size: 13.5px; color: #0f172a; min-width: 280px; }
            .num-cell { font-weight: bold; font-family: 'Consolas', 'Courier New', monospace; font-size: 13px; }
            .price-buy { color: #2563eb; font-weight: bold; }
            .price-sell { color: #16a34a; font-weight: bold; }
            .summary-row { background-color: #fef3c7; font-weight: bold; font-size: 14px; border-top: 2.5px solid #f59e0b; color: #78350f; }
        </style>
    </head>
    <body dir="rtl">
        <table dir="rtl">
            <thead>
                <tr>
                    <th style="width: 220px; background-color: #0f172a; color: #ffffff; font-weight: bold;">الباركود</th>
                    <th style="width: 320px; background-color: #0f172a; color: #ffffff; font-weight: bold; text-align: right;">اسم السلعة</th>
                    <th style="width: 140px; background-color: #0f172a; color: #ffffff; font-weight: bold;">العدد / الكمية</th>
                    <th style="width: 180px; background-color: #0f172a; color: #ffffff; font-weight: bold;">سعر الشراء (د.ج)</th>
                    <th style="width: 180px; background-color: #0f172a; color: #ffffff; font-weight: bold;">سعر البيع (د.ج)</th>
                </tr>
            </thead>
            <tbody>
                ${dataRows.map(row => `
                    <tr>
                        <td class="num-cell">${row[0]}</td>
                        <td class="name-cell">${row[1]}</td>
                        <td class="num-cell" style="font-weight: 800; font-size: 14px; color: #1e293b;">${row[2]}</td>
                        <td class="num-cell price-buy">${row[3].toFixed(2)} د.ج</td>
                        <td class="num-cell price-sell">${row[4].toFixed(2)} د.ج</td>
                    </tr>
                `).join('')}
                <tr class="summary-row">
                    <td>المجموع الإجمالي</td>
                    <td style="text-align: right; font-weight: bold;">عدد السلع المسجلة: ${appState.products.length}</td>
                    <td class="num-cell" style="font-size: 15px;">${totalQty}</td>
                    <td>-</td>
                    <td>-</td>
                </tr>
            </tbody>
        </table>
    </body>
    </html>`;

    const blob = new Blob([htmlStr], { type: "application/vnd.ms-excel;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `مخزون_${storeNameClean}_${dateStr}.xls`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast("✅ تم تصدير ملف Excel المبسط والمنسق بنجاح!");
}

// دالة استيراد وتعبئة المخزن من ملف Excel مرفوع
function importInventoryFromExcel(file) {
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            let jsonRows = [];

            if (typeof XLSX !== 'undefined') {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
                const firstSheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[firstSheetName];
                jsonRows = XLSX.utils.sheet_to_json(worksheet, { defval: "" });
            } else {
                const text = new TextDecoder('utf-8').decode(e.target.result);
                const lines = text.split(/\r?\n/).filter(line => line.trim() !== "");
                if (lines.length <= 1) {
                    alert("⚠️ الملف فارغ أو لا يحتوي على بيانات!");
                    return;
                }
                const headers = lines[0].split(',').map(h => h.replace(/^["']|["']$/g, '').trim());
                for (let i = 1; i < lines.length; i++) {
                    const values = lines[i].split(',').map(v => v.replace(/^["']|["']$/g, '').trim());
                    const obj = {};
                    headers.forEach((h, idx) => { obj[h] = values[idx] || ""; });
                    jsonRows.push(obj);
                }
            }

            if (!jsonRows || jsonRows.length === 0) {
                alert("⚠️ لم يتم العثور على سلع في هذا الملف!");
                return;
            }

            let addedCount = 0;
            let updatedCount = 0;

            jsonRows.forEach(row => {
                const barcode = String(row['الباركود'] || row['باركود'] || row['barcode'] || row['Barcode'] || '').trim();
                const name = String(row['اسم السلعة والمنتج'] || row['اسم السلعة'] || row['اسم المنتج'] || row['الاسم'] || row['name'] || row['Name'] || '').trim();

                if ((!name && !barcode) || barcode === 'المجموع الإجمالي' || name === 'المجموع الإجمالي') return;

                const category = String(row['التصنيف / الفئة'] || row['التصنيف'] || row['الفئة'] || row['category'] || 'عام').trim();
                const qty = parseFloat(row['العدد / الكمية'] || row['العدد'] || row['الكمية بالمخزن'] || row['الكمية'] || row['qty'] || row['Qty'] || 0) || 0;
                const buyPrice = parseFloat(row['سعر الشراء (د.ج)'] || row['سعر الشراء'] || row['buyPrice'] || 0) || 0;
                const sellPrice = parseFloat(row['سعر البيع (د.ج)'] || row['سعر البيع'] || row['sellPrice'] || 0) || 0;
                const unit = String(row['وحدة القياس'] || row['الوحدة'] || row['unit'] || 'قطعة').trim();
                const expiryDate = String(row['تاريخ الانتهاء'] || row['expiry'] || '').trim();

                let existing = null;
                if (barcode && barcode !== 'بدون باركود') {
                    existing = appState.products.find(p => p.barcode === barcode);
                }
                if (!existing && name) {
                    existing = appState.products.find(p => p.name.trim().toLowerCase() === name.toLowerCase());
                }

                if (existing) {
                    existing.qty = qty;
                    if (buyPrice > 0) existing.buyPrice = buyPrice;
                    if (sellPrice > 0) existing.sellPrice = sellPrice;
                    if (category && category !== 'عام') existing.category = category;
                    if (unit) existing.unit = unit;
                    if (expiryDate && expiryDate !== '-') existing.expiryDate = expiryDate;
                    updatedCount++;
                } else {
                    const newId = "prod-" + Date.now() + "-" + Math.floor(Math.random() * 1000);
                    appState.products.push({
                        id: newId,
                        barcode: (barcode && barcode !== 'بدون باركود') ? barcode : '',
                        name: name || ('سلعة ' + (barcode || Date.now())),
                        category: category || 'عام',
                        qty: qty,
                        buyPrice: buyPrice,
                        sellPrice: sellPrice,
                        unit: unit || 'قطعة',
                        expiryDate: (expiryDate && expiryDate !== '-') ? expiryDate : '',
                        isQuickSell: false
                    });
                    addedCount++;
                }
            });

            saveToLocalStorage();
            renderInventoryTable();
            calculateStats();
            refreshUI();

            alert(`🎉 تم استيراد وتحديث سلع المخزن بنجاح!\n\n• سلع جديدة أُضيفت للمخزن: ${addedCount}\n• سلع سابقة تم تحديث كمياتها وأسعارها: ${updatedCount}`);
        } catch(err) {
            alert("❌ حدث خطأ أثناء معالجة ملف Excel! يرجى التأكد من أن الملف بصيغة .xlsx أو .csv صحيحة.");
            console.error("خطأ استيراد اكسل:", err);
        }
    };
    reader.readAsArrayBuffer(file);
}

function exportSalesLogToExcel() {

    if (appState.transactions.length === 0) {

        alert("لا توجد مبيعات مسجلة لتصديرها حالياً!");

        return;

    }

    let csvContent = "رقم المعاملة,التاريخ والوقت,المنتجات المباعة,إجمالي المبيعات,صافي الفائدة,المبلغ المستلم,الباقي المسترجع\n";

    appState.transactions.forEach(t => {

        const dateStr = new Date(t.timestamp).toLocaleString('ar-DZ').replace(/,/g, '');

        const itemsStr = t.items.map(item => `${item.name} (${item.qty} ${item.unit})`).join(" | ");

        csvContent += `"${t.id}","${dateStr}","${itemsStr.replace(/"/g, '""')}",${t.total},${t.profit},${t.received},${t.change}\n`;

    });

    const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), csvContent], { type: "text/csv;charset=utf-8;" });

    const link = document.createElement("a");

    const dateStr = new Date().toLocaleDateString('ar-DZ').replace(/\//g, '-');

    link.href = URL.createObjectURL(blob);

    link.setAttribute("download", `سجل_مبيعات_${appState.storeSettings.name.replace(/\s+/g, '_')}_${dateStr}.csv`);

    document.body.appendChild(link);

    link.click();

    document.body.removeChild(link);

}

// 17. وضع الشاشة الكاملة (Fullscreen Mode Logic - Mobile & iOS Compatible)

let isSimulatedFs = false;

function simulateFullscreen(active) {
    isSimulatedFs = active;
    if (active) {
        document.body.classList.add("simulated-fullscreen");
        updateFullscreenButton(true);
    } else {
        document.body.classList.remove("simulated-fullscreen");
        updateFullscreenButton(false);
    }
}

function toggleFullScreen() {
    const docEl = document.documentElement;
    const doc = document;

    const requestFS = docEl.requestFullscreen || 
                      docEl.mozRequestFullScreen || 
                      docEl.webkitRequestFullscreen || 
                      docEl.msRequestFullscreen;

    const exitFS = doc.exitFullscreen || 
                   doc.mozCancelFullScreen || 
                   doc.webkitExitFullscreen || 
                   doc.msExitFullscreen;

    const fsElement = doc.fullscreenElement || 
                      doc.mozFullScreenElement || 
                      doc.webkitFullscreenElement || 
                      doc.msFullscreenElement;

    if (isSimulatedFs) {
        simulateFullscreen(false);
        return;
    }

    if (!fsElement) {
        if (requestFS) {
            requestFS.call(docEl).then(() => {
                updateFullscreenButton(true);
            }).catch(err => {
                simulateFullscreen(true);
            });
        } else {
            simulateFullscreen(true);
        }
    } else {
        if (exitFS) {
            exitFS.call(doc).then(() => {
                updateFullscreenButton(false);
            }).catch(err => {
                simulateFullscreen(false);
            });
        } else {
            simulateFullscreen(false);
        }
    }
}

function updateFullscreenButton(isFull) {
    const btn = document.getElementById("btn-fullscreen-toggle");
    if (!btn) return;
    const span = btn.querySelector("span");
    const icon = btn.querySelector("i");
    if (isFull) {
        if (span) span.innerText = "شاشة عادية";
        if (icon) icon.className = "fa-solid fa-compress";
    } else {
        if (span) span.innerText = "الشاشة الكاملة";
        if (icon) icon.className = "fa-solid fa-expand";
    }
}

function handleFsChange() {
    const doc = document;
    const fsElement = doc.fullscreenElement || 
                      doc.mozFullScreenElement || 
                      doc.webkitFullscreenElement || 
                      doc.msFullscreenElement;
    if (fsElement) {
        updateFullscreenButton(true);
    } else {
        updateFullscreenButton(false);
    }
}

document.addEventListener("fullscreenchange", handleFsChange);
document.addEventListener("webkitfullscreenchange", handleFsChange);
document.addEventListener("mozfullscreenchange", handleFsChange);
document.addEventListener("MSFullscreenChange", handleFsChange);


// 18. وظائف النظام التجاري المتقدم (الحسابات، الصلاحيات، والنسخ الاحتياطي)

// ==========================================================================

// تعبئة وتهيئة حقل اسم المستخدم في شاشة تسجيل الدخول

function renderLoginDropdown() {

    const usernameInput = document.getElementById("login-username");

    if (usernameInput) {

        usernameInput.value = "";

    }

}

// تطبيق الصلاحيات والتحكم برؤية الشاشات حسب رتبة المستخدم

function applyUserPermissions(role) {

    const menuItems = document.querySelectorAll(".menu-item");

    const changeStoreBtn = document.getElementById("btn-change-store-type");

    const debtsSection = document.getElementById("admin-debts-management-section");

    const userSection = document.getElementById("admin-user-management-section");

    const dbSection = document.getElementById("admin-database-management-section");

    // تم السماح للجميع بعرض كافة التبويبات للتجربة وتلافي تجميد الأزرار

    menuItems.forEach(item => {

        item.style.display = "flex";

    });

    if (changeStoreBtn) changeStoreBtn.style.display = "flex";

    if (debtsSection) debtsSection.style.display = "block";

    if (userSection) userSection.style.display = "block";

    if (dbSection) dbSection.style.display = "block";

    console.log("تم تفعيل وعرض كافة التبويبات لجميع الحسابات بنجاح.");

}

// تصدير النسخة الاحتياطية الكاملة للمحل كملف JSON خارجي

function exportDatabaseBackup() {
    // تجهيز كائن البيانات الموحد للنسخة الاحتياطية
    const backupData = {
        storeSettings: appState.storeSettings,
        products: appState.products,
        transactions: appState.transactions,
        debts: appState.debts || [],
        supplierDebts: appState.supplierDebts || [],
        users: appState.users
    };
    
    const jsonString = JSON.stringify(backupData, null, 2);
    
    // إنشاء رابط التنزيل بالمتصفح
    const blob = new Blob([jsonString], { type: "application/json" });
    const link = document.createElement("a");
    const dateStr = new Date().toLocaleDateString('ar-DZ').replace(/\//g, '-');
    const fileName = `نسخة_احتياطية_${appState.storeSettings.name.replace(/\s+/g, '_')}_${dateStr}.json`;
    
    link.href = URL.createObjectURL(blob);
    link.setAttribute("download", fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    alert("✅ تم تصدير النسخة الاحتياطية بنجاح! احتفظ بهذا الملف لنقل بيانات المحل إلى أي كمبيوتر آخر.");
}

// استيراد النسخة الاحتياطية الخارجية وتطبيقها فورياً
function importDatabaseBackup(file) {
    const reader = new FileReader();
    
    reader.onload = function(e) {
        try {
            const importedState = JSON.parse(e.target.result);
            
            // التحقق من سلامة وصحة الملف المستورد وهيكله
            if (importedState && importedState.storeSettings && importedState.products && importedState.transactions) {
                
                const confirmImport = confirm("⚠️ تحذير! سيؤدي استيراد هذا الملف لمسح كافة السلع والمبيعات الحالية واستبدالها بالكامل ببيانات الملف المستورد. هل أنت متأكد من المتابعة؟");
                if (confirmImport) {
                    // تطبيق البيانات الجديدة
                    appState.storeSettings = importedState.storeSettings;
                    appState.products = importedState.products;
                    appState.transactions = importedState.transactions;
                    appState.debts = importedState.debts || [];
                    appState.supplierDebts = importedState.supplierDebts || [];
                    appState.users = importedState.users || [
                        { id: "admin", displayName: "المدير العام", username: "admin", password: "admin", role: "admin" }
                    ];
                    
                    // تسجيل الخروج التلقائي لضمان تطبيق الصلاحيات بشكل آمن
                    appState.currentUser = null;
                    appState.cart = [];
                    appState.activeTab = "dashboard";
                    
                    saveToLocalStorage();
                    
                    alert("✅ تم استيراد نسخة البيانات الاحتياطية بنجاح! سيتم الآن إعادة تشغيل وتحديث التطبيق.");
                    window.location.reload();
                }
            } else {
                alert("❌ خطأ: ملف النسخة الاحتياطية غير متوافق أو تالف!");
            }
        } catch (err) {
            alert("❌ خطأ أثناء قراءة الملف، يرجى التأكد من اختيار ملف احتياطي صالح بصيغة .json!");
            console.error("فشل استيراد قاعدة البيانات", err);
        }
    };
    
    reader.readAsText(file);
}

// إدارة وعرض جدول مستخدمي المبيعات (نقاط البيع) لمدير النظام
function renderUsersTable() {
    const tbody = document.getElementById("users-table-tbody");
    if (!tbody) return;
    
    // تحديث لوحة شرف موظف الأسبوع
    updateEmployeeOfTheWeekUI();
    
    tbody.innerHTML = appState.users.map(user => {
        const isAdmin = user.role === "admin";
        
        // إعداد أزرار التحكم وحجب الحذف عن المدير العام
        let actionButtons = "";
        if (isAdmin) {
            actionButtons = `
                <button class="btn-action-circle edit" onclick="editUserAccount('${user.id}')" title="تغيير كلمة مرور المدير">
                    <i class="fa-solid fa-key"></i>
                </button>
                <span class="text-muted" style="font-size:0.75rem;">(حساب محمي)</span>
            `;
        } else {
            actionButtons = `
                <button class="btn-action-circle edit" onclick="editUserAccount('${user.id}')" title="تعديل حساب الموظف">
                    <i class="fa-solid fa-pen"></i>
                </button>
                <button class="btn-action-circle delete" onclick="deleteUserAccount('${user.id}')" title="حذف الحساب نهائياً">
                    <i class="fa-solid fa-trash-can"></i>
                </button>
            `;
        }
        
        return `
            <tr>
                <td class="font-weight-bold"><i class="fa-solid ${isAdmin ? 'fa-user-tie text-info' : 'fa-user text-success'}"></i> ${user.displayName}</td>
                <td class="font-weight-bold text-muted">${user.username}</td>
                <td>
                    <span class="stock-status-pill ${isAdmin ? 'success' : 'warning'}">
                        ${isAdmin ? 'المدير العام (Owner)' : 'كاشير (POS Cashier)'}
                    </span>
                </td>
                <td>${actionButtons}</td>
            </tr>
        `;
    }).join("");
}

// حفظ أو تعديل حساب كاشير
function saveUserAccount() {
    const id = document.getElementById("user-id").value;
    const displayName = document.getElementById("user-display-name").value.trim();
    const username = document.getElementById("user-username").value.trim().toLowerCase();
    const password = document.getElementById("user-password").value.trim();
    const canOverridePrice = document.getElementById("user-can-override-price").checked;
    
    if (displayName === "" || username === "" || password === "") {
        alert("يرجى ملء جميع الحقول المطلوبة بشكل صحيح!");
        return;
    }
    
    // التحقق من تعارض اسم المستخدم مع حساب الآخر مسجل
    const duplicate = appState.users.find(u => u.username === username && u.id !== id);
    if (duplicate) {
        alert(`⚠️ اسم المستخدم [ ${username} ] مستخدم بالفعل لحساب موظف آخر! يرجى اختيار اسم مستخدم فريد.`);
        return;
    }
    
    if (id && id !== "") {
        // وضع التعديل
        const index = appState.users.findIndex(u => u.id === id);
        if (index !== -1) {
            // الحفاظ على رتبة الحساب الأصلية وتعديل البيانات الأخرى
            const originalRole = appState.users[index].role;
            appState.users[index] = { id, displayName, username, password, role: originalRole, canOverridePrice };
            alert("تم تعديل حساب الموظف وتحديث كلمة المرور بنجاح!");
        }
    } else {
        // وضع الإضافة لـ كاشير جديد
        const newUser = {
            id: "US-" + Date.now().toString(16).toUpperCase(),
            displayName,
            username,
            password,
            role: "cashier", // الإضافة الافتراضية للكاشير
            canOverridePrice
        };
        appState.users.push(newUser);
        alert("تم إنشاء حساب الكاشير ونقطة البيع الجديدة بنجاح!");
    }
    
    saveToLocalStorage();
    resetUserForm();
    refreshUI();
}

// تحميل بيانات الحساب للنموذج لتعديله
window.editUserAccount = function(id) {
    const user = appState.users.find(u => u.id === id);
    if (!user) return;
    
    document.getElementById("add-user-form-container").classList.remove("hidden");
    document.getElementById("user-form-title").innerText = user.role === 'admin' ? "تغيير بيانات وكلمة مرور المدير العام" : "تعديل حساب موظف المبيعات";
    
    document.getElementById("user-id").value = user.id;
    document.getElementById("user-display-name").value = user.displayName;
    document.getElementById("user-username").value = user.username;
    
    // لزيادة الحماية
    if (user.role === 'admin') {
        document.getElementById("user-username").setAttribute("disabled", "true"); // منع تغيير الـ username للمدير الافتراضي
        const overrideContainer = document.getElementById("user-can-override-price-container");
        if (overrideContainer) overrideContainer.classList.add("hidden");
    } else {
        document.getElementById("user-username").removeAttribute("disabled");
        const overrideContainer = document.getElementById("user-can-override-price-container");
        if (overrideContainer) overrideContainer.classList.remove("hidden");
    }
    
    document.getElementById("user-can-override-price").checked = !!user.canOverridePrice;
    document.getElementById("user-password").value = user.password;
    document.getElementById("user-password").focus();
    
    // تمرير الشاشة للنموذج
    document.getElementById("add-user-form-container").scrollIntoView({ behavior: 'smooth' });
};

// حذف حساب كاشير
window.deleteUserAccount = function(id) {
    const user = appState.users.find(u => u.id === id);
    if (!user) return;
    
    if (user.role === "admin") {
        alert("🚨 خطأ أمني: لا يمكن حذف حساب المدير العام الأساسي للنظام!");
        return;
    }
    
    const confirmDelete = confirm(`🚨 هل أنت متأكد من حذف حساب الكاشير: [ ${user.displayName} ] نهائياً؟ لن يتمكن من تسجيل الدخول للبيع بعد الآن!`);
    if (confirmDelete) {
        appState.users = appState.users.filter(u => u.id !== id);
        
        saveToLocalStorage();
        refreshUI();
        alert("تم حذف حساب الموظف بنجاح!");
    }
};

// تصفير نموذج الحسابات وإخفائه
function resetUserForm() {
    document.getElementById("user-form-title").innerText = "إضافة حساب كاشير جديد";
    document.getElementById("user-id").value = "";
    document.getElementById("user-username").removeAttribute("disabled");
    document.getElementById("user-creation-form").reset();
    document.getElementById("user-can-override-price").checked = false;
    const overrideContainer = document.getElementById("user-can-override-price-container");
    if (overrideContainer) overrideContainer.classList.remove("hidden");
    document.getElementById("add-user-form-container").classList.add("hidden");
}

// 19. وظائف إضافية لنافذة إدخال الكميات اللمسية السريعة
window.setQuickQtyValue = function(val) {
    const input = document.getElementById("quick-qty-input");
    if (input) {
        input.value = val;
    }
};

window.changeQuickQtyValueBy = function(val) {
    const input = document.getElementById("quick-qty-input");
    if (input) {
        let current = parseInt(input.value) || 1;
        current = Math.max(1, current + val);
        input.value = current;
    }
};

// 20. التأكد من وجود المواد السريعة بدون باركود في المخزن
function ensureQuickSellProductsExist() {
    // جلب قائمة المنتجات التي حذفها المستخدم يدوياً لمنع إعادتها
    let userDeletedIds = [];
    try {
        userDeletedIds = JSON.parse(localStorage.getItem('smart_shop_deleted_ids') || '[]');
    } catch(e) { userDeletedIds = []; }

    const quickProducts = [
        { id: "PR-QUICK-CANDY", barcode: "quick-candy", name: "حلوى فردي", buyPrice: 5, sellPrice: 10, qty: 999, unit: "قطعة", category: "بيع سريع", promoQty: 0, promoPrice: 0, isQuickSell: true, emoji: "🍬" },
        { id: "PR-QUICK-GUM", barcode: "quick-gum", name: "علبة علكة", buyPrice: 30, sellPrice: 50, qty: 999, unit: "قطعة", category: "بيع سريع", promoQty: 0, promoPrice: 0, isQuickSell: true, emoji: "🍬" },
        { id: "PR-QUICK-RYM", barcode: "quick-rym", name: "سيجارة RYM", buyPrice: 15, sellPrice: 20, qty: 999, unit: "قطعة", category: "بيع سريع", promoQty: 3, promoPrice: 50, isQuickSell: true, emoji: "🚬" },
        { id: "PR-QUICK-MARLBORO", barcode: "quick-marlboro", name: "سيجارة Marlboro", buyPrice: 28, sellPrice: 35, qty: 999, unit: "قطعة", category: "بيع سريع", promoQty: 0, promoPrice: 0, isQuickSell: true, emoji: "🚬" },
        { id: "PR-QUICK-BAG", barcode: "quick-bag", name: "كيس بلاستيكي", buyPrice: 5, sellPrice: 15, qty: 999, unit: "قطعة", category: "بيع سريع", promoQty: 0, promoPrice: 0, isQuickSell: true, emoji: "🛍️" },
        { id: "PR-QUICK-LIGHTER", barcode: "quick-lighter", name: "ولاعة غاز", buyPrice: 45, sellPrice: 70, qty: 999, unit: "قطعة", category: "بيع سريع", promoQty: 0, promoPrice: 0, isQuickSell: true, emoji: "🔥" },
        // سلع الفليكسي الافتراضية
        { id: "PR-FLEXY-DJEZZY", barcode: "flexy-djezzy", name: "فليكسي جيزي Djezzy", buyPrice: 95, sellPrice: 100, qty: 9999, unit: "قطعة", category: "فليكسي وتعبئة", promoQty: 0, promoPrice: 0, isQuickSell: true, emoji: "📱" },
        { id: "PR-FLEXY-MOBILIS", barcode: "flexy-mobilis", name: "فليكسي موبيليس Mobilis", buyPrice: 95, sellPrice: 100, qty: 9999, unit: "قطعة", category: "فليكسي وتعبئة", promoQty: 0, promoPrice: 0, isQuickSell: true, emoji: "📱" },
        { id: "PR-FLEXY-OOREDOO", barcode: "flexy-ooredoo", name: "فليكسي أوريدو Ooredoo", buyPrice: 95, sellPrice: 100, qty: 9999, unit: "قطعة", category: "فليكسي وتعبئة", promoQty: 0, promoPrice: 0, isQuickSell: true, emoji: "📱" }
    ];

    let updated = false;
    quickProducts.forEach(qp => {
        // فحص إذا حذف المستخدم هذا المنتج ولا تعد إضافته
        if (userDeletedIds.includes(qp.id)) return;
        const exists = appState.products.some(p => p.id === qp.id);
        if (!exists) {
            appState.products.push(qp);
            updated = true;
        }
    });

    if (updated) {
        saveToLocalStorage();
    }
}

// دالة لتوفير أيقونة بديلة ذكية وفخمة لمنتجات البيع السريع لضمان ظهورها في كل الحواسيب (حتى لو وندوز 7)

function getProductIconHTML(p) {

    const emojiMap = {

        "ًںچ¬": '<i class="fa-solid fa-candy-cane"></i>',

        "ًںڑ¬": '<i class="fa-solid fa-smoking"></i>',

        "ًں›چï¸ڈ": '<i class="fa-solid fa-bag-shopping"></i>',

        "ًں”¥": '<i class="fa-solid fa-fire"></i>',

        "ًں“±": '<i class="fa-solid fa-mobile-screen-button"></i>',

        "ًں“¦": '<i class="fa-solid fa-box"></i>',

        "ًںچژ": '<i class="fa-solid fa-apple-whole"></i>',

        "ًں¥•": '<i class="fa-solid fa-carrot"></i>',

        "ًں¥›": '<i class="fa-solid fa-glass-water"></i>',

        "ًں¥«": '<i class="fa-solid fa-jar"></i>'

    };

    const emoji = p.emoji || "ًں“¦";

    if (emojiMap[emoji]) {

        return emojiMap[emoji];

    }

    // محاولة التعرف الذكي من الاسم إذا لم تكن الأيقونة في القائمة

    const name = (p.name || "").toLowerCase();

    if (name.includes("سجائر") || name.includes("سيجارة") || name.includes("rym") || name.includes("marlboro") || name.includes("سيكار")) {

        return '<i class="fa-solid fa-smoking"></i>';

    }

    if (name.includes("حلوى") || name.includes("علكة") || name.includes("حلوه") || name.includes("مصاصة") || name.includes("شيبس")) {

        return '<i class="fa-solid fa-candy-cane"></i>';

    }

    if (name.includes("فليكسي") || name.includes("تعبئة") || name.includes("شحن") || name.includes("djezzy") || name.includes("mobilis") || name.includes("ooredoo")) {

        return '<i class="fa-solid fa-mobile-screen-button"></i>';

    }

    if (name.includes("كيس") || name.includes("أكياس") || name.includes("sachet") || name.includes("حقيبة")) {

        return '<i class="fa-solid fa-bag-shopping"></i>';

    }

    if (name.includes("ولاعة") || name.includes("نار") || name.includes("briquet") || name.includes("غاز")) {

        return '<i class="fa-solid fa-fire"></i>';

    }

    return '<i class="fa-solid fa-box"></i>';

}

// 21. بناء وتحديث أزرار البيع السريع والبحث اللحظي ديناميكياً (مرتبة حسب الأكثر مبيعاً)

function renderPosQuickShortcuts() {

    const shortcutsGrid = document.getElementById("pos-quick-shortcuts-grid");

    if (!shortcutsGrid) return;

    const searchInput = document.getElementById("pos-search-input");

    const searchQuery = searchInput ? searchInput.value.toLowerCase().trim() : "";

    // حساب حجم المبيعات الإجمالي لكل منتج من سجل المعاملات لتحديد السلع الأكثر مبيعاً ديناميكياً

    const salesCounts = {};

    if (appState.transactions) {

        appState.transactions.forEach(t => {

            if (t.items) {

                t.items.forEach(item => {

                    salesCounts[item.productId] = (salesCounts[item.productId] || 0) + item.qty;

                });

            }

        });

    }

    let displayedProducts = [];

    let isSearching = searchQuery !== "";

    if (isSearching) {

        // عند البحث: تصفية كل سلع المتجر ديناميكياً طبقاً للاسم أو الباركود أو الفئة

        displayedProducts = appState.products.filter(p => 

            !p.isCustomItem && (

            p.name.toLowerCase().includes(searchQuery) || 

            (p.category && p.category.toLowerCase().includes(searchQuery)) ||

            (p.barcode && p.barcode.includes(searchQuery))

        ));

        // ترتيب نتائج البحث حسب الأكثر مبيعاً أولاً

        displayedProducts.sort((a, b) => (salesCounts[b.id] || 0) - (salesCounts[a.id] || 0));

    } else {

        // عند عدم البحث: عرض سلع البيع السريع (بدون باركود) مرتبة تلقائياً طبقاً للأكثر مبيعاً

        displayedProducts = appState.products.filter(p => !p.isCustomItem && p.isQuickSell === true);

        if (displayedProducts.length === 0) {

            displayedProducts = appState.products.filter(p => !p.isCustomItem).slice(0, 18);

        }

        // ترتيب السلع تصاعدياً حسب الأكثر مبيعاً

        displayedProducts.sort((a, b) => (salesCounts[b.id] || 0) - (salesCounts[a.id] || 0));

    }

    if (displayedProducts.length > 0) {

        // قائمة ألوان عشوائية للأزرار لتظهر بمظهر غني واحترافي

        const accentColors = ["#ff9f1c", "#e1306c", "#e71d36", "#011627", "#2ec4b6", "#9c27b0", "#4caf50", "#0d6efd", "#ff5722", "#009688"];

        shortcutsGrid.innerHTML = displayedProducts.map((p, idx) => {

            const color = accentColors[idx % accentColors.length];

            return `

                <button class="btn-quick-item" data-id="${p.id}" onclick="onPosProductCardClick(this, '${p.id}')" style="--accent-btn: ${color}; cursor: pointer;">

                    <span class="icon">${getProductIconHTML(p)}</span>

                    <span class="name">${p.name}</span>

                </button>

            `;

        }).join("");

        // ربط الضغط على بطاقة السلعة السريعة

        shortcutsGrid.querySelectorAll(".btn-quick-item").forEach(btn => {

            btn.addEventListener("click", (e) => {

                e.stopPropagation();

                const prodId = btn.getAttribute("data-id");

                const product = appState.products.find(p => p.id === prodId);

                if (product) {

                    if (product.unit === "كيلوغرام" || product.unit === "كغ" || product.unit === "لتر") {

                        window.openQuickQtyModalForProduct(product);

                    } else {

                        if (typeof addProductToCartById === "function") {

                            addProductToCartById(product.id, 1);

                        }

                    }

                }

            });

            btn.addEventListener("dblclick", (e) => {

                e.stopPropagation();

                const prodId = btn.getAttribute("data-id");

                const product = appState.products.find(p => p.id === prodId);

                if (product) {

                    window.openQuickQtyModalForProduct(product);

                }

            });

            btn.addEventListener("mouseenter", () => {

                const prodId = btn.getAttribute("data-id");

                const product = appState.products.find(p => p.id === prodId);

                if (product) {

                    const infoEl = document.getElementById("quick-shortcut-hover-info");

                    if (infoEl) infoEl.innerText = `${product.name} - ${formatCurrency(product.sellPrice)}`;

                }

            });

            btn.addEventListener("mouseleave", () => {

                const infoEl = document.getElementById("quick-shortcut-hover-info");

                if (infoEl) infoEl.innerText = "مرر الفأرة فوق السلعة لمعاينة الاسم";

            });

        });

    } else {

        if (isSearching) {

            shortcutsGrid.innerHTML = `<div class="text-center text-muted" style="grid-column: 1/-1; padding: 20px 0; font-size: 0.82rem;">❌ لا توجد سلع مطابقة لبحثك في المتجر.</div>`;

        } else {

            shortcutsGrid.innerHTML = `<div class="text-center text-muted" style="grid-column: 1/-1; padding: 10px 0; font-size: 0.8rem;">لا توجد سلع سريعة مضافة حالياً. يمكنك تفعيل خيار "البيع السريع" لأي منتج من المخزن!</div>`;

        }

    }

}

// 22. وظائف تعليق واسترجاع السلات (الزبائن في الانتظار - F1)

window.holdCurrentCart = function() {

    if (appState.cart.length === 0) {

        alert("⚠️ لا يمكن تعليق سلة فارغة!");

        return;

    }

    if (!appState.heldCarts) appState.heldCarts = [];

    const held = {

        id: "HC-" + Date.now().toString(16).toUpperCase(),

        timestamp: new Date().toISOString(),

        cart: [...appState.cart],

        receivedAmount: document.getElementById("cart-received-amount").value

    };

    appState.heldCarts.push(held);

    appState.cart = [];

    appState.products = appState.products.filter(p => !p.isCustomItem);

    document.getElementById("cart-received-amount").value = "";

    saveToLocalStorage();

    refreshCartUI();

    playBeep();

    alert("📥 تم تعليق السلة الحالية بنجاح للزبون في الانتظار!");

};

window.resumeHeldCart = function(id) {

    if (!appState.heldCarts) appState.heldCarts = [];

    const index = appState.heldCarts.findIndex(hc => hc.id === id);

    if (index === -1) return;

    // إذا كانت السلة الحالية ممتلئة، نسأله إذا كان يريد تعليقها أولاً

    if (appState.cart.length > 0) {

        const action = confirm("⚠️ السلة الحالية ممتلئة بالسلع. هل تريد تعليق السلة الحالية أولاً قبل استرجاع السلة المعلقة؟ (موافق لتعليق الحالية، إلغاء لمسح الحالية واسترجاع المعلقة فوراً)");

        if (action) {

            // تعليق السلة الحالية

            const newHeld = {

                id: "HC-" + Date.now().toString(16).toUpperCase(),

                timestamp: new Date().toISOString(),

                cart: [...appState.cart],

                receivedAmount: document.getElementById("cart-received-amount").value

            };

            appState.heldCarts.push(newHeld);

        }

    }

    // استرجاع السلة المعلقة

    const held = appState.heldCarts[index];

    appState.cart = held.cart;

    document.getElementById("cart-received-amount").value = held.receivedAmount || "";

    // إزالة السلة المسترجعة من قائمة التعليق

    appState.heldCarts.splice(index, 1);

    playBeep();

    saveToLocalStorage();

    refreshCartUI();

};

// الدوال المساعدة لتعديل السلة بوجود أسعار مخصصة

window.changeCartItemQtyWithPrice = function(productId, direction, customPriceVal) {

    const customPrice = customPriceVal === undefined || customPriceVal === null || isNaN(customPriceVal) ? null : parseFloat(customPriceVal);

    const cartItem = appState.cart.find(item => item.productId === productId && item.customPrice === customPrice);

    if (!cartItem) return;

    if (direction === 1) {

        cartItem.qty++;

    } else {

        cartItem.qty--;

        if (cartItem.qty <= 0) {

            removeCartItemWithPrice(productId, customPrice);

            return;

        }

    }

    saveToLocalStorage();

    refreshCartUI();

};

window.removeCartItemWithPrice = function(productId, customPriceVal) {

    const customPrice = customPriceVal === undefined || customPriceVal === null || isNaN(customPriceVal) ? null : parseFloat(customPriceVal);

    appState.cart = appState.cart.filter(item => !(item.productId === productId && item.customPrice === customPrice));

    saveToLocalStorage();

    refreshCartUI();

};

// تصفية الدين (تسديد)

window.settleDebt = function(debtId) {

    const debt = appState.debts.find(d => d.id === debtId);

    if (!debt) return;

    const confirmSettle = confirm(`هل أنت متأكد من تصفية (تسديد) الدين المسجل باسم الزبون: [ ${debt.customerName} ] بقيمة: [ ${debt.amount} دج ]؟`);

    if (confirmSettle) {

        debt.status = "settled";

        // إدخال المعاملة في الأرباح اليومية

        const settleTransactionId = "TX-SETTLE-" + Date.now().toString(16).toUpperCase();

        const newTransaction = {

            id: settleTransactionId,

            timestamp: new Date().toISOString(),

            items: [{

                productId: "settle-debt",

                name: `تصفية دين الزبون: ${debt.customerName}`,

                qty: 1,

                buyPrice: 0,

                sellPrice: debt.amount,

                totalPrice: debt.amount,

                unit: "عملية"

            }],

            total: 0,

            profit: 0,

            received: debt.amount,

            change: 0,

            isSettle: true,

            debtId: debtId,

            processedBy: appState.currentUser ? appState.currentUser.displayName : "النظام"

        };

        appState.transactions.push(newTransaction);

        appState.debts = appState.debts.filter(d => d.id !== debtId); // حذف الدين النشط بعد تصفيتها

        saveToLocalStorage();

        refreshUI();

        showToast(`✅ تم تصفية دين الزبون ${debt.customerName} بنجاح وإدخال المبلغ للصندوق!`);

    }

};

// فتح نافذة تسديد الديون السريعة للزبائن من واجهة POS

function openQuickDebtSettleModal(amount) {

    const modal = document.getElementById("quick-debt-settle-modal");

    if (!modal) return;

    const amountDisp = document.getElementById("quick-debt-settle-amount-disp");

    if (amountDisp) amountDisp.innerText = formatCurrency(amount);

    const tbody = document.getElementById("quick-debt-settle-tbody");

    if (!tbody) return;

    if (!appState.debts) appState.debts = [];

    const activeDebts = appState.debts.filter(d => d.status !== "settled");

    if (activeDebts.length === 0) {

        tbody.innerHTML = `<tr><td colspan="3" class="text-center text-muted py-3">لا توجد ديون نشطة حالياً لتسديدها.</td></tr>`;

    } else {

        tbody.innerHTML = activeDebts.map(d => {

            return `

                <tr>

                    <td style="font-weight: 700; text-align: right; border-bottom: 1px solid var(--glass-border); padding: 8px;">${d.customerName}</td>

                    <td class="text-danger font-weight-bold" style="text-align: center; border-bottom: 1px solid var(--glass-border); padding: 8px;">${formatCurrency(d.amount)}</td>

                    <td style="text-align: left; border-bottom: 1px solid var(--glass-border); padding: 8px;">

                        <button class="btn-success" style="padding: 6px 12px; font-size: 0.8rem; cursor: pointer; border-radius: 6px; border: none; font-weight: 700; display: inline-flex; align-items: center; gap: 4px;" onclick="applyQuickDebtSettle('${d.id}', ${amount})">

                            <i class="fa-solid fa-check"></i> تطبيق

                        </button>

                    </td>

                </tr>

            `;

        }).join("");

    }

    modal.classList.remove("hidden");

}

window.applyQuickDebtSettle = function(debtId, amount) {

    const debt = appState.debts.find(d => d.id === debtId);

    if (!debt) return;

    const modal = document.getElementById("quick-debt-settle-modal");

    if (amount >= debt.amount) {

        // تسديد كامل الدين

        const change = amount - debt.amount;

        debt.status = "settled";

        const settleTransactionId = "TX-SETTLE-" + Date.now().toString(16).toUpperCase();

        appState.transactions.push({

            id: settleTransactionId,

            timestamp: new Date().toISOString(),

            items: [{

                productId: "settle-debt",

                name: `تصفية دين الزبون: ${debt.customerName} (كامل)`,

                qty: 1,

                buyPrice: 0,

                sellPrice: debt.amount,

                totalPrice: debt.amount,

                unit: "عملية"

            }],

            total: 0,

            profit: 0,

            received: debt.amount,

            change: 0,

            isSettle: true,

            debtId: debtId,

            processedBy: appState.currentUser ? appState.currentUser.displayName : "النظام"

        });

        appState.debts = appState.debts.filter(d => d.id !== debtId);

        saveToLocalStorage();

        refreshUI();

        if (modal) modal.classList.add("hidden");

        document.getElementById("cart-received-amount").value = "";

        if (change > 0) {

            alert(`✅ تم تسديد كامل دين الزبون [ ${debt.customerName} ] بنجاح!\nالمستلم: ${formatCurrency(amount)}\nالدين المصفى: ${formatCurrency(debt.amount)}\nالباقي للزبون: ${formatCurrency(change)}`);

        } else {

            showToast(`✅ تم تسديد كامل دين [ ${debt.customerName} ] بنجاح!`);

        }

    } else {

        // تسديد جزئي للدين

        const remainingDebt = debt.amount - amount;

        debt.amount = parseFloat(remainingDebt.toFixed(2));

        const settleTransactionId = "TX-SETTLE-" + Date.now().toString(16).toUpperCase();

        appState.transactions.push({

            id: settleTransactionId,

            timestamp: new Date().toISOString(),

            items: [{

                productId: "settle-debt-partial",

                name: `تصفية جزئية لدين الزبون: ${debt.customerName}`,

                qty: 1,

                buyPrice: 0,

                sellPrice: amount,

                totalPrice: amount,

                unit: "عملية"

            }],

            total: 0,

            profit: 0,

            received: amount,

            change: 0,

            isSettle: true,

            debtId: debtId,

            processedBy: appState.currentUser ? appState.currentUser.displayName : "النظام"

        });

        saveToLocalStorage();

        refreshUI();

        if (modal) modal.classList.add("hidden");

        document.getElementById("cart-received-amount").value = "";

        alert(`✅ تم تسديد جزء من الدين للزبون [ ${debt.customerName} ] بنجاح!\nالمبلغ المستلم: ${formatCurrency(amount)}\nالدين المتبقي عليه: ${formatCurrency(remainingDebt)}`);

    }

};

// بناء وعرض جدول الديون النشطة للمدير

function renderDebtsTable() {

    const tbody = document.getElementById("debts-table-tbody");

    const totalSumEl = document.getElementById("debts-total-sum");

    if (!tbody) return;

    if (!appState.debts) appState.debts = [];

    const activeDebts = appState.debts.filter(d => d.status !== "settled");

    let totalDebtsSum = 0;

    activeDebts.forEach(d => totalDebtsSum += d.amount);

    if (totalSumEl) totalSumEl.innerText = formatCurrency(totalDebtsSum);

    if (activeDebts.length > 0) {

        tbody.innerHTML = activeDebts.map(d => {

            const date = new Date(d.timestamp);

            const dateStr = date.toLocaleString('ar-DZ', {

                year: 'numeric', month: 'short', day: 'numeric',

                hour: '2-digit', minute: '2-digit'

            });

            return `

                <tr>

                    <td class="font-weight-bold"><i class="fa-solid fa-user-tag text-warning"></i> ${d.customerName}</td>

                    <td>${dateStr}</td>

                    <td class="font-weight-bold text-info">#${d.transactionId.slice(-6).toUpperCase()}</td>

                    <td class="text-danger font-weight-bold" style="font-size: 1rem;">${formatCurrency(d.amount)}</td>

                    <td>

                        <button class="btn-success" style="padding: 6px 12px; font-size: 0.78rem; display: inline-flex; align-items: center; gap: 4px;" onclick="settleDebt('${d.id}')">

                            <i class="fa-solid fa-circle-check"></i> تصفية الدين

                        </button>

                    </td>

                </tr>

            `;

        }).join("");

    } else {

        tbody.innerHTML = `

            <tr>

                <td colspan="5" class="text-muted text-center py-4">

                    <i class="fa-solid fa-thumbs-up" style="font-size: 2rem; opacity: 0.3; display: block; margin-bottom: 8px;"></i>

                    لا توجد ديون مسجلة حالياً. الكل خالص!

                </td>

            </tr>

        `;

    }

}

function renderHeldCartsList() {

    const bar = document.getElementById("held-carts-bar");

    const list = document.getElementById("held-carts-list");

    if (!bar || !list) return;

    if (!appState.heldCarts) appState.heldCarts = [];

    if (appState.heldCarts.length > 0) {

        bar.classList.remove("hidden");

        list.innerHTML = appState.heldCarts.map((hc, index) => {

            const totalItems = hc.cart.reduce((sum, item) => sum + item.qty, 0);

            return `

                <button class="btn-held-cart-pill" onclick="resumeHeldCart('${hc.id}')" title="اضغط لاسترجاع سلة هذا الزبون">

                    <span>زبون ${index + 1} (${totalItems} قطع)</span>

                    <i class="fa-solid fa-arrow-rotate-left"></i>

                </button>

            `;

        }).join("");

    } else {

        bar.classList.add("hidden");

    }

}

// 23. فتح نافذة الكميات/المبالغ والفوكس الفوري وتحديد النصوص تلقائياً

window.openQuickQtyModalForProduct = function(product) {
    if (!product) return;
    window.currentQuickQtyProductId = product.id;
    window.quickQtyIsEditMode = false; // تصفير نمط التعديل الافتراضي عند الفتح العادي
    
    const modal = document.getElementById("quick-qty-modal");
    const nameEl = document.getElementById("quick-qty-product-name");
    const priceEl = document.getElementById("quick-qty-product-price");
    
    if (modal && nameEl && priceEl) {
        nameEl.innerText = product.name;
        priceEl.innerText = `السعر الفردي: ${formatCurrency(product.sellPrice)}`;
        
        const qtyInput = document.getElementById("quick-qty-input");
        if (qtyInput) {
            qtyInput.value = 1;
            // التركيز التلقائي وتحديد النص لسرعة الكتابة
            setTimeout(() => {
                qtyInput.focus();
                qtyInput.select();
            }, 80);
        }
        
        const amountInput = document.getElementById("quick-qty-amount-input");
        if (amountInput) amountInput.value = "";
        
        const priceInput = document.getElementById("quick-qty-price-input");
        if (priceInput) priceInput.value = product.sellPrice;
        
        if (typeof updateQuickQtyLiveTotal === "function") {
            updateQuickQtyLiveTotal(product, 1);
        }
        modal.classList.remove("hidden");
    } else {
        if (typeof addProductToCartById === "function") {
            addProductToCartById(product.id, 1);
        }
    }
};

// 24. تحديث وحساب السعر الحي التفاعلي في المودال

function updateQuickQtyLiveTotal(product, qty) {

    const liveTotalEl = document.getElementById("quick-qty-live-total");

    if (!liveTotalEl) return;

    if (isNaN(qty) || qty <= 0) {

        liveTotalEl.innerText = "إجمالي السعر: 0.00 دج";

        return;

    }

    const priceInput = document.getElementById("quick-qty-price-input");

    const customPrice = priceInput && priceInput.value !== "" ? parseFloat(priceInput.value) : null;

    let total;

    if (customPrice !== null && !isNaN(customPrice)) {

        total = customPrice * qty;

    } else {

        total = calculateItemPriceAndPromo(product, qty).total;

    }

    liveTotalEl.innerText = `إجمالي السعر: ${formatCurrency(total)}`;

}

// 25. إشعار منبثق ذكي وسريع (Toast Notification) يختفي تلقائياً دون تعطيل الكاشير

function showToast(message) {

    const existing = document.querySelector(".toast-notification");

    if (existing) existing.remove();

    const toast = document.createElement("div");

    toast.className = "toast-notification glass";

    toast.style.cssText = `

        position: fixed;

        bottom: 24px;

        right: 24px;

        background: var(--accent-gradient, linear-gradient(135deg, #0d6efd, #00c6ff));

        color: white;

        padding: 14px 28px;

        border-radius: 12px;

        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15);

        z-index: 10000;

        font-weight: 700;

        direction: rtl;

        font-family: 'Cairo', sans-serif;

        font-size: 0.95rem;

        display: flex;

        align-items: center;

        gap: 10px;

        pointer-events: none;

        border: 1px solid rgba(255, 255, 255, 0.2);

        animation: toastUp 0.35s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;

    `;

    const styleSheet = document.createElement("style");

    styleSheet.innerText = `

        @keyframes toastUp {

            from { transform: translateY(100px); opacity: 0; }

            to { transform: translateY(0); opacity: 1; }

        }

        @keyframes toastDown {

            from { transform: translateY(0); opacity: 1; }

            to { transform: translateY(100px); opacity: 0; }

        }

    `;

    document.head.appendChild(styleSheet);

    toast.innerHTML = `<i class="fa-solid fa-circle-check" style="font-size: 1.25rem;"></i> <span>${message}</span>`;

    document.body.appendChild(toast);

    setTimeout(() => {

        toast.style.animation = "toastDown 0.3s ease-in forwards";

        setTimeout(() => {

            toast.remove();

            styleSheet.remove();

        }, 300);

    }, 2500);

}

// ==========================================

// منطق مساعد وصل الشراء (Bon d'Achat Assistant)

// ==========================================

const bonAchatState = {

    zoomLevel: 1,

    rotationAngle: 0,

    addedProducts: [],

    isDragging: false,

    startX: 0,

    startY: 0,

    scrollLeft: 0,

    scrollTop: 0

};

function setupBonAchatListeners() {

    const btnOpen = document.getElementById("btn-open-bon-achat");

    const btnClose = document.getElementById("btn-close-bon-achat");

    const modal = document.getElementById("bon-achat-modal");

    if (!modal) return;

    // فتح المساعد

    if (btnOpen) {

        btnOpen.addEventListener("click", () => {

            modal.classList.remove("hidden");

            updateBonAchatDatalists();

            resetBonForm();

            bonAchatState.addedProducts = [];

            renderBonAddedList();

        });

    }

    // إغلاق المساعد

    if (btnClose) {

        btnClose.addEventListener("click", () => {

            modal.classList.add("hidden");

        });

    }

    // رفع ومعالجة صورة الوصل

    const inputBonFile = document.getElementById("input-bon-file");

    const bonUploadZone = document.getElementById("bon-upload-zone");

    const bonImgPreviewContainer = document.getElementById("bon-image-preview-container");

    const bonImgPreview = document.getElementById("bon-image-preview");

    if (inputBonFile) {

        inputBonFile.addEventListener("change", (e) => {

            handleBonFileSelect(e);

        });

    }

    if (bonUploadZone) {

        // السحب والإفلات

        bonUploadZone.addEventListener("dragover", (e) => {

            e.preventDefault();

            bonUploadZone.style.borderColor = "var(--color-success)";

            bonUploadZone.style.background = "rgba(46, 196, 182, 0.05)";

        });

        bonUploadZone.addEventListener("dragleave", () => {

            bonUploadZone.style.borderColor = "";

            bonUploadZone.style.background = "";

        });

        bonUploadZone.addEventListener("drop", (e) => {

            e.preventDefault();

            bonUploadZone.style.borderColor = "";

            bonUploadZone.style.background = "";

            handleBonFileSelect(e);

        });

    }

    function handleBonFileSelect(e) {

        const file = (e.target.files && e.target.files[0]) || (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0]);

        if (file && file.type.startsWith("image/")) {

            const reader = new FileReader();

            reader.onload = function(evt) {

                if (bonImgPreview) {

                    bonImgPreview.src = evt.target.result;

                }

                if (bonUploadZone) bonUploadZone.classList.add("hidden");

                if (bonImgPreviewContainer) bonImgPreviewContainer.classList.remove("hidden");

                resetBonImageTransform();

                showToast("📸 تم تحميل وتجهيز صورة الوصل بنجاح!");

            };

            reader.readAsDataURL(file);

        } else if (file) {

            alert("⚠️ يرجى اختيار ملف صورة صالح (JPG, PNG, WEBP)!");

        }

    }

    // أزرار التحكم بالصورة

    const btnZoomIn = document.getElementById("btn-bon-zoom-in");

    const btnZoomOut = document.getElementById("btn-bon-zoom-out");

    const btnRotate = document.getElementById("btn-bon-rotate");

    const btnZoomReset = document.getElementById("btn-bon-zoom-reset");

    const btnClearImg = document.getElementById("btn-bon-clear");

    if (btnZoomIn) {

        btnZoomIn.addEventListener("click", () => {

            bonAchatState.zoomLevel += 0.2;

            updateBonImageTransform();

        });

    }

    if (btnZoomOut) {

        btnZoomOut.addEventListener("click", () => {

            bonAchatState.zoomLevel = Math.max(0.2, bonAchatState.zoomLevel - 0.2);

            updateBonImageTransform();

        });

    }

    if (btnRotate) {

        btnRotate.addEventListener("click", () => {

            bonAchatState.rotationAngle = (bonAchatState.rotationAngle + 90) % 360;

            updateBonImageTransform();

        });

    }

    if (btnZoomReset) {

        btnZoomReset.addEventListener("click", () => {

            resetBonImageTransform();

        });

    }

    if (btnClearImg) {

        btnClearImg.addEventListener("click", () => {

            if (confirm("هل تريد إزالة صورة هذا الوصل والبدء من جديد؟")) {

                if (inputBonFile) inputBonFile.value = "";

                if (bonImgPreview) bonImgPreview.src = "";

                if (bonImgPreviewContainer) bonImgPreviewContainer.classList.add("hidden");

                if (bonUploadZone) bonUploadZone.classList.remove("hidden");

                resetBonImageTransform();

            }

        });

    }

    function updateBonImageTransform() {

        if (bonImgPreview) {

            bonImgPreview.style.transform = `scale(${bonAchatState.zoomLevel}) rotate(${bonAchatState.rotationAngle}deg)`;

        }

    }

    function resetBonImageTransform() {

        bonAchatState.zoomLevel = 1;

        bonAchatState.rotationAngle = 0;

        updateBonImageTransform();

        if (bonImgPreviewContainer) {

            bonImgPreviewContainer.scrollLeft = 0;

            bonImgPreviewContainer.scrollTop = 0;

        }

    }

    // سحب الصورة وتصفحها بالماوس (Panning)

    if (bonImgPreviewContainer && bonImgPreview) {

        bonImgPreview.style.cursor = "grab";

        bonImgPreview.addEventListener("mousedown", (e) => {

            e.preventDefault();

            bonAchatState.isDragging = true;

            bonAchatState.startX = e.pageX - bonImgPreviewContainer.offsetLeft;

            bonAchatState.startY = e.pageY - bonImgPreviewContainer.offsetTop;

            bonAchatState.scrollLeft = bonImgPreviewContainer.scrollLeft;

            bonAchatState.scrollTop = bonImgPreviewContainer.scrollTop;

            bonImgPreview.style.cursor = "grabbing";

        });

        document.addEventListener("mouseup", () => {

            bonAchatState.isDragging = false;

            if (bonImgPreview) bonImgPreview.style.cursor = "grab";

        });

        bonImgPreviewContainer.addEventListener("mousemove", (e) => {

            if (!bonAchatState.isDragging) return;

            e.preventDefault();

            const x = e.pageX - bonImgPreviewContainer.offsetLeft;

            const y = e.pageY - bonImgPreviewContainer.offsetTop;

            const walkX = (x - bonAchatState.startX) * 1.5;

            const walkY = (y - bonAchatState.startY) * 1.5;

            bonImgPreviewContainer.scrollLeft = bonAchatState.scrollLeft - walkX;

            bonImgPreviewContainer.scrollTop = bonAchatState.scrollTop - walkY;

        });

        // التكبير والتصغير بعجلة الماوس

        bonImgPreviewContainer.addEventListener("wheel", (e) => {

            if (e.ctrlKey) {

                e.preventDefault();

                if (e.deltaY < 0) {

                    bonAchatState.zoomLevel += 0.1;

                } else {

                    bonAchatState.zoomLevel = Math.max(0.2, bonAchatState.zoomLevel - 0.1);

                }

                updateBonImageTransform();

            }

        }, { passive: false });

    }

    // ميزة الإكمال التلقائي الذكي للسلع المسجلة

    const bonProdName = document.getElementById("bon-prod-name");

    if (bonProdName) {

        bonProdName.addEventListener("input", (e) => {

            const val = e.target.value.trim();

            if (!val) return;

            const match = appState.products.find(p => p.name.toLowerCase() === val.toLowerCase());

            if (match) {

                document.getElementById("bon-prod-barcode").value = match.barcode || "";

                document.getElementById("bon-prod-buy-price").value = match.buyPrice || "";

                document.getElementById("bon-prod-sell-price").value = match.sellPrice || "";

                document.getElementById("bon-prod-unit").value = match.unit || "قطعة";

                document.getElementById("bon-prod-category").value = match.category || "";

                document.getElementById("bon-prod-emoji").value = match.emoji || "ًں“¦";

                document.getElementById("bon-prod-is-quick-sell").checked = !!match.isQuickSell;

                // وميض تأكيدي أخضر

                const glowIds = ["bon-prod-barcode", "bon-prod-buy-price", "bon-prod-sell-price", "bon-prod-unit", "bon-prod-category", "bon-prod-emoji"];

                glowIds.forEach(id => {

                    const el = document.getElementById(id);

                    if (el) {

                        el.style.boxShadow = "0 0 8px rgba(46, 196, 182, 0.45)";

                        el.style.borderColor = "var(--color-success)";

                        setTimeout(() => {

                            el.style.boxShadow = "";

                            el.style.borderColor = "";

                        }, 800);

                    }

                });

                showToast(`ℹ️ تم التعرف على السلعة: "${match.name}"، وتعبئة بياناتها السابقة.`);

            }

        });

    }

    // توليد باركود تلقائي بالوصل

    const btnGenBarcode = document.getElementById("btn-bon-gen-barcode");

    if (btnGenBarcode) {

        btnGenBarcode.addEventListener("click", () => {

            document.getElementById("bon-prod-barcode").value = "BON" + Date.now();

            showToast("✔️ تم توليد باركود تلقائي فريد للسلعة!");

        });

    }

    // تصفير قائمة الجلسة

    const btnClearList = document.getElementById("btn-bon-clear-list");

    if (btnClearList) {

        btnClearList.addEventListener("click", () => {

            if (confirm("هل تريد تصفير وإفراغ قائمة المشتريات المدخلة حالياً بالوصل؟")) {

                bonAchatState.addedProducts = [];

                renderBonAddedList();

            }

        });

    }

    // معالجة نموذج إدخال المشتريات بالوصل

    const form = document.getElementById("bon-product-form");

    if (form) {

        form.addEventListener("submit", (e) => {

            e.preventDefault();

            const name = document.getElementById("bon-prod-name").value.trim();

            let barcode = document.getElementById("bon-prod-barcode").value.trim();

            const buyPrice = parseFloat(document.getElementById("bon-prod-buy-price").value) || 0;

            const sellPrice = parseFloat(document.getElementById("bon-prod-sell-price").value) || 0;

            const qty = parseFloat(document.getElementById("bon-prod-qty").value) || 0;

            const unit = document.getElementById("bon-prod-unit").value;

            const category = document.getElementById("bon-prod-category").value.trim() || "غير مصنف";

            const emoji = document.getElementById("bon-prod-emoji").value.trim() || "ًں“¦";

            const isQuickSell = document.getElementById("bon-prod-is-quick-sell").checked;

            if (name === "" || buyPrice <= 0 || sellPrice <= 0 || qty <= 0) {

                alert("⚠️ يرجى تعبئة كافة الحقول الإلزامية بنسب وقيم صحيحة!");

                return;

            }

            // إذا كان الباركود فارغاً نولده تلقائياً

            if (!barcode) {

                barcode = "BON" + Date.now();

            }

            // التحقق من وجود السلعة مسبقاً (عن طريق الباركود أو الاسم)

            let existing = appState.products.find(p => p.barcode === barcode || p.name.toLowerCase() === name.toLowerCase());

            if (existing) {

                // تحديث السلعة الحالية بجمع الكمية وتحديث الأسعار

                existing.qty += qty;

                existing.buyPrice = buyPrice;

                existing.sellPrice = sellPrice;

                existing.category = category;

                existing.emoji = emoji;

                existing.isQuickSell = isQuickSell;

                existing.unit = unit;

            } else {

                // إدراج سلعة جديدة كلياً

                const newProd = {

                    id: "p" + Date.now(),

                    barcode: barcode,

                    name: name,

                    buyPrice: buyPrice,

                    sellPrice: sellPrice,

                    qty: qty,

                    unit: unit,

                    category: category,

                    emoji: emoji,

                    isQuickSell: isQuickSell

                };

                appState.products.push(newProd);

            }

            // حفظ التغييرات وتحديث قواعد البيانات

            saveToLocalStorage();

            // إضافة السلعة إلى قائمة الإحصاء الفوري لوصل المشتريات الحالي

            bonAchatState.addedProducts.push({

                id: barcode,

                name: name,

                buyPrice: buyPrice,

                qty: qty,

                total: buyPrice * qty

            });

            // تحديث شاشات التطبيق فوراً

            renderInventoryTable();

            renderPopularItems();

            updateDashboardStats();

            renderQuickShortcuts();

            updateCategoryDatalist();

            updateBonAchatDatalists();

            // إعادة عرض قائمة السلع المدخلة للمدير

            renderBonAddedList();

            // وميض تأكيدي على الجدول

            const tbody = document.getElementById("bon-added-tbody");

            if (tbody) {

                tbody.style.backgroundColor = "rgba(46, 196, 182, 0.08)";

                setTimeout(() => tbody.style.backgroundColor = "", 600);

            }

            // تصفير وتهيئة الحقول، مع تركيز المؤشر فورا على الاسم للسلعة التالية!

            document.getElementById("bon-prod-name").value = "";

            document.getElementById("bon-prod-barcode").value = "";

            document.getElementById("bon-prod-buy-price").value = "";

            document.getElementById("bon-prod-sell-price").value = "";

            document.getElementById("bon-prod-qty").value = "";

            document.getElementById("bon-prod-unit").value = "قطعة";

            document.getElementById("bon-prod-name").focus();

            showToast(`✔️ تم تسجيل وحفظ: "${name}" بنجاح!`);

        });

    }

}

function resetBonForm() {

    document.getElementById("bon-prod-name").value = "";

    document.getElementById("bon-prod-barcode").value = "";

    document.getElementById("bon-prod-buy-price").value = "";

    document.getElementById("bon-prod-sell-price").value = "";

    document.getElementById("bon-prod-qty").value = "";

    document.getElementById("bon-prod-unit").value = "قطعة";

    document.getElementById("bon-prod-category").value = "";

    document.getElementById("bon-prod-emoji").value = "ًں“¦";

    document.getElementById("bon-prod-is-quick-sell").checked = false;

}

function updateBonAchatDatalists() {

    // 1. تحديث قائمة السلع

    const prodList = document.getElementById("bon-products-datalist");

    if (prodList) {

        prodList.innerHTML = appState.products.map(p => `<option value="${p.name}"></option>`).join("");

    }

    // 2. تحديث قائمة الفئات

    const catList = document.getElementById("bon-categories-datalist");

    if (catList) {

        const uniqueCategories = [...new Set(appState.products.map(p => p.category).filter(c => c && c.trim() !== ""))];

        catList.innerHTML = uniqueCategories.map(c => `<option value="${c}"></option>`).join("");

    }

}

function renderBonAddedList() {

    const tbody = document.getElementById("bon-added-tbody");

    const countEl = document.getElementById("bon-added-count");

    const totalEl = document.getElementById("bon-added-total");

    if (!tbody) return;

    if (bonAchatState.addedProducts.length === 0) {

        tbody.innerHTML = `<tr><td colspan="5" class="text-muted text-center py-3" style="font-size: 0.85rem;">لم يتم تسجيل أي سلعة في هذا الوصل بعد.</td></tr>`;

        if (countEl) countEl.innerText = "0";

        if (totalEl) totalEl.innerText = "0.00 دج";

        return;

    }

    let totalSum = 0;

    tbody.innerHTML = bonAchatState.addedProducts.map((p, index) => {

        totalSum += p.total;

        return `

            <tr>

                <td style="font-size: 0.82rem; padding: 8px; font-weight: 700;">${p.name}</td>

                <td style="font-size: 0.82rem; padding: 8px; text-align: center;">${formatCurrency(p.buyPrice)}</td>

                <td style="font-size: 0.82rem; padding: 8px; text-align: center; font-weight: bold; color: var(--accent-color);">${p.qty}</td>

                <td style="font-size: 0.82rem; padding: 8px; text-align: center; font-weight: 800; color: var(--color-success);">${formatCurrency(p.total)}</td>

                <td style="font-size: 0.82rem; padding: 8px; text-align: center;">

                    <button type="button" class="btn-danger-xs" style="padding: 2px 6px; font-size: 0.7rem;" onclick="removeBonSessionItem(${index})" title="حذف من جلسة هذا الوصل">

                        <i class="fa-solid fa-trash-can"></i>

                    </button>

                </td>

            </tr>

        `;

    }).join("");

    if (countEl) countEl.innerText = bonAchatState.addedProducts.length.toString();

    if (totalEl) totalEl.innerText = formatCurrency(totalSum);

}

// دالة خارجية لحذف عنصر مسجل في الفاتورة فقط من عرض الجلسة

window.removeBonSessionItem = function(index) {

    if (confirm("هل أنت متأكد من حذف هذه السلعة من عرض جلسة الوصل الحالي؟\n(ملاحظة: السلعة ستبقى مسجلة في المخزن ولكن ستلغى من الفاتورة الحالية فقط)")) {

        bonAchatState.addedProducts.splice(index, 1);

        renderBonAddedList();

    }

};

// ==========================================

// منطق إدارة ديون ومستحقات الموزعين (Supplier Debts)

// ==========================================

function setupSupplierDebtsListeners() {

    // 1. المستمع للنموذج القديم

    const oldForm = document.getElementById("supplier-debt-form");

    if (oldForm) {

        oldForm.addEventListener("submit", (e) => {

            e.preventDefault();

            const name = document.getElementById("sup-debt-name").value.trim();

            const invoice = document.getElementById("sup-debt-invoice").value.trim() || "وصل شراء";

            const total = parseFloat(document.getElementById("sup-debt-total").value) || 0;

            const paid = parseFloat(document.getElementById("sup-debt-paid").value) || 0;

            const dueDateInput = document.getElementById("sup-debt-due-date").value;

            handleNewSupplierDebtSubmission(name, invoice, total, paid, dueDateInput, oldForm);

        });

    }

    // 2. المستمع للنموذج الجديد (الموردون بداخل لوحة التحكم)

    const newForm = document.getElementById("supplier-form");

    if (newForm) {

        newForm.addEventListener("submit", (e) => {

            e.preventDefault();

            const name = document.getElementById("supplier-name").value.trim();

            const phone = document.getElementById("supplier-phone").value.trim();

            const total = parseFloat(document.getElementById("supplier-debt").value) || 0;

            const invoice = phone ? `هاتف: ${phone}` : "موزع مسجل";

            handleNewSupplierDebtSubmission(name, invoice, total, 0, null, newForm);

        });

    }

}

function handleNewSupplierDebtSubmission(name, invoice, total, paid, dueDateInput, formElement) {

    if (name === "" || total < 0) {

        alert("⚠️ يرجى ملء الحقول المطلوبة بشكل صحيح!");

        return;

    }

    if (paid > total) {

        alert("⚠️ خطأ: المبلغ المدفوع لا يمكن أن يتجاوز مبلغ الدين الكلي!");

        return;

    }

    let dueDate = "غير محدد";

    if (dueDateInput) {

        const d = new Date(dueDateInput);

        dueDate = d.toLocaleDateString('ar-DZ');

    }

    const newSupDebt = {

        id: "SD-" + Date.now().toString(16).toUpperCase(),

        name: name,

        invoice: invoice,

        total: total,

        paid: paid,

        date: new Date().toLocaleDateString('ar-DZ'),

        dueDate: dueDate

    };

    if (!appState.supplierDebts) appState.supplierDebts = [];

    appState.supplierDebts.push(newSupDebt);

    saveToLocalStorage();

    formElement.reset();

    // تصفير القيم الافتراضية إن وجدت

    const paidInput = document.getElementById("sup-debt-paid");

    if (paidInput) paidInput.value = "0";

    refreshUI();

    showToast("🚚 تم تسجيل المورد وتحديث الديون المستحقة له بنجاح!");

}

function renderSupplierDebtsTable() {

    const tbody = document.getElementById("suppliers-table-tbody") || document.getElementById("supplier-debts-table-tbody");

    const totalSumEl = document.getElementById("suppliers-total-debt-sum") || document.getElementById("supplier-debts-total-sum");

    const paidSumEl = document.getElementById("supplier-debts-paid-sum");

    const countEl = document.getElementById("supplier-debts-active-count");

    if (!tbody) return;

    if (!appState.supplierDebts) appState.supplierDebts = [];

    let totalDebtSum = 0;

    let totalPaidSum = 0;

    let activeSuppliersCount = 0;

    if (appState.supplierDebts.length === 0) {

        tbody.innerHTML = `<tr><td colspan="8" class="text-muted text-center py-4">لا توجد ديون مسجلة للموزعين حالياً. المحل خالٍ من أي ديون!</td></tr>`;

        if (totalSumEl) totalSumEl.innerText = "0.00 دج";

        if (paidSumEl) paidSumEl.innerText = "0.00 دج";

        if (countEl) countEl.innerText = "0 مورد";

        return;

    }

    tbody.innerHTML = appState.supplierDebts.map(debt => {

        const remaining = debt.total - debt.paid;

        totalDebtSum += remaining;

        totalPaidSum += debt.paid;

        if (remaining > 0) {

            activeSuppliersCount++;

        }

        const isPaid = remaining <= 0;

        let actionButtons = `

            <button class="btn-warning-sm" style="padding: 4px 8px; font-size: 0.72rem; display: inline-flex; align-items: center; gap: 4px; border-radius: 6px; cursor: pointer;" onclick="paySupplierDebt('${debt.id}')" title="تسديد دفعة مالية للمورد" ${isPaid ? 'disabled style="opacity:0.5; cursor:not-allowed;"' : ''}>

                <i class="fa-solid fa-money-bill-wave"></i> تسديد دفعة

            </button>

            <button class="btn-danger-xs" style="padding: 4px 8px; font-size: 0.72rem; display: inline-flex; align-items: center; gap: 4px; border-radius: 6px; cursor: pointer;" onclick="deleteSupplierDebt('${debt.id}')" title="حذف الدين نهائياً">

                <i class="fa-solid fa-trash-can"></i> حذف

            </button>

        `;

        return `

            <tr>

                <td class="font-weight-bold" style="font-size: 0.85rem;"><i class="fa-solid fa-truck text-warning"></i> ${debt.name}</td>

                <td class="text-muted" style="font-size: 0.8rem;">${debt.date}</td>

                <td style="font-size: 0.8rem; font-weight: 600;">${debt.invoice}</td>

                <td style="font-size: 0.85rem; font-weight: bold;">${formatCurrency(debt.total)}</td>

                <td style="font-size: 0.85rem; font-weight: bold; color: var(--color-success);">${formatCurrency(debt.paid)}</td>

                <td style="font-size: 0.9rem; font-weight: 800; color: ${isPaid ? 'var(--color-success)' : 'var(--color-danger)'};">

                    ${isPaid ? '<span class="stock-status-pill success">خالص ✔️</span>' : formatCurrency(remaining)}

                </td>

                <td class="text-muted" style="font-size: 0.8rem; font-weight: 600;">${debt.dueDate}</td>

                <td style="white-space: nowrap;">${actionButtons}</td>

            </tr>

        `;

    }).join("");

    if (totalSumEl) totalSumEl.innerText = formatCurrency(totalDebtSum);

    if (paidSumEl) paidSumEl.innerText = formatCurrency(totalPaidSum);

    if (countEl) countEl.innerText = `${activeSuppliersCount} مورد دائن`;

}

// دالة خارجية لتسديد دفعة مالية لدين مورد

window.paySupplierDebt = function(id) {

    if (!appState.supplierDebts) appState.supplierDebts = [];

    const debt = appState.supplierDebts.find(d => d.id === id);

    if (!debt) return;

    const remaining = debt.total - debt.paid;

    if (remaining <= 0) {

        alert("هذا الدين تم تسديده بالكامل بالفعل!");

        return;

    }

    const inputVal = prompt(`دين المورد المتبقي هو: [ ${formatCurrency(remaining)} ]\nأدخل المبلغ المالي المراد تسديده ودفع كدفعة للمورد حالياً (دج):`);

    if (inputVal === null) return; // إلغاء

    const payment = parseFloat(inputVal);

    if (isNaN(payment) || payment <= 0) {

        alert("⚠️ يرجى إدخال مبلغ دفع صالح وأكبر من الصفر!");

        return;

    }

    if (payment > remaining) {

        alert(`⚠️ خطأ: لا يمكن دفع مبلغ أكبر من الدين المتبقي! الحد الأقصى للدفع هو: ${remaining} دج.`);

        return;

    }

    debt.paid += payment;

    saveToLocalStorage();

    refreshUI();

    showToast(`✔️ تم بنجاح دفع وتسجيل دفعة قدرها [ ${formatCurrency(payment)} ] للمورد: "${debt.name}"!`);

};

// دالة خارجية لحذف دين المورد نهائياً

window.deleteSupplierDebt = function(id) {

    if (!appState.supplierDebts) appState.supplierDebts = [];

    const debt = appState.supplierDebts.find(d => d.id === id);

    if (!debt) return;

    const confirmDelete = confirm(`🚨 تحذير: هل أنت متأكد من حذف دين المورد [ ${debt.name} ] نهائياً من سجل الديون؟`);

    if (confirmDelete) {

        appState.supplierDebts = appState.supplierDebts.filter(d => d.id !== id);

        saveToLocalStorage();

        refreshUI();

        showToast(`🗑️ تم حذف ملف دين المورد من السجلات بنجاح!`);

    }

};

// ==========================================

// منطق إحصائيات وبطل مبيعات الأسبوع (Employee of the Week)

// ==========================================

function calculateEmployeeOfTheWeek() {

    if (!appState.transactions || appState.transactions.length === 0) {

        return null;

    }

    // تاريخ 7 أيام مضت

    const sevenDaysAgo = new Date();

    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    // فلترة المعاملات في آخر 7 أيام

    const weeklyTransactions = appState.transactions.filter(t => new Date(t.timestamp) >= sevenDaysAgo);

    if (weeklyTransactions.length === 0) {

        return null;

    }

    const cashierStats = {};

    weeklyTransactions.forEach(t => {

        const cashier = t.processedBy || "النظام";

        if (cashier === "النظام") return;

        if (!cashierStats[cashier]) {

            cashierStats[cashier] = {

                name: cashier,

                totalQty: 0,

                totalSales: 0,

                opsCount: 0

            };

        }

        cashierStats[cashier].opsCount++;

        cashierStats[cashier].totalSales += t.total;

        if (t.items && Array.isArray(t.items)) {

            t.items.forEach(item => {

                cashierStats[cashier].totalQty += parseFloat(item.qty) || 0;

            });

        }

    });

    let bestEmployee = null;

    for (const key in cashierStats) {

        const stats = cashierStats[key];

        // نحدد الفائز بناءً على أعلى كمية سلع مباعة كما طلب المستخدم

        if (!bestEmployee || stats.totalQty > bestEmployee.totalQty) {

            bestEmployee = stats;

        }

    }

    return bestEmployee;

}

function updateEmployeeOfTheWeekUI() {

    const best = calculateEmployeeOfTheWeek();

    const dbNameEl = document.getElementById("db-emp-week-name");

    const dbStatsEl = document.getElementById("db-emp-week-stats");

    const usersNameEl = document.getElementById("users-emp-week-name");

    const usersQtyEl = document.getElementById("users-emp-week-qty");

    const usersSalesEl = document.getElementById("users-emp-week-sales");

    const usersOpsEl = document.getElementById("users-emp-week-ops");

    if (best) {

        const qtyFormatted = best.totalQty.toFixed(1).replace(/\.0$/, '');

        if (dbNameEl) dbNameEl.innerText = best.name;

        if (dbStatsEl) dbStatsEl.innerText = `باع: ${qtyFormatted} قطعة بقيمة ${formatCurrency(best.totalSales)}`;

        if (usersNameEl) usersNameEl.innerText = best.name;

        if (usersQtyEl) usersQtyEl.innerText = `${qtyFormatted} قطعة`;

        if (usersSalesEl) usersSalesEl.innerText = formatCurrency(best.totalSales);

        if (usersOpsEl) usersOpsEl.innerText = `${best.opsCount} عملية بيع`;

    } else {

        if (dbNameEl) dbNameEl.innerText = "لا يوجد حالياً";

        if (dbStatsEl) dbStatsEl.innerText = "باع: 0 قطعة بقيمة 0.00 دج";

        if (usersNameEl) usersNameEl.innerText = "لا يوجد موظف مبيعات نشط";

        if (usersQtyEl) usersQtyEl.innerText = "0 قطعة";

        if (usersSalesEl) usersSalesEl.innerText = "0.00 دج";

        if (usersOpsEl) usersOpsEl.innerText = "0 عملية";

    }

}

// ==========================================

// تم تحويل البرنامج ليعمل بنمط فردي أوفلاين محلي 100% (بناء على طلبك)

// ==========================================

let lanSyncMode = false;
let isSyncing = false;
let currentDbVersion = 0;
let syncServerUrl = '';

function getSyncServerBaseUrl() {
    if (window.location.protocol.startsWith('http')) {
        return window.location.origin;
    }
    return 'http://localhost:5000';
}

function getStoreQueryParam() {
    return "";
}

window.switchActiveStore = function(storeId) {
    if (confirm("🔄 هل أنت متأكد من التبديل إلى هذا الحساب؟\n\nسيتم إعادة تحميل الصفحة لعرض وتحديث السلع والديون التابعة لهذا الحساب.")) {
        localStorage.setItem("active_store_id", storeId);
        window.location.reload();
    }
};

async function initDatabaseSync() {
    syncServerUrl = getSyncServerBaseUrl();
    try {
        const res = await fetch(syncServerUrl + '/api/db' + getStoreQueryParam(), { cache: 'no-store' });
        if (res.ok) {
            const data = await res.json();
            const serverVersion = res.headers.get('X-DB-Version') || Date.now();
            currentDbVersion = Number(serverVersion);
            lanSyncMode = true;

            // تهيئة حقل الاختيار واللوحة النشطة للمحل في الإعدادات
            const activeStoreId = localStorage.getItem("active_store_id") || "main";
            const switcher = document.getElementById("app-store-switcher");
            if (switcher) switcher.value = activeStoreId;
            const activeStoreNameSpan = document.getElementById("active-store-display-name");
            if (activeStoreNameSpan) {
                const names = {
                    "main": "المحل الرئيسي الأول (الافتراضي)",
                    "store_2": "محل 2",
                    "store_3": "محل 3",
                    "store_4": "محل 4",
                    "store_5": "محل 5",
                    "store_6": "محل 6",
                    "store_7": "محل 7",
                    "store_8": "محل 8",
                    "store_9": "محل 9",
                    "store_10": "محل 10"
                };
                activeStoreNameSpan.innerText = names[activeStoreId] || activeStoreId;
            }

            if (data && (Array.isArray(data.products) || Array.isArray(data.users))) {
                if (data.storeSettings) appState.storeSettings = data.storeSettings;
                appState.products = data.products || [];
                appState.transactions = data.transactions || [];
                appState.debts = data.debts || [];
                appState.supplierDebts = data.supplierDebts || [];
                if (data.users && data.users.length > 0) appState.users = data.users;

                localStorage.setItem("smart_shop_state", JSON.stringify(appState));
                
                // تحديث رسالة الإيصال فور المزامنة مع السيرفر
                updateReceiptFooterUI(appState.storeSettings.receiptFooterMessage);
                
                // إعادة فحص الترخيص فور جلب البيانات من السيرفر لفك القفل تلقائياً دون طلب كود جديد
                if (typeof window.checkAppLicense === 'function') {
                    window.checkAppLicense();
                }
                
                if (typeof calculateGlobalStats === 'function') calculateGlobalStats();
                if (typeof renderCurrentTab === 'function') renderCurrentTab();
            } else {
                sendDataToServer();
            }
            startLanSyncPolling();
            console.log("✅ تم الاتصال بقاعدة البيانات الموحدة والسيرفر المتزامن بنجاح!");
        }
    } catch (err) {
        console.warn("⚠️ السيرفر غير متصل، يعمل البرنامج أوفلاين ذاكرة محلية:", err.message);
        lanSyncMode = false;
    }
}

function showServerStatusIndicator(isConnected) {
}

window.triggerManualSync = async function() {
    await initDatabaseSync();
    showToast("🔄 تم تحديث ومزامنة البيانات مع السيرفر المشترك بنجاح.");
};

async function sendDataToServer() {
    if (isSyncing) return;
    syncServerUrl = getSyncServerBaseUrl();
    isSyncing = true;
    try {
        const payload = {
            storeSettings: appState.storeSettings,
            products: appState.products,
            transactions: appState.transactions,
            debts: appState.debts || [],
            supplierDebts: appState.supplierDebts || [],
            users: appState.users || []
        };
        const res = await fetch(syncServerUrl + '/api/sync' + getStoreQueryParam(), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        if (res.ok) {
            const result = await res.json();
            if (result.dbVersion) {
                currentDbVersion = result.dbVersion;
            }
            lanSyncMode = true;
        }
    } catch (err) {
        console.warn("⚠️ لم يتم الوصول للسيرفر لإرسال التحديثات:", err.message);
    } finally {
        isSyncing = false;
    }
}

let syncInterval = null;
function startLanSyncPolling() {
    if (syncInterval) clearInterval(syncInterval);
    syncInterval = setInterval(async () => {
        if (!lanSyncMode || isSyncing) return;
        syncServerUrl = getSyncServerBaseUrl();
        try {
            const res = await fetch(syncServerUrl + '/api/sync-check' + getStoreQueryParam(), { cache: 'no-store' });
            if (res.ok) {
                const data = await res.json();
                if (data.dbVersion && data.dbVersion > currentDbVersion) {
                    currentDbVersion = data.dbVersion;
                    isSyncing = true;
                    const dbRes = await fetch(syncServerUrl + '/api/db' + getStoreQueryParam(), { cache: 'no-store' });
                    if (dbRes.ok) {
                        const newDb = await dbRes.json();
                        if (newDb && (Array.isArray(newDb.products) || Array.isArray(newDb.users))) {
                            if (newDb.storeSettings) appState.storeSettings = newDb.storeSettings;
                            appState.products = newDb.products || [];
                            appState.transactions = newDb.transactions || [];
                            appState.debts = newDb.debts || [];
                            appState.supplierDebts = newDb.supplierDebts || [];
                            if (newDb.users) appState.users = newDb.users;

                            localStorage.setItem("smart_shop_state", JSON.stringify(appState));
                            if (typeof calculateGlobalStats === 'function') calculateGlobalStats();
                            if (typeof renderCurrentTab === 'function') renderCurrentTab();
                            console.log("🔄 تم مزامنة وتحديث البيانات من السيرفر الموحد!");
                        }
                    }
                    isSyncing = false;
                }
            }
        } catch (e) {
            console.warn("⚠️ خطأ في فحص تحديثات السيرفر:", e.message);
        }
    }, 4000);
}

// ============  Barcode Label Printing System - v2  ============

// =============================================================================

var _barcodeSelectedProducts = [];

var _barcodeActiveTab = 'inventory'; // 'inventory' | 'custom'

// ====== تبديل التبويب ======

function switchBarcodeTab(tab) {

    _barcodeActiveTab = tab;

    var tabInv = document.getElementById('bc-tab-inventory');

    var tabCus = document.getElementById('bc-tab-custom');

    var panelInv = document.getElementById('bc-panel-inventory');

    var panelCus = document.getElementById('bc-panel-custom');

    if (tab === 'inventory') {

        if (tabInv) { tabInv.style.background = 'rgba(99,102,241,0.85)'; tabInv.style.color = 'white'; }

        if (tabCus) { tabCus.style.background = 'transparent'; tabCus.style.color = '#94a3b8'; }

        if (panelInv) panelInv.style.display = 'block';

        if (panelCus) panelCus.style.display = 'none';

    } else {

        if (tabCus) { tabCus.style.background = 'rgba(99,102,241,0.85)'; tabCus.style.color = 'white'; }

        if (tabInv) { tabInv.style.background = 'transparent'; tabInv.style.color = '#94a3b8'; }

        if (panelCus) panelCus.style.display = 'block';

        if (panelInv) panelInv.style.display = 'none';

        // ربط تحديث المعاينة الفورية

        bindCustomPreview();

    }

}

// ====== ربط معاينة الإدخال الحر ======

function bindCustomPreview() {

    var nameEl = document.getElementById('bc-custom-name');

    var priceEl = document.getElementById('bc-custom-price');

    var bcEl = document.getElementById('bc-custom-barcode');

    function update() { updateCustomPreview(); }

    if (nameEl) { nameEl.removeEventListener('input', update); nameEl.addEventListener('input', update); }

    if (priceEl) { priceEl.removeEventListener('input', update); priceEl.addEventListener('input', update); }

    if (bcEl) { bcEl.removeEventListener('input', update); bcEl.addEventListener('input', update); }

}

function updateCustomPreview() {

    var name = (document.getElementById('bc-custom-name') ? document.getElementById('bc-custom-name').value.trim() : '') || 'â€”';

    var price = parseFloat(document.getElementById('bc-custom-price') ? document.getElementById('bc-custom-price').value : '') || 0;

    var barcodeVal = (document.getElementById('bc-custom-barcode') ? document.getElementById('bc-custom-barcode').value.trim() : '');

    if (!barcodeVal) barcodeVal = '613000000000';

    var prevName = document.getElementById('bc-prev-name');

    var prevNum = document.getElementById('bc-prev-num');

    var prevPrice = document.getElementById('bc-prev-price');

    var prevSvg = document.getElementById('bc-prev-svg');

    if (prevName) prevName.textContent = name;

    if (prevNum) prevNum.textContent = barcodeVal;

    if (prevPrice) prevPrice.textContent = price > 0 ? formatCurrency(price) : 'â€”';

    if (prevSvg && typeof JsBarcode !== 'undefined') {

        try {

            JsBarcode(prevSvg, barcodeVal, { format: 'CODE128', width: 1.4, height: 25, displayValue: false, margin: 2, background: 'white', lineColor: '#000' });

        } catch(e) {

            prevSvg.innerHTML = '';

        }

    }

}

// ====== توليد كود عشوائي للإدخال الحر ======

function bcGenerateRandomBarcode() {

    var newCode = '613' + Math.floor(100000000 + Math.random() * 900000000).toString();

    var el = document.getElementById('bc-custom-barcode');

    if (el) { el.value = newCode; updateCustomPreview(); }

}

// ====== تحديد الكل / إلغاء الكل ======

function barcodeSelectAll(select) {

    var checkboxes = document.querySelectorAll('#barcode-products-list input[type=checkbox]');

    for (var i = 0; i < checkboxes.length; i++) {

        checkboxes[i].checked = select;

    }

    updateBarcodeSelection();

}

// ====== بحث في قائمة المخزن داخل النافذة ======

function renderBarcodeInventoryList() {

    var searchEl = document.getElementById('bc-inventory-search');

    var query = searchEl ? searchEl.value.toLowerCase().trim() : '';

    var products = appState.products || [];

    var filtered = products.filter(function(p) {

        return p.name.toLowerCase().includes(query) || (p.barcode && p.barcode.includes(query));

    });

    var listEl = document.getElementById('barcode-products-list');

    if (!listEl) return;

    if (filtered.length === 0) {

        listEl.innerHTML = '<p style="text-align:center;color:#94a3b8;font-size:0.83rem;padding:12px;">لا توجد نتائج</p>';

        return;

    }

    var html = '';

    for (var i = 0; i < filtered.length; i++) {

        var p = filtered[i];

        var isChecked = _barcodeSelectedProducts.indexOf(p.id) !== -1;

        var hasBarcode = p.barcode && p.barcode.trim() !== '';

        var noBarcodeTag = !hasBarcode

            ? '<span style="font-size:0.67rem;background:rgba(239,68,68,0.15);color:#f87171;border:1px solid rgba(239,68,68,0.3);border-radius:5px;padding:1px 6px;flex-shrink:0;">\u0628\u062f\u0648\u0646 \u0643\u0648\u062f</span>'

            : '';

        html += '<label style="display:flex;align-items:center;gap:10px;padding:8px 10px;border-radius:8px;cursor:pointer;transition:background 0.15s;margin-bottom:2px;color:#e2e8f0;"'

              + ' onmouseover="this.style.background=\'rgba(255,255,255,0.06)\'"'

              + ' onmouseout="this.style.background=\'transparent\'">'

              + '<input type="checkbox" data-prod-id="' + p.id + '"' + (isChecked ? ' checked' : '')

              + ' onchange="updateBarcodeSelection()"'

              + ' style="width:16px;height:16px;cursor:pointer;accent-color:#818cf8;flex-shrink:0;">'

              + '<span style="flex:1;font-size:0.87rem;font-weight:600;color:#f1f5f9;">' + p.name + '</span>'

              + noBarcodeTag

              + '<span style="font-size:0.74rem;color:#64748b;direction:ltr;font-family:monospace;flex-shrink:0;">' + (p.barcode || '---') + '</span>'

              + '<span style="font-size:0.8rem;color:#4ade80;font-weight:700;flex-shrink:0;">' + formatCurrency(p.sellPrice) + '</span>'

              + '</label>';

    }

    listEl.innerHTML = html;

}

// ====== فتح النافذة ======

function openBarcodeModal(productId) {

    var modal = document.getElementById('barcode-print-modal');

    if (!modal) return;

    var products = appState.products || [];

    _barcodeSelectedProducts = productId ? [productId] : [];

    // تفعيل تبويب المخزن بشكل افتراضي

    _barcodeActiveTab = 'inventory';

    switchBarcodeTab('inventory');

    renderBarcodeInventoryList();

    // مسح حقول الإدخال الحر

    var nm = document.getElementById('bc-custom-name'); if (nm) nm.value = '';

    var pr = document.getElementById('bc-custom-price'); if (pr) pr.value = '';

    var bc = document.getElementById('bc-custom-barcode'); if (bc) bc.value = '';

    modal.style.display = 'flex';

}

// ====== تحديث عداد السلع المختارة ======

function updateBarcodeSelection() {

    var checkboxes = document.querySelectorAll('#barcode-products-list input[type=checkbox]:checked');

    _barcodeSelectedProducts = [];

    for (var i = 0; i < checkboxes.length; i++) {

        _barcodeSelectedProducts.push(checkboxes[i].dataset.prodId);

    }

    var countEl = document.getElementById('barcode-selected-count');

    if (countEl) countEl.textContent = _barcodeSelectedProducts.length + ' \u0633\u0644\u0639\u0629';

}

// ====== إغلاق النافذة ======

function closeBarcodeModal() {

    var modal = document.getElementById('barcode-print-modal');

    if (modal) modal.style.display = 'none';

}

// ====== معاينة الملصقات ======

function previewBarcodeLabels() {

    if (_barcodeActiveTab === 'custom') {

        var nm = document.getElementById('bc-custom-name');

        if (!nm || !nm.value.trim()) { showToast('\u064a\u0631\u062c\u0649 \u0625\u062f\u062e\u0627\u0644 \u0627\u0633\u0645 \u0627\u0644\u0633\u0644\u0639\u0629!'); return; }

    } else {

        if (_barcodeSelectedProducts.length === 0) { showToast('\u064a\u0631\u062c\u0649 \u0627\u062e\u062a\u064a\u0627\u0631 \u0633\u0644\u0639\u0629 \u0648\u0627\u062d\u062f\u0629 \u0639\u0644\u0649 \u0627\u0644\u0623\u0642\u0644!'); return; }

    }

    var html = buildBarcodePrintHTML(true);

    var win = window.open('', '_blank', 'width=900,height=700');

    if (win) { win.document.write(html); win.document.close(); }

}

// ====== طباعة الملصقات ======


// تصدير دوال الباركود لـ window لمنع أخطاء ReferenceError
window.generateBarcodesPrintWindow = function() {
    printBarcodeLabels();
};
window.printBarcodeLabels = printBarcodeLabels;
window.previewBarcodeLabels = previewBarcodeLabels;
window.closeBarcodeModal = closeBarcodeModal;
window.switchBarcodeTab = switchBarcodeTab;
window.bcGenerateRandomBarcode = bcGenerateRandomBarcode;

function printBarcodeLabels() {

    if (_barcodeActiveTab === 'custom') {

        var nm = document.getElementById('bc-custom-name');

        if (!nm || !nm.value.trim()) { showToast('\u064a\u0631\u062c\u0649 \u0625\u062f\u062e\u0627\u0644 \u0627\u0633\u0645 \u0627\u0644\u0633\u0644\u0639\u0629!'); return; }

    } else {

        if (_barcodeSelectedProducts.length === 0) { showToast('\u064a\u0631\u062c\u0649 \u0627\u062e\u062a\u064a\u0627\u0631 \u0633\u0644\u0639\u0629 \u0648\u0627\u062d\u062f\u0629 \u0639\u0644\u0649 \u0627\u0644\u0623\u0642\u0644!'); return; }

    }

    var html = buildBarcodePrintHTML(false);

    var win = window.open('', '_blank', 'width=900,height=700');

    if (win) {

        win.document.write(html);

        win.document.close();

        win.onload = function() { setTimeout(function() { win.print(); win.close(); }, 800); };

    }

}

// ====== بناء صفحة HTML للطباعة - تصميم احترافي مع لوغو وإيقاف صحيح ======

function buildBarcodePrintHTML(isPreview) {

    var qty       = parseInt(document.getElementById('barcode-label-qty') ? document.getElementById('barcode-label-qty').value : 1) || 1;

    var showPrice = document.getElementById('barcode-show-price') ? document.getElementById('barcode-show-price').checked : true;

    var showName  = document.getElementById('barcode-show-name') ? document.getElementById('barcode-show-name').checked : true;

    var showLogo  = document.getElementById('barcode-show-logo') ? document.getElementById('barcode-show-logo').checked : true;

    var isThermal = (_barcodePrinterType === 'thermal');

    var storeName = (appState.storeSettings && appState.storeSettings.name) ? appState.storeSettings.name : '\u0627\u0644\u0645\u062d\u0644';

    var logoBase64 = showLogo ? getShopLogo() : null;

    // === أبعاد حسب نوع الطابعة ===

    var pageW, labelW, labelH, bw, bh, nameFs, numFs, priceFs, logoH, cols;

    if (isThermal) {

        var tw = parseInt(document.getElementById('barcode-thermal-width') ? document.getElementById('barcode-thermal-width').value : 80) || 80;

        var th = parseInt(document.getElementById('barcode-thermal-height') ? document.getElementById('barcode-thermal-height').value : 40) || 40;

        pageW  = tw + 'mm';

        labelW = (tw - 4) + 'mm';

        labelH = th + 'mm';

        bw = tw >= 80 ? 2.0 : 1.4;

        bh = Math.max(th - 20, 12);

        nameFs = tw >= 80 ? '9pt' : '7.5pt';

        numFs  = tw >= 80 ? '7pt' : '6.5pt';

        priceFs = tw >= 80 ? '10pt' : '8pt';

        logoH  = tw >= 80 ? '18mm' : '14mm';

        cols   = 1;

    } else {

        var sizeKey = document.getElementById('barcode-label-size') ? document.getElementById('barcode-label-size').value : 'medium';

        cols = parseInt(document.getElementById('barcode-label-cols') ? document.getElementById('barcode-label-cols').value : 2) || 2;

        var sizeMap = {

            small:  { w: '50mm',  h: '28mm', bw: 1.2, bh: 18, nameFs: '7.5pt', numFs: '6.5pt', priceFs: '8pt',   logoH: '10mm' },

            medium: { w: '70mm',  h: '38mm', bw: 1.6, bh: 26, nameFs: '9pt',   numFs: '7.5pt', priceFs: '10pt',  logoH: '14mm' },

            large:  { w: '90mm',  h: '50mm', bw: 2.0, bh: 34, nameFs: '10pt',  numFs: '8.5pt', priceFs: '12pt',  logoH: '18mm' }

        };

        var sz = sizeMap[sizeKey] || sizeMap.medium;

        pageW = 'auto'; labelW = sz.w; labelH = sz.h;

        bw = sz.bw; bh = sz.bh; nameFs = sz.nameFs; numFs = sz.numFs; priceFs = sz.priceFs; logoH = sz.logoH;

    }

    // === بناء محتوى كل ملصق ===

    function makeLabel(name, barcodeVal, priceStr) {

        var id = 'sv_' + Math.random().toString(36).slice(2, 9);

        var logoHtml = (logoBase64)

            ? '<div class="label-logo"><img src="' + logoBase64 + '" alt="logo"></div>'

            : '';

        var nameHtml = (showName && name)

            ? '<div class="label-name">' + name + '</div>'

            : '';

        var priceHtml = (showPrice && priceStr)

            ? '<div class="label-price">' + priceStr + '</div>'

            : '';

        return '<div class="label">'

            + (logoHtml ? '<div class="label-top">' + logoHtml + '<div class="label-store">' + storeName + '</div></div><div class="label-divider"></div>' : '')

            + nameHtml

            + '<svg id="' + id + '" data-barcode="' + barcodeVal + '" class="bc-svg"></svg>'

            + '<div class="bc-num">' + barcodeVal + '</div>'

            + priceHtml

            + '</div>';

    }

    // === توليد الملصقات ===

    var labelsHtml = '';

    if (_barcodeActiveTab === 'custom') {

        var customName  = (document.getElementById('bc-custom-name') ? document.getElementById('bc-custom-name').value.trim() : '') || '';

        var customPrice = parseFloat(document.getElementById('bc-custom-price') ? document.getElementById('bc-custom-price').value : '') || 0;

        var customBc    = (document.getElementById('bc-custom-barcode') ? document.getElementById('bc-custom-barcode').value.trim() : '') || ('613' + Math.floor(100000000 + Math.random() * 900000000));

        var pStr = customPrice > 0 ? formatCurrency(customPrice) : '';

        for (var i = 0; i < qty; i++) labelsHtml += makeLabel(customName, customBc, pStr);

    } else {

        for (var pi = 0; pi < _barcodeSelectedProducts.length; pi++) {

            var prodId = _barcodeSelectedProducts[pi];

            var products = appState.products || [];

            var p = null;

            for (var j = 0; j < products.length; j++) { if (products[j].id === prodId) { p = products[j]; break; } }

            if (!p) continue;

            var bval = (p.barcode && p.barcode.trim()) ? p.barcode : ('613' + Math.floor(100000000 + Math.random() * 900000000));

            for (var ii = 0; ii < qty; ii++) labelsHtml += makeLabel(p.name, bval, formatCurrency(p.sellPrice));

        }

    }

    // === CSS احترافي ===

    var pageStyle, containerStyle, labelStyle;

    if (isThermal) {

        // الطابعة الحرارية: الصفحة تتوقف عند انتهاء المحتوى تلقائياً

        pageStyle = '@page { size: ' + pageW + ' auto; margin: 0mm 2mm; }';

        containerStyle = 'display:block; width:100%; padding:0;';

        labelStyle = 'width:100%; min-height:' + labelH + '; max-width:' + pageW + '; border:none; border-bottom:1.5px dashed #ccc; display:flex; flex-direction:column; align-items:center; justify-content:flex-start; padding:3mm 2mm; background:white; page-break-inside:avoid; overflow:hidden; box-sizing:border-box;';

    } else {

        // الطابعة العادية: شبكة ملصقات بعدد أعمدة محدد

        pageStyle = '@page { margin: 6mm; }';

        containerStyle = 'display:grid; grid-template-columns:repeat(' + cols + ', ' + labelW + '); gap:3mm; justify-content:start; padding:0;';

        labelStyle = 'width:' + labelW + '; height:' + labelH + '; border:1px solid #d1d5db; border-radius:4px; display:flex; flex-direction:column; align-items:center; justify-content:flex-start; padding:2mm 1.5mm; background:white; page-break-inside:avoid; overflow:hidden; box-sizing:border-box; position:relative;';

    }

    var previewBanner = isPreview

        ? '<div style="background:#1e293b;color:white;text-align:center;padding:12px;font-family:Arial;font-size:13pt;margin-bottom:12px;">'

          + '\u0645\u0639\u0627\u064a\u0646\u0629 â€” ' + storeName + ' &nbsp;|&nbsp; '

          + (isThermal ? '\u0637\u0627\u0628\u0639\u0629 \u062d\u0631\u0627\u0631\u064a\u0629' : '\u0637\u0627\u0628\u0639\u0629 \u0639\u0627\u062f\u064a\u0629')

          + '</div>'

        : '';

    return '<!DOCTYPE html><html dir="rtl" lang="ar"><head>'

        + '<meta charset="UTF-8"><title>\u0645\u0644\u0635\u0642\u0627\u062a<\/title>'

        + '<script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.6/dist/JsBarcode.all.min.js"><\/script>'

        + '<style>'

        + '* { box-sizing:border-box; margin:0; padding:0; }'

        + pageStyle

        + 'html, body { background: ' + (isPreview ? '#e2e8f0' : 'white') + '; width:100%; }'

        + 'body { font-family: Arial, sans-serif; padding: ' + (isPreview ? '0' : '0') + '; }'

        + '.labels-wrap { ' + containerStyle + ' }'

        + '.label { ' + labelStyle + ' }'

        // لوغو وعنوان المحل

        + '.label-top { display:flex; align-items:center; justify-content:center; gap:4px; width:100%; margin-bottom:1.5mm; }'

        + '.label-logo { display:flex; align-items:center; justify-content:center; }'

        + '.label-logo img { max-height:' + logoH + '; max-width:40%; object-fit:contain; }'

        + '.label-store { font-size:8pt; font-weight:900; color:#0f172a; letter-spacing:0.5px; text-align:center; line-height:1.2; }'

        + '.label-divider { width:90%; border:none; border-top:0.8px solid #9ca3af; margin:1mm auto 1.5mm; }'

        // اسم المنتج

        + '.label-name { font-size:' + nameFs + '; font-weight:700; color:#0f172a; text-align:center; width:100%; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; margin-bottom:1.5mm; line-height:1.2; }'

        // الباركود

        + '.bc-svg { display:block; max-width:100%; height:auto; }'

        + '.bc-num { font-size:' + numFs + '; color:#374151; letter-spacing:0.8px; font-family:Courier New, monospace; margin-top:0.5mm; direction:ltr; text-align:center; }'

        // السعر - بارز وكبير

        + '.label-price { font-size:' + priceFs + '; font-weight:900; color:#0f172a; margin-top:1.5mm; text-align:center; border-top:0.8px solid #d1d5db; padding-top:1mm; width:85%; }'

        // إيقاف الطباعة عند نهاية المحتوى

        + '@media print {'

        + '  html, body { background:white; width:' + (isThermal ? pageW : 'auto') + '; height:auto !important; }'

        + '  .labels-wrap { ' + (isThermal ? 'display:block;' : containerStyle) + ' }'

        + '  .label { break-inside:avoid; page-break-inside:avoid; }'

        + '}'

        + '<\/style><\/head><body>'

        + previewBanner

        + '<div class="labels-wrap">' + labelsHtml + '<\/div>'

        + '<script>'

        + 'document.querySelectorAll("svg.bc-svg[data-barcode]").forEach(function(svg){'

        + '  var c = svg.getAttribute("data-barcode");'

        + '  try { JsBarcode(svg, c, { format:"CODE128", width:' + bw + ', height:' + bh + ', displayValue:false, margin:1, background:"white", lineColor:"#000" }); }'

        + '  catch(e) { svg.style.display="none"; }'

        + '});'

        + '<\/script><\/body><\/html>';

}

// ====== تهيئة أزرار النافذة ======

(function() {

    function initBarcodeButtons() {

        var btnPrintAll = document.getElementById('btn-print-all-barcodes');

        if (btnPrintAll) btnPrintAll.addEventListener('click', function() { openBarcodeModal(null); });

        var modal = document.getElementById('barcode-print-modal');

        if (modal) modal.addEventListener('click', function(e) { if (e.target === modal) closeBarcodeModal(); });

    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initBarcodeButtons);

    else initBarcodeButtons();

})();

// ====== تبديل نوع الطابعة ======

var _barcodePrinterType = 'normal'; // 'normal' | 'thermal'

function switchPrinterType(type) {

    _barcodePrinterType = type;

    var btnN = document.getElementById('bc-printer-normal');

    var btnT = document.getElementById('bc-printer-thermal');

    var setN = document.getElementById('bc-settings-normal');

    var setT = document.getElementById('bc-settings-thermal');

    if (type === 'thermal') {

        if (btnT) { btnT.style.background = 'rgba(234,179,8,0.2)'; btnT.style.borderColor = 'rgba(234,179,8,0.6)'; btnT.style.color = '#fcd34d'; }

        if (btnN) { btnN.style.background = 'rgba(255,255,255,0.04)'; btnN.style.borderColor = 'rgba(255,255,255,0.1)'; btnN.style.color = '#94a3b8'; }

        if (setT) setT.style.display = 'block';

        if (setN) setN.style.display = 'none';

    } else {

        if (btnN) { btnN.style.background = 'rgba(99,102,241,0.2)'; btnN.style.borderColor = 'rgba(99,102,241,0.5)'; btnN.style.color = '#a5b4fc'; }

        if (btnT) { btnT.style.background = 'rgba(255,255,255,0.04)'; btnT.style.borderColor = 'rgba(255,255,255,0.1)'; btnT.style.color = '#94a3b8'; }

        if (setN) setN.style.display = 'flex';

        if (setT) setT.style.display = 'none';

    }

}

// ====== إدارة لوغو المحل على الملصقات ======

function handleLogoUpload(event) {

    var file = event.target.files[0];

    if (!file) return;

    var reader = new FileReader();

    reader.onload = function(e) {

        var base64 = e.target.result;

        localStorage.setItem('shopLogoBase64', base64);

        refreshLogoPreview(base64);

        showToast('\u062a\u0645 \u062d\u0641\u0638 \u0627\u0644\u0644\u0648\u063a\u0648 \u0628\u0646\u062c\u0627\u062d! \u0633\u064a\u0638\u0647\u0631 \u0639\u0644\u0649 \u0627\u0644\u0645\u0644\u0635\u0642\u0627\u062a.');

    };

    reader.readAsDataURL(file);

}

function removeShopLogo() {

    localStorage.removeItem('shopLogoBase64');

    var img = document.getElementById('bc-logo-preview-img');

    var icon = document.getElementById('bc-logo-placeholder-icon');

    if (img) { img.style.display = 'none'; img.src = ''; }

    if (icon) icon.style.display = '';

    showToast('\u062a\u0645 \u062d\u0630\u0641 \u0627\u0644\u0644\u0648\u063a\u0648.');

}

function refreshLogoPreview(base64) {

    var img = document.getElementById('bc-logo-preview-img');

    var icon = document.getElementById('bc-logo-placeholder-icon');

    if (img && base64) {

        img.src = base64;

        img.style.display = 'block';

        if (icon) icon.style.display = 'none';

    } else if (img) {

        img.style.display = 'none';

        if (icon) icon.style.display = '';

    }

}

function getShopLogo() {

    return localStorage.getItem('shopLogoBase64') || null;

}

// تحميل اللوغو عند فتح النافذة

var _origOpenBarcodeModal = openBarcodeModal;

openBarcodeModal = function(productId) {

    _origOpenBarcodeModal(productId);

    // تحميل اللوغو المحفوظ

    var saved = getShopLogo();

    refreshLogoPreview(saved);

};

// ====== الإعدادات العامة للمتجر وتطبيق الطباعة الديناميكية وسيناريوهات المخططات ======

let salesTrendChartInstance = null;

let topItemsChartInstance = null;

function handleStoreLogoUpload(event) {

    var file = event.target.files[0];

    if (!file) return;

    var reader = new FileReader();

    reader.onload = function(e) {

        var base64 = e.target.result;

        localStorage.setItem('shopLogoBase64', base64);

        // تحديث كلتا المعاينتين تلقائياً

        refreshLogoPreview(base64);

        refreshStoreLogoPreview(base64);

        showToast('تم حفظ لوغو المتجر بنجاح! سيظهر على الفواتير والملصقات.');

    };

    reader.readAsDataURL(file);

}

function removeStoreLogo() {

    localStorage.removeItem('shopLogoBase64');

    // تحديث كلتا المعاينتين تلقائياً

    refreshLogoPreview(null);

    refreshStoreLogoPreview(null);

    showToast('تم حذف لوغو المتجر.');

}

function refreshStoreLogoPreview(base64) {

    var img = document.getElementById('store-logo-preview-img');

    var icon = document.getElementById('store-logo-placeholder-icon');

    if (img && base64) {

        img.src = base64;

        img.style.display = 'block';

        if (icon) icon.style.display = 'none';

    } else if (img) {

        img.style.display = 'none';

        if (icon) icon.style.display = '';

    }

}

function applyPrintStyles() {
    let styleEl = document.getElementById("dynamic-print-styles");
    if (!styleEl) {
        styleEl = document.createElement("style");
        styleEl.id = "dynamic-print-styles";
        document.head.appendChild(styleEl);
    }

    const printerType = appState.storeSettings.printerType || "A4";
    let css = "";

    if (printerType === "58mm") {
        css = `
            @media print {
                @page { size: 58mm auto; margin: 0; }
                html, body {
                    width: 58mm !important;
                    font-size: 10px !important;
                    padding: 0 !important;
                    margin: 0 !important;
                    direction: rtl !important;
                    text-align: center !important;
                    background: #ffffff !important;
                    color: #000000 !important;
                }
                .receipt-print-section {
                    width: 52mm !important; /* هامش أمان لمنع قص المجموع باليسار */
                    margin: 0 auto !important;
                    padding: 0 !important;
                    font-size: 10px !important;
                    direction: rtl !important;
                    text-align: center !important;
                    background: #ffffff !important;
                }
                #receipt-print-section *, .receipt-print-section * {
                    color: #000000 !important;
                }
                .receipt-header, .receipt-footer, .receipt-totals {
                    text-align: center !important;
                    direction: rtl !important;
                }
                .receipt-total-row {
                    display: flex !important;
                    justify-content: center !important;
                    gap: 8px !important;
                    margin-bottom: 4px !important;
                }
                .receipt-items-table {
                    width: 100% !important;
                    direction: rtl !important;
                }
                .receipt-items-table th, .receipt-items-table td {
                    font-size: 9px !important;
                    direction: rtl !important;
                    padding: 4px 1px !important;
                }
            }
        `;
    } else if (printerType === "80mm") {
        css = `
            @media print {
                @page { size: 80mm auto; margin: 0; }
                html, body {
                    width: 80mm !important;
                    font-size: 12px !important;
                    padding: 0 !important;
                    margin: 0 !important;
                    direction: rtl !important;
                    text-align: center !important;
                    background: #ffffff !important;
                    color: #000000 !important;
                }
                .receipt-print-section {
                    width: 72mm !important; /* هامش أمان لمنع قص المجموع باليسار */
                    margin: 0 auto !important;
                    padding: 0 !important;
                    font-size: 12px !important;
                    direction: rtl !important;
                    text-align: center !important;
                    background: #ffffff !important;
                }
                #receipt-print-section *, .receipt-print-section * {
                    color: #000000 !important;
                }
                .receipt-header, .receipt-footer, .receipt-totals {
                    text-align: center !important;
                    direction: rtl !important;
                }
                .receipt-total-row {
                    display: flex !important;
                    justify-content: center !important;
                    gap: 8px !important;
                    margin-bottom: 4px !important;
                }
                .receipt-items-table {
                    width: 100% !important;
                    direction: rtl !important;
                }
                .receipt-items-table th, .receipt-items-table td {
                    font-size: 11px !important;
                    direction: rtl !important;
                    padding: 4px 2px !important;
                }
            }
        `;
    } else {
        css = `
            @media print {
                @page { size: A4 portrait; margin: 15mm 10mm 15mm 10mm; }
                html, body {
                    width: auto !important;
                    font-size: 14px !important;
                    padding: 0 !important;
                    margin: 0 !important;
                    background: #ffffff !important;
                    color: #000000 !important;
                }
                .receipt-print-section {
                    width: 100% !important;
                    max-width: 180mm !important;
                    padding: 10mm !important;
                    font-size: 14px !important;
                    border: 1px solid #ccc;
                    border-radius: 8px;
                    background: #ffffff !important;
                }
                #receipt-print-section *, .receipt-print-section * {
                    color: #000000 !important;
                }
                .receipt-items-table th, .receipt-items-table td {
                    font-size: 14px !important;
                    padding: 8px !important;
                }
            }
        `;
    }

    styleEl.innerHTML = css;
}

function setupStoreSettingsAndChartsListeners() {

    // 1. Checkbox إظهار اللوغو

    const showLogoCheckbox = document.getElementById("show-logo-receipt");

    if (showLogoCheckbox) {

        showLogoCheckbox.checked = appState.storeSettings.showLogoOnReceipt || false;

        showLogoCheckbox.addEventListener("change", (e) => {

            appState.storeSettings.showLogoOnReceipt = e.target.checked;

            saveToLocalStorage();

            showToast(e.target.checked ? "✅ تم تفعيل إظهار الشعار على الفواتير" : "❌ تم إيقاف إظهار الشعار على الفواتير");

        });

    }

    // 2. Select طابعة الفواتير

    const printerSelect = document.getElementById("store-printer-type");

    if (printerSelect) {

        printerSelect.value = appState.storeSettings.printerType || "A4";

        printerSelect.addEventListener("change", (e) => {

            appState.storeSettings.printerType = e.target.value;

            saveToLocalStorage();

            applyPrintStyles();

            showToast(`⚙️ تم تحديد نوع الطابعة: ${e.target.options[e.target.selectedIndex].text}`);

        });

    }
    
    // مستمع حقل نسبة فائدة عنصر آخر
    const customProfitInput = document.getElementById("settings-custom-profit-percent");
    if (customProfitInput) {
        customProfitInput.value = appState.storeSettings.customProfitPercent !== undefined ? appState.storeSettings.customProfitPercent : 20;
        customProfitInput.addEventListener("input", (e) => {
            const val = parseFloat(e.target.value);
            if (!isNaN(val) && val >= 0 && val <= 100) {
                appState.storeSettings.customProfitPercent = val;
                saveToLocalStorage();
            }
        });
    }

    // 3. رفع ملف اللوغو

    const storeLogoUpload = document.getElementById("store-logo-upload");

    if (storeLogoUpload) {

        storeLogoUpload.addEventListener("change", (e) => {

            handleStoreLogoUpload(e);

        });

    }

    // تحميل ومعاينة اللوغو على الواجهة عند تشغيل البرنامج

    const savedLogo = getShopLogo();

    if (savedLogo) {

        refreshStoreLogoPreview(savedLogo);

    }

    // 4. زر عرض المخططات البيانية

    const btnStatsCharts = document.getElementById("btn-show-stats-charts");

    if (btnStatsCharts) {

        btnStatsCharts.addEventListener("click", () => {

            renderStatsCharts();

        });

    }

}

function renderStatsCharts() {

    const container = document.getElementById("charts-wrapper-container");

    if (!container) return;

    if (container.classList.contains("hidden")) {

        container.classList.remove("hidden");

    } else {

        container.classList.add("hidden");

        return;

    }

    const transactions = appState.transactions || [];

    // --- 1. مخطط المبيعات والأرباح اليومية ---

    const dailyData = {};

    transactions.forEach(t => {

        const dateStr = new Date(t.timestamp).toLocaleDateString('en-CA');

        if (!dailyData[dateStr]) {

            dailyData[dateStr] = { sales: 0, profit: 0 };

        }

        dailyData[dateStr].sales += parseFloat(t.total) || 0;

        dailyData[dateStr].profit += parseFloat(t.profit) || 0;

    });

    const sortedDates = Object.keys(dailyData).sort();

    const salesValues = sortedDates.map(d => dailyData[d].sales);

    const profitValues = sortedDates.map(d => dailyData[d].profit);

    if (sortedDates.length === 0) {

        showToast("⚠️ لا توجد مبيعات مسجلة حتى الآن لتوليد المخططات!");

        container.classList.add("hidden");

        return;

    }

    const ctxTrend = document.getElementById("salesTrendChart").getContext("2d");

    if (salesTrendChartInstance) {

        salesTrendChartInstance.destroy();

    }

    const isDark = document.body.classList.contains("dark-theme") || document.body.classList.contains("dark");

    const textColor = isDark ? "#cbd5e1" : "#334155";

    const gridColor = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)";

    salesTrendChartInstance = new Chart(ctxTrend, {

        type: 'line',

        data: {

            labels: sortedDates.map(d => {

                const parts = d.split('-');

                return `${parts[2]}/${parts[1]}`;

            }),

            datasets: [

                {

                    label: 'إجمالي المبيعات (دج)',

                    data: salesValues,

                    borderColor: '#6366f1',

                    backgroundColor: 'rgba(99, 102, 241, 0.1)',

                    borderWidth: 3,

                    fill: true,

                    tension: 0.35,

                    pointBackgroundColor: '#6366f1',

                    pointRadius: 4

                },

                {

                    label: 'صافي الأرباح (دج)',

                    data: profitValues,

                    borderColor: '#10b981',

                    backgroundColor: 'rgba(16, 185, 129, 0.1)',

                    borderWidth: 3,

                    fill: true,

                    tension: 0.35,

                    pointBackgroundColor: '#10b981',

                    pointRadius: 4

                }

            ]

        },

        options: {

            responsive: true,

            maintainAspectRatio: false,

            plugins: {

                legend: {

                    labels: {

                        font: { family: 'Cairo', size: 11 },

                        color: textColor

                    }

                },

                tooltip: {

                    titleFont: { family: 'Cairo' },

                    bodyFont: { family: 'Cairo' }

                }

            },

            scales: {

                x: {

                    grid: { color: gridColor },

                    ticks: { font: { family: 'Cairo' }, color: textColor }

                },

                y: {

                    grid: { color: gridColor },

                    ticks: { font: { family: 'Cairo' }, color: textColor }

                }

            }

        }

    });

    // --- 2. مخطط أعلى 5 سلع مبيعاً ---

    const productQuantities = {};

    transactions.forEach(t => {

        t.items.forEach(item => {

            const name = item.name || "سلعة غير معرفة";

            if (!productQuantities[name]) {

                productQuantities[name] = 0;

            }

            productQuantities[name] += parseFloat(item.qty) || 0;

        });

    });

    const sortedProducts = Object.keys(productQuantities)

        .map(name => ({ name, qty: productQuantities[name] }))

        .sort((a, b) => b.qty - a.qty)

        .slice(0, 5);

    const productLabels = sortedProducts.map(p => p.name);

    const productQtyValues = sortedProducts.map(p => p.qty);

    const ctxTop = document.getElementById("topItemsChart").getContext("2d");

    if (topItemsChartInstance) {

        topItemsChartInstance.destroy();

    }

    topItemsChartInstance = new Chart(ctxTop, {

        type: 'bar',

        data: {

            labels: productLabels,

            datasets: [{

                label: 'الكمية المباعة',

                data: productQtyValues,

                backgroundColor: [

                    'rgba(244, 63, 94, 0.75)',

                    'rgba(249, 115, 22, 0.75)',

                    'rgba(234, 179, 8, 0.75)',

                    'rgba(59, 130, 246, 0.75)',

                    'rgba(139, 92, 246, 0.75)'

                ],

                borderColor: [

                    '#f43f5e', '#f97316', '#eab308', '#3b82f6', '#8b5cf6'

                ],

                borderWidth: 1.5,

                borderRadius: 6

            }]

        },

        options: {

            responsive: true,

            maintainAspectRatio: false,

            plugins: {

                legend: {

                    display: false

                },

                tooltip: {

                    titleFont: { family: 'Cairo' },

                    bodyFont: { family: 'Cairo' }

                }

            },

            scales: {

                x: {

                    grid: { display: false },

                    ticks: { font: { family: 'Cairo', size: 10 }, color: textColor }

                },

                y: {

                    grid: { color: gridColor },

                    ticks: { font: { family: 'Cairo' }, color: textColor }

                }

            }

        }

    });

    setTimeout(() => {

        container.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

    }, 150);

}

// ==========================================================================

// *** الوحدات الجديدة: الزبائن الدائمين، الصندوق، المصاريف، السجل الإداري ***

// ==========================================================================

// ---- دالة التهيئة الرئيسية للوحدات الجديدة (تُستدعى من main init) ----

function initNewModules() {

    // 1. ربط نموذج الزبائن

    const custForm = document.getElementById('customer-form');

    if (custForm) {

        custForm.addEventListener('submit', function(e) {

            e.preventDefault();

            saveCustomer();

        });

    }

    // 2. ربط نموذج الصندوق

    const cashForm = document.getElementById('opening-cash-form');

    if (cashForm) {

        cashForm.addEventListener('submit', function(e) {

            e.preventDefault();

            saveOpeningCash();

        });

    }

    // 3. ربط نموذج المصاريف

    const expForm = document.getElementById('expense-form');

    if (expForm) {

        expForm.addEventListener('submit', function(e) {

            e.preventDefault();

            saveExpense();

        });

    }

    // 4. ربط قائمة الزبون في POS

    const custSel = document.getElementById('pos-customer-select');

    if (custSel) {

        custSel.addEventListener('change', function() {

            const custId = this.value;

            if (custId) {

                const customer = (appState.customers || []).find(c => c.id === custId);

                if (customer) {

                    showToast('👤 الزبون: ' + customer.name + ' — دين حالي: ' + formatCurrency(customer.debt || 0));

                }

            }

        });

    }

    // مستمع تصفية الزبائن بالاسم ديناميكياً
    const custSearch = document.getElementById('pos-customer-search-input');
    if (custSearch) {
        custSearch.addEventListener('input', function() {
            renderCustomerSelectInPOS();
        });
    }

    // 5. تهيئة العداد وتحديث الواجهة

    _lastTransactionCount = (appState.transactions || []).length;

    renderCustomerSelectInPOS();

    renderCashBalanceSummary();

    // 6. ربط مودال كشف الحساب بزر الإغلاق

    const closeStmt = document.getElementById('btn-close-statement-modal');

    if (closeStmt) {

        closeStmt.addEventListener('click', function() {

            const m = document.getElementById('customer-statement-modal');

            if (m) m.classList.add('hidden');

        });

    }

    // 7. ربط حدث الضغط على زر الدفع لتسجيل الزبون

    document.addEventListener('click', function(e) {

        if (e.target.closest('#btn-checkout')) {

            setTimeout(checkAndRegisterCustomerDebt, 500);

        }

    });

    console.log('✅ الوحدات الجديدة جاهزة (زبائن، صندوق، مصاريف، سجل)');

}

// ---- التنقل بين تبويبات لوحة التحكم الفرعية ----

// deleted duplicate switchDashboardSubTab

// ---- إضافة سجل إداري ----

function addAdminLog(action, details) {

    if (!appState.adminLogs) appState.adminLogs = [];

    appState.adminLogs.unshift({

        id: 'LOG-' + Date.now().toString(16).toUpperCase(),

        timestamp: new Date().toISOString(),

        user: (appState.currentUser && appState.currentUser.displayName) ? appState.currentUser.displayName : 'النظام',

        action: action,

        details: details || ''

    });

    if (appState.adminLogs.length > 200) appState.adminLogs = appState.adminLogs.slice(0, 200);

}

// ---- عرض سجل التعديلات الإدارية ----

function renderAdminLogs() {

    const tbody = document.getElementById('admin-logs-tbody');

    if (!tbody) return;

    const logs = appState.adminLogs || [];

    if (logs.length === 0) {

        tbody.innerHTML = '<tr><td colspan="4" class="text-muted text-center" style="padding:30px">لا توجد سجلات إدارية حتى الآن.</td></tr>';

        return;

    }

    tbody.innerHTML = logs.map(function(log) {

        const date = new Date(log.timestamp).toLocaleString('ar-DZ', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

        return '<tr>' +

            '<td style="font-size:0.78rem;color:var(--text-muted)">' + date + '</td>' +

            '<td><strong style="color:var(--accent-color)">' + log.user + '</strong></td>' +

            '<td>' + log.action + '</td>' +

            '<td style="font-size:0.83rem;color:var(--text-muted);max-width:260px;overflow:hidden;text-overflow:ellipsis;" title="' + log.details + '">' + log.details + '</td>' +

            '</tr>';

    }).join('');

}

function clearAdminLogs() {

    if (!confirm('هل تريد مسح كافة السجلات الإدارية؟')) return;

    appState.adminLogs = [];

    saveToLocalStorage();

    renderAdminLogs();

    showToast('🗑️ تم مسح سجل العمليات بالكامل.');

}

// ==========================================================================

// ---- إدارة الزبائن الدائمين ----

// ==========================================================================

function saveCustomer() {

    const nameEl = document.getElementById('cust-name');

    const phoneEl = document.getElementById('cust-phone');

    const addressEl = document.getElementById('cust-address');

    const debtEl = document.getElementById('cust-initial-debt');

    const name = nameEl ? nameEl.value.trim() : '';

    const phone = phoneEl ? phoneEl.value.trim() : '';

    const address = addressEl ? addressEl.value.trim() : '';

    const initialDebt = parseFloat(debtEl ? debtEl.value : 0) || 0;

    if (!name) {

        showToast('⚠️ الرجاء إدخال اسم الزبون!');

        return;

    }

    if (!appState.customers) appState.customers = [];

    const existing = appState.customers.find(function(c) { return c.name === name; });

    if (existing) {

        showToast('⚠️ يوجد حساب بهذا الاسم بالفعل!');

        return;

    }

    const newCustomer = {

        id: 'CUST-' + Date.now().toString(16).toUpperCase(),

        name: name,

        phone: phone,

        address: address,

        debt: initialDebt,

        createdAt: new Date().toISOString(),

        transactions: []

    };

    if (initialDebt > 0) {

        newCustomer.transactions.push({

            id: 'CT-' + Date.now().toString(16).toUpperCase(),

            type: 'debt',

            amount: initialDebt,

            note: 'رصيد دين سابق عند فتح الحساب',

            date: new Date().toISOString()

        });

    }

    appState.customers.push(newCustomer);

    addAdminLog('إضافة زبون', 'تم فتح حساب للزبون: ' + name + (initialDebt > 0 ? ' — دين أولي: ' + formatCurrency(initialDebt) : ''));

    saveToLocalStorage();

    // تصفير النموذج

    if (nameEl) nameEl.value = '';

    if (phoneEl) phoneEl.value = '';

    if (addressEl) addressEl.value = '';

    if (debtEl) debtEl.value = '0';

    renderCustomersTable();

    renderCustomerSelectInPOS();

    showToast('✅ تم فتح حساب للزبون: ' + name + ' بنجاح!');

}

function renderCustomersTable() {

    const tbody = document.getElementById('customers-tbody');

    if (!tbody) return;

    if (!appState.customers) appState.customers = [];

    const query = (document.getElementById('cust-search-input') ? document.getElementById('cust-search-input').value.toLowerCase().trim() : '');

    const customers = appState.customers.filter(function(c) {

        return c.name.toLowerCase().includes(query) || (c.phone && c.phone.includes(query));

    });

    const totalDebt = appState.customers.reduce(function(sum, c) { return sum + (c.debt || 0); }, 0);

    const totalEl = document.getElementById('customers-total-debt');

    if (totalEl) totalEl.innerText = formatCurrency(totalDebt);

    if (customers.length === 0) {

        tbody.innerHTML = '<tr><td colspan="4" class="text-muted text-center" style="padding:30px">لا يوجد زبائن دائمين مسجلون بعد. أضف الأول من النموذج أعلاه.</td></tr>';

        return;

    }

    tbody.innerHTML = customers.map(function(c) {

        const debtColor = c.debt > 0 ? 'var(--color-danger)' : 'var(--color-success)';

        const debtText = c.debt > 0 ? formatCurrency(c.debt) : 'لا دين ✓';

        return '<tr>' +

            '<td><strong>' + c.name + '</strong>' + (c.address ? '<br><span style="font-size:0.78rem;color:var(--text-muted)">' + c.address + '</span>' : '') + '</td>' +

            '<td>' + (c.phone || '<span class="text-muted">â€”</span>') + '</td>' +

            '<td style="font-weight:800;color:' + debtColor + '">' + debtText + '</td>' +

            '<td>' +

                '<button class="btn-action-circle" onclick="openCustomerStatement(\'' + c.id + '\')" title="كشف الحساب" style="background:rgba(99,102,241,0.1);border-color:rgba(99,102,241,0.35);color:#818cf8;">' +

                    '<i class="fa-solid fa-file-lines"></i>' +

                '</button>' +

                '<button class="btn-action-circle edit" onclick="openAddDebtToCustomer(\'' + c.id + '\')" title="إضافة دين أو تسجيل دفعة">' +

                    '<i class="fa-solid fa-hand-holding-dollar"></i>' +

                '</button>' +

                '<button class="btn-action-circle delete" onclick="deleteCustomer(\'' + c.id + '\')" title="حذف الحساب">' +

                    '<i class="fa-solid fa-trash-can"></i>' +

                '</button>' +

            '</td>' +

            '</tr>';

    }).join('');

}

window.openCustomerStatement = function(customerId) {

    if (!appState.customers) return;

    const customer = appState.customers.find(function(c) { return c.id === customerId; });

    if (!customer) return;

    // إنشاء المودال إن لم يكن موجوداً

    if (!document.getElementById('customer-statement-modal')) {

        const modal = document.createElement('div');

        modal.id = 'customer-statement-modal';

        modal.style.cssText = 'position:fixed;inset:0;z-index:9999;background:rgba(0,0,0,0.75);display:flex;align-items:center;justify-content:center;padding:20px;';

        modal.innerHTML =

            '<div class="glass-card" style="width:100%;max-width:640px;max-height:88vh;overflow-y:auto;border-radius:18px;padding:28px;">' +

                '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;">' +

                    '<h3 style="font-weight:800;font-size:1.2rem;color:var(--accent-color);margin:0;"><i class="fa-solid fa-file-lines"></i> كشف حساب الزبون</h3>' +

                    '<button id="btn-close-statement-modal" style="background:rgba(244,63,94,0.15);border:none;color:#f43f5e;width:36px;height:36px;border-radius:50%;cursor:pointer;font-size:1.1rem;"><i class="fa-solid fa-xmark"></i></button>' +

                '</div>' +

                '<div style="display:flex;justify-content:space-between;align-items:center;padding:14px 18px;background:var(--accent-gradient);border-radius:12px;color:white;margin-bottom:20px;">' +

                    '<span style="font-weight:800;font-size:1.15rem;" id="stmt-customer-name">â€”</span>' +

                    '<div style="text-align:left;">' +

                        '<div style="font-size:0.78rem;opacity:0.85;">إجمالي الدين الحالي</div>' +

                        '<div style="font-size:1.4rem;font-weight:900;" id="stmt-total-debt">0.00 دج</div>' +

                    '</div>' +

                '</div>' +

                '<div class="table-responsive" style="max-height:380px;overflow-y:auto;">' +

                    '<table class="modern-table">' +

                        '<thead><tr><th>التاريخ</th><th>النوع</th><th>المبلغ</th><th>الملاحظة</th></tr></thead>' +

                        '<tbody id="stmt-transactions-tbody"><tr><td colspan="4" class="text-muted text-center">...</td></tr></tbody>' +

                    '</table>' +

                '</div>' +

                '<div style="display:flex;gap:10px;margin-top:18px;">' +

                    '<button onclick="openAddDebtToCustomer(\'' + customerId + '\')" style="flex:1;padding:10px;background:var(--accent-gradient);border:none;border-radius:10px;color:white;font-weight:700;cursor:pointer;font-family:inherit;">' +

                        '<i class="fa-solid fa-plus"></i> إضافة دين / دفعة' +

                    '</button>' +

                    '<button id="btn-close-statement-modal-2" style="padding:10px 18px;background:rgba(255,255,255,0.05);border:1px solid var(--glass-border);border-radius:10px;color:var(--text-main);font-weight:700;cursor:pointer;font-family:inherit;">إغلاق</button>' +

                '</div>' +

            '</div>';

        document.body.appendChild(modal);

        modal.addEventListener('click', function(e) { if (e.target === modal) modal.remove(); });

        document.getElementById('btn-close-statement-modal').addEventListener('click', function() { modal.remove(); });

        document.getElementById('btn-close-statement-modal-2').addEventListener('click', function() { modal.remove(); });

    }

    // ملء البيانات

    const modal = document.getElementById('customer-statement-modal');

    document.getElementById('stmt-customer-name').innerText = customer.name;

    const debtEl = document.getElementById('stmt-total-debt');

    debtEl.innerText = formatCurrency(customer.debt || 0);

    debtEl.style.color = (customer.debt > 0) ? '#f43f5e' : '#22c55e';

    const tbody = document.getElementById('stmt-transactions-tbody');

    const txs = customer.transactions || [];

    if (txs.length === 0) {

        tbody.innerHTML = '<tr><td colspan="4" class="text-muted text-center" style="padding:20px">لا توجد حركات مالية مسجلة.</td></tr>';

    } else {

        tbody.innerHTML = txs.slice().reverse().map(function(tx) {

            const date = new Date(tx.date).toLocaleString('ar-DZ', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

            const isDebt = (tx.type === 'debt');

            return '<tr>' +

                '<td style="font-size:0.8rem;color:var(--text-muted)">' + date + '</td>' +

                '<td style="color:' + (isDebt ? '#f43f5e' : '#22c55e') + ';font-weight:800;">' + (isDebt ? '+ دين' : '- دفع') + '</td>' +

                '<td style="font-weight:800">' + formatCurrency(tx.amount) + '</td>' +

                '<td style="font-size:0.82rem">' + (tx.note || 'â€”') + '</td>' +

                '</tr>';

        }).join('');

    }

    modal.style.display = 'flex';

};

window.openAddDebtToCustomer = function(customerId) {

    if (!appState.customers) return;

    const customer = appState.customers.find(function(c) { return c.id === customerId; });

    if (!customer) return;

    const amountStr = prompt(

        'الزبون: ' + customer.name + '\nالدين الحالي: ' + formatCurrency(customer.debt || 0) + '\n\nأدخل المبلغ:\n  • رقم موجب (+) = إضافة دين\n  • رقم سالب (-) = تسجيل دفعة / تسديد'

    );

    if (amountStr === null || amountStr.trim() === '') return;

    const amount = parseFloat(amountStr);

    if (isNaN(amount) || amount === 0) {

        showToast('⚠️ مبلغ غير صالح!');

        return;

    }

    const note = prompt('ملاحظة اختيارية (اضغط إلغاء للتجاوز):') || (amount > 0 ? 'دين مضاف' : 'دفعة مُسدَّدة');

    if (!customer.transactions) customer.transactions = [];

    customer.debt = (customer.debt || 0) + amount;

    customer.transactions.push({

        id: 'CT-' + Date.now().toString(16).toUpperCase(),

        type: amount > 0 ? 'debt' : 'payment',

        amount: Math.abs(amount),

        note: note,

        date: new Date().toISOString()

    });

    addAdminLog('تحديث حساب زبون', customer.name + ': ' + (amount > 0 ? 'دين +' : 'دفعة -') + formatCurrency(Math.abs(amount)));

    saveToLocalStorage();

    renderCustomersTable();

    renderCustomerSelectInPOS();

    showToast('✅ تم تحديث حساب ' + customer.name);

    // إعادة فتح كشف الحساب بعد التحديث

    const oldModal = document.getElementById('customer-statement-modal');

    if (oldModal) oldModal.remove();

    setTimeout(function() { window.openCustomerStatement(customerId); }, 100);

};

window.deleteCustomer = function(customerId) {

    if (!appState.customers) return;

    const customer = appState.customers.find(function(c) { return c.id === customerId; });

    if (!customer) return;

    if (!confirm('🚨 هل تريد حذف حساب الزبون: ' + customer.name + '؟\nسيتم حذف جميع سجلاته نهائياً.')) return;

    appState.customers = appState.customers.filter(function(c) { return c.id !== customerId; });

    addAdminLog('حذف زبون', 'تم حذف حساب: ' + customer.name);

    saveToLocalStorage();

    renderCustomersTable();

    renderCustomerSelectInPOS();

    showToast('🗑️ تم حذف حساب الزبون: ' + customer.name);

};

// ---- تحديث قائمة الزبون في POS ----

function renderCustomerSelectInPOS() {

    const sel = document.getElementById('pos-customer-select');

    if (!sel) return;

    const searchInput = document.getElementById("pos-customer-search-input");

    const query = searchInput ? searchInput.value.toLowerCase().trim() : "";

    const customers = appState.customers || [];

    const filtered = query === "" ? customers : customers.filter(c => c.name.toLowerCase().includes(query));

    sel.innerHTML = '<option value="">— بيع عادي (بدون حساب) —</option>' +

        filtered.map(function(c) {

            return '<option value="' + c.id + '">' + c.name + (c.debt > 0 ? ' (' + formatCurrency(c.debt) + ' دين)' : ' ✓') + '</option>';

        }).join('');

}

// ==========================================================================

// ---- إدارة الصندوق ورصيد بداية اليوم ----

// ==========================================================================

function saveOpeningCash() {

    const input = document.getElementById('opening-cash-input');

    const amount = parseFloat(input ? input.value : 0) || 0;

    if (amount < 0) { showToast('⚠️ الرجاء إدخال رصيد صحيح!'); return; }

    if (!appState.cashBalance) appState.cashBalance = [];

    const todayStr = new Date().toLocaleDateString('en-CA');

    appState.cashBalance = appState.cashBalance.filter(function(cb) { return cb.date !== todayStr; });

    appState.cashBalance.push({

        id: 'CB-' + Date.now().toString(16).toUpperCase(),

        date: todayStr,

        amount: amount,

        recordedBy: (appState.currentUser && appState.currentUser.displayName) ? appState.currentUser.displayName : 'النظام',

        timestamp: new Date().toISOString()

    });

    addAdminLog('تسجيل رصيد بداية', 'رصيد اليوم: ' + formatCurrency(amount));

    saveToLocalStorage();

    renderCashBalanceSummary();

    showToast('✅ تم حفظ رصيد الصندوق: ' + formatCurrency(amount));

}

function renderCashBalanceSummary() {

    const todayStr = new Date().toLocaleDateString('en-CA');

    const todayBalance = (appState.cashBalance || []).find(function(cb) { return cb.date === todayStr; });

    const openingAmount = todayBalance ? todayBalance.amount : 0;

    const input = document.getElementById('opening-cash-input');

    if (input && todayBalance) input.value = openingAmount;

    const todayTxs = (appState.transactions || []).filter(function(t) {

        return new Date(t.timestamp).toLocaleDateString('en-CA') === todayStr;

    });

    let cashSales = 0, debtSales = 0;

    todayTxs.forEach(function(t) {

        if (t.isDebt) { cashSales += (t.received || 0); debtSales += (t.debtAmount || 0); }

        else { cashSales += (t.total || 0); }

    });

    const todayExp = (appState.expenses || []).filter(function(ex) {

        return new Date(ex.timestamp).toLocaleDateString('en-CA') === todayStr;

    });

    const totalExp = todayExp.reduce(function(s, ex) { return s + (ex.amount || 0); }, 0);

    const actualDrawer = openingAmount + cashSales - totalExp;

    function upd(id, val) {

        const el = document.getElementById(id);

        if (el) el.innerText = formatCurrency(val);

    }

    upd('summary-opening-cash', openingAmount);

    upd('summary-cash-sales', cashSales);

    upd('summary-debt-sales', debtSales);

    upd('summary-expenses', totalExp);

    upd('summary-actual-drawer-cash', actualDrawer);

}

// ==========================================================================

// ---- إدارة المصاريف ----

// ==========================================================================

function saveExpense() {

    const amountEl = document.getElementById('exp-amount');
    const typeEl = document.getElementById('exp-type');
    const descEl = document.getElementById('exp-desc');

    const amount = parseFloat(amountEl ? amountEl.value : 0) || 0;
    const type = typeEl ? typeEl.value : 'other';
    const desc = descEl ? descEl.value.trim() : 'مصروف عام';

    if (amount <= 0) { 
        showToast('⚠️ يرجى إدخال قيمة المصروف!'); 
        return; 
    }

    if (!appState.expenses) appState.expenses = [];

    const typeLabels = { dead: 'ميتة / تالف', bills: 'دفع فواتير', salaries: 'رواتب موظفين', other: 'مصاريف عامة' };

    const newExpense = {
        id: 'EXP-' + Date.now().toString(16).toUpperCase(),
        timestamp: new Date().toISOString(),
        amount: amount,
        type: type,
        typeLabel: typeLabels[type] || type,
        desc: desc || 'مصروف عام',
        recordedBy: (appState.currentUser && appState.currentUser.displayName) ? appState.currentUser.displayName : 'النظام'
    };

    appState.expenses.push(newExpense);
    addAdminLog('تسجيل مصروف', (typeLabels[type] || 'مصروف') + ': ' + formatCurrency(amount) + (desc ? (' — ' + desc) : ''));

    saveToLocalStorage();

    if (amountEl) amountEl.value = '';
    if (descEl) descEl.value = '';

    renderExpensesTable();
    renderCashBalanceSummary();

    showToast('✅ تم تسجيل المصروف بقيمة: ' + formatCurrency(amount));
}

function renderExpensesTable() {

    const tbody = document.getElementById('expenses-tbody');

    if (!tbody) return;

    if (!appState.expenses) appState.expenses = [];

    const expenses = appState.expenses.slice().reverse();

    const total = appState.expenses.reduce(function(s, ex) { return s + (ex.amount || 0); }, 0);

    const totalEl = document.getElementById('expenses-total-sum');

    if (totalEl) totalEl.innerText = formatCurrency(total);

    if (expenses.length === 0) {

        tbody.innerHTML = '<tr><td colspan="6" class="text-muted text-center" style="padding:30px">لا توجد مصاريف مسجلة بعد.</td></tr>';

        return;

    }

    const typeColors = { dead: '#f43f5e', bills: '#f97316', salaries: '#8b5cf6', other: '#64748b' };

    tbody.innerHTML = expenses.map(function(ex) {

        const date = new Date(ex.timestamp).toLocaleString('ar-DZ', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

        const color = typeColors[ex.type] || '#64748b';

        return '<tr>' +

            '<td style="font-size:0.78rem;color:var(--text-muted)">' + date + '</td>' +

            '<td style="font-weight:800;color:var(--color-danger)">' + formatCurrency(ex.amount) + '</td>' +

            '<td><span style="background:' + color + '22;color:' + color + ';padding:3px 8px;border-radius:6px;font-size:0.78rem;font-weight:700">' + ex.typeLabel + '</span></td>' +

            '<td style="font-size:0.83rem">' + ex.desc + '</td>' +

            '<td style="font-size:0.78rem;color:var(--accent-color)">' + (ex.recordedBy || 'â€”') + '</td>' +

            '<td><button class="btn-action-circle delete" onclick="deleteExpense(\'' + ex.id + '\')" title="حذف المصروف"><i class="fa-solid fa-trash-can"></i></button></td>' +

            '</tr>';

    }).join('');

}

window.deleteExpense = function(expId) {

    if (!appState.expenses) return;

    const exp = appState.expenses.find(function(e) { return e.id === expId; });

    if (!exp) return;

    if (!confirm('هل تريد حذف هذا المصروف: ' + exp.typeLabel + ' — ' + formatCurrency(exp.amount) + '؟')) return;

    appState.expenses = appState.expenses.filter(function(e) { return e.id !== expId; });

    addAdminLog('حذف مصروف', exp.typeLabel + ': ' + formatCurrency(exp.amount) + ' — ' + exp.desc);

    saveToLocalStorage();

    renderExpensesTable();

    renderCashBalanceSummary();

    showToast('🗑️ تم حذف المصروف بنجاح.');

};

// ==========================================================================

// ---- تتبع الزبون الدائم بعد إتمام البيع ----

// ==========================================================================

let _lastTransactionCount = 0;

function checkAndRegisterCustomerDebt() {

    const currentCount = (appState.transactions || []).length;

    if (currentCount <= _lastTransactionCount) { _lastTransactionCount = currentCount; return; }

    const lastTx = appState.transactions[appState.transactions.length - 1];

    const sel = document.getElementById('pos-customer-select');

    if (sel && sel.value && lastTx) {

        const customer = (appState.customers || []).find(function(c) { return c.id === sel.value; });

        if (customer) {

            if (!customer.transactions) customer.transactions = [];

            customer.transactions.push({

                id: 'CT-' + Date.now().toString(16).toUpperCase(),

                type: 'sale',

                amount: lastTx.total,

                note: 'وصل #' + lastTx.id.slice(-6).toUpperCase(),

                date: lastTx.timestamp

            });

            sel.value = '';

            localStorage.setItem('smart_shop_state', JSON.stringify(appState));

            showToast('📒 تم تسجيل المبيعة على حساب ' + customer.name);

        }

    }

    _lastTransactionCount = currentCount;

}

// تمديد renderDashboardView لتحديث الصندوق والزبائن

const _origRDB = renderDashboardView;

window.renderDashboardView = function() {

    _origRDB();

    renderCashBalanceSummary();

    renderCustomerSelectInPOS();

};

// ---- (نهاية الوحدات الجديدة - الكود أعلاه هو المرجعي) ---

// ==========================================================================

// *** وحدة الميزان الإلكتروني (محاكاة) + إصلاح الطباعة ***

// ==========================================================================

(function setupScaleAndReceiptFixes() {

    // ---- 1. ربط زر الميزان بفتح نافذة المحاكاة ----

    document.addEventListener('click', function(e) {

        const scaleBtn = e.target.closest('#btn-read-scale');

        if (scaleBtn) {

            openScaleModal();

        }

        const closeScaleBtn = e.target.closest('#btn-close-scale-modal');

        if (closeScaleBtn) {

            const modal = document.getElementById('scale-simulator-modal');

            if (modal) modal.classList.add('hidden');

        }

        const confirmScaleBtn = e.target.closest('#btn-confirm-scale-weight');

        if (confirmScaleBtn) {

            applyScaleWeightToCart();

        }

    });

    // ---- 2. مزامنة إدخال الوزن المخصص مع شاشة الميزان ----

    document.addEventListener('input', function(e) {

        if (e.target.id === 'scale-custom-weight') {

            const val = parseFloat(e.target.value) || 0;

            updateScaleDisplay(val);

        }

    });

})();

// ---- فتح نافذة الميزان ----

function openScaleModal() {

    const modal = document.getElementById('scale-simulator-modal');

    if (!modal) return;

    // إذا لا توجد سلعة واحدة في القائمة المنسدلة، أعطِ تحذيراً

    const searchInput = document.getElementById('pos-search-input');

    // توليد وزن عشوائي لمحاكاة الميزان الحقيقي

    const simulatedKg = (Math.random() * 4.5 + 0.1).toFixed(3);

    updateScaleDisplay(parseFloat(simulatedKg));

    // ملء حقل الوزن المخصص بالوزن المحاكى

    const customInput = document.getElementById('scale-custom-weight');

    if (customInput) customInput.value = simulatedKg;

    // بدء محاكاة القراءة المتغيرة (وميض رقمي)

    startScaleSimulation();

    modal.classList.remove('hidden');

}

// ---- تحديث شاشة الميزان الرقمية ----

function updateScaleDisplay(kg) {

    const display = document.getElementById('scale-display');

    if (!display) return;

    if (kg >= 1) {

        display.innerText = kg.toFixed(3) + ' KG';

    } else {

        display.innerText = (kg * 1000).toFixed(0) + ' g';

    }

}

// ---- تحديد وزن من الأزرار السريعة ----

window.setSimulatedWeight = function(kg) {

    updateScaleDisplay(kg);

    const customInput = document.getElementById('scale-custom-weight');

    if (customInput) customInput.value = kg.toFixed(3);

    // إضاءة الزر المضغوط

    document.querySelectorAll('#scale-simulator-modal .btn-num').forEach(function(btn) {

        btn.style.background = '';

        btn.style.color = '';

    });

    event.target.style.background = 'linear-gradient(135deg, #10b981, #059669)';

    event.target.style.color = 'white';

};

// ---- محاكاة قراءة حية للميزان ----

var _scaleSimTimer = null;

function startScaleSimulation() {

    if (_scaleSimTimer) clearInterval(_scaleSimTimer);

    var base = parseFloat(document.getElementById('scale-custom-weight')?.value) || 1.5;

    var steps = 0;

    var display = document.getElementById('scale-display');

    if (!display) return;

    // محاكاة تذبذب القراءة ثم استقرارها

    _scaleSimTimer = setInterval(function() {

        steps++;

        if (steps < 8) {

            // تذبذب عشوائي

            var noise = (Math.random() - 0.5) * 0.05;

            updateScaleDisplay(Math.max(0.001, base + noise));

        } else {

            // استقرار على القيمة النهائية

            updateScaleDisplay(base);

            clearInterval(_scaleSimTimer);

            _scaleSimTimer = null;

        }

    }, 120);

}

// ---- تطبيق الوزن على سلة البيع ----

function applyScaleWeightToCart() {

    const customInput = document.getElementById('scale-custom-weight');

    const weightKg = parseFloat(customInput ? customInput.value : 0);

    if (!weightKg || weightKg <= 0) {

        showToast('⚠️ الرجاء إدخال وزن صحيح!');

        return;

    }

    // البحث عن أول منتج مُحدَّد بنوع الوحدة "كغ" في القائمة

    const searchQuery = document.getElementById('pos-search-input')?.value.trim();

    // البحث عن منتج مناسب للوزن

    let matchedProduct = null;

    if (searchQuery) {

        matchedProduct = (appState.products || []).find(function(p) {

            return p.name.toLowerCase().includes(searchQuery.toLowerCase()) &&

                   (p.unit === 'كغ' || p.unit === 'kg' || p.unit === 'KG' || p.unit === 'غ');

        });

    }

    // إذا لم نجد بالبحث، ابحث عن أي منتج بالوزن

    if (!matchedProduct) {

        matchedProduct = (appState.products || []).find(function(p) {

            return p.unit === 'كغ' || p.unit === 'kg' || p.unit === 'KG';

        });

    }

    if (matchedProduct) {

        // أضف المنتج للسلة بالوزن المقروء

        addToCart(matchedProduct.id, weightKg);

        showToast('⚖️ تم إضافة ' + matchedProduct.name + ': ' + weightKg + ' كغ × ' + formatCurrency(matchedProduct.sellPrice) + '/كغ = ' + formatCurrency(weightKg * matchedProduct.sellPrice));

    } else {

        // إذا لم يوجد منتج بالوزن، أخبر المستخدم بتحديد السلعة أولاً

        showToast('💡 ابحث عن السلعة أولاً في حقل البحث، ثم استخدم الميزان لتحديد وزنها.');

        // ملء حقل الكمية المخصص بالوزن

        const qtyInput = document.getElementById('pos-custom-qty-input') || document.getElementById('quick-qty-input');

        if (qtyInput) {

            qtyInput.value = weightKg;

            showToast('⚖️ تم تعيين الكمية: ' + weightKg + ' كغ — اختر السلعة الآن');

        }

    }

    // إغلاق النافذة

    const modal = document.getElementById('scale-simulator-modal');

    if (modal) modal.classList.add('hidden');

    if (_scaleSimTimer) { clearInterval(_scaleSimTimer); _scaleSimTimer = null; }

}

// ==========================================================================

// *** إصلاح الوصل: إظهار اسم الزبون عند الطباعة ***

// ==========================================================================

// تمديد preparePrintReceipt لإضافة اسم الزبون من POS

const _origPreparePrint = preparePrintReceipt;

window.preparePrintReceipt = function(transaction) {

    _origPreparePrint(transaction);

    // اسم الزبون (من قائمة POS أو من المعاملة)

    const custLine = document.getElementById('receipt-customer-line');

    const custName = document.getElementById('receipt-customer-name');

    if (custLine && custName) {

        // نحاول استرجاع اسم الزبون المرتبط بالمعاملة

        let customerName = '';

        if (transaction.customerId) {

            const customer = (appState.customers || []).find(function(c) {

                return c.id === transaction.customerId;

            });

            if (customer) customerName = customer.name;

        }

        if (customerName) {

            custName.innerText = customerName;

            custLine.style.display = 'block';

        } else {

            custLine.style.display = 'none';

        }

    }

};

// تسجيل الزبون في المعاملة عند البيع

const _origProcessCheckoutForCustomer = processCheckout;

window.processCheckout = function(shouldPrint = false) {

    // نحفظ الزبون المختار قبل إتمام البيع

    const sel = document.getElementById('pos-customer-select');

    if (sel && sel.value) {

        window._pendingCustomerId = sel.value;

    } else {

        window._pendingCustomerId = '';

    }

    _origProcessCheckoutForCustomer(shouldPrint);

};

// بعد إتمام البيع، نُضيف customerId للمعاملة الأخيرة

document.addEventListener('click', function(e) {

    if (e.target.closest('#btn-checkout')) {

        setTimeout(function() {

            if (window._pendingCustomerId && appState.transactions && appState.transactions.length > 0) {

                const lastTx = appState.transactions[appState.transactions.length - 1];

                if (lastTx && !lastTx.customerId) {

                    lastTx.customerId = window._pendingCustomerId;

                    localStorage.setItem('smart_shop_state', JSON.stringify(appState));

                }

            }

        }, 600);

    }

});

// ==========================================================================

// *** نظام شبكة POS المتطور: صور + ألوان + سحب وإسقاط + ثبات الترتيب ***

// ==========================================================================

// ---- معالجة رفع صورة المنتج ----

window.handleProdImageUpload = function(event) {
    const file = (event.target && event.target.files) ? event.target.files[0] : null;
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        const base64 = e.target.result;

        const imgData = document.getElementById('prod-image-data');
        if (imgData) imgData.value = base64;

        const preview = document.getElementById('prod-image-preview');
        const placeholder = document.getElementById('prod-image-placeholder');
        const removeBtn = document.getElementById('btn-remove-prod-image');

        if (preview) { preview.src = base64; preview.style.display = 'block'; }
        if (placeholder) placeholder.style.display = 'none';
        if (removeBtn) removeBtn.style.display = 'inline-flex';
    };

    reader.readAsDataURL(file);
};

window.removeProdImage = function() {
    const imgData = document.getElementById('prod-image-data');
    if (imgData) imgData.value = '';

    const preview = document.getElementById('prod-image-preview');
    const placeholder = document.getElementById('prod-image-placeholder');
    const removeBtn = document.getElementById('btn-remove-prod-image');

    if (preview) { preview.src = ''; preview.style.display = 'none'; }
    if (placeholder) placeholder.style.display = 'block';
    if (removeBtn) removeBtn.style.display = 'none';

    const imgUpload = document.getElementById('prod-image-upload');
    if (imgUpload) imgUpload.value = '';
};

// ---- اختيار لون البطاقة ----

window.selectProductColor = function(color) {
    const colorInput = document.getElementById('prod-card-color');
    if (colorInput) colorInput.value = color || '';

    document.querySelectorAll('.btn-color-pick').forEach(function(btn) {
        btn.style.outline = '';
        btn.style.outlineOffset = '';
    });

    if (color) {
        const activeBtn = document.querySelector(`.btn-color-pick[data-color="${color}"]`);
        if (activeBtn) {
            activeBtn.style.outline = '3px solid var(--accent-color)';
            activeBtn.style.outlineOffset = '2px';
        }
    }
};

// ---- إعادة كتابة renderPosProducts لالكامل مع الدعم الكامل ----

window.renderPosProducts = function() {

    const productsGrid = document.getElementById('pos-products-grid');

    if (!productsGrid) return;

    const activeCat = document.querySelector('.pos-categories .cat-pill.active')?.getAttribute('data-category') || 'all';

    const searchQuery = document.getElementById('pos-search-input')?.value.toLowerCase().trim() || '';

    // تصفية السلع

    let filteredProducts = appState.products.filter(function(p) {

        const matchesCategory = activeCat === 'all' || p.category === activeCat;

        const matchesSearch = p.name.toLowerCase().includes(searchQuery) || (p.barcode && p.barcode.includes(searchQuery));

        return matchesCategory && matchesSearch;

    });

    // تطبيق ترتيب محفوظ إن وجد

    const orderKey = 'pos_product_order_' + activeCat;

    const savedOrder = appState.productGridOrder && appState.productGridOrder[orderKey];

    if (savedOrder && savedOrder.length > 0) {

        const orderMap = {};

        savedOrder.forEach(function(id, idx) { orderMap[id] = idx; });

        filteredProducts.sort(function(a, b) {

            const ai = orderMap[a.id] !== undefined ? orderMap[a.id] : 9999;

            const bi = orderMap[b.id] !== undefined ? orderMap[b.id] : 9999;

            return ai - bi;

        });

    }

    if (filteredProducts.length === 0) {

        productsGrid.innerHTML = '<div class="text-center text-muted" style="grid-column:1/-1;padding:40px 0">لا توجد سلع مطابقة للبحث.</div>';

        return;

    }

    productsGrid.innerHTML = filteredProducts.map(function(p) {

        const qty = parseFloat(p.qty) || 0;

        let cardClass = 'pos-product-card';

        if (qty <= 0) cardClass += ' out-of-stock';

        else if (qty <= 5) cardClass += ' low-stock';

        const bgStyle = p.cardColor ? 'background:' + p.cardColor + ';border-color:' + p.cardColor + '88;' : '';

        const imageHtml = p.image

            ? '<div style="width:52px;height:52px;border-radius:8px;overflow:hidden;margin-bottom:6px;flex-shrink:0;"><img src="' + p.image + '" style="width:100%;height:100%;object-fit:cover;" alt=""></div>'

            : (p.emoji ? '<div style="font-size:2rem;line-height:1;margin-bottom:4px;">' + p.emoji + '</div>' : '');

        return '<div class="' + cardClass + '" data-id="' + p.id + '" draggable="true" style="' + bgStyle + '">' +

            imageHtml +

            '<span class="name" style="font-size:0.82rem;font-weight:700;line-height:1.2;text-align:center;word-break:break-word;">' + p.name + '</span>' +

            '<div style="display:flex;flex-direction:column;align-items:center;gap:2px;margin-top:4px;">' +

                '<span class="price" style="font-size:0.88rem;font-weight:800;">' + formatCurrency(p.sellPrice) + '</span>' +

                '<span class="stock" style="font-size:0.68rem;opacity:0.7;">المتبقي: ' + p.qty + ' ' + (p.unit||'').substring(0,3) + '</span>' +

            '</div>' +

        '</div>';

    }).join('');

    // ربط أحداث الضغط

    productsGrid.querySelectorAll('.pos-product-card').forEach(function(card) {

        card.addEventListener('click', function(e) {

            if (card.classList.contains('dragging')) return;

            e.stopPropagation();

            const prodId = card.getAttribute('data-id');

            const product = appState.products.find(function(p) { return p.id === prodId; });

            if (product) window.openQuickQtyModalForProduct(product);

        });

    });

    // تفعيل السحب والإسقاط

    enableDragAndDrop(productsGrid, activeCat);

};

// ---- نظام السحب والإسقاط ----

function enableDragAndDrop(grid, activeCat) {

    let dragSrcEl = null;

    grid.querySelectorAll('.pos-product-card').forEach(function(card) {

        card.addEventListener('dragstart', function(e) {

            dragSrcEl = card;

            card.classList.add('dragging');

            e.dataTransfer.effectAllowed = 'move';

            e.dataTransfer.setData('text/plain', card.getAttribute('data-id'));

        });

        card.addEventListener('dragend', function() {

            card.classList.remove('dragging');

            grid.querySelectorAll('.pos-product-card').forEach(function(c) { c.classList.remove('drag-over'); });

            // حفظ الترتيب الجديد

            saveProductGridOrder(grid, activeCat);

        });

        card.addEventListener('dragover', function(e) {

            e.preventDefault();

            e.dataTransfer.dropEffect = 'move';

            if (card !== dragSrcEl) {

                grid.querySelectorAll('.pos-product-card').forEach(function(c) { c.classList.remove('drag-over'); });

                card.classList.add('drag-over');

            }

        });

        card.addEventListener('drop', function(e) {

            e.preventDefault();

            if (dragSrcEl && dragSrcEl !== card) {

                // إعادة ترتيب DOM

                const allCards = [...grid.querySelectorAll('.pos-product-card')];

                const srcIndex = allCards.indexOf(dragSrcEl);

                const dstIndex = allCards.indexOf(card);

                if (srcIndex < dstIndex) {

                    card.parentNode.insertBefore(dragSrcEl, card.nextSibling);

                } else {

                    card.parentNode.insertBefore(dragSrcEl, card);

                }

                card.classList.remove('drag-over');

            }

        });

    });

}

// ---- حفظ ترتيب المنتجات ----

function saveProductGridOrder(grid, activeCat) {

    if (!appState.productGridOrder) appState.productGridOrder = {};

    const orderKey = 'pos_product_order_' + activeCat;

    const ids = [...grid.querySelectorAll('.pos-product-card')].map(function(c) { return c.getAttribute('data-id'); });

    appState.productGridOrder[orderKey] = ids;

    saveToLocalStorage();

    showToast('✅ تم حفظ ترتيب المنتجات');

}

// ==========================================================================

// *** نظام إقفال اليوم والتقارير اليومية ***

// ==========================================================================

// ---- تهيئة closedDays في appState ----

(function initClosedDays() {

    if (!appState.closedDays) appState.closedDays = [];

})();

// ---- إقفال يوم البيع ----

window.closeBusinessDay = function() {

    if (!confirm('🔒 هل تريد إقفال يوم البيع الحالي؟\n\nسيتم تجميد جميع الإحصائيات والتقارير الحالية وحفظها كيوم منفصل.\n\nلا يمكن التراجع عن هذا الإجراء.')) return;

    const now = new Date();

    const dayLabel = now.toLocaleDateString('ar-DZ', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

    const dayKey = now.toLocaleDateString('en-CA');

    // جمع إحصائيات اليوم

    const todayTxs = (appState.transactions || []).filter(function(t) {

        const txDate = new Date(t.timestamp).toLocaleDateString('en-CA');

        // نشمل كل المعاملات التي لم تُقفَل بعد

        return !t.closedDay;

    });

    const totalSales = todayTxs.reduce(function(s, t) { return s + (t.total || 0); }, 0);

    const totalProfit = todayTxs.reduce(function(s, t) { return s + (t.profit || 0); }, 0);

    const totalCount = todayTxs.length;

    const totalDebts = (appState.debts || []).reduce(function(s, d) { return s + (d.remaining || d.amount || 0); }, 0);

    const totalExpenses = (appState.expenses || []).reduce(function(s, e) {

        return new Date(e.timestamp).toLocaleDateString('en-CA') === dayKey ? s + (e.amount || 0) : s;

    }, 0);

    const closedDayRecord = {

        id: 'DAY-' + Date.now().toString(16).toUpperCase(),

        label: dayLabel,

        date: dayKey,

        closedAt: now.toISOString(),

        closedBy: (appState.currentUser && appState.currentUser.displayName) ? appState.currentUser.displayName : 'المدير',

        totalSales: totalSales,

        totalProfit: totalProfit,

        totalCount: totalCount,

        totalDebts: totalDebts,

        totalExpenses: totalExpenses,

        netCash: totalSales - totalExpenses,

        transactionIds: todayTxs.map(function(t) { return t.id; })

    };

    if (!appState.closedDays) appState.closedDays = [];

    appState.closedDays.unshift(closedDayRecord);

    // وسم المعاملات بأنها مُقفَلة

    todayTxs.forEach(function(t) { t.closedDay = closedDayRecord.id; });

    if (typeof addAdminLog === 'function') {

        addAdminLog('إقفال يوم البيع', dayLabel + ' — مبيعات: ' + formatCurrency(totalSales) + ' — فائدة: ' + formatCurrency(totalProfit));

    }

    saveToLocalStorage();

    renderClosedDaysTable();

    if (typeof renderReportsView === 'function') renderReportsView();

    showToast('🔒 تم إقفال يوم البيع بنجاح! ' + dayLabel);

};

// ---- عرض جدول الأيام المقفلة ----

function renderClosedDaysTable() {

    const tbody = document.getElementById('closed-days-tbody');

    if (!tbody) return;

    const days = appState.closedDays || [];

    if (days.length === 0) {

        tbody.innerHTML = '<tr><td colspan="7" class="text-muted text-center" style="padding:30px">لا توجد أيام مقفلة بعد. اضغط "إقفال يوم البيع" عند نهاية كل يوم عمل.</td></tr>';

        return;

    }

    tbody.innerHTML = days.map(function(day) {

        return '<tr>' +

            '<td style="font-weight:700;color:var(--accent-color)">' + day.label + '</td>' +

            '<td style="font-weight:800;color:var(--color-success)">' + formatCurrency(day.totalSales) + '</td>' +

            '<td style="font-weight:800;color:#22d3ee">' + formatCurrency(day.totalProfit) + '</td>' +

            '<td>' + day.totalCount + ' عملية</td>' +

            '<td style="color:var(--color-danger)">' + formatCurrency(day.totalDebts) + '</td>' +

            '<td style="color:#f97316">' + formatCurrency(day.totalExpenses) + '</td>' +

            '<td style="font-size:0.75rem;color:var(--text-muted)">' + day.closedBy + '</td>' +

        '</tr>';

    }).join('');

}

// ---- حفظ التقرير اليومي كملف ----

window.exportClosedDayReport = function(dayId) {

    const day = (appState.closedDays || []).find(function(d) { return d.id === dayId; });

    if (!day) return;

    const report = [

        'â•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گ',

        '   تقرير يوم البيع المقفل',

        'â•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گ',

        'التاريخ: ' + day.label,

        'الوقت الإقفال: ' + new Date(day.closedAt).toLocaleString('ar-DZ'),

        'أقفله: ' + day.closedBy,

        'â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€',

        'إجمالي المبيعات: ' + formatCurrency(day.totalSales),

        'إجمالي الفائدة: ' + formatCurrency(day.totalProfit),

        'عدد العمليات: ' + day.totalCount,

        'إجمالي الديون: ' + formatCurrency(day.totalDebts),

        'إجمالي المصاريف: ' + formatCurrency(day.totalExpenses),

        'الصافي النقدي: ' + formatCurrency(day.netCash),

        'â•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گ'

    ].join('\n');

    const blob = new Blob([report], { type: 'text/plain;charset=utf-8' });

    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');

    a.href = url;

    a.download = 'تقرير_' + day.date + '.txt';

    a.click();

    URL.revokeObjectURL(url);

};

// ---- تهيئة جدول الأيام المقفلة عند تحميل التبويب ----

document.addEventListener('click', function(e) {

    const tab = e.target.closest('[data-tab="reports"]') || e.target.closest('#tab-reports');

    if (tab) {

        setTimeout(function() { renderClosedDaysTable(); }, 100);

    }

});

// ---- حقن أنماط CSS للميزات الجديدة ----

(function injectNewStyles() {

    const style = document.createElement('style');

    style.textContent = `

        /* بطاقة المنتج في شبكة POS */

        #pos-products-grid .pos-product-card {

            display: flex;

            flex-direction: column;

            align-items: center;

            justify-content: center;

            padding: 10px 6px;

            border-radius: 12px;

            border: 1.5px solid var(--glass-border);

            background: var(--bg-secondary);

            cursor: pointer;

            transition: transform 0.15s, box-shadow 0.15s;

            user-select: none;

            min-height: 90px;

            text-align: center;

        }

        #pos-products-grid .pos-product-card:hover {

            transform: translateY(-2px);

            box-shadow: 0 6px 20px rgba(0,0,0,0.25);

            border-color: var(--accent-color);

        }

        #pos-products-grid .pos-product-card.out-of-stock {

            opacity: 0.45;

            filter: grayscale(0.6);

        }

        #pos-products-grid .pos-product-card.low-stock {

            border-color: rgba(249,115,22,0.5);

        }

        /* حالة السحب */

        #pos-products-grid .pos-product-card.dragging {

            opacity: 0.4;

            transform: scale(0.95);

            box-shadow: none;

        }

        #pos-products-grid .pos-product-card.drag-over {

            border: 2px dashed var(--accent-color) !important;

            background: rgba(99,102,241,0.08);

            transform: scale(1.03);

        }

        /* أنماط اختيار اللون */

        .btn-color-pick:hover {

            transform: scale(1.15);

            transition: transform 0.15s;

        }

        /* تحسين POS quick side */

        #pos-quick-shortcuts {

            display: flex !important;

            flex-direction: column;

            overflow: hidden;

            max-height: calc(100vh - 160px);

        }

        #pos-products-view, #pos-quick-view {

            min-height: 0;

        }

        /* التقارير اليومية المقفلة */

        #closed-days-tbody tr:hover {

            background: rgba(99,102,241,0.06);

        }

    `;

    document.head.appendChild(style);

})();

// ==========================================================================

// *** نظام إدارة وتعديل وحذف المبيعات اليومية (إرجاع السلع وتحديث المخزن) ***

// ==========================================================================

// 1. فتح نافذة عرض مبيعات اليوم

window.openTodaySalesModal = function() {

    const modal = document.getElementById("today-sales-modal");

    if (modal) {

        modal.classList.remove("hidden");

        renderTodaySalesTable();

    }

};

// 2. إغلاق نافذة مبيعات اليوم

window.closeTodaySalesModal = function() {

    const modal = document.getElementById("today-sales-modal");

    if (modal) modal.classList.add("hidden");

};

// 3. رندرة جدول مبيعات اليوم الحالي

function renderTodaySalesTable() {

    const tbody = document.getElementById("today-sales-tbody");

    if (!tbody) return;

    const todayStr = new Date().toDateString();

    // تصفية المعاملات التي تمت اليوم فقط

    const todayTxs = (appState.transactions || []).filter(t => {

        return new Date(t.timestamp).toDateString() === todayStr;

    });

    if (todayTxs.length > 0) {

        tbody.innerHTML = todayTxs.map(t => {

            const timeStr = new Date(t.timestamp).toLocaleTimeString('ar-DZ', { hour: '2-digit', minute: '2-digit' });

            // تحديد اسم العميل

            let customerName = "👤 عميل عابر";

            if (t.customerId) {

                const customer = (appState.customers || []).find(c => c.id === t.customerId);

                if (customer) customerName = `ًں‘¤ ${customer.name}`;

            }

            const totalQty = t.items.reduce((sum, item) => sum + (parseFloat(item.qty) || 0), 0);

            return `

                <tr>

                    <td class="font-weight-bold text-info">#${t.id.slice(-6).toUpperCase()}</td>

                    <td>${timeStr}</td>

                    <td>${customerName}</td>

                    <td><strong>${totalQty}</strong> قطعة</td>

                    <td class="text-success font-weight-bold">${formatCurrency(t.total)}</td>

                    <td class="text-info">${formatCurrency(t.profit)}</td>

                    <td style="display: flex; gap: 6px;">

                        <button class="btn-secondary-xs" onclick="openTxDetailsModal('${t.id}')" title="عرض السلع المبيعة وإرجاع بعضها" style="padding: 4px 8px; font-size: 0.72rem; border-radius: 6px;">

                            <i class="fa-solid fa-eye"></i> التفاصيل

                        </button>

                        <button class="btn-danger-xs" onclick="deleteTransactionFully('${t.id}')" title="إلغاء المعاملة بالكامل وإعادة السلع للمخزن" style="padding: 4px 8px; font-size: 0.72rem; border-radius: 6px; background:#ef4444; color:white;">

                            <i class="fa-solid fa-trash-can"></i> إرجاع كلي

                        </button>

                    </td>

                </tr>

            `;

        }).join("");

    } else {

        tbody.innerHTML = `

            <tr>

                <td colspan="7" class="text-muted text-center py-4">

                    <i class="fa-solid fa-receipt" style="font-size: 2rem; opacity: 0.3; display: block; margin-bottom: 8px;"></i>

                    لا توجد عمليات مبيعات مسجلة لليوم الحالي بعد.

                </td>

            </tr>

        `;

    }

}

// 4. فتح نافذة تفاصيل المعاملة للتحكم الفردي بالسلع

window.openTxDetailsModal = function(txId) {

    const modal = document.getElementById("tx-details-modal");

    if (!modal) return;

    const tx = (appState.transactions || []).find(t => t.id === txId);

    if (!tx) return;

    const titleEl = document.getElementById("tx-details-title");

    if (titleEl) titleEl.innerHTML = `📋 تفاصيل فاتورة مبيعات <span class="text-info">#${tx.id.slice(-6).toUpperCase()}</span>`;

    const tbody = document.getElementById("tx-details-tbody");

    if (tbody) {

        tbody.innerHTML = tx.items.map(item => {

            const total = (parseFloat(item.qty) || 0) * (parseFloat(item.sellPrice) || 0);

            return `

                <tr>

                    <td><strong>${item.name}</strong></td>

                    <td><strong>${item.qty}</strong> ${item.unit || 'قطعة'}</td>

                    <td>${formatCurrency(item.sellPrice)}</td>

                    <td class="text-success font-weight-bold">${formatCurrency(total)}</td>

                    <td>

                        <button class="btn-danger-xs" onclick="returnSingleItemFromTransaction('${tx.id}', '${item.productId}')" style="padding: 4px 8px; font-size: 0.7rem; border-radius: 6px; background: rgba(239,68,68,0.1); border: 1px solid rgba(239,68,68,0.25); color: #f87171;" title="إرجاع هذه السلعة فقط للمخزن">

                            <i class="fa-solid fa-undo"></i> إرجاع السلعة

                        </button>

                    </td>

                </tr>

            `;

        }).join("");

    }

    modal.classList.remove("hidden");

};

// 5. إغلاق نافذة تفاصيل العملية

window.closeTxDetailsModal = function() {

    const modal = document.getElementById("tx-details-modal");

    if (modal) modal.classList.add("hidden");

};

// 6. إرجاع وإلغاء المعاملة بالكامل وتحديث المخزن والأرباح

window.deleteTransactionFully = function(txId) {

    const txIndex = (appState.transactions || []).findIndex(t => t.id === txId);

    if (txIndex === -1) return;

    const tx = appState.transactions[txIndex];

    const confirmDelete = confirm(`⚠️ هل أنت متأكد من رغبتك في إلغاء المعاملة #${tx.id.slice(-6).toUpperCase()} بالكامل وإرجاع كافة سلعها للمخزن؟`);

    if (!confirmDelete) return;

    // إعادة السلع إلى المخزن

    tx.items.forEach(item => {

        const prod = (appState.products || []).find(p => p.id === item.productId);

        if (prod) {

            prod.qty = (parseFloat(prod.qty) || 0) + (parseFloat(item.qty) || 0);

        }

    });

    // حذف المعاملة من سجل التخزين

    appState.transactions.splice(txIndex, 1);

    saveToLocalStorage();

    refreshUI();

    renderTodaySalesTable();

    showToast("🟢 تم إلغاء المعاملة بالكامل وإعادة البضائع للمخزن بنجاح وتحديث الأرباح!");

};

// 7. إرجاع سلعة واحدة فقط من الفاتورة وتعديل قيمتها وأرباحها

window.returnSingleItemFromTransaction = function(txId, productId) {

    const tx = (appState.transactions || []).find(t => t.id === txId);

    if (!tx) return;

    const itemIndex = tx.items.findIndex(item => item.productId === productId);

    if (itemIndex === -1) return;

    const item = tx.items[itemIndex];

    // سؤال المستخدم عن الكمية التي يريد إرجاعها

    const maxQty = parseFloat(item.qty) || 0;

    const inputQty = prompt(`الكمية المباعة هي [ ${maxQty} ]. أدخل الكمية المراد إرجاعها للمخزن:`, maxQty);

    if (inputQty === null) return; // إلغاء الإجراء

    const returnQty = parseFloat(inputQty);

    if (isNaN(returnQty) || returnQty <= 0 || returnQty > maxQty) {

        alert("⚠️ يرجى إدخال كمية صحيحة لا تتعدى الكمية المباعة بالفاتورة!");

        return;

    }

    // 1. إعادة الكمية المرتجعة للمخزن

    const prod = (appState.products || []).find(p => p.id === productId);

    if (prod) {

        prod.qty = (parseFloat(prod.qty) || 0) + returnQty;

    }

    // 2. تعديل المعاملة

    const buyPrice = parseFloat(item.buyPrice) || 0;

    const sellPrice = parseFloat(item.sellPrice) || 0;

    // المبالغ المطلوب خصمها من الفاتورة

    const totalToDeduct = returnQty * sellPrice;

    const profitToDeduct = returnQty * (sellPrice - buyPrice);

    tx.total = Math.max(0, (parseFloat(tx.total) || 0) - totalToDeduct);

    tx.profit = Math.max(0, (parseFloat(tx.profit) || 0) - profitToDeduct);

    if (returnQty === maxQty) {

        // إذا أرجع كل الكمية، نحذف السلعة بالكامل من الفاتورة

        tx.items.splice(itemIndex, 1);

    } else {

        // إذا أرجع جزءاً منها، نخصم من الكمية فقط

        item.qty = maxQty - returnQty;

    }

    // إذا أصبحت الفاتورة فارغة تماماً بدون أي سلع، نحذف الفاتورة بالكامل

    if (tx.items.length === 0) {

        const txIndex = appState.transactions.findIndex(t => t.id === txId);

        if (txIndex !== -1) appState.transactions.splice(txIndex, 1);

        closeTxDetailsModal();

    } else {

        // إعادة فتح التفاصيل لتحديث العرض

        openTxDetailsModal(txId);

    }

    saveToLocalStorage();

    refreshUI();

    renderTodaySalesTable();

    showToast(`↩️ تم إرجاع [ ${returnQty} ] من السلعة [ ${item.name} ] بنجاح وتحديث المخزن والربح!`);

};

// ==========================================================================

// *** نظام إدارة وحركة النافذة المنبثقة للسلع (Product Modal / Draggable) ***

// ==========================================================================

window.openAddProductModal = function() {

    resetProductForm();

    const modal = document.getElementById("product-modal");

    if (modal) {

        modal.classList.remove("hidden");

        // إعادة تعيين موضع النافذة الافتراضي للوسط

        const card = document.getElementById("product-modal-card");

        if (card) { card.style.top = '0px'; card.style.left = '0px'; }

    }

};

window.closeProductModal = function() {

    const modal = document.getElementById("product-modal");

    if (modal) modal.classList.add("hidden");

    resetProductForm();

};

// تهيئة حركة السحب والإفلات (Draggable) للنافذة المنبثقة للمنتجات

/* (function initDraggableProductModal() {

    const header = document.getElementById("product-modal-header");

    const card = document.getElementById("product-modal-card");

    if (!header || !card) return;

    let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;

    header.onmousedown = dragMouseDown;

    function dragMouseDown(e) {

        e = e || window.event;

        // منع تحديد النص أثناء السحب

        e.preventDefault();

        // الحصول على موضع مؤشر الماوس عند البدء

        pos3 = e.clientX;

        pos4 = e.clientY;

        document.onmouseup = closeDragElement;

        document.onmousemove = elementDrag;

    }

    function elementDrag(e) {

        e = e || window.event;

        e.preventDefault();

        // حساب الموضع الجديد للمؤشر

        pos1 = pos3 - e.clientX;

        pos2 = pos4 - e.clientY;

        pos3 = e.clientX;

        pos4 = e.clientY;

        // حساب الموضع الجديد مع تقييد الحدود لمنع الاختفاء خارج الشاشة

        const maxTop = window.innerHeight - 60;  // يبقى شريط العنوان مرئياً دائماً

        const maxLeft = window.innerWidth - 120; // يبقى جزء من النافذة مرئياً

        const minTop = 0;

        const minLeft = -(card.offsetWidth - 120); // يبقى جزء من اليسار مرئياً

        let newTop = card.offsetTop - pos2;

        let newLeft = card.offsetLeft - pos1;

        // تقييد الحركة داخل حدود الشاشة

        newTop = Math.max(minTop, Math.min(maxTop, newTop));

        newLeft = Math.max(minLeft, Math.min(maxLeft, newLeft));

        card.style.top = newTop + "px";

        card.style.left = newLeft + "px";

    }

    function closeDragElement() {

        // إيقاف السحب عند تحرير زر الماوس

        document.onmouseup = null;

        document.onmousemove = null;

    }

})(); */

// تعديل دالة حفظ السلع الأصلية لإغلاق الـ Modal تلقائياً بعد الحفظ

const originalSaveProduct = window.saveProduct;

window.saveProduct = function() {

    // محاكاة عمل الدالة الأصلية

    const name = document.getElementById("prod-name").value.trim();

    const buyPrice = parseFloat(document.getElementById("prod-buy-price").value) || 0;

    const sellPrice = parseFloat(document.getElementById("prod-sell-price").value) || 0;

    const qty = parseFloat(document.getElementById("prod-qty").value) || 0;

    if (!name || buyPrice < 0 || sellPrice < 0 || qty < 0) {

        alert("⚠️ يرجى ملء كافة الحقول الإلزامية بشكل صحيح!");

        return;

    }

    // استدعاء الحفظ والتعديل

    const idInput = document.getElementById("prod-id").value;

    const isEdit = idInput !== "";

    // استكمال المنطق لـ saveProduct

    const barcodeInput = document.getElementById("prod-barcode").value.trim();

    const unit = document.getElementById("prod-unit").value;

    const category = document.getElementById("prod-category").value.trim();

    const isQuick = document.getElementById("prod-is-quick-sell").checked;

    const emoji = document.getElementById("prod-emoji").value.trim();

    const cardColor = document.getElementById("prod-card-color").value;

    const promoQty = parseFloat(document.getElementById("prod-promo-qty").value) || 0;

    const promoPrice = parseFloat(document.getElementById("prod-promo-price").value) || 0;

    const barcodeIsBulk = document.getElementById("prod-barcode-is-bulk").checked;

    const image = document.getElementById("prod-image-data").value;

    let barcode = barcodeInput;

    if (!barcode && !isEdit) {

        barcode = "GEN" + Math.floor(100000000 + Math.random() * 900000000);

    }

    if (isEdit) {

        const prod = appState.products.find(p => p.id === idInput);

        if (prod) {

            prod.name = name;

            prod.barcode = barcode || prod.barcode;

            prod.buyPrice = buyPrice;

            prod.sellPrice = sellPrice;

            prod.qty = qty;

            prod.unit = unit;

            prod.category = category;

            prod.isQuickSell = isQuick;

            prod.emoji = emoji;

            prod.cardColor = cardColor;

            prod.promoQty = promoQty > 0 ? promoQty : null;

            prod.promoPrice = promoPrice > 0 ? promoPrice : null;

            prod.barcodeIsBulk = barcodeIsBulk;

            prod.image = image;

            showToast("🟢 تم تعديل السلعة بالمخزن بنجاح!");

        }

    } else {

        const newProd = {

            id: "PROD" + Date.now(),

            name,

            barcode,

            buyPrice,

            sellPrice,

            qty,

            unit,

            category: category || "عام",

            isQuickSell: isQuick,

            emoji,

            cardColor,

            promoQty: promoQty > 0 ? promoQty : null,

            promoPrice: promoPrice > 0 ? promoPrice : null,

            barcodeIsBulk,

            image

        };

        appState.products.push(newProd);

        showToast("🟢 تم إضافة السلعة الجديدة للمخزن بنجاح!");

    }

    saveToLocalStorage();

    refreshUI();

    closeProductModal();

};

// ---- تسجيل الدوال الحيوية على النطاق العالمي (window) لضمان استدعائها بنجاح من HTML أوفلاين ----

window.switchTab = switchTab;

window.resetProductForm = resetProductForm;

window.renderPosProducts = renderPosProducts;

window.renderPosView = renderPosView;

window.calculateStats = calculateStats;

window.refreshUI = refreshUI;

// window.closeBusinessDay = closeBusinessDay; (Redundant, already assigned to window)

window.renderClosedDaysTable = renderClosedDaysTable;

// window.openTodaySalesModal = openTodaySalesModal; (Redundant, already assigned to window)

// window.closeTodaySalesModal = closeTodaySalesModal; (Redundant, already assigned to window)

// window.openTxDetailsModal = openTxDetailsModal; (Redundant, already assigned to window)

// window.closeTxDetailsModal = closeTxDetailsModal; (Redundant, already assigned to window)

// window.deleteTransactionFully = deleteTransactionFully; (Redundant, already assigned to window)

// window.returnSingleItemFromTransaction = returnSingleItemFromTransaction; (Redundant, already assigned to window)

// window.openAddProductModal = openAddProductModal; (Redundant, already assigned to window)

// window.closeProductModal = closeProductModal; (Redundant, already assigned to window)

// إضافة مستمع لحدث الضغط على زر + أو * من لوحة المفاتيح
document.addEventListener("keydown", (e) => {
    if (e.key === "+" || e.key === "Add") {
        if (appState.activeTab === "pos") {
            const activeEl = document.activeElement;
            const isInput = activeEl && (activeEl.tagName === "INPUT" || activeEl.tagName === "TEXTAREA");
            if (!isInput || activeEl.id === "pos-barcode-input") {
                e.preventDefault();
                window.triggerAddCustomAmount();
            }
        }
    } else if (e.key === "*" || e.key === "Multiply") {
        if (appState.activeTab === "pos") {
            const activeEl = document.activeElement;
            const isInput = activeEl && (activeEl.tagName === "INPUT" || activeEl.tagName === "TEXTAREA");
            if (!isInput || activeEl.id === "pos-barcode-input") {
                e.preventDefault();
                window.triggerMultiplyLastItem();
            }
        }
    }
});

// --- دوال وحركة نافذة إدخال مبلغ مالي يدوي (عنصر آخر) ---
window.triggerAddCustomAmount = function() {
    const modal = document.getElementById("custom-amount-modal");
    const input = document.getElementById("custom-amount-input");
    if (modal && input) {
        input.value = "";
        modal.classList.remove("hidden");
        setTimeout(() => input.focus(), 200);
    }
};

window.closeCustomAmountModal = function() {
    const modal = document.getElementById("custom-amount-modal");
    if (modal) modal.classList.add("hidden");
};

window.confirmCustomAmount = function() {
    const input = document.getElementById("custom-amount-input");
    if (!input) return;
    const amount = parseFloat(input.value);
    if (isNaN(amount) || amount <= 0) {
        alert("⚠️ الرجاء إدخال مبلغ مالي صحيح أكبر من الصفر.");
        return;
    }
    
    const customId = "PR-CUSTOM-" + Date.now();
    const customProduct = {
        id: customId,
        barcode: "custom-" + Date.now(),
        name: "عنصر آخر (Autre article)",
        buyPrice: amount,
        sellPrice: amount,
        qty: 999,
        unit: "قطعة",
        category: "بيع سريع",
        isCustomItem: true
    };
    
    appState.products.push(customProduct);
    saveToLocalStorage();
    addProductToCartById(customId, 1);
    window.closeCustomAmountModal();
};

// --- دوال وحركة نافذة تعديل كمية السلعة الأخيرة (*) ---
window.triggerMultiplyLastItem = function() {
    if (appState.cart.length === 0) {
        showToast("⚠️ السلة فارغة! لا يمكن تعديل الكمية.");
        return;
    }
    
    const lastItem = appState.cart[appState.cart.length - 1];
    const product = appState.products.find(p => p.id === lastItem.productId);
    if (!product) return;
    
    const modal = document.getElementById("multiply-qty-modal");
    const nameEl = document.getElementById("multiply-product-name");
    const curQtyEl = document.getElementById("multiply-current-qty");
    const input = document.getElementById("multiply-qty-input");
    
    if (modal && nameEl && curQtyEl && input) {
        nameEl.innerText = product.name;
        curQtyEl.innerText = `الكمية الحالية: ${lastItem.qty} ${product.unit || 'قطعة'}`;
        input.value = "";
        modal.classList.remove("hidden");
        setTimeout(() => input.focus(), 200);
    }
};

window.closeMultiplyQtyModal = function() {
    const modal = document.getElementById("multiply-qty-modal");
    if (modal) modal.classList.add("hidden");
};

window.confirmMultiplyQty = function() {
    if (appState.cart.length === 0) return;
    const input = document.getElementById("multiply-qty-input");
    if (!input) return;
    
    const qtyVal = parseFloat(input.value);
    if (isNaN(qtyVal) || qtyVal <= 0) {
        alert("⚠️ الرجاء إدخال كمية صحيحة أكبر من الصفر.");
        return;
    }
    
    const lastItem = appState.cart[appState.cart.length - 1];
    lastItem.qty = qtyVal;
    
    saveToLocalStorage();
    refreshCartUI();
    window.closeMultiplyQtyModal();
    playBeep();
    showToast("✅ تم تعديل كمية آخر مادة بنجاح!");
};

// ==========================================================================
// وحدات إدارة نافذة تسجيل الديون الموحدة للزبائن العابرين والدائمين
// ==========================================================================
let pendingDebtCheckout = null;

window.openCheckoutDebtModal = function(debtAmount, received, total, checkoutItems, totalProfit) {
    pendingDebtCheckout = {
        debtAmount: debtAmount,
        received: received,
        total: total,
        checkoutItems: checkoutItems,
        totalProfit: totalProfit
    };
    
    const amountLabel = document.getElementById("checkout-debt-amount-label");
    if (amountLabel) amountLabel.innerText = formatCurrency(debtAmount);
    
    const modal = document.getElementById("checkout-debt-modal");
    if (modal) modal.classList.remove("hidden");
    
    const searchInput = document.getElementById("checkout-debt-search");
    if (searchInput) {
        searchInput.value = "";
        setTimeout(() => searchInput.focus(), 150);
    }
    
    renderCheckoutDebtCustomers("");
};

window.closeCheckoutDebtModal = function() {
    const modal = document.getElementById("checkout-debt-modal");
    if (modal) modal.classList.add("hidden");
    pendingDebtCheckout = null;
};

window.renderCheckoutDebtCustomers = function(query) {
    const listContainer = document.getElementById("checkout-debt-customers-list");
    if (!listContainer) return;
    
    query = query.toLowerCase().trim();
    const customers = appState.customers || [];
    const filtered = query === "" ? customers : customers.filter(c => c.name.toLowerCase().includes(query));
    
    // إظهار وإعداد زر إضافة زبون جديد
    const addNewBtn = document.getElementById("btn-add-new-customer-debt");
    const nameSpan = document.getElementById("new-customer-debt-name");
    
    const exactMatch = customers.find(c => c.name.toLowerCase() === query);
    if (query !== "" && !exactMatch) {
        if (addNewBtn && nameSpan) {
            addNewBtn.style.display = "block";
            nameSpan.innerText = query;
        }
    } else {
        if (addNewBtn) addNewBtn.style.display = "none";
    }
    
    if (filtered.length === 0) {
        listContainer.innerHTML = `<div style="padding: 15px; text-align: center; color: var(--text-muted); font-size: 0.85rem;">لا يوجد زبائن مطبقين للبحث: "${query}"</div>`;
        return;
    }
    
    listContainer.innerHTML = filtered.map(c => `
        <div class="debt-customer-item" onclick="selectDebtCustomer('${c.id}')">
            <span class="cust-name">ًں‘¤ ${c.name}</span>
            <span class="cust-debt ${c.debt > 0 ? '' : 'no-debt'}">${c.debt > 0 ? formatCurrency(c.debt) : '✓ لا ديون'}</span>
        </div>
    `).join('');
};

window.selectDebtCustomer = function(customerId) {
    if (!pendingDebtCheckout) return;
    const customer = appState.customers.find(c => c.id === customerId);
    if (!customer) return;
    
    completeCheckoutWithCustomerDebt(
        customer,
        pendingDebtCheckout.debtAmount,
        pendingDebtCheckout.received,
        pendingDebtCheckout.total,
        pendingDebtCheckout.checkoutItems,
        pendingDebtCheckout.totalProfit
    );
};

window.addNewCustomerFromDebtModal = function() {
    if (!pendingDebtCheckout) return;
    const queryInput = document.getElementById("checkout-debt-search");
    if (!queryInput) return;
    const name = queryInput.value.trim();
    if (name === "") return;
    
    // إنشاء زبون جديد في القائمة الرئيسية
    const newCustomer = {
        id: "C-" + Date.now().toString(16).toUpperCase() + Math.random().toString(36).substring(2, 5),
        name: name,
        phone: "",
        address: "زبون مضاف أثناء البيع بالدين",
        debt: 0,
        transactions: []
    };
    
    if (!appState.customers) appState.customers = [];
    appState.customers.push(newCustomer);
    
    completeCheckoutWithCustomerDebt(
        newCustomer,
        pendingDebtCheckout.debtAmount,
        pendingDebtCheckout.received,
        pendingDebtCheckout.total,
        pendingDebtCheckout.checkoutItems,
        pendingDebtCheckout.totalProfit
    );
};

window.completeCheckoutWithCustomerDebt = function(customer, debtAmount, received, total, checkoutItems, totalProfit) {
    const transactionId = "TX-" + Date.now().toString(16).toUpperCase();
    
    const newTransaction = {
        id: transactionId,
        timestamp: new Date().toISOString(),
        items: checkoutItems,
        total: total,
        profit: totalProfit,
        received: received,
        change: 0,
        isDebt: true,
        customerName: customer.name,
        customerId: customer.id,
        debtAmount: debtAmount,
        processedBy: appState.currentUser ? appState.currentUser.displayName : "النظام"
    };
    
    // تخفيض كمية السلعة من المخزن
    checkoutItems.forEach(item => {
        const product = appState.products.find(p => p.id === item.productId);
        if (product) {
            product.qty = parseFloat((product.qty - item.qty).toFixed(2));
        }
    });
    
    appState.transactions.push(newTransaction);
    
    // تسجيل الدين في كشف حساب الزبون
    customer.debt = (customer.debt || 0) + debtAmount;
    if (!customer.transactions) customer.transactions = [];
    customer.transactions.push({
        id: 'CT-' + Date.now().toString(16).toUpperCase(),
        type: 'sale',
        amount: total,
        note: 'وصل #' + transactionId.slice(-6).toUpperCase() + ' (دين: ' + formatCurrency(debtAmount) + ')',
        date: newTransaction.timestamp
    });
    
    // تصفير وتهيئة سلة المبيعات
    appState.cart = [];
    appState.products = appState.products.filter(p => !p.isCustomItem);
    
    const receivedInput = document.getElementById("cart-received-amount");
    if (receivedInput) receivedInput.value = "";
    
    // تحديد هذا الزبون في سلة البيع
    renderCustomerSelectInPOS();
    const sel = document.getElementById('pos-customer-select');
    if (sel) sel.value = customer.id;
    
    saveToLocalStorage();
    refreshUI();
    
    showToast(`✅ تمت العملية بنجاح وتم تسجيل دين بقيمة ${formatCurrency(debtAmount)} على حساب ${customer.name}!`);
    closeCheckoutDebtModal();
};

// ==========================================================================
// 🔐 نظام التحقق وتفعيل ترخيص البرنامج (أسبوع / شهر / سنة / مدى الحياة)
// ==========================================================================

const EASY_LICENSE_KEYS = {
    // أكواد تفعيل لمدة أسبوع (7 أيام)
    "ACT-7D-8941-K9": 7,
    "ACT-7D-3352-X4": 7,
    "WEEK-7777-8888": 7,
    "WEEK-1234-5678": 7,
    
    // أكواد تفعيل لمدة شهر (30 يوم)
    "ACT-30D-6610-M8": 30,
    "ACT-30D-4481-P2": 30,
    "MONTH-3030-4040": 30,
    "MONTH-9999-1111": 30,

    // أكواد تفعيل لمدة سنة (365 يوم)
    "ACT-365D-9912-Y7": 365,
    "ACT-365D-5501-Q3": 365,
    "YEAR-2026-365D": 365,
    "YEAR-8888-9999": 365,

    // أكواد غير محدودة (مدى الحياة)
    "ACT-LIFE-9000-VIP": -1,
    "ACT-LIFE-7777-PRO": -1,
    "FULL-LIFE-TIME1": -1,
    "FULL-LIFE-TIME2": -1
};

const LICENSE_KEY_HASHES = {
    "-AY2Q7Z": 7, "BFAUQ1": 7, "UV15G4": 7,
    "B84RNL": 30, "-3H37R3": 30, "-MW8BJP": 30,
    "22KM0R": 365, "RR8MOV": 365, "-WGSAWX": 365,
    "-XRA362": -1, "27YNW6": -1, "-31WKUS": -1
};

function hashKey(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = (hash << 5) - hash + str.charCodeAt(i);
        hash |= 0;
    }
    return hash.toString(36).toUpperCase();
}

function updateLicenseUIStatus(text) {
    const badge = document.getElementById("license-status-badge");
    if (badge) badge.innerText = `الحالة: ${text}`;
}

// أكواد تفعيل رخصة البرنامج الـ 40 المعتمدة (ذات الاستخدام الواحد)
const LICENSE_CODES = {
    // 10 أكواد تفعيل لمدة أسبوع (7 أيام) - المجموعة الأولى (المستهلكة بالتجريب)
    "TARAK-WK-1A2B-3C4D": { days: 7, type: "week" },
    "TARAK-WK-5E6F-7G8H": { days: 7, type: "week" },
    "TARAK-WK-9J0K-1L2M": { days: 7, type: "week" },
    "TARAK-WK-3N4P-5Q6R": { days: 7, type: "week" },
    "TARAK-WK-7S8T-9U0V": { days: 7, type: "week" },
    "TARAK-WK-1W2X-3Y4Z": { days: 7, type: "week" },
    "TARAK-WK-5A6B-7C8D": { days: 7, type: "week" },
    "TARAK-WK-9E0F-1G2H": { days: 7, type: "week" },
    "TARAK-WK-3J4K-5L6M": { days: 7, type: "week" },
    "TARAK-WK-7N8P-9Q0R": { days: 7, type: "week" },

    // 10 أكواد تفعيل جديدة كلياً لمدة أسبوع (7 أيام) - المجموعة الثانية (النشطة والجاهزة للاستعمال)
    "TARAK-WK-2W3X-4Y5Z": { days: 7, type: "week" },
    "TARAK-WK-6A7B-8C9D": { days: 7, type: "week" },
    "TARAK-WK-2E3F-4G5H": { days: 7, type: "week" },
    "TARAK-WK-6J7K-8L9M": { days: 7, type: "week" },
    "TARAK-WK-2N3P-4Q5R": { days: 7, type: "week" },
    "TARAK-WK-6S7T-8U9V": { days: 7, type: "week" },
    "TARAK-WK-2W3A-4B5C": { days: 7, type: "week" },
    "TARAK-WK-6D7E-8F9G": { days: 7, type: "week" },
    "TARAK-WK-2H3J-4K5L": { days: 7, type: "week" },
    "TARAK-WK-6M7N-8P9Q": { days: 7, type: "week" },

    // 10 أكواد تفعيل لمدة شهر (30 يوم)
    "TARAK-MO-1X2Y-3Z4A": { days: 30, type: "month" },
    "TARAK-MO-5B6C-7D8E": { days: 30, type: "month" },
    "TARAK-MO-9F0G-1H2J": { days: 30, type: "month" },
    "TARAK-MO-3K4L-5M6N": { days: 30, type: "month" },
    "TARAK-MO-7P8Q-9R0S": { days: 30, type: "month" },
    "TARAK-MO-1T2U-3V4W": { days: 30, type: "month" },
    "TARAK-MO-5X6Y-7Z8A": { days: 30, type: "month" },
    "TARAK-MO-9B0C-1D2E": { days: 30, type: "month" },
    "TARAK-MO-3F4G-5H6J": { days: 30, type: "month" },
    "TARAK-MO-7K8L-9M0N": { days: 30, type: "month" },

    // 10 أكواد تفعيل لمدة سنة (365 يوم)
    "TARAK-YR-1P2Q-3R4S": { days: 365, type: "year" },
    "TARAK-YR-5T6U-7V8W": { days: 365, type: "year" },
    "TARAK-YR-9X0Y-1Z2A": { days: 365, type: "year" },
    "TARAK-YR-3B4C-5D6E": { days: 365, type: "year" },
    "TARAK-YR-7F8G-9H0J": { days: 365, type: "year" },
    "TARAK-YR-1K2L-3M4N": { days: 365, type: "year" },
    "TARAK-YR-5P6Q-7R8S": { days: 365, type: "year" },
    "TARAK-YR-9T0U-1V2W": { days: 365, type: "year" },
    "TARAK-YR-3X4Y-5Z6A": { days: 365, type: "year" },
    "TARAK-YR-7B8C-9D0E": { days: 365, type: "year" },

    // 10 أكواد تفعيل مدى الحياة (غير محدود)
    "TARAK-LT-1F2G-3H4J": { days: 99999, type: "lifetime" },
    "TARAK-LT-5K6L-7M8N": { days: 99999, type: "lifetime" },
    "TARAK-LT-9P0Q-1R2S": { days: 99999, type: "lifetime" },
    "TARAK-LT-3T4U-5V6W": { days: 99999, type: "lifetime" },
    "TARAK-LT-7X8Y-9Z0A": { days: 99999, type: "lifetime" },
    "TARAK-LT-1B2C-3D4E": { days: 99999, type: "lifetime" },
    "TARAK-LT-5F6G-7H8J": { days: 99999, type: "lifetime" },
    "TARAK-LT-9K0L-1M2N": { days: 99999, type: "lifetime" },
    "TARAK-LT-3P4Q-5R6S": { days: 99999, type: "lifetime" },
    "TARAK-LT-7T8U-9V0W": { days: 99999, type: "lifetime" }
};

window.activateLicenseKey = async function() {
    const input = document.getElementById("license-key-input");
    if (!input) return;
    const key = input.value.trim().toUpperCase();

    const licenseInfo = LICENSE_CODES[key];
    if (!licenseInfo) {
        alert("❌ رمز التفعيل غير صحيح! يرجى إدخال رمز تفعيل صالح.");
        return;
    }

    const expiryTimestamp = licenseInfo.days === 99999 ? null : (Date.now() + licenseInfo.days * 24 * 60 * 60 * 1000);

    if (!appState.storeSettings) {
        appState.storeSettings = {};
    }
    
    // تهيئة مصفوفة الأكواد المستخدمة إن لم تكن موجودة
    if (!appState.storeSettings.usedLicenseCodes) {
        appState.storeSettings.usedLicenseCodes = [];
    }

    // التحقق مما إذا كان الكود مستخدماً من قبل
    if (appState.storeSettings.usedLicenseCodes.includes(key)) {
        alert("❌ هذا الكود تم استخدامه سابقاً! يرجى إدخال رمز تفعيل جديد.");
        return;
    }

    appState.storeSettings.license = {
        activated: true,
        type: licenseInfo.type,
        expiryDate: expiryTimestamp,
        activationCode: key
    };

    // إضافة الكود لقائمة الأكواد المستخدمة لمنع إعادة تشغيله
    appState.storeSettings.usedLicenseCodes.push(key);

    // حفظ نسخة مستمرة في ذاكرة المتصفح الصلبة (على الهارد ديسك أو ذاكرة الهاتف) لا تحذف أبداً
    localStorage.setItem("lily_pro_activated_license", JSON.stringify(appState.storeSettings.license));

    // فرض تسجيل الخروج عند تفعيل البرنامج لأول مرة ليتم مطالبتهم ببيانات TARAK
    appState.currentUser = null;

    saveToLocalStorage();
    
    // رفع حالة الترخيص الجديدة فوراً وقبل التحديث إلى ملف السيرفر database.json
    if (typeof sendDataToServer === 'function') {
        await sendDataToServer();
    }
    
    alert(`🎉 تم التفعيل بنجاح! نوع الاشتراك: [${licenseInfo.type === "lifetime" ? "مدى الحياة ♾️" : licenseInfo.type === "year" ? "عام" : licenseInfo.type === "month" ? "شهر" : "أسبوع"}]`);
    
    const overlay = document.getElementById("license-guard-overlay");
    if (overlay) overlay.style.display = "none";
    
    // إخفاء حاوية البرنامج وعرض شاشة تسجيل الدخول
    const loginScreen = document.getElementById("login-screen");
    if (loginScreen) loginScreen.classList.remove("hidden");
    const appContainer = document.getElementById("app-container");
    if (appContainer) appContainer.classList.add("hidden");
    
    window.checkAppLicense();
};

window.activateLicenseFromSettings = function() {
    const input = document.getElementById("settings-license-input");
    if (!input) return;
    const key = input.value.trim().toUpperCase();
    
    const licenseInfo = LICENSE_CODES[key];
    if (!licenseInfo) {
        showToast("❌ رمز التفعيل غير صحيح!");
        return;
    }

    const expiryTimestamp = licenseInfo.days === 99999 ? null : (Date.now() + licenseInfo.days * 24 * 60 * 60 * 1000);

    appState.storeSettings.license = {
        activated: true,
        type: licenseInfo.type,
        expiryDate: expiryTimestamp,
        activationCode: key
    };

    saveToLocalStorage();
    showToast(`🎉 تم تمديد الترخيص بنجاح! نوع الاشتراك: [${licenseInfo.type === "lifetime" ? "مدى الحياة ♾️" : licenseInfo.type === "year" ? "عام" : licenseInfo.type === "month" ? "شهر" : "أسبوع"}]`);
    
    input.value = "";
    window.checkAppLicense();
    window.renderSettingsTab();
};

window.checkAppLicense = function() {
    const overlay = document.getElementById("license-guard-overlay");
    if (!appState.storeSettings) appState.storeSettings = {};
    
    // استرجاع الترخيص ذاتياً من ذاكرة المتصفح المستقلة (الهارد ديسك / الهاتف)
    let license = null;
    const localLicenseStr = localStorage.getItem("lily_pro_activated_license");
    if (localLicenseStr) {
        try {
            license = JSON.parse(localLicenseStr);
            // مزامنة حالة الترخيص مجدداً مع كائن التطبيق وحفظه بالذاكرة المحلية للمتصفح
            appState.storeSettings.license = license;
            saveToLocalStorage();
        } catch (e) {
            console.error("Error parsing local license:", e);
        }
    }
    
    if (!license) {
        license = appState.storeSettings.license || { activated: false };
        // حفظ الترخيص تلقائياً في ذاكرة الهاتف/الكمبيوتر الصلبة إذا كان مفعلاً مسبقاً في السيرفر لضمان استمراريته
        if (license && license.activated) {
            localStorage.setItem("lily_pro_activated_license", JSON.stringify(license));
        }
    }

    // إذا لم يكن البرنامج مفعلاً
    if (!license.activated) {
        if (overlay) {
            overlay.style.display = "flex";
            overlay.classList.remove("hidden");
        }
        updateLicenseUIStatus("❌ غير مفعّل");
        return false;
    }

    // إذا كان مفعلاً باشتراك مؤقت
    if (license.expiryDate) {
        const now = Date.now();
        const expiry = Number(license.expiryDate);
        if (now > expiry) {
            // انتهت الصلاحية
            if (overlay) {
                overlay.style.display = "flex";
                overlay.classList.remove("hidden");
            }
            updateLicenseUIStatus("⚠️ انتهت صلاحية الترخيص!");
            return false;
        } else {
            // نشط ومتبقي أيام
            if (overlay) {
                overlay.style.display = "none";
                overlay.classList.add("hidden");
            }
            const daysLeft = Math.ceil((expiry - now) / (1000 * 60 * 60 * 24));
            updateLicenseUIStatus(`🟢 نشط (متبقي ${daysLeft} يوم)`);
            if (daysLeft <= 7) {
                showLicenseExpiryWarning(daysLeft);
            } else {
                hideLicenseExpiryWarning();
            }
            return true;
        }
    }

    // تفعيل مدى الحياة
    if (overlay) {
        overlay.style.display = "none";
        overlay.classList.add("hidden");
    }
    hideLicenseExpiryWarning();
    updateLicenseUIStatus("🟢 كامل (مدى الحياة ♾️)");
    return true;
};

function showLicenseExpiryWarning(daysRemaining) {
    let banner = document.getElementById("license-warning-banner");
    if (!banner) {
        banner = document.createElement("div");
        banner.id = "license-warning-banner";
        banner.style.cssText = `
            position: fixed;
            bottom: 10px;
            left: 10px;
            background: rgba(220, 38, 38, 0.92);
            color: #ffffff;
            padding: 5px 10px;
            z-index: 99999;
            font-weight: 700;
            font-size: 0.72rem;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
            display: flex;
            align-items: center;
            gap: 8px;
            border-radius: 6px;
            font-family: 'Cairo', Arial, sans-serif;
            direction: rtl;
            backdrop-filter: blur(4px);
            border: 1px solid rgba(255, 255, 255, 0.2);
        `;
        document.body.appendChild(banner);
    }
    
    banner.innerHTML = `
        <span>⚠️ متبقي على انتهـاء الاشتراك: ${daysRemaining} أيام</span>
        <button type="button" onclick="document.getElementById('btn-open-license-modal')?.click();" style="background: #ffffff; color: #dc2626; border: none; border-radius: 4px; padding: 2px 6px; font-weight: 800; cursor: pointer; font-size: 0.68rem; font-family: inherit;">
            تجديد 🔑
        </button>
    `;
}

function hideLicenseExpiryWarning() {
    const banner = document.getElementById("license-warning-banner");
    if (banner) banner.remove();
}


// Old duplicate activateLicenseKey removed



// ==========================================================================
// 🚀 تجميع وتأكيد جميع دوال التبويبات والأزرار (المبيعات، الإعدادات، Excel، وطباعة الكشف)
// ==========================================================================

// 1. تحليل وقراءة ملفات الـ CSV
window.parseCSV = function(text) {
    const lines = [];
    let row = [""];
    let inQuotes = false;
    for (let i = 0; i < text.length; i++) {
        const char = text[i];
        const next = text[i+1];
        if (char === '"') {
            if (inQuotes && next === '"') {
                row[row.length - 1] += '"';
                i++;
            } else {
                inQuotes = !inQuotes;
            }
        } else if (char === ',') {
            if (inQuotes) {
                row[row.length - 1] += char;
            } else {
                row.push("");
            }
        } else if (char === '\r' || char === '\n') {
            if (inQuotes) {
                row[row.length - 1] += char;
            } else {
                if (char === '\r' && next === '\n') i++;
                lines.push(row);
                row = [""];
            }
        } else {
            row[row.length - 1] += char;
        }
    }
    if (row.length > 1 || row[0] !== "") {
        lines.push(row);
    }
    return lines;
};

// 2. تصدير السلع كملف Excel (CSV)
window.exportProductsToCSV = function() {
    const products = appState.products || [];
    let csvContent = "\uFEFF"; // UTF-8 BOM لضمان قراءة اللغة العربية بوضوح في Excel
    csvContent += "الباركود,اسم المنتج,التصنيف,سعر الشراء,سعر البيع,الكمية المتوفرة,الوحدة,الحد الأدنى للتنبيه\r\n";
    
    products.forEach(p => {
        const escape = val => {
            if (val === undefined || val === null) return "";
            let str = String(val).replace(/"/g, '""');
            if (str.includes(",") || str.includes("\n") || str.includes('"')) {
                return `"${str}"`;
            }
            return str;
        };
        
        csvContent += `${escape(p.barcode)},${escape(p.name)},${escape(p.category)},${p.buyPrice},${p.sellPrice},${p.qty},${escape(p.unit)},${p.minQty}\r\n`;
    });
    
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const dateStr = new Date().toLocaleDateString('ar-DZ').replace(/\//g, '-');
    const fileName = `منتجات_المحل_${dateStr}.csv`;
    
    link.href = URL.createObjectURL(blob);
    link.setAttribute("download", fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showToast("📊 تم تصدير كافة منتجات المخزن إلى ملف Excel (CSV) بنجاح!");
};

// 3. استيراد السلع من ملف Excel (CSV) لمطور آخر
window.importProductsFromCSV = function(file) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const text = e.target.result;
            const rows = parseCSV(text);
            if (rows.length < 2) {
                alert("❌ الملف فارغ أو لا يحتوي على صفوف بيانات!");
                return;
            }
            
            const headers = rows[0].map(h => h.trim().toLowerCase());
            
            let barcodeIdx = headers.findIndex(h => h.includes("باركود") || h.includes("كود") || h.includes("barcode") || h.includes("code") || h.includes("رمز") || h.includes("رقم"));
            let nameIdx = headers.findIndex(h => h.includes("اسم") || h.includes("name") || h.includes("السلعة") || h.includes("المنتج"));
            let categoryIdx = headers.findIndex(h => h.includes("تصنيف") || h.includes("فئة") || h.includes("category") || h.includes("type"));
            let buyPriceIdx = headers.findIndex(h => h.includes("شراء") || h.includes("buy") || h.includes("cost"));
            let sellPriceIdx = headers.findIndex(h => h.includes("بيع") || h.includes("sell") || h.includes("price"));
            let qtyIdx = headers.findIndex(h => h.includes("كمية") || h.includes("مخزن") || h.includes("qty") || h.includes("quantity") || h.includes("متوفر"));
            let unitIdx = headers.findIndex(h => h.includes("وحدة") || h.includes("unit"));
            let minQtyIdx = headers.findIndex(h => h.includes("حد") || h.includes("تنبيه") || h.includes("min"));
            
            if (nameIdx === -1) {
                alert("❌ لم نتمكن من تحديد عمود 'اسم المنتج' في ملف الـ Excel. يرجى التأكد من أن الصف الأول للملف يحتوي على عناوين واضحة للأعمدة.");
                return;
            }
            
            const confirmMerge = confirm(`📋 تم قراءة الملف بنجاح. هل تريد مسح المخزن الحالي واستيراد قائمة السلع الجديدة من ملف الـ Excel؟\n(سيتم إضافة جميع السلع الجديدة وتحديث البيانات)`);
            if (!confirmMerge) return;
            
            const newProducts = [];
            const timeHex = Date.now().toString(16).toUpperCase();
            
            for (let i = 1; i < rows.length; i++) {
                const row = rows[i];
                if (row.length < 2 || !row[nameIdx]) continue;
                
                const name = row[nameIdx].trim();
                const barcode = barcodeIdx !== -1 && row[barcodeIdx] ? row[barcodeIdx].trim() : "BC-" + timeHex + "-" + Math.random().toString(36).substring(2, 5);
                const category = categoryIdx !== -1 && row[categoryIdx] ? row[categoryIdx].trim() : "عام";
                const buyPrice = buyPriceIdx !== -1 ? (parseFloat(row[buyPriceIdx]) || 0) : 0;
                const sellPrice = sellPriceIdx !== -1 ? (parseFloat(row[sellPriceIdx]) || 0) : 0;
                const qty = qtyIdx !== -1 ? (parseFloat(row[qtyIdx]) || 0) : 0;
                const unit = unitIdx !== -1 && row[unitIdx] ? row[unitIdx].trim() : "قطعة";
                const minQty = minQtyIdx !== -1 ? (parseFloat(row[minQtyIdx]) || 5) : 5;
                
                newProducts.push({
                    id: "PRD-" + timeHex + "-" + Math.random().toString(36).substring(2, 5),
                    barcode: barcode,
                    name: name,
                    category: category,
                    buyPrice: buyPrice,
                    sellPrice: sellPrice,
                    qty: qty,
                    unit: unit,
                    minQty: minQty,
                    cost: buyPrice * qty
                });
            }
            
            if (newProducts.length === 0) {
                alert("⚠️ لم يتم استيراد أي منتج. يرجى التأكد من محتوى الجدول.");
                return;
            }
            
            appState.products = newProducts;
            saveToLocalStorage();
            refreshUI();
            
            alert(`🎉 تم استيراد [ ${newProducts.length} ] منتجاً بنجاح إلى المخزن وتحديث الواجهة!`);
        } catch (err) {
            console.error(err);
            alert("❌ خطأ أثناء قراءة الملف، يرجى التأكد من اختيار ملف Excel (CSV) صالح!");
        }
    };
    reader.readAsText(file, "UTF-8");
};

// 4. تصفير النظام بالكامل وحذف كافة السلع والمبيعات والمخزن
window.resetDatabaseCompletely = function() {
    const confirm1 = confirm("⚠️ تحذير أمني خطير: هل أنت متأكد من رغبتك في تصفير وتهيئة النظام بالكامل؟\nسيتم مسح كافة السلع في المخزن، والمبيعات، والديون، والمصاريف نهائياً ولن تتمكن من استرجاعها!");
    if (!confirm1) return;
    
    const confirm2 = confirm("🚨 تأكيد نهائي وقاطع: هل أنت متأكد بنسبة 100%؟ سيتم تفريغ المحل تماماً ليكون فارغاً وجاهزاً للبدء من جديد!");
    if (!confirm2) return;
    
    appState.products = [];
    appState.cart = [];
    appState.transactions = [];
    appState.debts = [];
    appState.supplierDebts = [];
    appState.heldCarts = [];
    appState.expenses = [];
    appState.cashBalance = [];
    appState.adminLogs = [];
    
    if (!appState.users || appState.users.length === 0) {
        appState.users = [
            { id: "admin", displayName: "المدير العام", username: "admin", password: "admin", role: "admin" }
        ];
    }
    
    appState.storeSettings = {
        name: appState.storeSettings ? appState.storeSettings.name : "متجر الذكاء",
        type: appState.storeSettings ? appState.storeSettings.type : "grocery",
        initialized: true
    };
    
    saveToLocalStorage();
    alert("✅ تم تصفير وتهيئة المحل بالكامل وحذف جميع البيانات والسلع بنجاح! تم فتح صفحة جديدة فارغة.");
    window.location.reload();
};

// 5. رندرة جدول وإحصائيات تبويب المبيعات
window.renderSalesTabTable = function() {
    const tbody = document.getElementById("sales-tab-tbody");
    const countEl = document.getElementById("sales-tab-count");
    const totalEl = document.getElementById("sales-tab-total");
    const profitEl = document.getElementById("sales-tab-profit");
    const marginEl = document.getElementById("sales-tab-margin");
    const searchInput = document.getElementById("sales-tab-search");
    
    if (!tbody) return;
    
    const transactions = appState.transactions || [];
    const query = searchInput ? searchInput.value.toLowerCase().trim() : "";
    
    let totalSalesSum = 0;
    let totalProfitSum = 0;
    
    const filtered = transactions.filter(t => {
        if (query === "") return true;
        const txIdMatch = (t.id || "").toLowerCase().includes(query);
        const custMatch = (t.customerName || "").toLowerCase().includes(query);
        const userMatch = (t.processedBy || "").toLowerCase().includes(query);
        return txIdMatch || custMatch || userMatch;
    });
    
    const sorted = [...filtered].reverse();
    
    transactions.forEach(t => {
        const total = parseFloat(t.total) || 0;
        const profit = parseFloat(t.profit) || 0;
        totalSalesSum += total;
        totalProfitSum += profit;
    });
    
    if (countEl) countEl.innerText = `${transactions.length} عملية بيع`;
    if (totalEl) totalEl.innerText = formatCurrency(totalSalesSum);
    
    if (profitEl) {
        profitEl.innerText = formatCurrency(totalProfitSum);
        profitEl.style.color = totalProfitSum >= 0 ? "var(--color-success)" : "var(--color-danger)";
    }
    
    if (marginEl) {
        let marginPct = 0;
        if (totalSalesSum > 0) {
            marginPct = (totalProfitSum / totalSalesSum) * 100;
        }
        marginEl.innerText = `${marginPct >= 0 ? '+' : ''}${marginPct.toFixed(1)}%`;
        marginEl.style.color = marginPct >= 0 ? "#3b82f6" : "#ef4444";
    }
    
    if (sorted.length === 0) {
        tbody.innerHTML = `<tr><td colspan="9" class="text-muted text-center py-4">لا توجد عمليات بيع مطابقة للبحث حالياً.</td></tr>`;
        return;
    }
    
    tbody.innerHTML = sorted.map(t => {
        const date = new Date(t.timestamp || Date.now());
        const dateStr = date.toLocaleString('ar-DZ', {
            year: 'numeric', month: 'short', day: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });
        
        const itemsCount = (t.items || []).reduce((acc, item) => acc + (parseFloat(item.qty) || 1), 0);
        const statusBadge = t.isDebt 
            ? `<span style="background: rgba(239, 68, 68, 0.15); color: #f87171; border: 1px solid rgba(239, 68, 68, 0.3); padding: 3px 8px; border-radius: 6px; font-size: 0.72rem; font-weight: 800;">⚠️ دين (${formatCurrency(t.debtAmount || 0)})</span>`
            : `<span style="background: rgba(16, 185, 129, 0.15); color: #34d399; border: 1px solid rgba(16, 185, 129, 0.3); padding: 3px 8px; border-radius: 6px; font-size: 0.72rem; font-weight: 800;">✓ خالصة</span>`;
            
        return `
            <tr>
                <td class="font-weight-bold text-info">#${(t.id || "").slice(-6).toUpperCase()}</td>
                <td style="font-size: 0.78rem;">${dateStr}</td>
                <td><i class="fa-solid fa-user-tie text-muted"></i> ${t.processedBy || 'النظام'}</td>
                <td class="font-weight-bold">${t.customerName || 'عميل عابر'}</td>
                <td><strong>${itemsCount}</strong> قطعة</td>
                <td class="font-weight-bold" style="font-size: 0.92rem;">${formatCurrency(t.total)}</td>
                <td class="font-weight-bold" style="color: ${t.profit >= 0 ? 'var(--color-success)' : 'var(--color-danger)'};">${formatCurrency(t.profit)}</td>
                <td>${statusBadge}</td>
                <td>
                    <div style="display: flex; gap: 4px; align-items: center;">
                        <button type="button" class="btn-secondary-xs" onclick="openTxDetailsModal('${t.id}')" style="padding: 4px 8px; font-size: 0.72rem; border-radius: 6px;" title="عرض تفاصيل الفاتورة وإرجاع سلع">
                            <i class="fa-solid fa-receipt"></i> الفوترة
                        </button>
                        <button type="button" class="btn-warning-sm" onclick="openEditTransactionModal('${t.id}')" style="padding: 4px 8px; font-size: 0.72rem; border-radius: 6px;" title="تعديل بيانات العملية والسلع">
                            <i class="fa-solid fa-pen-to-square"></i> تعديل
                        </button>
                        <button type="button" class="btn-danger-xs" onclick="deleteTransactionFully('${t.id}')" style="padding: 4px 8px; font-size: 0.72rem; border-radius: 6px; background: #ef4444; color: white;" title="حذف وإلغاء العملية بالكامل">
                            <i class="fa-solid fa-trash-can"></i> حذف
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join("");
};

// 6. فتح نافذة تعديل الفاتورة والعملية
window.openEditTransactionModal = function(txId) {
    const tx = (appState.transactions || []).find(t => t.id === txId);
    if (!tx) return;
    
    document.getElementById("edit-tx-id").value = txId;
    document.getElementById("edit-tx-customer").value = tx.customerName || "";
    
    const container = document.getElementById("edit-tx-items-list");
    if (container) {
        container.innerHTML = (tx.items || []).map((item, idx) => `
            <div style="display: flex; gap: 8px; align-items: center; margin-bottom: 8px; background: rgba(255,255,255,0.05); padding: 6px; border-radius: 6px;">
                <div style="flex: 1; font-size: 0.8rem; font-weight: 700;">${item.name}</div>
                <div style="width: 70px;">
                    <input type="number" class="edit-item-qty" data-idx="${idx}" value="${item.qty}" min="0.1" step="any" style="width: 100%; padding: 4px; font-size: 0.8rem; border-radius: 4px; border: 1px solid var(--glass-border); background: var(--bg-secondary); color: var(--text-main); text-align: center;">
                </div>
                <div style="width: 80px;">
                    <input type="number" class="edit-item-price" data-idx="${idx}" value="${item.sellPrice}" min="0" step="any" style="width: 100%; padding: 4px; font-size: 0.8rem; border-radius: 4px; border: 1px solid var(--glass-border); background: var(--bg-secondary); color: var(--text-main); text-align: center;">
                </div>
            </div>
        `).join("");
    }
    
    const modal = document.getElementById("edit-tx-modal");
    if (modal) modal.classList.remove("hidden");
};

// 7. حفظ التعديلات على العملية
window.saveEditedTransaction = function() {
    const txId = document.getElementById("edit-tx-id").value;
    const tx = (appState.transactions || []).find(t => t.id === txId);
    if (!tx) return;
    
    const newCustomerName = document.getElementById("edit-tx-customer").value.trim();
    tx.customerName = newCustomerName || "عميل عابر";
    
    let newTotal = 0;
    let newProfit = 0;
    
    const qtyInputs = document.querySelectorAll(".edit-item-qty");
    const priceInputs = document.querySelectorAll(".edit-item-price");
    
    qtyInputs.forEach(input => {
        const idx = parseInt(input.getAttribute("data-idx"));
        const newQty = parseFloat(input.value) || 0;
        const priceInput = document.querySelector(`.edit-item-price[data-idx="${idx}"]`);
        const newPrice = priceInput ? (parseFloat(priceInput.value) || 0) : 0;
        
        if (tx.items[idx]) {
            const oldQty = tx.items[idx].qty;
            const diffQty = newQty - oldQty;
            
            const prod = (appState.products || []).find(p => p.id === tx.items[idx].productId);
            if (prod) {
                prod.qty = parseFloat((prod.qty - diffQty).toFixed(2));
            }
            
            tx.items[idx].qty = newQty;
            tx.items[idx].sellPrice = newPrice;
            tx.items[idx].totalPrice = newQty * newPrice;
            
            const buyPrice = tx.items[idx].buyPrice || 0;
            const itemProfit = (newPrice - buyPrice) * newQty;
            
            newTotal += tx.items[idx].totalPrice;
            newProfit += itemProfit;
        }
    });
    
    tx.total = newTotal;
    tx.profit = newProfit;
    
    saveToLocalStorage();
    refreshUI();
    if (window.renderSalesTabTable) window.renderSalesTabTable();
    
    const modal = document.getElementById("edit-tx-modal");
    if (modal) modal.classList.add("hidden");
    showToast("🟢 تم تعديل بيانات المعاملة وتحديث السلع والأرباح بنجاح!");
};

// 8. رندرة تبويب الإعدادات

// 9. تغيير ثيم وألوان البرنامج
window.setAppThemeCustom = function(themeName) {
    document.documentElement.setAttribute("data-theme", themeName);
    appState.theme = themeName;
    saveToLocalStorage();
    showToast(`🎨 تم تغيير مظهر وثيم ألوان البرنامج إلى: [ ${themeName} ] بنجاح!`);
};

// 10. تفعيل كود ترخيص من صفحة الإعدادات

// Old duplicate activateLicenseFromSettings removed


// 11. تبديل ومغادرة حساب المستخدم
window.switchUserAccount = function() {
    const confirmSwitch = confirm("هل تريد الخروج وتبديل الحساب الحالي لتسجيل الدخول بحساب موظف آخر؟");
    if (!confirmSwitch) return;
    
    appState.currentUser = null;
    saveToLocalStorage();
    document.getElementById("login-screen").classList.remove("hidden");
    showToast("🔑 تم تسجيل الخروج، يرجى اختيار أو كتابة حساب الموظف للبدء.");
};

// 12. تسجيل الخروج المباشر
window.logoutUserCustom = function() {
    appState.currentUser = null;
    saveToLocalStorage();
    document.getElementById("login-screen").classList.remove("hidden");
    showToast("🚪 تم تسجيل الخروج من البرنامج بنجاح.");
};

// 13. طباعة كشف حساب زبون
window.printCustomerStatement = function(customerId) {
    const customer = (appState.customers || []).find(c => c.id === customerId);
    if (!customer) return;
    
    const printWin = window.open('', '_blank');
    if (!printWin) {
        alert("⚠️ يرجى السماح بالنوافذ المنبثقة للطباعة!");
        return;
    }
    
    const storeName = (appState.storeSettings && appState.storeSettings.name) ? appState.storeSettings.name : "المحل التجاري";
    const dateStr = new Date().toLocaleDateString('ar-DZ');
    
    let rows = (customer.transactions || []).map(tx => `
        <tr>
            <td style="padding:8px;border:1px solid #ccc;">${new Date(tx.date || Date.now()).toLocaleDateString('ar-DZ')}</td>
            <td style="padding:8px;border:1px solid #ccc;">${tx.note || 'معاملة'}</td>
            <td style="padding:8px;border:1px solid #ccc;font-weight:bold;color:${tx.type === 'debt' ? '#dc2626' : '#16a34a'}">${tx.type === 'debt' ? '+ دين' : '- دفع'}</td>
            <td style="padding:8px;border:1px solid #ccc;font-weight:bold;">${formatCurrency(tx.amount || 0)} دج</td>
        </tr>
    `).join('');
    
    if (!rows) {
        rows = `<tr><td colspan="4" style="padding:15px;text-align:center;color:#666;">لا توجد معاملات سابقة لهذا الزبون.</td></tr>`;
    }
    
    printWin.document.write(`
        <!DOCTYPE html>
        <html lang="ar" dir="rtl">
        <head>
            <meta charset="UTF-8">
            <title>كشف حساب زبون - ${customer.name}</title>
            <style>
                body { font-family: 'Cairo', Arial, sans-serif; padding: 20px; direction: rtl; text-align: right; }
                h2 { color: #1e293b; margin-bottom: 5px; }
                table { width: 100%; border-collapse: collapse; margin-top: 15px; }
                th { background: #f1f5f9; padding: 10px; border: 1px solid #ccc; font-weight: bold; }
                .summary { background: #f8fafc; padding: 15px; border-radius: 8px; margin: 15px 0; border: 1px solid #e2e8f0; }
            </style>
        </head>
        <body>
            <h2>🏢 ${storeName}</h2>
            <h3>كشف حساب الزبون: ${customer.name}</h3>
            <p>الهاتف: ${customer.phone || 'غير مسجل'} | التاريخ: ${dateStr}</p>
            <div class="summary">
                <strong>إجمالي الدين الحالي المستحق: </strong>
                <span style="font-size:1.3rem;color:#dc2626;font-weight:bold;">${formatCurrency(customer.debt || 0)} دج</span>
            </div>
            <table>
                <thead>
                    <tr>
                        <th>التاريخ</th>
                        <th>البيان / الوصل</th>
                        <th>نوع المعاملة</th>
                        <th>المبلغ</th>
                    </tr>
                </thead>
                <tbody>
                    ${rows}
                </tbody>
            </table>
            <br><br>
            <div style="text-align:center;font-size:0.85rem;color:#888;">تاريخ الطباعة: ${new Date().toLocaleString('ar-DZ')}</div>
        </body>
        </html>
    `);
    
    printWin.document.close();
    setTimeout(() => {
        printWin.focus();
        printWin.print();
    }, 250);
};


// ==========================================================================
// 🚀 إضافة السلع السريعة وتخصيص حد تنبيه نفاذ المخزون
// ==========================================================================

// 1. فتح نافذة إضافة سلعة سريعة
window.openQuickAddProductModal = function() {
    const modal = document.getElementById("quick-add-product-modal");
    if (!modal) return;
    
    document.getElementById("quick-p-barcode").value = "";
    document.getElementById("quick-p-name").value = "";
    document.getElementById("quick-p-buy-price").value = "0";
    document.getElementById("quick-p-sell-price").value = "0";
    document.getElementById("quick-p-qty").value = "1";
    document.getElementById("quick-p-category").value = "عام";
    document.getElementById("quick-p-unit").value = "قطعة";
    document.getElementById("quick-p-min-qty").value = (appState.storeSettings && appState.storeSettings.globalMinStockThreshold) ? appState.storeSettings.globalMinStockThreshold : "5";
    
    modal.classList.remove("hidden");
    setTimeout(() => {
        const nameInput = document.getElementById("quick-p-name");
        if (nameInput) nameInput.focus();
    }, 150);
};

// 2. توليد باركود تلقائي سريع
window.generateQuickBarcode = function() {
    const barcodeInput = document.getElementById("quick-p-barcode");
    if (barcodeInput) {
        barcodeInput.value = "BC-" + Date.now().toString(16).toUpperCase() + Math.random().toString(36).substring(2, 5);
    }
};

// 3. تحديث وإظهار عدد المواد القريبة من النفاذ
window.updateLowStockBadgeCount = function() {
    const globalMin = (appState.storeSettings && appState.storeSettings.globalMinStockThreshold) ? parseFloat(appState.storeSettings.globalMinStockThreshold) : 5;
    const products = appState.products || [];
    
    const lowStockProducts = products.filter(p => {
        const minQty = (p.minQty !== undefined && p.minQty !== null && p.minQty !== "") ? parseFloat(p.minQty) : globalMin;
        return (parseFloat(p.qty) || 0) <= minQty;
    });
    
    const count = lowStockProducts.length;
    const badge = document.getElementById("low-stock-count-badge");
    if (badge) {
        badge.innerText = count;
        badge.style.display = count > 0 ? "inline-block" : "none";
    }
    const badgeOld = document.getElementById("low-stock-badge");
    if (badgeOld) {
        badgeOld.innerText = count;
        badgeOld.classList.toggle("hidden", count === 0);
    }
};

// 4. فتح نافذة السلع القريبة من النفاذ وتخصيص الحدود
window.openLowStockModal = function() {
    const modal = document.getElementById("low-stock-alert-modal");
    if (!modal) return;
    
    const globalMin = (appState.storeSettings && appState.storeSettings.globalMinStockThreshold) ? parseFloat(appState.storeSettings.globalMinStockThreshold) : 5;
    const globalMinInput = document.getElementById("global-min-stock-input");
    if (globalMinInput) globalMinInput.value = globalMin;
    
    renderLowStockModalTable();
    modal.classList.remove("hidden");
};

// 5. رندرة جدول السلع القريبة من النفاذ
window.renderLowStockModalTable = function() {
    const tbody = document.getElementById("low-stock-alert-tbody");
    if (!tbody) return;
    
    const globalMin = (appState.storeSettings && appState.storeSettings.globalMinStockThreshold) ? parseFloat(appState.storeSettings.globalMinStockThreshold) : 5;
    const products = appState.products || [];
    
    const lowStockProducts = products.filter(p => {
        const minQty = (p.minQty !== undefined && p.minQty !== null && p.minQty !== "") ? parseFloat(p.minQty) : globalMin;
        return (parseFloat(p.qty) || 0) <= minQty;
    });
    
    if (lowStockProducts.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" class="text-muted text-center py-4">🟢 رائع! جميع السلع متوفرة بكثرة ولا توجد مواد قريبة من النفاذ حالياً.</td></tr>`;
        return;
    }
    
    tbody.innerHTML = lowStockProducts.map(p => {
        const currentMin = (p.minQty !== undefined && p.minQty !== null && p.minQty !== "") ? p.minQty : globalMin;
        const isOut = (parseFloat(p.qty) || 0) <= 0;
        
        return `
            <tr>
                <td style="font-family: monospace; font-size: 0.82rem;">${p.barcode || '-'}</td>
                <td class="font-weight-bold">${p.name}</td>
                <td>
                    <span style="font-weight: 800; font-size: 0.95rem; color: ${isOut ? '#ef4444' : '#f59e0b'};">
                        ${p.qty} ${p.unit || 'قطعة'}
                    </span>
                    ${isOut ? '<span style="background: rgba(239, 68, 68, 0.15); color: #ef4444; border: 1px solid rgba(239, 68, 68, 0.3); padding: 2px 6px; border-radius: 4px; font-size: 0.7rem; margin-right: 4px;">منتهية</span>' : ''}
                </td>
                <td>
                    <div style="display: flex; gap: 4px; align-items: center;">
                        <input type="number" id="min-qty-input-${p.id}" value="${currentMin}" min="1" style="width: 55px; padding: 3px; font-size: 0.8rem; text-align: center; border-radius: 4px; border: 1px solid var(--glass-border); background: var(--bg-secondary); color: var(--text-main);">
                        <button type="button" onclick="updateSingleProductMinQty('${p.id}')" style="padding: 3px 6px; font-size: 0.7rem; border-radius: 4px; border: 1px solid var(--glass-border); background: var(--bg-primary); color: var(--text-main); cursor: pointer;" title="تحديث حد السلعة"><i class="fa-solid fa-check"></i></button>
                    </div>
                </td>
                <td class="font-weight-bold">${formatCurrency(p.sellPrice)}</td>
                <td>
                    <button type="button" onclick="quickRestockProduct('${p.id}')" style="padding: 4px 8px; font-size: 0.72rem; border-radius: 6px; background: linear-gradient(135deg, #10b981, #059669); border: none; color: white; font-weight: 700; cursor: pointer;">
                        <i class="fa-solid fa-plus"></i> زيادة المخزون
                    </button>
                </td>
            </tr>
        `;
    }).join("");
};

let mobileScannerTargetInput = null;

// 6. حفظ حد التنبيه العام الافتراضي للمحل
window.saveGlobalMinStockThreshold = function() {
    const input = document.getElementById("global-min-stock-input");
    if (!input) return;
    const val = parseFloat(input.value) || 5;
    
    if (!appState.storeSettings) appState.storeSettings = {};
    appState.storeSettings.globalMinStockThreshold = val;
    
    saveToLocalStorage();
    renderLowStockModalTable();
    updateLowStockBadgeCount();
    if (typeof renderInventoryTable === "function") renderInventoryTable();
    showToast(`⚙️ تم حفظ حد التنبيه العام الافتراضي للمحل وتحديث التنبيهات: [ ${val} قطع ]!`);
};

// 7. تحديث حد تنبيه لسلعة واحدة
window.updateSingleProductMinQty = function(productId) {
    const input = document.getElementById(`min-qty-input-${productId}`);
    if (!input) return;
    const val = parseFloat(input.value) || 5;
    
    const prod = (appState.products || []).find(p => p.id === productId);
    if (prod) {
        prod.minQty = val;
        saveToLocalStorage();
        renderLowStockModalTable();
        updateLowStockBadgeCount();
        showToast(`✅ تم تحديث حد التنبيه الخاص بالسلعة [ ${prod.name} ] إلى [ ${val} ]!`);
    }
};

// 8. زيادة وتزويد كمية سلعة سريعة
window.quickRestockProduct = function(productId) {
    const prod = (appState.products || []).find(p => p.id === productId);
    if (!prod) return;
    
    const addStr = prompt(`أدخل الكمية الجديدة المراد إضافتها لمخزون السلعة [ ${prod.name} ] (الكمية الحالية: ${prod.qty}):`, "10");
    if (addStr !== null) {
        const addQty = parseFloat(addStr) || 0;
        if (addQty > 0) {
            prod.qty = parseFloat((parseFloat(prod.qty) + addQty).toFixed(2));
            saveToLocalStorage();
            refreshUI();
            renderLowStockModalTable();
            updateLowStockBadgeCount();
            showToast(`🟢 تم زيادة مخزون [ ${prod.name} ] بـ [ ${addQty} ${prod.unit || 'قطعة'} ] بنجاح!`);
        }
    }
};

window.openAddProductChoiceModal = function(targetInputId) {
    mobileScannerTargetInput = targetInputId || null;
    window.openQuickAddProductModal();
};

window.openAddProductModal = function() {
    if (typeof resetProductForm === 'function') resetProductForm();
    const modal = document.getElementById("product-modal");
    if (modal) {
        modal.classList.remove("hidden");
        const card = document.getElementById("product-modal-card");
        if (card) { card.style.top = '0px'; card.style.left = '0px'; }
    } else {
        window.openQuickAddProductModal();
    }
};

window.openQuickAddProductModal = function() {
    const modal = document.getElementById("quick-add-product-modal");
    if (modal) {
        modal.classList.remove("hidden");
    }
};

// إعداد مستمع نموذج الإضافة السريعة للسلعة
document.addEventListener("DOMContentLoaded", () => {
    const quickForm = document.getElementById("quick-add-product-form");
    if (quickForm) {
        quickForm.addEventListener("submit", (e) => {
            e.preventDefault();
            
            const rawBarcode = document.getElementById("quick-p-barcode").value.trim();
            const barcode = rawBarcode || ("BC-" + Date.now().toString(16).toUpperCase() + Math.random().toString(36).substring(2, 5));
            const name = document.getElementById("quick-p-name").value.trim();
            const buyPrice = parseFloat(document.getElementById("quick-p-buy-price").value) || 0;
            const sellPrice = parseFloat(document.getElementById("quick-p-sell-price").value) || 0;
            const qty = parseFloat(document.getElementById("quick-p-qty").value) || 0;
            const category = document.getElementById("quick-p-category").value.trim() || "عام";
            const unit = document.getElementById("quick-p-unit").value || "قطعة";
            const minQty = parseFloat(document.getElementById("quick-p-min-qty").value) || 5;
            
            if (!name) {
                showToast("⚠️ الرجاء كتابة اسم السلعة!");
                return;
            }

            if (!appState.products) appState.products = [];

            // البحث عن وجود مسبق للباركود لمنع التكرار والتضارب
            const existingIndex = appState.products.findIndex(p => p.barcode && rawBarcode && p.barcode === rawBarcode);

            if (existingIndex !== -1) {
                // تحديث السلعة الموجودة مسبقاً
                const existing = appState.products[existingIndex];
                existing.qty = (existing.qty || 0) + qty;
                if (sellPrice > 0) existing.sellPrice = sellPrice;
                if (buyPrice > 0) existing.buyPrice = buyPrice;
                if (name) existing.name = name;
                
                showToast(`🔄 السلعة [ ${existing.name} ] موجودة مسبقاً! تم زيادة الكمية إلى [ ${existing.qty} ]`);
            } else {
                // إضافة سلعة جديدة
                const newProduct = {
                    id: "PRD-" + Date.now().toString(16).toUpperCase() + Math.random().toString(36).substring(2, 5),
                    barcode: barcode,
                    name: name,
                    category: category,
                    buyPrice: buyPrice,
                    sellPrice: sellPrice,
                    qty: qty,
                    unit: unit,
                    minQty: minQty,
                    cost: buyPrice * qty
                };
                appState.products.push(newProduct);
                showToast(`🎉 تم إضافة السلعة [ ${name} ] بنجاح للمخزن!`);
            }
            
            appState.filterLowStockOnly = false;
            saveToLocalStorage();
            refreshUI();
            if (typeof renderInventoryTable === 'function') renderInventoryTable();
            updateLowStockBadgeCount();
            
            quickForm.reset();
            document.getElementById("quick-add-product-modal").classList.add("hidden");
        });
    }
    
    // تحديث الشارات فور الإقلاع
    updateLowStockBadgeCount();
});


// تغيير لون الأزرار واللمسات فقط دون تغيير لون خلفية البرنامج العامة
window.setAppAccentColor = function(name, hexColor, gradientStyle) {
    document.documentElement.style.setProperty('--accent-color', hexColor);
    document.documentElement.style.setProperty('--accent-gradient', gradientStyle);
    
    if (!appState.accentColor) appState.accentColor = {};
    appState.accentColor = { name: name, hex: hexColor, gradient: gradientStyle };
    saveToLocalStorage();
    showToast(`🎨 تم تغيير ألوان الأزرار واللمسات إلى اللون [ ${name} ] بنجاح!`);
};

/* ==========================================================================
   الموديول الأول: خوارزمية تنظيف وتنظيم الباركود للغة AZERTY / Arabic / Invisible Chars
   ========================================================================== */

/**
 * دالة تنظيف وتحويل الباركود الخام لضمان القراءة الصحيحة بلغات الكيبورد المختلفة
 * @param {string} rawStr - النص الخام الوارد من قارئ الباركود أو الكيبورد
 * @returns {string} - كود الباركود المعالج والمطابق للصيغة القياسية
 */
window.cleanAndNormalizeBarcode = function(rawStr) {
    if (!rawStr) return "";
    let str = String(rawStr);

    // خريطة تحويل أزرار الأرقام غير المرفوعة بـ Shift في الكيبورد الفرنسية AZERTY
    const azertyMap = {
        '&': '1', 'é': '2', '"': '3', '\'': '4', '(': '5',
        '-': '6', 'è': '7', '_': '8', 'ç': '9', 'à': '0',
        'É': '2', 'È': '7', 'À': '0', 'Ç': '9'
    };

    // خريطة تحويل الأرقام المكتوبة بـ اللغة العربية والفارسية
    const arabicMap = {
        '٠': '0', '١': '1', '٢': '2', '٣': '3', '٤': '4',
        '٥': '5', '٦': '6', '٧': '7', '٨': '8', '٩': '9',
        '۰': '0', '۱': '1', '۲': '2', '۳': '3', '۴': '4',
        '۵': '5', '۶': '6', '۷': '7', '۸': '8', '۹': '9'
    };

    let result = "";
    for (let i = 0; i < str.length; i++) {
        let ch = str[i];
        if (azertyMap[ch] !== undefined) {
            result += azertyMap[ch];
        } else if (arabicMap[ch] !== undefined) {
            result += arabicMap[ch];
        } else if (/\d/.test(ch)) {
            result += ch;
        } else if (/[a-zA-Z0-9\-\_]/.test(ch)) {
            result += ch;
        }
    }

    // إزالة الأحرف المخفية والمسافات ورموز CR / LF / TAB / ASCII 0-31
    result = result.replace(/[\r\n\t\f\v]/g, '').trim();
    return result;
};

/* ==========================================================================
   الموديول الثاني: صفحة تشخيص وتفكيك رموز قارئ الباركود (Live Wedge Diagnostic)
   ========================================================================== */

let diagScanData = {
    rawChars: [],
    keyEvents: [],
    startTime: null,
    endTime: null
};

window.initBarcodeDiagTool = function() {
    const input = document.getElementById("diag-scanner-input");
    if (!input) return;

    input.value = "";
    diagScanData = { rawChars: [], keyEvents: [], startTime: null, endTime: null };
    
    // تركيز الفوكس تلقائياً عند فتح التبويب
    setTimeout(() => input.focus(), 150);

    input.onkeydown = function(e) {
        if (!diagScanData.startTime) {
            diagScanData.startTime = performance.now();
        }
        diagScanData.endTime = performance.now();

        diagScanData.keyEvents.push({
            char: e.key,
            code: e.code,
            keyCode: e.keyCode || e.which
        });
    };

    input.oninput = function() {
        const raw = input.value;
        const cleaned = window.cleanAndNormalizeBarcode(raw);

        // تحديث المخرجات المرئية
        const rawOut = document.getElementById("diag-raw-output");
        if (rawOut) rawOut.innerText = raw || "لا توجد بيانات بعد";

        const cleanOut = document.getElementById("diag-cleaned-output");
        if (cleanOut) cleanOut.innerText = cleaned || "--";

        // حساب سرعة المسح بالمللي ثانية
        const speedEl = document.getElementById("diag-scan-speed");
        const typeEl = document.getElementById("diag-scan-type");
        if (diagScanData.startTime && diagScanData.endTime) {
            const elapsed = Math.round(diagScanData.endTime - diagScanData.startTime);
            if (speedEl) speedEl.innerText = `${elapsed} مللي ثانية`;
            if (typeEl) {
                if (elapsed < 120 && raw.length >= 3) {
                    typeEl.innerText = "قارئ باركود سريع ⚡";
                    typeEl.style.color = "#10b981";
                } else {
                    typeEl.innerText = "كتابة يدوي ⌨️";
                    typeEl.style.color = "#f59e0b";
                }
            }
        }

        // فحص المطابقة في المخزون
        const matchStatus = document.getElementById("diag-match-status");
        const matchedProd = (appState.products || []).find(p => p.barcode === cleaned || p.barcode === raw);
        if (matchStatus) {
            if (matchedProd) {
                matchStatus.innerHTML = `<span style="color: #10b981; font-weight: 800;">✅ متطابق مع [ ${matchedProd.name} ] - سعر البيع: ${matchedProd.sellPrice} دج - المخزون: ${matchedProd.qty}</span>`;
            } else if (cleaned.length > 0) {
                matchStatus.innerHTML = `<span style="color: #ef4444; font-weight: 800;">❌ غير مسجل في المخزون (يمكنك إضافته مباشرة)</span>`;
            } else {
                matchStatus.innerText = "في انتظار المسح...";
                matchStatus.style.color = "#cbd5e1";
            }
        }

        // رندرة جدول المفاتيح
        renderDiagKeycodesTable();
    };
};

function renderDiagKeycodesTable() {
    const tbody = document.getElementById("diag-keycodes-tbody");
    if (!tbody) return;

    if (diagScanData.keyEvents.length === 0) {
        tbody.innerHTML = `<tr><td colspan="4" class="text-muted text-center py-3">قم بمسح أي باركود لتفكيك وتحليل مدخلاته هنا.</td></tr>`;
        return;
    }

    tbody.innerHTML = diagScanData.keyEvents.map(ev => {
        const normChar = window.cleanAndNormalizeBarcode(ev.char) || "(مخفي)";
        return `
            <tr>
                <td style="direction: ltr; font-family: monospace; color: #fca5a5;">${ev.char === ' ' ? '(مسافة)' : ev.char}</td>
                <td style="direction: ltr; font-family: monospace; color: #93c5fd;">${ev.code}</td>
                <td style="font-weight: 800; color: #e2e8f0;">${ev.keyCode}</td>
                <td style="direction: ltr; font-family: monospace; color: #6ee7b7; font-weight: 800;">${normChar}</td>
            </tr>
        `;
    }).join("");
}

window.resetBarcodeDiagTool = function() {
    const input = document.getElementById("diag-scanner-input");
    if (input) {
        input.value = "";
        input.focus();
    }
    diagScanData = { rawChars: [], keyEvents: [], startTime: null, endTime: null };
    
    const rawOut = document.getElementById("diag-raw-output");
    if (rawOut) rawOut.innerText = "لا توجد بيانات بعد";

    const cleanOut = document.getElementById("diag-cleaned-output");
    if (cleanOut) cleanOut.innerText = "--";

    const speedEl = document.getElementById("diag-scan-speed");
    if (speedEl) speedEl.innerText = "-- مللي ثانية";

    const typeEl = document.getElementById("diag-scan-type");
    if (typeEl) {
        typeEl.innerText = "في الانتظار...";
        typeEl.style.color = "#a855f7";
    }

    const matchStatus = document.getElementById("diag-match-status");
    if (matchStatus) {
        matchStatus.innerText = "في انتظار المسح...";
        matchStatus.style.color = "#cbd5e1";
    }

    renderDiagKeycodesTable();
};

/* ==========================================================================
   الموديول الثالث: سجل حركة المخزون وتتبع التعديلات (Audit Trail Logger)
   ========================================================================== */

if (!appState.auditLogs) appState.auditLogs = [];

window.logProductAction = function(actionType, productName, details) {
    if (!appState.auditLogs) appState.auditLogs = [];

    const currentUser = appState.currentUser ? appState.currentUser.displayName : "المدير العام";

    const logItem = {
        id: "LOG-" + Date.now().toString(16).toUpperCase(),
        timestamp: new Date().toISOString(),
        dateFormatted: new Date().toLocaleString('ar-DZ'),
        user: currentUser,
        actionType: actionType, // 'إضافة' | 'تعديل سعر' | 'تعديل كمية' | 'جرد' | 'حذف' | 'بيع'
        productName: productName,
        details: details
    };

    appState.auditLogs.unshift(logItem);
    // الاحتفاظ بآخر 1000 سجل أداءً وحفظاً
    if (appState.auditLogs.length > 1000) {
        appState.auditLogs = appState.auditLogs.slice(0, 1000);
    }
    saveToLocalStorage();
};

window.renderAuditLogsTable = function() {
    const tbody = document.getElementById("audit-logs-tbody");
    if (!tbody) return;

    const logs = appState.auditLogs || [];
    if (logs.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" class="text-muted text-center py-4">لا توجد سجلات حركة حتى الآن.</td></tr>`;
        return;
    }

    tbody.innerHTML = logs.map(log => {
        let badgeColor = "#3b82f6";
        if (log.actionType === "إضافة") badgeColor = "#10b981";
        else if (log.actionType === "حذف") badgeColor = "#ef4444";
        else if (log.actionType === "جرد") badgeColor = "#818cf8";
        else if (log.actionType.includes("تعديل")) badgeColor = "#f59e0b";

        return `
            <tr>
                <td style="font-size: 0.82rem; color: var(--text-muted);">${log.dateFormatted}</td>
                <td><strong style="color: var(--text-main);">${log.user}</strong></td>
                <td><span style="background: ${badgeColor}22; color: ${badgeColor}; border: 1px solid ${badgeColor}44; padding: 2px 8px; border-radius: 6px; font-weight: 800; font-size: 0.8rem;">${log.actionType}</span></td>
                <td><strong style="color: var(--accent-color);">${log.productName}</strong></td>
                <td style="font-size: 0.85rem; color: var(--text-main);">${log.details}</td>
            </tr>
        `;
    }).join("");
};

window.filterAuditLogsTable = function() {
    const query = (document.getElementById("log-search-input")?.value || "").toLowerCase().trim();
    const rows = document.querySelectorAll("#audit-logs-tbody tr");

    rows.forEach(row => {
        const text = row.innerText.toLowerCase();
        if (text.includes(query)) {
            row.style.display = "";
        } else {
            row.style.display = "none";
        }
    });
};

/* ==========================================================================
   الموديول الرابع: إدارة الجرد الكامل والجزئي (Full & Partial Stock Audit)
   ========================================================================== */

let auditState = {
    active: false,
    items: [] // { productId, barcode, name, systemQty, countedQty, buyPrice }
};

window.startAuditSession = function(mode = 'full') {
    const products = appState.products || [];
    if (products.length === 0) {
        alert("⚠️ لا توجد سلع بالمخزون للبدء بالجرد!");
        return;
    }

    auditState.active = true;
    auditState.items = products.map(p => ({
        productId: p.id,
        barcode: p.barcode,
        name: p.name,
        systemQty: parseFloat(p.qty) || 0,
        countedQty: parseFloat(p.qty) || 0, // افتراضياً نفس النظام لحين التعديل
        buyPrice: parseFloat(p.buyPrice) || 0
    }));

    renderAuditTable();
    showToast("📋 تم بدء جلسة الجرد الكامل للمحل بنجاح! أدخل الكميات الفعلية على الرفوف.");
};

window.renderAuditTable = function() {
    const tbody = document.getElementById("audit-table-tbody");
    if (!tbody) return;

    if (!auditState.active || auditState.items.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" class="text-muted text-center py-4">اضغط "جرد كامل" للبدء بإدخال كميات الرفوف.</td></tr>`;
        return;
    }

    let lossTotal = 0;
    let gainTotal = 0;
    let totalCountedItems = 0;

    tbody.innerHTML = auditState.items.map((item, index) => {
        const diff = item.countedQty - item.systemQty;
        const diffVal = diff * item.buyPrice;

        if (diff < 0) lossTotal += Math.abs(diffVal);
        if (diff > 0) gainTotal += diffVal;
        totalCountedItems++;

        let diffColor = "#94a3b8";
        if (diff < 0) diffColor = "#ef4444";
        if (diff > 0) diffColor = "#10b981";

        return `
            <tr>
                <td style="direction: ltr; font-family: monospace;">${item.barcode}</td>
                <td><strong style="color: var(--text-main);">${item.name}</strong></td>
                <td><span style="font-weight: 700; color: #38bdf8;">${item.systemQty}</span></td>
                <td>
                    <input type="number" step="any" min="0" value="${item.countedQty}" onchange="updateAuditRowQty(${index}, this.value)" style="width: 100px; padding: 6px; border-radius: 6px; border: 2px solid var(--accent-color); font-weight: 900; text-align: center; background: var(--bg-secondary); color: var(--text-main); outline: none;">
                </td>
                <td><strong style="color: ${diffColor};">${diff > 0 ? '+' : ''}${diff.toFixed(2)}</strong></td>
                <td><strong style="color: ${diffColor};">${diffVal > 0 ? '+' : ''}${diffVal.toFixed(2)} دج</strong></td>
            </tr>
        `;
    }).join("");

    // تحديث بطاقات الملخص
    const totalEl = document.getElementById("audit-count-total");
    if (totalEl) totalEl.innerText = `${totalCountedItems} / ${appState.products.length}`;

    const lossEl = document.getElementById("audit-loss-amount");
    if (lossEl) lossEl.innerText = `${lossTotal.toFixed(2)} دج`;

    const gainEl = document.getElementById("audit-gain-amount");
    if (gainEl) gainEl.innerText = `${gainTotal.toFixed(2)} دج`;
};

window.updateAuditRowQty = function(index, newQtyStr) {
    const val = parseFloat(newQtyStr);
    if (isNaN(val) || val < 0) return;

    if (auditState.items[index]) {
        auditState.items[index].countedQty = val;
        renderAuditTable();
    }
};

window.applyAuditReconciliation = function() {
    if (!auditState.active || auditState.items.length === 0) {
        alert("⚠️ لا توجد جلسة جرد نشطة لاعتمادها!");
        return;
    }

    if (!confirm("هل أنت أصلًا متأكد من تطبيق تسوية الجرد؟ سيتم تحديث كميات جميع السلع في قاعدة البيانات وتسجيل العملية.")) {
        return;
    }

    let modifiedCount = 0;
    auditState.items.forEach(item => {
        const prod = (appState.products || []).find(p => p.id === item.productId);
        if (prod && prod.qty !== item.countedQty) {
            const oldQty = prod.qty;
            prod.qty = item.countedQty;
            modifiedCount++;

            // تسجيل العملية بسجل الحركة
            window.logProductAction(
                "جرد",
                prod.name,
                `تسوية جردية: تعديل الكمية من [ ${oldQty} ] إلى [ ${item.countedQty} ]`
            );
        }
    });

    auditState.active = false;
    saveToLocalStorage();
    refreshUI();
    renderAuditTable();
    alert(`🎉 تم تطبيق وتسوية الجرد بنجاح! تم تحديث [ ${modifiedCount} ] سلعة بسجل المحل.`);
};

/* ==========================================================================
   الموديول الخامس: كشف حساب وتحديث الديون والولاء للعملاء
   ========================================================================== */

window.calculateCustomerLoyaltyPoints = function(customer) {
    if (!customer) return 0;
    // 1 نقطة لكل 100 دج مشتريات
    const totalSpent = (customer.transactions || []).reduce((acc, t) => acc + (t.amount || 0), 0);
    return Math.floor(totalSpent / 100);
};

window.printCustomerStatement = function(customerId) {
    const customer = (appState.customers || []).find(c => c.id === customerId);
    if (!customer) return;

    const modal = document.getElementById("customer-statement-modal");
    if (!modal) return;

    document.getElementById("stmt-customer-name").innerText = customer.name;
    document.getElementById("stmt-total-debt").innerText = `${(customer.debt || 0).toFixed(2)} دج`;

    const tbody = document.getElementById("stmt-transactions-tbody");
    if (tbody) {
        const txs = customer.transactions || [];
        if (txs.length === 0) {
            tbody.innerHTML = `<tr><td colspan="4" class="text-muted text-center py-3">لا توجد معاملات مسجلة لهذا الزبون.</td></tr>`;
        } else {
            tbody.innerHTML = txs.map(t => `
                <tr>
                    <td>${t.date || '--'}</td>
                    <td>${t.description || 'معاملة مبيعات / تسديد'}</td>
                    <td><span style="color: ${t.type === 'دين' ? '#ef4444' : '#10b981'}; font-weight: 800;">${t.type || 'دين'}</span></td>
                    <td><strong>${(t.amount || 0).toFixed(2)} دج</strong></td>
                </tr>
            `).join("");
        }
    }

    modal.classList.remove("hidden");
};

/* ==========================================================================
   الموديول السادس: ربط الهاتف والمزامنة الشبكية عن بعد (Phone Sync & QR Code)
   ========================================================================== */

// تأكيد ربط الدالة الرئيسية للتنقل عالمياً لمنع أي أخطاء في المتصفح
window.switchTab = switchTab;

/* دالة التبديل التفاعلي بين تبويبات لوحة التحكم الفرعية */
window.switchDashboardSubTab = function(subTabId) {
    // إخفاء كل التبويبات الفرعية وإضافة كلاس hidden
    document.querySelectorAll(".db-sub-tab").forEach(el => {
        el.classList.add("hidden");
        el.style.display = "none";
    });
    
    // إزالة التنشيط من أزرار الترويسة الفرعية
    document.querySelectorAll(".dashboard-sub-nav .sub-nav-item").forEach(btn => {
        btn.classList.remove("active");
        btn.style.background = "transparent";
        btn.style.color = "var(--text-main)";
        btn.style.border = "1px solid var(--glass-border)";
    });

    // إظهار التبويب المطلوب وإلغاء كلاس hidden
    const activeSub = document.getElementById(`db-sub-tab-${subTabId}`);
    if (activeSub) {
        activeSub.classList.remove("hidden");
        activeSub.style.display = "block";
    }

    // تفعيل الزر المضغوط
    const buttons = Array.from(document.querySelectorAll(".dashboard-sub-nav .sub-nav-item"));
    const activeBtn = buttons.find(b => {
        const onclickAttr = b.getAttribute("onclick") || "";
        return onclickAttr.includes(`'${subTabId}'`);
    });

    if (activeBtn) {
        activeBtn.classList.add("active");
        activeBtn.style.background = "var(--accent-gradient)";
        activeBtn.style.color = "white";
        activeBtn.style.border = "none";
    }

    // تحديث محتوى التبويب المختار فور التبديل
    if (subTabId === 'cashiers') {
        if (typeof renderUsersTable === 'function') renderUsersTable();
    } else if (subTabId === 'permanent-customers') {
        if (typeof renderCustomersTable === 'function') renderCustomersTable();
        if (typeof renderCustomerSelectInPOS === 'function') renderCustomerSelectInPOS();
    } else if (subTabId === 'suppliers') {
        if (typeof renderSupplierDebtsTable === 'function') renderSupplierDebtsTable();
    } else if (subTabId === 'cash-balance') {
        if (typeof renderCashBalanceSummary === 'function') renderCashBalanceSummary();
    } else if (subTabId === 'expenses') {
        if (typeof renderExpensesTable === 'function') renderExpensesTable();
    } else if (subTabId === 'admin-logs') {
        if (typeof renderAdminLogs === 'function') renderAdminLogs();
    } else if (subTabId === 'store-settings') {
        const logoCheckbox = document.getElementById('show-logo-receipt');
        if (logoCheckbox && appState.storeSettings) {
            logoCheckbox.checked = appState.storeSettings.showLogoOnReceipt || false;
        }
        const printerTypeSelect = document.getElementById('store-printer-type');
        if (printerTypeSelect && appState.storeSettings) {
            printerTypeSelect.value = appState.storeSettings.printerType || 'A4';
        }
        const customProfitInput = document.getElementById('settings-custom-profit-percent');
        if (customProfitInput && appState.storeSettings) {
            customProfitInput.value = appState.storeSettings.customProfitPercent !== undefined ? appState.storeSettings.customProfitPercent : 20;
        }
    }
};

window.openPhoneSyncModal = function() {
    const modal = document.getElementById("phone-sync-modal");
    if (!modal) return;

    modal.classList.remove("hidden");

    // عنوان رابط النفق السحابي Cloudflare الموثوق والآمن HTTPS لضمان عمل الكاميرا فورياً
    let defaultUrl = "https://declare-winner-result-validation.trycloudflare.com";
    if (window.location.origin && !window.location.origin.includes("localhost") && !window.location.origin.includes("127.0.0.1") && !window.location.origin.includes("192.168.")) {
        defaultUrl = window.location.origin;
    }

    const input = document.getElementById("phone-sync-url-input");
    if (input) input.value = defaultUrl;

    const qrImg = document.getElementById("phone-sync-qr-img");
    if (qrImg) {
        qrImg.src = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(defaultUrl)}`;
    }

    // جلب عنوان IP المحلي الحقيقي من السيرفر فور تشغيل الخادم
    try {
        fetch('http://127.0.0.1:5000/api/info')
            .then(res => res.json())
            .then(data => {
                if (data && data.fullUrl) {
                    if (input) input.value = data.fullUrl;
                    if (qrImg) qrImg.src = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(data.fullUrl)}`;
                }
            })
            .catch(() => {});
    } catch (e) {
        console.warn("Fetch failed synchronously:", e);
    }

    modal.classList.remove("hidden");
};

window.closePhoneSyncModal = function() {
    const modal = document.getElementById("phone-sync-modal");
    if (modal) modal.classList.add("hidden");
};

window.copyPhoneSyncUrl = function() {
    const input = document.getElementById("phone-sync-url-input");
    if (!input) return;

    input.select();
    input.setSelectionRange(0, 99999);

    try {
        navigator.clipboard.writeText(input.value);
        showToast("📋 تم نسخ رابط المزامنة للحافظة بنجاح! يمكنك إرساله للهاتف.");
    } catch (err) {
        document.execCommand("copy");
        showToast("📋 تم نسخ الرابط بنجاح!");
    }
};

/* موديول التحكم بالبيع المخصص للموبايل والتبديل السريع */
window.switchPOSMobileTab = function(tab) {
    const layout = document.querySelector(".pos-layout-split");
    if (!layout) return;

    const btnProducts = document.getElementById("pos-tab-btn-products");
    const btnCart = document.getElementById("pos-tab-btn-cart");

    if (tab === 'products') {
        layout.classList.remove("show-cart");
        layout.classList.add("show-products");
        if (btnProducts) {
            btnProducts.style.background = "var(--accent-gradient)";
            btnProducts.style.color = "white";
            btnProducts.style.border = "none";
        }
        if (btnCart) {
            btnCart.style.background = "rgba(255,255,255,0.05)";
            btnCart.style.color = "var(--text-main)";
            btnCart.style.border = "1px solid var(--glass-border)";
        }
    } else if (tab === 'cart') {
        layout.classList.remove("show-products");
        layout.classList.add("show-cart");
        if (btnCart) {
            btnCart.style.background = "var(--accent-gradient)";
            btnCart.style.color = "white";
            btnCart.style.border = "none";
        }
        if (btnProducts) {
            btnProducts.style.background = "rgba(255,255,255,0.05)";
            btnProducts.style.color = "var(--text-main)";
            btnProducts.style.border = "1px solid var(--glass-border)";
        }
    }
};

window.triggerPOSCheckout = function() {
    const btn = document.getElementById("btn-checkout");
    if (btn) btn.click();
};

/* موديول تسجيل السلع الجديدة فورياً وتلقائياً أثناء البيع */
window.openPOSQuickAddModal = function(barcode) {
    const modal = document.getElementById("pos-quick-add-modal");
    if (!modal) return;

    const barcodeInput = document.getElementById("pos-quick-add-barcode");
    if (barcodeInput) barcodeInput.value = barcode;

    const nameInput = document.getElementById("pos-quick-add-name");
    const buyInput = document.getElementById("pos-quick-add-buy-price");
    const sellInput = document.getElementById("pos-quick-add-sell-price");
    const qtyInput = document.getElementById("pos-quick-add-qty");

    if (nameInput) nameInput.value = "";
    if (buyInput) buyInput.value = "";
    if (sellInput) sellInput.value = "";
    if (qtyInput) qtyInput.value = "1";

    modal.classList.remove("hidden");
    setTimeout(() => { if (nameInput) nameInput.focus(); }, 150);
};

window.closePOSQuickAddModal = function() {
    const modal = document.getElementById("pos-quick-add-modal");
    if (modal) modal.classList.add("hidden");
};

window.submitPOSQuickAddProduct = function(event) {
    if (event) event.preventDefault();

    const barcode = document.getElementById("pos-quick-add-barcode")?.value.trim();
    const name = document.getElementById("pos-quick-add-name")?.value.trim();
    const buyPrice = parseFloat(document.getElementById("pos-quick-add-buy-price")?.value) || 0;
    const sellPrice = parseFloat(document.getElementById("pos-quick-add-sell-price")?.value) || 0;
    const qty = parseFloat(document.getElementById("pos-quick-add-qty")?.value) || 0;

    if (!barcode || !name) {
        showToast("⚠️ يرجى إدخال اسم السلعة ورقم الباركود!");
        return;
    }

    const existing = appState.products.find(p => p.barcode === barcode);
    if (existing) {
        showToast("⚠️ هذه السلعة مسجلة بالفعل بالمخزن!");
        window.closePOSQuickAddModal();
        return;
    }

    const newProduct = {
        id: 'p_' + Date.now(),
        barcode: barcode,
        name: name,
        category: 'عام',
        buyPrice: buyPrice,
        sellPrice: sellPrice,
        qty: qty,
        unit: 'قطعة',
        minQty: 5
    };

    appState.products.push(newProduct);
    saveToLocalStorage();

    if (typeof renderInventoryTable === 'function') renderInventoryTable();
    if (typeof initPOSProductsList === 'function') initPOSProductsList();

    window.closePOSQuickAddModal();

    addProductToCartByBarcode(barcode);
    showToast(`✅ تم تسجيل السلعة [ ${name} ] وإضافتها للسلة بنجاح!`);
};

/* ربط اختصار مفتاح النجمة (*) والتركيز في نافذة إدخال الكميات */
document.addEventListener("keydown", function(e) {
    if (appState.activeTab === "pos") {
        if (e.key === "*") {
            const activeEl = document.activeElement;
            if (activeEl && (activeEl.id === "pos-search-input" || activeEl.id === "pos-customer-search-input")) {
                return;
            }

            e.preventDefault(); // منع كتابة النجمة

            if (appState.cart && appState.cart.length > 0) {
                const lastItem = appState.cart[appState.cart.length - 1];
                const product = appState.products.find(p => p.id === lastItem.productId);
                if (product) {
                    window.openQuickQtyModalForProduct(product);
                    
                    const qtyInput = document.getElementById("quick-qty-input");
                    if (qtyInput) {
                        qtyInput.value = lastItem.qty;
                        setTimeout(() => {
                            qtyInput.focus();
                            qtyInput.select();
                        }, 120);
                    }
                    
                    window.quickQtyIsEditMode = true;
                    window.quickQtyEditItemIndex = appState.cart.indexOf(lastItem);
                }
            } else {
                showToast("⚠️ سلة المبيعات فارغة!");
            }
        }
    }
});

// دعم الضغط على مفتاح Enter لتأكيد الكمية داخل المودال
document.addEventListener("keydown", function(e) {
    if (e.key === "Enter") {
        const modal = document.getElementById("quick-qty-modal");
        if (modal && !modal.classList.contains("hidden")) {
            const qtyInput = document.getElementById("quick-qty-input");
            const priceInput = document.getElementById("quick-qty-price-input");
            const amountInput = document.getElementById("quick-qty-amount-input");
            
            if (document.activeElement === qtyInput || document.activeElement === priceInput || document.activeElement === amountInput) {
                e.preventDefault();
                const confirmBtn = document.getElementById("btn-confirm-quick-qty");
                if (confirmBtn) confirmBtn.click();
            }
        }
    }
});

/* === نظام الآلة الحاسبة الاحترافية التفاعلية === */
window.triggerOpenCalculator = function() {
    const modal = document.getElementById("calculator-modal");
    const display = document.getElementById("calc-display");
    if (modal && display) {
        display.value = "";
        modal.classList.remove("hidden");
    }
};

window.triggerCloseCalculator = function() {
    const modal = document.getElementById("calculator-modal");
    if (modal) modal.classList.add("hidden");
};

window.calcAppend = function(val) {
    const display = document.getElementById("calc-display");
    if (display) {
        display.value += val;
    }
};

window.calcClear = function() {
    const display = document.getElementById("calc-display");
    if (display) {
        display.value = "";
    }
};

window.calcBackspace = function() {
    const display = document.getElementById("calc-display");
    if (display) {
        display.value = display.value.slice(0, -1);
    }
};

window.calcCalculate = function() {
    const display = document.getElementById("calc-display");
    if (display && display.value.trim() !== "") {
        try {
            // تنظيف التعبير لحمايته من التنفيذ الخبيث واستخدام الدالة الحسابية
            const expr = display.value.replace(/[^0-9+\-*/().]/g, '');
            const result = new Function(`return (${expr})`)();
            if (result !== undefined && !isNaN(result)) {
                display.value = parseFloat(result.toFixed(4)).toString();
            } else {
                display.value = "Error";
            }
        } catch (e) {
            display.value = "Error";
        }
    }
};

// الاستماع للوحة المفاتيح للآلة الحاسبة عند فتحها
document.addEventListener("keydown", function(e) {
    const modal = document.getElementById("calculator-modal");
    if (modal && !modal.classList.contains("hidden")) {
        const key = e.key;
        
        // منع السلوك الافتراضي للأزرار لتجنب تحريك الصفحة أو الكتابة بمدخلات أخرى
        if (/^[0-9+\-*/().]$/.test(key) || key === "Enter" || key === "Backspace" || key === "Escape" || key === "Delete") {
            e.preventDefault();
        }

        if (/^[0-9+\-*/().]$/.test(key)) {
            calcAppend(key);
        } else if (key === "Enter" || key === "=") {
            calcCalculate();
        } else if (key === "Backspace") {
            calcBackspace();
        } else if (key === "Escape") {
            triggerCloseCalculator();
        } else if (key === "Delete") {
            calcClear();
        }
    }
});

/* === دوال القائمة الجانبية للموبايل === */
window.toggleMobileSidebar = function() {
    const sidebar = document.getElementById("mobile-sidebar");
    if (sidebar) {
        sidebar.classList.toggle("open");
    }
};

window.handleSidebarNav = function(tabId) {
    if (typeof switchTab === "function") {
        switchTab(tabId);
    }
    // إغلاق القائمة بعد الاختيار
    window.toggleMobileSidebar();
};

/* === نظام الكاميرا وقراءة الباركود المتطور (ZXing JS) للجوال === */
let zxingReader = null;
let zxingDevices = [];
let zxingActiveDeviceIndex = 0;
let zxingTargetInputId = null;
let lastScannedCode = "";
let lastScannedTime = 0;

window.openMobileCameraScanner = function(targetInputId) {
    zxingTargetInputId = targetInputId || null;
    const modal = document.getElementById("mobile-camera-scanner-modal");
    if (!modal) return;

    modal.classList.remove("hidden");
    const msg = document.getElementById("mobile-scan-result-msg");
    if (msg) msg.innerHTML = "🎥 جاري تشغيل الكاميرا المباشرة... وجّه الباركود أمام الشاشة!";

    const manualInput = document.getElementById("mobile-manual-barcode-input");
    if (manualInput) {
        manualInput.value = "";
        setTimeout(() => manualInput.focus(), 300);
    }

    // تهيئة القارئ إذا لم يكن مهيأً
    if (!zxingReader) {
        // نستخدم BrowserMultiFormatReader لقراءة جميع أنواع الباركود
        zxingReader = new ZXing.BrowserMultiFormatReader();
    }

    // إظهار زر تبديل الكاميرات كحالة افتراضية مخفية
    const switchBtn = document.getElementById("btn-switch-mobile-camera");
    if (switchBtn) switchBtn.style.display = "none";

    // الحصول على أجهزة الإدخال المتاحة
    zxingReader.listVideoInputDevices()
        .then((videoInputDevices) => {
            zxingDevices = videoInputDevices;
            if (zxingDevices.length === 0) {
                if (msg) msg.innerHTML = "⚠️ لم يتم العثور على أي كاميرا متصلة بالجهاز!";
                return;
            }

            // إظهار زر التبديل إذا كان هناك أكثر من كاميرا
            if (zxingDevices.length > 1 && switchBtn) {
                switchBtn.style.display = "inline-flex";
            }

            // اختيار الكاميرا الخلفية افتراضياً
            let defaultIndex = 0;
            // نبحث عن كاميرا تحتوي في وصفها على "back" أو "rear" أو "environment"
            for (let i = 0; i < zxingDevices.length; i++) {
                const label = zxingDevices[i].label.toLowerCase();
                if (label.includes("back") || label.includes("rear") || label.includes("environment") || label.includes("خلفية")) {
                    defaultIndex = i;
                    break;
                }
            }
            // إذا لم يجد، نأخذ آخر كاميرا بالقائمة
            if (defaultIndex === 0 && zxingDevices.length > 1) {
                defaultIndex = zxingDevices.length - 1;
            }

            zxingActiveDeviceIndex = defaultIndex;
            startZxingScanner(zxingDevices[zxingActiveDeviceIndex].deviceId);
        })
        .catch((err) => {
            console.error("خطأ في جرد الكاميرات:", err);
            if (msg) msg.innerHTML = "⚠️ تعذر الوصول إلى الكاميرات. تأكد من إعطاء صلاحيات الكاميرا للمتصفح!";
        });
};

function startZxingScanner(deviceId) {
    const msg = document.getElementById("mobile-scan-result-msg");
    if (!zxingReader) return;

    // إعادة الضبط للتأكد من عدم وجود بث جاري
    zxingReader.reset();

    // تشغيل الكاميرا والبدء في القراءة المستمرة
    zxingReader.decodeFromVideoDevice(deviceId, 'mobile-camera-video', (result, err) => {
        if (result) {
            const now = Date.now();
            const cleanCode = window.cleanAndNormalizeBarcode(result.text);

            // تفادي التكرار السريع جداً (أقل من 1.5 ثانية لنفس الباركود)
            if (cleanCode === lastScannedCode && (now - lastScannedTime) < 1500) {
                return;
            }

            lastScannedCode = cleanCode;
            lastScannedTime = now;

            if (msg) {
                msg.style.color = "#10b981";
                msg.innerHTML = `🎉 تم التعرف بنجاح على الباركود: <strong style="font-size: 1.15rem; color: #10b981;">${cleanCode}</strong>`;
            }

            // تشغيل نغمة بيب
            try {
                playBeep();
            } catch (e) {
                console.warn("سياسات متصفح سفاري منعت تشغيل الصوت:", e);
            }

            // إذا كان هناك حقل إدخال مستهدف
            if (zxingTargetInputId) {
                const inputField = document.getElementById(zxingTargetInputId);
                if (inputField) {
                    inputField.value = cleanCode;
                    showToast(`✅ تم مسح الباركود بنجاح: [ ${cleanCode} ]`);
                    inputField.dispatchEvent(new Event('input', { bubbles: true }));
                    inputField.dispatchEvent(new Event('change', { bubbles: true }));
                }
                window.closeMobileCameraScanner();
                return;
            }

            // البيع المباشر في السلة إذا كان العميل في واجهة البيع ولم يحدد مدخلاً
            const prod = (appState.products || []).find(p => p.barcode === cleanCode || p.barcode === result.text);
            if (prod) {
                if (appState.activeTab === "pos") {
                    addProductToCartByBarcode(cleanCode);
                    if (msg) msg.innerHTML = `✅ تم مسح وإضافة [ ${prod.name} ] بالسلة!`;
                    showToast(`✅ تم إضافة [ ${prod.name} ] بالسلة!`);
                } else {
                    if (msg) msg.innerHTML = `✅ متوفر بالمخزن: [ ${prod.name} ] - السعر: ${prod.sellPrice} دج - الكمية: ${prod.qty}`;
                    showToast(`✅ متوفر بالمخزن: [ ${prod.name} ]`);
                }
            } else {
                if (msg) msg.innerHTML = `✨ باركود جديد: [ ${cleanCode} ]. الكاميرا مستمرة بانتظار الباركود...`;
                showToast(`✨ باركود جديد غير مسجل: [ ${cleanCode} ]`);
                // تعبئة حقل الباركود في نموذج الإضافة السريع
                const pInput = document.getElementById("quick-p-barcode");
                if (pInput) pInput.value = cleanCode;
                // فتح نافذة الإضافة السريعة وإغلاق الكاميرا
                window.closeMobileCameraScanner();
                window.openQuickAddProductModal();
            }
        }
        if (err && !(err instanceof ZXing.NotFoundException)) {
            console.warn("خطأ في فك ترميز الإطار:", err);
        }
    });
}

window.closeMobileCameraScanner = function() {
    const modal = document.getElementById("mobile-camera-scanner-modal");
    if (modal) modal.classList.add("hidden");

    if (zxingReader) {
        try {
            zxingReader.reset();
        } catch (e) {
            console.warn("خطأ إيقاف الكاميرا:", e);
        }
    }
};

window.switchMobileCamera = function() {
    if (zxingDevices.length <= 1) return;

    // الانتقال للكاميرا التالية بشكل دائري
    zxingActiveDeviceIndex = (zxingActiveDeviceIndex + 1) % zxingDevices.length;
    const deviceId = zxingDevices[zxingActiveDeviceIndex].deviceId;
    
    showToast(`🔄 جاري التبديل إلى الكاميرا: [ ${zxingDevices[zxingActiveDeviceIndex].label || 'كاميرا أخرى'} ]`);
    startZxingScanner(deviceId);
};

window.submitMobileManualBarcode = function() {
    const input = document.getElementById("mobile-manual-barcode-input");
    if (!input) return;
    const code = window.cleanAndNormalizeBarcode(input.value.trim());
    if (code === "") {
        showToast("⚠️ الرجاء كتابة الباركود أولاً!");
        return;
    }

    try {
        playBeep();
    } catch (e) {}
    input.value = "";

    if (zxingTargetInputId) {
        const inputField = document.getElementById(zxingTargetInputId);
        if (inputField) {
            inputField.value = code;
            showToast(`✅ تم إدخال الباركود يدوياً: [ ${code} ]`);
            inputField.dispatchEvent(new Event('input', { bubbles: true }));
            inputField.dispatchEvent(new Event('change', { bubbles: true }));
        }
        window.closeMobileCameraScanner();
        return;
    }

    const prod = (appState.products || []).find(p => p.barcode === code);
    if (prod) {
        if (appState.activeTab === "pos") {
            addProductToCartByBarcode(code);
            showToast(`✅ تم إضافة [ ${prod.name} ] بالسلة!`);
        } else {
            showToast(`✅ متوفر بالمخزن: [ ${prod.name} ] - السعر: ${prod.sellPrice} دج`);
        }
    } else {
        showToast(`✨ باركود جديد غير مسجل: [ ${code} ]`);
        const pInput = document.getElementById("quick-p-barcode");
        if (pInput) pInput.value = code;
        window.openQuickAddProductModal();
    }
    window.closeMobileCameraScanner();
};
