import type { Metadata } from "next";
import Link from "next/link";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";

export const metadata: Metadata = {
  title: "قصتنا | همّار",
  description: "تعرّف على عالم همّار؛ العطر كتعبير عن الذوق والحضور والذكريات.",
};

const values = [
  { number: "01", title: "حضور يشبهك", text: "نؤمن أن اختيار العطر مسألة شخصية. ما يلفتك فيه هو ما يجعله جزءًا من يومك وملامح ذوقك." },
  { number: "02", title: "جمال في البساطة", text: "نميل إلى التفاصيل الهادئة والمساحات الواضحة؛ ليبقى العطر في قلب التجربة، دون مبالغة." },
  { number: "03", title: "لحظة تستحق أن تُذكر", text: "عطر تختاره لنفسك، أو هدية تعبّر بها عن تقديرك. لكل اختيار معنى، ولكل ذكرى رائحتها." },
];

export default function StoryPage() {
  return (
    <div dir="rtl" className="min-h-screen bg-paper text-ink">
      <Nav />
      <main id="story">
        <section className="px-5 pb-20 pt-12 sm:px-8 md:pb-28 md:pt-20">
          <div className="mx-auto max-w-6xl">
            <Link href="/" className="text-sm text-black/60 underline-offset-4 hover:underline">الرئيسية / قصتنا</Link>
            <div className="mt-12 grid items-center gap-12 md:grid-cols-[1.3fr_1fr]">
              <div>
                <p className="text-xs tracking-[0.3em] text-black/50">OUR STORY — HAMMAR</p>
                <h1 className="mt-6 font-display text-5xl leading-tight sm:text-7xl">قصتنا تبدأ<br />من أثرٍ يبقى.</h1>
                <p className="mt-8 max-w-xl text-base leading-9 text-black/65">
                  بعض اللحظات تمرّ، وتبقى رائحتها في الذاكرة.
                  في همّار، نرى العطر لغة هادئة تعبّر عنك؛
                  لا تحتاج إلى كثير من الكلام، فقط حضور يشبهك.
                </p>
              </div>
              <div className="relative flex aspect-square items-center justify-center overflow-hidden rounded-[36px] border border-black/10 bg-gradient-to-br from-white via-stone-100 to-neutral-300 p-10">
                <div aria-hidden="true" className="absolute inset-6 rounded-full border border-black/10" />
                <div className="relative text-center">
                  <p className="font-display text-7xl sm:text-8xl">همّار</p>
                  <p className="mt-5 text-xs tracking-[0.4em]">HAMMAR PERFUMES</p>
                  <p className="mt-10 text-sm text-black/60">فخامة هادئة. أثر شخصي.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section aria-labelledby="philosophy-title" className="bg-ink px-5 py-20 text-paper sm:px-8 md:py-28">
          <div className="mx-auto grid max-w-6xl gap-8 md:grid-cols-[1fr_2fr]">
            <p className="text-xs tracking-[0.25em] text-white/50">THE PHILOSOPHY</p>
            <div>
              <h2 id="philosophy-title" className="font-display text-4xl sm:text-5xl">ليس مجرد عطر.<br />بل مساحة للتعبير عنك.</h2>
              <p className="mt-8 max-w-2xl text-base leading-9 text-white/70">
                فكرتنا بسيطة: أن يكون للعطر مكان في تفاصيل حياتك،
                من بداية يوم عادي إلى مناسبة تنتظرها.
                نطمح أن تجد في همّار اختيارًا ترتاح له وتعود إليه،
                لأنه يرتبط بك وباللحظات التي تعني لك.
              </p>
            </div>
          </div>
        </section>

        <section aria-labelledby="values-title" className="px-5 py-20 sm:px-8 md:py-28">
          <div className="mx-auto max-w-6xl">
            <h2 id="values-title" className="font-display text-4xl sm:text-5xl">ما نؤمن به</h2>
            <div className="mt-12 grid gap-8 md:grid-cols-3">
              {values.map((value) => (
                <article key={value.number} className="border-t border-black/15 pt-6">
                  <p className="text-xs tracking-widest text-black/40">{value.number}</p>
                  <h3 className="mt-6 text-xl font-semibold">{value.title}</h3>
                  <p className="mt-4 text-sm leading-8 text-black/65">{value.text}</p>
                </article>
              ))}
            </div>
            <div className="mt-20 rounded-[32px] border border-black/10 bg-white px-6 py-12 text-center">
              <h2 className="font-display text-3xl sm:text-4xl">والآن، اختر عطرك.</h2>
              <p className="mt-4 text-sm leading-7 text-black/60">اكتشف عطور همّار، ودع اختيارك يحكي الباقي.</p>
              <Link href="/#shop" className="mt-7 inline-flex rounded-full bg-ink px-8 py-4 text-sm font-semibold text-paper transition hover:opacity-80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-black">
                اكتشف العطور ←
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
