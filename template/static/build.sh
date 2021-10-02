#!/usr/bin/env bash

set -e

echo ": Building SDK"

npx tsc -p tsconfig.json --outDir ./dist
echo "✔ Compiled SDK files"

cp "./src/swagger.json" "./dist/swagger.json";
echo "✔ Copied static assets"

npx ts-node dtsgen.ts
echo "✔ Generated type definitions"
