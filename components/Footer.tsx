export function Footer() {
  return (
    <footer id="contact" className="border-t border-line px-7 py-20">
      <div className="mx-auto max-w-6xl">
        <div className="mb-16 flex flex-wrap items-start justify-between gap-10">
          <div>
            <h2 className="mb-5 max-w-[20ch] font-display text-[28px] font-bold md:text-[34px]">
              لديك سؤال قبل الطلب؟
            </h2>
            <a
              href="https://wa.me/96876956605"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-sm border border-lineStrong px-6 py-3 text-sm transition-colors hover:border-silver-dark hover:text-silver-dark"
            >
              تواصل معنا عبر واتساب
            </a>
          </div>

          <div className="flex gap-16 text-sm text-silver-dark">
            <div className="flex flex-col gap-2.5">
              <span className="text-ink">تسوّق</span>
              <a href="#shop" className="hover:text-ink">كل العطور</a>
              <a href="#story" className="hover:text-ink">قصتنا</a>
            </div>
            <div className="flex flex-col gap-2.5">
              <span className="text-ink">حسابي</span>
              <a href="#" className="hover:text-ink">تسجيل الدخول</a>
              <a href="#" className="hover:text-ink">طلباتي</a>
            </div>
          </div>
        </div>

        <div className="flex justify-between border-t border-line pt-6 text-[13px] text-silver-dark">
          <span>© 2026 همار</span>
          <span>مسقط، عُمان</span>
        </div>
      </div>
    </footer>
  );
}
