import { ImageResponse } from 'next/og';
import { OG_SIZE, OG_TYPE, renderOg } from '@/lib/og';
import { findProfileUser, getProfileData } from '@/lib/profile';
import { profileTheme } from '@/lib/profile-theme';

export const alt = 'Buncho learner profile';
export const size = OG_SIZE;
export const contentType = OG_TYPE;

const TEXT = '#f3f5f9';
const MUTED = 'rgba(243,245,249,0.72)';

// Satori (the engine behind ImageResponse) needs display:flex on every element that has several children.
function Stat({ value, label }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', marginRight: 48 }}>
      <div style={{ display: 'flex', fontSize: 64, fontWeight: 800, letterSpacing: -2, color: TEXT }}>{value}</div>
      <div style={{ display: 'flex', fontSize: 24, color: MUTED, marginTop: 2 }}>{label}</div>
    </div>
  );
}

export default async function Image({ params }) {
  const { username } = await params;
  let user = null;
  let data = null;
  try {
    user = await findProfileUser(username);
    if (user?.profilePublic) data = await getProfileData(user);
  } catch {
    // fall through to the generic card
  }
  if (!user || !user.profilePublic) {
    return renderOg({ eyebrow: 'Buncho profile', title: 'AI interview practice profile', cta: 'Start practicing free' });
  }

  const t = profileTheme(user.username);
  const stats = data.stats;
  const initial = data.name.charAt(0).toUpperCase();

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          padding: '48px 64px',
          color: TEXT,
          fontFamily: 'sans-serif',
          backgroundImage: `radial-gradient(circle at 12% 0%, ${t.a} 0%, rgba(0,0,0,0) 48%), radial-gradient(circle at 92% 15%, ${t.b} 0%, rgba(0,0,0,0) 45%), radial-gradient(circle at 60% 110%, ${t.c} 0%, rgba(0,0,0,0) 50%), linear-gradient(135deg, ${t.dark}, #0a0d0b)`,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', fontSize: 34, fontWeight: 800 }}>buncho.</div>
          <div style={{ display: 'flex', padding: '8px 22px', borderRadius: 999, background: 'rgba(0,0,0,0.35)', fontSize: 26, fontWeight: 700 }}>
            {`buncho.live/user/${user.username}`}
          </div>
        </div>

        <div style={{ display: 'flex', flex: 1, alignItems: 'center' }}>
          {user.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={user.imageUrl} width={190} height={190} alt="" style={{ borderRadius: 999, border: '6px solid rgba(255,255,255,0.9)', marginRight: 44 }} />
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 190, height: 190, borderRadius: 999, background: 'rgba(255,255,255,0.18)', border: '6px solid rgba(255,255,255,0.9)', fontSize: 92, fontWeight: 800, marginRight: 44 }}>
              {initial}
            </div>
          )}
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
            <div style={{ display: 'flex', fontSize: data.name.length > 18 ? 58 : 76, fontWeight: 800, letterSpacing: -2, lineHeight: 1.05 }}>{data.name}</div>
            <div style={{ display: 'flex', alignItems: 'center', marginTop: 12 }}>
              <div style={{ display: 'flex', fontSize: 34, color: MUTED }}>{`@${user.username}`}</div>
              {data.level && (
                <div style={{ display: 'flex', marginLeft: 20, padding: '6px 18px', borderRadius: 999, background: 'rgba(255,255,255,0.18)', fontSize: 24, fontWeight: 700 }}>
                  {`Level ${data.level.index + 1} · ${data.level.name}`}
                </div>
              )}
            </div>
            {user.headline && <div style={{ display: 'flex', marginTop: 16, fontSize: 30, color: MUTED }}>{user.headline}</div>}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
          {stats ? (
            <div style={{ display: 'flex' }}>
              <Stat value={stats.solved} label="solved" />
              <Stat value={stats.streak} label="day streak" />
            </div>
          ) : (
            <div style={{ display: 'flex', fontSize: 34, color: MUTED }}>AI, ML and GenAI interview practice</div>
          )}
          <div style={{ display: 'flex', padding: '14px 30px', borderRadius: 999, background: '#ffffff', color: '#0a0d0b', fontSize: 28, fontWeight: 800 }}>
            View profile
          </div>
        </div>
      </div>
    ),
    { ...OG_SIZE },
  );
}