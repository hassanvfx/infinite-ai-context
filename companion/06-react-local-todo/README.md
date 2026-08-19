# React Local-First Todo Lab

Companion project for Chapter 6. It keeps fictional example tasks in browser
`localStorage`; it has no account, server, analytics, or synchronization.

## Run it locally

1. Use a current Node.js installation.
2. From `starter/`, run `npm install` and then `npm run dev`.
3. Open the local address Vite reports.

Before asking an agent to edit anything, read `knowledge/index.md`, the two
decisions, and the active journal. Follow `prompts/first-task.md`. Do not enter
private or work-sensitive tasks into this learning project. Clearing browser
storage clears the examples.

## Checks

Run `npm test` after dependencies are installed. Then add two sample tasks,
toggle one, reload, delete one, and clear the storage key in developer tools.
The app should remain usable after each check.
