
@echo off
echo 🔧 Fixing project structure for deployment...

REM Create src directory if it doesn't exist
if not exist "src" mkdir src
if not exist "src\components" mkdir src\components

REM Check if components directory exists in root
if exist "components" (
    echo 📦 Moving component files to src\components\...
    
    REM Move all .tsx files from components to src\components
    if exist "components\*.tsx" (
        move "components\*.tsx" "src\components\"
        echo ✅ Component files moved successfully
    ) else (
        echo ⚠️  No .tsx files found in components directory
    )
    
    REM Remove old components directory if empty
    rmdir "components" 2>nul
    if %errorlevel% equ 0 (
        echo ✅ Old components directory removed
    ) else (
        echo ⚠️  Components directory not empty, please check manually
    )
) else (
    echo ℹ️  No root components directory found
)

REM Move App.tsx, index.tsx, index.css to src if they're in root
if exist "App.tsx" (
    move "App.tsx" "src\"
    echo ✅ Moved App.tsx to src\
)

if exist "index.tsx" (
    move "index.tsx" "src\"
    echo ✅ Moved index.tsx to src\
)

if exist "index.css" (
    move "index.css" "src\"
    echo ✅ Moved index.css to src\
)

echo.
echo 📁 Current structure:
echo src\
dir /b src\ 2>nul
echo.
echo src\components\
dir /b src\components\ 2>nul
echo.
echo ✨ Structure fix complete!
echo.
echo Next steps:
echo 1. Review the changes above
echo 2. Run: npm install
echo 3. Run: npm run dev (to test locally)
echo 4. Run: npm run build (to verify build works)
echo 5. Commit and push: git add . ^&^& git commit -m "Fix project structure" ^&^& git push

pause
