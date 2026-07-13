import { NextResponse } from 'next/server';
import { updateUser, findUser } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const { 
      username, 
      botToken, 
      webhookEnabled, 
      defaultFormat,
      chatbotEnabled,
      chatbotType,
      chatbotPrompt,
      customAutoReplies,
      telegramOwnerId
    } = await request.json();

    if (!username) {
      return NextResponse.json({ success: false, error: 'Username wajib diisi.' }, { status: 400 });
    }

    const user = await findUser(username);
    if (!user) {
      return NextResponse.json({ success: false, error: 'User tidak ditemukan.' }, { status: 404 });
    }

    const updates: any = {};
    if (botToken !== undefined) updates.botToken = botToken;
    if (webhookEnabled !== undefined) updates.webhookEnabled = webhookEnabled;
    if (defaultFormat !== undefined) updates.defaultFormat = defaultFormat;
    if (chatbotEnabled !== undefined) updates.chatbotEnabled = chatbotEnabled;
    if (chatbotType !== undefined) updates.chatbotType = chatbotType;
    if (chatbotPrompt !== undefined) updates.chatbotPrompt = chatbotPrompt;
    if (customAutoReplies !== undefined) updates.customAutoReplies = customAutoReplies;
    if (telegramOwnerId !== undefined) updates.telegramOwnerId = telegramOwnerId;

    const ok = await updateUser(username, updates);

    if (ok) {
      return NextResponse.json({ success: true, message: 'Data konfigurasi berhasil disimpan!' });
    } else {
      return NextResponse.json({ success: false, error: 'Gagal memperbarui konfigurasi.' }, { status: 500 });
    }

  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
