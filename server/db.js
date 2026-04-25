const mysql = require("mysql2");

// 🔌 ตั้งค่าการเชื่อมต่อ
const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",           // XAMPP ปกติไม่มีรหัส
  database: "game_recommend"
});

// เชื่อมต่อ
db.connect((err) => {
  if (err) {
    console.error("❌ DB Error:", err);
    return;
  }
  console.log("✅ MySQL Connected");
});

module.exports = db;