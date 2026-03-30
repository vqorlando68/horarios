import { NextResponse } from 'next/server';
import { callOracleProcedure } from '../../../lib/db';

export async function POST(request) {
    try {
        const body = await request.json();
        const data = await callOracleProcedure(
            'pkgln_calendarios.sp_obtener_profesionales',
            body
        );
        return NextResponse.json(data);
    } catch (error) {
        console.error('Error fetching professionals:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
