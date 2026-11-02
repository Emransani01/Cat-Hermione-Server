const express = require("express");
const { ObjectId } = require("mongodb");
const verifyToken = require("../middleware/verify-token");

const router = express.Router();

const eventsCollection = (req) => req.app.locals.db.collection("events");

// Validate event data for Create and Update
function validateEventData(body) {
  const { title, description, eventType, thumbnail, location, eventDate } =
    body;

  if (
    typeof title !== "string" ||
    typeof description !== "string" ||
    typeof eventType !== "string" ||
    typeof thumbnail !== "string" ||
    typeof location !== "string" ||
    typeof eventDate !== "string" ||
    !title.trim() ||
    !description.trim() ||
    !eventType.trim() ||
    !thumbnail.trim() ||
    !location.trim() ||
    !eventDate
  ) {
    return "All event fields are required.";
  }

  if (title.trim().length < 3) {
    return "Event title must be at least 3 characters.";
  }

  if (description.trim().length < 20) {
    return "Description must be at least 20 characters.";
  }

  try {
    const imageUrl = new URL(thumbnail.trim());

    if (!["http:", "https:"].includes(imageUrl.protocol)) {
      return "Please provide a valid thumbnail URL.";
    }
  } catch {
    return "Please provide a valid thumbnail URL.";
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(eventDate)) {
    return "Invalid event date format. Use YYYY-MM-DD.";
  }

  const [year, month, day] = eventDate.split("-").map(Number);

  const calendarDate = new Date(0);
  calendarDate.setUTCHours(0, 0, 0, 0);
  calendarDate.setUTCFullYear(year, month - 1, day);

  if (
    calendarDate.getUTCFullYear() !== year ||
    calendarDate.getUTCMonth() !== month - 1 ||
    calendarDate.getUTCDate() !== day
  ) {
    return "Invalid calendar date.";
  }

  const todayInDhaka = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Dhaka",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());

  if (eventDate <= todayInDhaka) {
    return "Event date must be in the future.";
  }

  return null;
}

// Prepare event data before saving
function prepareEventData(body) {
  return {
    title: body.title.trim(),
    description: body.description.trim(),
    eventType: body.eventType.trim(),
    thumbnail: body.thumbnail.trim(),
    location: body.location.trim(),
    eventDate: new Date(`${body.eventDate}T00:00:00+06:00`),
  };
}

// POST /api/events
// Create a new event (Protected)
router.post("/", verifyToken, async (req, res) => {
  try {
    const db = req.app.locals.db;

    const validationError = validateEventData(req.body);

    if (validationError) {
      return res.status(400).json({
        success: false,
        message: validationError,
      });
    }

    if (!req.user?.id || !req.user?.email) {
      return res.status(401).json({
        success: false,
        message: "Unable to verify user identity.",
      });
    }

    const now = new Date();

    const newEvent = {
      ...prepareEventData(req.body),
      creatorId: req.user.id,
      creatorEmail: req.user.email,
      createdAt: now,
      updatedAt: now,
    };

    const result = await db.collection("events").insertOne(newEvent);

    return res.status(201).json({
      success: true,
      message: "Event created successfully!",
      data: {
        _id: result.insertedId,
        ...newEvent,
      },
    });
  } catch (error) {
    console.error("Create event error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to create event.",
    });
  }
});

// GET /api/events
// Get upcoming events with search, filters, sorting and pagination
router.get("/", async (req, res) => {
  try {
    const db = req.app.locals.db;

    const {
      search = "",
      category = "",
      location = "",
      sort = "nearest",
      page = "1",
      limit = "10",
    } = req.query;

    const currentPage = Math.max(1, parseInt(page, 10) || 1);
    const itemsPerPage = Math.min(50, Math.max(1, parseInt(limit, 10) || 10));

    const filter = {
      eventDate: { $gt: new Date() },
    };

    if (typeof search === "string" && search.trim()) {
      const safeSearch = search.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

      filter.$or = [
        { title: { $regex: safeSearch, $options: "i" } },
        { location: { $regex: safeSearch, $options: "i" } },
      ];
    }

    if (typeof category === "string" && category.trim()) {
      filter.eventType = category.trim();
    }

    if (typeof location === "string" && location.trim()) {
      const safeLocation = location
        .trim()
        .replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

      filter.location = {
        $regex: safeLocation,
        $options: "i",
      };
    }

    const sortOrder = sort === "latest" ? -1 : 1;

    const totalEvents = await db.collection("events").countDocuments(filter);

    const events = await db
      .collection("events")
      .find(filter)
      .sort({ eventDate: sortOrder, createdAt: -1 })
      .skip((currentPage - 1) * itemsPerPage)
      .limit(itemsPerPage)
      .toArray();

    return res.status(200).json({
      success: true,
      message: "Upcoming events fetched successfully.",
      data: events,
      pagination: {
        totalEvents,
        currentPage,
        totalPages: Math.ceil(totalEvents / itemsPerPage),
        limit: itemsPerPage,
      },
    });
  } catch (error) {
    console.error("Get events error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch events.",
    });
  }
});

// GET /api/events/my/created-events
// Get only the logged-in user's created events (Protected)
router.get("/my/created-events", verifyToken, async (req, res) => {
  try {
    const events = await eventsCollection(req)
      .find({ creatorId: req.user.id })
      .sort({ createdAt: -1 })
      .toArray();

    return res.status(200).json({
      success: true,
      message: "Your created events fetched successfully.",
      data: events,
    });
  } catch (error) {
    console.error("Get my events error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch your events.",
    });
  }
});

