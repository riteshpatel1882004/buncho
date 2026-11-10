export const SUPPORT_KINDS = ['PROBLEM', 'PRO_PLAN', 'OTHER'];

export const KIND_LABEL = {
  PROBLEM: 'A problem or question',
  PRO_PLAN: 'Pro plan or payment',
  OTHER: 'Something else',
};

export const KIND_HELP = {
  PROBLEM: 'A mistake in a question.',
  PRO_PLAN: 'Paid but no access, a failed or double payment, a promo code.',
  OTHER: 'A bug, an account problem, missing content or a suggestion.',
};

// needsTransaction: the payment transaction ID is required, so we can find the payment quickly
export const ISSUES = {
  PROBLEM: [
    { id: 'incorrect-question', label: 'The question is incorrect' },
    { id: 'unclear', label: 'The question is unclear or confusing' },
    { id: 'typo', label: 'Typo or formatting mistake' },
    { id: 'other', label: 'Something else about this question' },
  ],
  PRO_PLAN: [
    { id: 'not-activated', label: 'I paid but Pro is not active', needsTransaction: true },
    { id: 'charged-failed', label: 'Money was deducted but the payment failed', needsTransaction: true },
    { id: 'charged-twice', label: 'I was charged more than once', needsTransaction: true },
    { id: 'promo-code', label: 'My promo code did not work' },
    { id: 'refund', label: 'I want to ask about a refund', needsTransaction: true },
    { id: 'other', label: 'Another problem with Pro' },
  ],
  OTHER: [
    { id: 'bug', label: 'Something is not working' },
    { id: 'account', label: 'Account or login problem' },
    { id: 'content', label: 'Wrong or missing content' },
    { id: 'suggestion', label: 'Suggestion or feedback' },
    { id: 'other', label: 'Something else' },
  ],
};

export const issueLabel = (kind, id) => ISSUES[kind]?.find((i) => i.id === id)?.label ?? id;

export const STATUS_LABEL = { OPEN: 'Open', RESOLVED: 'Resolved', DISMISSED: 'Closed' };

export const MIN_DETAILS = 10;
export const MAX_DETAILS = 2000;
export const MAX_PER_HOUR = 5;
export const MAX_PER_DAY = 15;

// UPI / bank references, Cashfree payment ids and our own order ids (bnc_...)
export const TRANSACTION_PATTERN = /^[A-Za-z0-9][A-Za-z0-9_\-./ ]{3,63}$/;
export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;