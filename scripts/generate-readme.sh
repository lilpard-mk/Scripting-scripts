#!/bin/bash

# Script to generate README documentation for Scripting App components
# Usage: ./generate-readme.sh [OPTIONS] [COMPONENT_DIR]

set -e

# Default values
COMPONENT_DIR="."
OUTPUT_FILE="README.md"
TEMPLATE_FILE=""
REPO_URL=""
BRANCH="main"
VERBOSE=false
UPDATE_EXISTING=false
GENERATE_INSTALL_LINK=true

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Help function
show_help() {
    cat << EOF
Generate README documentation for Scripting App components.

Usage: $0 [OPTIONS] [COMPONENT_DIR]

Options:
  -d, --dir DIR          Component directory (default: current directory)
  -o, --output FILE      Output file (default: README.md)
  -t, --template FILE    Custom template file
  -r, --repo URL         GitHub repository URL
  -b, --branch BRANCH    Git branch (default: main)
  --no-install-link      Don't generate installation link
  -u, --update           Update existing README (preserves custom content)
  -v, --verbose          Show detailed output
  -h, --help             Show this help message

Examples:
  $0 ./MyComponent
  $0 --repo "https://github.com/user/repo" --branch develop
  $0 --template docs/template.md --output README_GEN.md
  $0 --update  # Update existing README with new metadata

The script:
1. Reads component metadata from script.json
2. Generates one-click installation link
3. Creates comprehensive README with sections:
   - Title and badges
   - Description and features
   - Installation (one-click and manual)
   - Usage instructions
   - Configuration guide
   - Development information
   - License
EOF
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -d|--dir|--directory)
            COMPONENT_DIR="$2"
            shift 2
            ;;
        -o|--output)
            OUTPUT_FILE="$2"
            shift 2
            ;;
        -t|--template)
            TEMPLATE_FILE="$2"
            shift 2
            ;;
        -r|--repo)
            REPO_URL="$2"
            shift 2
            ;;
        -b|--branch)
            BRANCH="$2"
            shift 2
            ;;
        --no-install-link)
            GENERATE_INSTALL_LINK=false
            shift
            ;;
        -u|--update)
            UPDATE_EXISTING=true
            shift
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
            COMPONENT_DIR="$1"
            shift
            ;;
    esac
done

# Validate component directory
if [[ ! -d "$COMPONENT_DIR" ]]; then
    echo -e "${RED}Error: Component directory not found: $COMPONENT_DIR${NC}"
    exit 1
fi

# Check for script.json
SCRIPT_JSON="$COMPONENT_DIR/script.json"
if [[ ! -f "$SCRIPT_JSON" ]]; then
    echo -e "${RED}Error: script.json not found in $COMPONENT_DIR${NC}"
    exit 1
fi

# Extract component metadata
extract_metadata() {
    local key="$1"
    local default="$2"
    local value=$(jq -r ".$key // \"$default\"" "$SCRIPT_JSON" 2>/dev/null || echo "$default")
    echo "$value"
}

# Check if jq is available
if ! command -v jq &> /dev/null; then
    echo -e "${RED}Error: jq is required but not installed${NC}"
    echo -e "${YELLOW}Install with: brew install jq  or  apt-get install jq${NC}"
    exit 1
fi

# Extract metadata
COMPONENT_NAME=$(extract_metadata "name" "$(basename "$COMPONENT_DIR")")
DESCRIPTION=$(extract_metadata "description" "A Scripting App component")
VERSION=$(extract_metadata "version" "1.0.0")
AUTHOR_NAME=$(extract_metadata ".author.name" "Unknown Author")
AUTHOR_EMAIL=$(extract_metadata ".author.email" "")
AUTHOR_URL=$(extract_metadata ".author.url" "")
LICENSE=$(extract_metadata "license" "MIT")
HOMEPAGE=$(extract_metadata "homepage" "")
REPO_TYPE=$(extract_metadata ".repository.type" "git")
REPO_URL_FROM_JSON=$(extract_metadata ".repository.url" "")

# Use repo URL from command line or from script.json
if [[ -z "$REPO_URL" ]]; then
    REPO_URL="$REPO_URL_FROM_JSON"
fi

# Extract repository name from URL for GitHub
if [[ "$REPO_URL" =~ github.com/([^/]+)/([^/]+) ]]; then
    REPO_OWNER="${BASH_REMATCH[1]}"
    REPO_NAME="${BASH_REMATCH[2]}"
    REPO_SHORT="$REPO_OWNER/$REPO_NAME"
