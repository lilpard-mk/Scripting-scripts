#!/bin/bash

# Script to create new Scripting App component templates
# Usage: ./create-component.sh [OPTIONS] COMPONENT_NAME

set -e

# Default values
COMPONENT_NAME=""
COMPONENT_TYPE="widget"  # widget, utility, app, api
AUTHOR=$(git config user.name || echo "Your Name")
VERSION="1.0.0"
DESCRIPTION="A Scripting App component"
OUTPUT_DIR="."
VERBOSE=false
INTERACTIVE=false

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Template directories
TEMPLATE_DIR="templates"
WIDGET_TEMPLATE="$TEMPLATE_DIR/widget"
UTILITY_TEMPLATE="$TEMPLATE_DIR/utility"
APP_TEMPLATE="$TEMPLATE_DIR/app"
API_TEMPLATE="$TEMPLATE_DIR/api"

# Help function
show_help() {
    cat << EOF
Create new Scripting App component templates.

Usage: $0 [OPTIONS] COMPONENT_NAME

Options:
  -t, --type TYPE        Component type: widget, utility, app, api (default: widget)
  -a, --author AUTHOR    Author name (default: git config user.name or "Your Name")
  -v, --version VERSION  Version number (default: 1.0.0)
  -d, --desc DESCRIPTION Component description
  -o, --output DIR       Output directory (default: current directory)
  -i, --interactive      Interactive mode
  --verbose              Show detailed output
  -h, --help             Show this help message

Examples:
  $0 MyWidget --type widget --desc "A cool widget"
  $0 -t utility -a "John Doe" -v "0.1.0" MyUtility
  $0 --interactive MyComponent

Component types:
  widget   - Desktop widget with settings (includes widget.tsx)
  utility  - Single-purpose utility script
  app      - Full app with multiple views
  api      - API client with configuration
EOF
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -t|--type)
            COMPONENT_TYPE="$2"
            shift 2
            ;;
        -a|--author)
            AUTHOR="$2"
            shift 2
            ;;
        -v|--version)
            VERSION="$2"
            shift 2
            ;;
        -d|--desc|--description)
            DESCRIPTION="$2"
            shift 2
            ;;
        -o|--output)
            OUTPUT_DIR="$2"
            shift 2
            ;;
        -i|--interactive)
            INTERACTIVE=true
            shift
            ;;
        --verbose)
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
            COMPONENT_NAME="$1"
            shift
            ;;
    esac
done

# Interactive mode
if [ "$INTERACTIVE" = true ]; then
    echo -e "${BLUE}=== Scripting App Component Creator (Interactive) ===${NC}"

    # Get component name
    while [[ -z "$COMPONENT_NAME" ]]; do
        read -p "Component name (PascalCase): " COMPONENT_NAME
        if [[ -z "$COMPONENT_NAME" ]]; then
            echo -e "${RED}Component name is required${NC}"
        fi
    done

    # Get component type
    PS3="Select component type: "
    select type in "widget" "utility" "app" "api"; do
        COMPONENT_TYPE=$type
        break
    done

    # Get description
    read -p "Description [$DESCRIPTION]: " input_desc
    if [[ -n "$input_desc" ]]; then
        DESCRIPTION="$input_desc"
    fi

    # Get author
    read -p "Author [$AUTHOR]: " input_author
    if [[ -n "$input_author" ]]; then
        AUTHOR="$input_author"
    fi

    # Get version
    read -p "Version [$VERSION]: " input_version
    if [[ -n "$input_version" ]]; then
        VERSION="$input_version"
    fi

    # Get output directory
    read -p "Output directory [$OUTPUT_DIR]: " input_output
    if [[ -n "$input_output" ]]; then
        OUTPUT_DIR="$input_output"
    fi

    echo -e "${GREEN}Configuration complete!${NC}"
fi

# Validate required arguments
if [[ -z "$COMPONENT_NAME" ]]; then
    echo -e "${RED}Error: COMPONENT_NAME is required${NC}"
    show_help
    exit 1
fi

# Validate component type
case "$COMPONENT_TYPE" in
    widget|utility|app|api)
        # Valid type
        ;;
    *)
        echo -e "${RED}Error: Invalid component type '$COMPONENT_TYPE'${NC}"
        echo -e "${YELLOW}Valid types: widget, utility, app, api${NC}"
        exit 1
        ;;
