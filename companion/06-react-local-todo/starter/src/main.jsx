import { StrictMode, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { readTasks } from "./task-utils.js";
import "./styles.css";

const storageKey = "clineflow.todo-lab.tasks";
const examples = [
  { id: "example-1", title: "Read the project decisions", completed: false },
  { id: "example-2", title: "Verify a small change", completed: true },
];

function App() {
  const [tasks, setTasks] = useState(() => readTasks(localStorage.getItem(storageKey), examples));
  const [title, setTitle] = useState("");
  useEffect(() => { localStorage.setItem(storageKey, JSON.stringify(tasks)); }, [tasks]);
  const addTask = (event) => {
    event.preventDefault();
    const trimmed = title.trim();
    if (!trimmed) return;
    setTasks((current) => [...current, { id: crypto.randomUUID(), title: trimmed, completed: false }]);
    setTitle("");
  };
  return <main><h1>Local todo lab</h1><p>Example tasks stay in this browser.</p>
    <form onSubmit={addTask}><label htmlFor="task-title">New task</label><input id="task-title" value={title} onChange={(event) => setTitle(event.target.value)} /><button type="submit">Add task</button></form>
    {tasks.length === 0 ? <p role="status">No tasks yet. Add a fictional example.</p> : <ul>{tasks.map((task) => <li key={task.id}><label><input type="checkbox" checked={task.completed} onChange={() => setTasks((current) => current.map((item) => item.id === task.id ? { ...item, completed: !item.completed } : item))} /> {task.title}</label><button type="button" aria-label={`Delete ${task.title}`} onClick={() => setTasks((current) => current.filter((item) => item.id !== task.id))}>Delete</button></li>)}</ul>}
  </main>;
}

createRoot(document.getElementById("root")).render(<StrictMode><App /></StrictMode>);
