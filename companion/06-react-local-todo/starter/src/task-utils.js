export function readTasks(value, fallback = []) {
  try {
    const parsed = value ? JSON.parse(value) : fallback;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((task) => task && typeof task.id === "string" && typeof task.title === "string" && typeof task.completed === "boolean");
  } catch {
    return [];
  }
}
