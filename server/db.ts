import fs from 'fs';
import path from 'path';

export interface User {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  role: 'user' | 'admin';
  credits: number;
  subscription_plan: 'free' | 'creator' | 'pro';
  avatar?: string;
  created_at: string;
}

export interface Song {
  id: string;
  user_id: string;
  title: string;
  prompt: string;
  style: string;
  mood: string;
  language: string;
  tempo: number; // BPM
  vocal_style: string;
  duration: number; // in seconds
  audio_url: string;
  cover_url: string;
  lyrics: string;
  provider: 'lyria-3-clip' | 'lyria-3-pro' | 'gemini-tts' | 'elevenlabs' | 'sk-synth';
  model?: string;
  status: 'ready' | 'generating' | 'failed';
  created_at: string;
}

export interface GenerationJob {
  id: string;
  user_id: string;
  song_id?: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  progress: number;
  step_description: string;
  error?: string;
  provider: string;
  model: string;
  created_at: string;
  updated_at: string;
}

export interface CreditRecord {
  id: string;
  user_id: string;
  balance: number;
  bonus: number;
  updated_at: string;
}

export interface Transaction {
  id: string;
  user_id: string;
  amount: number;
  credits: number;
  type: 'trial' | 'purchase' | 'generation' | 'admin_grant' | 'refund';
  description: string;
  status: 'completed' | 'pending' | 'failed';
  created_at: string;
}

export interface Subscription {
  id: string;
  user_id: string;
  plan_id: 'free' | 'creator' | 'pro';
  plan_name: string;
  status: 'active' | 'cancelled' | 'expired';
  renews_at: string;
  created_at: string;
}

export interface ApiUsage {
  id: string;
  user_id: string;
  provider: string;
  model: string;
  duration_seconds: number;
  cost_credits: number;
  status: 'success' | 'failed';
  created_at: string;
}

export interface AdminAuditLog {
  id: string;
  admin_id: string;
  action: string;
  details: string;
  timestamp: string;
}

export interface AdminConfig {
  active_provider: 'lyria-3-clip' | 'lyria-3-pro' | 'elevenlabs' | 'gemini-tts' | 'sk-synth';
  elevenlabs_api_key?: string;
  fallback_enabled: boolean;
  cost_per_clip: number; // default 5 credits
  cost_per_full: number; // default 10 credits
  admin_password_hash?: string;
}

export interface DatabaseSchema {
  users: User[];
  songs: Song[];
  generation_jobs: GenerationJob[];
  credits: CreditRecord[];
  transactions: Transaction[];
  subscriptions: Subscription[];
  api_usage: ApiUsage[];
  admin_audit_logs: AdminAuditLog[];
  admin_config: AdminConfig;
}

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.resolve(DATA_DIR, 'database.json');
const AUDIO_DIR = path.resolve(DATA_DIR, 'audio');

// Ensure storage directories exist
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
if (!fs.existsSync(AUDIO_DIR)) {
  fs.mkdirSync(AUDIO_DIR, { recursive: true });
}

