
@echo off
echo 🚨 CRITICAL FIX: Resolving blank page issue...
echo.

REM Step 1: Remove duplicate files from root
echo Step 1: Removing duplicate files from root...
if exist "App.tsx" del /f App.tsx
if exist "index.tsx" del /f index.tsx
if exist "index.css" del /f index.css
echo ✅ Duplicates removed
echo.

REM Step 2: Create src/components directory
echo Step 2: Creating src\components directory...
if not exist "src" mkdir src
if not exist "src\components" mkdir src\components
echo ✅ Directory created
echo.

REM Step 3: Move component files
echo Step 3: Moving component files to src\components\...
if exist "components" (
    if exist "components\*.tsx" (
        move /y "components\*.tsx" "src\components\" >nul 2>&1
        echo ✅ Component files moved
    ) else (
        echo ⚠️  No .tsx files found in components\
    )
    
    REM Remove old components directory
    rmdir "components" >nul 2>&1
    if %errorlevel% equ 0 (
        echo ✅ Old components\ directory removed
    )
) else (
    echo ℹ️  No components\ directory in root (already fixed?)
)
echo.

REM Step 4: Verify structure
echo Step 4: Verifying structure...
echo.
echo 📁 Files in src\:
dir /b src\ 2>nul | findstr /i "App.tsx index.tsx index.css components"
echo.
echo 📁 Files in src\components\:
dir /b src\components\ 2>nul | find /c ".tsx"
echo.

REM Step 5: Check for remaining issues
echo Step 5: Checking for issues...
if exist "App.tsx" (
    echo ⚠️  WARNING: App.tsx still exists in root!
) else if exist "index.tsx" (
    echo ⚠️  WARNING: index.tsx still exists in root!
) else if exist "index.css" (
    echo ⚠️  WARNING: index.css still exists in root!
) else (
    echo ✅ No duplicate files in root
)

if exist "components" (
    echo ⚠️  WARNING: components\ directory still exists in root!
) else (
    echo ✅ No components\ directory in root
)
echo.

REM Final instructions
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo ✨ Structure fix complete!
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo.
echo 📋 Next steps:
echo.
echo 1. Install dependencies:
echo    npm install
echo.
echo 2. Test the build:
echo    npm run build
echo.
echo 3. Test locally:
echo    npm run preview
echo.
echo 4. If everything works, deploy:
echo    git add .
echo    git commit -m "Fix: Correct project structure for deployment"
echo    git push origin main
echo.
echo 5. Wait 2-3 minutes for Netlify to rebuild
echo.
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

pause
