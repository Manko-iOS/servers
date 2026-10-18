# Contributing

This repository contains only the servers catalog. For the SDK, CLI and extension authoring guide, see [Manko Extension Kit](https://github.com/Manko-iOS/extension-kit).

Run `npm ci`, `npm test`, `npm run check`, and `npm run publish:dry-run`. Rust uses the pinned toolchain and this workspace's `target/`. Tests use offline fixtures; live verification requires your own server or tracker account.

Keep extension IDs stable. Increment the extension version when executable bytes change. Never replace already published bytes at the same version URL. Preserve third-party licenses and notices.

The local SDK and validators are intentionally vendored until a versioned kit release is available. Coordinate shared changes with the kit rather than evolving incompatible copies.
