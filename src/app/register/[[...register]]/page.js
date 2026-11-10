import { SignUp } from '@clerk/nextjs';

// Auth screens have no search value; keep them out of the index but let crawlers follow links.
export const metadata = {
  title: 'Create account',
  description: 'Create a free Buncho account to practice AI, ML and GenAI interview questions.',
  robots: { index: false, follow: true, googleBot: { index: false, follow: true } },
};

export default function RegisterPage() {
  return (
    <div className="grid min-h-[calc(100dvh-4rem)] place-items-center bg-canvas px-4 py-10">
      <SignUp />
    </div>
  );
}