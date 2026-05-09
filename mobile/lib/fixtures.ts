/** Static career cards + feed demo data. */

import { slugify } from "./slug";

export interface FeedPost {
  id: string;
  handle: string;
  avatar_url?: string | null;
  career_tag: string;
  caption: string;
  likes: number;
  comments: number;
  saves: number;
  shares: number;
  /** Native gradient stops (top-left-ish → mid → bottom). */
  gradientColors: readonly [string, string, string];
  video_url?: string | null;
}

export const feedFixtures: FeedPost[] = [
  {
    id: "1",
    handle: "@careercoach",
    career_tag: "Data Analyst",
    caption:
      "A realistic day in the life of a remote data analyst — meetings, SQL, and dashboards.",
    likes: 142_000,
    comments: 1043,
    saves: 12_000,
    shares: 842,
    gradientColors: ["#1a1340", "#0a0a0a", "#1a0530"],
  },
  {
    id: "2",
    handle: "@buildwithme",
    career_tag: "Product Designer",
    caption: "From wireframe to ship in one week. Tools I actually use day to day.",
    likes: 88_400,
    comments: 612,
    saves: 7_300,
    shares: 411,
    gradientColors: ["#002233", "#060606", "#00141f"],
  },
  {
    id: "3",
    handle: "@codingnomad",
    career_tag: "Software Engineer",
    caption: "Junior → Senior in 3 years: the unglamorous version.",
    likes: 220_900,
    comments: 2890,
    saves: 31_200,
    shares: 1_205,
    gradientColors: ["#20003a", "#050505", "#0b0030"],
  },
  {
    id: "4",
    handle: "@nursediaries",
    career_tag: "Registered Nurse",
    caption: "12-hour shift, ICU. What nobody tells you in school.",
    likes: 305_000,
    comments: 4112,
    saves: 19_800,
    shares: 2_440,
    gradientColors: ["#2a0010", "#050505", "#1a0010"],
  },
  {
    id: "5",
    handle: "@onthebench",
    career_tag: "Mechanical Engineer",
    caption: "Inside a bike R&D lab. Real prototypes, real failures.",
    likes: 67_800,
    comments: 502,
    saves: 5_900,
    shares: 280,
    gradientColors: ["#002a1a", "#050505", "#001a14"],
  },
];

export interface Career {
  id: string;
  title: string;
  emoji: string;
  category: string;
  salary: string;
  skills: string[];
  pathways: string[];
  tasks: string[];
  overview: string;
}

export const careers: Career[] = [
  {
    id: "data-analyst",
    title: "Data Analyst",
    emoji: "📊",
    category: "Tech",
    salary: "Varies — typically $60k–$120k US",
    skills: ["SQL", "Python", "Statistics", "Dashboards", "Communication"],
    pathways: ["Bootcamp + portfolio", "Bachelor's in stats / CS", "Internal transfer from ops"],
    tasks: ["Pull and clean datasets", "Build dashboards", "Present insights to stakeholders"],
    overview: "Translates messy data into decisions. Sits between engineers and the business.",
  },
  {
    id: "product-designer",
    title: "Product Designer",
    emoji: "🎨",
    category: "Design",
    salary: "Varies — typically $70k–$160k US",
    skills: ["Figma", "User research", "Prototyping", "Visual design", "Writing"],
    pathways: ["Self-taught + portfolio", "Design degree", "Adjacent role (PM, FE) → design"],
    tasks: ["Run user interviews", "Sketch and prototype flows", "Pair with engineering on ship"],
    overview: "Designs how a product looks, feels, and behaves end-to-end.",
  },
  {
    id: "software-engineer",
    title: "Software Engineer",
    emoji: "💻",
    category: "Tech",
    salary: "Varies — typically $90k–$220k US",
    skills: ["A language (TS/Python/Go)", "Systems thinking", "Testing", "Code review"],
    pathways: ["CS degree", "Bootcamp + projects", "Self-taught + open source"],
    tasks: ["Ship features", "Debug production", "Review teammates' code"],
    overview: "Builds and maintains software systems with a team.",
  },
  {
    id: "registered-nurse",
    title: "Registered Nurse",
    emoji: "🩺",
    category: "Healthcare",
    salary: "Varies — typically $65k–$110k US",
    skills: ["Patient care", "Clinical judgement", "Communication", "Stamina"],
    pathways: ["ADN (2 yr)", "BSN (4 yr)", "Accelerated BSN for career changers"],
    tasks: ["Assess patients", "Administer meds", "Coordinate with doctors and family"],
    overview: "Frontline clinical role across hospitals, clinics, and home care.",
  },
  {
    id: "mechanical-engineer",
    title: "Mechanical Engineer",
    emoji: "⚙️",
    category: "Engineering",
    salary: "Varies — typically $70k–$140k US",
    skills: ["CAD", "Materials", "Thermo / dynamics", "Hands-on prototyping"],
    pathways: ["BS Mechanical Engineering", "Apprenticeship + AS"],
    tasks: ["Design parts in CAD", "Run physical tests", "Iterate on prototypes"],
    overview: "Designs physical things that move, hold, or transmit force.",
  },
  {
    id: "ux-researcher",
    title: "UX Researcher",
    emoji: "🔍",
    category: "Design",
    salary: "Varies — typically $80k–$180k US",
    skills: ["Interviewing", "Survey design", "Synthesis", "Storytelling"],
    pathways: ["HCI / psych degree", "Adjacent role + portfolio of studies"],
    tasks: ["Plan studies", "Run interviews", "Share findings with PMs and design"],
    overview: "Figures out what users actually need, not just what they say.",
  },
];

/** Map feed `career_tag` / API title → fixture `Career.id` for `/career/[id]`. */
export function resolveCareerIdFromTag(tag: string): string {
  const exact = careers.find((c) => c.title === tag);
  if (exact) return exact.id;
  const slug = slugify(tag);
  const bySlug = careers.find((c) => c.id === slug || slugify(c.title) === slug);
  return bySlug?.id ?? slug;
}
