import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Shield, Heart, Users, Scale } from 'lucide-react';

export default function PolicyPage() {
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8 text-center">
          <h1 className="mb-4 bg-gradient-to-r from-primary via-primary/80 to-primary bg-clip-text text-4xl font-bold text-transparent md:text-5xl">
            Community & Ethics Policy
          </h1>
          <p className="text-lg text-muted-foreground">
            Building a respectful and inclusive video-sharing community
          </p>
        </div>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-6 w-6 text-primary" />
              Our Commitment
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-muted-foreground">
            <p>
              Xocial.Stream is committed to fostering a safe, respectful, and inclusive environment for all users. 
              We believe in the power of video to educate, inspire, and connect people across the globe. This policy 
              outlines the standards we expect from our community members.
            </p>
          </CardContent>
        </Card>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Heart className="h-6 w-6 text-primary" />
              Community Guidelines
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="mb-2 font-semibold text-foreground">1. Respect and Dignity</h3>
              <p className="text-muted-foreground">
                Treat all community members with respect. Harassment, hate speech, discrimination, or bullying 
                of any kind will not be tolerated. We celebrate diversity and expect all users to do the same.
              </p>
            </div>

            <Separator />

            <div>
              <h3 className="mb-2 font-semibold text-foreground">2. Authentic and Legal Content</h3>
              <p className="text-muted-foreground">
                Upload only content that you have created or have the right to share. Respect intellectual 
                property rights, including copyrights, trademarks, and patents. Do not upload content that 
                violates any laws or regulations.
              </p>
            </div>

            <Separator />

            <div>
              <h3 className="mb-2 font-semibold text-foreground">3. Safety First</h3>
              <p className="text-muted-foreground">
                Do not post content that promotes violence, self-harm, dangerous activities, or illegal behavior. 
                Content depicting minors must be appropriate and comply with child safety laws. Report any 
                concerning content immediately.
              </p>
            </div>

            <Separator />

            <div>
              <h3 className="mb-2 font-semibold text-foreground">4. Privacy Protection</h3>
              <p className="text-muted-foreground">
                Respect the privacy of others. Do not share personal information without consent, including 
                addresses, phone numbers, or other identifying details. Be mindful of what you share about 
                yourself and others.
              </p>
            </div>

            <Separator />

            <div>
              <h3 className="mb-2 font-semibold text-foreground">5. Truthfulness and Transparency</h3>
              <p className="text-muted-foreground">
                Be honest in your content and interactions. Do not spread misinformation, engage in deceptive 
                practices, or manipulate others. Clearly label sponsored content, advertisements, or any material 
                where you have a financial interest.
              </p>
            </div>

            <Separator />

            <div>
              <h3 className="mb-2 font-semibold text-foreground">6. Constructive Engagement</h3>
              <p className="text-muted-foreground">
                Engage with others constructively. Comments and discussions should add value and foster meaningful 
                dialogue. Spam, excessive self-promotion, and disruptive behavior are not permitted.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-6 w-6 text-primary" />
              Prohibited Content
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">The following types of content are strictly prohibited:</p>
            <ul className="list-inside list-disc space-y-2 text-muted-foreground">
              <li>Violent or graphic content intended to shock or disgust</li>
              <li>Hate speech or content that promotes discrimination</li>
              <li>Sexually explicit or pornographic material</li>
              <li>Content that exploits or endangers minors</li>
              <li>Promotion of terrorism, extremism, or illegal activities</li>
              <li>Spam, scams, or fraudulent content</li>
              <li>Content that infringes on intellectual property rights</li>
              <li>Malware, viruses, or other harmful software</li>
            </ul>
          </CardContent>
        </Card>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Scale className="h-6 w-6 text-primary" />
              Enforcement and Consequences
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-muted-foreground">
            <p>
              Violations of this policy may result in content removal, account suspension, or permanent ban from 
              the platform. We review reports promptly and take appropriate action based on the severity and 
              frequency of violations.
            </p>
            <p>
              We reserve the right to remove any content or suspend any account that we determine, in our sole 
              discretion, violates this policy or is otherwise harmful to the community.
            </p>
          </CardContent>
        </Card>

        <Card className="border-primary/20 bg-gradient-to-br from-primary/5 via-primary/10 to-primary/5">
          <CardHeader>
            <CardTitle className="text-center">Community Pledge</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-center text-lg font-medium text-foreground">
              By using Xocial.Stream, you pledge to:
            </p>
            <ul className="space-y-3 text-muted-foreground">
              <li className="flex items-start gap-3">
                <span className="mt-1 text-primary">✓</span>
                <span>Treat all community members with respect and kindness</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-1 text-primary">✓</span>
                <span>Share only authentic, legal, and appropriate content</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-1 text-primary">✓</span>
                <span>Protect the privacy and safety of yourself and others</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-1 text-primary">✓</span>
                <span>Engage constructively and contribute positively to the community</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-1 text-primary">✓</span>
                <span>Report violations and help maintain a safe environment</span>
              </li>
            </ul>
            <p className="pt-4 text-center text-sm text-muted-foreground">
              Together, we can build a thriving community that celebrates creativity, diversity, and respect.
            </p>
          </CardContent>
        </Card>

        <div className="mt-8 text-center text-sm text-muted-foreground">
          <p>Last updated: January 2025</p>
          <p className="mt-2">
            Questions or concerns? Contact us through our support channels.
          </p>
        </div>
      </div>
    </div>
  );
}
