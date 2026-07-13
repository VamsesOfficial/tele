/* eslint-disable @next/next/no-img-element */
/* eslint-disable react-hooks/exhaustive-deps */
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  Bot, 
  Send, 
  Settings, 
  Key, 
  Globe, 
  RefreshCw, 
  FileText, 
  CheckCircle2, 
  XCircle, 
  Download, 
  Music, 
  Image as ImageIcon, 
  Video, 
  AlertTriangle, 
  ExternalLink, 
  HelpCircle,
  Copy,
  Check,
  User,
  Lock,
  UserPlus,
  LogIn,
  LogOut,
  Sparkles,
  Layers,
  HardDrive,
  Sun,
  Moon,
  Laptop,
  Plus,
  Trash2,
  Newspaper,
  Sliders,
  X,
  MessageSquare,
  Volume2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// Chonix Bot — iOS-style squircle app-icon mark
function ChonixBotLogo({ className = "w-10 h-10" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 100 100"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* iOS-style superellipse (squircle) app icon background */}
      <path
        d="M50 4C14 4 4 14 4 50s10 46 46 46 46-10 46-46S86 4 50 4Z"
        fill="url(#chonixBlueGrad)"
      />

      {/* Soft inner top highlight, iOS glass sheen */}
      <path
        d="M50 4C14 4 4 14 4 50c0-14 6-26 16-32 8-5 18-8 30-8 12 0 22 3 30 8 10 6 16 18 16 32C96 14 86 4 50 4Z"
        fill="white"
        opacity="0.08"
      />

      {/* Chat bubble */}
      <path
        d="M50 24c-14.4 0-26 10.1-26 22.6 0 7.3 4 13.8 10.3 17.9-.4 3-1.7 6.9-4.6 10.4a1 1 0 0 0 .9 1.6c5.4-.7 10-3 13.2-5.3 2 .3 4.1.5 6.2.5 14.4 0 26-10.1 26-22.6S64.4 24 50 24Z"
        fill="white"
      />

      {/* Spark / bolt mark inside bubble */}
      <path
        d="M53.5 34.5 40 51h8.4l-2.1 14.5L61 48h-8.6l1.1-13.5Z"
        fill="url(#chonixBoltGrad)"
      />

      <defs>
        <linearGradient id="chonixBlueGrad" x1="4" y1="4" x2="96" y2="96" gradientUnits="userSpaceOnUse">
          <stop stopColor="#5AC8FA" />
          <stop offset="0.5" stopColor="#0A84FF" />
          <stop offset="1" stopColor="#5E5CE6" />
        </linearGradient>
        <linearGradient id="chonixBoltGrad" x1="40" y1="34.5" x2="61" y2="65.5" gradientUnits="userSpaceOnUse">
          <stop stopColor="#0A84FF" />
          <stop offset="1" stopColor="#5E5CE6" />
        </linearGradient>
      </defs>
    </svg>
  );
}

// Types
interface UserSession {
  username: string;
  botToken: string;
  webhookEnabled: boolean;
  defaultFormat: 'media' | 'file' | 'audio';
  downloadsCount: number;
  chatbotEnabled?: boolean;
  chatbotType?: 'ai' | 'custom' | 'hybrid';
  chatbotPrompt?: string;
  customAutoReplies?: Array<{ keyword: string; reply: string }>;
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  timestamp: string;
  isLoading?: boolean;
  isOptionsPanel?: boolean;
  urlHash?: string;
  media?: {
    success: boolean;
    source: 'tiktok' | 'instagram' | 'other';
    title?: string;
    thumbnail?: string;
    author?: string;
    videoUrl?: string;
    audioUrl?: string;
    images?: string[];
    isSlideshow?: boolean;
    error?: string;
  };
}

interface LogEntry {
  id: string;
  time: string;
  type: 'info' | 'success' | 'error' | 'warning';
  message: string;
}

