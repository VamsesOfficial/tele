import { NextResponse } from 'next/server';
import abDownloader from 'ab-downloader';
import { igdl, twitter, youtube, fbdown } from 'btch-downloader';

export const maxDuration = 30; // Extend duration for large downloads if supported

function getSource(url: string): string {
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

// Robust fallback TikTok downloader using tikwm.com free API
async function downloadViaTikWM(url: string) {
  try {
    const res = await fetch(`https://www.tikwm.com/api/?url=${encodeURIComponent(url)}`, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });

    if (!res.ok) return null;
    let json: any;
    try {
      json = await res.json();
    } catch {
      console.warn('TikWM API response is not valid JSON');
      return null;
    }
    if (json.code === 0 && json.data) {
      const data = json.data;
      const isSlideshow = data.images && data.images.length > 0;
      return {
        success: true,
        source: 'tiktok',
        title: data.title || 'TikTok Video',
        thumbnail: data.cover || data.origin_cover || '',
        author: data.author?.nickname || data.author?.unique_id || 'TikTok User',
        videoUrl: data.play || data.wmplay || '',
        audioUrl: data.music || '',
        images: data.images || [],
        isSlideshow,
      };
    }
    return null;
  } catch (error) {
    console.error('TikWM Download Error:', error);
    return null;
  }
}

// Robust list of public Cobalt API instances (base domains)
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

// Download using Cobalt API with fallback rotation and endpoint adaptation
async function downloadViaCobalt(url: string) {
  for (const instance of COBALT_INSTANCES) {
    // Try both modern root "/" endpoint and legacy "/api/json" endpoint
    const endpoints = [instance, `${instance}/api/json`];

    for (const endpoint of endpoints) {
      try {
        console.log(`Mencoba mengunduh menggunakan Cobalt endpoint: ${endpoint}`);
        
        // Try minimal payload first as it has highest compatibility across Cobalt versions
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          },
          body: JSON.stringify({
            url: url,
            videoQuality: '720',
          }),
        });

        if (!response.ok) {
          console.warn(`Cobalt endpoint ${endpoint} mengembalikan status ${response.status}`);
          continue; 
        }

        let json: any;
        try {
          json = await response.json();
        } catch {
          console.warn(`Respon dari Cobalt endpoint ${endpoint} bukan JSON valid`);
          continue;
        }
        
        if (json.status === 'error') {
          console.warn(`Cobalt endpoint ${endpoint} error:`, json.text);
          continue; 
        }

        const source = getSource(url);

        // Handle Cobalt "picker" response (slideshow/carousel/multi-item posts)
        if (json.status === 'picker') {
          const images = (json.picker || [])
            .filter((item: any) => item.type === 'photo' || item.url)
            .map((item: any) => item.url);
          
          const firstVideo = (json.picker || []).find((item: any) => item.type === 'video');

          return {
            success: true,
            source,
            title: json.text || `${source.toUpperCase()} Post`,
            thumbnail: images[0] || '',
            author: 'User',
            videoUrl: firstVideo?.url || '',
            audioUrl: '',
            images,
            isSlideshow: images.length > 0,
          };
        }

        // Direct single video or stream download
        if (json.url) {
          return {
            success: true,
            source,
            title: json.text || `${source.toUpperCase()} Video`,
            thumbnail: '',
            author: 'User',
            videoUrl: json.url,
            audioUrl: '',
            images: [],
            isSlideshow: false,
          };
        }
      } catch (error) {
        console.error(`Gagal menghubungkan ke Cobalt endpoint ${endpoint}:`, error);
      }
    }
  }
  return null;
}

