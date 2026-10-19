/**
 * ╔══════════════════════════════════════════════════════════════════════╗
 * ║  ⭐ EDIT THIS FILE TO MAKE THE SITE YOURS ⭐                            ║
 * ║                                                                        ║
 * ║  This is the SINGLE source of truth for all page content:             ║
 * ║  your name, tagline, social links, work experience, projects,         ║
 * ║  skills, and bio. Change the values below — no need to touch any       ║
 * ║  component code. Blog posts live separately in content/blog/*.mdx.     ║
 * ╚══════════════════════════════════════════════════════════════════════╝
 */

import type { MotionPreset } from '@/lib/motion';

// ── Site-wide / SEO ────────────────────────────────────────────────────────
// IMPORTANT: set SITE_URL to your final public URL so Open Graph tags, the
// sitemap, and canonical links resolve correctly.
//   • Project repo:  https://<your-username>.github.io/portfolio
//   • User/org repo: https://<your-username>.github.io
export const SITE_URL = 'https://ngzhili.github.io/portfolio';

export const site = {
  // Used in <title>, meta tags, footer, etc.
  name: 'Ng Zhili',
  // Short role shown under your name in the hero.
  role: 'Lead Solutions Architect & Full-Stack Software Engineer (GenAI)',
  // Hero headline. `accent` gets the violet→cyan gradient.
  headline: { lead: 'I build production ', accent: 'GenAI agent systems.' },
  // A punchy one-liner shown under the headline (also the meta description).
  tagline: 'I design and scale GenAI agents, RAG pipelines, and the platforms they run on, from business requirements to production.',
  // Longer intro paragraph. No longer rendered in the hero (the tagline is);
  // kept for reuse and as the long-form summary.
  intro:
    'Lead Solutions Architect and Full-Stack Software Engineer with 3+ years in Generative AI, full-stack web, and backend development. I build production GenAIOps pipelines, multilingual multimodal RAG with citations, and agentic applications — from business requirements to deployment at scale.',
  // Default Open Graph / social share image (lives in /public).
  // ABSOLUTE URL is required: metadataBase has a subpath (/portfolio), and a
  // leading-slash relative path would resolve to the origin only, dropping the
  // subpath (→ 404). The PNG is generated from og-image.svg via sharp.
  ogImage: `${SITE_URL}/og-image.png`,
  // Your location (optional — shown in About).
  location: 'Singapore',
} as const;

// ── Hero background ──────────────────────────────────────────────────────────
// Which animated background the hero draws.
//   • 'agent'     — an agent run trace: query → plan → tool calls → reflect →
//                   answer, with a live trace log. Click the hero to start a run.
//   • 'harness'   — the same run inside its harness: memory read/write, tools
//                   in a sandbox that load on demand, a sub-agent, an eval step.
//   • 'retrieval' — the original vector-store field: a query lights its top-5
//                   nearest chunks. Click the hero to drop your own query.
// Add ?hero=harness (etc.) to the URL to preview another one without editing.
export type HeroVariant = 'agent' | 'harness' | 'retrieval';
export const heroVariant: HeroVariant = 'harness';

// What the harness hero shows (only used when heroVariant is 'harness').
// `tools` is the pool: two are loaded at a time and the rest load on demand,
// so keep names ≤ 8 characters. `subagent` is the name the trace log gives
// the sub-agent node. Queries are shared with heroAgent.
export const heroHarness = {
  tools: ['retrieve', 'search', 'run_code', 'sql', 'browser', 'github', 'ocr', 'fetch'],
  subagent: 'researcher',
};

// ── Motion ───────────────────────────────────────────────────────────────────
// How the whole site moves (reveals, hero headline, nav, hovers, buttons).
//   • 'calm'      — quiet and short; the original feel, tidied up
//   • 'kinetic'   — springy: per-word headline, sliding nav pill, button press
//   • 'cinematic' — long eases, blur-in reveals, scroll-linked depth
// Add ?motion=kinetic (etc.) to the URL to preview another preset without
// changing this; in `npm run dev` a switcher pill also appears bottom-left.
export const motionPreset: MotionPreset = 'calm';

// What the agent trace hero shows (only used when heroVariant is 'agent').
// `tools` become the tool nodes. 3–5 names of ≤ 8 characters lay out best;
// longer names start to collide with the neighbouring tool's edges.
// `queries` are sample user requests the trace log quotes.
export const heroAgent = {
  tools: ['retrieve', 'search', 'run_code', 'memory'],
  queries: [
    'summarise Q3 incident reports',
    'compare vendor contracts',
    'draft a test plan from the spec',
    'find citations for this claim',
    'translate and summarise this memo',
    'which services breached SLA?',
  ],
};

// ── Social / contact links ───────────────────────────────────────────────────
// Set `href` to your real URLs. Leave the email as a bare address (no mailto:);
// the contact section adds `mailto:` for you.
export const socials = {
  email: 'ng.zhili@gmail.com',
  github: 'https://github.com/ngzhili',
  linkedin: 'https://www.linkedin.com/in/ngzhili',
  // website: 'https://ngzhili.github.io/portfolio/',
} as const;

// Path (inside /public) to a downloadable resume.
// NOTE: the résumé download buttons are currently HIDDEN in the UI (see Hero.tsx
// and About.tsx). This path is kept for when you want to re-enable them.
export const resumePath = '/resume.pdf';

// ── Work experience (timeline) ───────────────────────────────────────────────
export type Experience = {
  role: string;
  company: string;
  // Company logo inside /public (SVG/PNG). Shown as a chip beside the role.
  // Omit to fall back to an auto-generated monogram from the company name.
  logo?: string;
  period: string; // e.g. "2022 — Present"
  location?: string;
  description: string;
  highlights?: string[];
};

