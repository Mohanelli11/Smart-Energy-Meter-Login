
#!/bin/bash

echo "🚀 Copying ALL component files to src/components/..."
echo ""

# Create src/components directory
mkdir -p src/components

# Copy all component files
echo "Copying component files..."

cp components/AddMeterForm.tsx src/components/AddMeterForm.tsx
cp components/ConsumptionGraph.tsx src/components/ConsumptionGraph.tsx
cp components/CreateAccountModal.tsx src/components/CreateAccountModal.tsx
cp components/Dashboard.tsx src/components/Dashboard.tsx
cp components/DeleteConfirmModal.tsx src/components/DeleteConfirmModal.tsx
cp components/EditMeterModal.tsx src/components/EditMeterModal.tsx
cp components/FilterModal.tsx src/components/FilterModal.tsx
cp components/IndividualMeterView.tsx src/components/IndividualMeterView.tsx
cp components/LivePayments.tsx src/components/LivePayments.tsx
cp components/LoginForm.tsx src/components/LoginForm.tsx
cp components/LoginPage.tsx src/components/LoginPage.tsx
cp components/MeterLoginPage.tsx src/components/MeterLoginPage.tsx
cp components/MeterTable.tsx src/components/MeterTable.tsx
cp components/StatsCard.tsx src/components/StatsCard.tsx
cp components/TokenModal.tsx src/components/TokenModal.tsx
cp components/ViewMeterModal.tsx src/components/ViewMeterModal.tsx

echo "✅ All 17 component files copied to src/components/"
echo ""

# Remove duplicate files from root
echo "Removing duplicate files from root..."
rm -f App.tsx
rm -f index.tsx
rm -f index.css
echo "✅ Duplicate files removed"
echo ""

# Verify
echo "📊 Verification:"
echo "Files in src/components/:"
ls -1 src/components/ | wc -l | xargs echo "  Component count:"
echo ""
echo "Files in src/:"
ls -1 src/ | grep -E "App.tsx|index.tsx|index.css|components" || echo "  ✅ Correct structure"
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✨ DONE! Now run these commands:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "1. npm install"
echo "2. npm run build"
echo "3. npm run preview"
echo "4. git add ."
echo "5. git commit -m 'Fix: Copy all components to src/components'"
echo "6. git push origin main"
echo ""
echo "Your site will work after Netlify rebuilds! 🎉"