// Download using ab-downloader package as primary source for TikTok
async function downloadViaAbDownloader(url: string, source: string) {
  try {
    const ab = (abDownloader as any).default || abDownloader;
    if (!ab) return null;

    console.log(`Mencoba ab-downloader untuk url: ${url} (source: ${source})`);

    if (source === 'tiktok') {
      const res = await ab.ttdl(url);
      if (res && res.video) {
        return {
          success: true,
          source: 'tiktok',
          title: res.title || 'TikTok Video',
          thumbnail: res.thumbnail || '',
          author: 'TikTok User',
          videoUrl: res.video,
          audioUrl: res.audio || '',
          images: [],
          isSlideshow: false,
        };
      }
    }
    return null;
  } catch (error) {
    console.error('ab-downloader Error:', error);
    return null;
  }
}

// Download using btch-downloader package for Instagram, YouTube, Twitter, and Facebook
async function downloadViaBtchDownloader(url: string, source: string) {
  try {
    console.log(`Mencoba btch-downloader untuk url: ${url} (source: ${source})`);

    if (source === 'instagram') {
      const res = await igdl(url);
      if (res && res.result && res.result.length > 0) {
        const images = res.result.map((item: any) => item.url);
        const firstItem = res.result[0];
        const isVideo = firstItem.url && (firstItem.url.includes('.mp4') || firstItem.url.includes('video') || firstItem.url.includes('reel'));
        return {
          success: true,
          source: 'instagram',
          title: 'Instagram Post',
          thumbnail: firstItem.thumbnail || firstItem.url || '',
          author: 'Instagram User',
          videoUrl: isVideo ? firstItem.url : '',
          audioUrl: '',
          images: !isVideo ? images : [],
          isSlideshow: !isVideo && images.length > 1,
        };
      }
    } else if (source === 'facebook') {
      const res = await fbdown(url);
      if (res && (res.HD || res.Normal_video)) {
        return {
          success: true,
          source: 'facebook',
          title: 'Facebook Video',
          thumbnail: '',
          author: 'Facebook User',
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
          source: 'twitter',
          title: res.title || 'Twitter Video/Media',
          thumbnail: '',
          author: 'Twitter User',
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
          source: 'youtube',
          title: res.title || 'YouTube Video',
          thumbnail: res.thumbnail || '',
          author: res.author || 'YouTube Creator',
          videoUrl: res.mp4 || '',
          audioUrl: res.mp3 || '',
          images: [],
          isSlideshow: false,
        };
      }
    }
    return null;
  } catch (error) {
    console.error('btch-downloader Error:', error);
    return null;
  }
}

export async function POST(request: Request) {
  try {
    const { url } = await request.json();

    if (!url || typeof url !== 'string') {
      return NextResponse.json({ success: false, error: 'URL tidak valid atau kosong.' }, { status: 400 });
    }

    const source = getSource(url);
    if (source === 'other') {
      return NextResponse.json({ 
        success: false, 
        error: 'URL tidak didukung. Harap gunakan tautan TikTok, Instagram, YouTube, Twitter/X, atau Facebook.' 
      }, { status: 400 });
    }

    // Try primary downloaders first
    let result = null;
    if (source === 'tiktok') {
      result = await downloadViaAbDownloader(url, source);
    } else {
      result = await downloadViaBtchDownloader(url, source);
    }

    // If primary downloader fails, try Cobalt fallback
    if (!result) {
      console.log('Primary downloader failed. Trying Cobalt fallback...');
      result = await downloadViaCobalt(url);
    }

    // If Cobalt fails and it is a TikTok link, try the reliable TikWM backup
    if (!result && source === 'tiktok') {
      console.log('Cobalt failed for TikTok. Trying TikWM fallback...');
      result = await downloadViaTikWM(url);
    }

    if (result) {
      return NextResponse.json(result);
    }

    return NextResponse.json({ 
      success: false, 
      error: 'Gagal mengunduh media. Tautan mungkin privat, salah, atau server sedang sibuk. Silakan coba lagi.' 
    }, { status: 422 });

  } catch (error: any) {
    console.error('API Download Route Error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Terjadi kesalahan internal pada server: ' + error.message 
    }, { status: 500 });
  }
}
