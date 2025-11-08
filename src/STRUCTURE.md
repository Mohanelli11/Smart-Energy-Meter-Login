
# Project Structure for Deployment

## Correct File Organization

Your project should have this structure:

```
hydrobox-smartmeter/
├── src/
│   ├── components/
│   │   ├── AddMeterForm.tsx
│   │   ├── ConsumptionGraph.tsx
│   │   ├── CreateAccountModal.tsx
│   │   ├── Dashboard.tsx
│   │   ├── DeleteConfirmModal.tsx
│   │   ├── EditMeterModal.tsx
│   │   ├── FilterModal.tsx
│   │   ├── IndividualMeterView.tsx
│   │   ├── LivePayments.tsx
│   │   ├── LoginForm.tsx
│   │   ├── LoginPage.tsx
│   │   ├── MeterLoginPage.tsx
│   │   ├── MeterTable.tsx
│   │   ├── StatsCard.tsx
│   │   ├── TokenModal.tsx
│   │   └── ViewMeterModal.tsx
│   ├── App.tsx
│   ├── index.tsx
│   ├── index.css
│   └── vite-env.d.ts
├── public/
│   └── index.html
├── package.json
├── vite.config.ts
├── tsconfig.json
├── tsconfig.node.json
├── tailwind.config.js
├── postcss.config.js
├── netlify.toml
├── .gitignore
├── .eslintrc.cjs
├── .nvmrc
├── README.md
└── DEPLOYMENT.md
```

## IMPORTANT: Move Files to Correct Location

**All component files must be in `src/components/` directory!**

If your components are currently in the root `components/` folder, you need to:

1. Create `src/components/` directory
2. Move all `.tsx` component files into `src/components/`
3. The root `components/` folder should be deleted

## Files That Should Be in Root:
- package.json
- vite.config.ts
- tsconfig.json
- tsconfig.node.json
- tailwind.config.js
- postcss.config.js
- netlify.toml
- .gitignore
- .eslintrc.cjs
- .nvmrc
- README.md
- DEPLOYMENT.md

## Files That Should Be in `src/`:
- App.tsx
- index.tsx
- index.css
- vite-env.d.ts

## Files That Should Be in `src/components/`:
- All 17 component .tsx files

## Files That Should Be in `public/`:
- index.html

## How to Fix Structure

Run these commands in your project root:

```bash
# Create src/components directory if it doesn't exist
mkdir -p src/components

# Move all component files to src/components
mv components/*.tsx src/components/

# Remove old components directory
rmdir components

# Verify structure
ls -la src/
ls -la src/components/
```

## After Fixing Structure

1. Commit changes:
```bash
git add .
git commit -m "Fix: Reorganize project structure for deployment"
git push origin main
```

2. Netlify will automatically redeploy with the correct structure

## Verification

After deployment, check:
- [ ] Site loads without errors
- [ ] Login page appears
- [ ] Can login with credentials
- [ ] Dashboard displays correctly
- [ ] All features work

If you still see issues, check Netlify build logs for errors.
