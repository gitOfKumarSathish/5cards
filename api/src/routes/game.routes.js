import { Router } from "express";
import GameController from "../controllers/gameController.js";
const router = Router();

router.post("/create", GameController.createGame);
router.post("/add-users/:gameId", GameController.initializeUsers);
router.post("/submit-rounds/:gameId", GameController.addPointsToGame);
router.get("/:gameId", GameController.getGame);
export default router;