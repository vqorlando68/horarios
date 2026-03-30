import { callOracleProcedure } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function POST(req) {
    try {
        const body = await req.json();
        const data = await callOracleProcedure('pkgln_calendarios.sp_resumen_estadistico', body);
        return NextResponse.json(data);
    } catch (e) {
        return NextResponse.json({ success: false, error: e.message }, { status: 500 });
    }
}
