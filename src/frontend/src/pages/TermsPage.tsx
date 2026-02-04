export default function TermsPage() {
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="mx-auto max-w-4xl">
        <h1 className="mb-8 bg-gradient-to-r from-primary via-primary/90 to-primary/80 bg-clip-text text-center text-4xl font-bold text-transparent md:text-5xl">
          Terms of Service
        </h1>

        <div className="prose prose-lg mx-auto max-w-3xl space-y-6 text-foreground">
          <section>
            <h2 className="text-2xl font-semibold text-foreground">Using Exocial.Stream</h2>
            <p>
              Exocial.Stream is a platform for uploading, storing, and streaming your own content.
              <br />
              By creating an account or using the service, you agree to follow these terms.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground">Your Content</h2>
            <p>You are responsible for the content you upload.</p>
            <p>You must only upload content that you own or have permission to use.</p>
            <p>You must not upload anything illegal, harmful, or infringing on someone else's rights.</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground">Our Platform</h2>
            <p>We provide the platform "as is."</p>
            <p>We work to keep the service stable and available, but we do not guarantee uninterrupted access.</p>
            <p>We may update or improve the service at any time.</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground">Accounts</h2>
            <p>You are responsible for keeping your account secure.</p>
            <p>If you believe your account has been accessed without permission, please contact us.</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground">Fair Use</h2>
            <p>Do not misuse the platform, attempt to break it, overload it, or interfere with other users.</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground">Liability</h2>
            <p>TuoraSystems is not responsible for any loss of data, downtime, or issues caused by misuse of the platform.</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground">Changes to These Terms</h2>
            <p>We may update these terms from time to time.</p>
            <p>Continued use of the service means you accept the updated terms.</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground">Contact</h2>
            <p>If you have questions about these terms, reach out through our Support page.</p>
          </section>
        </div>
      </div>
    </div>
  );
}
