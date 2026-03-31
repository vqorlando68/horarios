const oracledb = require('oracledb');
require('dotenv').config({path: './.env'});

console.log('User:', process.env.DB_USER);
console.log('ConnStr:', process.env.DB_CONNECTION_STRING);

async function run() {
  try {
    const conn = await oracledb.getConnection({
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      connectString: process.env.DB_CONNECTION_STRING
    });
    console.log('SUCCESS');
    const res = await conn.execute("SELECT 1 FROM DUAL");
    console.log('Query result:', res.rows);
    await conn.close();
  } catch (e) {
    console.error('ERROR:', e.message);
  }
}
run();
