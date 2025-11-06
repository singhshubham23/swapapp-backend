import Event from "../models/Event.js";
import SwapRequest from "../models/SwapRequest.js";

// ➤ Get all swappable slots (except the logged-in user's)
export const getSwappableSlots = async (req, res) => {
  try {
    const slots = await Event.find({
      status: "SWAPPABLE",
      user: { $ne: req.user._id },
    }).populate("user", "name email");

    res.json(slots);
  } catch (error) {
    console.error("getSwappableSlots error:", error);
    res.status(500).json({ message: error.message });
  }
};

// ➤ Create a swap request
export const createSwapRequest = async (req, res) => {
  try {
    const { mySlotId, theirSlotId } = req.body;

    const mySlot = await Event.findById(mySlotId);
    const theirSlot = await Event.findById(theirSlotId);

    if (!mySlot || !theirSlot)
      return res.status(404).json({ message: "Slot not found" });

    if (mySlot.status !== "SWAPPABLE" || theirSlot.status !== "SWAPPABLE") {
      return res
        .status(400)
        .json({ message: "Both slots must be SWAPPABLE to request a swap" });
    }

    const swap = await SwapRequest.create({
      requester: req.user._id,
      recipient: theirSlot.user, // ✅ changed from receiver → recipient
      mySlot: mySlot._id,
      theirSlot: theirSlot._id,
      status: "PENDING",
    });

    mySlot.status = "SWAP_PENDING";
    theirSlot.status = "SWAP_PENDING";
    await mySlot.save();
    await theirSlot.save();

    res.status(201).json(swap);
  } catch (error) {
    console.error("createSwapRequest error:", error);
    res.status(500).json({ message: error.message });
  }
};

// Respond to a swap request (accept / reject)
export const respondToSwap = async (req, res) => {
  try {
    const { accept } = req.body;
    const swap = await SwapRequest.findById(req.params.id)
      .populate("mySlot")
      .populate("theirSlot");

    if (!swap) return res.status(404).json({ message: "Swap not found" });

    if (swap.recipient.toString() !== req.user._id.toString())
      return res.status(403).json({ message: "Not authorized to respond" });

    if (swap.status !== "PENDING")
      return res.status(400).json({ message: "Swap already handled" });

    // Correctly identify the slots from the recipient's perspective (req.user)
    const recipientSlot = await Event.findById(swap.theirSlot._id);
    const requesterSlot = await Event.findById(swap.mySlot._id);

    if (accept) {
      // Accept the swap → exchange ownership
      const tempUser = recipientSlot.user;
      recipientSlot.user = requesterSlot.user;
      requesterSlot.user = tempUser;

      recipientSlot.status = "BUSY";
      requesterSlot.status = "BUSY";

      swap.status = "ACCEPTED";

      await recipientSlot.save();
      await requesterSlot.save();
      await swap.save();

      return res.json({ message: "Swap accepted successfully", swap });
    } else {
      // Reject swap → restore both slots
      swap.status = "REJECTED";
      await swap.save();

      recipientSlot.status = "SWAPPABLE";
      requesterSlot.status = "SWAPPABLE";
      await recipientSlot.save();
      await requesterSlot.save();

      return res.json({ message: "Swap rejected", swap });
    }
  } catch (error) {
    console.error("respondToSwap error:", error);
    res.status(500).json({ message: error.message });
  }
};

// ➤ Get all incoming & outgoing swap requests for a user
export const getSwapRequests = async (req, res) => {
  try {
    const incoming = await SwapRequest.find({ recipient: req.user._id })
      .populate("requester", "name email")
      .populate("mySlot")
      .populate("theirSlot");

    const outgoing = await SwapRequest.find({ requester: req.user._id })
      .populate("recipient", "name email")
      .populate("mySlot")
      .populate("theirSlot");

    res.json({ incoming, outgoing });
  } catch (error) {
    console.error("getSwapRequests error:", error);
    res.status(500).json({ message: error.message });
  }
};
