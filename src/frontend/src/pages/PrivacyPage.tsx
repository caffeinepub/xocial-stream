export default function PrivacyPage() {
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="mx-auto max-w-4xl">
        <h1 className="mb-8 bg-gradient-to-r from-primary via-primary/90 to-primary/80 bg-clip-text text-center text-4xl font-bold text-transparent md:text-5xl">
          Privacy Policy
        </h1>

        <div className="prose prose-lg mx-auto max-w-3xl space-y-6 text-foreground">
          <section>
            <h2 className="text-2xl font-semibold text-foreground">Information We Collect</h2>
            <p>We collect basic information you provide when creating an account, such as your email address.</p>
            <p>We also collect usage data to help improve the platform.</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground">How Your Data Is Used</h2>
            <p>We use your information to:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>operate the platform</li>
              <li>improve performance</li>
              <li>provide support</li>
              <li>keep your account secure</li>
            </ul>
            <p>We do not sell your data.</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground">Your Content</h2>
            <p>Your uploaded content is stored securely and is only accessible to you unless you choose to share it.</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground">Cookies & Analytics</h2>
            <p>We may use simple analytics tools to understand how the platform is used.</p>
            <p>This helps us improve reliability and performance.</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground">Data Security</h2>
            <p>We take reasonable steps to protect your information and your content.</p>
            <p>No system is perfect, but we work to keep your data safe.</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground">Your Choices</h2>
            <p>You can update or delete your account at any time.</p>
            <p>You can also request removal of your data.</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground">Updates to This Policy</h2>
            <p>We may update this policy as the platform grows.</p>
            <p>We will post changes on this page.</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground">Contact</h2>
            <p>If you have privacy questions, reach out through our Support page.</p>
          </section>
        </div>
      </div>
    </div>
  );
}
