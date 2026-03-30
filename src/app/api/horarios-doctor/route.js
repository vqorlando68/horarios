import { NextResponse } from 'next/server';
import { callOracleProcedure } from '../../../lib/db';

export async function POST(request) {
    try {
        const body = await request.json();
        const data = await callOracleProcedure(
            'pkgln_calendarios.sp_obtener_horarios_doctor',
            { id_usuario: body.id_usuario, tipo: body.tipo || 'base' }
        );
        return NextResponse.json(data);
    } catch (error) {
        console.error('Error fetching doctor schedule:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
