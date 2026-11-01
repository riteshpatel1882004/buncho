// A SQL question opens in the same workspace as an AI problem, with two differences: the left side has
// Description + "Answers & Optimization" tabs (no AI Feedback), and the answer editor is a SQL editor.
// The page is shared; this wrapper only says it was opened from /problems/sql/.
import ProblemPage, { generateMetadata } from '../../[slug]/page';

export { generateMetadata };

export default function SqlProblemPage(props) {
  return ProblemPage({ ...props, via: 'sql' });
}