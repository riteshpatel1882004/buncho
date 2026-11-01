// An HR question opens in exactly the same workspace as an AI problem (Description + AI Feedback tabs,
// answer editor, timer, previous / next). The page is shared; this wrapper only says it was opened from /problems/hr/.
import ProblemPage, { generateMetadata } from '../../[slug]/page';

export { generateMetadata };

export default function HrProblemPage(props) {
  return ProblemPage({ ...props, via: 'hr' });
}