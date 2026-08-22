import { supabase } from '../supabase/config';
import { searchBooks } from '../supabase/books';
import { getCategories } from '../supabase/categories';
import { getSiteSettings } from '../supabase/siteSettings';
import { getBloomKhmerBooks } from './bloomApi';
import { searchElibraryBooks } from './elibraryApi';

// Both AI providers are called through same-origin serverless proxies
// (/api/openrouter/*, /api/nvidia/*) so the API keys stay on the server
// (Vercel Edge Functions in production, vite dev proxy locally).
const OPENROUTER_URL = '/api/openrouter/chat/completions';
const OPENROUTER_MODELS_URL = '/api/openrouter/models';
const NVIDIA_URL = '/api/nvidia/v1/chat/completions';

// Preferred chat models (verified live on OpenRouter). The list is refreshed
// automatically from the /models API; these are only used as fallbacks.
const PREFERRED_MODELS = [
  'nvidia/nemotron-3-ultra-550b-a55b:free',
  'z-ai/glm-5.2:free',
  'google/gemma-4-31b-it:free',
  'openai/gpt-oss-20b:free',
];

// NVIDIA NIM models available for live selection in the admin dashboard.
export const NVIDIA_MODELS = [
  'mistralai/mistral-nemotron',
  'openai/gpt-oss-20b',
];

// Provider registry consumed by the admin dashboard as well.
export const AI_PROVIDERS = [
  { id: '', label: 'Auto', models: [] },
  { id: 'openrouter', label: 'OpenRouter', models: PREFERRED_MODELS },
  { id: 'nvidia', label: 'NVIDIA NIM', models: NVIDIA_MODELS },
];

const buildRequest = ({ provider, model }, messages) => ({
  url: provider === 'nvidia' ? NVIDIA_URL : OPENROUTER_URL,
  options: {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model, messages, temperature: 0.6, max_tokens: 1000 }),
  },
});

// skip classifier / code-only / preview endpoints – not useful for chat
const EXCLUDE_PATTERN = /content-safety|guard|moderation|embed|rerank|preview/i;

let cachedFreeModels = null;

const getFreeModels = async () => {
  if (cachedFreeModels) return cachedFreeModels;
  try {
    const res = await fetch(OPENROUTER_MODELS_URL);
    if (res.ok) {
      const json = await res.json();
      const ids = (json.data || [])
        .filter((m) => typeof m.id === 'string' && m.id.endsWith(':free'))
        .filter((m) => !m.pricing || Number(m.pricing.prompt) === 0)
        .map((m) => m.id)
        .filter((id) => !EXCLUDE_PATTERN.test(id));
      if (ids.length) cachedFreeModels = ids;
    }
  } catch {
    // offline or blocked – fall back to the hardcoded list
  }
  return cachedFreeModels || [];
};

const buildCandidates = async () => {
  const live = await getFreeModels();
  const preferred = PREFERRED_MODELS.filter((id) => !live.length || live.includes(id));
  const rest = shuffle(live.filter((id) => !preferred.includes(id))).slice(0, 6);
  const fallbacks = ['openrouter/free', ...PREFERRED_MODELS];
  const seen = new Set();
  return [...shuffle(preferred), ...rest, ...fallbacks].filter((id) => {
    if (seen.has(id)) return false;
    seen.add(id);
    return true;
  });
};

const STOP_WORDS = new Set([
  'the', 'a', 'an', 'is', 'are', 'am', 'do', 'does', 'did', 'how', 'what', 'when',
  'where', 'which', 'who', 'why', 'can', 'could', 'you', 'your', 'me', 'my', 'i',
  'to', 'of', 'for', 'in', 'on', 'at', 'and', 'or', 'please', 'help', 'find',
  'book', 'books', 'any', 'some', 'with', 'about', 'give', 'want', 'need',
  'recommend', 'suggest', 'show', 'tell', 'look', 'get', 'have', 'has', 'it',
  'this', 'that', 'there', 'here', 'from', 'be', 'was', 'were', 'will', 'would',
]);

const shuffle = (arr) => [...arr].sort(() => Math.random() - 0.5);

