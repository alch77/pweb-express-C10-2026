import { Router } from "express";
import {
    getSkins,
    getSkinById,
} from "../controllers/skinController";

const router = Router();

// GET /api/skins
router.get("/", getSkins);

// GET /api/skins/:skin_id
router.get("/:skin_id", getSkinById);

export default router;
