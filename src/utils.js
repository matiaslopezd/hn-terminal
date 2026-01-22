export const timeAgo = (timestamp) => {
  if (!timestamp) return '';
  const seconds = Math.floor((new Date() - timestamp * 1000) / 1000);
  let interval = seconds / 31536000;
  if (interval > 1) return Math.floor(interval) + "y";
  interval = seconds / 2592000;
  if (interval > 1) return Math.floor(interval) + "mo";
  interval = seconds / 86400;
  if (interval > 1) return Math.floor(interval) + "d";
  interval = seconds / 3600;
  if (interval > 1) return Math.floor(interval) + "h";
  interval = seconds / 60;
  if (interval > 1) return Math.floor(interval) + "m";
  return Math.floor(seconds) + "s";
};

export const CATEGORY_RULES = {
  DEV: [/rust/, /python/, /javascript/, /react/, /code/, /git/, /api/, /linux/, /compiler/, /framework/, /css/, /webassembly/, /node/, /golang/, /sql/, /database/],
  AI: [/llm/, /gpt/, /ai/, /model/, /inference/, /transformer/, /neural/, /machine learning/, /copilot/, /generative/, /llama/, /openai/, /anthropic/],
  SEC: [/security/, /vulnerability/, /hack/, /breach/, /malware/, /encryption/, /privacy/, /auth/, /cve/, /exploit/, /ssh/, /vpn/],
  SCI: [/science/, /physics/, /space/, /nasa/, /biology/, /energy/, /quantum/, /research/, /study/, /cancer/, /medicine/, /climate/],
  BIZ: [/startup/, /funding/, /vc/, /acquisition/, /market/, /ipo/, /revenue/, /saas/, /stripe/, /y combinator/, /economy/],
  SHOW: [/^show hn/],
  ASK: [/^ask hn/],
  POLL: [/^poll:/, /^poll/],
};

export const classifyStory = (title, type) => {
  if (type === 'poll') return 'POLL';
  if (!title) return 'GENERIC';
  const lowerTitle = title.toLowerCase();
  if (lowerTitle.startsWith('show hn')) return 'SHOW';
  if (lowerTitle.startsWith('ask hn')) return 'ASK';

  let maxScore = 0;
  let bestCategory = 'GENERIC';
  for (const [cat, regexes] of Object.entries(CATEGORY_RULES)) {
    if (cat === 'SHOW' || cat === 'ASK') continue;
    let score = 0;
    regexes.forEach(regex => { if (regex.test(lowerTitle)) score++; });
    if (score > maxScore) { maxScore = score; bestCategory = cat; }
  }
  return bestCategory;
};

export const handleContentClick = (e) => {
  const link = e.target.closest('a');
  if (link) {
    e.stopPropagation();
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
  }
};
