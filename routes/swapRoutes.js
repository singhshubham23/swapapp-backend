import express from "express";
import {
  getSwappableSlots,
  createSwapRequest,
  getSwapRequests,
  respondToSwap,
} from "../controllers/swapController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/swappable-slots", protect, getSwappableSlots);
router.post("/swap-request", protect, createSwapRequest);
router.get("/swap-requests", protect, getSwapRequests);
router.post("/swap-response/:id", protect, respondToSwap);

export default router;
