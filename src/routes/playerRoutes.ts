import { Router } from "express";
import {
  createPlayer,
  getPlayer,
  updatePlayer,
  deletePlayer,
  topUp,
  playMatch,
} from "../controllers/playerController";

const router = Router();

router.post("/", createPlayer);
router.get("/:player_id", getPlayer);
router.patch("/:player_id", updatePlayer);
router.delete("/:player_id", deletePlayer);
router.post("/:player_id/topup", topUp);
router.post("/:player_id/matches", playMatch);

export default router;
