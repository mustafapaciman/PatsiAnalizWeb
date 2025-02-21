#!/bin/bash

# DO NOT DELETE START - Git Backup Script
# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Get current timestamp
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")

# Function to show changes
show_changes() {
    echo -e "${YELLOW}Changes to be committed:${NC}"
    git diff --cached --stat
    echo -e "${YELLOW}Detailed changes:${NC}"
    git diff --cached
}

# Function to confirm changes
confirm_changes() {
    echo -e "${YELLOW}Do you want to proceed with these changes? (y/n)${NC}"
    read -r response
    if [[ "$response" =~ ^([nN][oO]|[nN])$ ]]; then
        echo -e "${RED}Changes aborted. Reverting...${NC}"
        git reset --hard HEAD
        exit 1
    fi
}

# Show current status
echo -e "${GREEN}Current Git Status:${NC}"
git status

# Stage changes
git add .

# Show what's being committed
show_changes

# Ask for confirmation
confirm_changes

# Create commit with timestamp and optional message
if [ -z "$1" ]
then
    git commit -m "Checkpoint: Backup at $TIMESTAMP"
else
    git commit -m "Checkpoint: $1 - $TIMESTAMP"
fi

# Show final status
echo -e "${GREEN}Final Git Status:${NC}"
git status

# Show commit summary
echo -e "${GREEN}Latest Commit:${NC}"
git log -1 --stat

# Provide revert instructions
echo -e "${YELLOW}To revert these changes, use:${NC}"
echo "git checkout HEAD~1 ."
echo -e "${YELLOW}Or to revert specific files:${NC}"
echo "git checkout HEAD~1 -- path/to/file"
# DO NOT DELETE END - Git Backup Script 