else
    REPO_SHORT=""
fi

# Extract keywords
KEYWORDS=$(jq -r '.keywords | join(", ")' "$SCRIPT_JSON" 2>/dev/null || echo "scripting")
# Check if component has widget
HAS_WIDGET=$(jq -r '.scripts.widget // false' "$SCRIPT_JSON" 2>/dev/null | grep -q "widget.tsx" && echo "true" || echo "false")

# Component type detection
if [[ "$HAS_WIDGET" == "true" ]]; then
    COMPONENT_TYPE="widget"
else
    COMPONENT_TYPE="utility"
fi

# Verbose output
if [ "$VERBOSE" = true ]; then
    echo -e "${BLUE}=== README Generator ===${NC}"
    echo -e "${YELLOW}Component:${NC} $COMPONENT_NAME"
    echo -e "${YELLOW}Directory:${NC} $COMPONENT_DIR"
    echo -e "${YELLOW}Type:${NC} $COMPONENT_TYPE"
    echo -e "${YELLOW}Version:${NC} $VERSION"
    echo -e "${YELLOW}Author:${NC} $AUTHOR_NAME"
    echo -e "${YELLOW}Repository:${NC} $REPO_URL"
    echo -e "${YELLOW}Branch:${NC} $BRANCH"
fi

# Generate installation link if requested
INSTALL_LINK=""
if [ "$GENERATE_INSTALL_LINK" = true ] && [[ -n "$REPO_SHORT" ]]; then
    # Find .scripting file
    SCRIPTING_FILE=$(find "$COMPONENT_DIR" -name "*.scripting" | head -1)
    if [[ -n "$SCRIPTING_FILE" ]]; then
        # Get relative path from repository root
        FILE_PATH=$(realpath --relative-to="$COMPONENT_DIR/.." "$SCRIPTING_FILE")

        # Generate link
        if [[ -f "scripts/generate-install-link.sh" ]]; then
            INSTALL_LINK=$(./scripts/generate-install-link.sh \
                --repo "$REPO_SHORT" \
                --branch "$BRANCH" \
                --file "$FILE_PATH" \
                --encode-only false 2>/dev/null || echo "")
        else
            # Fallback manual generation
            RAW_URL="https://raw.githubusercontent.com/$REPO_SHORT/$BRANCH/$FILE_PATH"
            JSON_ARRAY="[\"$RAW_URL\"]"
            ENCODED_JSON=$(python3 -c "import urllib.parse; print(urllib.parse.quote('$JSON_ARRAY', safe=''))" 2>/dev/null || echo "")
            INSTALL_LINK="https://scripting.fun/import_scripts?urls=$ENCODED_JSON"
        fi

        if [ "$VERBOSE" = true ]; then
            echo -e "${YELLOW}Installation Link:${NC} $INSTALL_LINK"
        fi
    else
        echo -e "${YELLOW}Warning: No .scripting file found, installation link not generated${NC}"
    fi
fi

# Prepare template or use default
if [[ -n "$TEMPLATE_FILE" && -f "$TEMPLATE_FILE" ]]; then
    echo -e "${GREEN}Using custom template: $TEMPLATE_FILE${NC}"
    TEMPLATE_CONTENT=$(cat "$TEMPLATE_FILE")
