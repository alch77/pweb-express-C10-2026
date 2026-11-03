import express from "express";

const app = express();

app.use(express.json()); // biar req.body (JSON) bisa dibaca

app.get("/health", (_req, res) => {
  res.json({ status: true, message: "Server berjalan" });
});

// nanti router fitur dipasang di sini, contoh:
// app.use("/api/players", playerRouter);

export default app;
