require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { EventEmitter } = require("node:events");
const NodeCache = require("node-cache");

const User = require("./models/User");
const Task = require("./models/Task");
const authMiddleware = require("./middleware/auth");

const app = express();
const PORT = process.env.PORT || 5000;

// Practical 9: In-memory cache with a 60-second TTL.
const cache = new NodeCache({
  stdTTL: 60,
  checkperiod: 120,
  useClones: true,
});
const taskEvents = new EventEmitter();

function scheduleTaskEventLog(eventName, { title, userId }) {
  setImmediate(() => {
    try {
      console.log(
        `[EVENT] ${eventName} | title="${title}" | time=${new Date().toISOString()} | user=${userId}`
      );
    } catch (error) {
      process.emitWarning(`Unable to log ${eventName}: ${error.message}`);
    }
  });
}

taskEvents.on("task-created", (task) => {
  scheduleTaskEventLog("task-created", task);
});

taskEvents.on("task-deleted", (task) => {
  scheduleTaskEventLog("task-deleted", task);
});

app.use(cors({ origin: process.env.CLIENT_URL || "http://localhost:5174" }));
app.use(express.json());

// Global request logger.
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url} - ${new Date().toISOString()}`);
  next();
});

// Task input validation.
function validateTaskInput(req, res, next) {
  if (
    ["POST", "PUT"].includes(req.method) &&
    req.body.title !== undefined &&
    typeof req.body.title !== "string"
  ) {
    return res.status(400).json({ error: "Title must be a string" });
  }

  if (req.method === "POST" && (!req.body.title || !req.body.title.trim())) {
    return res.status(400).json({ error: "Title is required" });
  }

  if (
    req.body.priority &&
    !["low", "medium", "high"].includes(req.body.priority)
  ) {
    return res.status(400).json({
      error: "Priority must be low, medium, or high",
    });
  }

  next();
}

// Practical 9: Generate a separate cache key for each user.
function getTasksCacheKey(userId) {
  return `tasks_${userId}`;
}

// Practical 9: Clear a user's cached task list after a successful write.
function invalidateTasksCache(userId) {
  const cacheKey = getTasksCacheKey(userId);
  const deleted = cache.del(cacheKey);

  console.log(
    deleted ? `CACHE INVALIDATED: ${cacheKey}` : `NO CACHE TO INVALIDATE: ${cacheKey}`
  );
}

// Health check.
app.get("/", (req, res) => {
  res.json({ message: "Prachi Task Manager API is running" });
});

// Practical 7: User registration.
app.post("/register", async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password || password.length < 6) {
      return res.status(400).json({
        error: "Valid email and password of at least 6 characters are required",
      });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const existing = await User.findOne({ email: normalizedEmail });

    if (existing) {
      return res.status(409).json({ error: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      email: normalizedEmail,
      password: hashedPassword,
    });

    res.status(201).json({
      message: "User registered successfully",
      user: { id: user._id, email: user.email },
    });
  } catch (error) {
    next(error);
  }
});

// Practical 7: Login and JWT generation.
app.post("/login", async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({
      email: String(email || "").toLowerCase().trim(),
    });

    if (!user || !(await bcrypt.compare(password || "", user.password))) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const token = jwt.sign(
      { id: user._id.toString(), email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.status(200).json({
      message: "Login successful",
      token,
    });
  } catch (error) {
    next(error);
  }
});

// Practical 7: Protected current-user route.
app.get("/me", authMiddleware, async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select("_id email createdAt");

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({ user });
  } catch (error) {
    next(error);
  }
});

// Practical 13: Generate an optional suggestion using only the task title.
app.post("/ai/task-suggestion", authMiddleware, async (req, res) => {
  const title = req.body?.title;
  if (typeof title !== "string" || !title.trim() || title.trim().length > 120) {
    return res.status(400).json({
      error: "Task title must be a non-empty string of at most 120 characters",
    });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return res.status(503).json({
      error: "AI suggestions are not configured. Add OPENAI_API_KEY to the backend environment.",
    });
  }

  let providerResponse;
  try {
    providerResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || "gpt-4o-mini",
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content:
              'Suggest a concise task description and priority. Return a JSON object with a "description" string and a "priority" value of "low", "medium", or "high".',
          },
          {
            role: "user",
            content: JSON.stringify({ title: title.trim() }),
          },
        ],
      }),
      signal: AbortSignal.timeout(15000),
    });
  } catch (error) {
    if (error.name === "TimeoutError" || error.name === "AbortError") {
      return res.status(504).json({
        error: "AI suggestion timed out. Please try again.",
      });
    }

    console.error("AI provider request failed:", error.message);
    return res.status(502).json({
      error: "AI suggestion service is unavailable. Please try again later.",
    });
  }

  if (!providerResponse.ok) {
    console.error(`AI provider returned HTTP ${providerResponse.status}`);
    return res.status(502).json({
      error: "AI suggestion service is unavailable. Please try again later.",
    });
  }

  let completion;
  try {
    completion = await providerResponse.json();
  } catch (error) {
    console.error("AI provider returned invalid JSON:", error.message);
    return res.status(502).json({
      error: "AI provider returned an invalid response. Please try again.",
    });
  }

  const content = completion?.choices?.[0]?.message?.content;
  if (typeof content !== "string") {
    return res.status(502).json({
      error: "AI provider returned an invalid suggestion. Please try again.",
    });
  }

  let suggestion;
  try {
    suggestion = JSON.parse(content);
  } catch {
    return res.status(502).json({
      error: "AI provider returned an invalid suggestion. Please try again.",
    });
  }

  const description =
    typeof suggestion?.description === "string"
      ? suggestion.description.trim()
      : "";
  const priority = suggestion?.priority;
  if (
    !description ||
    description.length > 1000 ||
    !["low", "medium", "high"].includes(priority)
  ) {
    return res.status(502).json({
      error: "AI provider returned an invalid suggestion. Please try again.",
    });
  }

  return res.status(200).json({
    description,
    priority,
    disclaimer: "AI-generated suggestion; review before use.",
  });
});

// Practical 9: GET all tasks with in-memory caching.
app.get("/tasks", authMiddleware, async (req, res, next) => {
  const cacheKey = getTasksCacheKey(req.user.id);
  const startTime = performance.now();

  try {
    // Check whether this user's task list is cached.
    const cachedTasks = cache.get(cacheKey);

    if (cachedTasks !== undefined) {
      const duration = (performance.now() - startTime).toFixed(2);

      console.log(`CACHE HIT: ${cacheKey} | ${duration} ms`);

      res.set("X-Cache", "HIT");
      res.set("X-Response-Time-Ms", duration);

      return res.status(200).json(cachedTasks);
    }

    console.log(`CACHE MISS: ${cacheKey}`);

    // Cache miss: fetch the task list from MongoDB.
    const dbStartTime = performance.now();

    const tasks = await Task.find({ owner: req.user.id }).sort({
      createdAt: -1,
    });

    const dbDuration = (performance.now() - dbStartTime).toFixed(2);

    // Store the result for 60 seconds.
    cache.set(cacheKey, tasks);

    const totalDuration = (performance.now() - startTime).toFixed(2);

    console.log(
      `DATABASE QUERY: ${dbDuration} ms | TOTAL: ${totalDuration} ms`
    );

    res.set("X-Cache", "MISS");
    res.set("X-Response-Time-Ms", totalDuration);

    return res.status(200).json(tasks);
  } catch (error) {
    next(error);
  }
});

// Practical 9: Create task and invalidate cache.
app.post("/tasks", authMiddleware, validateTaskInput, async (req, res, next) => {
  try {
    const task = await Task.create({
      ...req.body,
      owner: req.user.id,
    });

    invalidateTasksCache(req.user.id);
    taskEvents.emit("task-created", {
      title: task.title,
      userId: req.user.id,
    });

    res.status(201).json(task);
  } catch (error) {
    next(error);
  }
});

// Practical 9: Update task and invalidate cache.
app.put("/tasks/:id", authMiddleware, validateTaskInput, async (req, res, next) => {
  try {
    const task = await Task.findOneAndUpdate(
      { _id: req.params.id, owner: req.user.id },
      req.body,
      { new: true, runValidators: true }
    );

    if (!task) {
      return res.status(404).json({ error: "Task not found" });
    }

    invalidateTasksCache(req.user.id);

    res.status(200).json(task);
  } catch (error) {
    next(error);
  }
});

// Practical 9: Delete task and invalidate cache.
app.delete("/tasks/:id", authMiddleware, async (req, res, next) => {
  try {
    const task = await Task.findOneAndDelete({
      _id: req.params.id,
      owner: req.user.id,
    });

    if (!task) {
      return res.status(404).json({ error: "Task not found" });
    }

    invalidateTasksCache(req.user.id);
    taskEvents.emit("task-deleted", {
      title: task.title,
      userId: req.user.id,
    });

    res.status(200).json({
      message: "Task deleted successfully",
      task,
    });
  } catch (error) {
    next(error);
  }
});

// Practical 9: Cache statistics for testing.
app.get("/cache/stats", authMiddleware, (req, res) => {
  const stats = cache.getStats();

  res.status(200).json({
    message: "In-memory cache statistics",
    ttlSeconds: 60,
    keys: cache.keys().length,
    hits: stats.hits,
    misses: stats.misses,
    hitRate:
      stats.hits + stats.misses === 0
        ? 0
        : Number(
            (stats.hits / (stats.hits + stats.misses)).toFixed(4)
          ),
  });
});

// Practical 9: Clear the current user's cache for testing.
app.delete("/cache", authMiddleware, (req, res) => {
  const cacheKey = getTasksCacheKey(req.user.id);
  const deleted = cache.del(cacheKey);

  res.status(200).json({
    message: deleted
      ? "Task cache cleared successfully"
      : "No task cache existed for this user",
  });
});

// 404 handler.
app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

// Global error handler must remain last.
app.use((err, req, res, next) => {
  console.error(err.stack);

  if (err.name === "ValidationError") {
    const details = Object.values(err.errors).map((item) => item.message);

    return res.status(400).json({
      error: "Validation failed",
      details,
    });
  }

  if (err.name === "CastError") {
    return res.status(400).json({ error: "Invalid task ID" });
  }

  res.status(500).json({ error: "Something went wrong" });
});

async function startServer() {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error("MONGO_URI is missing from the .env file");
    }

    if (!process.env.JWT_SECRET) {
      throw new Error("JWT_SECRET is missing from the .env file");
    }

    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB connected");

    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
      console.log("Practical 9 caching enabled (TTL: 60 seconds)");
    });
  } catch (error) {
    console.error("Server startup failed:", error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  startServer();
}

module.exports = { app, startServer };