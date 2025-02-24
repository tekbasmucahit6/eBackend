const express = require("express");
const router = express.Router();
const pool = require("../db/db"); // DB bağlantısı
const multer = require("multer");
const path = require("path");
const fs = require("fs");

// 📂 Resimlerin kaydedileceği klasör
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, "images/"); // Resimler "images" klasörüne kaydedilecek
    },
    filename: (req, file, cb) => {
      cb(null, Date.now() + path.extname(file.originalname)); // Dosya adı: timestamp.jpg/png
    },
});
  
const upload = multer({ storage: storage });

// 📌 Bütün Ürünleri Getirme
router.get("/getAllProduct", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM products");
    return res.json(rows);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Error retrieving products" });
  }
});

// 📌 Ürün Ekleme
router.post("/add", upload.single("image"), async (req, res) => {
  try {
    const { productsName, productsPrice } = req.body;
    const imagePath = `/images/${req.file.filename}`; // Resmin yolu

    // Ürünü ekleyelim
    const [result] = await pool.query(
      "INSERT INTO products (productsName, productsPrice, productsImg) VALUES (?, ?, ?)",
      [productsName, productsPrice, imagePath]
    );

    if (result.affectedRows !== 0) {
      return res.json({
        message: "Ürün başarıyla eklendi",
        imageUrl: imagePath,
      });
    } else {
      return res.status(500).json({ message: "Error adding product" });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Error adding product" });
  }
});

// 📌 Ürün Güncelleme
router.post("/update/:id", upload.single("image"), async (req, res) => {
  try {
    const { productsName, productsPrice } = req.body;
    const productId = req.params.id;

    // Önce ürünün eski resmini bulalım
    const [oldProduct] = await pool.query("SELECT productsImg FROM products WHERE productsid = ?", [productId]);
    if (oldProduct.length === 0) {
      return res.status(404).json({ message: "Product not found" });
    }

    let imagePath = oldProduct[0].productsImg;

    // Eğer yeni bir resim yüklendiyse
    if (req.file) {
      const newImagePath = `/images/${req.file.filename}`;
      // Eski resmi sil
      const oldImagePath = path.join(__dirname, '..', oldProduct[0].productsImg);
      fs.unlink(oldImagePath, (err) => {
        if (err) {
          console.error("Error deleting old image:", err);
        }
      });
      imagePath = newImagePath;
    }

    // Ürünü güncelle
    const [result] = await pool.query(
      "UPDATE products SET productsName = ?, productsPrice = ?, productsImg = ? WHERE productsid = ?",
      [productsName, productsPrice, imagePath, productId]
    );

    if (result.affectedRows !== 0) {
      return res.json({
        message: "Ürün başarıyla güncellendi",
        imageUrl: imagePath,
      });
    } else {
      return res.status(500).json({ message: "Error updating product" });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Error updating product" });
  }
});

// 📌 Ürün Silme
router.post("/delete/:id", async (req, res) => {
  try {
    const productId = req.params.id;
    if (!productId || productId === 'undefined') {
      return res.status(400).json({ message: "Invalid product ID" });
    }

    // Önce ürünün resmini bulalım
    const [rows] = await pool.query("SELECT productsImg FROM products WHERE productsid = ?", [productId]);
    if (rows.length === 0) {
      return res.status(404).json({ message: "Product not found" });
    }

    const imagePath = path.join(__dirname, '..', rows[0].productsImg);

    // Ürünü sil
    const [result] = await pool.query("DELETE FROM products WHERE productsid = ?", [productId]);
    if (result.affectedRows !== 0) {
      // Resmi de sil
      fs.unlink(imagePath, (err) => {
        if (err) {
          console.error("Error deleting image:", err);
        }
      });
      return res.json({ message: "Ürün başarıyla silindi" });
    } else {
      return res.status(500).json({ message: "Error deleting product" });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Error deleting product" });
  }
});

module.exports = router;