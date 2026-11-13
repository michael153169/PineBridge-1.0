
#!/bin/sh
# Netlify build script for PineBridge Official Website.
# Copies website files into the public directory.

mkdir -p public/img netlify/functions

# Website HTML and CSS files
for f in index.html about.html services.html markets.html contact.html login.html admin.html styles.css app.css; do
  if [ -f "$f" ]; then
    cp "$f" public/
  fi
done

# Website images
for f in hero.jpg logo.png; do
  if [ -f "$f" ]; then
    cp "$f" public/img/
  fi
done

# Existing Netlify Function
if [ -f app.mjs ]; then
  cp app.mjs netlify/functions/
fi

echo "build.sh finished"
