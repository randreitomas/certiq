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
  {
    org: "Certiq Academy",
    title: "Certificate of Achievement",
    name: "Daniel Kim",
    detail: "Engineering Bootcamp · August 2026",
  },
  {
    org: "Certiq Academy",
    title: "Certificate of Completion",
    name: "Amara Okafor",
    detail: "Leadership Intensive · August 2026",
  },
];

function useCardSwapSize() {
  const [size, setSize] = useState({
    width: 420,
    height: 294,
    cardDistance: 50,
    verticalDistance: 58,
    stageMinHeight: 480,
  });

  useEffect(() => {
    const update = () => {
      const vw = window.innerWidth;
      const width = Math.min(460, Math.max(280, vw * 0.44));
      const height = Math.round(width * 0.7);
      const scale = width / 420;
      const verticalDistance = Math.round(58 * scale);
      setSize({
        width: Math.round(width),
        height,
        cardDistance: Math.round(50 * scale),
        verticalDistance,
        stageMinHeight: height + verticalDistance * 4 + 72,
      });
    };

    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  return size;
}

export function LandingPreview() {
  const { width, height, cardDistance, verticalDistance, stageMinHeight } = useCardSwapSize();

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
          skewAmount={5}
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
