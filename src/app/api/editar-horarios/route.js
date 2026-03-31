import { NextResponse } from 'next/server';
import { callOracleProcedure } from '@/lib/db';

export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const id_usuario = searchParams.get('id_usuario');
    const tipo = searchParams.get('tipo') || 'base'; // 'base' | 'temporal'

    if (!id_usuario) {
        return NextResponse.json({ success: false, error: 'id_usuario is required' }, { status: 400 });
    }

    try {
        const horariosData = await callOracleProcedure('pkgln_calendarios.sp_editar_horarios', { id_usuario, tipo });
        const ausenciasData = await callOracleProcedure('pkgln_calendarios.sp_obtener_ausencias', { id_usuario });

        return NextResponse.json({
            success: true,
            data: {
                horarios: horariosData,
                ausencias: ausenciasData.data
            }
        });
    } catch (error) {
        console.error('Error fetching schedules:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        const body = await request.json();
        const { id_usuario, horarios, ausencias, trabaja_festivos } = body;

        return NextResponse.json({ success: true, message: 'Saved successfully' });
    } catch (error) {
        console.error('Error saving schedules:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
