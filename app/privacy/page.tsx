import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy - Finova",
  description: "How Finova collects, uses, and protects your data.",
};

export default function PrivacyPage() {
  return (
    <div className="bg-white min-h-svh w-full">
      <div className="mx-auto max-w-3xl px-6 py-12">
        <h1 className="text-3xl font-bold text-zinc-900 mb-4">Privacy Policy</h1>
        <p className="text-sm text-gray-500 mb-8">Last updated: September 2025</p>

        <div className="space-y-6 text-zinc-800">
          <p>
            Your privacy matters. This Privacy Policy explains what information we collect, why we collect it,
            and how we use it. By using Finova, you agree to this Policy.
          </p>

          <section>
            <h2 className="text-xl font-semibold mb-2">Information We Collect</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>Account data such as profile name and email address</li>
              <li>Financial records you add (e.g., income, expenses, transfers)</li>
              <li>Device and usage information to improve the app</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2">How We Use Information</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>Provide and improve core features like budgeting and analytics</li>
              <li>Secure your account and prevent abuse</li>
              <li>Communicate service updates and support</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2">Data Sharing</h2>
            <p>
              We do not sell your personal data. We may share information with trusted service providers that
              help us operate the app, subject to strict confidentiality and security obligations.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2">Your Choices</h2>
            <p>
              You can access, update, or delete your account data at any time. Contact us if you have privacy
              questions or requests.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2">Contact</h2>
            <p>
              For any questions about this Policy, contact us at support@finova.app.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}


