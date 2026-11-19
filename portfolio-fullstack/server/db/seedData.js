// Initial content, taken from the original portfolio website.
const GH = 'https://github.com/niranjansureshm-lab';

const roles = [
  { name: 'admin', description: 'Full access, including user management' },
  { name: 'editor', description: 'Can manage portfolio content and read messages' },
  { name: 'viewer', description: 'Read-only access to the admin dashboard' },
];

const permissions = [
  'dashboard:read',
  'projects:read', 'projects:write',
  'skills:read', 'skills:write',
  'experiences:read', 'experiences:write',
  'certifications:read', 'certifications:write',
  'messages:read', 'messages:manage',
  'users:read', 'users:manage',
];

const rolePermissions = {
  admin: permissions,
  editor: [
    'dashboard:read',
    'projects:read', 'projects:write',
    'skills:read', 'skills:write',
    'experiences:read', 'experiences:write',
    'certifications:read', 'certifications:write',
    'messages:read', 'messages:manage',
  ],
  viewer: [
    'dashboard:read',
    'projects:read', 'skills:read', 'experiences:read',
    'certifications:read', 'messages:read',
  ],
};

const projects = [
  {
    slug: 'careerai', name: 'CareerAI', category: 'AI + Full Stack', filter_tags: ['AI', 'Full Stack'], icon: 'Briefcase',
    description: 'An AI-powered placement preparation platform designed to help students prepare for careers through personalized career tools, resume analysis, skill-gap identification, mock interviews and job opportunities.',
    tech: ['React', 'Node.js', 'PostgreSQL', 'AI'], github_url: GH,
    detail: {
      problem: 'Students often lack structured, personalised guidance when preparing for placements.',
      solution: 'A unified AI-powered platform that analyses resumes, identifies skill gaps, generates mock interviews and surfaces job opportunities.',
      features: ['AI resume analysis and feedback', 'Skill-gap identification', 'Mock interview practice', 'Personalised career tools', 'Curated job opportunities'],
      contribution: 'Designed and built the full-stack application, integrated AI-powered features and developed the responsive frontend.',
    },
  },
  {
    slug: 'fallguard', name: 'FallGuard AI', category: 'AI + Safety', filter_tags: ['AI'], icon: 'ShieldAlert',
    description: 'An AI-based human fall and accident detection concept designed to detect critical events and trigger appropriate emergency alerts.',
    tech: ['AI', 'Computer Vision', 'React', 'Node.js'], github_url: GH,
    detail: {
      problem: 'Elderly and at-risk individuals may suffer falls without timely help.',
      solution: 'A computer-vision based system that detects falls and accidents in real time and triggers emergency alerts.',
      features: ['Real-time fall detection', 'Accident event recognition', 'Automated emergency alerts', 'Dashboard for monitoring'],
      contribution: 'Worked on the AI detection pipeline, alert logic and the React-based monitoring interface.',
    },
  },
  {
    slug: 'study-assistant', name: 'AI Study Assistant', category: 'Generative AI', filter_tags: ['AI', 'Web'], icon: 'GraduationCap',
    description: 'An AI-powered study assistant concept designed to help students learn, organize information and prepare more effectively.',
    tech: ['AI', 'Python', 'Web'], github_url: GH,
    detail: {
      problem: 'Students struggle to organise large volumes of study material.',
      solution: 'A generative-AI powered assistant that summarises, organises and helps students learn more effectively.',
      features: ['AI-powered summarisation', 'Study material organisation', 'Concept explanations', 'Preparation assistance'],
      contribution: 'Built the AI workflow and the web-based interface for interacting with study material.',
    },
  },
  {
    slug: 'secure-docs', name: 'Secure Digital Document Management', category: 'Smart India Hackathon', filter_tags: ['Full Stack', 'Hackathon', 'Web'], icon: 'Lock',
    description: 'A secure digital document management concept for legal and investigation documents using role-based access, cryptographic verification and decentralized storage concepts.',
    tech: ['React', 'Node.js', 'Blockchain', 'IPFS'], github_url: GH,
    detail: {
      problem: 'Legal and investigation documents require tamper-proof storage.',
      solution: 'A secure document management concept combining role-based access, cryptographic verification and decentralised storage.',
      features: ['Role-based access control', 'Cryptographic document verification', 'Decentralised storage via IPFS concepts', 'Audit-friendly document trail'],
      contribution: 'Contributed to the system design, frontend and integration of secure storage concepts.',
    },
  },
];

const skillGroups = [
  ['Languages', 'Code2', [
    ['Python', 'Scripting, AI/ML and backend logic.', 90],
    ['Java', 'Object-oriented programming and DSA.', 75],
    ['JavaScript', 'Modern web and full-stack development.', 85],
  ]],
  ['Frontend', 'Monitor', [
    ['HTML', 'Semantic, accessible markup.', 95],
    ['CSS', 'Responsive layouts and modern UI.', 88],
    ['React', 'Component-driven interactive UIs.', 85],
  ]],
  ['Backend', 'Server', [
    ['Node.js', 'Scalable server-side JavaScript.', 80],
    ['Express.js', 'REST APIs and web services.', 78],
  ]],
  ['Database', 'Database', [
    ['PostgreSQL', 'Relational data modelling.', 75],
    ['MongoDB', 'Flexible NoSQL document storage.', 78],
  ]],
  ['AI / Data', 'Brain', [
    ['Artificial Intelligence', 'Intelligent system design.', 80],
    ['Machine Learning', 'Model training and evaluation.', 75],
    ['Generative AI', 'LLMs and AI-powered workflows.', 78],
  ]],
  ['Tools', 'Wrench', [
    ['Git', 'Version control and collaboration.', 88],
    ['GitHub', 'Code hosting and CI workflows.', 88],
    ['VS Code', 'Primary development environment.', 95],
  ]],
];

const experiences = [
  {
    role: 'Full Stack Development Intern', company: 'Thiranex', duration: 'July 2026 – August 2026',
    description: 'Worked on full-stack development and gained practical experience in building modern web applications.',
    highlights: [
      { label: 'Frontend development', icon: 'Monitor' },
      { label: 'Backend development', icon: 'Server' },
      { label: 'API integration', icon: 'Plug' },
      { label: 'Team collaboration', icon: 'Users' },
    ],
  },
];

const certifications = [
  { name: 'Python', provider: 'NPTEL', year: '2024', icon: 'FileCode' },
  { name: 'Generative AI', provider: 'Coursera', year: '2024', icon: 'Sparkles' },
  { name: 'Responsive Web Design', provider: 'freeCodeCamp', year: '2023', icon: 'MonitorSmartphone' },
  { name: 'Other Certifications', provider: 'Various', year: '—', icon: 'Award' },
];

module.exports = { roles, permissions, rolePermissions, projects, skillGroups, experiences, certifications };
