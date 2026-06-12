# GEMINI.md - TheraHome Backend

## Tech Stack
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB (Mongoose)
- **Auth**: JWT, Google OAuth

## Project Structure
- `/models`: Mongoose schemas.
- `/routes`: Express API routes.
- `/middleware`: Auth and validation logic.
- `/controllers`: Business logic (implied in routes or separate).
- `/scripts`: Data seeding and utility scripts.
- `server.js`: Entry point.

## Standards
- Use ES Modules.
- Follow RESTful API design.
- Ensure all routes are protected by appropriate middleware.

## Commands
- `npm run dev`
- `npm run seed`
