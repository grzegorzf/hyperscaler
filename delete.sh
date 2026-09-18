#!/usr/bin/env bash
set -eo pipefail

CYAN='\033[0;36m'
GREEN='\033[0;32m'
AMBER='\033[0;33m'
RED='\033[0;31m'
NC='\033[0m'
BOLD='\033[1m'

echo -e "${RED}${BOLD}"
echo "============================================================"
echo "        🧹 HYPERSCALER: DOCKER CLEANUP & PURGE              "
echo "============================================================"
echo -e "${NC}"

# Detect Docker Compose command
COMPOSE_CMD=""
if command -v docker &> /dev/null; then
  if docker compose version &> /dev/null; then
    COMPOSE_CMD="docker compose"
  elif command -v docker-compose &> /dev/null; then
    COMPOSE_CMD="docker-compose"
  fi
fi

if ! command -v docker &> /dev/null; then
  echo -e "${RED}Docker is not installed or not in PATH.${NC}"
  exit 1
fi

echo -e "${CYAN}1. Stopping containers and removing volumes...${NC}"
if [ -n "$COMPOSE_CMD" ]; then
  $COMPOSE_CMD down -v --remove-orphans || true
fi

# Stop and remove explicit container if still present
if docker ps -a --format '{{.Names}}' | grep -Eq "^hyperscaler-app$|^hyperscaler$"; then
  echo -e "${CYAN}Stopping and removing existing container...${NC}"
  docker rm -f hyperscaler-app hyperscaler 2>/dev/null || true
fi

echo -e "${CYAN}2. Removing associated Docker images...${NC}"
# Remove compose built images and any images tagged with hyperscaler / hyperescaler
IMAGES=$(docker images --format "{{.Repository}}:{{.Tag}} {{.ID}}" | grep -Ei "hyperscaler|hyperescaler" | awk '{print $2}' | sort -u || true)

if [ -n "$IMAGES" ]; then
  echo -e "${AMBER}Found associated images:${NC}"
  docker images | grep -Ei "hyperscaler|hyperescaler" || true
  echo "$IMAGES" | xargs docker rmi -f 2>/dev/null || true
  echo -e "${GREEN}[OK] Associated images removed.${NC}"
else
  echo -e "${GREEN}[OK] No matching images found.${NC}"
fi

echo -e "${CYAN}3. Cleaning Docker build cache...${NC}"
# Prune dangling builder cache
docker builder prune -f --filter "until=1h" 2>/dev/null || docker builder prune -f 2>/dev/null || true

# Prune dangling dangling images
docker image prune -f 2>/dev/null || true

echo ""
echo -e "${GREEN}${BOLD}============================================================${NC}"
echo -e "${GREEN}${BOLD}       ✨ HYPERSCALER DOCKER ASSETS PURGED SUCCESSFULLY     ${NC}"
echo -e "${GREEN}${BOLD}============================================================${NC}"
echo ""
