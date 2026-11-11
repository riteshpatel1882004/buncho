import { DIFFICULTY_LABEL } from '@/lib/constants';

const pill = {
  EASY: 'bg-easy/12 text-easy',
  MEDIUM: 'bg-medium/12 text-medium',
  HARD: 'bg-hard/12 text-hard',
};
const text = { EASY: 'text-easy', MEDIUM: 'text-medium', HARD: 'text-hard' };
const SHORT = { EASY: 'Easy', MEDIUM: 'Med.', HARD: 'Hard' };

// Default is a pill. `plain` is the coloured text used in lists, like LeetCode's "Med.".
// `dot` is a small dot plus label, used on the question page.
export default function DifficultyBadge({ difficulty, plain = false, dot = false }) {
  if (dot) {
    return (
      <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${text[difficulty]}`}>
        <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-current" />
        {DIFFICULTY_LABEL[difficulty]}
      </span>
    );
  }
  if (plain) {
    return <span className={`text-sm font-medium ${text[difficulty]}`}>{SHORT[difficulty]}</span>;
  }
  return (
    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${pill[difficulty]}`}>
      {DIFFICULTY_LABEL[difficulty]}
    </span>
  );
}