import { NextResponse } from 'next/server';
import { registerUser } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json({ success: false, error: 'Username dan Password wajib diisi.' }, { status: 400 });
    }

    if (username.length < 3 || password.length < 4) {
      return NextResponse.json({ success: false, error: 'Username minimal 3 karakter, password minimal 4 karakter.' }, { status: 400 });
    }

    const result = await registerUser({
      username,
      password,
      botToken: '',
      webhookEnabled: false,
      defaultFormat: 'media',
    });

    if (result.success) {
      return NextResponse.json({ success: true, message: 'Pendaftaran sukses! Silakan masuk.' });
    } else {
      return NextResponse.json({ success: false, error: result.error || 'Gagal mendaftar.' }, { status: 400 });
    }

  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