export const experience: Experience[] = [
  {
    role: 'Full-Stack Software Engineer / Solutions Architect (L4)',
    company: 'DSO National Laboratories',
    logo: '/logos/dso.jpg',
    period: 'Feb 2024 — Present',
    location: 'Singapore',
    description:
      'Chief architect of the organization-wide GenAIOps platform (the "golden path") that standardizes how teams build and deploy GenAI models and multi-agent applications to production — adopted by 20 teams and applications, cutting time-to-production from 5 weeks to 2 days.',
    highlights: [
      'Architected the full agentic stack — agent harnesses, an OpenAI-compatible model gateway, an MCP tool-server registry, evaluation, observability, memory, skills, knowledge retrieval, and sandboxed execution.',
      'Built the agent-harness runtime: every conversation runs in its own gVisor-isolated sandbox pod on Kubernetes behind a stateless control plane, with all egress and credentials brokered by a separate proxy so agents never hold secrets. Warm pools, persistent per-conversation storage, and snapshot/restore let sessions resume on demand — load-tested to 150 concurrent sandboxes on a 3-node cluster with sub-second warm starts.',
      'Operated on-premise GPU inference microservices (A100/H100/H200 clusters) with autoscaling, dashboards, and observability — ~10k requests/day across 5 applications at 99.9% uptime over 12 months in an air-gapped environment.',
      'Designed an event-driven data platform for on-prem LLM training datasets (RabbitMQ topic exchanges, dead-letter replay, byte-offset row indexing, PostgreSQL) built to scale to billions of files and petabytes of data. After profiling showed a GIL-bound, disk-IOPS-limited workload, merged the two-pass extract-then-index pipeline into a single-read consumer and scaled it to 16 replicas — large-file indexing throughput rose from 22 to 130 files/s (5.8×) with one disk read per file instead of two.',
      'Scaled multilingual (Southeast Asian languages), multimodal RAG with citation-backed answers over millions of files across 8 document types (PDF, Office, images, text) using adaptive retrieval, self-reflection, and multi-turn memory — answer accuracy rose from 28% to 86% on a 2,000-pair internal benchmark.',
      'Built an automated RAG benchmarking framework that generates synthetic multilingual QA pairs verified by LLM-as-a-judge with human review of a sample — evaluation turnaround fell from ~20 days of manual review to 6 hours; adopted by 10 of the 20 platform teams.',
      'Designed and launched full-stack AI chatbot platforms (React/TypeScript, FastAPI) with real-time streaming of agent steps, tool execution, state synchronization, and human-in-the-loop workflows — ~2,000 registered users, ~450 monthly active users, ~200 messages/day, 85% thumbs-up rating.',
      'Drove adoption of agentic coding (Claude Code, served through the on-prem model gateway) across the entire 20-engineer team in an air-gapped environment — median issue-open-to-merge lead time fell from 5 days to 1 day across ~40 features in 3 months.',
      'Built CI/CD pipelines for the chatbot platforms across development, testing, and production — releases moved from weekly to daily, and release preparation fell from 2 days to 30 minutes.',
      'Gathered requirements from operational users and iterated directly with end users to ship 4 GenAI products from concept to production. Awarded 3× Group Performance Award and selected for DSO\'s Leadership Development Programme (management fast-track, top 5% of eligible engineers).',
      'Led 5-engineer project teams and mentored 5 engineers through onboarding, design reviews, and code reviews — 3 now independently own production services.',
    ],
  },
  {
    role: 'Regional Business Intelligence Analyst',
    company: 'Shopee, SEA Limited',
    logo: '/logos/shopee.jpg',
    period: 'Aug 2023 — Feb 2024',
    location: 'Singapore',
    description:
      'Led a team of 5 analysts building 9 regional data marts fed by 6 Airflow/PySpark pipelines, used by a 15-person regional FP&A team across 11 countries.',
    highlights: [
      'Architected CI/CD (GitLab, Jenkins) and Git workflows for PySpark pipelines across dev/staging/prod.',
      'Built internal tooling for automated Apache Airflow deployment, backfills, and workflow versioning — a typical backfill went from ~2 days of manual work to under 1 hour.',
    ],
  },
  {
    role: 'Data Scientist Intern',
    company: 'Procter & Gamble',
    logo: '/logos/pg.png',
    period: 'May 2022 — Jul 2022',
    location: 'Singapore',
    description:
      'Built a scalable retail shelf-optimization analytics dashboard (Python, Pandas, Spark SQL) deployed via KNIME with cross-functional stakeholders across 65 brands and 15 markets in the AMA region, driving assortment strategies that supported 20% product value-share growth.',
    highlights: [
      'Developed Spark SQL workflows on Azure Databricks, saving 50+ analysts an estimated ~4 hours/week each of exploratory-analysis time.',
      'Debugged Pandas pipelines to ensure data integrity, increasing insight accuracy by 30%.',
      'Presented technical solutions to non-technical product owners and business stakeholders.',
    ],
  },
  {
    role: 'Regional Data Scientist (Part-time)',
    company: 'CARRO',
    logo: '/logos/carro.png',
    period: 'Jan 2022 — May 2022',
    location: 'Singapore',
    description:
      'Promoted from intern to part-time Regional Data Scientist. Designed ETL and dataset-preparation pipelines (AWS Lambda, SageMaker, Supervisely API) for a 10-person APAC data science team, reducing manual workload by 60%.',
    highlights: [
      'Built automated annotation-QA pipelines (PyTorch Detectron2 pixel-wise instance segmentation to flag annotation errors) and an internal annotation-review platform used by 20 overseas annotators, cutting labeling cost per image by 74%.',
      'Automated dataset retrieval via Supervisely API and AWS Boto3; multi-label stratified splits improved model accuracy by 20%.',
    ],
  },
  {
    role: 'AI Engineer Intern',
    company: 'Defence Science and Technology Agency (DSTA)',
    logo: '/logos/dsta.png',
    period: 'Dec 2021 — Jan 2022',
    location: 'Singapore',
    description:
      'Benchmarked the top 5 SOTA scene-segmentation models on real-time ground/aerial autonomous-vehicle video using Python, PyTorch, OpenCV, and OpenMMLab — saving 15 ML engineers time on model selection.',
    highlights: [
      'Presented deployment recommendations to senior management.',
    ],
  },
  {
    role: 'Data Scientist Intern',
    company: 'CARRO',
    logo: '/logos/carro.png',
    period: 'May 2021 — Dec 2021',
    location: 'Singapore',
    description:
      'Led a 5-member computer-vision team and managed stakeholders to deploy an AI car-damage detection tool across 5 countries.',
    highlights: [
      'Built a Keras-based ETL pipeline (AWS Lambda + SageMaker) filtering 100K+ images, cutting data preparation time by 70%.',
      'Trained TensorFlow YOLO damage-detection models (71% mAP) and OpenCV perspective-correction + OCR pipelines for license plates (<10% character error rate).',
    ],
  },
];

