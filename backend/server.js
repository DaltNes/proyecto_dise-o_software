const express = require("express");
const cors = require("cors");
const multer = require("multer");

const app = express();
app.use(cors());
app.use(express.json());

const upload = multer({ dest: "uploads/" });

app.get("/", (req, res) => {
  res.send("Servidor de conversión activo");
});

app.post("/upload", upload.single("file"), (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No se subió archivo" });
  res.json({ message: "Archivo recibido", file: req.file });
});

const PORT = 3001;
app.listen(PORT, () => console.log(`Servidor corriendo en puerto ${PORT}`));
