export function Story() {
  return (
    <section
      id="story"
      className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-14 border-y border-line px-7 py-24 md:grid-cols-2"
    >
      <p className="font-display text-2xl italic leading-relaxed">
        &quot;لا نصمم عطرًا ليُشمّ فقط، بل ليصبح جزءًا من الطريقة التي
        يتذكرك بها الناس.&quot;
      </p>

      <div>
        <p className="mb-5 text-[17px] text-silver-dark">
          بدأت همار من فكرة بسيطة: أن العطر الحقيقي لا يحتاج زجاجة صاخبة أو
          اسمًا يلفت النظر. يحتاج فقط أن يكون صادقًا مع من يرتديه.
        </p>
        <p className="mb-8 text-[17px] text-silver-dark">
          كل عطر في المجموعة يُختبر ويُعاد تركيبه حتى يحمل توازنًا هادئًا بين
          الحضور والرقة — لا يطغى، ولا يختفي.
        </p>
        <div className="ornament-rule">
          <span className="diamond" />
        </div>
      </div>
    </section>
  );
}
