# همار | Hammar Perfumes — Next.js

واجهة العميل (الرئيسية + المتجر + تفاصيل العطر) مبنية بـ Next.js 14 (App Router) + TypeScript + Tailwind CSS. الألوان مأخوذة من شعار همار: أسود حبر، فضي/كروم، وخلفية بيضاء دافئة.

## التشغيل محليًا

```bash
npm install
npm run dev
```

ثم افتح http://localhost:3000

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