esac

# Create output directory if it doesn't exist
mkdir -p "$OUTPUT_DIR"

# Component directory name (kebab-case)
COMPONENT_DIR_NAME=$(echo "$COMPONENT_NAME" | sed -E 's/([a-z])([A-Z])/\1-\2/g' | tr '[:upper:]' '[:lower:]')
COMPONENT_DIR="$OUTPUT_DIR/$COMPONENT_DIR_NAME"

# Check if directory already exists
if [[ -d "$COMPONENT_DIR" ]]; then
    echo -e "${RED}Error: Directory already exists: $COMPONENT_DIR${NC}"
    exit 1
fi

# Create component directory
mkdir -p "$COMPONENT_DIR"

# Verbose output
if [ "$VERBOSE" = true ]; then
    echo -e "${BLUE}=== Creating Scripting App Component ===${NC}"
    echo -e "${YELLOW}Component Name:${NC} $COMPONENT_NAME"
    echo -e "${YELLOW}Directory:${NC} $COMPONENT_DIR_NAME"
    echo -e "${YELLOW}Type:${NC} $COMPONENT_TYPE"
    echo -e "${YELLOW}Author:${NC} $AUTHOR"
    echo -e "${YELLOW}Version:${NC} $VERSION"
    echo -e "${YELLOW}Description:${NC} $DESCRIPTION"
fi

# Create template directories if they don't exist
mkdir -p "$TEMPLATE_DIR"
mkdir -p "$WIDGET_TEMPLATE" "$UTILITY_TEMPLATE" "$APP_TEMPLATE" "$API_TEMPLATE"

# Generate variable replacements
COMPONENT_NAME_PASCAL="$COMPONENT_NAME"
COMPONENT_NAME_KEBAB="$COMPONENT_DIR_NAME"
COMPONENT_NAME_SNAKE=$(echo "$COMPONENT_DIR_NAME" | tr '-' '_')
CURRENT_DATE=$(date +%Y-%m-%d)
CURRENT_YEAR=$(date +%Y)

# Function to process templates
process_template() {
    local template_file="$1"
    local output_file="$2"

    if [[ ! -f "$template_file" ]]; then
        # Create default template content
        case "$output_file" in
            */script.json)
                cat > "$output_file" << EOF
{
  "name": "$COMPONENT_NAME_KEBAB",
  "version": "$VERSION",
  "description": "$DESCRIPTION",
  "author": {
    "name": "$AUTHOR",
    "email": "",
    "url": ""
  },
  "homepage": "",
  "repository": {
    "type": "git",
    "url": ""
  },
  "keywords": ["scripting", "$COMPONENT_TYPE"],
  "license": "MIT",
  "scripts": {
    "main": "index.tsx"$([[ "$COMPONENT_TYPE" == "widget" ]] && echo ',\n    "widget": "widget.tsx"')
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
                ;;
            */index.tsx)
                cat > "$output_file" << EOF
import { useState } from "react"
import { Button, Navigation, Text, VStack } from "scripting"

export default function $COMPONENT_NAME_PASCAL() {
  const [count, setCount] = useState(0)

  return (
    <Navigation.Stack>
      <VStack spacing={16} padding={16}>
        <Text font="title">$COMPONENT_NAME_PASCAL</Text>
        <Text>$DESCRIPTION</Text>

        <VStack spacing={8}>
          <Text>Count: {count}</Text>
          <Button
            title="Increment"
            onTap={() => setCount(count + 1)}
          />
          <Button
            title="Reset"
            onTap={() => setCount(0)}
          />
        </VStack>
      </VStack>
    </Navigation.Stack>
  )
}
EOF
                ;;
            */widget.tsx)
                if [[ "$COMPONENT_TYPE" == "widget" ]]; then
                    cat > "$output_file" << EOF
import { Text, VStack, Widget } from "scripting"

export default function ${COMPONENT_NAME_PASCAL}Widget() {
  return (
    <Widget>
      <VStack spacing={4} padding={8}>
        <Text font="title2">$COMPONENT_NAME_PASCAL</Text>
        <Text>$DESCRIPTION</Text>
        <Text>Last updated: {new Date().toLocaleTimeString()}</Text>
      </VStack>
    </Widget>
  )
}
EOF
                fi
                ;;
            */constants.ts)
                cat > "$output_file" << EOF
