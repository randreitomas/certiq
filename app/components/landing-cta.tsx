"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

type LandingCtaProps = {
  title: ReactNode;
  body: ReactNode;
  button: string;
  href?: string;
};

export function LandingCta({ title, body, button, href = "/studio" }: LandingCtaProps) {
  const ref = useRef<HTMLElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true); },
      { threshold: 0.25 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <section ref={ref} className={`cta-band ${visible ? "is-visible" : ""}`}>
      <div className="cta-band-inner">
        <h2>{title}</h2>
        <p>{body}</p>
        <a className="cta-button" href={href}>{button}</a>
      </div>
    </section>
  );
}
