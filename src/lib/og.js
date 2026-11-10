import { ImageResponse } from 'next/og';

export const OG_SIZE = { width: 1200, height: 630 };
export const OG_TYPE = 'image/png';

const GREEN = '#34d67b';
const DARK = '#04140a';
const TEXT = '#f3f5f9';
const MUTED = '#9aa6b5';
const AMBER = '#f5b942';

const DIFF_COLOR = { Easy: GREEN, Medium: AMBER, Hard: '#ff6b6b' };

function Brand() {
  return (
    <div style={{ display: 'flex', alignItems: 'center' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 52,
          height: 52,
          borderRadius: 14,
          background: GREEN,
          color: DARK,
          fontSize: 38,
          fontWeight: 800,
          marginRight: 14,
        }}
      >
        b
      </div>
      <div style={{ display: 'flex', fontSize: 36, fontWeight: 800, color: TEXT }}>
        buncho<span style={{ color: GREEN }}>.</span>
      </div>
    </div>
  );
}

/** Headline made of separate words so wrapped lines work and chosen words can be green. */
function Headline({ title, highlight = [], size }) {
  const marked = new Set(highlight.map((w) => w.toLowerCase()));
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', fontSize: size, fontWeight: 800, lineHeight: 1.08, letterSpacing: -2 }}>
      {title.split(' ').map((word, i) => (
        <span
          key={`${word}-${i}`}
          style={{ marginRight: Math.round(size * 0.26), color: marked.has(word.toLowerCase().replace(/[^a-z0-9+]/g, '')) ? GREEN : TEXT }}
        >
          {word}
        </span>
      ))}
    </div>
  );
}

/** A small "daily practice" card, so the picture shows what the product gives you. */
function PreviewCard() {
  const bars = [
    ['RAG', 80],
    ['LLMs', 64],
    ['SQL', 45],
  ];
  return (
    <div style={{ display: 'flex', position: 'relative', width: 430, height: 410, alignItems: 'center', justifyContent: 'center' }}>
      {/* A second card behind, for depth */}
      <div
        style={{
          position: 'absolute',
          display: 'flex',
          left: 6,
          top: 24,
          width: 370,
          height: 350,
          borderRadius: 30,
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.08)',
          transform: 'rotate(-6deg)',
        }}
      />
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          width: 380,
          padding: 28,
          borderRadius: 28,
          background: 'rgba(24,30,27,0.96)',
          border: '1px solid rgba(255,255,255,0.16)',
          boxShadow: '0 30px 80px rgba(0,0,0,0.6)',
          transform: 'rotate(3deg)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', fontSize: 19, color: MUTED, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase' }}>Daily practice</div>
          <div
            style={{
              display: 'flex',
              padding: '5px 14px',
              borderRadius: 999,
              background: 'rgba(52,214,123,0.16)',
              color: GREEN,
              fontSize: 18,
              fontWeight: 700,
            }}
          >
            Voice + text
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'baseline', marginTop: 14 }}>
          <div style={{ display: 'flex', fontSize: 84, fontWeight: 800, letterSpacing: -3, lineHeight: 1, color: TEXT }}>7</div>
          <div style={{ display: 'flex', fontSize: 28, color: MUTED, marginLeft: 8 }}>day streak</div>
        </div>

        {bars.map(([label, value]) => (
          <div key={label} style={{ display: 'flex', flexDirection: 'column', marginTop: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 20, color: MUTED }}>
              <span>{label}</span>
              <span style={{ color: TEXT, fontWeight: 700 }}>{value}%</span>
            </div>
            <div style={{ display: 'flex', height: 10, borderRadius: 999, background: 'rgba(255,255,255,0.1)', marginTop: 7 }}>
              <div style={{ display: 'flex', width: `${value}%`, height: 10, borderRadius: 999, background: GREEN }} />
            </div>
          </div>
        ))}

        <div
          style={{
            display: 'flex',
            alignSelf: 'flex-start',
            marginTop: 20,
            padding: '8px 16px',
            borderRadius: 12,
            background: 'rgba(52,214,123,0.14)',
            color: GREEN,
            fontSize: 20,
            fontWeight: 700,
          }}
        >
          Keep the streak going
        </div>
      </div>
    </div>
  );
}

