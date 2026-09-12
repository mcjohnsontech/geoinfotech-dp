import React, { useCallback, useEffect, useRef, useState } from "react";

// ---------------------------------------------------------------------------
// Geoinnovation Summit — "Make It Official" DP maker.
//
// Only three things are user-editable: the photo, the person's name, and
// which preset is selected. Everything else (headline, big word, captions,
// accent color) is bundled inside the preset definition below and swaps in
// automatically when a preset is chosen.
//
// Styling note: colors/opacity/blur/sizes are applied via inline `style`
// objects rather than Tailwind's bracket/opacity-slash syntax, since those
// require a JIT compiler that isn't present in a no-build-step environment.
// ---------------------------------------------------------------------------

const CANVAS_W = 1024;
const CANVAS_H = 1280;
const PAGE_FONT = "'Poppins', sans-serif";

const COLORS = {
  bg: "#05060d",
  panel: "rgba(255,255,255,0.04)",
  panelBorder: "rgba(255,255,255,0.10)",
  panelSoft: "rgba(255,255,255,0.06)",
  textMuted: "rgba(255,255,255,0.55)",
  textFaint: "rgba(255,255,255,0.35)",
  orange: "#f5821f",
  orangeSoft: "#fbbf74",
};

interface Preset {
  label: string;
  headline: string;
  bigWord: string;
  captionTop: string; // use {name} as placeholder
  captionBottom: string;
  accent: string;
  grayscale: boolean;
}

const PRESETS: Preset[] = [
  {
    label: "Fired",
    headline: "BREAKING NEWS",
    bigWord: "FIRED",
    captionTop: "This is to officially announce that I {name} is",
    captionBottom: "up for the Geoinnovation Summit. Hope you are too.",
    accent: "#ef4444",
    grayscale: true,
  },
  {
    label: "Hired",
    headline: "BREAKING NEWS",
    bigWord: "HIRED",
    captionTop: "This is to officially announce that I {name} is",
    captionBottom: "joining us at the Geoinnovation Summit. Welcome aboard.",
    accent: "#22c55e",
    grayscale: true,
  },
  {
    label: "Promoted",
    headline: "BREAKING NEWS",
    bigWord: "PROMOTED",
    captionTop: "This is to officially announce that our very own {name} just got",
    captionBottom: "up for the Geoinnovation Summit. Big moves ahead.",
    accent: "#f5821f",
    grayscale: true,
  },
  {
    label: "Speaking",
    headline: "JUST ANNOUNCED",
    bigWord: "SPEAKING",
    captionTop: "This is to officially announce that {name} will be",
    captionBottom: "at the Geoinnovation Summit. Catch the session live.",
    accent: "#7c3aed",
    grayscale: true,
  },
  {
    label: "Attending",
    headline: "SEE YOU THERE",
    bigWord: "ATTENDING",
    captionTop: "This is to officially announce that I {name} is",
    captionBottom: "the Geoinnovation Summit. Hope you are too.",
    accent: "#3b82f6",
    grayscale: true,
  },
];

function fitText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  startSize: number,
  font: (size: number) => string
): number {
  let size = startSize;
  ctx.font = font(size);
  while (ctx.measureText(text).width > maxWidth && size > 8) {
    size -= 2;
    ctx.font = font(size);
  }
  return size;
}

function wrapLines(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number
): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const test = current ? current + " " + word : word;
    if (ctx.measureText(test).width > maxWidth && current) {
      lines.push(current);
      current = word;
    } else {
      current = test;
    }
  }
  if (current) lines.push(current);
  return lines;
}

