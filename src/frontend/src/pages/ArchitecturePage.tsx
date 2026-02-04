import { Network } from 'lucide-react';

export default function ArchitecturePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-primary/5 to-background">
      <div className="container mx-auto px-4 py-12">
        <div className="mx-auto max-w-5xl">
          {/* Header Section */}
          <div className="mb-12 text-center">
            <div className="mb-4 flex items-center justify-center gap-3">
              <Network className="h-10 w-10 text-primary" />
              <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
                Tuora Systems Architecture
              </h1>
            </div>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
              Explore the multi-canister ecosystem powering the Xocial.Stream Network on the Internet Computer
            </p>
          </div>

          {/* Diagram Section */}
          <div className="mb-12 overflow-hidden rounded-2xl border border-primary/20 bg-card shadow-2xl">
            <div className="p-8">
              <img
                src="/assets/generated/tuora-systems-architecture-diagram.dim_1200x800.png"
                alt="Tuora Systems Internet Computer Ecosystem Architecture"
                className="w-full h-auto rounded-lg"
              />
            </div>
          </div>

          {/* Description Section */}
          <div className="space-y-8">
            <div className="rounded-xl border border-primary/10 bg-card/50 p-6 backdrop-blur-sm">
              <h2 className="mb-4 text-2xl font-semibold text-foreground">
                Multi-Canister Architecture
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                Tuora Systems leverages the Internet Computer's canister architecture to build a scalable, 
                decentralized ecosystem. Each module operates as an independent canister while sharing 
                common infrastructure for authentication and access control.
              </p>
            </div>

            <div className="grid gap-6 sm:grid-cols-2">
              <div className="rounded-xl border border-primary/10 bg-card/50 p-6 backdrop-blur-sm">
                <h3 className="mb-3 text-xl font-semibold text-primary">
                  Xocial.Stream
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  The core video hub canister enabling decentralized video sharing, 
                  community engagement, and content discovery on the Internet Computer.
                </p>
              </div>

              <div className="rounded-xl border border-primary/10 bg-card/50 p-6 backdrop-blur-sm">
                <h3 className="mb-3 text-xl font-semibold text-primary">
                  Xocialcom
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Messaging canister providing real-time communication capabilities 
                  with end-to-end encryption and decentralized message storage.
                </p>
              </div>

              <div className="rounded-xl border border-primary/10 bg-card/50 p-6 backdrop-blur-sm">
                <h3 className="mb-3 text-xl font-semibold text-primary">
                  Future Modules
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Planned expansions include analytics, AI-powered features, 
                  media cloud storage, and additional services to enhance the ecosystem.
                </p>
              </div>

              <div className="rounded-xl border border-primary/10 bg-card/50 p-6 backdrop-blur-sm">
                <h3 className="mb-3 text-xl font-semibold text-primary">
                  Shared Infrastructure
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  All modules utilize Internet Identity for authentication and 
                  principal-based ownership, ensuring seamless cross-canister access control.
                </p>
              </div>
            </div>

            <div className="rounded-xl border border-primary/10 bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 p-6 backdrop-blur-sm">
              <h2 className="mb-4 text-2xl font-semibold text-foreground">
                Why Internet Computer?
              </h2>
              <ul className="space-y-3 text-muted-foreground">
                <li className="flex items-start gap-3">
                  <span className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/20 text-xs font-bold text-primary">
                    ✓
                  </span>
                  <span className="leading-relaxed">
                    <strong className="text-foreground">True Decentralization:</strong> No reliance on traditional cloud providers
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/20 text-xs font-bold text-primary">
                    ✓
                  </span>
                  <span className="leading-relaxed">
                    <strong className="text-foreground">Scalable Architecture:</strong> Independent canisters that can scale independently
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/20 text-xs font-bold text-primary">
                    ✓
                  </span>
                  <span className="leading-relaxed">
                    <strong className="text-foreground">Unified Identity:</strong> Internet Identity provides seamless authentication across all modules
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/20 text-xs font-bold text-primary">
                    ✓
                  </span>
                  <span className="leading-relaxed">
                    <strong className="text-foreground">Cost Efficiency:</strong> Reverse gas model where canisters pay for computation
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
