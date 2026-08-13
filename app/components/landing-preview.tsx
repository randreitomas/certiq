"use client";

import { useEffect, useState } from "react";
import CardSwap, { Card } from "./card-swap/CardSwap";

const CERTIFICATES = [
  {
    org: "Certiq Academy",
    title: "Certificate of Achievement",
    name: "Alexandra Morgan",
    detail: "Creative Leadership Summit · August 2026",
  },
  {
    org: "Certiq Academy",
    title: "Certificate of Completion",
    name: "Marcus Chen",
    detail: "Design Systems Workshop · August 2026",
  },
  {
    org: "Certiq Academy",
    title: "Certificate of Excellence",
    name: "Sofia Williams",
    detail: "Product Innovation Forum · August 2026",
  },
];

function useCardSwapSize(cardCount: number) {
  const [size, setSize] = useState({
    width: 400,
    height: 280,
    cardDistance: 48,
    verticalDistance: 52,
    stageMinHeight: 380,
  });

  useEffect(() => {
    const update = () => {
      const vw = window.innerWidth;
      const width = Math.min(440, Math.max(260, vw * 0.78));
      const height = Math.round(width * 0.68);
      const scale = width / 400;
      const verticalDistance = Math.round(52 * scale);
      const stackDepth = Math.max(0, cardCount - 1);
      setSize({
        width: Math.round(width),
        height,
        cardDistance: Math.round(48 * scale),
        verticalDistance,
        stageMinHeight: height + verticalDistance * stackDepth + 56,
      });
    };

    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, [cardCount]);

  return size;
}

export function LandingPreview() {
  const { width, height, cardDistance, verticalDistance, stageMinHeight } = useCardSwapSize(CERTIFICATES.length);

  return (
    <section className="card-showcase" aria-hidden="true">
      <div className="card-showcase-stage" style={{ minHeight: stageMinHeight }}>
        <CardSwap
          width={width}
          height={height}
          cardDistance={cardDistance}
          verticalDistance={verticalDistance}
          delay={4500}
          pauseOnHover
          skewAmount={4}
        >
          {CERTIFICATES.map((cert) => (
            <Card key={cert.name} className="cert-swap-card">
              <div className="cert-swap-frame">
                <span className="cert-swap-org">{cert.org}</span>
                <strong className="cert-swap-title">{cert.title}</strong>
                <p className="cert-swap-kicker">This certificate is proudly presented to</p>
                <span className="cert-swap-name">{cert.name}</span>
                <p className="cert-swap-detail">{cert.detail}</p>
              </div>
            </Card>
          ))}
        </CardSwap>
      </div>
    </section>
  );
}
