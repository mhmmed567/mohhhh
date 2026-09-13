"use client";

export function Hero() {
return ( <section
   dir="rtl"
   className="flex min-h-[calc(100vh-76px)] items-center justify-center bg-[#f7f5f0] px-5 py-16"
 > <div className="flex w-full max-w-3xl flex-col items-center justify-center text-center">


    <p className="mb-6 text-xs font-medium tracking-[0.35em] text-black/35">
      HAMMAR PERFUMES
    </p>

   

    <h1 className="text-5xl font-black leading-[1.15] tracking-tight sm:text-6xl lg:text-7xl">
      عطر يترك
      <br />
      أثرًا لا يُنسى
    </h1>

    <p className="mt-6 max-w-md text-base leading-8 text-black/50">
      عطور مختارة بعناية لمن يبحث عن حضور مختلف
    </p>

    <a
      href="#shop"
      className="mt-9 inline-flex rounded-full bg-black px-8 py-4 text-sm font-bold text-white transition duration-300 hover:-translate-y-1 hover:opacity-80"
    >
      اكتشف العطور
    </a>

  </div>
</section>


);
}
