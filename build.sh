#!/bin/bash

# This script builds and serves your web application using esbuild.
# It recompiles TypeScript to JavaScript on changes and serves static files.

echo "Starting esbuild with watch and serve..."

esbuild src/main.ts \
  --bundle \
  --watch \
  --servedir=. \
  --outdir=dist \
  --public-path=/dist \
  --entry-names=[name]

echo "esbuild stopped."
