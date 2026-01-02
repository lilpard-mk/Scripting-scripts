#!/bin/bash

# Script to manage Scripting App component configuration
# Usage: ./manage-config.sh [OPTIONS] [COMMAND]

set -e

# Default values
CONFIG_FILE="script.json"
VERBOSE=false

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Help function
show_help() {
    cat << EOF
Manage Scripting App component configuration files.

Usage: $0 [OPTIONS] COMMAND [ARGS]

Options:
  -f, --file FILE    Configuration file (default: script.json)
  -v, --verbose      Show detailed output
  -h, --help         Show this help message

Commands:
  show               Show current configuration
  get KEY            Get value of a specific key
  set KEY VALUE      Set value for a key
  add KEY VALUE      Add value to an array
  remove KEY         Remove a key
  validate           Validate configuration against schema
  update-version     Update version (major, minor, patch)
  init               Initialize new configuration
  migrate            Migrate from older format

Examples:
  $0 show
  $0 get version
  $0 set author.name "John Doe"
  $0 add keywords "new-keyword"
  $0 update-version minor
  $0 --file custom.json validate
EOF
}

# Check if jq is available
check_jq() {
    if ! command -v jq &> /dev/null; then
        echo -e "${RED}Error: jq is required but not installed${NC}"
        echo -e "${YELLOW}Install with: brew install jq  or  apt-get install jq${NC}"
        exit 1
    fi
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -f|--file)
            CONFIG_FILE="$2"
            shift 2
            ;;
        -v|--verbose)
            VERBOSE=true
            shift
            ;;
        -h|--help)
            show_help
            exit 0
            ;;
        -*)
            echo -e "${RED}Error: Unknown option $1${NC}"
            show_help
            exit 1
            ;;
        *)
            COMMAND="$1"
            shift
            break
            ;;
    esac
done

# Check if config file exists for commands that need it
needs_config_file() {
    local cmd="$1"
    case "$cmd" in
        init|help|--help|-h)
            return 1  # Doesn't need config file
            ;;
        *)
            return 0  # Needs config file
            ;;
    esac
}

if needs_config_file "$COMMAND" && [[ ! -f "$CONFIG_FILE" ]]; then
    echo -e "${RED}Error: Configuration file not found: $CONFIG_FILE${NC}"
    echo -e "${YELLOW}Use 'init' command to create a new configuration${NC}"
    exit 1
fi

# Check jq for commands that need it
case "$COMMAND" in
    show|get|set|add|remove|validate|update-version)
        check_jq
        ;;
esac

# Verbose output
if [ "$VERBOSE" = true ]; then
    echo -e "${BLUE}=== Scripting Config Manager ===${NC}"
    echo -e "${YELLOW}Config file:${NC} $CONFIG_FILE"
    echo -e "${YELLOW}Command:${NC} $COMMAND"
fi