else
    # Default template
    TEMPLATE_CONTENT=$(cat << 'EOF'
# {{COMPONENT_NAME}}

{{DESCRIPTION}}

![Scripting Compatible](https://img.shields.io/badge/Scripting-Compatible-green)
{{#if BADGES}}{{BADGES}}{{/if}}

## ✨ Features

{{FEATURES}}

## 🚀 Installation

### Method 1: One-click Install (Recommended)
Click the link below on your iOS device with Scripting App installed:

[![Install Button](https://img.shields.io/badge/SCRIPTING-Install-007AFF)]({{INSTALL_LINK}})

**Direct link:**
```
{{INSTALL_LINK}}
```

### Method 2: Manual Import
1. Download the `.scripting` file from [GitHub]({{RAW_FILE_URL}})
2. Open Scripting App
3. Tap "Import Script" (➕ icon)
4. Select the downloaded file

### Method 3: Source Code
1. Clone the repository:
   ```bash
   git clone {{REPO_URL}}
   ```
2. Copy the `{{COMPONENT_DIR_NAME}}` folder to your Scripting projects
3. Refresh scripts in Scripting App

## 📖 Usage

### Basic Usage
1. Open the component in Scripting App
2. Follow the on-screen instructions
3. Configure settings as needed

### Configuration
// Add configuration instructions here

## ⚙️ Settings

// Add settings description here

## 🛠️ Development

### Project Structure
```
{{COMPONENT_DIR_NAME}}/
├── script.json              # Component configuration
├── index.tsx                # Main component
├── widget.tsx               # Widget component (if applicable)
├── constants.ts             # Constants and configuration
├── app_intents.tsx          # AppIntent definitions
└── README.md                # This file
```

### Building
// Add build instructions here

### Testing
// Add testing instructions here

## 📝 API Reference

// Add API documentation here

## ❓ FAQ

**Q: The installation link doesn't work**
A: Ensure you're opening the link on an iOS device with Scripting App installed.

**Q: How do I update the component?**
A: Re-import the latest `.scripting` file or update the source code.

**Q: Where are settings stored?**
A: Settings are stored in Scripting App's secure storage.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

{{LICENSE}} License - see [LICENSE](LICENSE) for details.

## 🙏 Acknowledgments

- [Scripting App](https://scripting.app) for the amazing platform
- Contributors and testers

---

**Version:** {{VERSION}}
**Last Updated:** {{CURRENT_DATE}}
**Author:** {{AUTHOR_NAME}} {{#if AUTHOR_EMAIL}}<{{AUTHOR_EMAIL}}>{{/if}}
**Repository:** [{{REPO_SHORT}}]({{REPO_URL}})
EOF
)
fi

# Prepare features list
FEATURES_FILE="$COMPONENT_DIR/FEATURES.md"
if [[ -f "$FEATURES_FILE" ]]; then
    FEATURES=$(cat "$FEATURES_FILE")
else
    # Default features based on component type
    case "$COMPONENT_TYPE" in
        widget)
            FEATURES=$(cat << 'EOF'
- **Desktop Widget**: Display information on your home screen
- **Auto Refresh**: Regular updates with configurable intervals
- **Customizable**: Adjust settings to match your preferences
- **Secure Storage**: Sensitive data stored safely in Keychain
EOF
            )
            ;;
        utility)
            FEATURES=$(cat << 'EOF'
- **Single Purpose**: Focused on one specific task
- **Easy to Use**: Simple interface with clear instructions
- **Efficient**: Optimized for performance and battery life
- **Reliable**: Thoroughly tested and stable
EOF
            )
            ;;
        *)
            FEATURES=$(cat << 'EOF'
- **Feature 1**: Description of feature 1
- **Feature 2**: Description of feature 2
- **Feature 3**: Description of feature 3
EOF
            )
            ;;
    esac
fi

# Prepare badges
BADGES=""
if [[ -n "$REPO_SHORT" ]]; then
    BADGES=$(cat << EOF
![GitHub](https://img.shields.io/github/license/$REPO_SHORT)
![GitHub release](https://img.shields.io/github/v/release/$REPO_SHORT)
EOF
    )
fi

# Get current date
CURRENT_DATE=$(date +%Y-%m-%d)

# Component directory name
COMPONENT_DIR_NAME=$(basename "$COMPONENT_DIR")

# Raw file URL (if repository available)
RAW_FILE_URL=""
if [[ -n "$REPO_SHORT" ]]; then
    RAW_FILE_URL="https://raw.githubusercontent.com/$REPO_SHORT/$BRANCH/$COMPONENT_DIR_NAME/$COMPONENT_NAME.scripting"
fi

# Process template with variables
README_CONTENT=$(echo "$TEMPLATE_CONTENT" | awk -v COMPONENT_NAME="$COMPONENT_NAME" \
    -v DESCRIPTION="$DESCRIPTION" \
    -v VERSION="$VERSION" \
    -v AUTHOR_NAME="$AUTHOR_NAME" \
    -v AUTHOR_EMAIL="$AUTHOR_EMAIL" \
    -v LICENSE="$LICENSE" \
    -v REPO_URL="$REPO_URL" \
    -v REPO_SHORT="$REPO_SHORT" \
    -v INSTALL_LINK="$INSTALL_LINK" \
    -v RAW_FILE_URL="$RAW_FILE_URL" \
    -v COMPONENT_DIR_NAME="$COMPONENT_DIR_NAME" \
    -v CURRENT_DATE="$CURRENT_DATE" \
    -v FEATURES="$FEATURES" \
    -v BADGES="$BADGES" \
    '
    {
        gsub(/{{COMPONENT_NAME}}/, COMPONENT_NAME)
        gsub(/{{DESCRIPTION}}/, DESCRIPTION)
        gsub(/{{VERSION}}/, VERSION)
        gsub(/{{AUTHOR_NAME}}/, AUTHOR_NAME)
        gsub(/{{AUTHOR_EMAIL}}/, AUTHOR_EMAIL)
        gsub(/{{LICENSE}}/, LICENSE)
        gsub(/{{REPO_URL}}/, REPO_URL)
        gsub(/{{REPO_SHORT}}/, REPO_SHORT)
        gsub(/{{INSTALL_LINK}}/, INSTALL_LINK)
        gsub(/{{RAW_FILE_URL}}/, RAW_FILE_URL)
        gsub(/{{COMPONENT_DIR_NAME}}/, COMPONENT_DIR_NAME)
        gsub(/{{CURRENT_DATE}}/, CURRENT_DATE)
        gsub(/{{FEATURES}}/, FEATURES)
        gsub(/{{BADGES}}/, BADGES)
        print
    }
    ')

# Handle update mode
if [ "$UPDATE_EXISTING" = true ] && [[ -f "$COMPONENT_DIR/$OUTPUT_FILE" ]]; then
    echo -e "${YELLOW}Updating existing README...${NC}"

    # Backup original
    cp "$COMPONENT_DIR/$OUTPUT_FILE" "$COMPONENT_DIR/$OUTPUT_FILE.backup"

    # Extract custom sections from existing README
    # This is a simplified approach - in practice, you might want more sophisticated parsing

    # For now, just replace the entire file
    echo "$README_CONTENT" > "$COMPONENT_DIR/$OUTPUT_FILE"
    echo -e "${GREEN}Updated README (backup created: $OUTPUT_FILE.backup)${NC}"
else
    # Write new README
    echo "$README_CONTENT" > "$COMPONENT_DIR/$OUTPUT_FILE"
    echo -e "${GREEN}Generated README: $COMPONENT_DIR/$OUTPUT_FILE${NC}"
fi

# Generate features template if not exists
if [[ ! -f "$FEATURES_FILE" ]]; then
    cat > "$FEATURES_FILE" << EOF
# Features for $COMPONENT_NAME

Edit this file to list the features of your component.
Each line should start with "- " for a bullet point.

Example:
- **Fast Performance**: Optimized for quick loading and smooth operation
- **Customizable**: Adjust settings to match your preferences
- **Secure**: Data is stored safely and privately
- **Regular Updates**: Active development with new features added frequently

Current features:
$FEATURES
EOF
    echo -e "${YELLOW}Features template created: $FEATURES_FILE${NC}"
fi

# Create example screenshots directory
SCREENSHOTS_DIR="$COMPONENT_DIR/screenshots"
if [[ ! -d "$SCREENSHOTS_DIR" ]]; then
    mkdir -p "$SCREENSHOTS_DIR"
    cat > "$SCREENSHOTS_DIR/README.md" << EOF
# Screenshots for $COMPONENT_NAME

Add screenshots of your component here:

1. Settings page screenshots
2. Widget screenshots (if applicable)
3. Any other relevant visual examples

Recommended naming:
- settings.png (or .jpg)
- widget-small.png
- widget-medium.png
- widget-large.png

Update the README.md to include these screenshots using markdown:
\`\`\`markdown
## Screenshots

### Settings Page
![Settings](screenshots/settings.png)

### Widget
![Small Widget](screenshots/widget-small.png)
![Medium Widget](screenshots/widget-medium.png)
\`\`\`
EOF
    echo -e "${YELLOW}Screenshots directory created: $SCREENSHOTS_DIR${NC}"
fi

echo -e "${GREEN}✓ README generation complete!${NC}"
if [ "$VERBOSE" = true ]; then
    echo -e "${BLUE}=== Summary ===${NC}"
    echo -e "${YELLOW}Component:${NC} $COMPONENT_NAME v$VERSION"
    echo -e "${YELLOW}Author:${NC} $AUTHOR_NAME"
    echo -e "${YELLOW}Repository:${NC} $REPO_URL"
    echo -e "${YELLOW}Install Link:${NC} ${INSTALL_LINK:-(not generated)}"
    echo -e "${YELLOW}Output:${NC} $COMPONENT_DIR/$OUTPUT_FILE"
fi

exit 0