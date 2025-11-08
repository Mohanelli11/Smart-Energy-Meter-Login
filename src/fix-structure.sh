
#!/bin/bash

echo "🔧 Fixing project structure for deployment..."

# Create src directory if it doesn't exist
mkdir -p src/components

# Check if components directory exists in root
if [ -d "components" ]; then
    echo "📦 Moving component files to src/components/..."
    
    # Move all .tsx files from components to src/components
    if ls components/*.tsx 1> /dev/null 2>&1; then
        mv components/*.tsx src/components/
        echo "✅ Component files moved successfully"
    else
        echo "⚠️  No .tsx files found in components directory"
    fi
    
    # Remove old components directory if empty
    if [ -z "$(ls -A components)" ]; then
        rmdir components
        echo "✅ Old components directory removed"
    else
        echo "⚠️  Components directory not empty, please check manually"
    fi
else
    echo "ℹ️  No root components directory found"
fi

# Check if App.tsx, index.tsx, index.css are in root and move to src
if [ -f "App.tsx" ]; then
    mv App.tsx src/
    echo "✅ Moved App.tsx to src/"
fi

if [ -f "index.tsx" ]; then
    mv index.tsx src/
    echo "✅ Moved index.tsx to src/"
fi

if [ -f "index.css" ]; then
    mv index.css src/
    echo "✅ Moved index.css to src/"
fi

if [ -f "tailwind.config.js" ] && [ ! -f "src/tailwind.config.js" ]; then
    # tailwind.config.js should stay in root
    echo "✅ tailwind.config.js is in correct location"
fi

echo ""
echo "📁 Current structure:"
echo "src/"
ls -la src/ 2>/dev/null || echo "  (directory not found)"
echo ""
echo "src/components/"
ls -la src/components/ 2>/dev/null || echo "  (directory not found)"
echo ""
echo "✨ Structure fix complete!"
echo ""
echo "Next steps:"
echo "1. Review the changes above"
echo "2. Run: npm install"
echo "3. Run: npm run dev (to test locally)"
echo "4. Run: npm run build (to verify build works)"
echo "5. Commit and push: git add . && git commit -m 'Fix project structure' && git push"
