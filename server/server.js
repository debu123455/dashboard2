const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const Ticket = require("./models/Ticket");
const SystemHealth = require("./models/SystemHealth");

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

const corsOrigin = process.env.CORS_ORIGIN || "http://localhost:5173";
app.use(cors({ origin: corsOrigin }));
app.use(express.json());

async function connectDatabase() {
  const mongoUri = process.env.MONGODB_URI || "mongodb+srv://ledonet974_db_user:UUNgVxlBfIcixTtc@dashboard.amun1q1.mongodb.net/?appName=dashboard";
  try {
    await mongoose.connect(mongoUri);
    console.log("MongoDB connected successfully");
  } catch (error) {
    console.error("MongoDB connection error:", error.message);
    throw error;
  }
}

app.get("/", (_req, res) => {
  res.json({ status: "running", message: "IT Dashboard API is running", endpoints: ["/api/health", "/api/dashboard", "/api/tickets"] });
});

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", service: "IT Dashboard API", timestamp: new Date().toISOString() });
});

function buildTicketCode() {
  return `IT-${Date.now().toString().slice(-6)}`;
}

app.get("/api/dashboard", async (req, res, next) => {
  try {
    const { priority, status, q } = req.query;
    const filters = {};

    if (priority && priority !== "All") {
      filters.priority = priority;
    }

    if (status && status !== "All") {
      filters.status = status;
    }

    if (q) {
      filters.$or = [
        { code: { $regex: q, $options: "i" } },
        { requester: { $regex: q, $options: "i" } },
        { category: { $regex: q, $options: "i" } }
      ];
    }

    const tickets = await Ticket.find(filters).sort({ createdAt: -1 }).limit(50);
    const systems = await SystemHealth.find().sort({ name: 1 });

    const openTickets = await Ticket.countDocuments({ status: { $ne: "Resolved" } });
    const resolvedTickets = await Ticket.countDocuments({ status: "Resolved" });
    const totalTickets = await Ticket.countDocuments();
    const breachedTickets = await Ticket.countDocuments({ slaBreached: true });

    const priorityCounts = await Ticket.aggregate([
      { $group: { _id: "$priority", count: { $sum: 1 } } }
    ]);

    const volume = await Ticket.aggregate([
      {
        $group: {
          _id: { $dayOfWeek: "$createdAt" },
          count: { $sum: 1 }
        }
      },
      { $sort: { "_id": 1 } }
    ]);

    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const weeklyVolume = dayNames.map((label, index) => {
      const match = volume.find((item) => item._id === index + 1);
      return { label, value: match ? match.count : 0 };
    });

    const slaRate = totalTickets === 0
      ? 100
      : Math.round(((totalTickets - breachedTickets) / totalTickets) * 100);

    const averageUptime = systems.length === 0
      ? 100
      : Number((systems.reduce((sum, item) => sum + item.score, 0) / systems.length).toFixed(1));

    res.json({
      metrics: {
        openTickets,
        resolvedTickets,
        slaRate,
        uptimeRate: averageUptime
      },
      tickets,
      systems,
      priorityCounts,
      weeklyVolume
    });
  } catch (error) {
    next(error);
  }
});

app.post("/api/tickets", async (req, res, next) => {
  try {
    const ticket = await Ticket.create({
      code: req.body.code || buildTicketCode(),
      requester: req.body.requester,
      category: req.body.category,
      priority: req.body.priority || "Normal",
      status: req.body.status || "Open",
      slaBreached: Boolean(req.body.slaBreached)
    });
    res.status(201).json(ticket);
  } catch (error) {
    next(error);
  }
});

app.patch("/api/tickets/:id", async (req, res, next) => {
  try {
    const allowedUpdates = ["requester", "category", "priority", "status", "slaBreached"];
    const updates = {};

    allowedUpdates.forEach((field) => {
      if (Object.prototype.hasOwnProperty.call(req.body, field)) {
        updates[field] = req.body[field];
      }
    });

    const ticket = await Ticket.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true
    });
    if (!ticket) {
      return res.status(404).json({ message: "Ticket not found" });
    }
    res.json(ticket);
  } catch (error) {
    next(error);
  }
});

app.delete("/api/tickets/:id", async (req, res, next) => {
  try {
    const ticket = await Ticket.findByIdAndDelete(req.params.id);
    if (!ticket) {
      return res.status(404).json({ message: "Ticket not found" });
    }
    res.json({ message: "Ticket deleted" });
  } catch (error) {
    next(error);
  }
});

app.use((error, _req, res, _next) => {
  console.error(error);
  res.status(500).json({ message: "Something went wrong", detail: error.message });
});

connectDatabase()
  .then(() => {
    app.listen(port, () => {
      console.log(`Server running on http://localhost:${port}`);
    });
  })
  .catch((error) => {
    console.error("Database connection failed", error.message);
    process.exit(1);
  });
