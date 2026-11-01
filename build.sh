#!/bin/sh
# Netlify runs this before publishing. It puts the files into the right folders,
# whether they were uploaded to GitHub flat (all in one place) or inside folders.
mkdir -p public/img netlify/functions
for f in index.html login.html admin.html styles.css app.css; do
  if [ -f "$f" ]; then cp "$f" public/; fi
done
for f in hero.jpg logo.png; do
  if [ -f "$f" ]; then cp "$f" public/img/; fi
done
if [ -f app.mjs ]; then cp app.mjs netlify/functions/; fi
echo "build.sh finished"
