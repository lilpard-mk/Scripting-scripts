#!/bin/bash

# Script to generate one-click installation links for Scripting App components
# Usage: ./generate-install-link.sh [OPTIONS]

set -e

# Default values
REPO=""
BRANCH="main"
FILE_PATH=""
OUTPUT=""
VERBOSE=false
ENCODE_ONLY=false

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Help function
show_help() {
    cat << EOF
Generate one-click installation links for Scripting App components.

Usage: $0 [OPTIONS]

Options:
  -r, --repo REPO         GitHub repository in format "username/repo" (required)
  -b, --branch BRANCH     Git branch name (default: "main")
  -f, --file FILE_PATH    Path to .scripting file in repository (required)
  -o, --output FILE       Output file (default: stdout)
  -e, --encode-only       Only output the encoded JSON array
  -v, --verbose           Show detailed output
  -h, --help              Show this help message

Examples:
  $0 --repo "lilpard-mk/Scripting-scripts" --file "DeepSeekBalenceChecker/DeepSeek余额.scripting"
  $0 -r "username/repo" -b "develop" -f "Component/component.scripting" -o install-link.txt
  $0 --repo "test/repo" --file "app.scripting" --encode-only

The generated link follows the format:
  https://scripting.fun/import_scripts?urls=[ENCODED_JSON_ARRAY]

Where the JSON array contains the raw GitHub URL:
  ["https://raw.githubusercontent.com/username/repo/branch/path/to/file.scripting"]
EOF
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -r|--repo)
            REPO="$2"
            shift 2
            ;;
        -b|--branch)
            BRANCH="$2"
            shift 2
            ;;
        -f|--file)
            FILE_PATH="$2"
            shift 2
            ;;
        -o|--output)
            OUTPUT="$2"
            shift 2
            ;;
        -e|--encode-only)
            ENCODE_ONLY=true
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
        *)
            echo -e "${RED}Error: Unknown option $1${NC}"
            show_help
            exit 1
            ;;
    esac
done

# Validate required arguments
if [[ -z "$REPO" ]]; then
    echo -e "${RED}Error: Repository (-r, --repo) is required${NC}"
    show_help
    exit 1
fi

if [[ -z "$FILE_PATH" ]]; then
    echo -e "${RED}Error: File path (-f, --file) is required${NC}"
    show_help
    exit 1
fi

# Construct raw GitHub URL
RAW_URL="https://raw.githubusercontent.com/$REPO/$BRANCH/$FILE_PATH"

# Alternative format with refs/heads/ for better GitHub compatibility
RAW_URL_REFS="https://raw.githubusercontent.com/$REPO/refs/heads/$BRANCH/$FILE_PATH"

# Create JSON array
JSON_ARRAY="[\"$RAW_URL_REFS\"]"

# URL encode the JSON array
# Using Python for reliable URL encoding
ENCODED_JSON=$(python3 -c "
import urllib.parse
import sys
json_array = sys.argv[1]
encoded = urllib.parse.quote(json_array, safe='')
print(encoded)
" "$JSON_ARRAY")

# Construct final URL
FINAL_URL="https://scripting.fun/import_scripts?urls=$ENCODED_JSON"

# Verbose output
if [ "$VERBOSE" = true ]; then
    echo -e "${BLUE}=== Scripting App Install Link Generator ===${NC}"
    echo -e "${YELLOW}Repository:${NC} $REPO"
    echo -e "${YELLOW}Branch:${NC} $BRANCH"
    echo -e "${YELLOW}File path:${NC} $FILE_PATH"
    echo -e "${YELLOW}Raw URL:${NC} $RAW_URL"
    echo -e "${YELLOW}Raw URL (refs):${NC} $RAW_URL_REFS"
    echo -e "${YELLOW}JSON Array:${NC} $JSON_ARRAY"
    echo -e "${YELLOW}Encoded JSON:${NC} $ENCODED_JSON"
    echo -e "${GREEN}Final URL:${NC} $FINAL_URL"
    echo -e "${BLUE}============================================${NC}"
fi

# Output based on options
if [ "$ENCODE_ONLY" = true ]; then
    OUTPUT_CONTENT="$ENCODED_JSON"
else
    OUTPUT_CONTENT="$FINAL_URL"
fi

# Write output
if [[ -n "$OUTPUT" ]]; then
    echo "$OUTPUT_CONTENT" > "$OUTPUT"
    echo -e "${GREEN}Output written to: $OUTPUT${NC}"

    # Also write metadata if verbose
    if [ "$VERBOSE" = true ] && [[ -n "$OUTPUT" ]]; then
        cat > "${OUTPUT}.meta" << EOF
# Scripting App Install Link Metadata
# Generated: $(date)
Repository: $REPO
Branch: $BRANCH
File: $FILE_PATH
Raw URL: $RAW_URL
Raw URL (refs): $RAW_URL_REFS
JSON Array: $JSON_ARRAY
Encoded JSON: $ENCODED_JSON
Final URL: $FINAL_URL

# Usage
1. Open this link on iOS device with Scripting App installed
2. Scripting App will prompt to import the component
3. Confirm to install

# Markdown format
[🔗 Install Component]($FINAL_URL)
EOF
        echo -e "${GREEN}Metadata written to: ${OUTPUT}.meta${NC}"
    fi
else
    echo "$OUTPUT_CONTENT"
fi

# Test the URL if verbose
if [ "$VERBOSE" = true ] && [ "$ENCODE_ONLY" = false ]; then
    echo -e "${YELLOW}Testing URL accessibility...${NC}"
    if command -v curl &> /dev/null; then
        HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$RAW_URL_REFS" || echo "Failed")
        if [[ "$HTTP_STATUS" == "200" ]]; then
            echo -e "${GREEN}✓ Raw file is accessible (HTTP $HTTP_STATUS)${NC}"
        else
            echo -e "${RED}✗ Raw file may not be accessible (HTTP $HTTP_STATUS)${NC}"
            echo -e "${YELLOW}Check:${NC}"
            echo -e "  1. Repository is public"
            echo -e "  2. File exists at path: $FILE_PATH"
            echo -e "  3. Branch exists: $BRANCH"
            echo -e "  4. URL: $RAW_URL_REFS"
        fi
    else
        echo -e "${YELLOW}Note: Install curl to test URL accessibility${NC}"
    fi
fi

exit 0