export const BRAND = {
  name: "Applux",
  tagline: "The professional AI engineering platform for builders.",
  description:
    "Chat to build full-stack web apps, generate visual assets, preview live in real time, and commit directly to GitHub. Powered by built-in Septo AI models.",
};

export type SeptoModel = "septo-1.8" | "septo-1.6";

export const MODELS: Record<
  SeptoModel,
  {
    name: string;
    role: string;
    provider: "mistral" | "gemini";
    color: string;
    blurb: string;
    systemPrompt: string;
  }
> = {
  "septo-1.8": {
    name: "Septo 1.8",
    role: "App Builder",
    provider: "mistral",
    color: "#0F62FE",
    blurb: "Builds complete, interactive web applications and full-stack software with live preview.",
    systemPrompt: `You are Septo 1.8, the lead AI App Builder inside Applux (similar to Lovable).
Your job is to build complete, functional, gorgeous web applications, landing pages, interactive tools, and games.
Whenever a user asks to build an app, website, or component:
1. Provide a brief, professional summary of what you built.
2. Output the COMPLETE, self-contained, working HTML application inside a single \`\`\`html code block.
3. The HTML code MUST include:
   - Modern HTML5 structure.
   - Tailwind CSS via CDN: <script src="https://cdn.tailwindcss.com"></script>
   - Beautiful Lucide icons via CDN or FontAwesome/SVG icons.
   - Modern, responsive styling with clean typography, buttons, cards, modals, and smooth interactions.
   - Full client-side JavaScript for all interactive features, state management, forms, local storage persistence, and animations.
   - DO NOT output truncated, placeholder, or TODO code. Everything must work immediately when rendered in an iframe sandbox.
When asked for an image or visual asset, explain the visual composition clearly and instruct the image generator.`,
  },
  "septo-1.6": {
    name: "Septo 1.6",
    role: "Fast Assistant",
    provider: "gemini",
    color: "#7C3AED",
    blurb: "Ultra-fast engineering assistant for planning, analysis, debugging, and code reviews.",
    systemPrompt: `You are Septo 1.6, the fast AI engineering assistant inside Applux.
You assist builders with software architecture, code reviews, debugging, database design, API integrations, and explanations.
Be concise, sharp, and accurate. Format code clearly in markdown with language tags. If the user asks to build an interactive app, you can provide complete working code or recommend Septo 1.8 Builder for full live-preview apps.`,
  },
};

export interface ConnectorDef {
  id: "github" | "vercel" | "supabase" | "cloudflare" | "resend";
  name: string;
  desc: string;
  oauth: boolean;
  docUrl: string;
  fieldLabel?: string;
  placeholder?: string;
}

export const CONNECTORS: ConnectorDef[] = [
  {
    id: "github",
    name: "GitHub",
    desc: "Repositories, branches, commits, and pull requests. Connect with 1-click OAuth to sync your generated code directly to GitHub.",
    oauth: true,
    docUrl: "https://github.com",
    fieldLabel: "Personal Access Token",
    placeholder: "ghp_...",
  },
  {
    id: "supabase",
    name: "Supabase",
    desc: "PostgreSQL database, authentication, realtime subscriptions, and object storage for your applications.",
    oauth: false,
    docUrl: "https://supabase.com",
    fieldLabel: "Anon / Service Key",
    placeholder: "sb_publishable_... or service_role key",
  },
  {
    id: "vercel",
    name: "Vercel",
    desc: "Deploy your built apps to production with custom domains, preview links, and serverless functions.",
    oauth: false,
    docUrl: "https://vercel.com",
    fieldLabel: "Vercel Access Token",
    placeholder: "vercel_pat_...",
  },
  {
    id: "cloudflare",
    name: "Cloudflare",
    desc: "Global CDN, DNS records, DDoS protection, and Cloudflare Workers at the edge.",
    oauth: false,
    docUrl: "https://cloudflare.com",
    fieldLabel: "API Token",
    placeholder: "Cloudflare API token",
  },
  {
    id: "resend",
    name: "Resend",
    desc: "Modern transactional email delivery, notifications, and analytics for your users.",
    oauth: false,
    docUrl: "https://resend.com",
    fieldLabel: "API Key",
    placeholder: "re_...",
  },
];
