This is a TS port of the npm package [chess-fen2img](https://www.npmjs.com/package/chess-fen2img), exports and api is the same as the original package

Changes made were:

- switching to TS, which didn't need many changes
- use @napi-rs/canvas instead of canvas, as it's more performant and doesn't need to be built
- and merge res/ and resources/ into a single directory, don't know why it wasn't that way from the start

- I also removed all styles and left only the [caliente](https://github.com/avi-0/caliente/) style. This is because some of the other styles were not free to use, so they had to be removed.
