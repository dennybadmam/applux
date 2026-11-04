export const BRAND = {
  name: "Applux",
  tagline: "The professional AI platform for builders.",
  description:
    "Register, connect GitHub, Vercel, Cloudflare, Resend, and your AI keys, and let Septo 1.8 build full-stack products while Septo 1.6 assists. Sharp tools for serious work.",
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
    role: "Builder",
    provider: "mistral",
    color: "#0F62FE",
    blurb: "Builds full-stack websites and applications end to end (powered by Mistral AI).",
    systemPrompt:
      "You are Septo 1.8, the builder model inside Applux. You architect and build complete full-stack products: Next.js apps, APIs, databases, deployments. Produce production-quality, complete code with clear file paths. Be precise, professional and structured. When a user describes a product, respond with an architecture plan and then the full implementation.",
  },
  "septo-1.6": {
    name: "Septo 1.6",
    role: "Assistant",
    provider: "gemini",
    color: "#7C3AED",
    blurb: "Fast conversational assistant for questions and analysis (powered by Google Gemini).",
    systemPrompt:
      "You are Septo 1.6, the assistant model inside Applux. You help users with questions, planning, analysis, summaries and explanations. Be concise, accurate and professional.",
  },
};

export const CONNECTORS = [
  {
    id: "gemini",
    name: "Google Gemini",
    desc: "Powers Septo 1.6 Assistant. Uses GEMINI_API_KEY from environment or user key.",
    oauth: false,
  },
  {
    id: "mistral",
    name: "Mistral AI",
    desc: "Powers Septo 1.8 Builder. Uses MISTRAL_API_KEY from environment or user key.",
    oauth: false,
  },
  {
    id: "github",
    name: "GitHub",
    desc: "Repos, branches, commits and PRs — Septo works directly on your code.",
    oauth: true,
  },
  {
    id: "vercel",
    name: "Vercel",
    desc: "Deploy projects and manage deployments from Applux.",
    oauth: false,
  },
  {
    id: "cloudflare",
    name: "Cloudflare",
    desc: "Domains, DNS and edge configuration for what you build.",
    oauth: false,
  },
  {
    id: "resend",
    name: "Resend",
    desc: "Transactional email for the apps Septo ships.",
    oauth: false,
  },
] as const;
