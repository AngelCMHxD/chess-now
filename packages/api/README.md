# @chess-now/api

Official TypeScript wrapper for the [Chess Now!](https://github.com/angelcmhxd/chess-now) API. Handles authentication, validation, and WebSocket events. Everything typed end-to-end.

## Install

```bash
npm install @chess-now/api
# or
pnpm add @chess-now/api
# or
bun add @chess-now/api
```

## Quick Start

```ts
import { ChessNowClient } from "@chess-now/api";

const api = new ChessNowClient("https://chess-now.example.com");
api.setDefaultToken("your-token");

// HTTP
const user = await api.getAccountInfo();
const challenges = await api.getMyChallenges();
const match = await api.getMatch(42);

// WebSocket
api.connect();
api.subscribe();
api.on("challenge:request", ({ payload }) => {
  console.log("New challenge from", payload.challenge.from);
});
```

## Features vs direct HTTP requests and WS connections

- Does client-side validation before the input gets sent the server
- Auto-reconnects with exponential backoff, auto re-subscribes all users

## Documentation

Full docs available at [https://chess-now.example.com/docs](https://chess-now.example.com/docs).

## License

MIT