// GET /api/events/my/joined-events
// Get events joined by the logged-in user (Protected)
router.get("/my/joined-events", verifyToken, async (req, res) => {
  try {
    const db = req.app.locals.db;

    const joins = await db
      .collection("joinedEvents")
      .find({ userId: req.user.id })
      .toArray();

    if (joins.length === 0) {
      return res.status(200).json({
        success: true,
        message: "Your joined events fetched successfully.",
        data: [],
      });
    }

    const joinedEventIds = joins
      .map((join) => join.eventId)
      .filter((id) => ObjectId.isValid(id))
      .map((id) => new ObjectId(id));

    if (joinedEventIds.length === 0) {
      return res.status(200).json({
        success: true,
        message: "Your joined events fetched successfully.",
        data: [],
      });
    }

    const events = await db
      .collection("events")
      .find({ _id: { $in: joinedEventIds } })
      .sort({ eventDate: 1 })
      .toArray();

    const joinedAtMap = new Map(
      joins.map((join) => [join.eventId, join.joinedAt]),
    );

    const joinedEvents = events.map((event) => ({
      ...event,
      joinedAt: joinedAtMap.get(event._id.toString()),
    }));

    return res.status(200).json({
      success: true,
      message: "Your joined events fetched successfully.",
      data: joinedEvents,
    });
  } catch (error) {
    console.error("Get joined events error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch your joined events.",
    });
  }
});

// POST /api/events/:id/join
// Join an event (Protected)
router.post("/:id/join", verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const db = req.app.locals.db;

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid event ID.",
      });
    }

    if (!req.user?.id || !req.user?.email) {
      return res.status(401).json({
        success: false,
        message: "Unable to verify user identity.",
      });
    }

    const event = await db.collection("events").findOne({
      _id: new ObjectId(id),
    });

    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Event not found.",
      });
    }

    if (event.eventDate <= new Date()) {
      return res.status(400).json({
        success: false,
        message: "This event is no longer available for joining.",
      });
    }

    const joinedEventsCollection = db.collection("joinedEvents");

    // Prevent duplicate joins at database level
    await joinedEventsCollection.createIndex(
      { eventId: 1, userId: 1 },
      {
        unique: true,
        name: "unique_event_user_join",
      },
    );

    const joinRecord = {
      eventId: id,
      userId: req.user.id,
      userEmail: req.user.email,
      joinedAt: new Date(),
    };

    const result = await joinedEventsCollection.insertOne(joinRecord);

    return res.status(201).json({
      success: true,
      message: "You have successfully joined this event!",
      data: {
        _id: result.insertedId,
        ...joinRecord,
      },
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "You have already joined this event.",
      });
    }

    console.error("Join event error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to join this event.",
    });
  }
});

// DELETE /api/events/:id/leave
// Leave an event (Protected)
router.delete("/:id/leave", verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const db = req.app.locals.db;

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid event ID.",
      });
    }

    if (!req.user?.id) {
      return res.status(401).json({
        success: false,
        message: "Unable to verify user identity.",
      });
    }

    const result = await db.collection("joinedEvents").deleteOne({
      eventId: id,
      userId: req.user.id,
    });

    if (result.deletedCount === 0) {
      return res.status(404).json({
        success: false,
        message: "You have not joined this event.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "You have successfully left this event.",
    });
  } catch (error) {
    console.error("Leave event error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to leave this event.",
    });
  }
});

// GET /api/events/:id
// Get a single event by ID (Public)
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid event ID.",
      });
    }

    const event = await eventsCollection(req).findOne({
      _id: new ObjectId(id),
    });

    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Event not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Event fetched successfully.",
      data: event,
    });
  } catch (error) {
    console.error("Get event details error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch event details.",
    });
  }
});

// PATCH /api/events/:id
// Update an event (Only the owner can update)
router.patch("/:id", verifyToken, async (req, res) => {
  try {
    const { id } = req.params;

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid event ID.",
      });
    }

    const validationError = validateEventData(req.body);

    if (validationError) {
      return res.status(400).json({
        success: false,
        message: validationError,
      });
    }

    const db = req.app.locals.db;

    const existingEvent = await db.collection("events").findOne({
      _id: new ObjectId(id),
    });

    if (!existingEvent) {
      return res.status(404).json({
        success: false,
        message: "Event not found.",
      });
    }

    if (existingEvent.creatorId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "You are not allowed to update this event.",
      });
    }

    const updatedData = {
      ...prepareEventData(req.body),
      updatedAt: new Date(),
    };

    await db
      .collection("events")
      .updateOne(
        { _id: new ObjectId(id), creatorId: req.user.id },
        { $set: updatedData },
      );

    const updatedEvent = await db.collection("events").findOne({
      _id: new ObjectId(id),
    });

    return res.status(200).json({
      success: true,
      message: "Event updated successfully!",
      data: updatedEvent,
    });
  } catch (error) {
    console.error("Update event error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update event.",
    });
  }
});

// DELETE /api/events/:id
// Delete an event (Only the owner can delete)
router.delete("/:id", verifyToken, async (req, res) => {
  try {
    const { id } = req.params;

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid event ID.",
      });
    }

    const db = req.app.locals.db;
    const eventId = new ObjectId(id);

    const existingEvent = await db.collection("events").findOne({
      _id: eventId,
    });

    if (!existingEvent) {
      return res.status(404).json({
        success: false,
        message: "Event not found.",
      });
    }

    if (existingEvent.creatorId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "You are not allowed to delete this event.",
      });
    }

    await db.collection("events").deleteOne({
      _id: eventId,
      creatorId: req.user.id,
    });

    // Remove all join records associated with this event
    await db.collection("joinedEvents").deleteMany({
      eventId: eventId.toString(),
    });

    return res.status(200).json({
      success: true,
      message: "Event and related join records deleted successfully.",
    });
  } catch (error) {
    console.error("Delete event error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to delete event.",
    });
  }
});

module.exports = router;
