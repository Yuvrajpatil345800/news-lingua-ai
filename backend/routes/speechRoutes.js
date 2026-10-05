import express from "express";
import { speakText } from "../controllers/speechController.js";

const router = express.Router();

router.post("/speak", speakText);

export default router;