// ── Agent systems (featured GenAI work) ──────────────────────────────────────
// Shown in the "Agent systems" section right after the hero. Mark one entry
// `featured` to give it the full-width card with the stack-layer chips.
export type AgentSystem = {
  title: string;
  summary: string;
  bullets: string[];
  tags: string[];
  // Optional headline number shown in the card corner.
  metric?: { value: string; label: string };
  // Optional row of small chips (used on the featured card for stack layers).
  layers?: string[];
  featured?: boolean;
};

export const agentSystems: AgentSystem[] = [
  {
    title: 'GenAIOps framework & agent runtime',
    summary:
      'Chief architect of an organization-wide, end-to-end GenAIOps framework that takes GenAI models and multi-agent systems from prototype into production products.',
    bullets: [
      'Architected the full agentic stack: frameworks, runtime, harness and UI-Agent-Tool communication.',
      'Built in observability, evaluation and sandboxing so agent behaviour is measurable and safe to ship.',
      'Designed memory, skills and knowledge-retrieval layers shared across agent products.',
      'Accelerated development and deployment for teams building on the platform.',
    ],
    layers: ['runtime', 'harness', 'tools', 'memory', 'skills', 'retrieval', 'eval', 'observability', 'sandbox'],
    tags: ['Multi-Agent Systems', 'LangGraph', 'Python', 'FastAPI', 'Observability', 'Evaluation'],
    metric: { value: '2000+', label: 'production users' },
    featured: true,
  },
  {
    title: 'Streaming agent chat platform with Human-in-the-Loop',
    summary:
      'Full-stack AI chatbot platforms that stream every agent step to the user as it happens.',
    bullets: [
      'Real-time streaming of agent steps and tool execution.',
      'State sync between UI, agent and tools.',
      'Human-in-the-Loop approval workflows for sensitive actions.',
    ],
    tags: ['React', 'Real-time Streaming UI', 'Tool Use', 'Human-in-the-Loop'],
  },
  {
    title: 'Adaptive RAG & self-reflection at scale',
    summary:
      'Retrieval pipelines that decide how to search, check their own answers and cite their sources.',
    bullets: [
      'Adaptive RAG and self-reflection pipelines with multi-turn reasoning and memory.',
      'Multilingual, multimodal retrieval scaled over millions of files.',
      'Citation-backed responses for traceable answers.',
    ],
    tags: ['RAG', 'Multimodal', 'Multilingual', 'Vector DBs', 'Citations'],
    metric: { value: 'Millions', label: 'of files indexed' },
  },
  {
    title: 'On-prem GPU inference & CI/CD for AI apps',
    summary:
      'The serving and delivery layer underneath the agents: self-hosted models and repeatable releases.',
    bullets: [
      'On-prem GPU/HPC inference microservices with autoscaling and monitoring.',
      'CI/CD pipelines purpose-built for AI applications.',
      'Awarded 3× Group Performance Award.',
    ],
    tags: ['vLLM', 'Kubernetes', 'Docker', 'GPU / HPC', 'Autoscaling'],
  },
];

// ── Projects / work gallery ──────────────────────────────────────────────────
export type Project = {
  title: string;
  description: string;
  // Thumbnail inside /public (SVG/PNG/JPG). Replace with your own screenshots.
  image: string;
  // Tech tags shown on the card.
  tags: string[];
  // Links — set to "" to hide a button.
  demo: string;
  repo: string;
  // Optional Medium article write-up. Set to "" / omit to hide the button.
  medium?: string;
  // Mark a couple as featured to give them a subtle highlight.
  featured?: boolean;
};

