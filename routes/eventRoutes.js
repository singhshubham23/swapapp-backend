import express from "express";
import {
  createEvent,
  getMyEvents,
  updateEventStatus,
  deleteEvent,
} from "../controllers/eventController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.route("/")
  .post(protect, createEvent)
  .get(protect, getMyEvents);

router.route("/:id")
  .put(protect, updateEventStatus)
  .delete(protect, deleteEvent);

export default router;
