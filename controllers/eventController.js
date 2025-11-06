import Event from "../models/Event.js";

// ➤ Create a new event
export const createEvent = async (req, res) => {
  try {
    const { title, startTime, endTime } = req.body;

    const event = await Event.create({
      title,
      startTime,
      endTime,
      user: req.user._id,
    });

    res.status(201).json(event);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ➤ Get all events for logged-in user
export const getMyEvents = async (req, res) => {
  try {
    const events = await Event.find({ user: req.user._id }).sort({ startTime: 1 });
    res.json(events);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ➤ Update event status (e.g., BUSY → SWAPPABLE)
export const updateEventStatus = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: "Event not found" });

    if (event.user.toString() !== req.user._id.toString())
      return res.status(401).json({ message: "Not authorized" });

    event.status = req.body.status || event.status;
    const updated = await event.save();
    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ➤ Delete event
export const deleteEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: "Event not found" });

    if (event.user.toString() !== req.user._id.toString())
      return res.status(401).json({ message: "Not authorized" });

    await event.deleteOne();
    res.json({ message: "Event deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
