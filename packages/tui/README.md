# @chess-now/tui

A Terminal User Interface (TUI) client for `Chess Now!`.

Built with Vue TermUI.

## AI Disclaimer:

AI was used to learn overall Vue structure and it's behavior, along with improving some things compared to how I did them before. It was also used to fix and improve the key/input handling, which had some bugs and unintuitive behavior.

Also for reversing the ascii when the user is playing the Black pieces, which seemed pretty weird to do.

## Setup

```bash
# If you are in the tui package directory
cd packages/tui
bun install # append if you want cross-compiling: --os="*" --cpu="*"
bun run dev

# If you are in the root directory
bun run setup:tui # append if you want cross-compiling: --os="*" --cpu="*"
bun run client:tui
```
