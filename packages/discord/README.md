# @chess-now/discord

A Discord bot/client for the `Chess Now!` API.

To be fair, due to the nature of Discord, the experience can feel quite clunky. You need to share a server with the bot in order to receive notifications, as they are sent as direct messages.

If you want to try the overall project (chess-now), I would recommend trying other clients first, as they are way more user-friendly and don't feel nearly as clunky. Though that shouldn't turn you away from trying this one out.

## Setup

```bash
# If you are in the discord package directory
# In this case, you need a .env with the DISCORD_BOT_TOKEN and DISCORD_BOT_MONGO_URI variables right in the root of the package directory
cd packages/discord
bun install
bun start

# If you are on the root of the whole chess-now project
# In this case, the variables are set in the .env file at the root of the project
bun setup:discord # This just installs the dependencies
bun client:discord
```

This bot uses MongoDB to store user config and data, and the `@chess-now/api` package to communicate with the API.

Why MongoDB? Idk, it needs quite a simple DB, so I thought it was the easiest to set up quickly. The free tier they offer is quite generous and should be enough for this with how little data we need to store.

While it would be way better for the UX to just access the whole DB directly and determine the user depending on if they have an discord account linked to the service or not, I think this way is better to show how to implement the actual API on other projects, as it doesn't require direct access to the DB and only uses public-facing endpoints and the `@chess-now/api` package.
