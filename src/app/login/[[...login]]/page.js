import { SignIn } from '@clerk/nextjs';

// Auth screens have no search value; keep them out of the index but let crawlers follow links.
export const metadata = {
  title: 'Log in',
  description: 'Log in to Buncho to save your answers and track your streak.',
  robots: { index: false, follow: true, googleBot: { index: false, follow: true } },
};

export default function LoginPage() {
  return (
    <div className="grid min-h-[calc(100dvh-4rem)] place-items-center bg-canvas px-4 py-10">
      <SignIn />
    </div>
  );
}