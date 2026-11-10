import { prisma } from '@/lib/prisma';
import { OG_SIZE, OG_TYPE, renderOg } from '@/lib/og';

export const alt = 'Buncho: AI, ML and GenAI interview practice';
export const size = OG_SIZE;
export const contentType = OG_TYPE;
export const revalidate = 86400; // refresh the question count once a day

// "500+ questions" (rounded down to the nearest 50). Falls back quietly if the database is not reachable.
async function questionChip() {
  try {
    const n = await prisma.problem.count({ where: { published: true } });
    return n >= 50 ? `${Math.floor(n / 50) * 50}+ questions` : null;
  } catch {
    return null;
  }
}

export default async function Image() {
  const count = await questionChip();
  return renderOg({
    eyebrow: 'AI/ML interview practice plat',
    title: 'Crack your AI/ML engineering interview',
    highlight: ['AI', 'engineering'],
    subtitle: 'Answer out loud or in writing, every day.',
    chips: [count ?? 'AI, ML and GenAI', 'Voice + text', 'Free to start'],
    preview: true,
    cta: 'Start practicing free',
  });
}