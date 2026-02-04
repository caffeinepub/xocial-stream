import { Link } from '@tanstack/react-router';

export default function SupportPage() {
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="mx-auto max-w-4xl">
        <h1 className="mb-8 bg-gradient-to-r from-primary via-primary/90 to-primary/80 bg-clip-text text-center text-4xl font-bold text-transparent md:text-5xl">
          Support
        </h1>

        <div className="prose prose-lg mx-auto max-w-3xl space-y-6 text-foreground">
          <section>
            <h2 className="text-2xl font-semibold text-foreground">Need help?</h2>
            <p>
              We're here to assist with any issues related to your account or the platform.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground">Contact Us</h2>
            <p>
              You can reach us at:
              <br />
              <a 
                href="mailto:support@tuorasystems.com" 
                className="text-primary hover:underline"
              >
                support@tuorasystems.com
              </a>
              <br />
              (or whatever email you choose)
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground">What We Can Help With</h2>
            <ul className="list-disc pl-6 space-y-1">
              <li>Account issues</li>
              <li>Upload or playback problems</li>
              <li>General questions</li>
              <li>Reporting bugs</li>
              <li>Feedback and suggestions</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground">Response Time</h2>
            <p>We aim to respond as soon as possible.</p>
            <p>If we're experiencing high volume, replies may take a little longer.</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground">Troubleshooting Tips</h2>
            <ul className="list-disc pl-6 space-y-1">
              <li>Refresh the page</li>
              <li>Try another device or browser</li>
              <li>Check your internet connection</li>
              <li>Re‑upload the file if it failed</li>
            </ul>
            <p>If the issue continues, contact us and we'll take a look.</p>
          </section>
        </div>
      </div>
    </div>
  );
}
