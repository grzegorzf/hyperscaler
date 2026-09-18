#!/usr/bin/env bash
set -eo pipefail

CYAN='\033[0;36m'
GREEN='\033[0;32m'
AMBER='\033[0;33m'
RED='\033[0;31m'
NC='\033[0m'
BOLD='\033[1m'

echo -e "${CYAN}${BOLD}"
echo "============================================================"
echo "      ⚡ HYPERSCALER: INTERACTIVE VISUAL SIMULATOR ⚡       "
echo "        Next.js 16 (React 19) · Static & GitHub Pages       "
echo "============================================================"
echo -e "${NC}"

# Check if user wants local dev or docker
if [ "$1" == "--dev" ] || [ "$1" == "dev" ]; then
  echo -e "${GREEN}Starting in local development mode with pnpm...${NC}"
  pnpm dev
  exit 0
fi

# Docker Compose Mode
if command -v docker &> /dev/null; then
  if docker compose version &> /dev/null; then
    COMPOSE_CMD="docker compose"
  elif command -v docker-compose &> /dev/null; then
    COMPOSE_CMD="docker-compose"
  fi
fi

if [ -n "$COMPOSE_CMD" ]; then
  echo -e "${GREEN}[OK] Starting with Docker: ${COMPOSE_CMD} up --build -d${NC}"
  $COMPOSE_CMD up --build -d
  echo ""
  echo -e "${GREEN}${BOLD}============================================================${NC}"
  echo -e "${GREEN}${BOLD}           🚀 HYPERSCALER IS LIVE!                         ${NC}"
  echo -e "${GREEN}${BOLD}============================================================${NC}"
  echo -e "${CYAN}  🖥️  Simulation UI: ${BOLD}http://localhost:3000${NC}"
  echo -e "${GREEN}${BOLD}============================================================${NC}"
  echo -e "To view logs: ${BOLD}${COMPOSE_CMD} logs -f${NC}"
  echo -e "To stop:      ${BOLD}${COMPOSE_CMD} down${NC}"
  echo ""
else
  echo -e "${AMBER}Docker not found or inactive. Running via pnpm dev...${NC}"
  pnpm dev
fi
