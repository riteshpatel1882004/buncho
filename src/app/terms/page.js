import LegalPage, { legalMetadata } from "@/components/LegalPage";

const DESCRIPTION =
  "The terms that govern your use of Buncho, the AI engineering interview practice platform.";

export const metadata = legalMetadata({
  title: "Terms of Service",
  description: DESCRIPTION,
  path: "/terms",
});

export default function TermsPage() {
  return (
    <LegalPage
      title="Terms of Service"
      path="/terms"
      updated="2026-10-22"
      description={DESCRIPTION}
    >
      <p>
        Welcome to Buncho. By creating an account or using Buncho
        (the &quot;Service&quot;), you agree to these Terms. If you do not
        agree, please do not use the Service.
      </p>

      <h2>1. What Buncho is</h2>
      <p>
        Buncho is a practice platform for AI, ML and GenAI interview
        preparation. It offers a question library, problem pages,
        private submissions, community answers, bookmarks and
        progress tracking.
      </p>

      <h2>2. Your account</h2>
      <ul>
        <li>You must provide accurate information when you sign up.</li>
        <li>
          You are responsible for all activity on your account and for keeping
          your login credentials secure.
        </li>
        <li>
          You must be at least 13 years old (or the minimum age required in
          your country) to use the Service.
        </li>
      </ul>

      <h2>3. Acceptable use</h2>
      <p>You agree not to:</p>
      <ul>
        <li>Break the law or infringe anyone&apos;s rights.</li>
        <li>
          Scrape, copy or redistribute the question library
          or other Buncho content at scale without written
          permission.
        </li>
        <li>
          Attempt to disrupt, overload, reverse engineer or gain unauthorized
          access to the Service or its infrastructure.
        </li>
        <li>
          Post spam, abusive, hateful, misleading or plagiarized content in
          community answers.
        </li>
        <li>Use bots or automation to abuse the Service or its features.</li>
      </ul>

      <h2>4. Your content</h2>
      <p>
        You keep ownership of the answers and submissions you create. By
        posting content publicly (for example, a community answer), you grant
        Buncho a non-exclusive, worldwide, royalty-free licence to host,
        display and distribute it on the Service. Private submissions are
        visible only to you, except as needed to operate the Service.
      </p>
      <p>
        We may remove content that violates these Terms or that we are
        required to remove by law.
      </p>

      <h2>5. Our content and intellectual property</h2>
      <p>
        The Service, including its design, code, question library, is owned by Buncho and protected by applicable
        intellectual property laws. You may use it for your personal,
        non-commercial learning only.
      </p>

      <h2>6. Availability and changes</h2>
      <p>
        We work to keep Buncho available but do not promise uninterrupted or
        error-free service. We may change, suspend or discontinue features at
        any time. We may update these Terms; if the changes are material, we
        will notify you on the Service. Continuing to use Buncho after changes
        means you accept the updated Terms.
      </p>

      <h2>7. Termination</h2>
      <p>
        You can stop using Buncho and delete your account at any time. We may
        suspend or terminate accounts that violate these Terms or put the
        Service or other users at risk.
      </p>

      <h2>8. Disclaimer and limitation of liability</h2>
      <p>
        The Service is provided &quot;as is&quot; and &quot;as available&quot;
        without warranties of any kind. To the maximum extent permitted by
        law, Buncho is not liable for any indirect, incidental or
        consequential damages, or for loss of data, profits or opportunities
        arising from your use of the Service.
      </p>

      <h2>9. Governing law</h2>
      <p>
        These Terms are governed by the laws of India. Any disputes will be
        subject to the exclusive jurisdiction of the courts in India.
      </p>

      <h2>10. Contact</h2>
      <p>
        Questions about these Terms? Email us at{" "}
        <a href="mailto:bunchohq@gmail.com">bunchohq@gmail.com</a>.
      </p>
    </LegalPage>
  );
}