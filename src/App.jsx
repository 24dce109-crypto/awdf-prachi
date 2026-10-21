import { lazy, Suspense, useState } from "react";
import { Route, Routes } from "react-router-dom";

import Navbar from "./components/Navbar";

import Home from "./pages/Home";
import Notfound from "./pages/Notfound";
import Login from "./pages/Login";
import TaskManager from "./pages/TaskManager";

const Project = lazy(() => import("./pages/Project"));
const Contact = lazy(() => import("./pages/Contact"));

function App() {
  const [darkMode, setDarkMode] = useState(false);

  return (
    <div className={darkMode ? "app dark" : "app light"}>
      <Navbar darkMode={darkMode} setDarkMode={setDarkMode} />

      <main className="page-container">
        <Suspense
          fallback={
            <div
              style={{
                minHeight: "50vh",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "20px",
                fontWeight: "600",
              }}
            >
              Loading page...
            </div>
          }
        >
          <Routes>
            <Route path="/" element={<Home />} />

            {/* Lazy-loaded route */}
            <Route path="/projects" element={<Project />} />

            <Route path="/task-manager" element={<TaskManager />} />

            {/* Lazy-loaded route */}
            <Route path="/contact" element={<Contact />} />

            <Route path="/login" element={<Login />} />

            <Route path="*" element={<Notfound />} />
          </Routes>
        </Suspense>
      </main>
    </div>
  );
}

export default App;