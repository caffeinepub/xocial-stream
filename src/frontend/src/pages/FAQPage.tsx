import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

// Single source of truth for FAQ content - DO NOT MODIFY
const FAQ_CONTENT = {
  heading: 'Xocial.Stream — FAQ',
  items: [
    {
      question: 'What is Xocial.Stream?',
      answer: `Xocial.Stream is a simple, private video‑uploading and streaming platform. It's built for people who want a clean place to store and watch their own videos without ads, algorithms, or tracking. You upload your videos, and you can watch them from anywhere on any device. There's no public feed, no pressure to perform, and no distractions — just your videos in your own space.`,
    },
    {
      question: 'How is this different from YouTube or other platforms?',
      answer: `Xocial.Stream isn't designed for views, likes, or chasing an audience. It's built for you, not for public broadcasting.
There are no ads, no recommendations, no tracking, and no algorithm deciding what you see. Nothing is pushed in front of you, and nothing about your viewing habits is collected for profit.
Your videos stay private unless you choose to share them. It's simply a clean, personal place to upload and watch your own content.`,
    },
    {
      question: 'How does Xocial.Stream work?',
      answer: `Xocial.Stream is designed to be simple from the moment you open it. When you click the link in your browser, you're taken straight to a clean profile page where you only need to enter your name. Tap Join, and the system instantly creates your Internet Identity for you. This usually takes just a few seconds, and once it's verified, you're automatically signed in with full access to the platform.

From there, you can browse Xocial.Stream and see how everything works. The Free Plan is available right away and gives you 10 uploads per month so you can test the player, try out the features, and get a feel for the platform. If you need more, you can upgrade anytime.
The entire flow is mobile‑first, fast, and effortless.`,
    },
    {
      question: 'Are my uploaded videos safe? Will I lose them if something crashes?',
      answer: `Your videos are stored on decentralized infrastructure rather than a single server. This means your content isn't sitting in one fragile location that can fail or disappear.
If one part of the network goes down, your videos remain available because they're stored across multiple nodes. There's no single point of failure and no Big Tech company controlling your data.
This setup gives you long‑term reliability and peace of mind — your videos stay online even if something breaks behind the scenes.`,
    },
    {
      question: 'Can other people see my videos?',
      answer: `No. Your videos are private by default and only viewable by you unless you choose to share a link.
There is no public feed, no discovery page, and no algorithm exposing your content to strangers. You stay in full control of who sees what.`,
    },
    {
      question: 'Do you compress my videos?',
      answer: `Videos are processed so they can stream smoothly on different devices, but unnecessary compression is avoided. The goal is to keep your videos looking as close to the original quality as possible while still making them easy to watch on mobile and desktop.`,
    },
    {
      question: 'Are there upload limits?',
      answer: `Yes, depending on your plan:

Free Plan: 10 uploads per month

Pro / Creator Plus: unlimited uploads

You can upgrade anytime if you need more space or want to store larger collections.`,
    },
    {
      question: 'What video formats can I upload?',
      answer: `Most common formats are supported, including MP4, MOV, and WEBM. If your phone or camera records it, it will almost always work.`,
    },
    {
      question: 'What content is allowed on Xocial.Stream?',
      answer: `Anything legal, safe, and respectful. You can upload personal videos, creative projects, tutorials, family clips — anything that doesn't break the law or harm others.
There is no algorithm judging your content, but harmful or illegal material is not allowed.`,
    },
    {
      question: 'What if my video gets blocked?',
      answer: `If a video violates the rules, it may be blocked. You'll be told exactly why it happened, and you can fix the issue and re‑upload the video.
There are no hidden rules or silent removals — everything is transparent.`,
    },
    {
      question: 'How do I share my videos?',
      answer: `Each video has a private link you can copy and send to anyone you choose. Only people with the link can view it.`,
    },
    {
      question: 'Can I delete my videos?',
      answer: `Yes. You can delete any video from your dashboard at any time, and it will be removed from the network.`,
    },
    {
      question: 'Can I cancel my subscription anytime?',
      answer: `Yes. There are no contracts, no lock‑ins, and no penalties. You stay in full control of your account.`,
    },
    {
      question: 'Is there a mobile app?',
      answer: `There's no separate app yet, but Xocial.Stream is designed mobile‑first. The entire platform is built to run smoothly on your phone's browser, just like an app.`,
    },
    {
      question: 'What is the Internet Computer (ICP)?',
      answer: `ICP is the decentralized network that powers Xocial.Stream. Instead of relying on traditional servers owned by big companies, ICP spreads data across a secure, distributed network.
This means no single company controls your videos, no single server can fail and take your content with it, and your videos stay online even if parts of the network go down.
It's a modern, resilient way to store and stream media.`,
    },
  ],
} as const;

export default function FAQPage() {
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="mx-auto max-w-4xl">
        <h1 className="mb-8 bg-gradient-to-r from-primary via-primary/90 to-primary/80 bg-clip-text text-center text-4xl font-bold text-transparent md:text-5xl">
          {FAQ_CONTENT.heading}
        </h1>

        <Accordion type="single" collapsible className="w-full space-y-4">
          {FAQ_CONTENT.items.map((item, index) => (
            <AccordionItem
              key={`item-${index + 1}`}
              value={`item-${index + 1}`}
              className="rounded-lg border bg-card px-6"
            >
              <AccordionTrigger className="text-left text-lg font-semibold hover:no-underline">
                {item.question}
              </AccordionTrigger>
              <AccordionContent className="whitespace-pre-line text-muted-foreground">
                {item.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </div>
  );
}
