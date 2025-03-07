const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const pool = require("../db/db.js");

const router = express.Router();

// 📂 Resimlerin kaydedileceği klasör
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "images/"); // Resimler "images" klasörüne kaydedilecek
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname)); // Dosya adı: timestamp.jpg/png
  },
});

const upload = multer({ storage });

// 📌 Bütün Ürünleri Getirme
router.get("/getAllProduct", async (req, res) => {
  try {
    const result = await pool.query('SELECT "Productsid" ,"ProductsName", "ProductsPrice", "ProductsImg" FROM products');
    return res.json(result.rows);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Ürünler getirilirken bir hata oluştu" });
  }
});

// 📌 Ürün Ekleme
router.post("/add", upload.single("image"), async (req, res) => {
  try {
    const { productsName, productsPrice } = req.body;
    const imagePath = `/images/${req.file.filename}`;

    const result = await pool.query(
      'INSERT INTO products ("ProductsName", "ProductsPrice", "ProductsImg") VALUES ($1, $2, $3) RETURNING *',
      [productsName, productsPrice, imagePath]
    );

    return res.json({
      message: "Ürün başarıyla eklendi",
      product: result.rows[0],
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Ürün ekleme hatası" });
  }
});

// 📌 Ürün Güncelleme
router.post("/update/:id", upload.single("image"), async (req, res) => {
  try {
    const { productsName, productsPrice } = req.body;
    const productId = req.params.id;

    const oldProduct = await pool.query('SELECT "ProductsImg" FROM products WHERE "Productsid" = $1', [productId]);
    if (oldProduct.rows.length === 0) {
      return res.status(404).json({ message: "Ürün bulunamadı" });
    }

    let imagePath = oldProduct.rows[0].ProductsImg;

    if (req.file) {
      const newImagePath = `/images/${req.file.filename}`;
      const oldImagePath = path.join(__dirname, "..", imagePath);

      if (fs.existsSync(oldImagePath)) {
        fs.unlink(oldImagePath, (err) => {
          if (err) console.error("Dosya silme hatası:", err);
        });
      }

      imagePath = newImagePath;
    }

    const result = await pool.query(
      'UPDATE products SET "ProductsName" = $1, "ProductsPrice" = $2, "ProductsImg" = $3 WHERE "Productsid" = $4 RETURNING *',
      [productsName, productsPrice, imagePath, productId]
    );

    return res.json({
      message: "Ürün başarıyla güncellendi",
      product: result.rows[0],
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Ürün güncelleme hatası" });
  }
});

// 📌 Ürün Silme
router.post("/delete/:id", async (req, res) => {
  try {
    const productId = req.params.id;
    if (!productId) return res.status(400).json({ message: "Geçersiz ürün ID" });

    const product = await pool.query('SELECT "ProductsImg" FROM products WHERE "Productsid" = $1', [productId]);
    if (product.rows.length === 0) {
      return res.status(404).json({ message: "Ürün bulunamadı" });
    }

    const imagePath = path.join(__dirname, "..", product.rows[0].ProductsImg);

    const result = await pool.query('DELETE FROM products WHERE "Productsid" = $1 RETURNING *', [productId]);
    if (result.rowCount === 0) return res.status(500).json({ message: "Ürün silme hatası" });

    if (fs.existsSync(imagePath)) {
      fs.unlink(imagePath, (err) => {
        if (err) console.error("Dosya silme hatası:", err);
      });
    }

    return res.json({ message: "Ürün başarıyla silindi" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Ürün silme hatası" });
  }
});

module.exports = router;
