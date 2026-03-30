import { NextResponse } from 'next/server';
import { executeSql } from '@/lib/db';

export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const id_usuario = searchParams.get('id_usuario');
    const tipo = searchParams.get('tipo') || 'base'; // 'base' | 'temporal'

    if (!id_usuario) {
        return NextResponse.json({ success: false, error: 'id_usuario is required' }, { status: 400 });
    }

    try {
        // Build WHERE based on tipo
        const whereClause = tipo === 'base'
            ? 'WHERE ID_USUARIO = :1 AND FECHA_FINAL IS NULL'
            : 'WHERE ID_USUARIO = :1 AND FECHA_FINAL IS NOT NULL';

        const horariosResult = await executeSql(
            `SELECT ID as "id", 
                    ID_USUARIO as "id_usuario", 
                    DIA_SEMANA as "dia_semana", 
                    HORA_INICIO_MANANA as "hora_inicio_manana", 
                    HORA_FIN_MANANA as "hora_fin_manana", 
                    HORA_INICIO_TARDE as "hora_inicio_tarde", 
                    HORA_FIN_TARDE as "hora_fin_tarde", 
                    TO_CHAR(FECHA_INICIO, 'YYYY-MM-DD') as "fecha_inicio", 
                    TO_CHAR(FECHA_FINAL, 'YYYY-MM-DD') as "fecha_final"
             FROM TKR_HORARIOS_DOCTOR 
             ${whereClause}
             ORDER BY DECODE(DIA_SEMANA,'LU',1,'MA',2,'MI',3,'JU',4,'VI',5,'SA',6,'DO',7,8), FECHA_INICIO NULLS FIRST`,
            [id_usuario]
        );

        const normalizedHorarios = horariosResult.rows.map(row => {
            const r = {};
            for (let k in row) r[k.toLowerCase()] = row[k];
            return r;
        });

        const ausenciasResult = await executeSql(
            `SELECT ID as "id", 
                    ID_USUARIO as "id_usuario", 
                    TO_CHAR(FECHA_INICIAL, 'YYYY-MM-DD') as "fecha_inicial", 
                    TO_CHAR(FECHA_FINAL, 'YYYY-MM-DD') as "fecha_final"
             FROM TKR_AUSENCIAS_PROFESIONAL
             WHERE ID_USUARIO = :1`,
            [id_usuario]
        );

        return NextResponse.json({
            success: true,
            data: {
                horarios: normalizedHorarios,
                ausencias: ausenciasResult.rows
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
