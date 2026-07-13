import { NextResponse } from 'next/server';
import { getUserByToken } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const { botToken, message } = await request.json();

    if (!botToken || !message) {
      return NextResponse.json(
        { success: false, error: 'Token bot dan isi pesan wajib diisi.' },
        { status: 400 }
      );
    }

    const user = await getUserByToken(botToken);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User tidak ditemukan untuk token bot ini.' },
        { status: 404 }
      );
    }

    const chatIds = user.telegramUsers || [];
    if (chatIds.length === 0) {
      return NextResponse.json({
        success: true,
        count: 0,
        message: 'Belum ada pengguna yang berinteraksi dengan bot Anda.',
      });
    }

    let successCount = 0;
    let failCount = 0;

    // Send to all stored chatIds
    for (const chatId of chatIds) {
      try {
        const res = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: parseInt(chatId),
            text: `📢 *PENGUMUMAN DARI OWNER:*\n\n${message}`,
            parse_mode: 'Markdown',
          }),
        });
        const data = await res.json();
        if (data && data.ok) {
          successCount++;
        } else {
          failCount++;
        }
      } catch (err) {
        console.error(`Failed to send broadcast to ${chatId}:`, err);
        failCount++;
      }
    }

    return NextResponse.json({
      success: true,
      count: successCount,
      failed: failCount,
      message: `Siaran pengumuman terkirim ke ${successCount} pengguna.${
        failCount > 0 ? ` Gagal dikirim ke ${failCount} pengguna.` : ''
      }`,
    });
  } catch (error: any) {
    console.error('Broadcast API Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
