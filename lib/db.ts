import { GoogleGenAI } from '@google/genai';
import bcrypt from 'bcryptjs';

export interface UserAccount {
  username: string;
  password?: string; // Plain-text or hashed
  botToken?: string;
  webhookEnabled?: boolean;
  defaultFormat?: 'media' | 'file' | 'audio';
  downloadsCount?: number;
  createdAt?: string;
  chatbotEnabled?: boolean;
  chatbotType?: 'ai' | 'custom' | 'hybrid';
  chatbotPrompt?: string;
  customAutoReplies?: Array<{ keyword: string; reply: string }>;
  telegramOwnerId?: string;
  telegramUsers?: string[];
}

// In-Memory Fallback Store if JSONBin is not configured
let inMemoryUsers: UserAccount[] = [
  {
    username: 'admin',
    password: 'password123',
    botToken: '',
    webhookEnabled: false,
    defaultFormat: 'media',
    downloadsCount: 0,
    chatbotEnabled: true,
    chatbotType: 'ai',
    chatbotPrompt: '',
    customAutoReplies: [
      { keyword: 'halo', reply: 'Halo juga! Ada yang bisa dibantu? Kirimkan saja link sosmed untuk saya download!' },
      { keyword: 'price', reply: 'Bot Chonix Bot ini 100% gratis digunakan tanpa biaya apapun!' }
    ],
    createdAt: new Date().toISOString(),
  }
];

// URL hash cache to bypass Telegram callback query 64-byte limitation
// Fast path: in-memory Map (instant on VPS, works within a single warm instance on serverless)
// Slow path fallback: JSONBin, so lookups still succeed even if a Vercel
// serverless request lands on a different/cold instance than the one that cached the URL.
const globalUrlCache = new Map<string, { url: string; ts: number }>();
const URL_CACHE_TTL_MS = 1000 * 60 * 60; // 1 hour, callback buttons don't need to live longer

export function cacheUrl(url: string): string {
  // Generate an 8-character unique hash
  const hash = Math.random().toString(36).substring(2, 10);
  globalUrlCache.set(hash, { url, ts: Date.now() });

  // Persist to JSONBin in the background so other serverless instances can
  // resolve this hash too. Fire-and-forget: callers rely on the in-memory
  // fast path first and only need this for cross-instance recovery.
  if (apiKey && binId) {
    persistUrlCacheEntry(hash, url).catch((err) =>
      console.error('Gagal menyimpan url cache ke JSONBin:', err)
    );
  }

  return hash;
}

export async function getCachedUrl(hash: string): Promise<string | null> {
  const local = globalUrlCache.get(hash);
  if (local) return local.url;

  // Not found locally (e.g. cold start on a different serverless instance).
  // Fall back to JSONBin if configured.
  if (!apiKey || !binId) return null;

  try {
    const record = await fetchRecordFromJSONBin();
    const entry = record.urlCache?.[hash];
    if (entry && Date.now() - entry.ts < URL_CACHE_TTL_MS) {
      globalUrlCache.set(hash, entry);
      return entry.url;
    }
    return null;
  } catch (error) {
    console.error('Gagal mengambil url cache dari JSONBin:', error);
    return null;
  }
}

// JSONBin helpers
const apiKey = process.env.JSONBIN_API_KEY;
const binId = process.env.JSONBIN_BIN_ID;

interface JSONBinRecord {
  users: UserAccount[];
  urlCache: Record<string, { url: string; ts: number }>;
}

async function fetchRecordFromJSONBin(): Promise<JSONBinRecord> {
  const res = await fetch(`https://api.jsonbin.io/v3/b/${binId}/latest`, {
    headers: { 'X-Master-Key': apiKey as string },
  });

  if (!res.ok) {
    throw new Error(`JSONBin fetch failed with status ${res.status}`);
  }

  const data = await res.json();
  return {
    users: Array.isArray(data?.record?.users) ? data.record.users : inMemoryUsers,
    urlCache: data?.record?.urlCache && typeof data.record.urlCache === 'object' ? data.record.urlCache : {},
  };
}

