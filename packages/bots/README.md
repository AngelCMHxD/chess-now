# @chess-now/bots

A bot integration for `Chess Now!`. It manages multiple bot instances (with difficulties ranging 1-5) so users don't always need real users to play against

## Setup

```bash
#
# If you are in the bots package directory
# In this case, you need a .env with the BOT_TOKEN_{1-5} variables right in the root of the package directory
cd packages/bots
bun install
bun start

# If you are on the root of the whole chess-now project
# In this case, the variables are set in the .env file at the root of the project
bun setup:bots # This just installs the dependencies
bun client:bots
```

The chess engine is provided by `js-chess-engine`, I couldn't find any other engine that would be as easy to integrate as this one, so I just went with it
