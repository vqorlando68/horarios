import { NextResponse } from 'next/server';
import oracledb from 'oracledb';

const dbConfig = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    connectString: process.env.DB_CONNECTION_STRING
};

export async function POST(request) {
    let connection;
    try {
        const { usuario, clave } = await request.json();
        if (!usuario || !clave) {
            return NextResponse.json({ success: false, error: 'Usuario y clave son requeridos' }, { status: 400 });
        }

        connection = await oracledb.getConnection(dbConfig);
        const result = await connection.execute(
            `SELECT pkgln_seguridad.f_validar_clave(:usuario, :clave, 1) FROM DUAL`,
            { usuario: usuario.trim(), clave: clave }
        );

        const valor = result.rows[0][0];
        if (valor === 1) {
            return NextResponse.json({ success: true, usuario: usuario.trim() });
        } else {
            return NextResponse.json({ success: false, error: 'Usuario o clave incorrectos' }, { status: 401 });
        }
    } catch (error) {
        console.error('Error en login:', error);
        return NextResponse.json({ success: false, error: 'Error de conexión con el sistema' }, { status: 500 });
    } finally {
        if (connection) {
            try { await connection.close(); } catch (e) { console.error(e); }
        }
    }
}