# Command implementations
case "$COMMAND" in
    show)
        echo -e "${GREEN}Current configuration:${NC}"
        jq . "$CONFIG_FILE"
        ;;

    get)
        if [[ -z "$1" ]]; then
            echo -e "${RED}Error: KEY is required for get command${NC}"
            exit 1
        fi
        KEY="$1"
        VALUE=$(jq -r ".$KEY" "$CONFIG_FILE")
        echo -e "${YELLOW}$KEY:${NC} $VALUE"
        ;;

    set)
        if [[ -z "$1" ]] || [[ -z "$2" ]]; then
            echo -e "${RED}Error: KEY and VALUE are required for set command${NC}"
            exit 1
        fi
        KEY="$1"
        VALUE="$2"

        # Handle different value types
        if [[ "$VALUE" == "true" ]] || [[ "$VALUE" == "false" ]] || [[ "$VALUE" == "null" ]]; then
            # Boolean or null
            jq ".$KEY = $VALUE" "$CONFIG_FILE" > "${CONFIG_FILE}.tmp"
        elif [[ "$VALUE" =~ ^[0-9]+$ ]]; then
            # Number
            jq ".$KEY = $VALUE" "$CONFIG_FILE" > "${CONFIG_FILE}.tmp"
        elif [[ "$VALUE" =~ ^\[.*\]$ ]] || [[ "$VALUE" =~ ^\{.*\}$ ]]; then
            # JSON array or object
            jq ".$KEY = $VALUE" "$CONFIG_FILE" > "${CONFIG_FILE}.tmp"
        else
            # String
            jq ".$KEY = \"$VALUE\"" "$CONFIG_FILE" > "${CONFIG_FILE}.tmp"
        fi

        mv "${CONFIG_FILE}.tmp" "$CONFIG_FILE"
        echo -e "${GREEN}Updated $KEY = $VALUE${NC}"
        ;;

    add)
        if [[ -z "$1" ]] || [[ -z "$2" ]]; then
            echo -e "${RED}Error: KEY and VALUE are required for add command${NC}"
            exit 1
        fi
        KEY="$1"
        VALUE="$2"

        # Check if key exists and is an array
        if jq -e ".$KEY | type == \"array\"" "$CONFIG_FILE" >/dev/null; then
            jq ".$KEY += [\"$VALUE\"]" "$CONFIG_FILE" > "${CONFIG_FILE}.tmp"
            mv "${CONFIG_FILE}.tmp" "$CONFIG_FILE"
            echo -e "${GREEN}Added \"$VALUE\" to $KEY array${NC}"
        else
            # Create new array if key doesn't exist
            jq ".$KEY = [\"$VALUE\"]" "$CONFIG_FILE" > "${CONFIG_FILE}.tmp"
            mv "${CONFIG_FILE}.tmp" "$CONFIG_FILE"
            echo -e "${GREEN}Created $KEY array with \"$VALUE\"${NC}"
        fi
        ;;

    remove)
        if [[ -z "$1" ]]; then
            echo -e "${RED}Error: KEY is required for remove command${NC}"
            exit 1
        fi
        KEY="$1"

        if jq -e ".$KEY" "$CONFIG_FILE" >/dev/null; then
            jq "del(.$KEY)" "$CONFIG_FILE" > "${CONFIG_FILE}.tmp"
            mv "${CONFIG_FILE}.tmp" "$CONFIG_FILE"
            echo -e "${GREEN}Removed key: $KEY${NC}"
        else
            echo -e "${YELLOW}Key not found: $KEY${NC}"
        fi
        ;;

    validate)
        echo -e "${GREEN}Validating configuration...${NC}"

        # Check for required fields
        REQUIRED_FIELDS=("name" "version" "description")
        MISSING_FIELDS=()

        for field in "${REQUIRED_FIELDS[@]}"; do
            if ! jq -e ".$field" "$CONFIG_FILE" >/dev/null; then
                MISSING_FIELDS+=("$field")
            fi
        done

        if [[ ${#MISSING_FIELDS[@]} -gt 0 ]]; then
            echo -e "${RED}Missing required fields: ${MISSING_FIELDS[*]}${NC}"
        else
            echo -e "${GREEN}✓ All required fields present${NC}"
        fi

        # Validate JSON syntax
        if jq . "$CONFIG_FILE" >/dev/null; then
            echo -e "${GREEN}✓ Valid JSON syntax${NC}"
        else
            echo -e "${RED}✗ Invalid JSON syntax${NC}"
            exit 1
        fi

        # Check version format (semantic versioning)
        VERSION=$(jq -r '.version' "$CONFIG_FILE")
        if [[ "$VERSION" =~ ^[0-9]+\.[0-9]+\.[0-9]+ ]]; then
            echo -e "${GREEN}✓ Valid version format: $VERSION${NC}"
        else
            echo -e "${YELLOW}⚠ Version format may not follow semantic versioning: $VERSION${NC}"
        fi

        echo -e "${GREEN}Validation complete!${NC}"
        ;;

    update-version)
        if [[ -z "$1" ]]; then
            echo -e "${RED}Error: VERSION_TYPE is required (major, minor, patch)${NC}"
            exit 1
        fi
        VERSION_TYPE="$1"

        CURRENT_VERSION=$(jq -r '.version' "$CONFIG_FILE")
        IFS='.' read -ra VERSION_PARTS <<< "$CURRENT_VERSION"

        MAJOR="${VERSION_PARTS[0]}"
        MINOR="${VERSION_PARTS[1]}"
        PATCH="${VERSION_PARTS[2]}"

        case "$VERSION_TYPE" in
            major)
                NEW_MAJOR=$((MAJOR + 1))
                NEW_VERSION="$NEW_MAJOR.0.0"
                ;;
            minor)
                NEW_MINOR=$((MINOR + 1))
                NEW_VERSION="$MAJOR.$NEW_MINOR.0"
                ;;
            patch)
                NEW_PATCH=$((PATCH + 1))
                NEW_VERSION="$MAJOR.$MINOR.$NEW_PATCH"
                ;;
            *)
                echo -e "${RED}Error: Invalid version type. Use major, minor, or patch${NC}"
                exit 1
                ;;
        esac

        jq ".version = \"$NEW_VERSION\"" "$CONFIG_FILE" > "${CONFIG_FILE}.tmp"
        mv "${CONFIG_FILE}.tmp" "$CONFIG_FILE"

        echo -e "${GREEN}Version updated: $CURRENT_VERSION → $NEW_VERSION${NC}"

        # Update changelog if exists
        if [[ -f "CHANGELOG.md" ]]; then
            echo -e "${YELLOW}Updating CHANGELOG.md...${NC}"
            # Add version header to changelog
            sed -i '' "1i\\
