const { after, afterEach, before, beforeEach, test } = require("node:test");
const assert = require("node:assert/strict");
const jwt = require("jsonwebtoken");
const Task = require("../models/Task");
const { app } = require("../server");

const jwtSecret = "test-only-secret-for-task-manager";
const userA = "test-user-a";
const userB = "test-user-b";
let server;
let baseUrl;
let tasks;
let queryCounts;
let nextTaskId;
let originalMethods;
let originalJwtSecret;

function tokenFor(userId) {
  return jwt.sign({ id: userId }, jwtSecret);
}

async function request(path, userId, options = {}) {
  const response = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${tokenFor(userId)}`,
      ...(options.headers || {}),
    },
  });

  return {
    response,
    body: await response.json(),
  };
}

before(async () => {
  originalJwtSecret = process.env.JWT_SECRET;
  process.env.JWT_SECRET = jwtSecret;
  originalMethods = {
    find: Task.find,
    create: Task.create,
    findOneAndUpdate: Task.findOneAndUpdate,
    findOneAndDelete: Task.findOneAndDelete,
  };
  server = app.listen(0);
  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

beforeEach(async () => {
  tasks = [];
  queryCounts = new Map();
  nextTaskId = 1;
  Task.find = ({ owner }) => ({
    sort: async () => {
      queryCounts.set(owner, (queryCounts.get(owner) || 0) + 1);
      return tasks
        .filter((task) => task.owner === owner)
        .sort((first, second) => second.createdAt - first.createdAt);
    },
  });
  Task.create = async (data) => {
    const task = {
      ...data,
      _id: `test-task-${nextTaskId++}`,
      createdAt: new Date(),
    };
    tasks.push(task);
    return task;
  };
  Task.findOneAndUpdate = async ({ _id, owner }, updates) => {
    const task = tasks.find((item) => item._id === _id && item.owner === owner);
    if (!task) return null;
    Object.assign(task, updates);
    return task;
  };
  Task.findOneAndDelete = async ({ _id, owner }) => {
    const index = tasks.findIndex((item) => item._id === _id && item.owner === owner);
    if (index === -1) return null;
    return tasks.splice(index, 1)[0];
  };

  await request("/cache", userA, { method: "DELETE" });
  await request("/cache", userB, { method: "DELETE" });
});

afterEach(() => {
  Task.find = originalMethods.find;
  Task.create = originalMethods.create;
  Task.findOneAndUpdate = originalMethods.findOneAndUpdate;
  Task.findOneAndDelete = originalMethods.findOneAndDelete;
});

after(async () => {
  if (originalJwtSecret === undefined) {
    delete process.env.JWT_SECRET;
  } else {
    process.env.JWT_SECRET = originalJwtSecret;
  }
  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
});

test("GET /tasks caches each user's data and reports HIT/MISS", async () => {
  tasks.push(
    { _id: "a-task", title: "A's task", owner: userA, createdAt: new Date() },
    { _id: "b-task", title: "B's task", owner: userB, createdAt: new Date() }
  );

  const firstA = await request("/tasks", userA);
  const secondA = await request("/tasks", userA);
  const firstB = await request("/tasks", userB);

  assert.equal(firstA.response.status, 200);
  assert.equal(firstA.response.headers.get("x-cache"), "MISS");
  assert.equal(secondA.response.headers.get("x-cache"), "HIT");
  assert.equal(firstB.response.headers.get("x-cache"), "MISS");
  assert.deepEqual(firstA.body.map((task) => task.title), ["A's task"]);
  assert.deepEqual(firstB.body.map((task) => task.title), ["B's task"]);
  assert.equal(queryCounts.get(userA), 1);
  assert.equal(queryCounts.get(userB), 1);
});

test("successful create, update, and delete invalidate the owner's task cache", async () => {
  tasks.push({
    _id: "editable-task",
    title: "Original title",
    description: "",
    priority: "medium",
    completed: false,
    owner: userA,
    createdAt: new Date(),
  });

  const initialA = await request("/tasks", userA);
  const initialB = await request("/tasks", userB);
  assert.equal(initialA.response.headers.get("x-cache"), "MISS");
  assert.equal(initialB.response.headers.get("x-cache"), "MISS");

  const created = await request("/tasks", userA, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title: "Created task" }),
  });
  assert.equal(created.response.status, 201);
  const afterCreate = await request("/tasks", userA);
  assert.equal(afterCreate.response.headers.get("x-cache"), "MISS");
  assert.ok(afterCreate.body.some((task) => task.title === "Created task"));

  const updated = await request("/tasks/editable-task", userA, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title: "Updated title" }),
  });
  assert.equal(updated.response.status, 200);
  const afterUpdate = await request("/tasks", userA);
  assert.equal(afterUpdate.response.headers.get("x-cache"), "MISS");
  assert.ok(afterUpdate.body.some((task) => task.title === "Updated title"));

  const deleted = await request("/tasks/editable-task", userA, { method: "DELETE" });
  assert.equal(deleted.response.status, 200);
  const afterDelete = await request("/tasks", userA);
  assert.equal(afterDelete.response.headers.get("x-cache"), "MISS");
  assert.ok(afterDelete.body.every((task) => task._id !== "editable-task"));

  const userBStillCached = await request("/tasks", userB);
  assert.equal(userBStillCached.response.headers.get("x-cache"), "HIT");
  assert.equal(queryCounts.get(userB), 1);
});

test("successful create and delete schedule event logs without breaking the API", async () => {
  const eventLogs = [];
  const originalConsoleLog = console.log;
  console.log = (...values) => {
    eventLogs.push(values.join(" "));
  };

  try {
    const created = await request("/tasks", userA, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "Event test task" }),
    });
    assert.equal(created.response.status, 201);

    await new Promise((resolve) => setImmediate(resolve));
    assert.ok(eventLogs.some((line) =>
      line.includes('[EVENT] task-created | title="Event test task"') &&
      line.includes(`user=${userA}`) &&
      line.includes("time=")
    ));

    const deleted = await request(`/tasks/${created.body._id}`, userA, {
      method: "DELETE",
    });
    assert.equal(deleted.response.status, 200);

    await new Promise((resolve) => setImmediate(resolve));
    assert.ok(eventLogs.some((line) =>
      line.includes('[EVENT] task-deleted | title="Event test task"') &&
      line.includes(`user=${userA}`) &&
      line.includes("time=")
    ));
  } finally {
    console.log = originalConsoleLog;
  }
});

test("AI suggestions validate titles and leave task creation available without a key", async () => {
  const originalApiKey = process.env.OPENAI_API_KEY;
  delete process.env.OPENAI_API_KEY;

  try {
    const emptyTitle = await request("/ai/task-suggestion", userA, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "   " }),
    });
    assert.equal(emptyTitle.response.status, 400);

    const tooLongTitle = await request("/ai/task-suggestion", userA, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "x".repeat(121) }),
    });
    assert.equal(tooLongTitle.response.status, 400);

    const unavailable = await request("/ai/task-suggestion", userA, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "Plan study session" }),
    });
    assert.equal(unavailable.response.status, 503);

    const created = await request("/tasks", userA, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "CRUD still works" }),
    });
    assert.equal(created.response.status, 201);
  } finally {
    if (originalApiKey === undefined) {
      delete process.env.OPENAI_API_KEY;
    } else {
      process.env.OPENAI_API_KEY = originalApiKey;
    }
  }
});

test("AI suggestion sends only the title and validates provider output", async () => {
  const originalApiKey = process.env.OPENAI_API_KEY;
  const originalModel = process.env.OPENAI_MODEL;
  const originalFetch = global.fetch;
  process.env.OPENAI_API_KEY = "test-only-openai-key";
  process.env.OPENAI_MODEL = "test-model";
  let providerOptions;

  global.fetch = async (url, options) => {
    if (String(url).startsWith(baseUrl)) {
      return originalFetch(url, options);
    }

    assert.equal(url, "https://api.openai.com/v1/chat/completions");
    providerOptions = options;
    return new Response(
      JSON.stringify({
        choices: [{
          message: {
            content: JSON.stringify({
              description: "Review notes for the upcoming exam.",
              priority: "high",
            }),
          },
        }],
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  };

  try {
    const result = await request("/ai/task-suggestion", userA, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "Study for exam" }),
    });
    const providerBody = JSON.parse(providerOptions.body);

    assert.equal(result.response.status, 200);
    assert.deepEqual(result.body, {
      description: "Review notes for the upcoming exam.",
      priority: "high",
      disclaimer: "AI-generated suggestion; review before use.",
    });
    assert.equal(providerOptions.headers.Authorization, "Bearer test-only-openai-key");
    assert.equal(providerBody.model, "test-model");
    assert.deepEqual(
      JSON.parse(providerBody.messages[1].content),
      { title: "Study for exam" }
    );
    assert.equal(JSON.stringify(providerBody).includes(tokenFor(userA)), false);
  } finally {
    global.fetch = originalFetch;
    if (originalApiKey === undefined) {
      delete process.env.OPENAI_API_KEY;
    } else {
      process.env.OPENAI_API_KEY = originalApiKey;
    }
    if (originalModel === undefined) {
      delete process.env.OPENAI_MODEL;
    } else {
      process.env.OPENAI_MODEL = originalModel;
    }
  }
});

test("AI provider errors return a structured error without affecting CRUD", async () => {
  const originalApiKey = process.env.OPENAI_API_KEY;
  const originalFetch = global.fetch;
  process.env.OPENAI_API_KEY = "test-only-openai-key";

  global.fetch = async (url, options) => {
    if (String(url).startsWith(baseUrl)) {
      return originalFetch(url, options);
    }
    return new Response("provider unavailable", { status: 429 });
  };

  try {
    const unavailable = await request("/ai/task-suggestion", userA, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "Plan a project" }),
    });
    assert.equal(unavailable.response.status, 502);
    assert.match(unavailable.body.error, /AI suggestion service is unavailable/);

    const created = await request("/tasks", userA, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "Task created during provider outage" }),
    });
    assert.equal(created.response.status, 201);
  } finally {
    global.fetch = originalFetch;
    if (originalApiKey === undefined) {
      delete process.env.OPENAI_API_KEY;
    } else {
      process.env.OPENAI_API_KEY = originalApiKey;
    }
  }
});
