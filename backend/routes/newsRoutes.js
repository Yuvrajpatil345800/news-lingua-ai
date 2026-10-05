import express from "express";
import {
  textToSpeech,
  summarizeNews,
  getHistory,
  deleteHistoryItem,
} from "../controllers/newsController.js";

import { requireAuth, optionalAuth } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/speech", textToSpeech);

// Logged-in users → summaries are saved to their history
router.post("/summarize", optionalAuth, summarizeNews);

// Only logged-in user can access their own history
router.get("/history", requireAuth, getHistory);

// Only logged-in user can delete their own history
router.delete("/history/:id", requireAuth, deleteHistoryItem);

export default router;
