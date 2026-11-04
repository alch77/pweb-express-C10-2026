import express from "express";
import heroRouter from "./routes/heroRoutes";
import skinRouter from "./routes/skinRoutes";

const app = express();

app.use(express.json());

app.get("/health", (_req, res) => {
    res.json({ status: true, message: "Server berjalan" });
});

// Router Hero
app.use("/api/heroes", heroRouter);

// Router Skin
app.use("/api/skins", skinRouter);

export default app;