// Constants for $COMPONENT_NAME_PASCAL
export const APP_NAME = "$COMPONENT_NAME_PASCAL"
export const VERSION = "$VERSION"
export const AUTHOR = "$AUTHOR"

// Storage keys
export const STORAGE_KEYS = {
  SETTINGS: "${COMPONENT_NAME_SNAKE}_settings",
  DATA: "${COMPONENT_NAME_SNAKE}_data"
}

// Default configuration
export const DEFAULT_CONFIG = {
  refreshInterval: 300, // 5 minutes
  enabled: true,
  theme: "auto" as const
}

// API endpoints (if applicable)
export const API_ENDPOINTS = {
  BASE: "https://api.example.com",
  // Add your API endpoints here
}
EOF
                ;;
            */app_intents.tsx)
                cat > "$output_file" << EOF
import { Intent, Script } from "scripting"

// AppIntents for $COMPONENT_NAME_PASCAL
export const Refresh${COMPONENT_NAME_PASCAL}Intent = Intent.create({
  name: "Refresh$COMPONENT_NAME_PASCAL",
  description: "Refresh $COMPONENT_NAME_PASCAL data",
  parameters: {},
  async run() {
    // Implement refresh logic here
    Script.exit(\`$COMPONENT_NAME_PASCAL refreshed\`)
  }
})

export const Open${COMPONENT_NAME_PASCAL}SettingsIntent = Intent.create({
  name: "Open${COMPONENT_NAME_PASCAL}Settings",
  description: "Open $COMPONENT_NAME_PASCAL settings",
  parameters: {},
  async run() {
    // Open settings
    Script.exit("Opening settings...")
  }
})

// Export all intents
export const APP_INTENTS = {
  Refresh${COMPONENT_NAME_PASCAL}Intent,
  Open${COMPONENT_NAME_PASCAL}SettingsIntent
}
EOF
                ;;
            */README.md)
                cat > "$output_file" << EOF
# $COMPONENT_NAME_PASCAL

$DESCRIPTION

## Features

- Feature 1
- Feature 2
- Feature 3

## Installation

### One-click Installation

[🔗 Install $COMPONENT_NAME_PASCAL]()

### Manual Installation

1. Download the \`.scripting\` file
2. Open Scripting App
3. Tap "Import Script"
4. Select the downloaded file

## Usage

// Add usage instructions here

## Configuration

// Add configuration instructions here

## Development

### Project Structure

\`\`\`
$COMPONENT_DIR_NAME/
├── script.json              # Component configuration
├── index.tsx                # Main component
├── widget.tsx               # Widget component
├── constants.ts             # Constants and configuration
├── app_intents.tsx          # AppIntent definitions
└── README.md                # This file
\`\`\`

### Building

// Add build instructions here

## License

MIT License - see LICENSE for details.
EOF
                ;;
            *)
                # Create empty file
                touch "$output_file"
                ;;
        esac
    else
        # Process template with variable substitution
        sed \
            -e "s/{{componentName}}/$COMPONENT_NAME_PASCAL/g" \
            -e "s/{{component_name}}/$COMPONENT_NAME_SNAKE/g" \
            -e "s/{{component-name}}/$COMPONENT_NAME_KEBAB/g" \
            -e "s/{{author}}/$AUTHOR/g" \
            -e "s/{{version}}/$VERSION/g" \
            -e "s/{{description}}/$DESCRIPTION/g" \
            -e "s/{{currentDate}}/$CURRENT_DATE/g" \
            -e "s/{{currentYear}}/$CURRENT_YEAR/g" \
            "$template_file" > "$output_file"
    fi
}

# Create component files
echo -e "${GREEN}Creating component files...${NC}"

# Required files for all component types
process_template "" "$COMPONENT_DIR/script.json"
process_template "" "$COMPONENT_DIR/index.tsx"
process_template "" "$COMPONENT_DIR/constants.ts"
process_template "" "$COMPONENT_DIR/app_intents.tsx"
process_template "" "$COMPONENT_DIR/README.md"

# Type-specific files
case "$COMPONENT_TYPE" in
    widget)
        process_template "" "$COMPONENT_DIR/widget.tsx"
        ;;
    utility)
        # Utility scripts might not need widget.tsx
        rm -f "$COMPONENT_DIR/widget.tsx" 2>/dev/null || true
        ;;
    app)
        # Apps might have more complex structure
        mkdir -p "$COMPONENT_DIR/views"
        mkdir -p "$COMPONENT_DIR/components"
        mkdir -p "$COMPONENT_DIR/utils"
        ;;
    api)
        # API clients might need API-specific files
        mkdir -p "$COMPONENT_DIR/api"
        mkdir -p "$COMPONENT_DIR/types"
        ;;
esac

# Create example assets directory
mkdir -p "$COMPONENT_DIR/assets"
mkdir -p "$COMPONENT_DIR/examples"

# Create .gitignore
cat > "$COMPONENT_DIR/.gitignore" << EOF
# Dependencies
node_modules/

# Build outputs
dist/
*.scripting

# Environment variables
.env
.env.local

# IDE files
.vscode/
.idea/

# OS files
.DS_Store
Thumbs.db

# Logs
*.log
EOF

# Create initial README section
echo -e "\n## Quick Start" >> "$COMPONENT_DIR/README.md"
cat >> "$COMPONENT_DIR/README.md" << EOF

1. Open \`index.tsx\` in Scripting App
2. Modify the component as needed
3. Test in Scripting App
4. Package with: \`npm run build\` or Scripting App's export feature

## Next Steps

1. Update \`script.json\` with your information
2. Implement your component logic in \`index.tsx\`
3. Add configuration options in \`constants.ts\`
4. Update this README with actual installation link and usage instructions
EOF

# Create package.json for development (optional)
cat > "$COMPONENT_DIR/package.json" << EOF
{
  "name": "$COMPONENT_NAME_KEBAB",
  "version": "$VERSION",
  "description": "$DESCRIPTION",
  "scripts": {
    "build": "echo 'Build script not configured. Use Scripting App export feature.'",
    "dev": "echo 'Development server not configured.'",
    "test": "echo 'No tests configured.'"
  },
  "devDependencies": {
    "typescript": "^5.0.0",
    "@types/react": "^18.0.0"
  },
  "keywords": ["scripting", "$COMPONENT_TYPE"],
  "author": "$AUTHOR",
  "license": "MIT"
}
EOF

# Success message
echo -e "${GREEN}✓ Component created successfully!${NC}"
echo -e "${YELLOW}Location:${NC} $COMPONENT_DIR"
echo -e "${YELLOW}Files created:${NC}"
find "$COMPONENT_DIR" -type f | sort | sed 's/^/  /'

echo -e "\n${BLUE}=== Next Steps ===${NC}"
echo -e "1. ${YELLOW}cd${NC} $COMPONENT_DIR"
echo -e "2. ${YELLOW}Edit${NC} script.json with your information"
echo -e "3. ${YELLOW}Implement${NC} your component logic"
echo -e "4. ${YELLOW}Test${NC} in Scripting App"
echo -e "5. ${YELLOW}Generate${NC} installation link with:"
echo -e "   ${GREEN}./scripts/generate-install-link.sh${NC} \\"
echo -e "     --repo \"your-username/your-repo\" \\"
echo -e "     --file \"$COMPONENT_DIR_NAME/$COMPONENT_NAME_PASCAL.scripting\""

# Create a simple build script
cat > "$COMPONENT_DIR/build.sh" << 'EOF'
#!/bin/bash
# Build script for Scripting App component
# This script helps prepare the component for distribution

set -e

COMPONENT_NAME=$(basename "$(pwd)")
SCRIPTING_FILE="$COMPONENT_NAME.scripting"

echo "Building $COMPONENT_NAME..."

# Check for required files
if [[ ! -f "script.json" ]]; then
    echo "Error: script.json not found"
    exit 1
fi

if [[ ! -f "index.tsx" ]]; then
    echo "Error: index.tsx not found"
    exit 1
fi

# Create .scripting file (placeholder - actual packaging depends on Scripting App)
echo "Note: Actual .scripting file creation depends on Scripting App export feature"
echo "To create .scripting file:"
echo "1. Open this folder in Scripting App"
echo "2. Run the script"
echo "3. Use 'Export Script' feature"
echo "4. Save as $SCRIPTING_FILE"

echo "Done! Component is ready for testing."
EOF

chmod +x "$COMPONENT_DIR/build.sh"

echo -e "\n${GREEN}✓ Build script created:${NC} $COMPONENT_DIR/build.sh"

exit 0