async function saveRecordToJSONBin(record: JSONBinRecord): Promise<boolean> {
  const res = await fetch(`https://api.jsonbin.io/v3/b/${binId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'X-Master-Key': apiKey as string,
    },
    body: JSON.stringify(record),
  });
  return res.ok;
}

// Persist a single URL cache entry without clobbering the users list.
// Also prunes expired entries so the bin doesn't grow unbounded.
async function persistUrlCacheEntry(hash: string, url: string): Promise<void> {
  if (!apiKey || !binId) return;

  const record = await fetchRecordFromJSONBin().catch(() => ({ users: inMemoryUsers, urlCache: {} as JSONBinRecord['urlCache'] }));
  const now = Date.now();

  const prunedCache: JSONBinRecord['urlCache'] = {};
  for (const [key, entry] of Object.entries(record.urlCache)) {
    if (now - entry.ts < URL_CACHE_TTL_MS) prunedCache[key] = entry;
  }
  prunedCache[hash] = { url, ts: now };

  await saveRecordToJSONBin({ users: record.users, urlCache: prunedCache });
}

async function fetchFromJSONBin(): Promise<UserAccount[]> {
  if (!apiKey || !binId) {
    return inMemoryUsers;
  }

  try {
    const record = await fetchRecordFromJSONBin();
    inMemoryUsers = record.users;
    return inMemoryUsers;
  } catch (error) {
    console.error('Error fetching from JSONBin:', error);
    return inMemoryUsers;
  }
}

async function saveToJSONBin(users: UserAccount[]): Promise<boolean> {
  inMemoryUsers = users;
  if (!apiKey || !binId) {
    return true;
  }

  try {
    // Preserve the existing urlCache instead of overwriting it with an empty one.
    const existing = await fetchRecordFromJSONBin().catch(() => ({ users, urlCache: {} as JSONBinRecord['urlCache'] }));
    return await saveRecordToJSONBin({ users, urlCache: existing.urlCache });
  } catch (error) {
    console.error('Error saving to JSONBin:', error);
    return false;
  }
}

// Database Actions
export async function getUsers(): Promise<UserAccount[]> {
  return await fetchFromJSONBin();
}

export async function findUser(username: string): Promise<UserAccount | null> {
  const users = await getUsers();
  return users.find(u => u.username.toLowerCase() === username.toLowerCase()) || null;
}

export async function registerUser(user: UserAccount): Promise<{ success: boolean; error?: string }> {
  const users = await getUsers();
  const exists = users.some(u => u.username.toLowerCase() === user.username.toLowerCase());
  
  if (exists) {
    return { success: false, error: 'Username sudah digunakan oleh pendaftar lain.' };
  }

  const newUser: UserAccount = {
    ...user,
    password: await bcrypt.hash(user.password as string, 10),
    defaultFormat: user.defaultFormat || 'media',
    downloadsCount: 0,
    chatbotEnabled: true,
    chatbotType: 'ai',
    chatbotPrompt: '',
    customAutoReplies: [
      { keyword: 'halo', reply: 'Halo juga! Ada yang bisa dibantu? Kirimkan saja link sosmed untuk saya download!' },
      { keyword: 'harga', reply: 'Layanan ini gratis tis tis!' }
    ],
    createdAt: new Date().toISOString(),
  };

  users.push(newUser);
  const ok = await saveToJSONBin(users);
  return { success: ok };
}

export async function updateUser(username: string, updates: Partial<UserAccount>): Promise<boolean> {
  const users = await getUsers();
  const index = users.findIndex(u => u.username.toLowerCase() === username.toLowerCase());
  
  if (index === -1) return false;

  users[index] = {
    ...users[index],
    ...updates,
  };

  return await saveToJSONBin(users);
}

export async function getUserByToken(token: string): Promise<UserAccount | null> {
  const users = await getUsers();
  return users.find(u => u.botToken === token) || null;
}

// Compares a plaintext password against the stored (hashed) one.
// Falls back to a plain-text comparison for any pre-existing accounts
// created before hashing was introduced, so old data isn't locked out.
export async function verifyPassword(plainPassword: string, storedPassword?: string): Promise<boolean> {
  if (!storedPassword) return false;
  if (storedPassword.startsWith('$2a$') || storedPassword.startsWith('$2b$')) {
    return bcrypt.compare(plainPassword, storedPassword);
  }
  return plainPassword === storedPassword;
}
