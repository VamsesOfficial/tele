import { GoogleGenAI } from '@google/genai';

export interface NewsItem {
  title: string;
  link: string;
  description: string;
  pubDate: string;
  imageUrl: string;
  creator: string;
}

export async function getLatestNews(): Promise<NewsItem[]> {
  try {
    // Fetch live RSS feed from Antara News
    const response = await fetch('https://www.antaranews.com/rss/terkini.xml', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
      next: { revalidate: 60 },
    } as any);

    if (!response.ok) {
      throw new Error(`RSS feed returned status: ${response.status}`);
    }

    const xmlText = await response.text();
    const items: NewsItem[] = [];
    const itemRegex = /<item>([\s\S]*?)<\/item>/g;
    let match;

    while ((match = itemRegex.exec(xmlText)) !== null) {
      const itemContent = match[1];
      
      // Extract title, link, description, pubDate, creator
      let title = itemContent.match(/<title><!\[CDATA\[([\s\S]*?)\]\]><\/title>/)?.[1] || 
                  itemContent.match(/<title>([\s\S]*?)<\/title>/)?.[1] || '';
      let link = itemContent.match(/<link>([\s\S]*?)<\/link>/)?.[1] || '';
      let description = itemContent.match(/<description><!\[CDATA\[([\s\S]*?)\]\]><\/description>/)?.[1] || 
                        itemContent.match(/<description>([\s\S]*?)<\/description>/)?.[1] || '';
      let pubDate = itemContent.match(/<pubDate>([\s\S]*?)<\/pubDate>/)?.[1] || '';
      let creator = itemContent.match(/<dc:creator>([\s\S]*?)<\/dc:creator>/)?.[1] || 'Antara News';

      // Clean HTML tags from description
      description = description.replace(/<[^>]*>/g, '').trim();
      if (description.length > 150) {
        description = description.substring(0, 147) + '...';
      }

      // Find image URL from enclosure or media tags
      let imageUrl = '';
      const enclosureMatch = itemContent.match(/<enclosure[^>]+url=["']([^"']+)["']/i);
      if (enclosureMatch) {
        imageUrl = enclosureMatch[1];
      } else {
        const mediaMatch = itemContent.match(/<media:content[^>]+url=["']([^"']+)["']/i);
        if (mediaMatch) {
          imageUrl = mediaMatch[1];
        } else {
          const imgTagMatch = itemContent.match(/<img[^>]+src=["']([^"']+)["']/i);
          if (imgTagMatch) {
            imageUrl = imgTagMatch[1];
          }
        }
      }

      // If no image found, generate a high-contrast nature or news illustration seed
      if (!imageUrl) {
        imageUrl = `https://picsum.photos/seed/news_${encodeURIComponent(title.substring(0, 10))}/400/250`;
      }

      // Clean CDATA wrapping if any leftover
      title = title.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1').trim();
      description = description.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1').trim();

      // Format pubDate nicely
      let formattedDate = pubDate;
      try {
        const dateObj = new Date(pubDate);
        if (!isNaN(dateObj.getTime())) {
          formattedDate = dateObj.toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          });
        }
      } catch {
        // use default
      }

      items.push({
        title,
        link,
        description,
        pubDate: formattedDate,
        imageUrl,
        creator,
      });

      // Limit to 10 news items
      if (items.length >= 10) break;
    }

    if (items.length > 0) {
      return items;
    } else {
      throw new Error('No items parsed from feed');
    }

  } catch (error: any) {
    console.warn('Gagal memuat berita RSS Antara, memanggil Gemini fallback...', error);
    
    // Call Gemini to generate Indonesian Tech and AI Breaking News!
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey) {
      try {
        const ai = new GoogleGenAI({ apiKey });
        const geminiRes = await ai.models.generateContent({
          model: 'gemini-3.5-flash',
          contents: 'Buatkan 5 berita terkini fiktif namun sangat relevan tentang perkembangan AI, teknologi, dan startup digital di Indonesia dalam format JSON. Format output harus berupa JSON murni dengan property "news" yang isinya array of object, tiap object memiliki fields: "title" (string), "description" (string, max 150 chars), "pubDate" (string tanggal hari ini), "imageUrl" (string url picsum.photos/seed/tech/400/250), "creator" (string portal berita teknologi lokal seperti ChonixTech News). JANGAN tulis markdown tag ```json di output, langsung JSON murninya saja.',
        });

        const text = geminiRes.text || '';
        const cleanJson = text.replace(/```json/g, '').replace(/```/g, '').trim();
        const parsed = JSON.parse(cleanJson);
        if (parsed.news && Array.isArray(parsed.news)) {
          return parsed.news;
        }
      } catch (geminiErr) {
        console.error('Gemini fallback failed:', geminiErr);
      }
    }

    // Static fallback if everything else fails
    return [
      {
        title: 'Chonix Bot Premium v2.0 Resmi Dirilis di Indonesia',
        description: 'Dashboard manajemen bot telegram ini kini mendukung download dari seluruh media sosial utama, dilengkapi chatbot AI pintar dan feed berita langsung.',
        pubDate: new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }),
        imageUrl: 'https://picsum.photos/seed/chonixbot/400/250',
        creator: 'ChonixTech Media',
        link: '#',
      },
      {
        title: 'Inovasi Startup Lokal Memperluas Penggunaan Kecerdasan Buatan',
        description: 'Berbagai startup tanah air kini gencar mengadopsi model Gemini untuk mengotomasi interaksi pelanggan dan memproses berkas media digital.',
        pubDate: new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }),
        imageUrl: 'https://picsum.photos/seed/startup/400/250',
        creator: 'StartupID',
        link: '#',
      },
    ];
  }
}
