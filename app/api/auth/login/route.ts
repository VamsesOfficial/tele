import { NextResponse } from 'next/server';
import { findUser, verifyPassword } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json({ success: false, error: 'Username dan Password wajib diisi.' }, { status: 400 });
    }

    const user = await findUser(username);

    if (!user || !(await verifyPassword(password, user.password))) {
      return NextResponse.json({ success: false, error: 'Username atau Password salah.' }, { status: 401 });
    }

    // Return user details safely
    return NextResponse.json({
      success: true,
      user: {
        username: user.username,
        botToken: user.botToken || '',
        webhookEnabled: user.webhookEnabled || false,
        defaultFormat: user.defaultFormat || 'media',
        downloadsCount: user.downloadsCount || 0,
        createdAt: user.createdAt,
        telegramOwnerId: user.telegramOwnerId || '',
        telegramUsers: user.telegramUsers || [],
      }
    });

  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
