import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { cacheUrl, getCachedUrl, getUserByToken, updateUser } from '@/lib/db';
import { getLatestNews } from '@/lib/news';
import abDownloader from 'ab-downloader';
import { igdl, twitter, youtube, fbdown } from 'btch-downloader';

// Simple helper to detect video source
function getSource(url: string): 'tiktok' | 'instagram' | 'youtube' | 'twitter' | 'facebook' | 'other' {
  const lower = url.toLowerCase();
  if (lower.includes('tiktok.com') || lower.includes('vt.tiktok') || lower.includes('douyin.com')) {
    return 'tiktok';
  }
  if (lower.includes('instagram.com') || lower.includes('instagr.am')) {
    return 'instagram';
  }
  if (lower.includes('youtube.com') || lower.includes('youtu.be')) {
    return 'youtube';
  }
  if (lower.includes('twitter.com') || lower.includes('x.com')) {
    return 'twitter';
  }
  if (lower.includes('facebook.com') || lower.includes('fb.watch') || lower.includes('fb.com')) {
    return 'facebook';
  }
  return 'other';
}

// Extract URLs from text
function extractUrl(text: string): string | null {
  const regex = /(https?:\/\/[^\s]+)/gi;
  const match = text.match(regex);
  return match ? match[0] : null;
}

// Download TikTok via TikWM helper
async function fetchTikWM(url: string) {
  try {
    const res = await fetch(`https://www.tikwm.com/api/?url=${encodeURIComponent(url)}`, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      },
    });
    if (!res.ok) return null;
    const json = await res.json();
    if (json.code === 0 && json.data) {
      return json.data;
    }
    return null;
  } catch {
    return null;
  }
}

// Robust list of public Cobalt API instances to bypass rate limits and bans
const COBALT_INSTANCES = [
  'https://api.cobalt.tools',
  'https://cobalt.perrety.dev',
  'https://co.wuk.sh',
  'https://cobalt.api.ryb.red',
  'https://cobalt.hyperborea.cloud',
  'https://cobalt.twic.re',
  'https://cobalt.k6.ovh',
  'https://cobalt.bany.sh'
];

// Download media helper using Cobalt API with fallback rotation
async function fetchCobalt(url: string) {
  for (const instance of COBALT_INSTANCES) {
    const endpoints = [instance, `${instance}/api/json`];
    
    for (const endpoint of endpoints) {
      try {
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          },
          body: JSON.stringify({
            url: url,
            videoQuality: '720',
          }),
        });
        if (!response.ok) continue;
        const json = await response.json();
        if (json.status === 'error') continue;
        return json;
      } catch {
        continue;
      }
    }
  }
  return null;
}

// Download media using ab-downloader as primary endpoint mapping for TikTok
async function fetchAbDownloader(url: string, source: string) {
  try {
    const ab = (abDownloader as any).default || abDownloader;
    if (!ab) return null;

    if (source === 'tiktok') {
      const res = await ab.ttdl(url);
      if (res && res.video) {
        return {
          success: true,
          title: res.title || 'TikTok Video',
          videoUrl: res.video,
          audioUrl: res.audio || '',
          images: [],
          isSlideshow: false,
        };
      }
    } else if (source === 'instagram') {
      const res = await ab.igdl(url);
      if (res && Array.isArray(res) && res.length > 0) {
        const urls = res.map((item: any) => item.url || item);
        const { videos, photos } = await resolveMediaTypes(urls);
        return {
          success: true,
          title: 'Instagram Post',
          videoUrl: videos[0] || '',
          audioUrl: '',
          images: photos,
          isSlideshow: photos.length > 1,
        };
      }
    } else if (source === 'facebook') {
      const res = await ab.fbdown(url);
      if (res && (res.HD || res.Normal_video)) {
        return {
          success: true,
          title: 'Facebook Video',
          videoUrl: res.HD || res.Normal_video,
          audioUrl: '',
          images: [],
          isSlideshow: false,
        };
      }
    } else if (source === 'twitter') {
      const res = await ab.twitter(url);
      if (res && res.url) {
        return {
          success: true,
          title: res.title || 'Twitter Video/Media',
          videoUrl: res.url,
          audioUrl: '',
          images: [],
          isSlideshow: false,
        };
      }
    } else if (source === 'youtube') {
      const res = await ab.youtube(url);
      if (res && (res.mp4 || res.mp3)) {
        return {
          success: true,
          title: res.title || 'YouTube Video',
          videoUrl: res.mp4 || '',
          audioUrl: res.mp3 || '',
          images: [],
          isSlideshow: false,
        };
      }
    }
    return null;
  } catch (error) {
    console.error('ab-downloader Error in webhook:', error);
    return null;
  }
}

// Download media using btch-downloader for other platforms
async function fetchBtchDownloader(url: string, source: string) {
  try {
    if (source === 'instagram') {
      const res = await igdl(url);
      if (res && res.result && res.result.length > 0) {
        const urls = res.result.map((item: any) => item.url || item);
        const { videos, photos } = await resolveMediaTypes(urls);
        return {
          success: true,
          title: 'Instagram Post',
          videoUrl: videos[0] || '',
          audioUrl: '',
          images: photos,
          isSlideshow: photos.length > 1,
        };
      }
    } else if (source === 'facebook') {
      const res = await fbdown(url);
      if (res && (res.HD || res.Normal_video)) {
        return {
          success: true,
          title: 'Facebook Video',
          videoUrl: res.HD || res.Normal_video,
          audioUrl: '',
          images: [],
          isSlideshow: false,
        };
      }
    } else if (source === 'twitter') {
      const res = await twitter(url);
      if (res && res.url) {
        return {
          success: true,
          title: res.title || 'Twitter Video/Media',
          videoUrl: res.url,
          audioUrl: '',
          images: [],
          isSlideshow: false,
        };
      }
    } else if (source === 'youtube') {
      const res = await youtube(url);
      if (res && (res.mp4 || res.mp3)) {
        return {
          success: true,
          title: res.title || 'YouTube Video',
          videoUrl: res.mp4 || '',
          audioUrl: res.mp3 || '',
          images: [],
          isSlideshow: false,
        };
      }
    }
    return null;
  } catch (error) {
    console.error('btch-downloader Error in webhook:', error);
    return null;
  }
}

// Telegram API Helper
async function sendTelegramRequest(token: string, method: string, body: any) {
  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const json = await res.json();
    if (json && !json.ok) {
      console.warn(`Telegram API error on method "${method}":`, json);
    }
    return json;
  } catch (error) {
    console.error(`Telegram API Error (${method}):`, error);
    return null;
  }
}

