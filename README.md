# Manko Servers

[![Add to Manko](assets/add-to-manko.svg)](https://manko-ios.github.io/servers/)

User-installed personal-server connectors. Open the link on a device with Manko installed, then review and confirm in the app. Adding this repository installs nothing automatically.

Copy this repository URL into **Manko → Extensions → Add Repository**:

```text
https://manko-ios.github.io/servers/
```

| Extension | Install |
| --- | --- |
| Kavita | [Open in Manko](https://manko-ios.github.io/servers/?source=Kavita) |
| Komga | [Open in Manko](https://manko-ios.github.io/servers/?source=Komga) |
| OPDS | [Open in Manko](https://manko-ios.github.io/servers/?source=OPDS) |
| Suwayomi | [Open in Manko](https://manko-ios.github.io/servers/?source=Suwayomi) |

After installing a connector, add your server connection in Manko.

## Build and verify

Requires Node.js 22+ and the pinned Rust toolchain with `wasm32-unknown-unknown`.

```sh
npm ci
npm test
npm run check
npm run publish:dry-run
```

`npm test` runs Rust tests, compiles and bundles the WASM packages, and runs offline fixture and packaging tests. Output is in `target/` and `dist/`. No command uploads anything.

## Publishing

The Pages workflow is manual-only. When publication is authorized, push the reviewed commit, enable GitHub Pages with Actions, then run the workflow. It hosts the catalog and a searchable extension list with language and content-rating filters and individual app install links. The links above become available only after deployment.

See [Contributing](CONTRIBUTING.md), [Privacy](PRIVACY.md), [Security](SECURITY.md), and the [Extension Developer Kit](https://github.com/Manko-iOS/extension-kit).