const INITIAL_DB: DatabaseSchema = {
  users: [
    {
      id: 'demo-user-1',
      name: 'Demo Artist',
      email: 'artist@sk-ai.studio',
      phone: '+91 98765 43210',
      role: 'user',
      credits: 60,
      subscription_plan: 'creator',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      created_at: new Date(Date.now() - 86400000 * 5).toISOString(),
    },
    {
      id: 'admin-user-1',
      name: 'SK AI Admin',
      email: 'admin@sk-ai.studio',
      role: 'admin',
      credits: 9999,
      subscription_plan: 'pro',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
      created_at: new Date(Date.now() - 86400000 * 30).toISOString(),
    },
  ],
  songs: [],
  generation_jobs: [],
  credits: [
    {
      id: 'credit-1',
      user_id: 'demo-user-1',
      balance: 60,
      bonus: 10,
      updated_at: new Date().toISOString(),
    },
    {
      id: 'credit-admin',
      user_id: 'admin-user-1',
      balance: 9999,
      bonus: 0,
      updated_at: new Date().toISOString(),
    },
  ],
  transactions: [
    {
      id: 'tx-welcome-1',
      user_id: 'demo-user-1',
      amount: 0,
      credits: 50,
      type: 'trial',
      description: 'Welcome bonus trial credits',
      status: 'completed',
      created_at: new Date(Date.now() - 86400000 * 5).toISOString(),
    },
    {
      id: 'tx-sub-1',
      user_id: 'demo-user-1',
      amount: 9.99,
      credits: 20,
      type: 'purchase',
      description: 'Creator Pass subscription monthly boost',
      status: 'completed',
      created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
    },
  ],
  subscriptions: [
    {
      id: 'sub-1',
      user_id: 'demo-user-1',
      plan_id: 'creator',
      plan_name: 'Creator Pass',
      status: 'active',
      renews_at: new Date(Date.now() + 86400000 * 25).toISOString(),
      created_at: new Date(Date.now() - 86400000 * 5).toISOString(),
    },
  ],
  api_usage: [],
  admin_audit_logs: [
    {
      id: 'log-1',
      admin_id: 'admin-user-1',
      action: 'SYSTEM_BOOT',
      details: 'SK AI Studio engine initialized with multi-provider architecture.',
      timestamp: new Date().toISOString(),
    },
  ],
  admin_config: {
    active_provider: 'lyria-3-clip',
    elevenlabs_api_key: process.env.ELEVENLABS_API_KEY || '',
    fallback_enabled: true,
    cost_per_clip: 5,
    cost_per_full: 10,
  },
};

class DatabaseManager {
  private data: DatabaseSchema;

  constructor() {
    this.data = this.load();
  }

