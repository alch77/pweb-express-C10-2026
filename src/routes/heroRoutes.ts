import { Router } from "express";
import {
    getHeroes,
    getHeroById,
    createHero,
} from "../controllers/heroController";

const router = Router();

// GET /api/heroes
router.get("/", getHeroes);

// GET /api/heroes/:hero_id
router.get("/:hero_id", getHeroById);

// POST /api/heroes
router.post("/", createHero);

export default router;
