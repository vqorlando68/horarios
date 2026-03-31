import { getFechaActual } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
    console.log('API: GET /api/fecha-actual hit');
    try {
        console.log('API: Calling getFechaActual...');
        const data = await getFechaActual();
        console.log('API: getFechaActual returned successfully');
        return NextResponse.json(data);
    } catch (e) {
        return NextResponse.json({ success: false, error: e.message }, { status: 500 });
    }
}
