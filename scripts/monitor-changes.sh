#!/bin/bash

# DO NOT DELETE START - Cursor AI Change Monitor
# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to check if changes are within expected patterns
check_changes() {
    local changes=$(git diff --name-only)
    local unexpected=false
    
    echo -e "${BLUE}Checking changed files:${NC}"
    for file in $changes; do
        # Skip checking certain files
        if [[ $file == *.log ]] || [[ $file == *.tmp ]] || [[ $file == node_modules/* ]]; then
            continue
        fi
        
        # Check for potentially dangerous changes
        if git diff $file | grep -E "^\\+" | grep -E "rm -rf|sudo|chmod 777|eval|exec"; then
            echo -e "${RED}WARNING: Potentially dangerous changes detected in $file${NC}"
            unexpected=true
        fi
        
        # Check for large file changes (more than 100 lines)
        local lines_changed=$(git diff $file | grep -E "^[+-]" | wc -l)
        if [ $lines_changed -gt 100 ]; then
            echo -e "${YELLOW}WARNING: Large number of changes ($lines_changed lines) in $file${NC}"
            unexpected=true
        fi
    done
    
    return $unexpected
}

# Show current status
echo -e "${BLUE}Checking Cursor AI changes...${NC}"
git status

# Show detailed diff
echo -e "${BLUE}Detailed changes:${NC}"
git diff

# Check for unexpected changes
if check_changes; then
    echo -e "${GREEN}No unexpected changes detected.${NC}"
else
    echo -e "${RED}Unexpected changes detected. Please review carefully.${NC}"
    echo -e "${YELLOW}Options:${NC}"
    echo "1. Accept changes:   git add . && git commit -m \"Cursor AI changes\""
    echo "2. Revert changes:   git checkout -- ."
    echo "3. Partial revert:   git checkout -- path/to/file"
    
    echo -e "${YELLOW}Do you want to proceed with these changes? (y/n)${NC}"
    read -r response
    if [[ "$response" =~ ^([nN][oO]|[nN])$ ]]; then
        echo -e "${RED}Reverting changes...${NC}"
        git checkout -- .
        echo -e "${GREEN}Changes reverted successfully.${NC}"
        exit 1
    fi
fi

# Create backup point
./scripts/backup.sh "Cursor AI changes"
# DO NOT DELETE END - Cursor AI Change Monitor 