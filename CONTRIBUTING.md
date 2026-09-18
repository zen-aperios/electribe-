# Contributing

GHOST is early, but it should stay tidy from day one.

## Development

1. Keep the generation engine independent from React.
2. Add tests for engine, MIDI conversion, and persistence changes.
3. Keep hardware-specific assumptions behind `src/midi`.
4. Prefer small, reviewable changes over broad rewrites.

## Quality Bar

Run before opening a pull request:

```bash
npm test
npm run build
```
