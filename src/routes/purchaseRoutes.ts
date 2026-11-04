import { Router } from "express";
import { buyHero } from "../controllers/purchaseController";

const router = Router();

// POST /api/players/:player_id/heroes
router.post("/:player_id/heroes", buyHero);

export default router;
