# ELmagik Cool

موقع وتطبيق ELmagik Cool لخدمات الصيانة (تكييف، تبريد، أجهزة منزلية، كهرباء وكنترول).

- `index.html` + `admin.js`: الموقع الرئيسي ولوحة إدارة الموقع.
- `app.html` + `app.js` + `workflow.js`: تطبيق طلب الخدمة (عميل / فني / مدير) والمحادثات.
- `sw.js` + `manifest.webmanifest`: PWA.
- `capacitor.config.json` + `.github/workflows/build-android-apk.yml`: بناء تطبيق أندرويد (APK) تلقائيًا من GitHub Actions.

النشر: Vercel (`https://elmagikcool.vercel.app`) مرتبط بهذا المستودع. التفاصيل في `SETUP-AR.txt`.

> لا تضع مفتاح `service_role` أو أي مفتاح سري داخل ملفات الواجهة. المفتاح العام (publishable) فقط.
