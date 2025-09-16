import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service - Finova",
  description: "The rules and conditions for using Finova.",
};

export default function TermsPage() {
  return (
    <div className="bg-white min-h-svh w-full">
      <div className="mx-auto max-w-3xl px-6 py-12">
        <h1 className="text-3xl font-bold text-zinc-900 mb-4">Terms of Service</h1>
        <p className="text-sm text-gray-500 mb-8">Last updated: September 2025</p>

        <div className="space-y-6 text-zinc-800">
          <section>
            <p>
              By using Finova, you agree to these Terms. If you do not agree, please do not use the service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2">Use of the Service</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>You are responsible for the accuracy of data you enter</li>
              <li>Do not misuse, reverse engineer, or disrupt the service</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2">Accounts</h2>
            <p>
              You are responsible for safeguarding your account credentials and for all activity under your
              account.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2">Limitation of Liability</h2>
            <p>
              Finova is provided on an "as is" basis without warranties. To the extent permitted by law, we are
              not liable for indirect or consequential damages.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2">Changes</h2>
            <p>
              We may update these Terms from time to time. Continued use means you accept the updated Terms.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}