export const projects: Project[] = [
  {
    title: 'Soldier Strong — DSTA BrainHack (Winner)',
    description:
      'Best Minimum Viable Product and university-category winner among 70 teams. An IPPT tracker React Native app using Firebase Firestore and a TensorFlow.js PoseNet model for client-side, real-time counting of push-ups, sit-ups, and runs.',
    image: '/projects/situp-demo.gif',
    tags: ['React Native', 'TensorFlow.js', 'Firebase'],
    demo: '',
    repo: 'https://github.com/yappeizhen/Soldier-Strong-Strawberry',
    featured: true,
  },
  {
    title: 'AlphaSign & SignPose — Anaconda Data Science Expo (Winner)',
    description:
      'A React web app recognizing American Sign Language in real time via client-side TensorFlow.js object detection (91% AP), plus a Keras LSTM on Flask reaching 90% accuracy for dynamic sign classification using MediaPipe pose estimation.',
    image: '/projects/LearnSign.png',
    tags: ['React', 'TensorFlow.js', 'MediaPipe'],
    demo: 'https://yappeizhen.github.io/AlphaSign/baseline',
    repo: 'https://github.com/yappeizhen/AlphaSign',
  },
  {
    title: 'Two-Wheel Robot — Deep Reinforcement Learning',
    description:
      'Implemented Deep RL methods in Python (single/multi-agent, discrete & continuous action spaces) with PyTorch and TensorFlow to make a two-wheel robot traverse slopes in PyBullet. Built the RL gym environment and algorithms from scratch — without the OpenAI Gym library.',
    image: '/projects/slope_demo.gif',
    tags: ['PyTorch', 'Reinforcement Learning', 'PyBullet'],
    demo: '', // no live demo
    repo: 'https://github.com/ngzhili/Two-Wheel-Robot-DeepRL', // ← add code link
  },
  {
    title: 'Cointegration Pairs Trading',
    description:
      'Built a statistical-arbitrage strategy in Python identifying cointegrated equity pairs via the Engle–Granger test, trading mean-reverting spreads with z-score entry/exit thresholds. Backtested with vectorized P&L, transaction costs, and Sharpe-ratio evaluation.',
    image: '/projects/cointegration_pairs.jpg',
    tags: ['Python', 'Pandas', 'Quant Finance', 'Statsmodels'],
    demo: '',
    repo: '',
    medium: 'https://arnav04g.medium.com/trading-of-cointegration-pairs-using-mean-reversion-statistical-arbitrage-cbc13b70bc3d',
  },
  {
    title: 'FrozenLake — Reinforcement Learning',
    description:
      'Solved the stochastic FrozenLake environment from scratch in Python, implementing tabular Q-learning and SARSA with epsilon-greedy exploration and reward shaping. Benchmarked convergence and policy stability across slippery and deterministic grid variants.',
    image: '/projects/frozenlake-greedy-policy.png',
    tags: ['Python', 'Reinforcement Learning', 'Q-Learning'],
    demo: '',
    repo: 'https://github.com/ngzhili/FrozenLake-Reinforcement-Learning',
  },
  {
    title: 'Singapore Racial Distribution — Geospatial',
    description:
      'An interactive geospatial visualization site (JavaScript, Python, Folium, GeoPandas) investigating the effectiveness of Singapore’s Ethnic Integration Policy, with HDB data mined via Selenium and the OneMap API.',
    image: '/projects/hdb-eip.png',
    tags: ['Python', 'GeoPandas', 'JavaScript'],
    demo: 'https://ngzhili.github.io/HDB-EIP/',
    repo: 'https://github.com/ngzhili/HDB-EIP',
  },
  {
    title: 'InsurTech Car-Damage Detection (SFF Featured)',
    description:
      'Featured at the Singapore FinTech Festival. Fine-tuned and deployed a YOLOv5 detector via a Flask web app, RESTful APIs, and Docker to detect car damage and estimate repair costs, automating the insurance claims process.',
    image: '/projects/insurtech-2.jpg',
    tags: ['YOLOv5', 'Flask', 'Docker'],
    demo: '',
    repo: 'https://github.com/danieltwh/Insurtech-CV',
  },
  {
    title: 'Ultrasound Breast Cancer Classification',
    description:
      'Led a team of 5 to build an ML pipeline classifying ultrasound breast-cancer images with Scikit-Learn, TensorFlow CNNs, and a PyTorch Vision Transformer — achieving a SOTA 95% test F1. Used AutoKeras AutoML and WandB/GridSearchCV tuning.',
    image: '/projects/breast-cancer-ultrasound.png',
    tags: ['PyTorch', 'Vision Transformer', 'AutoML'],
    demo: '',
    repo: '',
  },
  {
    title: 'RoboMaster — Autonomous Combat Robot',
    description:
      'Engineered perception and control for a DJI RoboMaster robot — real-time armor-plate detection via OpenCV/CV pipelines, target tracking, and auto-aim. Integrated embedded motor control with computer-vision feedback for autonomous targeting.',
    image: '/projects/Standard-cad.jpg',
    tags: ['Computer Vision', 'OpenCV', 'Robotics', 'C++'],
    demo: '',
    repo: '',
  },
];

// ── Publications ─────────────────────────────────────────────────────────────
export type Publication = {
  title: string;
  venue: string; // conference / journal + year
  authors: string;
  description: string;
  // Optional teaser image inside /public (PNG/JPG). Shown as a banner on the card.
  image?: string;
  tags?: string[];
  // Optional links (paper, code, project page). Set href to "" / omit to hide.
  links?: { label: string; href: string }[];
};

