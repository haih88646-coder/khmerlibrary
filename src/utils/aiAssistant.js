import { supabase } from '../supabase/config';
import { searchBooks } from '../supabase/books';
import { getCategories } from '../supabase/categories';
import { getSiteSettings } from '../supabase/siteSettings';

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';
const OPENROUTER_MODELS_URL = 'https://openrouter.ai/api/v1/models';

// Preferred chat models (verified live on OpenRouter). The list is refreshed
// automatically from the /models API; these are only used as fallbacks.
const PREFERRED_MODELS = [
  'nvidia/nemotron-3-ultra-550b-a55b:free',
  'z-ai/glm-5.2:free',
  'google/gemma-4-31b-it:free',
  'openai/gpt-oss-20b:free',
];

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

const findRelevantBooks = async (message) => {
  const found = new Map();
  const add = (books) => (books || []).forEach((b) => { if (!found.has(b.id)) found.set(b.id, b); });

  try {
    add(await searchBooks(message, 8).catch(() => []));
    if (found.size < 4) {
      for (const word of extractKeywords(message)) {
        if (found.size >= 8) break;
        add(await searchBooks(word, 5).catch(() => []));
      }
    }
    if (found.size === 0) {
      const { data } = await supabase
        .from('books')
        .select('*')
        .eq('isPublished', true)
        .order('views', { ascending: false })
        .limit(8);
      add(data);
    }
  } catch {
    // ignore search errors – the model will just answer without book context
  }

  return [...found.values()].slice(0, 8).map((b) => ({
    id: b.id,
    title_km: b.title_km,
    title_en: b.title_en,
    authorName: b.authorName,
    fileType: b.fileType,
    publicationYear: b.publicationYear,
    description_km: (b.description_km || '').slice(0, 250),
    description_en: (b.description_en || '').slice(0, 250),
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
- ONLY recommend books from AVAILABLE_BOOKS below. Never invent books. When mentioning a book, format it exactly as [Title](/book/ID) so it becomes a clickable link.
- If no book matches, say so honestly and suggest browsing the library or trying different keywords.
- Library categories available: ${categories.map((c) => c.name_en || c.name_km).filter(Boolean).join(', ') || 'unknown'}.
- Contact info: ${settings.contact_email || ''} ${settings.contact_website || ''}.
- Keep answers short and friendly (under 150 words). Use bullet lists when recommending multiple books.`;
};

export const sendAssistantMessage = async (history) => {
  const apiKey = import.meta.env.VITE_OPENROUTER_API_KEY;
  if (!apiKey) throw Object.assign(new Error('missing-key'), { code: 'missing-key' });

  const lastUser = [...history].reverse().find((m) => m.role === 'user');
  const books = await findRelevantBooks(lastUser?.content || '');
  const system = await buildSystemPrompt();
  const systemPrompt = `${system}\n\nAVAILABLE_BOOKS (id | title_km | title_en | author | year):\n${
    books.map((b) => `- ${b.id} | ${b.title_km || '-'} | ${b.title_en || '-'} | ${b.authorName || '-'} | ${b.publicationYear || '-'}`).join('\n')
  }`;

  const messages = [
    { role: 'system', content: systemPrompt },
    ...history.slice(-10),
  ];

  const candidates = (await buildCandidates()).slice(0, 5);
  let lastError = new Error('failed');
  for (const model of candidates) {
    try {
      const res = await fetch(OPENROUTER_URL, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': window.location.origin,
          'X-Title': 'Khmer Digital Library',
        },
        body: JSON.stringify({ model, messages, temperature: 0.6, max_tokens: 1000 }),
      });
      if (!res.ok) {
        let body = '';
        try { body = (await res.text()).slice(0, 200); } catch { /* ignore */ }
        console.warn(`[AI] model "${model}" failed (${res.status}):`, body);
        lastError = new Error(`http-${res.status}`);
        continue;
      }
      const data = await res.json();
      const content = data.choices?.[0]?.message?.content;
      if (!content) {
        console.warn(`[AI] model "${model}" returned empty content, trying next`);
        lastError = new Error('empty-response');
        continue;
      }
      return content.trim();
    } catch (err) {
      lastError = err;
    }
  }
  throw lastError;
};
