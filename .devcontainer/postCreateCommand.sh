#!/bin/bash
set -e

nvm install --default node
nvm reinstall-packages system
npm update --global --force
corepack install --global pnpm
