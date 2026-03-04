# Start Here

This is the single entry point for running the Foodlobbyin project locally. Follow the steps below in order.

For a technical deep dive, see [README.md](./README.md).

---

## Before you begin

Make sure the following are installed and running on your computer:

- **Docker Desktop** — must show a green "Running" status before you proceed.
- **Node.js** (version 16 or higher) — download from https://nodejs.org/ if not installed.

---

## How to start

### On Windows

1. Open File Explorer and navigate to the project folder (for example, `Documents/GitHub/index`).
2. Find the file named `start.bat`.
3. Double-click `start.bat`.
4. A terminal window will open and run automatically. Wait 1–2 minutes.

### On Mac or Linux

1. Open Terminal.
2. Navigate to the project folder:
   ```
   cd /path/to/your/project
   ```
3. Run:
   ```
   ./start.sh
   ```
4. Wait 1–2 minutes for everything to start.

---

## What happens while it starts

The script runs these steps automatically:

1. Checks that Docker and Node.js are available.
2. Installs dependencies.
3. Starts the database (PostgreSQL) inside Docker.
4. Starts the backend server on port 5000.
5. Starts the frontend server on port 3000.
6. Opens your browser to http://localhost:3000/

Keep the terminal windows open. They keep the servers running.

---

## What to open in your browser

Once the script finishes, you can visit:

| Page | URL |
|------|-----|
| Home | http://localhost:3000/ |
| News | http://localhost:3000/news |
| Login | http://localhost:3000/login |
| API documentation | http://localhost:5000/api-docs |

---

## What success looks like

You will know the app is running correctly when:

- Your browser opened to http://localhost:3000/ automatically (or you can open it yourself).
- You can see the Foodlobbyin homepage with a "Sign In" button.
- The terminal windows are still open in the background.

---

## How to stop

When you are done:

- **Windows:** Double-click `stop.bat`, or close the terminal windows.
- **Mac/Linux:** Run `./stop.sh` in the terminal, or press `Ctrl+C` in each terminal window.

---

## Troubleshooting

**Database is missing tables or the backend reports schema errors**
- The database schema is applied automatically the first time Docker creates the database volume.
- If you need to rebuild the schema from scratch (e.g. after a schema change), delete the existing volume and restart: `cd infrastructure && docker-compose down -v && docker-compose up -d`.

**"Docker is not running"**
- Open Docker Desktop and wait until it shows a green "Running" status, then try again.

**"Port 5000 is already in use" or "Port 3000 is already in use"**
- Run `stop.bat` (Windows) or `./stop.sh` (Mac/Linux), then try starting again.

**"Node.js is not installed"**
- Download and install Node.js from https://nodejs.org/, then try again.

**Nothing happens when I double-click start.bat**
- Confirm Docker Desktop is running (green status).
- Make sure you are in the correct folder and can see `start.bat`.

**Something else went wrong**
- Look at the error message in the terminal window.
- Take a screenshot of the error.
- Check [README.md](./README.md) for detailed troubleshooting steps.
- See [docs/NEXT_STEPS.md](./docs/NEXT_STEPS.md) for guidance on what to do next.

---

## More documentation

| Document | What it covers |
|----------|---------------|
| [README.md](./README.md) | Full technical setup and project details |
| [docs/PROJECT_OVERVIEW_AND_STATUS.md](./docs/PROJECT_OVERVIEW_AND_STATUS.md) | Current project status |
| [docs/ROADMAP.md](./docs/ROADMAP.md) | Planned features and next milestones |
| [docs/NEXT_STEPS.md](./docs/NEXT_STEPS.md) | Practical next actions based on your available time |
