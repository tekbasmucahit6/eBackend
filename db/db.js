const mysql = require('mysql2/promise'); // mysql2/promise kullanıyoruz

// createPool ile bağlantı havuzu oluşturuyoruz
const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: 'tekbasmucahit6',
    database: 'manav_db'
});

module.exports = pool;
