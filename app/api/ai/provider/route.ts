import { NextResponse } from 'next/server';
import { getProviderInfo } from '@/lib/ai/provider';

export async function GET() {
  return NextResponse.json(getProviderInfo());
}
