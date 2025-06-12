.PHONY: all build serve

# Default target: build the static dist folder
all: build

# Target to build the static dist folder
build:
	@echo "Building static dist folder..."
	esbuild src/main.ts \
		--bundle \
		--outdir=dist/dist \
		--entry-names=[name]
	cp -r src/public_html/* dist/
	@echo "Static build complete."

# Target to build and serve with watch enabled for development
dev:
	@echo "Starting esbuild with watch and serve..."
	esbuild src/main.ts tests/test_runner.ts \
		--bundle \
		--watch \
		--servedir=src/public_html \
		--outdir=dist \
		--public-path=/dist \
		--entry-names=[name]