const extractKeywords = (text) => {
  return (text || '')
    .toLowerCase()
    .replace(/[?!.,;:"'()[\]។៕៖]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length >= 3 && !STOP_WORDS.has(w))
    .slice(0, 5);
};

// Words that hint at a language/region request rather than a title keyword
const KHMER_HINTS = ['khmer', 'ខ្មែរ', 'cambodia', 'cambodian'];

const scoreExternalBook = (b, keywords) => {
  const hay = [b.title_km, b.title_en, b.authorName, (b.tags || []).join(' '), b.description_km]
    .filter(Boolean).join(' ').toLowerCase();
  return keywords.reduce((n, k) => n + (hay.includes(k) ? 1 : 0), 0);
};

const sourceOf = (id) => {
  const s = String(id);
  if (s.startsWith('bloom:')) return 'Bloom Library';
  if (s.startsWith('elc:')) return 'eLibrary of Cambodia';
  if (s.startsWith('ia:')) return 'Archive.org';
  return 'library collection';
};

const findRelevantBooks = async (message) => {
  const lower = (message || '').toLowerCase();
  const wantsKhmer = KHMER_HINTS.some((h) => lower.includes(h));
  const keywords = extractKeywords(message).filter((w) => !KHMER_HINTS.includes(w));

  const found = new Map();
  const add = (books) => (books || []).forEach((b) => { if (b && !found.has(b.id)) found.set(b.id, b); });

  // 1) Our own Supabase catalog
  const searchLocal = async () => {
    const local = [];
    try {
      local.push(...(await searchBooks(message, 8).catch(() => [])));
      if (local.length < 4 && keywords.length) {
        for (const word of keywords) {
          if (local.length >= 8) break;
          local.push(...(await searchBooks(word, 5).catch(() => [])));
        }
      }
      if (local.length === 0) {
        const { data } = await supabase
          .from('books')
          .select('*')
          .eq('isPublished', true)
          .order('views', { ascending: false })
          .limit(6);
        local.push(...(data || []));
      }
    } catch { /* ignore */ }
    return local;
  };

  // 2) Khmer community books from Bloom Library (cached list)
  const searchBloom = async () => {
    try {
      const all = await getBloomKhmerBooks();
      if (!all?.length) return [];
      let list = [];
      if (keywords.length) {
        list = all
          .map((b) => ({ b, score: scoreExternalBook(b, keywords) }))
          .filter((x) => x.score > 0)
          .sort((x, y) => y.score - x.score || (y.b.downloads || 0) - (x.b.downloads || 0))
          .map((x) => x.b);
      }
      if (!list.length) {
        // No keyword hit – fall back to popular/newest so general requests
        // like "recommend a khmer book" always get real suggestions.
        list = [...all].sort((a, z) =>
          (wantsKhmer ? (z.downloads || 0) - (a.downloads || 0) : (z.views || 0) - (a.views || 0)));
      }
      return list.slice(0, 8);
    } catch { return []; }
  };

  // 3) eLibrary of Cambodia (WordPress API)
  const searchElibrary = async () => {
    if (!keywords.length) return [];
    try {
      const res = await searchElibraryBooks(keywords[0], 1, 4);
      return res.books || [];
    } catch { return []; }
  };

  const results = await Promise.allSettled([searchLocal(), searchBloom(), searchElibrary()]);
  results.forEach((r) => { if (r.status === 'fulfilled') add(r.value); });

  // A request explicitly about Khmer books should always include some.
  if (wantsKhmer && ![...found.values()].some((b) => String(b.id).startsWith('bloom:'))) {
    try { add((await getBloomKhmerBooks()).slice(0, 6)); } catch { /* ignore */ }
  }

  return [...found.values()].slice(0, 12).map((b) => ({
    id: b.id,
    source: sourceOf(b.id),
    title_km: b.title_km,
    title_en: b.title_en,
    authorName: b.authorName,
    fileType: b.fileType,
    publicationYear: b.publicationYear,
    description_km: (b.description_km || '').slice(0, 200),
    description_en: (b.description_en || '').slice(0, 200),
  }));
};

const buildSystemPrompt = async () => {
  const [categories, settings] = await Promise.all([
    getCategories().catch(() => []),
    getSiteSettings().catch(() => ({})),
  ]);

  return `You are "Khmer Library AI Assistant", the friendly assistant embedded in the "${settings.name_en || 'Khmer Digital Library'}" website.
Your job:
- Help users search for books and documents.
- Recommend books based on the user's interests.
- Summarize information about books.
- Help users find available resources.
- Answer general questions about how to use the library (browsing, favorites, reading online, downloading requires signing in).

Rules:
- Reply in the SAME language the user writes in: Khmer (ភាសាខ្មែរ) or English. If the message mixes both, reply in Khmer.
- ONLY recommend books from AVAILABLE_BOOKS below. Never invent books. When mentioning a book, format it exactly as [Title](/book/ID), copying ID character-for-character from the list INCLUDING its prefix (e.g. bloom:abc123 → /book/bloom:abc123).
- The catalog combines our own library collection with free Khmer books from Bloom Library (SIL Global), eLibrary of Cambodia, and Archive.org. Every AVAILABLE_BOOKS entry is real, available on this website right now, and its /book/ID link works.
- When a user asks generally for recommendations (e.g. "recommend a khmer book", "any good books?", "something for kids"), pick suitable titles from AVAILABLE_BOOKS instead of saying you found nothing.
- If truly nothing in AVAILABLE_BOOKS matches a SPECIFIC request (a title/topic with zero related entries), say so honestly and suggest browsing or different keywords.
- Library categories available: ${categories.map((c) => c.name_en || c.name_km).filter(Boolean).join(', ') || 'unknown'}.
- Contact info: ${settings.contact_email || ''} ${settings.contact_website || ''}.
- Keep answers short and friendly (under 150 words). Use bullet lists when recommending multiple books.`;
};

export const sendAssistantMessage = async (history) => {
  const lastUser = [...history].reverse().find((m) => m.role === 'user');
  const books = await findRelevantBooks(lastUser?.content || '');
  const system = await buildSystemPrompt();
  const systemPrompt = `${system}\n\nAVAILABLE_BOOKS (id | source | title_km | title_en | author | year | description):\n${
    books.map((b) =>
      `- ${b.id} | ${b.source} | ${b.title_km || '-'} | ${b.title_en || '-'} | ${b.authorName || '-'} | ${b.publicationYear || '-'} | ${(b.description_en || b.description_km || '').replace(/\s+/g, ' ').slice(0, 160) || '-'}`,
    ).join('\n')
  }`;

  const messages = [
    { role: 'system', content: systemPrompt },
    ...history.slice(-10),
  ];

  // The admin-selected provider/model (stored in site settings) is always
  // tried first; the remaining candidates act as automatic fallbacks so the
  // chat keeps working if a provider is down.
  const { ai_provider: selectedProvider = '', ai_model: selectedModel = '' } =
    await getSiteSettings().catch(() => ({}));

  const attempts = [];
  const push = (provider, model) => {
    if (!attempts.some((a) => a.provider === provider && a.model === model)) {
      attempts.push({ provider, model });
    }
  };

  const openRouterCandidates = (await buildCandidates()).slice(0, 5);
  if (selectedProvider === 'openrouter') {
    if (selectedModel) push('openrouter', selectedModel);
    openRouterCandidates.forEach((m) => push('openrouter', m));
    NVIDIA_MODELS.forEach((m) => push('nvidia', m));
  } else if (selectedProvider === 'nvidia') {
    if (selectedModel) push('nvidia', selectedModel);
    NVIDIA_MODELS.forEach((m) => push('nvidia', m));
    openRouterCandidates.forEach((m) => push('openrouter', m));
  } else {
    openRouterCandidates.forEach((m) => push('openrouter', m));
    NVIDIA_MODELS.forEach((m) => push('nvidia', m));
  }

  if (attempts.length === 0) {
    throw Object.assign(new Error('missing-key'), { code: 'missing-key' });
  }

  let lastError = new Error('failed');
  let serverNotConfigured = false;
  for (const attempt of attempts) {
    try {
      const { url, options } = buildRequest(attempt, messages);
      const res = await fetch(url, options);
      if (!res.ok) {
        let body = '';
        try { body = (await res.text()).slice(0, 200); } catch { /* ignore */ }
        if (body.includes('not-configured')) serverNotConfigured = true;
        console.warn(`[AI] ${attempt.provider} model "${attempt.model}" failed (${res.status}):`, body);
        lastError = new Error(`http-${res.status}`);
        continue;
      }
      const data = await res.json();
      const msg = data.choices?.[0]?.message || {};
      // Reasoning models (e.g. mistral-nemotron) may put the visible answer in
      // reasoning_content or wrap it in <think>…</think> inside content.
      const raw = String(msg.content || '').trim() ? msg.content : (msg.reasoning_content || '');
      const cleaned = String(raw).replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
      if (!cleaned) {
        console.warn(`[AI] ${attempt.provider} model "${attempt.model}" returned empty content, trying next`);
        lastError = new Error('empty-response');
        continue;
      }
      return cleaned;
    } catch (err) {
      lastError = err;
    }
  }
  if (serverNotConfigured) {
    throw Object.assign(new Error('missing-key'), { code: 'missing-key' });
  }
  throw lastError;
};