  private load(): DatabaseSchema {
    try {
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        return {
          ...INITIAL_DB,
          ...parsed,
          admin_config: {
            ...INITIAL_DB.admin_config,
            ...(parsed.admin_config || {}),
          },
        };
      }
    } catch (e) {
      console.error('Failed to read database file, initializing fresh store:', e);
    }
    this.save(INITIAL_DB);
    return INITIAL_DB;
  }

  private save(data?: DatabaseSchema) {
    try {
      const payload = data || this.data;
      fs.writeFileSync(DB_FILE, JSON.stringify(payload, null, 2), 'utf-8');
    } catch (e) {
      console.error('Failed to persist database:', e);
    }
  }

  // Users
  getUser(id: string): User | undefined {
    return this.data.users.find((u) => u.id === id);
  }

  getUserByEmail(email: string): User | undefined {
    return this.data.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
  }

  getUserByPhone(phone: string): User | undefined {
    return this.data.users.find((u) => u.phone === phone);
  }

  upsertUser(user: Partial<User> & { id: string }): User {
    const idx = this.data.users.findIndex((u) => u.id === user.id);
    if (idx >= 0) {
      this.data.users[idx] = { ...this.data.users[idx], ...user };
      this.save();
      return this.data.users[idx];
    } else {
      const newUser: User = {
        id: user.id,
        name: user.name || 'Anonymous Producer',
        email: user.email,
        phone: user.phone,
        role: user.role || 'user',
        credits: user.credits !== undefined ? user.credits : 50,
        subscription_plan: user.subscription_plan || 'free',
        avatar: user.avatar || `https://api.dicebear.com/7.x/identicon/svg?seed=${user.id}`,
        created_at: user.created_at || new Date().toISOString(),
      };
      this.data.users.push(newUser);
      // Give initial credits record and welcome transaction
      this.data.credits.push({
        id: `cr-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        user_id: newUser.id,
        balance: newUser.credits,
        bonus: 0,
        updated_at: new Date().toISOString(),
      });
      this.data.transactions.push({
        id: `tx-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        user_id: newUser.id,
        amount: 0,
        credits: newUser.credits,
        type: 'trial',
        description: 'Welcome 50 free credits',
        status: 'completed',
        created_at: new Date().toISOString(),
      });
      this.save();
      return newUser;
    }
  }

  getAllUsers(): User[] {
    return this.data.users;
  }

  // Songs
  getSongs(userId?: string): Song[] {
    if (userId) {
      return this.data.songs.filter((s) => s.user_id === userId);
    }
    return this.data.songs;
  }

  getSong(id: string): Song | undefined {
    return this.data.songs.find((s) => s.id === id);
  }

  addSong(song: Song): Song {
    this.data.songs.unshift(song);
    this.save();
    return song;
  }

  updateSong(id: string, updates: Partial<Song>): Song | undefined {
    const idx = this.data.songs.findIndex((s) => s.id === id);
    if (idx >= 0) {
      this.data.songs[idx] = { ...this.data.songs[idx], ...updates };
      this.save();
      return this.data.songs[idx];
    }
    return undefined;
  }

  deleteSong(id: string, userId?: string): boolean {
    const initialLen = this.data.songs.length;
    this.data.songs = this.data.songs.filter((s) => {
      if (s.id === id) {
        if (userId && s.user_id !== userId) return true; // not allowed
        return false;
      }
      return true;
    });
    if (this.data.songs.length !== initialLen) {
      this.save();
      return true;
    }
    return false;
  }

  // Jobs
  getJob(id: string): GenerationJob | undefined {
    return this.data.generation_jobs.find((j) => j.id === id);
  }

  createJob(job: GenerationJob): GenerationJob {
    this.data.generation_jobs.unshift(job);
    this.save();
    return job;
  }

  updateJob(id: string, updates: Partial<GenerationJob>): GenerationJob | undefined {
    const idx = this.data.generation_jobs.findIndex((j) => j.id === id);
    if (idx >= 0) {
      this.data.generation_jobs[idx] = {
        ...this.data.generation_jobs[idx],
        ...updates,
        updated_at: new Date().toISOString(),
      };
      this.save();
      return this.data.generation_jobs[idx];
    }
    return undefined;
  }

  getAllJobs(): GenerationJob[] {
    return this.data.generation_jobs;
  }

  // Credits & Transactions
  deductCredits(userId: string, amount: number, description: string): boolean {
    const user = this.getUser(userId);
    if (!user || user.credits < amount) return false;

    user.credits -= amount;
    this.upsertUser(user);

    this.data.transactions.unshift({
      id: `tx-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      user_id: userId,
      amount: 0,
      credits: -amount,
      type: 'generation',
      description,
      status: 'completed',
      created_at: new Date().toISOString(),
    });
    this.save();
    return true;
  }

  addCredits(userId: string, credits: number, amountPaid: number, description: string): User | undefined {
    const user = this.getUser(userId);
    if (!user) return undefined;

    user.credits += credits;
    this.upsertUser(user);

    this.data.transactions.unshift({
      id: `tx-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      user_id: userId,
      amount: amountPaid,
      credits,
      type: 'purchase',
      description,
      status: 'completed',
      created_at: new Date().toISOString(),
    });
    this.save();
    return user;
  }

  getTransactions(userId?: string): Transaction[] {
    if (userId) {
      return this.data.transactions.filter((t) => t.user_id === userId);
    }
    return this.data.transactions;
  }

  // Api Usage
  logApiUsage(usage: Omit<ApiUsage, 'id' | 'created_at'>): ApiUsage {
    const entry: ApiUsage = {
      ...usage,
      id: `api-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      created_at: new Date().toISOString(),
    };
    this.data.api_usage.unshift(entry);
    this.save();
    return entry;
  }

  getApiUsage(): ApiUsage[] {
    return this.data.api_usage;
  }

  // Admin Logs & Config
  logAdminAction(adminId: string, action: string, details: string) {
    this.data.admin_audit_logs.unshift({
      id: `audit-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      admin_id: adminId,
      action,
      details,
      timestamp: new Date().toISOString(),
    });
    this.save();
  }

  getAdminLogs(): AdminAuditLog[] {
    return this.data.admin_audit_logs;
  }

  getAdminConfig(): AdminConfig {
    return this.data.admin_config;
  }

  updateAdminConfig(updates: Partial<AdminConfig>, adminId: string): AdminConfig {
    this.data.admin_config = {
      ...this.data.admin_config,
      ...updates,
    };
    this.logAdminAction(adminId, 'UPDATE_CONFIG', JSON.stringify(updates));
    this.save();
    return this.data.admin_config;
  }
}

export const db = new DatabaseManager();
