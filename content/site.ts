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
  // A punchy one-liner tagline for the hero.
  tagline: 'I design and scale production GenAI systems — agents, RAG, and the platforms behind them.',
  // The longer intro paragraph in the hero.
  intro:
    'Lead Solutions Architect and Full-Stack Software Engineer with 5+ years in Generative AI, full-stack web, and backend development. I build production GenAIOps pipelines, multilingual multimodal RAG with citations, and agentic applications — from business requirements to deployment at scale.',
  // Default Open Graph / social share image (lives in /public).
  // NOTE: this ships as an SVG placeholder. For best social-preview support,
  // replace it with a 1200×630 PNG/JPG and update the path (e.g. '/og-image.png').
  ogImage: '/og-image.svg',
  // Your location (optional — shown in About).
  location: 'Singapore',
} as const;

// ── Social / contact links ───────────────────────────────────────────────────
// Set `href` to your real URLs. Leave the email as a bare address (no mailto:);
// the contact section adds `mailto:` for you.
export const socials = {
  email: 'ng.zhili@gmail.com',
  github: 'https://github.com/ngzhili',
  linkedin: 'https://www.linkedin.com/in/ngzhili',
  website: 'https://ngzhili.github.io/portfolio/',
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
      'Chief architect of an organization-wide, end-to-end GenAIOps framework that accelerated development and deployment of GenAI models and multi-agent systems into production products.',
    highlights: [
      'Architected the full agentic stack — frameworks, runtime, harness, UI-Agent-Tool communication, model inference, observability, evaluation, sandboxing, memory, skills, and knowledge retrieval.',
      'Designed full-stack AI chatbot platforms with real-time streaming agent steps, tool execution, state sync, and Human-in-the-Loop workflows.',
      'Built adaptive RAG, self-reflection pipelines, and multi-turn reasoning/memory; scaled multilingual, multimodal retrieval over millions of files with citation-backed responses.',
      'Engineered CI/CD for AI apps and on-prem GPU/HPC inference microservices with autoscaling and monitoring. Awarded 3× Group Performance Award.',
    ],
  },
  {
    role: 'Regional Business Intelligence Analyst',
    company: 'Shopee, SEA Limited',
    logo: '/logos/shopee.jpg',
    period: 'Aug 2023 — Feb 2024',
    location: 'Singapore',
    description:
      'Led a team of 5 analysts building scalable regional data marts that powered FP&A analytics across 11 countries.',
    highlights: [
      'Architected CI/CD and Git workflows for PySpark pipelines across dev/staging/prod.',
      'Built internal tooling for automated Apache Airflow deployment, backfills, and workflow versioning.',
    ],
  },
  {
    role: 'Data Scientist Intern',
    company: 'Procter & Gamble',
    logo: '/logos/pg.png',
    period: 'May 2022 — Jul 2022',
    location: 'Singapore',
    description:
      'Built a scalable retail shelf-optimization analytics dashboard (Python, Pandas, Spark SQL) deployed via KNIME across 65 brands and 15 markets in the AMA region, increasing product value share by 20%.',
    highlights: [
      'Debugged Pandas pipelines to ensure data integrity, increasing insight accuracy by 30%.',
      'Wrote Apache Spark SQL on Azure Databricks, saving 50+ analysts time on EDA.',
    ],
  },
  {
    role: 'Data Scientist',
    company: 'CARRO',
    logo: '/logos/carro.png',
    period: 'Jan 2022 — May 2022',
    location: 'Singapore',
    description:
      'Designed an ETL data pipeline for an APAC team of 10 data scientists, reducing manual workload by 60%.',
    highlights: [
      'Built a PyTorch Detectron2 pixel-wise verification pipeline to flag annotation errors, cutting label verification cost/time by 50%.',
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
      'Evaluated the top 5 SOTA scene-segmentation models on real-time ground/aerial autonomous-vehicle video using Python, PyTorch, OpenCV, and OpenMMLab — saving 15 ML engineers time on model selection.',
  },
  {
    role: 'Data Scientist Intern',
    company: 'CARRO',
    logo: '/logos/carro.png',
    period: 'May 2021 — Dec 2021',
    location: 'Singapore',
    description:
      'Led a computer-vision team of 5 to deploy an AI car-damage detection tool across 5 countries.',
    highlights: [
      'Built a Keras-based ETL pipeline (AWS Lambda + SageMaker) filtering 100K+ images, cutting prep time by 70%.',
      'Trained TensorFlow YOLO detectors (70% AP) and OpenCV/OCR license-plate recognition (CER 10%).',
    ],
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
    category: 'AI / ML Systems',
    items: ['LLMs', 'RAG', 'Agentic Workflows', 'Multimodal AI', 'Evaluation', 'Fine-tuning', 'Synthetic Data', 'Model Inference & Optimization', 'Observability'],
  },
  {
    category: 'GenAI Frameworks & Tools',
    items: ['LangGraph', 'LangChain', 'Pydantic', 'vLLM', 'Ollama', 'Hugging Face', 'Transformers', 'PyTorch', 'TensorFlow', 'Scikit-Learn'],
  },
  {
    category: 'Backend & Platform',
    items: ['Python', 'FastAPI', 'Flask', 'Node.js', 'REST APIs', 'Microservices', 'PostgreSQL', 'MongoDB', 'Redis', 'Docker', 'Kubernetes', 'RabbitMQ'],
  },
  {
    category: 'Cloud & Data Engineering',
    items: ['AWS (SageMaker, Lambda, S3, EC2)', 'GCP (Vertex AI, BigQuery, Dataflow)', 'Azure', 'Databricks', 'Apache Spark', 'Airflow', 'ETL Pipelines', 'Vector DBs (Elasticsearch, PgVector)'],
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
    'I’m Ng Zhili, a Lead Solutions Architect and Full-Stack Software Engineer specializing in Generative AI. Over the past 5+ years I’ve designed and scaled production GenAIOps pipelines serving 2000+ users and led teams of 20+ engineers and analysts.',
    'I build multilingual, multimodal RAG and citation systems, agentic full-stack applications, and the runtime, observability, and evaluation infrastructure behind them — taking products from business requirements all the way to production deployment.',
    'I hold a First-Class BEng in Mechanical Engineering (Robotics) with a Computer Science minor from NUS, where I was on the Dean’s List, named NUS Outstanding Undergraduate Researcher (Individual), and received the NUS CDE Innovation & Research Award (High Achievement). Outside of work, I enjoy running, swimming, and hiking.',
  ],
  // Quick stat highlights shown beside the bio.
  stats: [
    { label: 'Years in GenAI', value: '5+' },
    { label: 'Production users served', value: '2000+' },
    { label: 'Engineers and Analysts led', value: '20+' },
  ],
} as const;