## [$NEW_VERSION] - $(date +%Y-%m-%d)\\
" CHANGELOG.md
            echo -e "${GREEN}✓ CHANGELOG.md updated${NC}"
        fi
        ;;

    init)
        if [[ -f "$CONFIG_FILE" ]]; then
            echo -e "${YELLOW}Configuration file already exists: $CONFIG_FILE${NC}"
            read -p "Overwrite? (y/N): " -n 1 -r
            echo
            if [[ ! $REPLY =~ ^[Yy]$ ]]; then
                echo "Aborted."
                exit 0
            fi
        fi

        # Interactive configuration
        echo -e "${BLUE}=== Initialize New Configuration ===${NC}"

        read -p "Component name (kebab-case): " COMPONENT_NAME
        read -p "Description: " DESCRIPTION
        read -p "Author name: " AUTHOR_NAME
        read -p "Author email (optional): " AUTHOR_EMAIL
        read -p "Author URL (optional): " AUTHOR_URL
        read -p "License (default: MIT): " LICENSE
        LICENSE=${LICENSE:-MIT}

        # Default configuration
        cat > "$CONFIG_FILE" << EOF
{
  "name": "$COMPONENT_NAME",
  "version": "1.0.0",
  "description": "$DESCRIPTION",
  "author": {
    "name": "$AUTHOR_NAME",
    "email": "$AUTHOR_EMAIL",
    "url": "$AUTHOR_URL"
  },
  "homepage": "",
  "repository": {
    "type": "git",
    "url": ""
  },
  "keywords": ["scripting"],
  "license": "$LICENSE",
  "scripts": {
    "main": "index.tsx"
  },
  "dependencies": {},
  "peerDependencies": {
    "scripting": "^2.4.0"
  },
  "engines": {
    "scripting": ">=2.4.0"
  },
  "os": ["ios"]
}
EOF

        echo -e "${GREEN}✓ Configuration initialized: $CONFIG_FILE${NC}"
        ;;

    migrate)
        echo -e "${YELLOW}Migration not implemented yet${NC}"
        echo -e "This command will help migrate from older configuration formats."
        ;;

    *)
        if [[ -z "$COMMAND" ]]; then
            echo -e "${RED}Error: COMMAND is required${NC}"
        else
            echo -e "${RED}Error: Unknown command: $COMMAND${NC}"
        fi
        show_help
        exit 1
        ;;
esac

exit 0