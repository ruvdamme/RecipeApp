#!/usr/bin/env bash
pm2 delete all
pm2 save
rm -rf RecipeApp
git clone https://github.com/ruvdamme/RecipeApp.git
cd RecipeApp/backend/
go build
pm2 start ./recipes-api --name "api"
pm2 save
cd ../frontend
npm install
npm run build
pm2 start "npx serve -s dist" --name "frontend"
pm2 save
