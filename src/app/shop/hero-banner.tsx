"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

type Slide = {
  badge: string;
  titleLight: string;
  titleBold: string;
  text: string;
  image: string;
  alt: string;
  href: string;
  sticker: [string, string, string];
};

const SLIDES: Slide[] = [
  {
    badge: "WEEKEND DISCOUNT",
    titleLight: "The future of health,",
    titleBold: "shopping with style",
    text: "Track your fitness with a bright AMOLED display in a slim case.",
    image: "/products/p-3.svg",
    alt: "Pulse Smartwatch",
    href: "/shop/products/p-3",
    sticker: ["GET A", "FREE", "ADDITIONAL STRAP"],
  },
  {
    badge: "NEW ARRIVALS",
    titleLight: "Sound that moves you,",
    titleBold: "hear every detail",
    text: "Active noise cancellation with a massive 40-hour battery life.",
    image: "/products/p-1.svg",
    alt: "Aurora Headphones",
    href: "/shop/products/p-1",
    sticker: ["SAVE", "20%", "ON ALL AUDIO"],
  },
  {
    badge: "LIMITED OFFER",
    titleLight: "See every pixel,",
    titleBold: "upgrade your setup",
    text: "27-inch 4K IPS with 144Hz refresh and stunning color coverage.",
    image: "/products/p-6.svg",
    alt: "Vertex 4K Monitor",
    href: "/shop/products/p-6",
    sticker: ["FREE", "HDMI", "CABLE INCLUDED"],
  },
];

export function HeroBanner() {
  const [active, setActive] = useState(0);

  useEffect(() => {
    const id = setInterval(
      () => setActive((i) => (i + 1) % SLIDES.length),
      6000
    );
    return () => clearInterval(id);
  }, []);

  const slide = SLIDES[active];

  return (
    <section className="relative overflow-hidden rounded-3xl border border-line bg-[#0d0d0d]">
      {/* ambient lime glow */}
      <div className="pointer-events-none absolute -top-32 -right-24 h-96 w-96 rounded-full bg-accent/15 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 -left-24 h-80 w-80 rounded-full bg-accent/10 blur-3xl" />

      <div
        key={active}
        className="relative flex flex-col items-center gap-10 px-8 py-12 md:flex-row md:justify-between md:px-16 md:py-14"
      >
        {/* Copy */}
        <div className="max-w-xl text-center md:text-left">
          <span className="animate-slide-in inline-block rounded-full bg-brand-gradient px-4 py-1.5 text-[11px] font-bold tracking-[0.15em] text-black">
            {slide.badge}
          </span>
          <h2 className="animate-fade-up mt-5 text-4xl leading-tight md:text-5xl" style={{ animationDelay: "80ms" }}>
            <span className="block font-light text-white/85">{slide.titleLight}</span>
            <span className="text-brand-gradient block font-extrabold">
              {slide.titleBold}
            </span>
          </h2>
          <p
            className="animate-fade-up mt-4 text-[15px] text-muted"
            style={{ animationDelay: "160ms" }}
          >
            {slide.text}
          </p>
          <div className="animate-fade-up mt-7" style={{ animationDelay: "240ms" }}>
            <Link
              href={slide.href}
              className="inline-flex items-center gap-2 rounded-full bg-brand-gradient px-8 py-3 text-sm font-bold text-black transition hover:brightness-110"
            >
              Shop Now
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
                <path d="M4 12h15m0 0-6-6m6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Link>
          </div>
        </div>

        {/* Visual + sticker */}
        <div className="relative shrink-0">
          <div className="animate-glow relative h-56 w-72 overflow-hidden rounded-2xl border border-accent/30 md:h-64 md:w-84">
            <Image
              src={slide.image}
              alt={slide.alt}
              fill
              unoptimized
              className="object-cover"
            />
          </div>
          <div className="animate-float absolute -bottom-4 -right-5 flex h-28 w-28 flex-col items-center justify-center rounded-full bg-brand-gradient text-center text-black shadow-xl shadow-accent/20 md:h-32 md:w-32">
            <span className="text-[10px] font-semibold tracking-wide">
              {slide.sticker[0]}
            </span>
            <span className="text-2xl font-extrabold leading-none md:text-3xl">
              {slide.sticker[1]}
            </span>
            <span className="mt-1 max-w-24 text-[9px] font-semibold leading-tight tracking-wide">
              {slide.sticker[2]}
            </span>
          </div>
        </div>
      </div>

      {/* Dots */}
      <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-2">
        {SLIDES.map((s, i) => (
          <button
            key={s.badge}
            onClick={() => setActive(i)}
            aria-label={`Slide ${i + 1}`}
            className={`h-2 rounded-full transition-all duration-300 ${
              i === active ? "w-6 bg-accent" : "w-2 bg-white/25 hover:bg-white/50"
            }`}
          />
        ))}
      </div>
    </section>
  );
}
