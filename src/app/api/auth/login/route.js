import { NextResponse } from 'next/server';
import { callOracleProcedure } from '@/lib/db';

export async function POST(request) {
    try {
        const body = await request.json();
        const { usuario, clave } = body;
        
        if (!usuario || !clave) {
            return NextResponse.json({ success: false, error: 'Usuario y clave son requeridos' }, { status: 400 });
        }

        const data = await callOracleProcedure('pkgln_calendarios.sp_login', { usuario, clave });
        
        return NextResponse.json(data);
    } catch (error) {
        console.error('Error en login:', error);
        const errorMessage = error.message.includes('Usuario o clave incorrectos') 
            ? 'Usuario o clave incorrectos' 
            : 'Error de conexión con el sistema';
        return NextResponse.json({ success: false, error: errorMessage }, { status: 401 });
    }
}
