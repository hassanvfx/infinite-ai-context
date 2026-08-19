import { describe, expect, it } from "vitest";
import { readTasks } from "./task-utils.js";

describe("readTasks", () => {
  it("keeps a valid stored task array", () => {
    const tasks = [{ id: "1", title: "Check journal", completed: false }];
    expect(readTasks(JSON.stringify(tasks))).toEqual(tasks);
  });

  it("falls back to an empty list when stored data is malformed", () => {
    expect(readTasks("not-json")).toEqual([]);
    expect(readTasks(JSON.stringify({ task: "wrong shape" }))).toEqual([]);
  });
});