function CallToAction({ text }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        padding: '16px 32px',
        borderRadius: 999,
        background: GREEN,
        color: DARK,
        fontSize: 30,
        fontWeight: 800,
        boxShadow: '0 12px 40px rgba(52,214,123,0.4)',
      }}
    >
      <span>{text}</span>
      {/* Arrow drawn with borders, so it does not depend on a font */}
      <div
        style={{
          display: 'flex',
          width: 14,
          height: 14,
          marginLeft: 14,
          borderTop: `5px solid ${DARK}`,
          borderRight: `5px solid ${DARK}`,
          transform: 'rotate(45deg)',
        }}
      />
    </div>
  );
}

/**
 * Branded 1200x630 share card, used for the site default, every topic and every problem.
 * - chips: short labels shown under the text (topic, difficulty, time)
 * - highlight: words of the title to show in green
 * - preview: true adds the mock "daily practice" card on the right (the site default and list pages)
 * - cta: text of the button drawn in the bottom right
 * X draws the page title over the bottom-left of the image, so that corner is kept empty.
 */
export function renderOg({ eyebrow, title, subtitle, chips = [], highlight = [], preview = false, cta = 'Start practicing free' }) {
  const size = preview
    ? title.length > 60 ? 46 : title.length > 40 ? 52 : 58
    : title.length > 90 ? 52 : title.length > 55 ? 62 : 74;

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          padding: '40px 64px',
          backgroundImage:
            'radial-gradient(circle at 88% 22%, rgba(52,214,123,0.30) 0%, rgba(52,214,123,0) 42%), radial-gradient(circle at 6% 100%, rgba(52,214,123,0.14) 0%, rgba(52,214,123,0) 38%), linear-gradient(135deg, #0c2216 0%, #121513 50%, #0a0d0b 100%)',
          color: TEXT,
          fontFamily: 'sans-serif',
        }}
      >
        {/* Top row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Brand />
          <div
            style={{
              display: 'flex',
              padding: '8px 22px',
              borderRadius: 999,
              border: '2px solid rgba(52,214,123,0.5)',
              color: GREEN,
              fontSize: 26,
              fontWeight: 700,
            }}
          >
            buncho.live
          </div>
        </div>

        {/* Body */}
        <div style={{ display: 'flex', flex: 1, alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', flexDirection: 'column', width: preview ? 640 : '100%' }}>
            {eyebrow && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  alignSelf: 'flex-start',
                  padding: '8px 20px',
                  borderRadius: 999,
                  background: 'rgba(52,214,123,0.12)',
                  border: '1px solid rgba(52,214,123,0.35)',
                  color: GREEN,
                  fontSize: 22,
                  fontWeight: 700,
                  letterSpacing: 3,
                  textTransform: 'uppercase',
                }}
              >
                <div style={{ display: 'flex', width: 10, height: 10, borderRadius: 999, background: GREEN, marginRight: 12 }} />
                <span>{eyebrow}</span>
              </div>
            )}

            <div style={{ display: 'flex', marginTop: 22 }}>
              <Headline title={title} highlight={highlight} size={size} />
            </div>

            {subtitle && (
              <div style={{ display: 'flex', marginTop: 18, fontSize: preview ? 28 : 30, color: MUTED, lineHeight: 1.35 }}>{subtitle}</div>
            )}

            {chips.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', marginTop: 26 }}>
                {chips.map((c) => (
                  <div
                    key={c}
                    style={{
                      display: 'flex',
                      marginRight: 12,
                      marginBottom: 8,
                      padding: '9px 20px',
                      borderRadius: 999,
                      fontSize: 24,
                      fontWeight: 700,
                      background: 'rgba(255,255,255,0.08)',
                      border: '1px solid rgba(255,255,255,0.12)',
                      color: DIFF_COLOR[c] ?? TEXT,
                    }}
                  >
                    {c}
                  </div>
                ))}
              </div>
            )}
          </div>

          {preview && <PreviewCard />}
        </div>

        {/* Bottom row: button on the right. The bottom-left is kept clear for the title X draws there. */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
          <CallToAction text={cta} />
        </div>
      </div>
    ),
    { ...OG_SIZE },
  );
}