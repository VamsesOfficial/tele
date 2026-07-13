import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

// Initialize Gemini API
const apiKey = process.env.GEMINI_API_KEY;
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

export async function POST(request: Request) {
  try {
    const { message, chatHistory } = await request.json();

    if (!message || typeof message !== 'string') {
      return NextResponse.json({ reply: 'Pesan kosong.' }, { status: 400 });
    }

    if (!ai) {
      return NextResponse.json({ 
        reply: 'Halo! Saya adalah Bot Pengunduh TikTok & Instagram. Fitur AI Chat saya belum aktif karena API Key Gemini belum dikonfigurasi di dashboard Anda. Namun, Anda tetap bisa menempelkan tautan TikTok/Instagram langsung untuk diunduh secara instan!' 
      });
    }

    // Set up a system instruction to give the bot a friendly Indonesian personality
    const systemInstruction = `
Kamu adalah "Chonix Bot", sebuah bot Telegram asisten pengunduh media TikTok dan Instagram tanpa watermark.
Tugas utama kamu adalah membantu pengguna mengunduh video, audio, dan foto/slideshow dari TikTok atau Instagram.
Kepribadianmu: Ramah, interaktif, humoris, dan menggunakan bahasa Indonesia santai yang mudah dipahami (kamu bisa menggunakan istilah gaul atau emoji sesekali agar terkesan hidup).

Panduan Jawaban:
1. Jika pengguna menyapa (seperti: halo, hi, bot, p, woi), sambut mereka dengan gembira dan ingatkan mereka bahwa mereka cukup mengirimkan link TikTok atau Instagram untuk diunduh secara instan.
2. Jika pengguna menanyakan cara menggunakan bot, jelaskan langkah-langkahnya secara singkat dan rapi:
   - Cari video/reels di TikTok atau Instagram.
   - Salin tautannya (Copy Link).
   - Tempel dan kirim tautan tersebut di ruang obrolan ini.
   - Tunggu beberapa detik, bot akan langsung mengirimkan videonya tanpa watermark!
3. Jika pengguna menanyakan fitur bot, jelaskan bahwa bot mendukung:
   - Video TikTok tanpa watermark (kualitas HD).
   - Audio/MP3 dari TikTok.
   - Slideshow foto TikTok (sebagai kumpulan gambar).
   - Video Reels & Postingan foto Instagram.
4. Jika pengguna mengobrol santai di luar topik, tetap ladeni dengan ramah dan lucu, lalu arahkan kembali ke fungsi utama bot (mengunduh video).
5. JANGAN menulis teks Markdown yang terlalu rumit atau sulit dibaca. Gunakan bullet point sederhana jika perlu.
6. Hindari menyebutkan batasan teknis atau kode internal. Tetap terlihat seperti bot yang aktif dan andal!
`;

    // Map history to the required format if provided
    const formattedContents = [];
    if (chatHistory && Array.isArray(chatHistory)) {
      for (const h of chatHistory) {
        formattedContents.push({
          role: h.role === 'user' ? 'user' : 'model',
          parts: [{ text: h.text }]
        });
      }
    }

    // Add current message
    formattedContents.push({
      role: 'user',
      parts: [{ text: message }]
    });

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: formattedContents,
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.7,
      }
    });

    const replyText = response.text || 'Maaf, saya tidak mengerti. Bisa diulangi?';
    return NextResponse.json({ reply: replyText });

  } catch (error: any) {
    console.error('Gemini API Route Error:', error);
    return NextResponse.json({ 
      reply: 'Aduh, ada sedikit gangguan di otak AI saya nih. Tapi tenang, Anda tetap bisa mengunduh dengan cara langsung memasukkan tautan TikTok/Instagram ke sini!' 
    });
  }
}
