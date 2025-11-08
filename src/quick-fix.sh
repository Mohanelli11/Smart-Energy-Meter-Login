
#!/bin/bash

echo "🚨 CRITICAL FIX: Resolving blank page issue..."
echo ""

# Step 1: Remove duplicate files from root
echo "Step 1: Removing duplicate files from root..."
rm -f App.tsx
rm -f index.tsx
rm -f index.css
echo "✅ Duplicates removed"
echo ""

# Step 2: Create src/components directory
echo "Step 2: Creating src/components directory..."
mkdir -p src/components
echo "✅ Directory created"
echo ""

# Step 3: Move component files
echo "Step 3: Moving component files to src/components/..."
if [ -d "components" ]; then
    if ls components/*.tsx 1> /dev/null 2>&1; then
        mv components/*.tsx src/components/
        echo "✅ Component files moved"
    else
        echo "⚠️  No .tsx files found in components/"
    fi
    
    # Remove old components directory
    rmdir components 2>/dev/null
    if [ $? -eq 0 ]; then
        echo "✅ Old components/ directory removed"
    fi
else
    echo "ℹ️  No components/ directory in root (already fixed?)"
fi
echo ""

# Step 4: Verify structure
echo "Step 4: Verifying structure..."
echo ""
echo "📁 Files in src/:"
ls -la src/ | grep -E "App.tsx|index.tsx|index.css|components"
echo ""
echo "📁 Files in src/components/:"
ls -la src/components/ 2>/dev/null | grep ".tsx" | wc -l | xargs echo "Component files found:"
echo ""

# Step 5: Check for remaining issues
echo "Step 5: Checking for issues..."
if [ -f "App.tsx" ] || [ -f "index.tsx" ] || [ -f "index.css" ]; then
    echo "⚠️  WARNING: Duplicate files still exist in root!"
    echo "   Please manually delete: App.tsx, index.tsx, index.css from root"
else
    echo "✅ No duplicate files in root"
fi

if [ -d "components" ]; then
    echo "⚠️  WARNING: components/ directory still exists in root!"
    echo "   Please manually delete it"
else
    echo "✅ No components/ directory in root"
fi
echo ""

# Final instructions
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✨ Structure fix complete!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📋 Next steps:"
echo ""
echo "1. Install dependencies:"
echo "   npm install"
echo ""
echo "2. Test the build:"
echo "   npm run build"
echo ""
echo "3. Test locally:"
echo "   npm run preview"
echo ""
echo "4. If everything works, deploy:"
echo "   git add ."
echo "   git commit -m 'Fix: Correct project structure for deployment'"
echo "   git push origin main"
echo ""
echo "5. Wait 2-3 minutes for Netlify to rebuild"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
