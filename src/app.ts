import express from "express";

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/api/health", require("./routes/health").default);
app.use("/api/users", require("./routes/users").default);

app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: "Ruta no encontrada",
  });
});
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, error: "Error interno del servidor" });
});

app.listen(3000, () => {
  console.log("Servidor escuchando en http://localhost:3000");
});
