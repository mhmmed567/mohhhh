# همار | Hammar Perfumes — Next.js

واجهة العميل (الرئيسية + المتجر + تفاصيل العطر) مبنية بـ Next.js 14 (App Router) + TypeScript + Tailwind CSS. الألوان مأخوذة من شعار همار: أسود حبر، فضي/كروم، وخلفية بيضاء دافئة.

## التشغيل محليًا

```bash
npm install
npm run dev
```

ثم افتح http://localhost:3000

## الظهور في بحث Google

- يوفّر الموقع `/robots.txt` للسماح بالزحف، و`/sitemap.xml` للصفحات العامة: الرئيسية، القصة، والعروض.
- اضبط متغير البيئة `SITE_URL` على رابط الموقع الأساسي المنشور، مثل `https://example.com`. هذا يجعل روابط الخريطة ووسوم canonical تشير إلى نطاق واحد حتى عند زيارة رابط معاينة أو نطاق بديل. عند عدم ضبطه يستخدم الموقع نطاق الطلب الحالي.
- إذا اخترت إثبات ملكية Google Search Console بوسم HTML، اضبط `GOOGLE_SITE_VERIFICATION` على قيمة `content` التي يعطيك إياها Google، ثم أعد نشر الموقع. يمكن استخدام إثبات الملكية عبر DNS بدلًا من ذلك.
- بعد النشر، أضف النطاق إلى [Google Search Console](https://search.google.com/search-console)، ثم أرسل `https://your-domain/sitemap.xml` من قسم **Sitemaps** واطلب فهرسة الصفحة الرئيسية من **URL Inspection**.
- صفحات الحساب والسلة وإتمام الشراء والطلبات وتسجيل الدخول والإدارة ترسل `X-Robots-Tag: noindex, nofollow`، لذلك لا تُدرج في خريطة الموقع.

إضافة خريطة الموقع وإرسالها تساعد Google على اكتشاف الصفحات، لكنها لا تضمن ظهورها فورًا في النتائج.

## هيكل المشروع

```
app/
  layout.tsx      عناصر الصفحة العامة + الخطوط (Amiri + IBM Plex Sans Arabic)
  page.tsx         الصفحة الرئيسية (تجمع كل الأقسام)
  globals.css      المتغيرات والحركات
components/
  Nav.tsx          شريط التنقل + الشعار + السلة
  Hero.tsx         القسم الرئيسي بحركة الفتح
  Story.tsx        قصة العلامة
  Shop.tsx         شبكة العطور + لوحة التفاصيل (تفاعلي)
  Footer.tsx       تواصل واتساب + روابط
  BottleIcon.tsx   رسم الزجاجة (SVG قابل لإعادة الاستخدام)
lib/
  products.ts      بيانات العطور
public/
  logo.jpg         شعار همار
```

## الخطوة القادمة

هذا يغطي واجهة العميل فقط. سلة حقيقية، Checkout، رفع إثبات التحويل، ولوحة تحكم Hammar OS تحتاج ربط بقاعدة بيانات (Firebase أو غيرها) ومسارات API — جاهز أبنيها بعدين بنفس الهوية.
