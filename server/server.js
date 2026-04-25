const express = require("express");
const cors = require("cors");
const db = require("./db");

const app = express();

app.use(cors());
app.use(express.json());


// ดึงเกมทั้งหมด
app.get("/games", (req, res) => {
  db.query("SELECT * FROM game ORDER BY id ASC", (err, result) => {
    if (err) return res.status(500).json(err);
    res.json(result);
  });
});


// ดึง Tags ทั้งหมด
app.get("/tags", (req, res) => {
  db.query("SELECT * FROM tags ORDER BY id ASC", (err, result) => {
    if (err) return res.status(500).json(err);
    res.json(result);
  });
});


// ดึง Tags ของเกม (ใช้ในหน้า Edit)
app.get("/game-tags/:id", (req, res) => {
  const { id } = req.params;
  const sql = `
    SELECT t.id, t.tag_name
    FROM tags t
    JOIN game_tags gt ON t.id = gt.tag_id
    WHERE gt.game_id = ?
  `;
  db.query(sql, [id], (err, result) => {
    if (err) return res.status(500).json(err);
    res.json(result);
  });
});


// แนะนำเกมจาก tag — threshold 75% match
app.get("/recommend", (req, res) => {
  const tags = req.query.tags?.split(",") || [];
  if (tags.length === 0) return res.json([]);

  // threshold 75% — เกมต้องมี tag ตรงอย่างน้อย 75% ของที่เลือก เรียงจาก match มากไปน้อย
  const threshold = 0.75;
  const minMatch = Math.ceil(tags.length * threshold);

  const sql = `
    SELECT g.*, COUNT(DISTINCT t.tag_name) as match_count
    FROM game g
    JOIN game_tags gt ON g.id = gt.game_id
    JOIN tags t ON t.id = gt.tag_id
    WHERE t.tag_name IN (?)
    GROUP BY g.id
    HAVING match_count >= ?
    ORDER BY match_count DESC
  `;
  db.query(sql, [tags, minMatch], (err, result) => {
    if (err) return res.status(500).json(err);

    // คำนวณ match_percent ส่งกลับไปด้วย
    const withPercent = result.map(g => ({
      ...g,
      match_percent: Math.round((g.match_count / tags.length) * 100)
    }));

    res.json(withPercent);
  });
});


// เพิ่มเกมใหม่พร้อม Tags
app.post("/add-game", (req, res) => {
  const { name, price, image_url, steam_url, tags } = req.body;

  if (!name || price === undefined || price === null) {
    return res.status(400).json({ message: "กรุณากรอกชื่อเกมและราคา" });
  }

  const sqlGame = `
    INSERT INTO game (name, price, image_url, steam_url)
    VALUES (?, ?, ?, ?)
  `;

  db.query(sqlGame, [name, price, image_url || null, steam_url || null], (err, result) => {
    if (err) return res.status(500).json(err);

    const gameId = result.insertId;

    if (tags && tags.length > 0) {
      const values = tags.map(tagId => [gameId, tagId]);
      db.query("INSERT INTO game_tags (game_id, tag_id) VALUES ?", [values], (err2) => {
        if (err2) return res.status(500).json(err2);
        res.json({ message: "Game + Tags added!", gameId });
      });
    } else {
      res.json({ message: "Game added (no tags)", gameId });
    }
  });
});


// แก้ไขเกม
app.put("/edit-game/:id", (req, res) => {
  const { id } = req.params;
  const { name, price, image_url, steam_url, tags } = req.body;

  if (!name || price === undefined || price === null) {
    return res.status(400).json({ message: "กรุณากรอกชื่อเกมและราคา" });
  }

  const sqlUpdate = `
    UPDATE game
    SET name = ?, price = ?, image_url = ?, steam_url = ?
    WHERE id = ?
  `;

  db.query(sqlUpdate, [name, price, image_url || null, steam_url || null, id], (err) => {
    if (err) return res.status(500).json(err);

    // ลบ tags เก่าทั้งหมดของเกมนี้ก่อน
    db.query("DELETE FROM game_tags WHERE game_id = ?", [id], (err2) => {
      if (err2) return res.status(500).json(err2);

      // ถ้ามี tags ใหม่ให้ insert เข้าไป
      if (tags && tags.length > 0) {
        const values = tags.map(tagId => [parseInt(id), tagId]);
        db.query("INSERT INTO game_tags (game_id, tag_id) VALUES ?", [values], (err3) => {
          if (err3) return res.status(500).json(err3);
          res.json({ message: "Game updated!" });
        });
      } else {
        res.json({ message: "Game updated (no tags)" });
      }
    });
  });
});


// ลบเกม
app.delete("/delete-game/:id", (req, res) => {
  const { id } = req.params;

  // ลบ game_tags ก่อน (foreign key)
  db.query("DELETE FROM game_tags WHERE game_id = ?", [id], (err) => {
    if (err) return res.status(500).json(err);

    // แล้วค่อยลบเกม
    db.query("DELETE FROM game WHERE id = ?", [id], (err2, result) => {
      if (err2) return res.status(500).json(err2);

      if (result.affectedRows === 0) {
        return res.status(404).json({ message: "ไม่พบเกมที่ต้องการลบ" });
      }

      res.json({ message: "Game deleted!" });
    });
  });
});


// เปิด server
app.listen(3000, () => {
  console.log("🚀 Server running on http://localhost:3000");
});