import express from "express";
import heroRouter from "./routes/heroRoutes";
import skinRouter from "./routes/skinRoutes";
import purchaseRouter from "./routes/purchaseRoutes";
import statisticsRouter from "./routes/statisticsRoutes";
import { logger } from "./middlewares/logger";
import { notFound } from "./middlewares/notFound";
import { errorHandler } from "./middlewares/errorHandler";

const app = express();

app.use(logger);
app.use(express.json());

app.get("/health", (_req, res) => {
    res.json({ status: true, message: "Server berjalan" });
});

// Router Hero
app.use("/api/heroes", heroRouter);

// Router Skin
app.use("/api/skins", skinRouter);

// Beli Hero (POST /api/players/:player_id/heroes)
app.use("/api/players", purchaseRouter);

// Statistik toko
app.use("/api/statistics", statisticsRouter);

// Wajib paling akhir: 404 lalu error handler
app.use(notFound);
app.use(errorHandler);

export default app;
