#!/bin/bash

# Build and serve the main application and the tests with esbuild.

echo "Starting esbuild with watch and serve for application and tests..."

esbuild src/main.ts tests/parser.test.ts \
  --bundle \
  --watch \
  --servedir=. \
  --outdir=dist \
  --public-path=/dist \
  --entry-names=[name]


echo "esbuild stopped."
