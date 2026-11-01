import LegalPage, { legalMetadata } from "@/components/LegalPage";

const DESCRIPTION =
  "How Buncho collects, uses and protects your data, including account, submission and analytics information.";

export const metadata = legalMetadata({
  title: "Privacy Policy",
  description: DESCRIPTION,
  path: "/privacy",
});

export default function PrivacyPage() {
  return (
    <LegalPage
      title="Privacy Policy"
      path="/privacy"
      updated="2026-10-22"
      description={DESCRIPTION}
    >
      <p>
        This Privacy Policy explains what information Buncho collects, how we
        use it, and the choices you have.
      </p>

      <h2>1. Information we collect</h2>
      <ul>
        <li>
          <strong>Account information:</strong> name, email address and
          profile details provided through our sign-in provider (Clerk).
        </li>
        <li>
          <strong>Content you create:</strong> your submissions, community
          answers, bookmarks and progress.
        </li>
        <li>
          <strong>Voice input:</strong> if you use dictation, speech is
          processed by your browser&apos;s built-in speech recognition. Buncho
          does not store your audio; only the resulting text that you submit
          is saved.
        </li>
        <li>
          <strong>Usage and device data:</strong> browser type, device
          information, pages visited, approximate location (derived from IP
          address), performance metrics and error logs, collected through
          analytics tools described below.
        </li>
        <li>
          <strong>Preferences:</strong> for example, your light or dark theme
          choice, stored in your browser.
        </li>
      </ul>

      <h2>2. How we use your information</h2>
      <ul>
        <li>To provide and operate the Service and your account.</li>
        <li>To generate AI feedback on your submissions.</li>
        <li>To show your progress and saved items.</li>
        <li>To display your public community answers to other users.</li>
        <li>
          To understand how Buncho is used and improve its content,
          performance and reliability.
        </li>
        <li>To maintain security, prevent abuse and fix problems.</li>
        <li>To communicate important updates about the Service.</li>
      </ul>

      <h2>3. AI processing</h2>
      <p>
        When you request AI feedback, your submission text and the related
        question may be sent to third-party AI providers to generate a
        response. We send only what is needed for this purpose. Please do not
        include sensitive personal information in your answers.
      </p>

      <h2>4. Analytics and service providers</h2>
      <p>
        We share data only with providers that help us run Buncho:
      </p>
      <ul>
        <li>
          <strong>Clerk</strong> for authentication.
        </li>
        <li>
          <strong>Neon</strong> for database hosting.
        </li>
        <li>
          <strong>Google</strong> for hosting, Google Analytics and Speed
          Insights (traffic and performance measurement).
        </li>
        <li>
          <strong>Google Analytics</strong> to understand how visitors use the
          site. Google Analytics may set cookies and collect usage data
          according to{" "}
          <a
            href="https://policies.google.com/privacy"
            target="_blank"
            rel="noopener noreferrer"
          >
            Google&apos;s Privacy Policy
          </a>
          . You can opt out using the{" "}
          <a
            href="https://tools.google.com/dlpage/gaoptout"
            target="_blank"
            rel="noopener noreferrer"
          >
            Google Analytics opt-out browser add-on
          </a>
          .
        </li>
        <li>
          <strong>AI model providers</strong> to generate feedback on your
          submissions.
        </li>
      </ul>
      <p>
        These providers process data only to provide their services to us. We
        do not sell your personal information.
      </p>

      <h2>5. Public content</h2>
      <p>
        Community answers you post are visible to other users along with your
        display name. Private submissions are not shown to other users.
      </p>

      <h2>6. Cookies and local storage</h2>
      <p>
        We use cookies and local storage for sign-in, security and saving
        your preferences (such as theme). Google Analytics also uses cookies
        to measure site usage. You can block or delete cookies in your
        browser settings, though some features may stop working.
      </p>

      <h2>7. Data retention and deletion</h2>
      <p>
        We keep your data while your account is active. You can request
        deletion of your account and associated data at any time by emailing
        us. Some information may remain in backups for a limited period or be
        retained where the law requires.
      </p>

      <h2>8. Your rights</h2>
      <p>
        You can access, correct or delete your personal information, and
        withdraw consent where processing is based on it. To exercise these
        rights, contact us using the details below.
      </p>

      <h2>9. Security</h2>
      <p>
        We use reasonable technical and organizational measures to protect
        your data. No online service is completely secure, so we cannot
        guarantee absolute security.
      </p>

      <h2>10. Children</h2>
      <p>
        Buncho is not intended for children under 13. If you believe a child
        has given us personal information, contact us and we will delete it.
      </p>

      <h2>11. Changes to this policy</h2>
      <p>
        We may update this policy from time to time. The &quot;Last
        updated&quot; date above shows the latest revision.
      </p>

      <h2>12. Contact</h2>
      <p>
        Questions or requests? Email{" "}
        <a href="mailto:bunchohq@gmail.com">bunchohq@gmail.com</a>.
      </p>
    </LegalPage>
  );
}