export default function GeoinnovationDPLanding() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const [presetIndex, setPresetIndex] = useState(0);
  const [name, setName] = useState("Your Name");
  const [fileName, setFileName] = useState<string | null>(null);
  const [, setImgTick] = useState(0);

  const preset = PRESETS[presetIndex];

  const handleUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        imgRef.current = img;
        setImgTick((t) => t + 1);
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  }, []);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = CANVAS_W;
    canvas.height = CANVAS_H;

    ctx.fillStyle = "#0b0d16";
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

    const img = imgRef.current;
    if (img) {
      const scale = Math.max(CANVAS_W / img.width, CANVAS_H / img.height);
      const w = img.width * scale;
      const h = img.height * scale;
      const x = (CANVAS_W - w) / 2;
      const y = (CANVAS_H - h) / 2;
      ctx.save();
      ctx.filter = preset.grayscale
        ? "grayscale(1) contrast(1.08) brightness(0.95)"
        : "contrast(1.05)";
      ctx.drawImage(img, x, y, w, h);
      ctx.restore();
    } else {
      ctx.fillStyle = "#1a1d2b";
      ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
      ctx.fillStyle = "#5b6178";
      ctx.font = `32px ${PAGE_FONT}`;
      ctx.textAlign = "center";
      ctx.fillText("Upload a photo to begin", CANVAS_W / 2, CANVAS_H / 2);
    }

    const topGrad = ctx.createLinearGradient(0, 0, 0, 260);
    topGrad.addColorStop(0, "rgba(0,0,0,0.78)");
    topGrad.addColorStop(0.55, "rgba(0,0,0,0.3)");
    topGrad.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = topGrad;
    ctx.fillRect(0, 0, CANVAS_W, 260);

    const botGrad = ctx.createLinearGradient(0, CANVAS_H - 520, 0, CANVAS_H);
    botGrad.addColorStop(0, "rgba(0,0,0,0.12)");
    botGrad.addColorStop(0.35, "rgba(0,0,0,0.82)");
    botGrad.addColorStop(1, "rgba(0,0,0,0.98)");
    ctx.fillStyle = botGrad;
    ctx.fillRect(0, CANVAS_H - 520, CANVAS_W, 520);

    const headlineFont = (size: number) => `900 ${size}px Futura, ${PAGE_FONT}`;
    const poster = (size: number) => `900 ${size}px ${PAGE_FONT}`;

    ctx.textAlign = "center";
    ctx.textBaseline = "alphabetic";
    const headlineSize = fitText(ctx, preset.headline, CANVAS_W * 0.8, 120, headlineFont);
    ctx.font = headlineFont(headlineSize);
    ctx.lineWidth = headlineSize * 0.09;
    ctx.strokeStyle = "#000";
    ctx.fillStyle = preset.accent;
    ctx.save();
    ctx.translate(CANVAS_W / 2, 150);
    ctx.strokeText(preset.headline.toUpperCase(), 0, 0);
    ctx.fillText(preset.headline.toUpperCase(), 0, 0);
    ctx.restore();

    const captionTopText = preset.captionTop.replace("{name}", name || "Your Name");
    ctx.font = `700 30px ${PAGE_FONT}`;
    ctx.fillStyle = "#fff";
    const capLines = wrapLines(ctx, captionTopText, CANVAS_W - 120);
    let capY = CANVAS_H - 470;
    for (const line of capLines) {
      ctx.fillText(line, CANVAS_W / 2, capY);
      capY += 40;
    }

    const bigWord = preset.bigWord.toUpperCase();
    const bigSize = fitText(ctx, bigWord, CANVAS_W - 40, 260, poster);
    ctx.font = poster(bigSize);
    ctx.lineWidth = bigSize * 0.06;
    ctx.strokeStyle = "#000";
    ctx.fillStyle = preset.accent;
    const bigY = capY + bigSize * 0.72;
    ctx.save();
    ctx.translate(CANVAS_W / 2, bigY);
    ctx.scale(1.05, 1);
    ctx.strokeText(bigWord, 0, 0);
    ctx.fillText(bigWord, 0, 0);
    ctx.restore();

    ctx.font = `700 28px ${PAGE_FONT}`;
    ctx.fillStyle = "#fff";
    const bottomLines = wrapLines(ctx, preset.captionBottom, CANVAS_W - 140);
    let botY = bigY + 70;
    for (const line of bottomLines) {
      ctx.fillText(line, CANVAS_W / 2, botY);
      botY += 38;
    }
  }, [preset, name]);

  useEffect(() => {
    draw();
  }, [draw]);

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement("a");
    link.download = `${preset.bigWord.toLowerCase()}-geoinnovation.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  const panelStyle: React.CSSProperties = {
    background: COLORS.panel,
    border: `1px solid ${COLORS.panelBorder}`,
    backdropFilter: "blur(20px)",
    WebkitBackdropFilter: "blur(20px)",
  };

  return (
    <div
      style={{
        position: "relative",
        minHeight: "100vh",
        width: "100%",
        overflow: "hidden",
        backgroundColor: COLORS.bg,
        color: "#fff",
        fontFamily: PAGE_FONT,
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800;900&display=swap');
        .gd-display { font-family: ${PAGE_FONT}; }
        @media (min-width: 768px) {
          .gd-hero { grid-template-columns: 1fr 1fr !important; padding: 40px !important; }
        }
      `}</style>

      {/* Ambient glow background */}
      <div style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none" }}>
        <div
          style={{
            position: "absolute",
            right: -160,
            bottom: -160,
            height: 700,
            width: 700,
            borderRadius: "9999px",
            background: "radial-gradient(circle at 30% 30%, #fb923c, #db2777 55%, #7c3aed 100%)",
            opacity: 0.35,
            filter: "blur(120px)",
          }}
        />
        <div
          style={{
            position: "absolute",
            left: "30%",
            top: 40,
            height: 500,
            width: 500,
            borderRadius: "9999px",
            backgroundColor: "#2563eb",
            opacity: 0.18,
            filter: "blur(130px)",
          }}
        />
      </div>

      <div style={{ position: "relative" }}>
        {/* Navbar */}
        <header
          style={{
            ...panelStyle,
            margin: "16px 16px 0",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 16,
            borderRadius: 16,
            padding: "12px 24px",
          }}
        >
          <div className="gd-display" style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
            <span style={{ fontSize: 18, fontWeight: 700 }}>Geoinnovation</span>
            <span style={{ fontSize: 12, fontWeight: 500, color: COLORS.textMuted }}>summit</span>
          </div>
          {/* <span style={{ fontSize: 13, color: COLORS.textFaint }}>Make it official with a DP maker</span> */}
        </header>

        {/* Hero + tool */}
        <section
          style={{
            ...panelStyle,
            margin: "24px 16px",
            borderRadius: 24,
            padding: 24,
            display: "grid",
            gridTemplateColumns: "1fr",
            gap: 24,
          }}
          className="gd-hero"
        >
          {/* Left: copy + controls */}
          <div style={{ display: "flex", flexDirection: "column", justifyContent: "center" }}>
            <span className="gd-display" style={{ fontSize: 14, fontWeight: 600, color: COLORS.orange }}>
              For attendees:
            </span>
            <h1 className="gd-display" style={{ marginTop: 12, fontSize: 34, fontWeight: 800, lineHeight: 1.15 }}>
              Make it official
              <br />
              with your own DP.
            </h1>
            <p style={{ marginTop: 12, maxWidth: 420, color: COLORS.textMuted }}>
              Upload your photo, add your name, and pick a preset — the
              headline, wording, and colors update to match automatically.
            </p>

            {/* Photo upload */}
            <div style={{ marginTop: 24 }}>
              <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: COLORS.textFaint, marginBottom: 6 }}>
                Photo
              </label>
              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  height: 64,
                  borderRadius: 12,
                  border: `1px dashed ${COLORS.panelBorder}`,
                  color: COLORS.textMuted,
                  fontSize: 13,
                  cursor: "pointer",
                }}
              >
                {fileName ? fileName : "Click to upload a photo"}
                <input type="file" accept="image/*" style={{ display: "none" }} onChange={handleUpload} />
              </label>
            </div>

            {/* Name */}
            <div style={{ marginTop: 16 }}>
              <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: COLORS.textFaint, marginBottom: 6 }}>
                Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                style={{
                  width: "100%",
                  borderRadius: 12,
                  border: `1px solid ${COLORS.panelBorder}`,
                  backgroundColor: COLORS.panelSoft,
                  padding: "10px 14px",
                  fontSize: 14,
                  color: "#fff",
                  outline: "none",
                  boxSizing: "border-box",
                }}
              />
            </div>

            {/* Preset picker */}
            <div style={{ marginTop: 16 }}>
              <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: COLORS.textFaint, marginBottom: 6 }}>
                Preset
              </label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {PRESETS.map((p, i) => {
                  const active = i === presetIndex;
                  return (
                    <button
                      key={p.label}
                      onClick={() => setPresetIndex(i)}
                      style={{
                        borderRadius: 9999,
                        padding: "8px 16px",
                        fontSize: 14,
                        fontWeight: 600,
                        cursor: "pointer",
                        border: `1px solid ${active ? p.accent : COLORS.panelBorder}`,
                        color: active ? p.accent : COLORS.textMuted,
                        backgroundColor: active ? `${p.accent}22` : "transparent",
                      }}
                    >
                      {p.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <button
              onClick={handleDownload}
              style={{
                marginTop: 24,
                borderRadius: 9999,
                background: `linear-gradient(90deg, ${COLORS.orange}, ${COLORS.orangeSoft})`,
                padding: "12px 24px",
                fontSize: 14,
                fontWeight: 700,
                color: "#1a1200",
                border: "none",
                cursor: "pointer",
                boxShadow: "0 10px 25px -10px rgba(245,130,31,0.6)",
                alignSelf: "flex-start",
              }}
            >
              Download PNG
            </button>
          </div>

          {/* Right: live preview, styled like the site's video widget */}
          <div
            style={{
              overflow: "hidden",
              borderRadius: 16,
              border: `1px solid ${COLORS.panelBorder}`,
              backgroundColor: "rgba(0,0,0,0.4)",
              alignSelf: "start",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                borderBottom: `1px solid ${COLORS.panelBorder}`,
                padding: "8px 16px",
              }}
            >
              <div className="gd-display" style={{ display: "flex", alignItems: "baseline", gap: 4, fontSize: 12 }}>
                <span style={{ fontWeight: 700 }}>Geoinnovation</span>
                <span style={{ color: COLORS.textMuted }}>summit</span>
              </div>
            </div>
            <canvas ref={canvasRef} style={{ display: "block", width: "100%", height: "auto" }} />
          </div>
        </section>

        {/* Footer */}
        <footer
          style={{
            ...panelStyle,
            margin: "0 16px 16px",
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 16,
            borderRadius: 16,
            padding: "16px 24px",
            fontSize: 13,
            color: COLORS.textFaint,
          }}
        >
          <span>Unofficial fan tool · built for Geoinnovation Summit attendees</span>
          <span style={{ color: "rgba(255,255,255,0.25)" }}>Not affiliated with the official event organizers</span>
        </footer>
      </div>
    </div>
  );
}