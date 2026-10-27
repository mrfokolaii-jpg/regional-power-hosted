# نگهبانان فلات · Guardians of the Plateau

یک بازی اکشن آرکید سه‌بعدیِ side-scrolling با رابط فارسی و راست‌چین. مسیر پنج‌مرحله‌ای از گذر بازار تبریز، کوچهٔ مروی تهران، گذر جلفای اصفهان، سنگ‌سیاه شیراز و محلهٔ عامری اهواز می‌گذرد. چهار نگهبان با لباس‌ها و پرچم‌های برگرفته از تصاویر ارسالی، با گروه مزدوران خیالی «سایه» روبه‌رو می‌شوند. بازی درباره‌ی مردم یا دولت‌های واقعی نیست.

## اجرا و ساخت نسخه‌ی وب

```bash
npm install
npm run dev       # مرورگر: http://localhost:5173
npm run build     # خروجی بهینه‌شده در dist/
npm run preview
```

### کنترل‌ها

- موبایل: بازی در حالت افقی و تمام‌صفحه اجرا می‌شود؛ جوی‌استیک مجازیِ سمت چپ برای حرکت در عمق و طول خیابان، و دکمه‌های سمت راست برای پرش، مشت، لگد و ضربه‌ی قدرتی.
- رایانه: `W A S D` یا کلیدهای جهت‌دار برای حرکت، `J` مشت، `L` لگد، `K` قدرت ویژه، `Space` پرش، `Shift` جاخالی و `Esc` مکث.
- دوربین در امتداد مسیر حرکت اسکرول می‌کند؛ با پاک‌سازی هر موج، نشانه‌ی شاخص شهر و نام گذر/محله‌ی مرحله‌ی بعد نمایش داده می‌شود.

## اندروید و دانلود APK

پروژه با Capacitor برای Android WebView آماده است. هر بار که این شاخه به GitHub push شود، GitHub Actions به‌طور خودکار با JDK 21 و Android SDK، APK را می‌سازد. پس از موفقیت ساخت:

- APK عمومی از صفحه‌ی [Releases](https://github.com/mrfokolaii-jpg/regional-power-hosted/releases/tag/android-latest) دریافت می‌شود.
- همان فایل به‌مدت ۳۰ روز در بخش **Actions → آخرین اجرای Build Android APK → Artifacts** هم در دسترس خواهد بود.

آخرین APK پس از ساخت موفق GitHub Actions از لینک بالا در دسترس است. فایل debug-signed و برای نصب آزمایشی/sideload مناسب است؛ برای انتشار فروشگاهی باید با کلید امضای خصوصی، نسخه‌ی release جداگانه امضا شود.

برای ساخت محلی، Android Studio، JDK 21 و Android SDK نصب کنید:

```bash
npm install
npm run build
npx cap sync android
cd android && ./gradlew assembleDebug
```

فایل خروجی محلی: `android/app/build/outputs/apk/debug/app-debug.apk`.

## فناوری‌ها و ارجاع

- Three.js برای صحنه‌ی 3D، نورپردازی، افکت سایه و انیمیشن رویه‌ایِ شخصیت‌ها
- Vite و فونت خودمیزبان Vazirmatn
- PWA با کش آفلاین؛ بدون API یا سرویس خارجی
- Capacitor Android برای بسته‌بندی نصب‌پذیر

نمونه‌ی MIT [`quiver-dev/template-beat-em-up`](https://github.com/quiver-dev/template-beat-em-up) برای الگوی کلی حالت‌های حرکت/پرش/ضربه بررسی شد؛ چون آن پروژه Godot است، کدش مستقیماً به پروژه‌ی Three.js/Capacitor منتقل نشد. هیچ کد، تصویر یا موسیقی اختصاصی Streets of Rage استفاده نشده است.
