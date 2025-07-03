#!/bin/bash

# Build script for WebAssembly module
# This script compiles the Rust code to WebAssembly

set -e

echo "🦀 Building Qarbon Emissions WebAssembly module..."

# Check if wasm-pack is installed
if ! command -v wasm-pack &> /dev/null; then
    echo "❌ wasm-pack is not installed. Installing..."
    cargo install wasm-pack
fi

# Check if Rust is installed
if ! command -v rustc &> /dev/null; then
    echo "❌ Rust is not installed. Please install Rust first:"
    echo "   curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh"
    exit 1
fi

# Navigate to WASM directory
WASM_DIR="src/optimizations/wasm"
if [ ! -d "$WASM_DIR" ]; then
    echo "❌ WASM directory not found: $WASM_DIR"
    exit 1
fi

cd "$WASM_DIR"

echo "📁 Working directory: $(pwd)"

# Clean previous builds
if [ -d "pkg" ]; then
    echo "🧹 Cleaning previous build..."
    rm -rf pkg
fi

# Build the WebAssembly module
echo "🔨 Building WebAssembly module..."
wasm-pack build \
    --target web \
    --out-dir pkg \
    --release \
    --scope qarbon

# Check if build was successful
if [ $? -eq 0 ]; then
    echo "✅ WebAssembly module built successfully!"
    echo "📦 Output directory: $WASM_DIR/pkg"
    
    # List generated files
    echo "📄 Generated files:"
    ls -la pkg/
    
    # Show size information
    echo "📊 Size information:"
    du -h pkg/*.wasm
else
    echo "❌ Build failed!"
    exit 1
fi

# Optional: Copy to main package
TARGET_DIR="../../../dist/wasm"
if [ "$1" = "--copy" ]; then
    echo "📋 Copying to target directory: $TARGET_DIR"
    mkdir -p "$TARGET_DIR"
    cp -r pkg/* "$TARGET_DIR/"
    echo "✅ Files copied to $TARGET_DIR"
fi

echo "🎉 Build complete!"
echo ""
echo "Usage in TypeScript:"
echo "  import init, { calculate_emissions_batch } from './pkg/qarbon_emissions_wasm.js';"
echo "  await init();"
echo "  // Use WASM functions..."