export const publications: Publication[] = [
  {
    title:
      'SynTable — A Synthetic Data Generation Pipeline for Unseen Object Amodal Instance Segmentation (UOAIS) of Cluttered Tabletop Scenes',
    venue: 'Synthetic Data for Computer Vision Workshop @ CVPR 2025',
    authors:
      'Ng Zhili, Wang Haozhe, Zhang Zhengshen, Tay Eng Hock & Marcelo H. Ang Jr. — NUS Advanced Robotics Centre',
    description:
      'Introduced a novel Occlusion Order Accuracy metric for UOAIS and built a reusable synthetic-data generation pipeline producing amodal & occlusion masks by extending NVIDIA source code. Contributed a large-scale photorealistic UOAIS dataset of 50,000 RGBD images, achieving SOTA results.',
    image: '/publications/syntable-teaser.png',
    tags: ['NVIDIA Isaac Sim', 'Computer Vision', 'Synthetic Data'],
    links: [
      { label: 'Paper', href: 'https://arxiv.org/pdf/2307.07333' }, // ← add paper / arXiv link
      { label: 'Code', href: 'https://github.com/ngzhili/SynTable' }, // ← add repo link
    ],
  },
];

// ── Skills (grouped by category) ─────────────────────────────────────────────
export type SkillGroup = {
  category: string;
  items: string[];
};

export const skills: SkillGroup[] = [
  {
    category: 'Agents & GenAI Systems',
    items: ['LLMs', 'RAG', 'Agentic Workflows', 'Multi-agent Orchestration', 'Agent Harnesses', 'Tool Use', 'Human-in-the-Loop', 'MCP', 'A2A', 'ACP', 'AG-UI', 'A2UI', 'Context Engineering', 'Hybrid Search', 'Multimodal AI', 'Evaluation & Benchmarking', 'LLM-as-a-Judge', 'Fine-tuning', 'Synthetic Data', 'Model Inference & Optimization', 'Observability', 'Sandboxing & Guardrails (gVisor)', 'OpenAI-compatible APIs', 'Agentic Coding (Claude Code)'],
  },
  {
    category: 'GenAI Frameworks & Tools',
    items: ['LangGraph', 'LangChain', 'LangChain Deep Agents', 'Pydantic', 'LiteLLM', 'vLLM', 'Ollama', 'Langfuse', 'Ragas', 'Docling', 'Hugging Face', 'Transformers', 'PyTorch', 'TensorFlow', 'Scikit-Learn'],
  },
  {
    category: 'Backend & Platform',
    items: ['Python', 'FastAPI', 'Flask', 'Node.js', 'asyncio', 'REST APIs', 'Event-driven Microservices', 'RabbitMQ', 'PostgreSQL', 'MongoDB', 'Redis', 'Keycloak', 'Docker', 'Kubernetes', 'OpenShift'],
  },
  {
    category: 'Cloud & Data Engineering',
    items: ['AWS (SageMaker, Lambda, S3, EC2)', 'GCP (Vertex AI, BigQuery, Dataflow)', 'Azure', 'Databricks', 'Apache Spark', 'Airflow', 'ETL Pipelines', 'Vector DBs (Elasticsearch, PgVector)', 'CI/CD (GitLab, Jenkins)'],
  },
  {
    category: 'Frontend',
    items: ['React', 'TypeScript', 'Real-time Streaming UI', 'Tailwind CSS', 'Streamlit'],
  },
  {
    category: 'Languages',
    items: ['Python', 'C/C++', 'JavaScript', 'Java', 'SQL', 'Bash', 'MATLAB'],
  },
];

// ── Certifications ───────────────────────────────────────────────────────────
export type Certification = {
  title: string;
  issuer: string;
  date: string; // e.g. "Jul 2023"
  // Public credential / verification URL. Set to "" to hide the button.
  credentialUrl: string;
  // Full blurb shown in the expandable detail panel.
  description: string;
  // Issuer logo inside /public (SVG/PNG). Omit to fall back to a monogram chip.
  logo?: string;
};

