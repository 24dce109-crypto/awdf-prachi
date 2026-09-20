require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const User = require("./models/User");
const Task = require("./models/Task");
const authMiddleware = require("./middleware/auth");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({ origin: process.env.CLIENT_URL || "http://localhost:5174" }));
app.use(express.json());

// Global request logger: method, URL and timestamp.
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url} - ${new Date().toISOString()}`);
  next();
});

function validateTaskInput(req, res, next) {
  if (["POST", "PUT"].includes(req.method) && req.body.title !== undefined && typeof req.body.title !== "string") {
    return res.status(400).json({ error: "Title must be a string" });
  }
  if (req.method === "POST" && (!req.body.title || !req.body.title.trim())) {
    return res.status(400).json({ error: "Title is required" });
  }
  if (req.body.priority && !["low", "medium", "high"].includes(req.body.priority)) {
    return res.status(400).json({ error: "Priority must be low, medium, or high" });
  }
  next();
}

app.get("/", (req, res) => res.json({ message: "Prachi Task Manager API is running" }));

// Practical 7: registration.
app.post("/register", async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password || password.length < 6) {
      return res.status(400).json({ error: "Valid email and password of at least 6 characters are required" });
    }
    const existing = await User.findOne({ email: email.toLowerCase().trim() });
    if (existing) return res.status(409).json({ error: "User already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({ email: email.toLowerCase().trim(), password: hashedPassword });
    res.status(201).json({ message: "User registered successfully", user: { id: user._id, email: user.email } });
  } catch (error) { next(error); }
});

// Practical 7: login + JWT.
app.post("/login", async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email: String(email || "").toLowerCase().trim() });
    if (!user || !(await bcrypt.compare(password || "", user.password))) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const token = jwt.sign({ id: user._id.toString(), email: user.email }, process.env.JWT_SECRET, { expiresIn: "1h" });
    res.status(200).json({ message: "Login successful", token });
  } catch (error) { next(error); }
});

// Practical 7: protected current-user route.
app.get("/me", authMiddleware, async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select("_id email createdAt");
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json({ user });
  } catch (error) { next(error); }
});

// Practical 5-6: protected MongoDB CRUD.
app.get("/tasks", authMiddleware, async (req, res, next) => {
  try {
    const tasks = await Task.find({ owner: req.user.id }).sort({ createdAt: -1 });
    res.status(200).json(tasks);
  } catch (error) { next(error); }
});

app.post("/tasks", authMiddleware, validateTaskInput, async (req, res, next) => {
  try {
    const task = await Task.create({ ...req.body, owner: req.user.id });
    res.status(201).json(task);
  } catch (error) { next(error); }
});

app.put("/tasks/:id", authMiddleware, validateTaskInput, async (req, res, next) => {
  try {
    const task = await Task.findOneAndUpdate({ _id: req.params.id, owner: req.user.id }, req.body, { new: true, runValidators: true });
    if (!task) return res.status(404).json({ error: "Task not found" });
    res.status(200).json(task);
  } catch (error) { next(error); }
});

app.delete("/tasks/:id", authMiddleware, async (req, res, next) => {
  try {
    const task = await Task.findOneAndDelete({ _id: req.params.id, owner: req.user.id });
    if (!task) return res.status(404).json({ error: "Task not found" });
    res.status(200).json({ message: "Task deleted successfully", task });
  } catch (error) { next(error); }
});

app.use((req, res) => res.status(404).json({ error: "Route not found" }));

// Global error handler must remain last.
app.use((err, req, res, next) => {
  console.error(err.stack);
  if (err.name === "ValidationError") {
    const details = Object.values(err.errors).map((item) => item.message);
    return res.status(400).json({ error: "Validation failed", details });
  }
  if (err.name === "CastError") return res.status(400).json({ error: "Invalid task ID" });
  res.status(500).json({ error: "Something went wrong" });
});

async function startServer() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB connected");
    app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
  } catch (error) {
    console.error("MongoDB connection failed:", error.message);
    process.exit(1);
  }
}

startServer();
