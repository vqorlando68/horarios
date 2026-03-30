const oracledb = require('oracledb');
require('dotenv').config({path: '.env.local'});

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
    console.log('Connection successful!');
  } catch (err) {
    console.error('Connection failed:', err.message);
  } finally {
    if (conn) await conn.close();
  }
}
test();
