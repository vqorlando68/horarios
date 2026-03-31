import { NextResponse } from 'next/server';
import { callOracleProcedure } from '@/lib/db';

export async function POST(request) {
    try {
        const body = await request.json();
        const res = await callOracleProcedure('pkgln_calendarios.sp_obtener_estados_cita', {
            id_usuario: body.id_usuario || 0
        });
        return NextResponse.json(res);
    } catch (error) {
        console.error('Error fetching appointment states for professional:', error);
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}
