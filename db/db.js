const pkg = require("pg");
const dotenv = require("dotenv");
dotenv.config();

const { Pool } = pkg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false, // Render için gerekli
  },
});

pool.connect()
  .then(() => console.log("✅ PostgreSQL bağlantısı başarılı!"))
  .catch(err => console.error("❌ PostgreSQL bağlantı hatası:", err));

module.exports = pool;