export default function Home() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setMounted(true);
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  // Auth States initialized from localStorage directly to avoid state setting inside useEffect
  const [currentUser, setCurrentUser] = useState<UserSession | null>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('user_session');
      if (saved) {
        try { return JSON.parse(saved); } catch { return null; }
      }
    }
    return null;
  });

  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [authUsername, setAuthUsername] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState('');
  const [authSuccess, setAuthSuccess] = useState('');

  // Floating Animated Toast Notification State
  const [notifications, setNotifications] = useState<Array<{
    id: string;
    type: 'info' | 'success' | 'error' | 'warning';
    message: string;
  }>>([]);

  // Config States
  const [botToken, setBotToken] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('user_session');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          return parsed.botToken || '';
        } catch { return ''; }
      }
    }
    return '';
  });

  const [telegramOwnerId, setTelegramOwnerId] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('user_session');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          return parsed.telegramOwnerId || '';
        } catch { return ''; }
      }
    }
    return '';
  });

  const [broadcastMessage, setBroadcastMessage] = useState<string>('');
  const [isBroadcasting, setIsBroadcasting] = useState<boolean>(false);

  const [defaultFormat, setDefaultFormat] = useState<'media' | 'file' | 'audio'>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('user_session');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          return parsed.defaultFormat || 'media';
        } catch { return 'media'; }
      }
    }
    return 'media';
  });
  const [isBotSaving, setIsBotSaving] = useState(false);
  const [botInfo, setBotInfo] = useState<any>(null);
  const [webhookInfo, setWebhookInfo] = useState<any>(null);
  const [isBotChecking, setIsBotChecking] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [botStatusLogs, setBotStatusLogs] = useState<LogEntry[]>([]);

  // Chatbot & Auto-Response states
  const [chatbotEnabled, setChatbotEnabled] = useState<boolean>(true);
  const [chatbotType, setChatbotType] = useState<'ai' | 'custom' | 'hybrid'>('ai');
  const [chatbotPrompt, setChatbotPrompt] = useState<string>('');
  const [customAutoReplies, setCustomAutoReplies] = useState<Array<{ keyword: string; reply: string }>>([]);
  const [newKeyword, setNewKeyword] = useState('');
  const [newReply, setNewReply] = useState('');
  const [isChatbotSaving, setIsChatbotSaving] = useState(false);

  // Breaking News States
  const [newsList, setNewsList] = useState<any[]>([]);
  const [newsLoading, setNewsLoading] = useState(false);
  const [newsError, setNewsError] = useState('');

  // Sync chatbot states when currentUser changes
  useEffect(() => {
    if (currentUser) {
      const timer = setTimeout(() => {
        setChatbotEnabled(currentUser.chatbotEnabled !== false);
        setChatbotType(currentUser.chatbotType || 'ai');
        setChatbotPrompt(currentUser.chatbotPrompt || '');
        setCustomAutoReplies(currentUser.customAutoReplies || []);
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [currentUser]);

  // Fetch breaking news on mount
  const fetchNews = async () => {
    setNewsLoading(true);
    setNewsError('');
    try {
      const res = await fetch('/api/news');
      const data = await res.json();
      if (data.success && data.news) {
        setNewsList(data.news);
      } else {
        setNewsError('Gagal memuat berita terkini.');
      }
    } catch {
      setNewsError('Kesalahan jaringan saat memuat berita.');
    } finally {
      setNewsLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchNews();
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  // Derived app URL to avoid synchronous setState inside useEffect
  const appUrl = typeof window !== 'undefined' ? window.location.origin : '';

  // Web Downloader States
  const [downloadInput, setDownloadInput] = useState('');
  const [downloadLoading, setDownloadLoading] = useState(false);
  const [downloadResult, setDownloadResult] = useState<any>(null);
  const [downloadError, setDownloadError] = useState('');
  const [selectedWebFormat, setSelectedWebFormat] = useState<'media' | 'file' | 'audio'>('media');

  // Dark / Light Mode Theme State
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('theme');
      if (saved === 'light' || saved === 'dark') return saved;
    }
    return 'dark'; // Default is dark theme
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('theme', theme);
    }
  }, [theme]);

  // Telegram Simulator States
  const [simMessages, setSimMessages] = useState<ChatMessage[]>(() => [
    {
      id: 'start-1',
      sender: 'bot',
      text: '👋 *Halo! Selamat datang di Simulator Telegram!*\n\nSaya adalah bot otomatis *Chonix Bot* bertenaga AI Gemini.\n\nKirimkan saya tautan media dari *TikTok*, *Instagram*, *YouTube*, *Twitter/X*, atau *Facebook*. Saya akan mengunduhnya untuk Anda tanpa watermark!\n\n💡 _Ketik \`/menu\` atau \`/help\` untuk melihat daftar lengkap perintah yang saya dukung!_',
      timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
    }
  ]);
  const [simInput, setSimInput] = useState('');
  const [isBotTyping, setIsBotTyping] = useState(false);
  
  // App navigation tab - default to 'downloader' (Web Extractor) so guests can access instantly
  const [activeTab, setActiveTab] = useState<'manager' | 'simulator' | 'downloader'>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('user_session');
      if (saved) return 'manager';
    }
    return 'downloader';
  });

  const chatEndRef = useRef<HTMLDivElement>(null);

  const getFormattedTime = () => {
    return new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
  };

  const addLog = (type: LogEntry['type'], message: string) => {
    const id = Math.random().toString(36).substring(7);
    const newLog: LogEntry = {
      id,
      time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      type,
      message,
    };
    setBotStatusLogs(prev => [newLog, ...prev.slice(0, 40)]);

    // Skip silent/initial messages to avoid spamming the user on page load
    const isSilenced = message.includes('Selamat datang kembali') || message.includes('Silakan masuk atau mendaftar') || message.includes('aktif: @');
    if (!isSilenced) {
      setNotifications(prev => {
        const updated = [...prev, { id, type, message }];
        if (updated.length > 4) {
          return updated.slice(updated.length - 4);
        }
        return updated;
      });

      setTimeout(() => {
        setNotifications(prev => prev.filter(n => n.id !== id));
      }, 4500);
    }
  };

  const checkBotStatus = async (tokenToCheck: string) => {
    if (!tokenToCheck) return;
    setIsBotChecking(true);
    try {
      const meRes = await fetch(`https://api.telegram.org/bot${tokenToCheck}/getMe`);
      let meJson: any;
      try {
        meJson = await meRes.json();
      } catch {
        throw new Error('Respons dari Telegram API tidak valid (bukan JSON).');
      }

      if (meJson.ok) {
        setBotInfo(meJson.result);
        addLog('success', `Bot telegram aktif: @${meJson.result.username}`);

        const whRes = await fetch(`https://api.telegram.org/bot${tokenToCheck}/getWebhookInfo`);
        let whJson: any;
        try {
          whJson = await whRes.json();
        } catch {
          whJson = { ok: false };
        }
        if (whJson.ok) {
          setWebhookInfo(whJson.result);
        }
      } else {
        setBotInfo(null);
        setWebhookInfo(null);
        addLog('error', `Token bot salah atau kedaluwarsa: ${meJson.description}`);
      }
    } catch (err: any) {
      addLog('error', `Koneksi API Telegram gagal: ${err.message}`);
    } finally {
      setIsBotChecking(false);
    }
  };

  // Initialize
  useEffect(() => {
    // Log greeting and trigger bot check if user already logged in via initializer
    const savedSession = localStorage.getItem('user_session');
    if (savedSession) {
      try {
        const parsed = JSON.parse(savedSession);
        setTimeout(() => {
          addLog('info', `Selamat datang kembali, ${parsed.username}!`);
          if (parsed.botToken) {
            checkBotStatus(parsed.botToken);
          }
        }, 0);
      } catch {
        localStorage.removeItem('user_session');
      }
    } else {
      setTimeout(() => {
        addLog('info', 'Silakan masuk atau mendaftar untuk mengonfigurasi bot pribadi Anda.');
      }, 0);
    }
  }, []);

  // Sync scroll on chat change
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [simMessages, isBotTyping]);

  // ---------------------------------------------------------------------------
  // AUTHENTICATION LOGIC (Login & Register)
  // ---------------------------------------------------------------------------
  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authUsername.trim() || !authPassword.trim()) return;

    setAuthLoading(true);
    setAuthError('');
    setAuthSuccess('');

    const endpoint = authMode === 'login' ? '/api/auth/login' : '/api/auth/register';
    addLog('info', `Mencoba ${authMode === 'login' ? 'masuk' : 'mendaftar'} sebagai ${authUsername}...`);

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: authUsername.trim(), password: authPassword.trim() }),
      });

      let data: any;
      try {
        data = await res.json();
      } catch {
        throw new Error('Gagal memproses data server. Respons server bukan format JSON.');
      }

      if (data.success) {
        if (authMode === 'login') {
          setCurrentUser(data.user);
          setBotToken(data.user.botToken || '');
          setTelegramOwnerId(data.user.telegramOwnerId || '');
          setDefaultFormat(data.user.defaultFormat || 'media');
          localStorage.setItem('user_session', JSON.stringify(data.user));
          addLog('success', `Berhasil masuk! Selamat datang ${data.user.username}.`);
          if (data.user.botToken) {
            checkBotStatus(data.user.botToken);
          }
        } else {
          setAuthSuccess('Pendaftaran berhasil! Silakan masuk dengan akun baru Anda.');
          setAuthMode('login');
          addLog('success', `Akun baru "${authUsername}" berhasil didaftarkan ke JSONBin database.`);
        }
        setAuthPassword('');
      } else {
        setAuthError(data.error || 'Terjadi kesalahan sistem.');
        addLog('error', `Gagal autentikasi: ${data.error}`);
      }
    } catch (err: any) {
      setAuthError('Gagal menghubungi server.');
      addLog('error', `Kesalahan koneksi auth: ${err.message}`);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('user_session');
    setCurrentUser(null);
    setBotToken('');
    setBotInfo(null);
    setWebhookInfo(null);
    addLog('warning', 'Sesi login telah diakhiri.');
  };

  // ---------------------------------------------------------------------------
  // CHATBOT & AUTO-RESPONSE ACTIONS
  // ---------------------------------------------------------------------------
  const [chatbotStatusMsg, setChatbotStatusMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const saveChatbotSettings = async () => {
    if (!currentUser) return;
    setIsChatbotSaving(true);
    setChatbotStatusMsg(null);
    addLog('info', 'Menyimpan konfigurasi chatbot dan balasan otomatis...');

    try {
      const res = await fetch('/api/auth/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: currentUser.username,
          chatbotEnabled,
          chatbotType,
          chatbotPrompt: chatbotPrompt.trim(),
          customAutoReplies,
        }),
      });

      let data: any;
      try {
        data = await res.json();
      } catch {
        throw new Error('Gagal memproses data server.');
      }

      if (data.success) {
        const updatedSession = {
          ...currentUser,
          chatbotEnabled,
          chatbotType,
          chatbotPrompt: chatbotPrompt.trim(),
          customAutoReplies,
        };
        setCurrentUser(updatedSession);
        localStorage.setItem('user_session', JSON.stringify(updatedSession));
        setChatbotStatusMsg({ text: 'Pengaturan chatbot berhasil disimpan!', type: 'success' });
        addLog('success', 'Konfigurasi chatbot & balasan otomatis berhasil disimpan ke cloud!');
        setTimeout(() => setChatbotStatusMsg(null), 4000);
      } else {
        setChatbotStatusMsg({ text: data.error || 'Gagal menyimpan konfigurasi.', type: 'error' });
        addLog('error', `Gagal menyimpan chatbot: ${data.error}`);
      }
    } catch (err: any) {
      setChatbotStatusMsg({ text: err.message || 'Kesalahan jaringan.', type: 'error' });
      addLog('error', `Error chatbot save: ${err.message}`);
    } finally {
      setIsChatbotSaving(false);
    }
  };

  const handleAddAutoReply = () => {
    if (!newKeyword.trim() || !newReply.trim()) return;
    const ruleExists = customAutoReplies.some(
      r => r.keyword.toLowerCase() === newKeyword.trim().toLowerCase()
    );
    if (ruleExists) {
      setChatbotStatusMsg({ text: 'Kata kunci ini sudah terdaftar!', type: 'error' });
      setTimeout(() => setChatbotStatusMsg(null), 3000);
      return;
    }
    const updated = [...customAutoReplies, { keyword: newKeyword.trim(), reply: newReply.trim() }];
    setCustomAutoReplies(updated);
    setNewKeyword('');
    setNewReply('');
  };

  const handleDeleteAutoReply = (keywordToDelete: string) => {
    const updated = customAutoReplies.filter(r => r.keyword !== keywordToDelete);
    setCustomAutoReplies(updated);
  };

  // ---------------------------------------------------------------------------
  // CONFIGURATION LOGIC (Save & Connect custom bot)
  // ---------------------------------------------------------------------------
  const saveBotSettings = async () => {
    if (!currentUser) return;

    setIsBotSaving(true);
    addLog('info', 'Menyimpan konfigurasi bot pribadi ke cloud database...');

    try {
      const res = await fetch('/api/auth/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: currentUser.username,
          botToken: botToken.trim(),
          defaultFormat: defaultFormat,
          telegramOwnerId: telegramOwnerId.trim(),
        }),
      });

      let data: any;
      try {
        data = await res.json();
      } catch {
        throw new Error('Gagal memproses data server. Respons server bukan format JSON.');
      }

      if (data.success) {
        const updatedSession = {
          ...currentUser,
          botToken: botToken.trim(),
          defaultFormat,
          telegramOwnerId: telegramOwnerId.trim(),
        };
        setCurrentUser(updatedSession);
        localStorage.setItem('user_session', JSON.stringify(updatedSession));
        addLog('success', 'Konfigurasi bot disimpan dengan sukses!');
        if (botToken.trim()) {
          checkBotStatus(botToken.trim());
        }
      } else {
        addLog('error', `Gagal menyimpan konfigurasi: ${data.error}`);
      }
    } catch (err: any) {
      addLog('error', `Kesalahan menyimpan: ${err.message}`);
    } finally {
      setIsBotSaving(false);
    }
  };

  const handleBroadcast = async () => {
    if (!currentUser || !botToken.trim() || !broadcastMessage.trim()) return;

    setIsBroadcasting(true);
    addLog('info', 'Mengirim siaran pengumuman owner ke semua pengguna bot...');

    try {
      const res = await fetch('/api/bot/broadcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          botToken: botToken.trim(),
          message: broadcastMessage.trim(),
        }),
      });

      let data: any;
      try {
        data = await res.json();
      } catch {
        throw new Error('Gagal memproses data server. Respons server bukan format JSON.');
      }

      if (data.success) {
        addLog('success', `Siaran sukses! ${data.message}`);
        setBroadcastMessage('');
      } else {
        addLog('error', `Gagal mengirim siaran: ${data.error}`);
      }
    } catch (err: any) {
      addLog('error', `Kesalahan siaran: ${err.message}`);
    } finally {
      setIsBroadcasting(false);
    }
  };

  const activateWebhook = async () => {
    if (!botToken.trim() || !appUrl) return;
    
    setIsBotChecking(true);
    const webhookUrl = `${appUrl}/api/telegram-webhook?token=${encodeURIComponent(botToken.trim())}`;
    addLog('info', `Mendaftarkan webhook...`);

    try {
      const res = await fetch(`https://api.telegram.org/bot${botToken.trim()}/setWebhook`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: webhookUrl,
          allowed_updates: ['message', 'callback_query'],
        }),
      });

      let json: any;
      try {
        json = await res.json();
      } catch {
        throw new Error('Respons dari Telegram API saat setWebhook tidak valid.');
      }

      if (json.ok) {
        addLog('success', 'Webhook berhasil dihubungkan!');
        
        // Refresh webhook status
        const whRes = await fetch(`https://api.telegram.org/bot${botToken.trim()}/getWebhookInfo`);
        let whJson: any;
        try {
          whJson = await whRes.json();
        } catch {
          whJson = { ok: false };
        }
        if (whJson.ok) {
          setWebhookInfo(whJson.result);
          // Update profile in DB
          if (currentUser) {
            await fetch('/api/auth/update', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ username: currentUser.username, webhookEnabled: true }),
            });
            const updated = { ...currentUser, webhookEnabled: true };
            setCurrentUser(updated);
            localStorage.setItem('user_session', JSON.stringify(updated));
          }
        }
      } else {
        addLog('error', `Webhook gagal: ${json.description}`);
      }
    } catch (err: any) {
      addLog('error', `Error pendaftaran webhook: ${err.message}`);
    } finally {
      setIsBotChecking(false);
    }
  };

  const deleteWebhook = async () => {
    if (!botToken.trim()) return;

    setIsBotChecking(true);
    addLog('info', 'Menghapus webhook Telegram...');

    try {
      const res = await fetch(`https://api.telegram.org/bot${botToken.trim()}/deleteWebhook`);
      let json: any;
      try {
        json = await res.json();
      } catch {
        throw new Error('Respons dari Telegram API saat deleteWebhook tidak valid.');
      }

      if (json.ok) {
        addLog('success', 'Webhook Telegram dinonaktifkan.');
        setWebhookInfo(null);
        if (currentUser) {
          await fetch('/api/auth/update', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: currentUser.username, webhookEnabled: false }),
          });
          const updated = { ...currentUser, webhookEnabled: false };
          setCurrentUser(updated);
          localStorage.setItem('user_session', JSON.stringify(updated));
        }
      } else {
        addLog('error', `Gagal menghapus webhook: ${json.description}`);
      }
    } catch (err: any) {
      addLog('error', `Gagal mematikan webhook: ${err.message}`);
    } finally {
      setIsBotChecking(false);
    }
  };

  const copyWebhookUrl = () => {
    const webhookUrl = `${appUrl}/api/telegram-webhook?token=${botToken}`;
    navigator.clipboard.writeText(webhookUrl);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  // ---------------------------------------------------------------------------
  // WEB DOWNLOADER LOGIC (Direct UI Extraction)
  // ---------------------------------------------------------------------------
  const handleWebDownload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!downloadInput.trim()) return;

    setDownloadLoading(true);
    setDownloadResult(null);
    setDownloadError('');
    addLog('info', `[Web] Mengekstrak tautan: ${downloadInput.substring(0, 40)}...`);

    try {
      const res = await fetch('/api/download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: downloadInput }),
      });

      let data: any;
      try {
        data = await res.json();
      } catch {
        throw new Error('Gagal mengekstrak media dari server. Respons server bukan format JSON.');
      }

      if (data.success) {
        setDownloadResult(data);
        addLog('success', `[Web] Ekstraksi berhasil: "${data.title || 'Tanpa Judul'}"`);
        // If logged in, update stats
        if (currentUser) {
          const updatedSession = { ...currentUser, downloadsCount: (currentUser.downloadsCount || 0) + 1 };
          setCurrentUser(updatedSession);
          localStorage.setItem('user_session', JSON.stringify(updatedSession));
          // Save updated stats to DB
          fetch('/api/auth/update', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: currentUser.username, downloadsCount: updatedSession.downloadsCount }),
          });
        }
      } else {
        setDownloadError(data.error || 'Gagal mengekstrak media. Tautan privat/salah.');
        addLog('error', `[Web] Gagal ekstraksi: ${data.error}`);
      }
    } catch (err: any) {
      setDownloadError('Kesalahan jaringan saat mengunduh.');
      addLog('error', `[Web] Error koneksi: ${err.message}`);
    } finally {
      setDownloadLoading(false);
    }
  };

  // ---------------------------------------------------------------------------
  // TELEGRAM BOT SIMULATOR LOGIC
  // ---------------------------------------------------------------------------
  const sendSimMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!simInput.trim()) return;

    const userText = simInput.trim();
    const lowerText = userText.toLowerCase();
    setSimInput('');

    // Append User message to list
    const userMsg: ChatMessage = {
      id: Math.random().toString(36).substring(7),
      sender: 'user',
      text: userText,
      timestamp: getFormattedTime(),
    };
    
    setSimMessages(prev => [...prev, userMsg]);
    setIsBotTyping(true);

    // 1. HELP / MENU COMMANDS
    if (lowerText === '/menu' || lowerText === '/help' || lowerText === 'menu' || lowerText === 'help') {
      setTimeout(() => {
        setIsBotTyping(false);
        setSimMessages(prev => [...prev, {
          id: Math.random().toString(36).substring(7),
          sender: 'bot',
          text: `🤖 *Chonix Bot Command Menu / Bantuan* 🤖\n\n` +
                `Halo! Saya adalah *Chonix Bot*, asisten otomatis multi-platform Anda. Berikut adalah menu layanan dan perintah yang dapat saya jalankan:\n\n` +
                `📹 *Download Media (Tanpa Watermark):*\n` +
                `• *Instagram:* \`/ig <link>\` atau \`/instagram <link>\` (atau kirim link langsung)\n` +
                `• *TikTok:* \`/tt <link>\` atau \`/tiktok <link>\` (atau kirim link langsung)\n` +
                `• *Lainnya:* Anda juga bisa langsung mengirim link Instagram, TikTok, YouTube, Twitter/X, atau Facebook tanpa perintah khusus!\n\n` +
                `📰 *Berita Terkini:* \`/news\` atau \`/berita\`\n` +
                `• Menampilkan berita teknologi, AI, dan perkembangan startup terhangat secara real-time dari portal berita terpercaya.\n\n` +
                `💬 *Interaksi Chat & Tanya Jawab:*\n` +
                `• Kirim pesan teks biasa untuk mengobrol langsung dengan *AI Gemini* (didukung kustomisasi persona di dashboard) atau memicu balasan otomatis berdasarkan kata kunci yang Anda atur!`,
          timestamp: getFormattedTime(),
        }]);
      }, 800);
      return;
    }

    // 2. NEWS / BERITA COMMANDS
    if (lowerText === '/news' || lowerText === '/berita' || lowerText === 'news' || lowerText === 'berita') {
      try {
        const res = await fetch('/api/news');
        const data = await res.json();
        setIsBotTyping(false);
        if (data.success && data.news && data.news.length > 0) {
          const itemsToFormat = data.news.slice(0, 4);
          let newsText = `📰 *Breaking News / Berita Terkini* 📰\n\nMenampilkan berita hangat seputar teknologi, AI, dan perkembangan industri di Indonesia:\n\n`;
          itemsToFormat.forEach((item: any, idx: number) => {
            const cleanTitle = item.title.replace(/\*/g, '').trim();
            const cleanDesc = item.description.replace(/\*/g, '').trim();
            newsText += `${idx + 1}. *${cleanTitle}*\n`;
            newsText += `_${cleanDesc}_\n`;
            if (item.link && item.link !== '#') {
              newsText += `🔗 [Baca Selengkapnya](${item.link})\n`;
            }
            newsText += `✍️ *Sumber:* ${item.creator || 'Antara News'} | 📅 _${item.pubDate || 'Hari Ini'}_\n\n`;
          });
          newsText += `💡 _Ketik \`/menu\` untuk melihat bantuan atau menu utama._`;

          setSimMessages(prev => [...prev, {
            id: Math.random().toString(36).substring(7),
            sender: 'bot',
            text: newsText,
            timestamp: getFormattedTime(),
          }]);
        } else {
          setSimMessages(prev => [...prev, {
            id: Math.random().toString(36).substring(7),
            sender: 'bot',
            text: '❌ *Gagal memuat berita:* Maaf, terjadi kesalahan saat mengambil berita terkini dari portal berita.',
            timestamp: getFormattedTime(),
          }]);
        }
      } catch (err: any) {
        setIsBotTyping(false);
        setSimMessages(prev => [...prev, {
          id: Math.random().toString(36).substring(7),
          sender: 'bot',
          text: `❌ *Error memuat berita:* ${err.message || 'Kesalahan jaringan.'}`,
          timestamp: getFormattedTime(),
        }]);
      }
      return;
    }

    // 3. DETECT downloader prefix commands: /ig, /instagram, /tt, /tiktok
    let hasMediaCommand = false;
    let targetUrl = '';
    
    if (lowerText.startsWith('/ig ') || lowerText.startsWith('/instagram ')) {
      hasMediaCommand = true;
      targetUrl = userText.replace(/^\/ig\s+/i, '').replace(/^\/instagram\s+/i, '').trim();
    } else if (lowerText.startsWith('/tt ') || lowerText.startsWith('/tiktok ')) {
      hasMediaCommand = true;
      targetUrl = userText.replace(/^\/tt\s+/i, '').replace(/^\/tiktok\s+/i, '').trim();
    }

    if (hasMediaCommand && !targetUrl) {
      setTimeout(() => {
        setIsBotTyping(false);
        setSimMessages(prev => [...prev, {
          id: Math.random().toString(36).substring(7),
          sender: 'bot',
          text: `⚠️ *Format Perintah Salah!*\n\nSilakan masukkan tautan media sosial yang ingin diunduh.\nContoh: \`/ig https://instagram.com/p/xxxxx\` atau \`/tt https://vt.tiktok.com/xxxxx\``,
          timestamp: getFormattedTime(),
          }]);
        }, 600);
        return;
    }

    // Detect URL from the message text or from the targetUrl of the command
    const textToSearch = hasMediaCommand ? targetUrl : userText;
    const linkRegex = /(https?:\/\/[^\s]+)/gi;
    const linkMatch = textToSearch.match(linkRegex);

    if (linkMatch) {
      const detectedUrl = linkMatch[0];
      const lowerUrl = detectedUrl.toLowerCase();
      const source = lowerUrl.includes('tiktok.com') || lowerUrl.includes('vt.tiktok') || lowerUrl.includes('douyin.com') ? 'tiktok' : 
                     lowerUrl.includes('instagram.com') || lowerUrl.includes('instagr.am') ? 'instagram' :
                     lowerUrl.includes('youtube.com') || lowerUrl.includes('youtu.be') ? 'youtube' :
                     lowerUrl.includes('twitter.com') || lowerUrl.includes('x.com') ? 'twitter' :
                     lowerUrl.includes('facebook.com') || lowerUrl.includes('fb.watch') || lowerUrl.includes('fb.com') ? 'facebook' : 'other';

      if (source === 'other') {
        setTimeout(() => {
          setIsBotTyping(false);
          setSimMessages(prev => [...prev, {
            id: Math.random().toString(36).substring(7),
            sender: 'bot',
            text: '❌ *Tautan tidak didukung!*\n\nSaya mendukung tautan dari *TikTok*, *Instagram*, *YouTube*, *Twitter/X*, dan *Facebook* tanpa watermark.',
            timestamp: getFormattedTime(),
          }]);
        }, 1000);
        return;
      }

      // Generate Option buttons in simulator instead of instant downloading
      setTimeout(() => {
        setIsBotTyping(false);
        setSimMessages(prev => [...prev, {
          id: Math.random().toString(36).substring(7),
          sender: 'bot',
          text: `📥 *Tautan ${source.toUpperCase()} Terdeteksi!*\n\nSilakan pilih format pengiriman media untuk link ini di simulator:`,
          timestamp: getFormattedTime(),
          isOptionsPanel: true,
          urlHash: detectedUrl, // temp store the raw URL
        }]);
      }, 1000);

    } else {
      if (hasMediaCommand) {
        setTimeout(() => {
          setIsBotTyping(false);
          setSimMessages(prev => [...prev, {
            id: Math.random().toString(36).substring(7),
            sender: 'bot',
            text: `⚠️ *Tautan tidak valid!*\n\nSaya tidak mendeteksi URL yang valid dalam perintah Anda. Pastikan diawali dengan \`http://\` atau \`https://\`.`,
            timestamp: getFormattedTime(),
          }]);
        }, 600);
        return;
      }

      // Direct text chat through Gemini API (honoring custom Chatbot settings)
      const isEnabled = currentUser ? (chatbotEnabled !== false) : true;
      if (!isEnabled) {
        setTimeout(() => {
          setIsBotTyping(false);
          setSimMessages(prev => [...prev, {
            id: Math.random().toString(36).substring(7),
            sender: 'bot',
            text: '📴 *Sistem Chatbot Nonaktif:* Pemilik bot telah menonaktifkan fitur obrolan otomatis saat ini.',
            timestamp: getFormattedTime(),
          }]);
        }, 600);
        return;
      }

      const type = currentUser ? chatbotType : 'ai';
      const replies = currentUser ? customAutoReplies : [];

      // 1. Keyword auto replies
      if (type !== 'ai' && replies.length > 0) {
        const matched = replies.find(
          r => r.keyword && userText.toLowerCase().includes(r.keyword.toLowerCase())
        );
        if (matched) {
          setTimeout(() => {
            setIsBotTyping(false);
            setSimMessages(prev => [...prev, {
              id: Math.random().toString(36).substring(7),
              sender: 'bot',
              text: matched.reply,
              timestamp: getFormattedTime(),
            }]);
          }, 800);
          return;
        }
      }

      // 2. Custom-only mode fallback
      if (type === 'custom') {
        setTimeout(() => {
          setIsBotTyping(false);
          setSimMessages(prev => [...prev, {
            id: Math.random().toString(36).substring(7),
            sender: 'bot',
            text: '🤖 *Asisten Otomatis:* Kata kunci tidak dikenali. Silakan kirimkan tautan media sosial untuk diunduh langsung!',
            timestamp: getFormattedTime(),
          }]);
        }, 800);
        return;
      }

      // 3. AI Gemini Chat with custom Prompt support
      try {
        const contextHistory = simMessages
          .slice(-6)
          .filter(m => !m.media && !m.isOptionsPanel)
          .map(m => ({ role: m.sender, text: m.text }));

        const res = await fetch('/api/gemini', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            message: userText, 
            chatHistory: contextHistory,
            customSystemInstruction: chatbotPrompt
          }),
        });

        let geminiData: any;
        try {
          geminiData = await res.json();
        } catch {
          throw new Error('Respons dari server Gemini tidak valid.');
        }
        setIsBotTyping(false);

        setSimMessages(prev => [...prev, {
          id: Math.random().toString(36).substring(7),
          sender: 'bot',
          text: geminiData.reply,
          timestamp: getFormattedTime(),
        }]);
      } catch {
        setIsBotTyping(false);
        setSimMessages(prev => [...prev, {
          id: Math.random().toString(36).substring(7),
          sender: 'bot',
          text: 'Halo! Ada yang bisa dibantu? Silakan kirim link media sosial Anda untuk download instan.',
          timestamp: getFormattedTime(),
        }]);
      }
    }
  };

  // User clicks format option inside simulator chat
  const handleSimulatorFormatChoice = async (format: 'media' | 'file' | 'audio', originalUrl: string, panelId: string) => {
    // Replace Option Panel with processing text
    setSimMessages(prev => prev.map(m => m.id === panelId ? {
      ...m,
      isOptionsPanel: false,
      text: `⏳ *Sedang mendownload dan mengirim dengan format [${format.toUpperCase()}]...*`
    } : m));

    setIsBotTyping(true);

    try {
      const res = await fetch('/api/download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: originalUrl }),
      });

      let data: any;
      try {
        data = await res.json();
      } catch {
        throw new Error('Gagal mengekstrak media untuk simulasi. Respons dari server tidak valid.');
      }
      setIsBotTyping(false);

      if (data.success) {
        // Adjust results based on user selected format
        const responseText = `📥 *Berhasil Diunduh!*\n\n📝 *Judul:* ${data.title || 'Video Media'}\n⚙️ *Format:* ${format === 'file' ? '📁 Dokumen / File' : format === 'audio' ? '🎵 Audio MP3' : '📹 Media (Video/Foto)'}`;
        
        setSimMessages(prev => [...prev, {
          id: Math.random().toString(36).substring(7),
          sender: 'bot',
          text: responseText,
          timestamp: getFormattedTime(),
          media: {
            ...data,
            // Override visibility according to chosen format representation
            videoUrl: format === 'audio' ? undefined : data.videoUrl,
            images: format === 'audio' || format === 'file' ? [] : data.images,
          }
        }]);

        addLog('success', `[Simulator] Berhasil mengunduh format ${format} untuk simulasi.`);
      } else {
        setSimMessages(prev => [...prev, {
          id: Math.random().toString(36).substring(7),
          sender: 'bot',
          text: `❌ *Gagal Mengunduh!*\n\n${data.error || 'Server sedang sibuk.'}`,
          timestamp: getFormattedTime(),
        }]);
      }
    } catch {
      setIsBotTyping(false);
      setSimMessages(prev => [...prev, {
        id: Math.random().toString(36).substring(7),
        sender: 'bot',
        text: '❌ Terjadi kegagalan jaringan saat menghubungi modul pengunduh.',
        timestamp: getFormattedTime(),
      }]);
    }
  };

  const getMediaSourceColor = (source: string) => {
    switch(source) {
      case 'tiktok': return 'bg-black text-white border border-slate-700';
      case 'instagram': return 'bg-gradient-to-tr from-yellow-500 via-pink-500 to-purple-600 text-white';
      case 'youtube': return 'bg-red-600 text-white';
      case 'twitter': return 'bg-indigo-500 text-white';
      case 'facebook': return 'bg-indigo-600 text-white';
      default: return 'bg-slate-600 text-white';
    }
  };

  const isDark = theme === 'dark';

  // Theme-adaptive classes
  const cardClass = isDark 
    ? "bg-[#1C1C1E]/80 backdrop-blur-xl border border-white/10 text-slate-100" 
    : "bg-white border border-slate-200/80 text-slate-800 shadow-sm";
    
  const innerCardClass = isDark 
    ? "bg-black/40 border border-white/5 text-slate-300" 
    : "bg-slate-50 border border-slate-100 text-slate-600";
    
  const borderClass = isDark 
    ? "border-white/10" 
    : "border-slate-100";
    
  const labelClass = isDark 
    ? "text-slate-400" 
    : "text-slate-500";
    
  const inputClass = isDark 
    ? "bg-black/50 border border-white/10 focus:border-blue-500 text-slate-100 focus:ring-1 focus:ring-blue-500" 
    : "bg-slate-50 border border-slate-200 focus:border-blue-500 text-slate-800 focus:ring-1 focus:ring-blue-500";

  if (!mounted) {
    return (
      <div className="min-h-[100dvh] bg-black text-slate-100 flex items-center justify-center font-sans">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-[3px] border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-[13px] text-slate-400 font-medium animate-pulse">Memuat aplikasi…</p>
        </div>
      </div>
    );
  }

  return (
    <div id="main_container" className={`relative min-h-screen flex flex-col font-sans selection:bg-blue-500 selection:text-white transition-colors duration-300 ${
      isDark ? 'bg-black text-slate-100' : 'bg-slate-50 text-slate-900'
    }`}>
      
      {/* GLOW DECORATIONS — clipped so they never push the page wider than the viewport */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute -top-10 left-1/4 w-72 h-72 sm:w-96 sm:h-96 bg-blue-600/10 rounded-full blur-[100px]"></div>
        <div className="absolute bottom-10 right-1/4 w-72 h-72 sm:w-96 sm:h-96 bg-blue-600/10 rounded-full blur-[100px]"></div>
      </div>

      {/* HEADER SECTION — iOS translucent navigation bar, pt-safe clears the Dynamic Island / notch */}
      <header id="app_header" className={`border-b backdrop-blur-xl sticky top-0 z-40 px-4 pt-safe py-3 transition-colors duration-300 ${
        isDark ? 'border-white/10 bg-black/70 text-slate-100' : 'border-slate-200/70 bg-white/70 text-slate-900'
      }`}>
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-start">
            <div className="flex items-center gap-3">
              <ChonixBotLogo className="w-9 h-9" />
              <div>
                <div className="flex items-center gap-1.5">
                  <h1 className="text-[17px] font-semibold tracking-tight">
                    Chonix Bot
                  </h1>
                  <span className={`text-[11px] font-semibold px-1.5 py-0.5 rounded-md ${isDark ? 'bg-blue-500/15 text-blue-400' : 'bg-blue-500/10 text-blue-600'}`}>v2.0</span>
                </div>
                <p className={`text-[12px] font-medium hidden sm:block ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  Manajer bot Telegram & pengunduh media tanpa watermark
                </p>
              </div>
            </div>

            {/* Theme toggle stays reachable next to the wordmark on mobile */}
            <button
              id="theme_toggle_btn_mobile"
              onClick={() => setTheme(prev => prev === 'light' ? 'dark' : 'light')}
              className={`md:hidden p-2 rounded-full border transition-all duration-300 cursor-pointer flex-shrink-0 ${
                isDark
                  ? 'bg-white/5 border-white/10 text-amber-400'
                  : 'bg-white border-slate-200 text-slate-600 shadow-sm'
              }`}
              aria-label="Toggle Theme"
            >
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>
          
          {/* Main Controls Header */}
          <div className="hidden md:flex items-center gap-3 w-full md:w-auto justify-center md:justify-end">
            {currentUser && (
              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border transition-colors duration-300 ${
                isDark ? 'bg-white/5 border-white/10' : 'bg-slate-100 border-slate-200'
              }`}>
                <User className="w-3.5 h-3.5 text-blue-400" />
                <span className={`text-xs font-bold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>{currentUser.username}</span>
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-ping"></span>
              </div>
            )}

            {/* Elegant Theme Toggle Button */}
            <button
              id="theme_toggle_btn"
              onClick={() => setTheme(prev => prev === 'light' ? 'dark' : 'light')}
              className={`p-2 rounded-full border transition-all duration-300 cursor-pointer flex-shrink-0 ${
                isDark 
                  ? 'bg-white/5 border-white/10 text-amber-400 hover:text-amber-300 hover:bg-white/10' 
                  : 'bg-white border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100 shadow-sm'
              }`}
              title={isDark ? "Ganti ke Tema Terang" : "Ganti ke Tema Gelap"}
              aria-label="Toggle Theme"
            >
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            {/* Navigation Tabs - iOS segmented control - desktop only, mobile uses the bottom tab bar */}
            {currentUser && (
              <div className={`flex p-1 rounded-full border transition-colors duration-300 w-full md:w-auto ${
                isDark ? 'bg-white/5 border-white/10' : 'bg-slate-200/70 border-slate-200/70'
              }`}>
                <button
                  onClick={() => setActiveTab('manager')}
                  className={`flex-1 md:flex-none px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-[10.5px] sm:text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap ${
                    activeTab === 'manager' 
                      ? (isDark ? 'bg-slate-600/90 text-white shadow' : 'bg-white text-slate-900 shadow')
                      : isDark 
                        ? 'text-slate-400 hover:text-white' 
                        : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Settings className="w-3.5 h-3.5" />
                  <span className="sm:hidden">Manager</span>
                  <span className="hidden sm:inline">Bot Manager</span>
                </button>
                <button
                  onClick={() => setActiveTab('simulator')}
                  className={`flex-1 md:flex-none px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-[10.5px] sm:text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap ${
                    activeTab === 'simulator' 
                      ? (isDark ? 'bg-slate-600/90 text-white shadow' : 'bg-white text-slate-900 shadow')
                      : isDark 
                        ? 'text-slate-400 hover:text-white' 
                        : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Send className="w-3.5 h-3.5" />
                  <span className="sm:hidden">Simulator</span>
                  <span className="hidden sm:inline">Bot Simulator</span>
                </button>
                <button
                  onClick={() => setActiveTab('downloader')}
                  className={`flex-1 md:flex-none px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-[10.5px] sm:text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap ${
                    activeTab === 'downloader' 
                      ? (isDark ? 'bg-slate-600/90 text-white shadow' : 'bg-white text-slate-900 shadow')
                      : isDark 
                        ? 'text-slate-400 hover:text-white' 
                        : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Download className="w-3.5 h-3.5" />
                  <span className="sm:hidden">Extractor</span>
                  <span className="hidden sm:inline">Web Extractor</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* LOGIN & REGISTER PORTAL */}
      <AnimatePresence mode="wait">
        {!currentUser ? (
          <motion.div 
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            className="flex-1 flex items-center justify-center px-4 py-12"
          >
            <div className={`${cardClass} p-6 sm:p-8 rounded-3xl w-full max-w-md shadow-2xl relative flex flex-col gap-6 transition-all duration-300`}>
              
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>

              <div className="flex flex-col items-center text-center gap-2">
                <div className="animate-bounce drop-shadow-lg">
                  <ChonixBotLogo className="w-16 h-16" />
                </div>
                <h2 className={`text-xl font-extrabold tracking-tight transition-colors ${isDark ? 'text-slate-100' : 'text-slate-800'}`}>
                  {authMode === 'login' ? 'Masuk ke Akun Anda' : 'Daftar Akun Baru'}
                </h2>
                <p className={`text-xs transition-colors max-w-[80%] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  {authMode === 'login' 
                    ? 'Gunakan akun Anda untuk mengakses dan mengonfigurasi token Bot Telegram personal Anda.' 
                    : 'Buat akun untuk meluncurkan klien Telegram downloader bot tersendiri.'}
                </p>
              </div>

              {authError && (
                <div className="bg-red-500/10 border border-red-500/20 p-3 rounded-2xl text-red-400 text-xs flex gap-2">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>{authError}</span>
                </div>
              )}

              {authSuccess && (
                <div className="bg-blue-500/10 border border-blue-500/20 p-3 rounded-2xl text-blue-400 text-xs flex gap-2">
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>{authSuccess}</span>
                </div>
              )}

              <form onSubmit={handleAuth} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className={`text-xs font-bold flex items-center gap-1 transition-colors ${labelClass}`}>
                    <User className="w-3.5 h-3.5" /> Username
                  </label>
                  <input
                    type="text"
                    placeholder="Masukkan username Anda..."
                    value={authUsername}
                    onChange={(e) => setAuthUsername(e.target.value)}
                    className={`w-full rounded-2xl px-4 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/40 transition ${
                      isDark 
                        ? 'bg-slate-950 border border-slate-800 text-slate-200 placeholder:text-slate-600' 
                        : 'bg-slate-50 border border-slate-200 text-slate-800 placeholder:text-slate-400'
                    }`}
                    required
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className={`text-xs font-bold flex items-center gap-1 transition-colors ${labelClass}`}>
                    <Lock className="w-3.5 h-3.5" /> Password
                  </label>
                  <input
                    type="password"
                    placeholder="Masukkan password Anda..."
                    value={authPassword}
                    onChange={(e) => setAuthPassword(e.target.value)}
                    className={`w-full rounded-2xl px-4 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/40 transition ${
                      isDark 
                        ? 'bg-slate-950 border border-slate-800 text-slate-200 placeholder:text-slate-600' 
                        : 'bg-slate-50 border border-slate-200 text-slate-800 placeholder:text-slate-400'
                    }`}
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={authLoading}
                  className="w-full bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 font-extrabold text-white py-3 rounded-2xl text-xs transition shadow-lg shadow-indigo-500/10 flex items-center justify-center gap-2 cursor-pointer"
                >
                  {authLoading ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : authMode === 'login' ? (
                    <>
                      <LogIn className="w-4 h-4" /> Masuk Sekarang
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4" /> Daftar Akun
                    </>
                  )}
                </button>
              </form>

              <div className={`border-t pt-4 text-center transition-colors ${borderClass}`}>
                <button
                  onClick={() => {
                    setAuthMode(authMode === 'login' ? 'register' : 'login');
                    setAuthError('');
                    setAuthSuccess('');
                  }}
                  className="text-xs text-indigo-500 hover:text-indigo-600 font-bold transition cursor-pointer"
                >
                  {authMode === 'login' ? 'Belum punya akun? Daftar di sini' : 'Sudah punya akun? Masuk di sini'}
                </button>
              </div>
            </div>
          </motion.div>
        ) : (
          // 2. ACTIVE VIEW OR LOGGED IN WORKSPACE
          <motion.main 
            key="workspace-main"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className={`flex-1 max-w-7xl w-full mx-auto p-4 transition-colors duration-300 ${
              currentUser 
                ? "grid grid-cols-1 md:grid-cols-12 gap-6 pb-24 md:pb-4" 
                : "flex flex-col gap-6 items-center w-full pb-24 md:pb-4"
            }`}
          >
            
            {/* COLUMN 1: BOT CONFIGURATION (Left Column - ONLY rendered if user logged in) */}
            {currentUser && (
              <div className={`md:col-span-4 flex flex-col gap-6 w-full ${activeTab === 'manager' ? 'block' : 'hidden md:flex'}`}>
                
                {/* BOT CONFIG CARD */}
                <section id="bot_connector_card" className={`${cardClass} p-5 flex flex-col gap-4 transition-all duration-300`}>
                  <div className={`flex items-center justify-between pb-2 border-b ${borderClass}`}>
                    <div className="flex items-center gap-2.5">
                      <Settings className="w-5 h-5 text-blue-500" />
                      <h2 className="font-bold">Pengaturan Bot Klien</h2>
                    </div>
                    <button 
                      onClick={handleLogout}
                      className={`p-1 rounded transition flex items-center gap-1 text-[10px] font-bold text-red-500 ${
                        isDark ? 'hover:bg-slate-800 hover:text-red-400' : 'hover:bg-red-50 hover:text-red-600'
                      }`}
                    >
                      <LogOut className="w-3.5 h-3.5" /> Keluar
                    </button>
                  </div>

                  <div className={`p-3 rounded-2xl text-[11px] flex flex-col gap-1 leading-relaxed ${innerCardClass}`}>
                    <span className="font-bold text-blue-500 flex items-center gap-1">
                      <Sparkles className="w-3 h-3" /> Dashboard Client: <span className={isDark ? 'text-slate-200' : 'text-slate-800'}>{currentUser.username}</span>
                    </span>
                    <span className={isDark ? 'text-slate-400' : 'text-slate-600'}>Anda bisa meluncurkan satu unit bot pengunduh khusus untuk Anda sendiri yang terhubung langsung ke server media kami.</span>
                  </div>

                  {/* Input Token */}
                  <div className="flex flex-col gap-1.5">
                    <label className={`text-xs font-semibold flex items-center gap-1.5 ${labelClass}`}>
                      <Key className="w-3.5 h-3.5 text-blue-500" /> Kunci Bot Token (Telegram API)
                    </label>
                    <input
                      type="password"
                      placeholder="Masukkan token dari @BotFather..."
                      value={botToken}
                      onChange={(e) => setBotToken(e.target.value)}
                      className={`w-full rounded-2xl px-3.5 py-2.5 text-xs transition ${inputClass}`}
                    />
                  </div>

                  {/* Input Telegram Owner ID */}
                  <div className="flex flex-col gap-1.5">
                    <label className={`text-xs font-semibold flex items-center gap-1.5 ${labelClass}`}>
                      <User className="w-3.5 h-3.5 text-blue-500" /> ID Telegram Owner (Opsional)
                    </label>
                    <input
                      type="text"
                      placeholder="Masukkan ID Telegram Anda (misal: 123456789)..."
                      value={telegramOwnerId}
                      onChange={(e) => setTelegramOwnerId(e.target.value)}
                      className={`w-full rounded-2xl px-3.5 py-2.5 text-xs transition ${inputClass}`}
                    />
                    <span className="text-[10px] text-slate-500 italic leading-snug">
                      Gunakan bot seperti @userinfobot di Telegram untuk mengetahui ID Anda. ID ini akan dibaca sebagai owner bot untuk melakukan broadcast siaran.
                    </span>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2 pt-1">
                    <button
                      onClick={saveBotSettings}
                      disabled={isBotSaving}
                      className="flex-1 bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white font-bold py-2.5 px-4 rounded-2xl text-xs transition shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Check className="w-3.5 h-3.5" /> Simpan Config
                    </button>
                    {botToken.trim() && (
                      <button
                        onClick={() => checkBotStatus(botToken)}
                        disabled={isBotChecking}
                        className={`py-2 px-3 rounded-2xl text-xs transition flex items-center justify-center gap-1.5 cursor-pointer ${
                          isDark 
                            ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700/50' 
                            : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-350'
                        }`}
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${isBotChecking ? 'animate-spin' : ''}`} />
                      </button>
                    )}
                  </div>

                  {/* BOT INFORMATION PORTAL */}
                  {botInfo && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`p-4 rounded-2xl flex flex-col gap-3 ${innerCardClass}`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center text-white font-extrabold text-sm shadow">
                          {botInfo.first_name ? botInfo.first_name[0] : 'B'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className={`font-bold text-xs truncate ${isDark ? 'text-slate-100' : 'text-slate-800'}`}>{botInfo.first_name}</div>
                          <div className="text-[10px] text-blue-500 truncate font-mono">@{botInfo.username}</div>
                        </div>
                        <span className="px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 text-[10px] border border-blue-500/20 font-bold">
                          Online
                        </span>
                      </div>

                      {/* Webhook Configuration Block */}
                      <div className={`border-t pt-3 flex flex-col gap-2 ${borderClass}`}>
                        <div className="flex justify-between items-center text-[10px]">
                          <span className={`${labelClass} font-medium`}>Webhook Telegram API</span>
                          {webhookInfo?.url ? (
                            <span className="text-blue-500 font-bold flex items-center gap-1">
                              <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-ping"></span>
                              Terhubung
                            </span>
                          ) : (
                            <span className="text-yellow-600 font-bold">Belum Terhubung</span>
                          )}
                        </div>

                        {webhookInfo?.url && (
                          <div className={`flex flex-col gap-1.5 p-2 rounded-xl ${cardClass}`}>
                            <span className="text-[9px] text-slate-400 font-mono">WEBHOOK ENDPOINT:</span>
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-[10px] truncate font-mono select-all text-slate-500">
                                {appUrl}/api/telegram-webhook?token=...
                              </span>
                              <button 
                                onClick={copyWebhookUrl}
                                className={`p-1 rounded transition ${isDark ? 'hover:bg-slate-800 text-slate-400 hover:text-white' : 'hover:bg-slate-100 text-slate-500 hover:text-slate-800'}`}
                                title="Salin Webhook URL"
                              >
                                {copiedUrl ? <Check className="w-3 h-3 text-blue-500" /> : <Copy className="w-3 h-3" />}
                              </button>
                            </div>
                          </div>
                        )}

                        <div className="flex gap-2 mt-1">
                          {!webhookInfo?.url ? (
                            <button
                              onClick={activateWebhook}
                              disabled={isBotChecking}
                              className="flex-1 bg-gradient-to-r from-blue-500 to-violet-600 hover:from-blue-600 hover:to-violet-700 text-white font-bold py-1.5 px-3 rounded-xl text-[11px] transition shadow flex items-center justify-center gap-1 cursor-pointer"
                            >
                              <Globe className="w-3.5 h-3.5" /> Sambungkan Bot Webhook
                            </button>
                          ) : (
                            <button
                              onClick={deleteWebhook}
                              disabled={isBotChecking}
                              className="flex-1 bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 font-bold py-1.5 px-3 rounded-xl text-[11px] transition flex items-center justify-center gap-1 cursor-pointer"
                            >
                              <XCircle className="w-3.5 h-3.5" /> Putus Hubungan Webhook
                            </button>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </section>

                {/* BROADCAST CARD */}
                {botToken.trim() && (
                  <section id="broadcast_card" className={`${cardClass} p-5 flex flex-col gap-4 transition-all duration-300`}>
                    <div className={`flex items-center gap-2.5 pb-2 border-b ${borderClass}`}>
                      <Volume2 className="w-5 h-5 text-blue-500" />
                      <h2 className="font-bold">Broadcast Pengumuman</h2>
                    </div>

                    <div className={`p-3 rounded-2xl text-[11px] leading-relaxed ${innerCardClass}`}>
                      <span className="font-bold text-blue-500">Kirim Pesan ke Semua Pengguna:</span>
                      <p className={isDark ? 'text-slate-400' : 'text-slate-600'}>
                        Kirim pesan pengumuman/siaran secara massal ke seluruh pengguna yang pernah berinteraksi dengan bot Telegram Anda.
                      </p>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className={`text-xs font-semibold ${labelClass}`}>
                        Isi Pesan Siaran
                      </label>
                      <textarea
                        placeholder="Tulis pengumuman Anda di sini..."
                        value={broadcastMessage}
                        onChange={(e) => setBroadcastMessage(e.target.value)}
                        rows={3}
                        className={`w-full rounded-2xl px-3.5 py-2.5 text-xs transition resize-none ${inputClass}`}
                      />
                    </div>

                    <button
                      onClick={handleBroadcast}
                      disabled={isBroadcasting || !broadcastMessage.trim()}
                      className="w-full bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white font-bold py-2 px-4 rounded-2xl text-xs transition shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      {isBroadcasting ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          Mengirim Siaran...
                        </>
                      ) : (
                        <>
                          <Send className="w-3.5 h-3.5" />
                          Kirim Broadcast
                        </>
                      )}
                    </button>
                  </section>
                )}

                {/* REAL-TIME CLIENT STATISTICS */}
                <section id="stats_card" className="flex flex-col transition-all duration-300">
                  <span className={`ios-eyebrow ${labelClass}`}>Statistik Klien</span>
                  <div className={`${cardClass} rounded-2xl overflow-hidden`}>
                    <div className="ios-row">
                      <span className="text-[13px] font-medium">Unduhan berhasil</span>
                      <span className="text-[15px] font-semibold text-blue-500">{currentUser.downloadsCount || 0}</span>
                    </div>
                    <div className="ios-row">
                      <span className="text-[13px] font-medium">Status integrasi</span>
                      <span className="text-[13px] font-semibold text-blue-500 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></span>
                        Aktif
                      </span>
                    </div>
                    <div className="ios-row items-start">
                      <div className="flex items-start gap-2.5">
                        <HelpCircle className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
                        <span className={`text-[12px] leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Kirim link Instagram Reels atau TikTok ke bot Telegram Anda. Menu format kirim akan otomatis muncul di chat.</span>
                      </div>
                    </div>
                  </div>
                </section>

                {/* CHATBOT & AUTO-RESPONSE CONFIGURATION */}
                <section id="chatbot_card" className={`${cardClass} p-5 flex flex-col gap-4 transition-all duration-300`}>
                  <div className={`flex items-center justify-between pb-2 border-b ${borderClass}`}>
                    <div className="flex items-center gap-2.5">
                      <MessageSquare className="w-5 h-5 text-blue-500" />
                      <h2 className="font-bold">Chatbot & Balasan Otomatis</h2>
                    </div>
                    {/* Switch/Toggle to Enable/Disable Chatbot */}
                    <button 
                      onClick={() => setChatbotEnabled(!chatbotEnabled)}
                      className={`relative inline-flex h-5 w-10 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        chatbotEnabled ? 'bg-blue-500' : 'bg-slate-700'
                      }`}
                    >
                      <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        chatbotEnabled ? 'translate-x-5' : 'translate-x-0'
                      }`} />
                    </button>
                  </div>

                  <div className={`p-3 rounded-2xl text-[11px] leading-relaxed ${innerCardClass}`}>
                    <span className="font-bold text-blue-500">Kustomisasi Chatbot:</span>
                    <p className={isDark ? 'text-slate-400' : 'text-slate-600'}>
                      Tentukan bagaimana bot merespon pesan selain tautan media sosial. Menggunakan AI Gemini atau balasan kata kunci instan.
                    </p>
                  </div>

                  {chatbotEnabled && (
                    <div className="flex flex-col gap-4">
                      {/* Chatbot Type Selector */}
                      <div className="flex flex-col gap-1.5">
                        <label className={`text-xs font-semibold ${labelClass}`}>Metode Respon</label>
                        <div className="grid grid-cols-3 gap-2">
                          {[
                            { id: 'ai', label: 'AI Gemini' },
                            { id: 'custom', label: 'Keyword' },
                            { id: 'hybrid', label: 'Hybrid' }
                          ].map((t) => (
                            <button
                              key={t.id}
                              type="button"
                              onClick={() => setChatbotType(t.id as any)}
                              className={`py-1.5 px-1 rounded-xl text-[10px] font-bold border transition cursor-pointer ${
                                chatbotType === t.id 
                                  ? 'bg-blue-500/10 border-blue-500 text-blue-500' 
                                  : isDark
                                    ? 'bg-slate-800/40 border-slate-700 text-slate-400 hover:text-slate-300'
                                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:text-slate-800'
                              }`}
                            >
                              {t.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Gemini Custom Instruction Prompt */}
                      {(chatbotType === 'ai' || chatbotType === 'hybrid') && (
                        <div className="flex flex-col gap-1.5">
                          <label className={`text-xs font-semibold flex items-center gap-1 ${labelClass}`}>
                            <Sparkles className="w-3.5 h-3.5 text-blue-500" /> Instruksi Sistem AI (Persona)
                          </label>
                          <textarea
                            placeholder="Contoh: Jawab dengan gaya asisten gaul Jakarta yang ramah..."
                            value={chatbotPrompt}
                            onChange={(e) => setChatbotPrompt(e.target.value)}
                            rows={3}
                            className={`w-full rounded-2xl px-3 py-2 text-xs transition resize-none ${inputClass}`}
                          />
                        </div>
                      )}

                      {/* Custom Keyword Rules Form */}
                      {(chatbotType === 'custom' || chatbotType === 'hybrid') && (
                        <div className="flex flex-col gap-2.5 border-t pt-3 border-dashed border-slate-700/50">
                          <label className={`text-xs font-semibold ${labelClass}`}>Aturan Balasan Kata Kunci</label>
                          
                          {/* List of custom keyword rules */}
                          {customAutoReplies.length > 0 ? (
                            <div className="flex flex-col gap-1.5 max-h-[140px] overflow-y-auto scrollbar-thin pr-1">
                              {customAutoReplies.map((rule) => (
                                <div 
                                  key={rule.keyword} 
                                  className={`flex items-center justify-between p-2 rounded-xl text-[11px] gap-2 ${innerCardClass}`}
                                >
                                  <div className="min-w-0 flex-1">
                                    <span className="font-extrabold text-blue-500 bg-blue-500/10 px-1.5 py-0.5 rounded mr-1.5 font-mono">
                                      {rule.keyword}
                                    </span>
                                    <span className={`truncate block mt-1 ${isDark ? 'text-slate-350' : 'text-slate-700'}`}>
                                      {rule.reply}
                                    </span>
                                  </div>
                                  <button
                                    onClick={() => handleDeleteAutoReply(rule.keyword)}
                                    type="button"
                                    className="p-1 rounded text-red-500 hover:bg-red-500/10 cursor-pointer"
                                    title="Hapus aturan"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className={`p-3 rounded-xl text-[10.5px] text-center text-slate-500 ${innerCardClass}`}>
                              Belum ada aturan kata kunci. Tambahkan di bawah!
                            </div>
                          )}

                          {/* Add keyword rule input row */}
                          <div className="flex flex-col gap-1.5 bg-slate-500/5 p-2 rounded-2xl">
                            <div className="grid grid-cols-2 gap-1.5">
                              <input
                                type="text"
                                placeholder="Kata Kunci (cth: /info)"
                                value={newKeyword}
                                onChange={(e) => setNewKeyword(e.target.value)}
                                className={`rounded-xl px-2 py-1.5 text-[10px] ${inputClass}`}
                              />
                              <input
                                type="text"
                                placeholder="Balasan pesan..."
                                value={newReply}
                                onChange={(e) => setNewReply(e.target.value)}
                                className={`rounded-xl px-2 py-1.5 text-[10px] ${inputClass}`}
                              />
                            </div>
                            <button
                              onClick={handleAddAutoReply}
                              type="button"
                              className="w-full py-1 bg-blue-500 hover:bg-blue-600 text-white rounded-xl text-[10.5px] font-bold transition flex items-center justify-center gap-1 cursor-pointer"
                            >
                              <Plus className="w-3 h-3" /> Tambah Aturan
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Save Settings Button */}
                  <div className="flex flex-col gap-2 pt-2 border-t border-slate-700/30">
                    <button
                      onClick={saveChatbotSettings}
                      disabled={isChatbotSaving}
                      className="w-full bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white font-bold py-2 px-4 rounded-2xl text-xs transition shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      {isChatbotSaving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                      Simpan Fitur Chatbot
                    </button>
                    {chatbotStatusMsg && (
                      <span className={`text-[10px] font-bold text-center ${
                        chatbotStatusMsg.type === 'success' ? 'text-green-500' : 'text-red-500'
                      }`}>
                        {chatbotStatusMsg.text}
                      </span>
                    )}
                  </div>
                </section>
              </div>
            )}
            
            {/* COLUMN 2: SIMULATOR (Middle Column - Instant Access) */}
            <div className={`flex flex-col gap-4 h-[calc(100dvh-224px)] md:h-[calc(100dvh-140px)] min-h-[420px] md:min-h-[550px] transition-all duration-300 ${
              currentUser 
                ? "md:col-span-5 w-full" 
                : "max-w-2xl w-full"
            } ${activeTab === 'simulator' ? 'block' : 'hidden md:flex'}`}>
              <div className={`${cardClass} flex flex-col h-full shadow-2xl overflow-hidden rounded-2xl`}>
                
                {/* Telegram Header Mockup */}
                <div className={`px-4 py-3.5 flex items-center justify-between border-b ${
                  isDark ? 'bg-slate-900 border-slate-800' : 'bg-slate-100 border-slate-200'
                }`}>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-500 to-violet-600 flex items-center justify-center text-white shadow-md relative">
                      <ChonixBotLogo className="w-8 h-8" />
                      <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-blue-400 border-2 border-blue-500 rounded-full"></span>
                    </div>
                    <div>
                      <h3 className="font-extrabold text-sm flex items-center gap-1.5">
                        Chonix Bot Simulator
                        <span className="bg-blue-500/10 text-blue-500 text-[9px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">AI</span>
                      </h3>
                      <p className="text-[10.5px] text-blue-500 font-semibold">
                        {isBotTyping ? 'mengetik...' : 'aktif, siap melayani'}
                      </p>
                    </div>
                  </div>
                  <button 
                    onClick={() => {
                      setSimMessages([
                        {
                          id: 'start-2',
                          sender: 'bot',
                          text: '👋 *Simulator direset!*\n\nSilakan kirimkan tautan video TikTok atau Instagram Reels untuk memulai proses uji coba.',
                          timestamp: getFormattedTime(),
                        }
                      ]);
                      addLog('info', 'Simulator chat direset.');
                    }}
                    className={`p-1.5 rounded-xl transition ${isDark ? 'hover:bg-slate-800 text-slate-400 hover:text-white' : 'hover:bg-slate-200 text-slate-500 hover:text-slate-800'}`}
                    title="Reset Obrolan"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                </div>

                {/* Chat Messages Body */}
                <div className={`flex-1 overflow-y-auto p-4 space-y-4 ${
                  isDark ? 'bg-slate-950/40' : 'bg-slate-50/50'
                }`}>
                  <AnimatePresence initial={false}>
                    {simMessages.map((msg) => (
                      <motion.div
                        key={msg.id}
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div className={`max-w-[85%] rounded-2xl px-4 py-3 shadow-md flex flex-col gap-1.5 text-xs leading-relaxed ${
                          msg.sender === 'user' 
                            ? 'bg-blue-500 text-white rounded-tr-none' 
                            : isDark
                              ? 'bg-slate-900 border border-slate-800 text-slate-100 rounded-tl-none'
                              : 'bg-white border border-slate-100 text-slate-800 rounded-tl-none shadow-sm'
                        }`}>
                          
                          {/* Text with markdown bold parsed */}
                          <div className="whitespace-pre-wrap select-text">
                            {msg.text.split('\n').map((line, idx) => {
                              let formattedLine = line;
                              const boldMatches = formattedLine.match(/\*(.*?)\*/g);
                              if (boldMatches) {
                                boldMatches.forEach(m => {
                                  const clean = m.replace(/\*/g, '');
                                  formattedLine = formattedLine.replace(m, `<b>${clean}</b>`);
                                });
                              }
                              return <p key={idx} dangerouslySetInnerHTML={{ __html: formattedLine || '&nbsp;' }} />;
                            })}
                          </div>

                          {/* OPTION INTERACTIVE BUTTON PANEL */}
                          {msg.isOptionsPanel && msg.urlHash && (
                            <div className={`mt-2 pt-2 border-t flex flex-col gap-2 ${borderClass}`}>
                              <span className="text-[10px] text-blue-500 font-bold mb-1">PILIH FORMAT PENGIRIMAN:</span>
                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                                <button
                                  onClick={() => handleSimulatorFormatChoice('media', msg.urlHash!, msg.id)}
                                  className="bg-blue-500 hover:bg-blue-600 text-white font-extrabold py-1.5 px-2.5 rounded-xl text-[10px] transition flex items-center justify-center gap-1 cursor-pointer"
                                >
                                  📹 Media
                                </button>
                                <button
                                  onClick={() => handleSimulatorFormatChoice('file', msg.urlHash!, msg.id)}
                                  className={`font-extrabold py-1.5 px-2.5 rounded-xl text-[10px] transition flex items-center justify-center gap-1 cursor-pointer ${
                                    isDark ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700' : 'bg-slate-200 hover:bg-slate-300 text-slate-800 border border-slate-200'
                                  }`}
                                >
                                  📁 Dokumen
                                </button>
                                <button
                                  onClick={() => handleSimulatorFormatChoice('audio', msg.urlHash!, msg.id)}
                                  className="bg-indigo-500 hover:bg-indigo-600 text-white font-extrabold py-1.5 px-2.5 rounded-xl text-[10px] transition flex items-center justify-center gap-1 cursor-pointer"
                                >
                                  🎵 Audio
                                </button>
                              </div>
                            </div>
                          )}

                          {/* Extracted media preview layout */}
                          {msg.media && msg.media.success && (
                            <div className={`mt-2.5 pt-2 border-t flex flex-col gap-3 ${borderClass}`}>
                              
                              {/* Slideshow Photo Gallery */}
                              {(() => {
                                if (!msg.media || !msg.media.isSlideshow || !msg.media.images || msg.media.images.length === 0) return null;
                                const images = msg.media.images;
                                return (
                                  <div className="flex flex-col gap-2">
                                    <span className="text-[10px] text-slate-500 font-semibold flex items-center gap-1">
                                      <ImageIcon className="w-3 h-3 text-blue-500" /> Galeri Foto TikTok ({images.length} gambar)
                                    </span>
                                    <div className={`grid grid-cols-3 gap-1.5 p-2 rounded-2xl border ${
                                      isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-100 border-slate-200'
                                    }`}>
                                      {images.slice(0, 6).map((imgUrl: string, idx: number) => (
                                        <a 
                                          key={idx} 
                                          href={imgUrl} 
                                          target="_blank" 
                                          rel="noopener noreferrer" 
                                          className={`relative aspect-square rounded-xl overflow-hidden border hover:opacity-80 transition ${
                                            isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
                                          }`}
                                        >
                                          <img src={imgUrl} alt={`slide ${idx}`} className="object-cover w-full h-full" />
                                          {idx === 5 && images.length > 6 && (
                                            <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-[10px] font-bold text-white">
                                              +{images.length - 6}
                                            </div>
                                          )}
                                        </a>
                                      ))}
                                    </div>
                                  </div>
                                );
                              })()}

                              {/* Video Player & Streaming */}
                              {msg.media.videoUrl && (
                                <div className="flex flex-col gap-2">
                                  <span className="text-[10px] text-slate-500 font-semibold flex items-center gap-1">
                                    <Video className="w-3 h-3 text-blue-500" /> Pemutar Video
                                  </span>
                                  <div className={`relative rounded-2xl overflow-hidden border aspect-video bg-black shadow-lg ${
                                    isDark ? 'border-slate-800' : 'border-slate-200'
                                  }`}>
                                    <video 
                                      src={msg.media.videoUrl} 
                                      controls 
                                      preload="metadata" 
                                      className="w-full h-full"
                                      poster={msg.media.thumbnail || ''}
                                    />
                                  </div>
                                </div>
                              )}

                              {/* Download Actions */}
                              <div className="flex flex-wrap gap-2 mt-1">
                                {msg.media.videoUrl && (
                                  <a
                                    href={msg.media.videoUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex-1 bg-blue-500 hover:bg-blue-600 text-white font-bold py-1.5 px-3 rounded-xl text-[10px] text-center transition flex items-center justify-center gap-1 shadow"
                                  >
                                    <Download className="w-3.5 h-3.5" /> Ambil Berkas
                                  </a>
                                )}
                                {msg.media.audioUrl && (
                                  <a
                                    href={msg.media.audioUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className={`font-bold py-1.5 px-3 rounded-xl text-[10px] text-center transition flex items-center justify-center gap-1 ${
                                      isDark 
                                        ? 'bg-slate-800 hover:bg-slate-705 text-slate-300 border border-slate-700/50' 
                                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
                                    }`}
                                  >
                                    <Music className="w-3.5 h-3.5" /> Audio MP3
                                  </a>
                                )}
                              </div>
                            </div>
                          )}

                          <span className={`text-[9px] self-end mt-1 ${msg.sender === 'user' ? 'text-blue-100' : 'text-slate-500'}`}>
                            {msg.timestamp}
                          </span>
                        </div>
                      </motion.div>
                    ))}

                    {isBotTyping && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex justify-start"
                      >
                        <div className={`rounded-2xl rounded-tl-none px-4 py-3 shadow-sm flex items-center gap-1.5 ${
                          isDark ? 'bg-slate-900 border border-slate-800 text-slate-300' : 'bg-white border border-slate-100 text-slate-700'
                        }`}>
                          <span className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></span>
                          <span className="w-2 h-2 bg-blue-500 rounded-full animate-bounce delay-100"></span>
                          <span className="w-2 h-2 bg-blue-500 rounded-full animate-bounce delay-200"></span>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                  <div ref={chatEndRef} />
                </div>

                {/* Chat Form Footer */}
                <form onSubmit={sendSimMessage} className={`p-3 flex gap-2 border-t ${
                  isDark ? 'bg-slate-900 border-slate-800' : 'bg-slate-100 border-slate-200'
                }`}>
                  <input
                    type="text"
                    placeholder="Masukkan link TikTok / Instagram, atau ketik pesan..."
                    value={simInput}
                    onChange={(e) => setSimInput(e.target.value)}
                    className={`flex-1 rounded-2xl px-4 py-2.5 text-xs transition ${inputClass}`}
                  />
                  <button
                    type="submit"
                    disabled={!simInput.trim() || isBotTyping}
                    className="bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white rounded-2xl px-4 py-2.5 flex items-center justify-center transition shadow-md flex-shrink-0 cursor-pointer"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </form>
              </div>
            </div>

            {/* COLUMN 3: WEB EXTRACTOR & LOG CONSOLE (Right Column - Instant Access) */}
            <div className={`flex flex-col gap-6 transition-all duration-300 ${
              currentUser 
                ? "md:col-span-3 w-full" 
                : "max-w-2xl w-full"
            } ${activeTab === 'downloader' ? 'block' : 'hidden md:flex'}`}>
              
              {/* INSTANT WEB DOWNLOADER CARD */}
              <section id="instant_downloader_card" className={`${cardClass} p-5 flex flex-col gap-4 transition-all duration-300`}>
                <div className={`flex items-center gap-2.5 pb-2 border-b ${borderClass}`}>
                  <Download className="w-5 h-5 text-blue-500" />
                  <h2 className="font-bold">Ekstraktor Web</h2>
                </div>
                
                <p className="text-xs text-slate-505 leading-relaxed">
                  Ekstrak berkas dari link TikTok/Instagram secara langsung di browser Anda:
                </p>

                <form onSubmit={handleWebDownload} className="flex flex-col gap-3">
                  <input
                    type="url"
                    placeholder="Tempel link video di sini..."
                    value={downloadInput}
                    onChange={(e) => setDownloadInput(e.target.value)}
                    className={`w-full rounded-2xl px-3.5 py-2.5 text-xs transition ${inputClass}`}
                    required
                  />

                  <button
                    type="submit"
                    disabled={downloadLoading}
                    className="bg-blue-500 hover:bg-blue-600 disabled:opacity-60 text-white font-bold py-2.5 px-4 rounded-2xl text-xs transition shadow-lg flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {downloadLoading ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Sedang Mengekstrak...
                      </>
                    ) : (
                      <>
                        <Download className="w-3.5 h-3.5" /> Ekstrak Media
                      </>
                    )}
                  </button>
                </form>

                {/* Downloader Error */}
                {downloadError && (
                  <div className="bg-red-500/10 border border-red-500/20 p-3 rounded-2xl text-red-500 text-xs flex gap-2">
                    <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <span>{downloadError}</span>
                  </div>
                )}

                {/* Web Downloader Result Frame */}
                {downloadResult && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className={`rounded-2xl border p-3.5 flex flex-col gap-3 ${innerCardClass}`}
                  >
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-extrabold uppercase ${getMediaSourceColor(downloadResult.source)}`}>
                        {downloadResult.source}
                      </span>
                      <span className="text-[10px] text-slate-500 font-semibold font-mono uppercase">FORMAT: SANGAT LENGKAP</span>
                    </div>

                    {downloadResult.thumbnail && (
                      <div className={`relative aspect-video rounded-xl overflow-hidden border ${
                        isDark ? 'bg-slate-900 border-slate-800' : 'bg-slate-100 border-slate-200'
                      }`}>
                        <img src={downloadResult.thumbnail} alt="cover" className="object-cover w-full h-full" />
                      </div>
                    )}

                    <div className="flex flex-col gap-1">
                      <h4 className={`text-xs font-bold line-clamp-2 leading-snug ${isDark ? 'text-slate-100' : 'text-slate-800'}`}>{downloadResult.title}</h4>
                      <p className="text-[10px] text-slate-500 font-medium">Pembuat: <span className={`font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>{downloadResult.author}</span></p>
                    </div>

                    {/* Slideshow list if any */}
                    {downloadResult.isSlideshow && downloadResult.images && downloadResult.images.length > 0 && (
                      <div className={`flex flex-col gap-1.5 border-t pt-2.5 ${borderClass}`}>
                        <span className="text-[10px] font-bold text-slate-500">Daftar Foto ({downloadResult.images.length})</span>
                        <div className="flex gap-2 overflow-x-auto pb-1.5 scrollbar-thin">
                          {downloadResult.images.map((imgUrl: string, idx: number) => (
                            <a 
                              key={idx} 
                              href={imgUrl} 
                              target="_blank" 
                              rel="noopener noreferrer" 
                              className={`w-12 h-12 rounded border overflow-hidden flex-shrink-0 hover:opacity-80 transition ${
                                isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
                              }`}
                            >
                              <img src={imgUrl} alt={`slide-${idx}`} className="w-full h-full object-cover" />
                            </a>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Format based Download Links */}
                    <div className={`flex flex-col gap-2 mt-1 pt-2.5 border-t ${borderClass}`}>
                      {downloadResult.videoUrl && (
                        <a
                          href={downloadResult.videoUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="bg-blue-500 hover:bg-blue-600 text-white font-extrabold py-2 px-3 rounded-xl text-xs text-center transition flex items-center justify-center gap-1.5 shadow"
                        >
                          <Download className="w-4 h-4" /> Unduh Media Video HD
                        </a>
                      )}
                      
                      {(downloadResult.videoUrl || (downloadResult.images && downloadResult.images[0])) && (
                        <a
                          href={downloadResult.videoUrl || (downloadResult.images && downloadResult.images[0])}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`font-extrabold py-2 px-3 rounded-xl text-xs text-center transition flex items-center justify-center gap-1.5 ${
                            isDark 
                              ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700' 
                              : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200'
                          }`}
                        >
                          <Download className="w-4 h-4" /> Unduh Berkas Asli (Dokumen)
                        </a>
                      )}

                      {(downloadResult.audioUrl || downloadResult.videoUrl) && (
                        <a
                          href={downloadResult.audioUrl || downloadResult.videoUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="bg-indigo-500 hover:bg-indigo-600 text-white font-extrabold py-2 px-3 rounded-xl text-xs text-center transition flex items-center justify-center gap-1.5 shadow"
                        >
                          <Music className="w-3.5 h-3.5" /> Unduh Format MP3 Audio
                        </a>
                      )}
                    </div>
                  </motion.div>
                )}
              </section>

              {/* PLATFORMS & FUTURE ADDITIONS CARD */}
              <section id="platforms_status_card" className="flex flex-col transition-all duration-300">
                <span className={`ios-eyebrow ${labelClass}`}>Layanan Ekstraksi</span>
                <div className={`${cardClass} rounded-2xl overflow-hidden`}>
                  {[
                    { name: 'TikTok', dot: 'bg-blue-500' },
                    { name: 'Instagram', dot: 'bg-pink-500' },
                    { name: 'YouTube', dot: 'bg-red-500' },
                    { name: 'Twitter / X', dot: 'bg-indigo-400' },
                    { name: 'Facebook Video & Reels', dot: 'bg-indigo-500' },
                  ].map((p) => (
                    <div key={p.name} className="ios-row">
                      <span className="flex items-center gap-2 text-[13px] font-medium">
                        <span className={`w-1.5 h-1.5 rounded-full ${p.dot} animate-pulse`}></span>
                        {p.name}
                      </span>
                      <span className="text-[11px] font-semibold text-blue-500">Aktif</span>
                    </div>
                  ))}
                </div>
              </section>

              {/* BREAKING NEWS / BERITA TERKINI CARD */}
              <section id="breaking_news_card" className={`${cardClass} p-5 flex flex-col gap-3.5 transition-all duration-300`}>
                <div className={`flex items-center justify-between pb-2 border-b ${borderClass}`}>
                  <div className="flex items-center gap-2.5">
                    <Newspaper className="w-5 h-5 text-blue-500" />
                    <h2 className="font-bold">Breaking News / Berita Terkini</h2>
                  </div>
                  <button 
                    onClick={fetchNews} 
                    disabled={newsLoading}
                    type="button"
                    className="p-1.5 rounded-xl transition hover:bg-blue-500/10 text-blue-500 cursor-pointer"
                    title="Segarkan Berita"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${newsLoading ? 'animate-spin' : ''}`} />
                  </button>
                </div>

                <p className="text-[10.5px] text-slate-500 leading-relaxed -mt-1">
                  Pantau perkembangan teknologi, AI, dan berita terkini di Indonesia secara real-time:
                </p>

                {newsLoading ? (
                  <div className="flex flex-col items-center justify-center py-6 gap-2">
                    <RefreshCw className="w-6 h-6 text-blue-500 animate-spin" />
                    <span className="text-[10px] text-slate-500 font-bold animate-pulse">Memuat berita hangat...</span>
                  </div>
                ) : newsError ? (
                  <div className="text-[10.5px] text-red-500 text-center py-4 font-semibold">
                    {newsError}
                  </div>
                ) : (
                  <div className="flex flex-col gap-2.5 max-h-[250px] overflow-y-auto scrollbar-thin pr-1">
                    {newsList.map((item, idx) => (
                      <a 
                        key={idx} 
                        href={item.link !== '#' ? item.link : undefined}
                        target={item.link !== '#' ? "_blank" : undefined}
                        rel="noopener noreferrer"
                        className={`group p-2 rounded-2xl flex gap-2.5 transition hover:scale-[1.01] ${innerCardClass} ${
                          item.link !== '#' ? 'cursor-pointer' : ''
                        }`}
                      >
                        <div className="w-14 h-14 rounded-xl overflow-hidden flex-shrink-0 bg-slate-800">
                          <img 
                            src={item.imageUrl} 
                            alt="news-thumbnail" 
                            className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                            referrerPolicy="no-referrer"
                          />
                        </div>
                        <div className="min-w-0 flex-1 flex flex-col justify-between">
                          <div>
                            <h4 className={`text-[10.5px] font-bold leading-snug line-clamp-2 transition ${
                              isDark ? 'group-hover:text-blue-400 text-slate-100' : 'group-hover:text-blue-600 text-slate-800'
                            }`}>
                              {item.title}
                            </h4>
                            <p className="text-[9.5px] text-slate-400 line-clamp-1 mt-0.5">{item.description}</p>
                          </div>
                          <div className="flex items-center justify-between text-[8.5px] text-slate-500 font-bold mt-1 uppercase tracking-wider">
                            <span className="truncate max-w-[100px]">{item.creator}</span>
                            <span>{item.pubDate}</span>
                          </div>
                        </div>
                      </a>
                    ))}
                  </div>
                )}
              </section>

              {/* EVENT LOG CONSOLE CARD */}
              <section id="logs_card" className={`${cardClass} p-5 flex flex-col gap-3 transition-all duration-300`}>
                <div className={`flex items-center gap-2.5 pb-2 border-b ${borderClass}`}>
                  <FileText className="w-5 h-5 text-blue-500" />
                  <h2 className="font-bold">Log Konsol Aktivitas</h2>
                </div>
                
                <div className={`p-3 rounded-2xl h-36 overflow-y-auto flex flex-col gap-2 font-mono text-[9px] leading-relaxed scrollbar-thin ${innerCardClass}`}>
                  {botStatusLogs.length === 0 ? (
                    <span className="text-slate-500 text-center italic mt-10 block">Belum ada aktivitas terekam.</span>
                  ) : (
                    botStatusLogs.map((log) => (
                      <div key={log.id} className="flex items-start gap-1.5 border-b border-black/5 dark:border-white/5 pb-1.5">
                        <span className="text-slate-500 shrink-0 font-sans">{log.time}</span>
                        <span className={`font-bold shrink-0 ${
                          log.type === 'success' ? 'text-green-500' :
                          log.type === 'error' ? 'text-red-500' :
                          log.type === 'warning' ? 'text-yellow-500' :
                          'text-indigo-500'
                        }`}>
                          [{log.type.toUpperCase()}]
                        </span>
                        <span className={isDark ? 'text-slate-300 break-all' : 'text-slate-700 break-all'}>{log.message}</span>
                      </div>
                    ))
                  )}
                </div>
              </section>
            </div>
          </motion.main>
        )}
      </AnimatePresence>

      {/* FOOTER */}
      <footer id="app_footer" className={`border-t py-4 px-4 pb-24 md:pb-4 mt-auto transition-colors duration-300 ${
        isDark ? 'bg-black border-white/10 text-slate-500' : 'bg-slate-100 border-slate-200 text-slate-500'
      }`}>
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px]">
          <span className="font-medium">Chonix Bot Dashboard © 2026. Semua Hak Dilindungi.</span>
          <div className="flex gap-4">
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse"></span> 
              JSONBin Database Synchronized
            </span>
            <span>Didukung oleh API Gemini & Cobalt Engine</span>
          </div>
        </div>
      </footer>

      {/* iOS-style bottom tab bar — primary navigation on mobile/tablet, mirrors the top segmented control on desktop */}
      {currentUser && (
        <nav
          className={`md:hidden fixed bottom-0 inset-x-0 z-40 pb-safe border-t backdrop-blur-xl transition-colors duration-300 ${
            isDark ? 'bg-black/80 border-white/10' : 'bg-white/80 border-slate-200/80'
          }`}
        >
          <div className="grid grid-cols-3">
            {([
              { key: 'manager', label: 'Manager', Icon: Settings },
              { key: 'simulator', label: 'Simulator', Icon: Send },
              { key: 'downloader', label: 'Extractor', Icon: Download },
            ] as const).map(({ key, label, Icon }) => {
              const active = activeTab === key;
              return (
                <button
                  key={key}
                  onClick={() => setActiveTab(key)}
                  className="flex flex-col items-center justify-center gap-1 py-2.5 cursor-pointer"
                  aria-label={label}
                  aria-current={active ? 'page' : undefined}
                >
                  <Icon
                    className="w-[22px] h-[22px]"
                    strokeWidth={active ? 2.4 : 1.8}
                    color={active ? 'var(--ios-blue)' : (isDark ? '#8E8E93' : '#8A8A8E')}
                  />
                  <span
                    className="text-[10px] font-medium"
                    style={{ color: active ? 'var(--ios-blue)' : (isDark ? '#8E8E93' : '#8A8A8E') }}
                  >
                    {label}
                  </span>
                </button>
              );
            })}
          </div>
        </nav>
      )}

      {/* FLOATING ANIMATED TOAST NOTIFICATIONS */}
      <div className="fixed bottom-5 md:bottom-5 right-0 md:right-5 z-50 flex flex-col gap-2 max-w-sm w-[90%] sm:w-full pointer-events-none px-4 md:px-0" style={{ bottom: 'max(1.25rem, calc(env(safe-area-inset-bottom) + 4.5rem))' }}>
        <AnimatePresence>
          {notifications.map((notif) => (
            <motion.div
              key={notif.id}
              layout
              initial={{ opacity: 0, y: 50, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.85, transition: { duration: 0.2 } }}
              className={`pointer-events-auto p-3.5 rounded-2xl border shadow-xl flex items-start gap-3 transition-colors ${
                notif.type === 'success' 
                  ? 'bg-slate-900/95 border-blue-500/30 text-blue-400 dark:bg-slate-950/95 shadow-blue-500/5' 
                  : notif.type === 'error'
                    ? 'bg-slate-900/95 border-red-500/30 text-red-400 dark:bg-slate-950/95 shadow-red-500/5'
                    : notif.type === 'warning'
                      ? 'bg-slate-900/95 border-amber-500/30 text-amber-400 dark:bg-slate-950/95 shadow-amber-500/5'
                      : 'bg-slate-900/95 border-slate-800 text-slate-200 dark:bg-slate-950/95'
              }`}
            >
              {notif.type === 'success' && <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-green-500 mt-0.5" />}
              {notif.type === 'error' && <XCircle className="w-4 h-4 flex-shrink-0 text-red-500 mt-0.5" />}
              {notif.type === 'warning' && <AlertTriangle className="w-4 h-4 flex-shrink-0 text-amber-500 mt-0.5" />}
              {notif.type === 'info' && <Sparkles className="w-4 h-4 flex-shrink-0 text-indigo-400 mt-0.5" />}
              
              <div className="flex-1 text-xs font-semibold leading-relaxed">
                {notif.message}
              </div>
              
              <button 
                onClick={() => setNotifications(prev => prev.filter(n => n.id !== notif.id))}
                className="text-slate-400 hover:text-slate-200 cursor-pointer transition shrink-0 mt-0.5"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
