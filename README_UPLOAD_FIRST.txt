PINEBRIDGE OFFICIAL WEBSITE — MULTI-PAGE UPGRADE

FILES TO UPLOAD TO THE ROOT OF YOUR EXISTING GitHub REPOSITORY:
- index.html (replaces current homepage)
- about.html (new)
- services.html (new)
- markets.html (new)
- contact.html (new)
- styles.css (replaces current stylesheet, preserving original CSS and adding new styles)

IMPORTANT:
- Do NOT delete or replace your existing img/ folder (it contains img/logo.png and img/hero.jpg).
- Do NOT delete app.css, app.mjs, netlify.toml, or Netlify Functions.
- Client login remains: https://glittery-salamander-a1bb12.netlify.app/login
- The Market Insights photograph is linked remotely from Wikimedia Commons (Travelpleb, CC0). If it fails to load, download the photo from https://commons.wikimedia.org/wiki/File:Bursa_Malaysia.JPG and host it locally, then change the img src to /img/bursa-malaysia.jpg.
- Contact form opens a mailto: email client; it does NOT submit to a backend. Display and destination email are both customercare@pinebridgemsia.com.
- Please verify company legal name and the support email before public launch.
- Homepage hero still uses /img/hero.jpg and the original overlay rules.
- This is a stock-market educational simulation site, not a licensed brokerage or an offer of guaranteed returns.

TEST AFTER DEPLOY:
1. Home logo, background, Explore the Platform button.
2. About, Services, Market Insights, Contact links each open a separate page.
3. Mobile Menu and Login button.
4. Contact Prepare Email opens email app and correct recipient.
5. Market Insights photo loads (remote Wikimedia asset).
6. No client/admin/supabase files were changed.
