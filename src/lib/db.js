import oracledb from 'oracledb';

const dbConfig = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    connectString: process.env.DB_CONNECTION_STRING
};

export async function callOracleProcedure(procName, inputParams = {}) {
    let connection;
    try {
        connection = await oracledb.getConnection(dbConfig);
        const result = await connection.execute(
            `BEGIN ${procName}(:p_input, :p_output, :p_success); END;`,
            {
                p_input: { val: JSON.stringify(inputParams), type: oracledb.STRING, dir: oracledb.BIND_IN },
                p_output: { type: oracledb.CLOB, dir: oracledb.BIND_OUT },
                p_success: { type: oracledb.NUMBER, dir: oracledb.BIND_OUT }
            }
        );

        if (result.outBinds.p_success === 1) {
            const lob = result.outBinds.p_output;
            if (lob) {
                const clobData = await lob.getData();
                return JSON.parse(clobData);
            }
            return { success: true, data: null };
        } else {
            const lob = result.outBinds.p_output;
            const errorData = lob ? await lob.getData() : '{"error": "Unknown Oracle Error"}';
            throw new Error(errorData);
        }
    } catch (err) {
        console.error(`Error in ${procName}:`, err);
        throw err;
    } finally {
        if (connection) {
            try { await connection.close(); } catch (e) { console.error(e); }
        }
    }
}

export async function callOracleFunction(funcName) {
    let connection;
    try {
        connection = await oracledb.getConnection(dbConfig);
        const result = await connection.execute(
            `SELECT ${funcName} FROM DUAL`
        );
        const data = result.rows[0][0];
        // If it's a CLOB, we need to read it
        if (data && typeof data.getData === 'function') {
            const clobData = await data.getData();
            return JSON.parse(clobData);
        }
        return typeof data === 'string' ? JSON.parse(data) : data;
    } catch (err) {
        console.error(`Error calling function ${funcName}:`, err);
        throw err;
    } finally {
        if (connection) {
            try { await connection.close(); } catch (e) { console.error(e); }
        }
    }
}

export async function getFechaActual() {
    let connection;
    try {
        connection = await oracledb.getConnection(dbConfig);
        const result = await connection.execute(
            `SELECT TO_CHAR(f_fecha_actual, 'YYYY-MM-DD"T"HH24:MI:SS') AS fecha FROM DUAL`
        );
        return { success: true, data: result.rows[0][0] };
    } finally {
        if (connection) {
            try { await connection.close(); } catch (err) { console.error(err); }
        }
    }
}

export async function executeSql(sql, binds = {}, options = { outFormat: oracledb.OUT_FORMAT_OBJECT, autoCommit: true }) {
    let connection;
    try {
        connection = await oracledb.getConnection(dbConfig);
        const result = await connection.execute(sql, binds, options);
        return result;
    } catch (err) {
        console.error(`Error executing SQL: ${sql}`, err);
        throw err;
    } finally {
        if (connection) {
            try { await connection.close(); } catch (e) { console.error(e); }
        }
    }
}
