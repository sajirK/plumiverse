#!/bin/sh
# Construit Plumiverse et publie le dossier dist/ sur la branche gh-pages (GitHub Pages).
set -e
npm test
npm run build
touch dist/.nojekyll
cd dist
git init -q -b gh-pages
git add -A
git commit -q -m "Publication $(node -p "require('../package.json').version") — $(date +%Y-%m-%d)"
git push -f "$(git -C .. remote get-url origin)" gh-pages
rm -rf .git
