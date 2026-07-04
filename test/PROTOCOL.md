# NILETRON Testing Protocol

This document describes the minimal testing protocol for the NILETRON project and simple smoke scripts you can run locally or in CI.

Goals
- Provide repeatable smoke checks for backend and frontend development servers.
- Describe how to run tests and what environment is required.

Ports and URLs (defaults)
- Backend: http://localhost:4009
- Frontend (Vite dev): http://localhost:3000

Prerequisites
- Node >= 20 for the backend, and Node-compatible environment for frontend (Vite).
- Start the backend (from `backend`):

  npm install
  npm run dev

- (Optional) Reset the database to seed default admin account:

  cd backend
  npm run db:reset

- Start the frontend (from `frontend`):

  npm install
  npm run dev

Smoke tests
- The scripts in `test/backend/smoke.sh` and `test/frontend/smoke.sh` perform basic checks:
  - backend: GET `/api/health` and GET `/` (root HTML)
  - frontend: GET `/` (root HTML)

Run all smoke tests

  bash test/run-all.sh

CI notes
- The smoke scripts are POSIX shell scripts using `curl` and basic exit codes. They are suitable for use in CI pipelines after services are started.
- Example GitHub Actions step (after starting services):

  - name: Run smoke tests
    run: bash test/run-all.sh

Extending tests
- For unit and integration tests add appropriate test frameworks (`vitest`, `jest`, `mocha`, `playwright`) to `backend` or `frontend` and add CI steps to install dev dependencies.

Contact
- If you want, I can add automated unit tests for the backend services or React component tests for the frontend — tell me which area to prioritize.
