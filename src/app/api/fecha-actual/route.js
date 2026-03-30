import { getFechaActual } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
    try {
        const data = await getFechaActual();
        return NextResponse.json(data);
    } catch (e) {
        return NextResponse.json({ success: false, error: e.message }, { status: 500 });
    }
}
