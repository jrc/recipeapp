# Define ESBUILD_CMD to find esbuild in the project root (as in the GitHub Action), then fall back to system PATH
ESBUILD_CMD := $(shell if [ -x "./esbuild" ]; then echo "./esbuild"; else echo "esbuild"; fi)

.PHONY: all build dev clean

# Default target: build the static dist folder
all: build

# Target to remove the build output directory
clean:
	@echo "Cleaning dist folder..."
	rm -rf dist

# Target to build the static dist folder
build: clean
	@echo "Building static dist folder..."
	# Bundle JS/TS files into a subdirectory within dist
	$(ESBUILD_CMD) src/main.ts \
		--bundle \
		--outdir=dist/ \
		--entry-names=[name]
	# Copy static assets from public_html to the root of dist
	cp -r public_html/* dist/
	@echo "Static build complete."

# Target to build and serve with watch enabled for development
dev:
	@echo "Starting esbuild with watch and serve..."
	# Bundle JS/TS files and serve static assets from public_html
	$(ESBUILD_CMD) src/main.ts tests/test_runner.ts \
		--bundle \
		--watch \
		--servedir=public_html \
		--outdir=public_html/ \
		--entry-names=[name]
