import { Router } from "express";
import { getStatistics } from "../controllers/statisticsController";

const router = Router();

// GET /api/statistics
router.get("/", getStatistics);

export default router;
