# نگهبانان فلات · Guardians of the Plateau

یک بازی اکشن آرکید سه‌بعدی و آفلاین با رابط فارسی و راست‌چین. شهرهای ایران در قالب یک مسیر داستانی خیالی نمایش داده می‌شوند؛ چهار شخصیت برگرفته از تصاویر ارسالی، در کنار هم با گروه مزدوران خیالی «سایه» مقابله می‌کنند. بازی درباره‌ی مردم یا دولت‌های واقعی نیست.

## اجرا و ساخت نسخه‌ی وب

```bash
npm install
npm run dev       # مرورگر: http://localhost:5173
npm run build     # خروجی بهینه‌شده در dist/
npm run preview
```

### کنترل‌ها

- رایانه: `W A S D` یا کلیدهای جهت‌دار برای حرکت، `J` برای ضربه، `K` برای توان ویژه، `Space` برای جاخالی، `Esc` برای مکث.
- موبایل: دکمه‌های لمسی جهت‌دار و دکمه‌های ضربه، ویژه و جاخالی.
- پنج موج در پنج منطقه؛ بسته‌های امدادی امتیاز و سلامتی می‌دهند. ترکیب دشمنان و محل پیدایش‌شان در هر اجرا تغییر می‌کند.

## اندروید و دانلود APK

پروژه با Capacitor برای Android WebView آماده است. هر بار که این شاخه به GitHub push شود، GitHub Actions به‌طور خودکار با JDK 21 و Android SDK، APK را می‌سازد. پس از موفقیت ساخت:

- APK عمومی از صفحه‌ی [Releases](https://github.com/mrfokolaii-jpg/regional-power-hosted/releases/tag/android-latest) دریافت می‌شود.
- همان فایل به‌مدت ۳۰ روز در بخش **Actions → آخرین اجرای Build Android APK → Artifacts** هم در دسترس خواهد بود.

APK تولیدشده debug-signed است و برای نصب آزمایشی و sideload مناسب است؛ برای انتشار فروشگاهی باید با کلید امضای خصوصی خودتان نسخه‌ی release بسازید. APK را در این محیط کامپایل نکرده‌ام؛ ساخت خودکار به محض push اجرا می‌شود.

برای ساخت محلی، Android Studio، JDK 21 و Android SDK نصب کنید:

```bash
npm install
npm run build
npx cap sync android
cd android && ./gradlew assembleDebug
```

فایل خروجی محلی: `android/app/build/outputs/apk/debug/app-debug.apk`.

## فناوری‌ها

- Three.js برای صحنه‌ی 3D، نورپردازی و شخصیت‌های procedural
- Vite و فونت خودمیزبان Vazirmatn
- PWA با کش آفلاین؛ بدون API یا سرویس خارجی
- Capacitor Android برای بسته‌بندی نصب‌پذیر
