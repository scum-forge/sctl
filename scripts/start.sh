#!/bin/bash
set -e

if [[ "$npm_execpath" == *bun ]]; then
  $npm_execpath start:bun "$@" || true
else
  $npm_execpath run start:node "$@" || true
fi