export const certifications: Certification[] = [
  {
    title: 'Certified Scrum Product Owner® (CSPO)',
    issuer: 'Scrum Alliance',
    date: 'Sep 2026',
    credentialUrl: '',
    logo: '/logos/scrum_alliance_logo.jpg',
    description:
      'Certified in the Product Owner role — owning the product vision, building and ordering the product backlog, and maximising value delivered by the Scrum Team each sprint.',
  },
  {
    title: 'Software Design Patterns',
    issuer: 'NUS-ISS',
    date: 'Dec 2025',
    credentialUrl: '',
    logo: '/logos/nus-iss.png',
    description:
      'Applied object-oriented design patterns — creational, structural, and behavioral — to build maintainable, extensible software architectures.',
  },
  {
    title: 'Software Analysis & Design',
    issuer: 'NUS-ISS',
    date: 'Oct 2025',
    credentialUrl: '',
    logo: '/logos/nus-iss.png',
    description:
      'Modeled software systems using object-oriented analysis and design techniques, translating requirements into UML models and robust architectures.',
  },
  {
    title: 'Certified ScrumMaster® (CSM)',
    issuer: 'Scrum Alliance',
    date: 'Feb 2025',
    credentialUrl: '',
    logo: '/logos/scrum_alliance_logo.jpg',
    description:
      'Certified in Scrum framework fundamentals, agile values, and the ScrumMaster role facilitating teams, sprints, and continuous delivery.',
  },
  {
    title: 'AWS Certified Cloud Practitioner',
    issuer: 'Amazon Web Services (AWS)',
    date: 'Nov 2024 · Expires Dec 2027',
    credentialUrl: '',
    logo: '/logos/aws-logo.jpg',
    description:
      'Validated foundational understanding of AWS Cloud concepts, services, security, architecture, pricing, and support. Credential ID 2ee83a9742874b8e9d008f03d5ea35fe.',
  },
  {
    title: 'Building RAG Agents with LLMs',
    issuer: 'NVIDIA',
    date: 'Sep 2024',
    credentialUrl: '',
    logo: '/logos/Nvidia_logo.svg.png',
    description:
      'Built retrieval-augmented generation agents with large language models — vector stores, retrieval pipelines, and agentic orchestration for scalable LLM applications. Credential ID j2Df5LzUQ5SHZbV4YqnMKg.',
  },
  {
    title: 'Deep Learning Specialization',
    issuer: 'DeepLearning.AI',
    date: 'Jul 2023',
    credentialUrl: 'https://coursera.org/share/0e4ee9a1ba4d434ad565c2eaf2c5c2f4',
    logo: '/logos/deeplearningai.png',
    description:
      'Built neural network architectures such as Convolutional Neural Networks, Recurrent Neural Networks, LSTMs, and Transformers, and learned to improve them with strategies like Dropout, BatchNorm, and Xavier/He initialization. Mastered these concepts and their industry applications using Python and TensorFlow, tackling real-world cases such as speech recognition, music synthesis, chatbots, machine translation, and natural language processing.',
  },
  {
    title: 'Sequence Models',
    issuer: 'DeepLearning.AI',
    date: 'Jul 2023',
    credentialUrl: 'https://coursera.org/share/a002bbde0c776b58191c7b5bb097de21',
    logo: '/logos/deeplearningai.png',
    description:
      'The fifth course of the Deep Learning Specialization: building and training Recurrent Neural Networks (RNNs) and variants such as GRUs and LSTMs; applying RNNs to character-level language modeling; gaining experience with NLP and word embeddings; and using HuggingFace tokenizers and transformer models to solve NLP tasks such as NER and Question Answering.',
  },
  {
    title:
      'Improving Deep Neural Networks: Hyperparameter Tuning, Regularization and Optimization',
    issuer: 'DeepLearning.AI',
    date: 'May 2023',
    credentialUrl:
      'https://www.coursera.org/account/accomplishments/certificate/D7VTDA49KV6A',
    logo: '/logos/deeplearningai.png',
    description:
      'The second course of the Deep Learning Specialization: best practices to train and develop test sets and analyze bias/variance; standard techniques such as initialization, L2 and dropout regularization, hyperparameter tuning, batch normalization, and gradient checking; and a variety of optimization algorithms — mini-batch gradient descent, Momentum, RMSprop and Adam — implemented in TensorFlow.',
  },
  {
    title: 'Convolutional Neural Networks',
    issuer: 'DeepLearning.AI',
    date: 'Aug 2022',
    credentialUrl:
      'https://www.coursera.org/account/accomplishments/certificate/CMNX7Q6757TP',
    logo: '/logos/deeplearningai.png',
    description:
      'Build convolutional neural networks, including recent variations such as residual networks; apply convolutional networks to visual detection and recognition tasks; and use neural style transfer to generate art and apply these algorithms to image, video, and other 2D/3D data.',
  },
  {
    title: 'Structuring Machine Learning Projects',
    issuer: 'DeepLearning.AI',
    date: 'Aug 2022',
    credentialUrl: 'https://coursera.org/share/0d69dde397164f5d06bd1a461453fc3a',
    logo: '/logos/deeplearningai.png',
    description:
      'Learn how to build a successful machine learning project and practice decision-making as a machine learning project leader.',
  },
  {
    title: 'Neural Networks and Deep Learning',
    issuer: 'DeepLearning.AI',
    date: 'Jul 2022',
    credentialUrl:
      'https://www.coursera.org/account/accomplishments/verify/5ULX7M8V8SAK',
    logo: '/logos/deeplearningai.png',
    description:
      'Build, train, and apply fully connected deep neural networks; implement efficient (vectorized) neural networks; identify key parameters in a neural network’s architecture; and apply deep learning to applications.',
  },
  {
    title: 'Managing Big Data with MySQL',
    issuer: 'Coursera',
    date: 'Jan 2022',
    credentialUrl: 'https://coursera.org/share/c8080b0dbc12a0cfac2ca9ea209a013f',
    logo: '/logos/coursera.png',
    description:
      'Introduction to using relational databases and entity-relationship diagrams in business analysis.',
  },
  {
    title: 'Pandas for Data Science',
    issuer: 'Coursera',
    date: 'Aug 2021',
    credentialUrl: 'https://coursera.org/share/2681fa58d135ecc4519a293a10e674d5',
    logo: '/logos/coursera.png',
    description:
      'Introduction to using the Pandas library for data manipulation, transformation, cleaning, querying, and imputation in Data Science.',
  },
  {
    title: 'Certified SolidWorks Professional in Mechanical Design (CSWP-MD)',
    issuer: 'Dassault Systèmes',
    date: 'May 2021',
    credentialUrl: 'https://cv.virtualtester.com/qr/?b=SLDWRKS&i=C-V8FB9JTUAD',
    logo: '/logos/solidworks.png',
    description:
      'A Certified SOLIDWORKS Professional has successfully passed the advanced skills examination, proving the ability to design and analyze parametric parts and moveable assemblies using a variety of complex features in SOLIDWORKS software.',
  },
  {
    title: 'Data Science on Google Cloud',
    issuer: 'Google Cloud – Qwiklabs',
    date: 'Jun 2020',
    credentialUrl:
      'https://google-run.qwiklabs.com/public_profiles/63c622a7-724f-4a30-bd92-0d22df30c2f8',
    logo: '/logos/data-science-gcp.png',
    description:
      'Hands-on labs derived from the book Data Science on Google Cloud Platform by Valliappa Lakshmanan, covering ingestion, preparation, processing, querying, exploring, and visualizing data sets using Google Cloud tools and services.',
  },
  {
    title: 'Data Science on Google Cloud: Machine Learning',
    issuer: 'Google Cloud – Qwiklabs',
    date: 'Jun 2020',
    credentialUrl:
      'https://google-run.qwiklabs.com/public_profiles/63c622a7-724f-4a30-bd92-0d22df30c2f8',
    logo: '/logos/data-science-gcp-ml.png',
    description:
      'Hands-on labs derived from the book Data Science on Google Cloud Platform by Valliappa Lakshmanan, running full-fledged machine learning jobs with state-of-the-art tools and real-world data sets, all using Google Cloud tools and services.',
  },
  {
    title: 'BigQuery for Machine Learning',
    issuer: 'Google Cloud – Qwiklabs',
    date: 'Jun 2020',
    credentialUrl:
      'https://google-run.qwiklabs.com/public_profiles/63c622a7-724f-4a30-bd92-0d22df30c2f8',
    logo: '/logos/bigquery.png',
    description:
      'Build ML models in minutes instead of hours using just SQL. BigQuery ML democratizes machine learning by letting data analysts create, train, evaluate, and predict with models using existing SQL tools and skills. Experiment with different model types and learn what makes a good model.',
  },
  {
    title: 'Intro to ML: Image Processing on GCP',
    issuer: 'Google Cloud – Qwiklabs',
    date: 'Jun 2020',
    credentialUrl:
      'https://google-run.qwiklabs.com/public_profiles/63c622a7-724f-4a30-bd92-0d22df30c2f8',
    logo: '/logos/intro-to-ml.png',
    description:
      'Hands-on practice with Google Cloud Platform machine learning APIs applied to image processing — labeling images, detecting faces and landmarks, and extracting, analyzing, and translating text from within images.',
  },
  {
    title: 'Google Cloud Essentials',
    issuer: 'Google Cloud – Qwiklabs',
    date: 'Jun 2020',
    credentialUrl:
      'https://google.qwiklabs.com/public_profiles/63c622a7-724f-4a30-bd92-0d22df30c2f8',
    logo: '/logos/google-cloud-essentials.png',
    description:
      'Hands-on practice with Google Cloud’s fundamental tools and services — from writing Cloud Shell commands and deploying a first virtual machine, to running applications on Kubernetes Engine or with load balancing.',
  },
  {
    title: 'Building Chatbots in Python',
    issuer: 'DataCamp',
    date: 'May 2020',
    credentialUrl:
      'https://www.datacamp.com/statement-of-accomplishment/course/e1b85318dbc141640a70f98c5124e173bd32ff79',
    logo: '/logos/datacamp.png',
    description:
      'Learn the fundamentals of building conversational bots using rule-based systems as well as machine learning.',
  },
  {
    title: 'Accounting Fundamentals',
    issuer: 'Corporate Finance Institute (CFI)',
    date: 'Jun 2019',
    credentialUrl: 'https://www.credential.net/13129205',
    logo: '/logos/cfi.png',
    description:
      'Explore the layout of the balance sheet, income statement, and cash flow statement, and demonstrate how to prepare financial statements from scratch.',
  },
  {
    title: 'Excel Fundamentals — Formulas for Finance',
    issuer: 'Corporate Finance Institute (CFI)',
    date: 'Jun 2019',
    // TODO: source HTML was truncated — add the real credential URL.
    credentialUrl: '',
    logo: '/logos/cfi.png',
    description:
      'Master the essential Excel formulas and functions used in financial analysis and modeling.',
  },
];

