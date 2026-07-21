# Chess Now!

Real-time chess API with challenges, matches, and authentication.

## Stack

| Layer    | Tech                                                                                      |
| -------- | ----------------------------------------------------------------------------------------- |
| Frontend | Next.js, Tailwind CSS, shadcn/ui                                                          |
| Backend  | Elysia with Bun                                                                           |
| Database | PostgreSQL with Drizzle ORM. Redis or in-memory as secondary DB.                          |
| Auth     | Better Auth (email/password, social, device)                                              |
| Docs     | [Fumadocs](https://github.com/fuma-nama/fumadocs) with OpenAPI and TypeScript integration |

## Getting Started

```bash
bun install
cp .env.template .env # fill in environment variables
bun dev               # starts web + api concurrently
```

## Packages

This is a monorepo that contains other packages besides the main API.

| Package                                                          | Path                | Description                                    |
| ---------------------------------------------------------------- | ------------------- | ---------------------------------------------- |
| [`@chess-now/api`](https://www.npmjs.com/package/@chess-now/api) | `packages/api/`     | TypeScript client for the HTTP + WebSocket API |
| `@chess-now/bots`                                                | `packages/bots/`    | Bots you can play against                      |
| `@chess-now/discord`                                             | `packages/discord/` | Discord bot for the chess game                 |
| `@chess-now/tui`                                                 | `packages/tui/`     | TypeScript terminal UI client                  |

## Documentation

Visit the [docs](https://chess-now.example.com/docs) for the full API and package reference.
