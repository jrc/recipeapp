# Recipe App

## Features

- importing recipe URLs (JSON-LD only)
- editable Recipe Markdown
- data detectors:
  - ingredient highlighting (English only)
  - US to metric conversion, with aesthetically pleasing rounding
  - duration detction and timers
- strikethrough list items
- mobile/tablet-friendly design
- print-optimized recipe view

## Development

This is (almost) pure front-end app, written in TypeScript. The build system is a Makefile which calls `esbuild` to transpile and bundle the source files.

The only backend is a CORS proxy, running as a Cloudflare Worker.

1. [Install esbuild](https://esbuild.github.io/getting-started/#install-esbuild).
2. Run `make dev`.

`npm install --save-dev tsx ts-node` to make Claude be able to run tests.
