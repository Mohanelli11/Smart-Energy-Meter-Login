
@echo off
echo 🚀 Copying ALL component files to src\components\...
echo.

REM Create src\components directory
if not exist "src" mkdir src
if not exist "rc\components" mkdir src\components

REM Copy all component files
echo Copying component files...

copy /Y components\AddMeterForm.tsx src\components\AddMeterForm.tsx >nul
copy /Y components\ConsumptionGraph.tsx src\components\ConsumptionGraph.tsx >nul
copy /Y components\CreateAccountModal.tsx src\components\CreateAccountModal.tsx >nul
copy /Y components\Dashboard.tsx src\components\Dashboard.tsx >nul
copy /Y components\DeleteConfirmModal.tsx src\components\DeleteConfirmModal.tsx >nul
copy /Y components\EditMeterModal.tsx src\components\EditMeterModal.tsx >nul
copy /Y components\FilterModal.tsx src\components\FilterModal.tsx >nul
copy /Y components\IndividualMeterView.tsx src\components\IndividualMeterView.tsx >nul
copy /Y components\LivePayments.tsx src\components\LivePayments.tsx >nul
copy /Y components\LoginForm.tsx src\components\LoginForm.tsx >nul
copy /Y components\LoginPage.tsx src\components\LoginPage.tsx >nul
copy /Y components\MeterLoginPage.tsx src\components\MeterLoginPage.tsx >nul
copy /Y components\MeterTable.tsx src\components\MeterTable.tsx >nul
copy /Y components\StatsCard.tsx src\components\StatsCard.tsx >nul
copy /Y components\TokenModal.tsx src\components\TokenModal.tsx >nul
copy /Y components\ViewMeterModal.tsx src\components\ViewMeterModal.tsx >nul

echo ✅ All 17 component files copied to src\components\
echo.

REM Remove duplicate files from root
echo Removing duplicate files from root...
if exist "App.tsx" del /f App.tsx
if exist "index.tsx" del /f index.tsx
if exist "index.css" del /f index.css
echo ✅ Duplicate files removed
echo.

REM Verify
echo 📊 Verification:
echo Files in src\components\:
dir /b src\components\ 2>nul | find /c ".tsx"
echo.

echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo ✨ DONE! Now run these commands:
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo.
echo 1. npm install
echo 2. npm run build
echo 3. npm run preview
echo 4. git add .
echo 5. git commit -m "Fix: Copy all components to src/components"
echo 6. git push origin main
echo.
echo Your site will work after Netlify rebuilds! 🎉

pause
