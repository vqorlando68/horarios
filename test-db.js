const oracledb = require('oracledb');
require('dotenv').config({path: '.env'});

async function test() {
  let conn;
  try {
    const config = {
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      connectString: process.env.DB_CONNECTION_STRING
    };
    console.log('Testing with user:', config.user);
    conn = await oracledb.getConnection(config);
    const result = await conn.execute(`SELECT TO_CHAR(f_fecha_actual, 'YYYY-MM-DD"T"HH24:MI:SS') AS fecha FROM DUAL`);
    console.log('Connection successful! Date:', result.rows[0][0]);
  } catch (err) {
    console.error('Connection failed:', err.message);
  } finally {
    if (conn) await conn.close();
  }
}
test();
