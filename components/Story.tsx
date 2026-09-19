import Link from "next/link";

export function Story() {
  return (
    <section id="story" dir="rtl" className="scroll-mt-28 px-4 py-16 sm:px-6 md:px-10">
      <div className="mx-auto grid max-w-7xl gap-8 rounded-[32px] bg-ink p-8 text-paper sm:p-12 md:grid-cols-[1fr_2fr] md:p-16">
        <p className="text-xs tracking-[0.25em] text-white/50">THE HAMMAR STORY</p>
        <div>
          <h2 className="font-display text-4xl sm:text-5xl">لكل حضور، حكاية.</h2>
          <p className="mt-6 max-w-xl text-sm leading-8 text-white/70">
            في همّار، نؤمن أن العطر أكثر من تفصيل أخير. هو تعبير عن ذوقك،
            وذكرى ترتبط بلحظة، وأثر يحمل شيئًا منك.
          </p>
          <Link href="/story" className="mt-8 inline-flex rounded-full border border-white/30 px-6 py-3 text-sm transition hover:bg-white hover:text-black focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4">
            تعرّف على قصتنا ←
          </Link>
        </div>
      </div>
    </section>
  );
}
