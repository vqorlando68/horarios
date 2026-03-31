import { NextResponse } from 'next/server';
import { callOracleProcedure } from '../../../lib/db';

export async function POST(request) {
    try {
        const body = await request.json();
        const data = await callOracleProcedure(
            'pkgln_calendarios.sp_obtener_info_profesional',
            { id_usuario: body.id_usuario }
        );
        return NextResponse.json(data);
    } catch (error) {
        console.error('Error fetching professional info:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
