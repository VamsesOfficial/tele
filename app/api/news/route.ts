import { NextResponse } from 'next/server';
import { getLatestNews } from '@/lib/news';

export const revalidate = 60; // Cache for 60 seconds

export async function GET() {
  try {
    const news = await getLatestNews();
    return NextResponse.json({ success: true, news });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
