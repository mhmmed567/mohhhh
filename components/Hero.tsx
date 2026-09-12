export function Hero() {
  return (
    <section className="mx-auto max-w-6xl px-7 py-24 md:py-28">
      <div className="text-center md:text-right">
        <p
          className="rise mb-4 text-[15px] text-silver-dark"
          style={{ animationDelay: "0.15s" }}
        >
          عطور مصنوعة لتُذكر، لا لتُلاحظ فقط
        </p>

        <h1
          className="rise mb-6 font-display text-[42px] font-bold leading-[1.15] md:text-[64px]"
          style={{ animationDelay: "0.3s" }}
        >
          فخامة صامتة،
          <br />
          تبقى بعد خروجك من الغرفة
        </h1>

        <p
          className="rise mx-auto mb-9 max-w-[44ch] text-[17px] text-silver-dark md:mx-0"
          style={{ animationDelay: "0.5s" }}
        >
          همار مجموعة عطور محدودة، كل زجاجة تُركّب بعناية لتحمل حضورًا هادئًا
          يليق بمن لا يحتاج أن يرفع صوته ليُلاحظ.
        </p>

        <div
          className="rise flex flex-wrap justify-center gap-4 md:justify-start"
          style={{ animationDelay: "0.68s" }}
        >
          <a
            href="#shop"
            className="rounded-sm bg-ink px-8 py-3.5 text-[15px] font-medium text-paper transition-all hover:-translate-y-0.5 hover:bg-silver-dark"
          >
            تسوّق العطور
          </a>

          <a
            href="#story"
            className="rounded-sm border border-lineStrong px-6 py-3.5 text-[15px] transition-colors hover:border-silver-dark hover:text-silver-dark"
          >
            تعرّف على همار
          </a>
        </div>
      </div>
    </section>
  );
}