// ── Awards ───────────────────────────────────────────────────────────────────
export type Award = {
  title: string;
  issuer: string;
  date: string; // e.g. "Jun 2023"
  // Full blurb shown in the expandable detail panel.
  description: string;
  // Issuer logo inside /public (SVG/PNG). Omit to fall back to a monogram chip.
  logo?: string;
};

export const awards: Award[] = [
  {
    title: 'DSO Leadership Development Programme',
    issuer: 'DSO National Laboratories',
    // TODO: confirm selection date.
    date: '2026',
    logo: '/logos/dso.jpg',
    description:
      'Selected for DSO\'s Leadership Development Programme — a management fast-track for the top 5% of eligible engineers.',
  },
  {
    title: 'Group Performance Award (3×)',
    issuer: 'DSO National Laboratories',
    // TODO: confirm award dates.
    date: '2024 – 2026',
    logo: '/logos/dso.jpg',
    description:
      'Awarded three times for delivering organization-wide AI chatbot products — from concept to production — used across DSO.',
  },
  {
    title: '1st Place, AI/ML — Anaconda Data Science Expo 2023',
    issuer: 'Anaconda, Inc.',
    date: 'Sep 2023',
    logo: '/logos/anaconda.png',
    description:
      'The Anaconda Data Science Expo is Anaconda, Inc.’s flagship hackathon supported by AI Singapore. Teams build a project on an AI/ML or Visualization theme that solves a real problem. Won 1st place in the AI/ML category.',
  },
  {
    title:
      'NUS Outstanding Undergraduate Researcher Prize (Best Undergraduate Researcher, Individual)',
    issuer: 'National University of Singapore',
    date: 'Jun 2023',
    logo: '/logos/nus-logo.png',
    description:
      'The OURP is an annual university-wide research competition recognising the best undergraduate researchers in NUS. Projects are judged on originality and significance, understanding of the subject, evidence of critical and independent thinking, and other points of merit.',
  },
  {
    title: 'USP President’s Honour Roll',
    issuer: 'NUS University Scholars Programme (USP)',
    date: 'Jun 2023',
    logo: '/logos/nus-usp.png',
    description:
      'Recognises excellence in intellectual and leadership qualities among USP graduates: outstanding academic accomplishment (first-class honours from the home faculty) and significant involvement in student-led co-curricular activities.',
  },
  {
    title: 'NUS CDE Innovation & Research Award (IRA) 2023 — High Achievement Award',
    issuer: 'National University of Singapore',
    date: 'May 2023',
    logo: '/logos/nus-logo.png',
    description:
      'The IRA is an annual Faculty-level competition encouraging undergraduate research at NUS. Awarded research projects are evaluated on originality, significance and clarity; critical and independent thinking; and impact on scientific practice and real-world application.',
  },
  {
    title: 'USP Senior Honour Roll',
    issuer: 'NUS University Scholars Programme (USP)',
    date: 'Apr 2023',
    logo: '/logos/nus-usp.png',
    description:
      'Recognises excellence in intellectual and leadership qualities among USP students: meritorious academic performance; active engagement in USP beyond-the-classroom learning; and significant contributions to the USP community.',
  },
  {
    title: 'IMDA Singapore Digital (SG:D) Scholarship',
    issuer: 'Infocomm Media Development Authority (IMDA)',
    date: 'Aug 2022',
    logo: '/logos/imda-logo.png',
    description:
      'An industry scholarship empowering students pursuing tech- or media-related undergraduate studies with a wealth of opportunities.',
  },
  {
    title: '1st Place, Best MVP — DSTA BrainHack CODE_EXP Hackathon',
    issuer: 'Defence Science and Technology Agency (DSTA)',
    date: 'Jul 2022',
    logo: '/logos/dsta.png',
    description:
      'The DSTA BrainHack CODE_EXP hackathon involves building mobile apps using cloud technologies to solve real-world problems. Emerged as overall winner (university/polytechnic category) among 70 teams.',
  },
  {
    title: 'USP Honour Roll',
    issuer: 'NUS University Scholars Programme (USP)',
    date: 'Oct 2021',
    logo: '/logos/nus-usp.png',
    description:
      'Recognises excellence in intellectual and leadership qualities among USP students: meritorious academic performance; active engagement in USP beyond-the-classroom learning; and significant contributions to the USP community.',
  },
  {
    title: 'NUS Dean’s List (AY20/21 Sem 2)',
    issuer: 'NUS Faculty of Engineering',
    date: 'Jun 2021',
    logo: '/logos/nus-logo.png',
    description:
      'Undergraduates ranked within the top 5% of their cohort are placed on the Dean’s List in recognition of outstanding academic achievement.',
  },
  {
    title: 'NUS USP Scholarship: The Jixun & Serene Scholarship AY20/21',
    issuer: 'NUS University Scholars Programme (USP)',
    date: 'Jul 2020',
    logo: '/logos/nus-usp.png',
    description:
      'Awarded to exemplary USP undergraduates who show strong interest and ability to contribute to USP, leadership qualities and potential, good co-curricular records, and outstanding academic qualifications.',
  },
  {
    title: 'Char Yong Dabu Scholarship Award AY19/20',
    issuer: 'Char Yong Dabu Association',
    date: 'May 2020',
    logo: '/logos/char-yong-dabu.jpg',
    description: 'Awarded to undergraduates with outstanding academic results.',
  },
  {
    title: 'Winner, Best Pitch by Audience Choice — NUS InnoVenture 2020',
    issuer: 'NUS Institute for Engineering Leadership (IEL)',
    date: 'Apr 2020',
    logo: '/logos/nus-logo.png',
    description:
      'Joint NUS-Grab project: ideate and pitch an interdisciplinary solution to increase Personal Mobility Device (PMD) safety in the SEA region.',
  },
  {
    title:
      'The Lee Hsien Loong Outstanding All-Round Achievement Award (LHL-OAA) nominee',
    issuer: 'Ministry of Education (MOE)',
    date: 'Jan 2017',
    logo: '/logos/moe-logo.png',
    description:
      'Nominated and shortlisted for the LHL-OAA, MOE’s national-level Special Award recognising outstanding academic and non-academic achievements of post-secondary students. Four awards given each year, one from each of: Junior Colleges/Millennia Institute, ITE, polytechnics, and universities.',
  },
  {
    title: 'Distinction for Leadership — College Award',
    issuer: 'Jurong Junior College',
    date: 'Jul 2016',
    logo: '/logos/jjc.png',
    description: 'College award recognising distinction in leadership.',
  },
  {
    title: 'Interact Award of Merit',
    issuer: 'Rotary Club of Jurong Town',
    date: 'Jul 2016',
    logo: '/logos/rotary-club.png',
    description: 'Awarded for outstanding leadership and service to the community.',
  },
];

// ── About / bio ──────────────────────────────────────────────────────────────
export const about = {
  // Each string is a paragraph.
  bio: [
    'I’m Ng Zhili, a Lead Solutions Architect and Full-Stack Software Engineer specializing in Generative AI. Over the past 3+ years I’ve designed and scaled a production GenAIOps platform adopted by 20 teams, shipped 4 GenAI products serving 2000+ users, and led teams of 20+ engineers and analysts.',
    'I build multilingual, multimodal RAG and citation systems, agentic full-stack applications, and the runtime, observability, and evaluation infrastructure behind them — taking products from business requirements all the way to production deployment.',
    'I hold a First-Class BEng in Mechanical Engineering (Robotics) with a Computer Science minor and completed the University Scholars Programme (USP) from NUS. Outside of work, I enjoy running, swimming, and hiking.',
  ],
  // Quick stat highlights shown beside the bio.
  stats: [
    { label: 'Years in GenAI', value: '3+' },
    { label: 'Production users served', value: '2000+' },
    { label: 'Engineers and Analysts led', value: '20+' },
  ],
} as const;