// Helper to download media to server first to bypass Telegram hotlinking / CDN blocks
async function downloadFileAsBlob(url: string): Promise<{ blob: Blob, filename: string, contentType: string } | null> {
  try {
    // Determine dynamic Referer and Origin to bypass CDN hotlinking restrictions
    let referer = '';
    let origin = '';
    if (url.includes('instagram.com') || url.includes('cdninstagram.com')) {
      referer = 'https://www.instagram.com/';
      origin = 'https://www.instagram.com';
    } else if (url.includes('tiktok.com') || url.includes('tiktokcdn.com')) {
      referer = 'https://www.tiktok.com/';
      origin = 'https://www.tiktok.com';
    } else if (url.includes('facebook.com') || url.includes('fbcdn.net')) {
      referer = 'https://www.facebook.com/';
      origin = 'https://www.facebook.com';
    } else if (url.includes('twitter.com') || url.includes('x.com') || url.includes('twimg.com')) {
      referer = 'https://x.com/';
      origin = 'https://x.com';
    } else if (url.includes('youtube.com') || url.includes('youtu.be') || url.includes('googlevideo.com')) {
      referer = 'https://www.youtube.com/';
      origin = 'https://www.youtube.com';
    }

    const headers: Record<string, string> = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': '*/*',
      'Accept-Language': 'en-US,en;q=0.9,id;q=0.8',
      'Connection': 'keep-alive',
    };

    if (referer) headers['Referer'] = referer;
    if (origin) headers['Origin'] = origin;

    const res = await fetch(url, {
      method: 'GET',
      headers,
      signal: AbortSignal.timeout(45000), // 45 seconds timeout
    });
    if (!res.ok) {
      console.warn(`downloadFileAsBlob failed, HTTP status: ${res.status} for URL: ${url}`);
      return null;
    }
    const contentType = res.headers.get('content-type') || 'application/octet-stream';
    const arrayBuffer = await res.arrayBuffer();
    const blob = new Blob([arrayBuffer], { type: contentType });
    
    // Determine extension from content-type or URL
    let ext = 'bin';
    if (contentType.includes('video/mp4') || contentType.includes('video/')) ext = 'mp4';
    else if (contentType.includes('audio/mpeg') || contentType.includes('audio/mp3') || contentType.includes('audio/')) ext = 'mp3';
    else if (contentType.includes('image/jpeg') || contentType.includes('image/jpg')) ext = 'jpg';
    else if (contentType.includes('image/png')) ext = 'png';
    else if (contentType.includes('image/gif')) ext = 'gif';
    else {
      // Try to get extension from URL
      const urlExtMatch = url.split('?')[0].match(/\.([a-zA-Z0-9]{3,4})$/);
      if (urlExtMatch) {
        ext = urlExtMatch[1];
      }
    }

    const filename = `media_${Date.now()}.${ext}`;
    return { blob, filename, contentType };
  } catch (error) {
    console.error('Error in downloadFileAsBlob:', error);
    return null;
  }
}

// Helper to accurately classify media URL content types via string patterns or fast HEAD requests
async function detectMediaType(url: string): Promise<'video' | 'image'> {
  if (!url) return 'image';
  const cleanUrl = url.split('?')[0].toLowerCase();
  
  if (cleanUrl.endsWith('.mp4') || cleanUrl.endsWith('.mkv') || cleanUrl.endsWith('.mov') || cleanUrl.endsWith('.avi') || cleanUrl.endsWith('.webm') || cleanUrl.includes('.mp4')) {
    return 'video';
  }
  if (cleanUrl.endsWith('.jpg') || cleanUrl.endsWith('.jpeg') || cleanUrl.endsWith('.png') || cleanUrl.endsWith('.webp') || cleanUrl.endsWith('.gif')) {
    return 'image';
  }

  try {
    const res = await fetch(url, {
      method: 'HEAD',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
      signal: AbortSignal.timeout(5000),
    });
    const contentType = res.headers.get('content-type') || '';
    if (contentType.startsWith('video/')) return 'video';
    if (contentType.startsWith('image/')) return 'image';
  } catch {
    // If HEAD request fails/timeout, fall back to checking typical CDN keywords
    if (url.includes('video') || url.includes('reel') || url.includes('.mp4') || url.includes('t50.') || url.includes('fsub')) {
      return 'video';
    }
  }
  return 'image';
}

// Helper to classify multiple URLs into videos and photos in parallel
async function resolveMediaTypes(urls: string[]): Promise<{ videos: string[], photos: string[] }> {
  const videos: string[] = [];
  const photos: string[] = [];
  try {
    await Promise.all(
      urls.map(async (url) => {
        const type = await detectMediaType(url);
        if (type === 'video') {
          videos.push(url);
        } else {
          photos.push(url);
        }
      })
    );
  } catch (err) {
    console.error('Error in resolveMediaTypes:', err);
  }
  return { videos, photos };
}

// Helper to programmatically search YouTube and return the first video URL
async function searchYoutube(query: string): Promise<string | null> {
  try {
    const searchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
    const res = await fetch(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) return null;
    const html = await res.text();
    const jsonMatch = html.match(/"videoId":"([a-zA-Z0-9_-]{11})"/);
    if (jsonMatch && jsonMatch[1]) {
      return `https://www.youtube.com/watch?v=${jsonMatch[1]}`;
    }
    const watchMatch = html.match(/\/watch\?v=([a-zA-Z0-9_-]{11})/);
    if (watchMatch && watchMatch[1]) {
      return `https://www.youtube.com/watch?v=${watchMatch[1]}`;
    }
  } catch (error) {
    console.error('Error searching YouTube:', error);
  }
  return null;
}

// Send binary file to Telegram using multipart/form-data
async function sendTelegramMultipart(
  token: string,
  method: string,
  fields: Record<string, string>,
  fileKey: string,
  fileBlob: Blob,
  fileName: string
) {
  try {
    const formData = new FormData();
    for (const [key, value] of Object.entries(fields)) {
      formData.append(key, value);
    }
    formData.append(fileKey, fileBlob, fileName);

    const res = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
      method: 'POST',
      body: formData, // Do NOT set 'Content-Type' header, fetch handles it automatically!
    });
    const json = await res.json();
    if (json && !json.ok) {
      console.warn(`Telegram Multipart API error on method "${method}":`, json);
    }
    return json;
  } catch (error) {
    console.error(`sendTelegramMultipart Error on method "${method}":`, error);
    return null;
  }
}

// Gemini Helper for Chat Fallback with custom system instructions support
async function generateGeminiReply(message: string, customPrompt?: string): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return 'Halo! Saya adalah Bot Pengunduh semua media sosial tanpa watermark. Cukup kirimkan tautan video/foto Anda, saya akan langsung memprosesnya!';
  }
  try {
    const ai = new GoogleGenAI({ apiKey });
    
    const systemInstruction = customPrompt && customPrompt.trim() 
      ? customPrompt 
      : `Kamu adalah "Chonix Bot", bot Telegram pintar pengunduh semua media sosial (TikTok, Instagram, YouTube, Twitter/X, Facebook) tanpa watermark bertenaga AI Gemini.
Tugas utama kamu adalah membantu pengguna mengunduh video, audio, dan foto.
Jika pengguna mengirim pesan biasa (bukan link), jawab dengan ramah, lucu, dan santai dalam bahasa Indonesia. 
Sebutkan bahwa mereka cukup mengirimkan link video sosial media, dan bot akan langsung mengirimkan medianya kembali!
Gunakan emoji yang sesuai untuk membuatnya asyik.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: [
        {
          role: 'user',
          parts: [{ text: message }]
        }
      ],
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.7,
      }
    });
    return response.text || 'Maaf, saya tidak mengerti. Silakan kirim tautan media sosial yang ingin diunduh!';
  } catch {
    return 'Halo! Silakan kirimkan tautan media sosial Anda untuk saya unduh secara instan!';
  }
}

export async function POST(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json({ error: 'Token is required' }, { status: 400 });
    }

    const update = await request.json();

    // Fetch user settings associated with this bot token
    const user = await getUserByToken(token);

    // Track active chat IDs for broadcasting
    let currentChatId: number | null = null;
    if (update.callback_query?.message?.chat?.id) {
      currentChatId = update.callback_query.message.chat.id;
    } else if (update.message?.chat?.id) {
      currentChatId = update.message.chat.id;
    }

    if (user && currentChatId) {
      const currentUsers = user.telegramUsers || [];
      const chatIdStr = currentChatId.toString();
      if (!currentUsers.includes(chatIdStr)) {
        const updatedUsers = [...currentUsers, chatIdStr];
        await updateUser(user.username, { telegramUsers: updatedUsers });
      }
    }

    // -------------------------------------------------------------------------
    // 1. Handle Callback Query (Button clicks for Send Option)
    // -------------------------------------------------------------------------
    if (update.callback_query) {
      const callbackQuery = update.callback_query;
      const chatId = callbackQuery.message?.chat?.id;
      const messageId = callbackQuery.message?.message_id;
      const callbackData = callbackQuery.data || '';

      // Acknowledge callback immediately to clear loading indicator
      await sendTelegramRequest(token, 'answerCallbackQuery', {
        callback_query_id: callbackQuery.id,
        text: 'Mengunduh media pilihan Anda...',
      });

      if (!chatId || !callbackData.includes(':')) {
        return NextResponse.json({ success: true });
      }

      // Process download and sending asynchronously in the background
      // to prevent Telegram webhook timeout and duplicated retry requests.
      (async () => {
        try {
          const [selectedFormat, urlHash] = callbackData.split(':');
          const targetUrl = await getCachedUrl(urlHash);

          if (!targetUrl) {
            await sendTelegramRequest(token, 'sendMessage', {
              chat_id: chatId,
              text: '❌ *Tautan kedaluwarsa!*\nSilakan kirimkan kembali link sosial media Anda.',
              parse_mode: 'Markdown',
            });
            return;
          }

          // Edit message to indicate extraction has started
          await sendTelegramRequest(token, 'editMessageText', {
            chat_id: chatId,
            message_id: messageId,
            text: `⏳ *Sedang Mengekstrak Media...*\n\n` +
              `Proses ini memerlukan waktu beberapa saat untuk mengunduh media dari server CDN sosial media.\n` +
              `_Mohon tunggu sebentar ya, jangan kirim perintah lain selama proses ini berjalan..._`,
            parse_mode: 'Markdown',
          });

          const source = getSource(targetUrl);

          // Perform Download
          let downloadData: any = null;

          // 1. Try primary downloader with dual backup fallback (ab-downloader and btch-downloader)
          if (source === 'tiktok') {
            downloadData = await fetchAbDownloader(targetUrl, source);
            if (!downloadData) {
              console.log('ab-downloader failed for tiktok, trying btch-downloader...');
              downloadData = await fetchBtchDownloader(targetUrl, source);
            }
          } else {
            downloadData = await fetchBtchDownloader(targetUrl, source);
            if (!downloadData) {
              console.log('btch-downloader failed, trying ab-downloader...');
              downloadData = await fetchAbDownloader(targetUrl, source);
            }
          }

          // 2. Fallback to Cobalt
          if (!downloadData) {
            console.log('Primary downloader failed, falling back to Cobalt...');
            const mediaResult = await fetchCobalt(targetUrl);
            if (mediaResult) {
              if (mediaResult.status === 'picker') {
                const images = (mediaResult.picker || [])
                  .filter((item: any) => item.type === 'photo' || item.url)
                  .map((item: any) => item.url);
                
                const firstVideo = (mediaResult.picker || []).find((item: any) => item.type === 'video');

                downloadData = {
                  success: true,
                  title: mediaResult.text || 'Media',
                  videoUrl: firstVideo?.url || '',
                  images,
                  isSlideshow: images.length > 0,
                };
              } else if (mediaResult.url) {
                downloadData = {
                  success: true,
                  title: mediaResult.text || 'Video',
                  videoUrl: mediaResult.url,
                  images: [],
                  isSlideshow: false,
                };
              }
            }
          }

          // 3. Fallback to TikWM for TikTok
          if (!downloadData && source === 'tiktok') {
            console.log('Cobalt failed, falling back to TikWM for TikTok...');
            const tikwmData = await fetchTikWM(targetUrl);
            if (tikwmData) {
              const isSlideshow = tikwmData.images && tikwmData.images.length > 0;
              downloadData = {
                success: true,
                title: tikwmData.title || 'TikTok Video',
                videoUrl: tikwmData.play || tikwmData.wmplay || '',
                audioUrl: tikwmData.music || '',
                images: tikwmData.images || [],
                isSlideshow,
              };
            }
          }

          if (downloadData && (downloadData.videoUrl || (downloadData.images && downloadData.images.length > 0))) {
            // Update message to indicate upload has started
            await sendTelegramRequest(token, 'editMessageText', {
              chat_id: chatId,
              message_id: messageId,
              text: `⏳ *Media berhasil diekstrak!*\n\n` +
                `Sedang mengunggah berkas media ke Telegram Anda...\n` +
                `_Mohon tunggu sebentar ya, proses kirim/upload file besar mungkin butuh beberapa detik extra..._`,
              parse_mode: 'Markdown',
            });
            // Increment user downloads count if user is found
            const user = await getUserByToken(token);
            if (user) {
              await updateUser(user.username, { downloadsCount: (user.downloadsCount || 0) + 1 });
            }

            // Get Bot Username dynamically using token
            let botUsername = callbackQuery.message?.from?.username;
            if (!botUsername || botUsername.toLowerCase() === 'chonixbot' || botUsername.toLowerCase() === 'unduhbot') {
              try {
                const botMeRes = await fetch(`https://api.telegram.org/bot${token}/getMe`);
                const botMeJson = await botMeRes.json();
                if (botMeJson.ok && botMeJson.result?.username) {
                  botUsername = botMeJson.result.username;
                }
              } catch (e) {
                console.error('Error fetching bot username in webhook:', e);
              }
            }
            if (!botUsername) {
              botUsername = 'ChonixBot';
            }

            const formatName = selectedFormat === 'fmt_file' 
              ? '📁 Dokumen/File' 
              : selectedFormat === 'fmt_audio' 
                ? '🎵 Audio MP3' 
                : '📹 Media (Video/Foto)';

            // Robust and safe HTML escape for the title to prevent parse errors in Telegram captions
            const escapedTitle = downloadData.title
              ? downloadData.title
                  .replace(/&/g, '&amp;')
                  .replace(/</g, '&lt;')
                  .replace(/>/g, '&gt;')
                  .substring(0, 150) + '...'
              : '-';

            const caption = `📥 <b>Berhasil Diunduh!</b>\n\n` +
              `📝 <b>Judul:</b> ${escapedTitle}\n` +
              `⚙️ <b>Format:</b> ${formatName}\n` +
              `🤖 <b>Bot:</b> @${botUsername}`;

            let sendSuccess = false;
            let lastError = '';

            // Send based on format selection
            if (selectedFormat === 'fmt_audio') {
              const audioUrl = downloadData.audioUrl || downloadData.videoUrl;
              if (audioUrl) {
                // First, try downloading and sending as a binary file (much more robust)
                const downloaded = await downloadFileAsBlob(audioUrl);
                if (downloaded) {
                  const apiRes = await sendTelegramMultipart(
                    token,
                    'sendAudio',
                    {
                      chat_id: chatId.toString(),
                      caption: caption,
                      parse_mode: 'HTML',
                    },
                    'audio',
                    downloaded.blob,
                    downloaded.filename
                  );
                  if (apiRes && apiRes.ok) {
                    sendSuccess = true;
                  } else {
                    lastError = apiRes?.description || 'Gagal mengirim berkas audio binary.';
                  }
                }

                // Fallback to sending raw URL if binary upload failed or couldn't download
                if (!sendSuccess) {
                  console.log('Binary upload failed, falling back to direct URL for sendAudio...');
                  const apiRes = await sendTelegramRequest(token, 'sendAudio', {
                    chat_id: chatId,
                    audio: audioUrl,
                    caption: caption,
                    parse_mode: 'HTML',
                  });
                  if (apiRes && apiRes.ok) {
                    sendSuccess = true;
                  } else {
                    lastError = apiRes?.description || lastError || 'Gagal mengirim audio.';
                  }
                }
              } else {
                lastError = 'Audio tidak tersedia untuk tautan ini.';
              }
            } else if (selectedFormat === 'fmt_file') {
              // Send as document file
              const docUrl = downloadData.videoUrl || (downloadData.images && downloadData.images[0]);
              if (docUrl) {
                // First, try downloading and sending as binary document (guarantees file format and works perfectly)
                const downloaded = await downloadFileAsBlob(docUrl);
                if (downloaded) {
                  const apiRes = await sendTelegramMultipart(
                    token,
                    'sendDocument',
                    {
                      chat_id: chatId.toString(),
                      caption: caption,
                      parse_mode: 'HTML',
                    },
                    'document',
                    downloaded.blob,
                    downloaded.filename
                  );
                  if (apiRes && apiRes.ok) {
                    sendSuccess = true;
                  } else {
                    lastError = apiRes?.description || 'Gagal mengirim berkas dokumen binary.';
                  }
                }

                // Fallback to sending raw URL if binary upload failed
                if (!sendSuccess) {
                  console.log('Binary upload failed, falling back to direct URL for sendDocument...');
                  const apiRes = await sendTelegramRequest(token, 'sendDocument', {
                    chat_id: chatId,
                    document: docUrl,
                    caption: caption,
                    parse_mode: 'HTML',
                  });
                  if (apiRes && apiRes.ok) {
                    sendSuccess = true;
                  } else {
                    lastError = apiRes?.description || lastError || 'Gagal mengirim dokumen.';
                  }
                }
              } else {
                lastError = 'Gagal mengirim sebagai file.';
              }
            } else {
              // Regular Media (Video or Single Photo or Slideshow)
              if (downloadData.isSlideshow && downloadData.images.length > 0) {
                const mediaGroup = downloadData.images.slice(0, 10).map((imgUrl: string, idx: number) => ({
                  type: 'photo',
                  media: imgUrl,
                  caption: idx === 0 ? caption : undefined,
                  parse_mode: 'HTML',
                }));

                const apiRes = await sendTelegramRequest(token, 'sendMediaGroup', {
                  chat_id: chatId,
                  media: mediaGroup,
                });
                if (apiRes && apiRes.ok) {
                  sendSuccess = true;
                } else {
                  // Fallback: If media group fails, try to send the first photo as binary upload!
                  console.log('sendMediaGroup failed, falling back to sending first photo as binary upload...');
                  const firstImgUrl = downloadData.images[0];
                  const downloaded = await downloadFileAsBlob(firstImgUrl);
                  if (downloaded) {
                    const singlePhotoRes = await sendTelegramMultipart(
                      token,
                      'sendPhoto',
                      {
                        chat_id: chatId.toString(),
                        caption: caption,
                        parse_mode: 'HTML',
                      },
                      'photo',
                      downloaded.blob,
                      downloaded.filename
                    );
                    if (singlePhotoRes && singlePhotoRes.ok) {
                      sendSuccess = true;
                    } else {
                      lastError = singlePhotoRes?.description || 'Gagal mengirim satu foto binary.';
                    }
                  }
                  if (!sendSuccess) {
                    lastError = apiRes?.description || 'Gagal mengirim kumpulan foto.';
                  }
                }
              } else if (downloadData.videoUrl) {
                // First, try downloading and sending as binary video
                const downloaded = await downloadFileAsBlob(downloadData.videoUrl);
                if (downloaded) {
                  const apiRes = await sendTelegramMultipart(
                    token,
                    'sendVideo',
                    {
                      chat_id: chatId.toString(),
                      caption: caption,
                      parse_mode: 'HTML',
                    },
                    'video',
                    downloaded.blob,
                    downloaded.filename
                  );
                  if (apiRes && apiRes.ok) {
                    sendSuccess = true;
                  } else {
                    lastError = apiRes?.description || 'Gagal mengirim berkas video binary.';
                  }
                }

                // Fallback to sending raw URL if binary upload failed
                if (!sendSuccess) {
                  console.log('Binary upload failed, falling back to direct URL for sendVideo...');
                  const apiRes = await sendTelegramRequest(token, 'sendVideo', {
                    chat_id: chatId,
                    video: downloadData.videoUrl,
                    caption: caption,
                    parse_mode: 'HTML',
                  });
                  if (apiRes && apiRes.ok) {
                    sendSuccess = true;
                  } else {
                    lastError = apiRes?.description || lastError || 'Gagal mengirim video.';
                  }
                }
              } else if (downloadData.images && downloadData.images.length > 0) {
                // First, try downloading and sending as binary photo
                const downloaded = await downloadFileAsBlob(downloadData.images[0]);
                if (downloaded) {
                  const apiRes = await sendTelegramMultipart(
                    token,
                    'sendPhoto',
                    {
                      chat_id: chatId.toString(),
                      caption: caption,
                      parse_mode: 'HTML',
                    },
                    'photo',
                    downloaded.blob,
                    downloaded.filename
                  );
                  if (apiRes && apiRes.ok) {
                    sendSuccess = true;
                  } else {
                    lastError = apiRes?.description || 'Gagal mengirim berkas foto binary.';
                  }
                }

                // Fallback to sending raw URL if binary upload failed
                if (!sendSuccess) {
                  console.log('Binary upload failed, falling back to direct URL for sendPhoto...');
                  const apiRes = await sendTelegramRequest(token, 'sendPhoto', {
                    chat_id: chatId,
                    photo: downloadData.images[0],
                    caption: caption,
                    parse_mode: 'HTML',
                  });
                  if (apiRes && apiRes.ok) {
                    sendSuccess = true;
                  } else {
                    lastError = apiRes?.description || lastError || 'Gagal mengirim foto.';
                  }
                }
              } else {
                lastError = 'Tidak ada tautan video/foto yang ditemukan.';
              }
            }

            // Delete progress indicator message on success or fallback
            await sendTelegramRequest(token, 'deleteMessage', {
              chat_id: chatId,
              message_id: messageId,
            });

            // FALLBACK: If sending media directly failed (due to size limit, hotlink blocking, etc.), send direct link
            if (!sendSuccess) {
              const directUrl = downloadData.videoUrl || downloadData.audioUrl || (downloadData.images && downloadData.images[0]);
              if (directUrl) {
                const downloadButton = {
                  inline_keyboard: [
                    [
                      { text: '📥 Klik Untuk Unduh Langsung', url: directUrl }
                    ]
                  ]
                };

                await sendTelegramRequest(token, 'sendMessage', {
                  chat_id: chatId,
                  text: `⚠️ *Gagal Mengirim Media Secara Langsung!*\n\n` +
                    `Telegram tidak dapat memproses file secara langsung (kemungkinan karena ukuran file melebihi batas Telegram, proteksi hotlinking CDN, atau ketidakstabilan rute).\n\n` +
                    `📝 *Judul:* \`${escapedTitle}\`\n\n` +
                    `Anda masih dapat mengunduhnya secara aman dan langsung melalui tautan tombol di bawah ini:`,
                  parse_mode: 'Markdown',
                  reply_markup: JSON.stringify(downloadButton),
                });
              } else {
                await sendTelegramRequest(token, 'sendMessage', {
                  chat_id: chatId,
                  text: `❌ *Gagal Mengirim Media:* ${lastError || 'Tautan tidak valid atau tidak didukung.'}`,
                  parse_mode: 'Markdown',
                });
              }
            }
          } else {
            // Delete progress indicator on download failure
            await sendTelegramRequest(token, 'deleteMessage', {
              chat_id: chatId,
              message_id: messageId,
            });

            await sendTelegramRequest(token, 'sendMessage', {
              chat_id: chatId,
              text: `❌ *Gagal Mengunduh Media!*\nTautan mungkin privat, terhapus, atau server sedang sibuk. Silakan coba sesaat lagi.`,
              parse_mode: 'Markdown',
            });
          }
        } catch (bgErr) {
          console.error('Asynchronous callback query handler error:', bgErr);
        }
      })();

      return NextResponse.json({ success: true });
    }

    // -------------------------------------------------------------------------
    // 2. Handle standard Messages
    // -------------------------------------------------------------------------
    const message = update.message;
    if (!message || !message.chat || !message.chat.id) {
      return NextResponse.json({ success: true });
    }

    const chatId = message.chat.id;
    const messageText = message.text || '';
    const cleanMessageText = messageText.trim();
    const lowerMessageText = cleanMessageText.toLowerCase();

    // Identify media command prefix early
    let hasMediaCommand = false;
    let targetUrl = '';
    
    if (lowerMessageText.startsWith('/ig ') || lowerMessageText.startsWith('/instagram ')) {
      hasMediaCommand = true;
      targetUrl = cleanMessageText.replace(/^\/ig\s+/i, '').replace(/^\/instagram\s+/i, '').trim();
    } else if (lowerMessageText.startsWith('/tt ') || lowerMessageText.startsWith('/tiktok ')) {
      hasMediaCommand = true;
      targetUrl = cleanMessageText.replace(/^\/tt\s+/i, '').replace(/^\/tiktok\s+/i, '').trim();
    }

    // -------------------------------------------------------------------------
    // 2.ab Handle YouTube music play command (/play <query> or /p <query>)
    // -------------------------------------------------------------------------
    const isPlayCommand = lowerMessageText.startsWith('/play') || lowerMessageText.startsWith('/p ') || lowerMessageText === '/p';
    if (isPlayCommand) {
      let query = '';
      if (lowerMessageText.startsWith('/play ')) {
        query = cleanMessageText.substring(6).trim();
      } else if (lowerMessageText.startsWith('/p ')) {
        query = cleanMessageText.substring(3).trim();
      } else {
        // Just "/play" or "/p"
        await sendTelegramRequest(token, 'sendMessage', {
          chat_id: chatId,
          text: `🎵 *Fitur Play YouTube*\n\n` +
            `Gunakan perintah ini untuk mengunduh audio (MP3) atau video dari YouTube dengan cepat layaknya bot musik Discord.\n\n` +
            `• *Format:* \`/play <judul lagu / link>\` atau \`/p <judul lagu / link>\`\n` +
            `• *Contoh:* \`/play perfect ed sheeran\` atau \`/p https://youtu.be/xxx\``,
          parse_mode: 'Markdown',
          reply_to_message_id: message.message_id,
        });
        return NextResponse.json({ success: true });
      }

      await sendTelegramRequest(token, 'sendChatAction', { chat_id: chatId, action: 'typing' });

      // Send initial searching message
      const loadingMsg = await sendTelegramRequest(token, 'sendMessage', {
        chat_id: chatId,
        text: `🔍 *Mencari "${query}" di YouTube...*\nMohon tunggu sebentar ya!`,
        parse_mode: 'Markdown',
        reply_to_message_id: message.message_id,
      });

      const loadingMsgId = loadingMsg?.result?.message_id;

      // Search or use direct link
      let playUrl = '';
      if (query.startsWith('http://') || query.startsWith('https://')) {
        playUrl = query;
      } else {
        const foundUrl = await searchYoutube(query);
        if (foundUrl) {
          playUrl = foundUrl;
        }
      }

      if (!playUrl) {
        if (loadingMsgId) {
          await sendTelegramRequest(token, 'editMessageText', {
            chat_id: chatId,
            message_id: loadingMsgId,
            text: `❌ *Gagal menemukan lagu/video "${query}" di YouTube!*\nCoba masukkan kata kunci yang berbeda atau link langsung.`,
            parse_mode: 'Markdown',
          });
        }
        return NextResponse.json({ success: true });
      }

      // Update message to extraction state
      if (loadingMsgId) {
        await sendTelegramRequest(token, 'editMessageText', {
          chat_id: chatId,
          message_id: loadingMsgId,
          text: `⏳ *Menemukan video!* \n\nSedang mengunduh dan mengekstrak audio MP3...\n_Proses ini mungkin memakan waktu beberapa saat, jangan kirim perintah lain._`,
          parse_mode: 'Markdown',
        });
      }

      // Run background extraction & upload
      (async () => {
        try {
          const source = 'youtube';
          let downloadData: any = null;

          // Try btch-downloader first
          downloadData = await fetchBtchDownloader(playUrl, source);
          if (!downloadData) {
            console.log('/play: btch-downloader failed, trying ab-downloader...');
            downloadData = await fetchAbDownloader(playUrl, source);
          }

          // Fallback to Cobalt
          if (!downloadData) {
            console.log('/play: falling back to Cobalt...');
            const mediaResult = await fetchCobalt(playUrl);
            if (mediaResult && mediaResult.url) {
              downloadData = {
                success: true,
                title: mediaResult.text || 'YouTube Audio',
                videoUrl: mediaResult.url,
                audioUrl: mediaResult.url,
                images: [],
                isSlideshow: false,
              };
            }
          }

          if (downloadData && (downloadData.audioUrl || downloadData.videoUrl)) {
            const audioUrl = downloadData.audioUrl || downloadData.videoUrl;

            // Increment user downloads count
            if (user) {
              await updateUser(user.username, { downloadsCount: (user.downloadsCount || 0) + 1 });
            }

            // Update status to upload
            if (loadingMsgId) {
              await sendTelegramRequest(token, 'editMessageText', {
                chat_id: chatId,
                message_id: loadingMsgId,
                text: `⏳ *Audio berhasil diekstrak!*\n\nSedang mengunggah berkas MP3 ke Telegram Anda...\n_Mohon tetap berada di chat ini ya._`,
                parse_mode: 'Markdown',
              });
            }

            // Get bot username
            let botUsername = 'ChonixBot';
            try {
              const botMeRes = await fetch(`https://api.telegram.org/bot${token}/getMe`);
              const botMeJson = await botMeRes.json();
              if (botMeJson.ok && botMeJson.result?.username) {
                botUsername = botMeJson.result.username;
              }
            } catch (e) {
              console.error('Error fetching bot username in play background:', e);
            }

            const escapedTitle = downloadData.title
              ? downloadData.title
                  .replace(/&/g, '&amp;')
                  .replace(/</g, '&lt;')
                  .replace(/>/g, '&gt;')
                  .substring(0, 150) + '...'
              : 'YouTube Audio';

            const caption = `📥 <b>Berhasil Diunduh! (Command /play)</b>\n\n` +
              `📝 <b>Judul:</b> ${escapedTitle}\n` +
              `⚙️ <b>Format:</b> 🎵 Audio MP3\n` +
              `🤖 <b>Bot:</b> @${botUsername}`;

            const hash = cacheUrl(playUrl);

            // Add format buttons
            const optionKeyboard = {
              inline_keyboard: [
                [
                  { text: '📹 Kirim Format Video', callback_data: `fmt_media:${hash}` },
                  { text: '📁 Kirim Format Dokumen', callback_data: `fmt_file:${hash}` }
                ]
              ]
            };

            let sendSuccess = false;
            let lastError = '';

            // 1. Try sending as downloaded binary file first (robust)
            const downloaded = await downloadFileAsBlob(audioUrl);
            if (downloaded) {
              const apiRes = await sendTelegramMultipart(
                token,
                'sendAudio',
                {
                  chat_id: chatId.toString(),
                  caption: caption,
                  parse_mode: 'HTML',
                  reply_markup: JSON.stringify(optionKeyboard),
                },
                'audio',
                downloaded.blob,
                downloaded.filename
              );
              if (apiRes && apiRes.ok) {
                sendSuccess = true;
              } else {
                lastError = apiRes?.description || 'Gagal mengirim berkas audio binary.';
              }
            }

            // 2. Fallback to sending direct URL if binary failed
            if (!sendSuccess) {
              const apiRes = await sendTelegramRequest(token, 'sendAudio', {
                chat_id: chatId,
                audio: audioUrl,
                caption: caption,
                parse_mode: 'HTML',
                reply_markup: JSON.stringify(optionKeyboard),
              });
              if (apiRes && apiRes.ok) {
                sendSuccess = true;
              } else {
                lastError = apiRes?.description || lastError || 'Gagal mengirim audio.';
              }
            }

            // Cleanup status message
            if (loadingMsgId) {
              await sendTelegramRequest(token, 'deleteMessage', {
                chat_id: chatId,
                message_id: loadingMsgId,
              });
            }

            if (!sendSuccess) {
              // Direct download fallback
              const fallbackButton = {
                inline_keyboard: [
                  [
                    { text: '📥 Klik Untuk Unduh Audio Langsung', url: audioUrl }
                  ],
                  [
                    { text: '📹 Kirim Format Video', callback_data: `fmt_media:${hash}` }
                  ]
                ]
              };

              await sendTelegramRequest(token, 'sendMessage', {
                chat_id: chatId,
                text: `⚠️ *Gagal Mengirim Audio Secara Langsung!*\n\n` +
                  `Telegram tidak dapat memproses file secara langsung.\n\n` +
                  `📝 *Judul:* \`${escapedTitle}\`\n\n` +
                  `Anda tetap dapat mengunduhnya secara langsung melalui tautan tombol di bawah ini:`,
                parse_mode: 'Markdown',
                reply_markup: JSON.stringify(fallbackButton),
              });
            }

          } else {
            if (loadingMsgId) {
              await sendTelegramRequest(token, 'deleteMessage', {
                chat_id: chatId,
                message_id: loadingMsgId,
              });
            }
            await sendTelegramRequest(token, 'sendMessage', {
              chat_id: chatId,
              text: `❌ *Gagal memproses lagu "${query}"!*\nTidak dapat menemukan audio yang dapat diekstrak.`,
              parse_mode: 'Markdown',
            });
          }
        } catch (playErr) {
          console.error('Error playing youtube video:', playErr);
          if (loadingMsgId) {
            await sendTelegramRequest(token, 'deleteMessage', {
              chat_id: chatId,
              message_id: loadingMsgId,
            });
          }
          await sendTelegramRequest(token, 'sendMessage', {
            chat_id: chatId,
            text: `❌ *Terjadi kesalahan sistem saat memutar lagu.*`,
            parse_mode: 'Markdown',
          });
        }
      })();

      return NextResponse.json({ success: true });
    }

    // -------------------------------------------------------------------------
    // 2.aa Owner broadcast commands (/broadcast <pesan> or /bc <pesan>)
    // -------------------------------------------------------------------------
    const isBroadcastCommand = lowerMessageText.startsWith('/broadcast ') || lowerMessageText.startsWith('/bc ');
    if (isBroadcastCommand) {
      if (user) {
        const isOwner = user.telegramOwnerId && chatId.toString() === user.telegramOwnerId.trim();
        if (!isOwner) {
          await sendTelegramRequest(token, 'sendMessage', {
            chat_id: chatId,
            text: '⚠️ *Akses Ditolak!*\nPerintah ini hanya dapat dijalankan oleh Owner bot.',
            parse_mode: 'Markdown',
            reply_to_message_id: message.message_id,
          });
          return NextResponse.json({ success: true });
        }

        const broadcastContent = cleanMessageText.substring(cleanMessageText.indexOf(' ') + 1).trim();
        if (!broadcastContent) {
          await sendTelegramRequest(token, 'sendMessage', {
            chat_id: chatId,
            text: '⚠️ *Pesan Kosong!*\nSilakan tulis pesan siaran setelah perintah.\nContoh: `/broadcast Halo semua, layanan sedang dilakukan pemeliharaan.`',
            parse_mode: 'Markdown',
            reply_to_message_id: message.message_id,
          });
          return NextResponse.json({ success: true });
        }

        // Broadcast to all users in user.telegramUsers
        const chatIds = user.telegramUsers || [];
        if (chatIds.length === 0) {
          await sendTelegramRequest(token, 'sendMessage', {
            chat_id: chatId,
            text: 'ℹ️ *Info Broadcast:*\nBelum ada pengguna lain yang pernah berinteraksi dengan bot Anda.',
            parse_mode: 'Markdown',
            reply_to_message_id: message.message_id,
          });
          return NextResponse.json({ success: true });
        }

        await sendTelegramRequest(token, 'sendMessage', {
          chat_id: chatId,
          text: `⏳ *Memulai siaran pengumuman ke ${chatIds.length} pengguna...*`,
          parse_mode: 'Markdown',
          reply_to_message_id: message.message_id,
        });

        let successCount = 0;
        let failCount = 0;

        for (const targetChatId of chatIds) {
          // Skip broadcasting to the owner themselves to avoid duplicated message noise
          if (targetChatId === chatId.toString()) continue;

          try {
            const res = await sendTelegramRequest(token, 'sendMessage', {
              chat_id: parseInt(targetChatId),
              text: `📢 *PENGUMUMAN DARI OWNER:* 📢\n\n${broadcastContent}`,
              parse_mode: 'Markdown',
            });
            if (res && res.ok) {
              successCount++;
            } else {
              failCount++;
            }
          } catch (err) {
            failCount++;
          }
        }

        await sendTelegramRequest(token, 'sendMessage', {
          chat_id: chatId,
          text: `✅ *Siaran Selesai!*\n\n• Berhasil dikirim: *${successCount}*\n• Gagal dikirim: *${failCount}*`,
          parse_mode: 'Markdown',
          reply_to_message_id: message.message_id,
        });

        return NextResponse.json({ success: true });
      }
    }

    // -------------------------------------------------------------------------
    // 2.a Intercept commands (/menu, /help, /news, /berita, /start) FIRST
    // -------------------------------------------------------------------------
    if (lowerMessageText === '/menu' || lowerMessageText === '/help' || lowerMessageText === 'menu' || lowerMessageText === 'help' || lowerMessageText.startsWith('/start')) {
      const isOwner = user && user.telegramOwnerId && chatId.toString() === user.telegramOwnerId.trim();
      let menuText = `🤖 *Chonix Bot Command Menu / Bantuan* 🤖\n\n` +
        `Halo! Saya adalah *Chonix Bot*, asisten otomatis multi-platform Anda. Berikut adalah menu layanan dan perintah yang dapat saya jalankan:\n\n` +
        `📹 *Download Media (Tanpa Watermark):*\n` +
        `• *Instagram:* \`/ig <link>\` atau \`/instagram <link>\` (atau kirim link langsung)\n` +
        `• *TikTok:* \`/tt <link>\` atau \`/tiktok <link>\` (atau kirim link langsung)\n` +
        `• *Lainnya:* Anda juga bisa langsung mengirim link Instagram, TikTok, YouTube, Twitter/X, atau Facebook tanpa perintah khusus!\n\n` +
        `🎵 *Putar & Unduh YouTube:* \`/play <judul/link>\` atau \`/p <judul/link>\`\n` +
        `• Mengunduh audio MP3 atau video dari YouTube dengan cepat layaknya bot musik Discord. Cukup masukkan judul lagu atau link langsung.\n\n` +
        `📰 *Berita Terkini:* \`/news\` atau \`/berita\`\n` +
        `• Menampilkan berita teknologi, AI, dan perkembangan startup terhangat secara real-time dari portal berita terpercaya.\n\n` +
        `💬 *Interaksi Chat & Tanya Jawab:*\n` +
        `• Kirim pesan teks biasa untuk mengobrol langsung dengan *AI Gemini* atau memicu balasan otomatis berdasarkan kata kunci yang Anda atur!`;

      if (isOwner) {
        menuText += `\n\n📢 *Menu Khusus Owner Bot:*\n` +
          `• \`/broadcast <pesan>\` atau \`/bc <pesan>\` - Kirim pesan siaran pengumuman ke seluruh pengguna bot Anda.`;
      }

      await sendTelegramRequest(token, 'sendMessage', {
        chat_id: chatId,
        text: menuText,
        parse_mode: 'Markdown',
      });
      return NextResponse.json({ success: true });
    }

    if (lowerMessageText === '/news' || lowerMessageText === '/berita' || lowerMessageText === 'news' || lowerMessageText === 'berita') {
      try {
        await sendTelegramRequest(token, 'sendChatAction', { chat_id: chatId, action: 'typing' });
        const newsList = await getLatestNews();
        
        if (newsList && newsList.length > 0) {
          const itemsToFormat = newsList.slice(0, 4);
          let newsText = `📰 *Breaking News / Berita Terkini* 📰\n\nMenampilkan berita terhangat seputar teknologi, AI, dan perkembangan industri:\n\n`;
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

          await sendTelegramRequest(token, 'sendMessage', {
            chat_id: chatId,
            text: newsText,
            parse_mode: 'Markdown',
            disable_web_page_preview: true,
          });
        } else {
          await sendTelegramRequest(token, 'sendMessage', {
            chat_id: chatId,
            text: '❌ *Gagal memuat berita:* Maaf, terjadi kesalahan saat mengambil berita terkini.',
            parse_mode: 'Markdown',
          });
        }
      } catch (err: any) {
        await sendTelegramRequest(token, 'sendMessage', {
          chat_id: chatId,
          text: `❌ *Error memuat berita:* ${err.message || 'Kesalahan jaringan.'}`,
          parse_mode: 'Markdown',
        });
      }
      return NextResponse.json({ success: true });
    }

    // Extract link
    let url = extractUrl(messageText);
    
    // If it started with a command like /ig or /tt, extract the url from argument if not found by standard regex
    if (!url && hasMediaCommand && targetUrl) {
      url = extractUrl(targetUrl) || targetUrl;
    }

    // Handle malformed commands (e.g. "/ig" without link)
    if (hasMediaCommand && !url) {
      await sendTelegramRequest(token, 'sendMessage', {
        chat_id: chatId,
        text: `⚠️ *Format Perintah Salah!*\n\nSilakan masukkan tautan media sosial yang ingin diunduh.\nContoh: \`/ig https://instagram.com/p/xxxxx\` atau \`/tt https://vt.tiktok.com/xxxxx\``,
        parse_mode: 'Markdown',
      });
      return NextResponse.json({ success: true });
    }

    // Use the user settings associated with this bot token fetched at the beginning of POST
    // user is already available

    if (!url) {
      // Check if chatbot is enabled
      const chatbotEnabled = user ? (user.chatbotEnabled !== false) : true;
      if (!chatbotEnabled) {
        return NextResponse.json({ success: true }); // Chatbot turned off
      }

      const chatbotType = user?.chatbotType || 'ai';
      const customReplies = user?.customAutoReplies || [];

      // 1. Keyword-based matching if hybrid or custom mode is selected
      if (chatbotType !== 'ai' && customReplies.length > 0) {
        const matchedRule = customReplies.find(
          r => r.keyword && messageText.toLowerCase().includes(r.keyword.toLowerCase())
        );
        if (matchedRule) {
          await sendTelegramRequest(token, 'sendMessage', {
            chat_id: chatId,
            text: matchedRule.reply,
            reply_to_message_id: message.message_id,
          });
          return NextResponse.json({ success: true });
        }
      }

      // 2. Custom rule-only mode fallback
      if (chatbotType === 'custom') {
        await sendTelegramRequest(token, 'sendMessage', {
          chat_id: chatId,
          text: '🤖 *Asisten Otomatis:* Kata kunci tidak dikenali. Silakan kirimkan tautan media sosial (TikTok, Instagram, YouTube, Twitter/X, Facebook) atau ketik `/menu` untuk bantuan!',
          parse_mode: 'Markdown',
          reply_to_message_id: message.message_id,
        });
        return NextResponse.json({ success: true });
      }

      // 3. Fallback to Gemini AI with custom prompt if set
      await sendTelegramRequest(token, 'sendChatAction', { chat_id: chatId, action: 'typing' });
      const reply = await generateGeminiReply(messageText, user?.chatbotPrompt);
      await sendTelegramRequest(token, 'sendMessage', {
        chat_id: chatId,
        text: reply,
      });
      return NextResponse.json({ success: true });
    }

    const source = getSource(url);
    if (source === 'other') {
      await sendTelegramRequest(token, 'sendMessage', {
        chat_id: chatId,
        text: '⚠️ *Tautan tidak didukung!*\n\nHarap kirimkan tautan dari salah satu media sosial berikut: TikTok, Instagram, YouTube, Twitter/X, atau Facebook.',
        parse_mode: 'Markdown',
        reply_to_message_id: message.message_id,
      });
      return NextResponse.json({ success: true });
    }

    const sourceName = source.toUpperCase();

    // Cache URL and generate custom short key
    const hash = cacheUrl(url);

    // Send Interactive Option Buttons
    const optionKeyboard = {
      inline_keyboard: [
        [
          { text: '📹 Media (Video/Foto)', callback_data: `fmt_media:${hash}` },
          { text: '📁 Dokumen / File', callback_data: `fmt_file:${hash}` }
        ],
        [
          { text: '🎵 Audio MP3', callback_data: `fmt_audio:${hash}` }
        ]
      ]
    };

    const sendResult = await sendTelegramRequest(token, 'sendMessage', {
      chat_id: chatId,
      text: `📥 *Tautan ${sourceName} Terdeteksi!*\n\nSilakan pilih format pengiriman media yang Anda inginkan di bawah ini:`,
      parse_mode: 'Markdown',
      reply_markup: JSON.stringify(optionKeyboard),
      reply_to_message_id: message.message_id,
    });

    // If it failed (e.g., due to reply_to_message_id constraints, or custom Telegram client issues), try a robust fallback
    if (!sendResult || !sendResult.ok) {
      console.warn('First inline keyboard sendMessage failed, trying robust fallback...');
      await sendTelegramRequest(token, 'sendMessage', {
        chat_id: chatId,
        text: `📥 *Tautan ${sourceName} Terdeteksi!*\n\nSilakan pilih format pengiriman media yang Anda inginkan di bawah ini:`,
        parse_mode: 'Markdown',
        reply_markup: optionKeyboard,
      });
    }

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error('Telegram Webhook Route Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
