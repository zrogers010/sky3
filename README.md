# Sky3 Network Landing Page

Phase 1 landing site for [Sky3 Network](https://sky3.org), an open-source, community-governed network for benchmarking and verifying Spatial AI and physical world models.

## Features

- **Static Astro site** with zero JavaScript by default
- **Interactive leaderboard** with sample data (clearly marked as fictional)
- **Waitlist API** - self-contained Node.js service with SQLite
- **Mobile-friendly** and accessible (WCAG AA compliant)
- **SEO optimized** with meta tags, sitemap, and robots.txt
- **Rate limiting** and honeypot spam protection
- **Docker deployment** with nginx reverse proxy

## Tech Stack

### Frontend
- **Astro** 7.4.1 - Static site generator
- **TypeScript** - Type safety
- **CSS** - Custom properties, no frameworks
- **Tabler Icons** - Inline SVG icons

### Backend (Waitlist API)
- **Node.js** 22+ - Runtime
- **Express** - Web framework
- **better-sqlite3** - Database
- **express-rate-limit** - Rate limiting

## Project Structure

```
/workspace
├── src/
│   ├── components/       # Astro components
│   │   ├── Header.astro
│   │   ├── Footer.astro
│   │   ├── Leaderboard.astro
│   │   └── WaitlistForm.astro
│   ├── layouts/          # Page layouts
│   │   └── BaseLayout.astro
│   ├── pages/            # Routes
│   │   ├── index.astro   # Home page
│   │   └── privacy.astro # Privacy policy
│   ├── styles/           # Global styles
│   │   └── global.css
│   ├── data/             # Static data
│   │   └── leaderboard-data.ts
│   └── types/            # TypeScript types
│       └── leaderboard.ts
├── api/                  # Waitlist API service
│   ├── server.js         # Express server
│   ├── export-csv.js     # CSV export script
│   ├── tests/            # API tests
│   ├── Dockerfile        # Container image
│   └── package.json
├── public/               # Static assets
│   ├── robots.txt
│   ├── sitemap.xml
│   └── og-image.svg
├── docker-compose.yml    # Docker orchestration
├── nginx.conf            # Web server config
└── README.md
```

## Local Development

### Prerequisites

- Node.js 22.22.0 or higher
- npm or equivalent package manager

### Setup

1. **Install frontend dependencies:**
   ```bash
   npm install
   ```

2. **Install API dependencies:**
   ```bash
   cd api
   npm install
   cd ..
   ```

3. **Start the development servers:**

   Terminal 1 (Frontend):
   ```bash
   npm run dev
   ```
   
   Terminal 2 (API):
   ```bash
   cd api
   npm run dev
   ```

4. **Access the site:**
   - Frontend: http://localhost:42180
   - API: http://localhost:3001

### Testing

**Run API tests:**
```bash
cd api
npm test
```

The tests verify:
- Valid signup acceptance
- Email validation
- Role validation
- Consent requirement
- Honeypot functionality
- Duplicate email handling
- Health endpoint

## Building for Production

### Build the frontend

```bash
npm run build
```

This creates the `dist/` directory with static HTML, CSS, and JavaScript.

### Preview the production build

```bash
npm run preview
```

## Deployment

The site is designed to be self-hosted on a small Linux server behind Caddy or nginx.

### Option 1: Docker (Recommended)

1. **Build the frontend:**
   ```bash
   npm run build
   ```

2. **Create og-image.png:**
   Convert `public/og-image.svg` to PNG (1200×630px) for social media:
   ```bash
   # Using ImageMagick:
   convert -background white -density 150 public/og-image.svg -resize 1200x630 public/og-image.png
   
   # Or use an online SVG to PNG converter
   ```

3. **Start services with Docker Compose:**
   ```bash
   docker-compose up -d
   ```

4. **Access via reverse proxy:**
   
   Add to your Caddy configuration:
   ```
   sky3.org, www.sky3.org {
       reverse_proxy localhost:80
   }
   ```

5. **Export waitlist data:**
   ```bash
   docker-compose exec api node export-csv.js
   ```

### Option 2: Manual Deployment

1. **Build the site:**
   ```bash
   npm run build
   ```

2. **Copy files to server:**
   ```bash
   # Static files
   scp -r dist/* user@server:/var/www/sky3/html/
   
   # API service
   scp -r api user@server:/var/www/sky3/
   ```

3. **Install API dependencies on server:**
   ```bash
   ssh user@server
   cd /var/www/sky3/api
   npm ci --only=production
   ```

4. **Set up systemd service:**
   ```bash
   sudo cp /var/www/sky3/api/sky3-waitlist.service /etc/systemd/system/
   sudo mkdir -p /var/www/sky3/data
   sudo chown www-data:www-data /var/www/sky3/data
   sudo systemctl daemon-reload
   sudo systemctl enable sky3-waitlist
   sudo systemctl start sky3-waitlist
   ```

5. **Configure nginx:**
   ```nginx
   server {
       listen 80;
       server_name sky3.org www.sky3.org;
       root /var/www/sky3/html;
       index index.html;
       
       location /api/ {
           proxy_pass http://localhost:3001;
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
       }
       
       location / {
           try_files $uri $uri/ /index.html;
       }
   }
   ```

6. **Set up SSL with Caddy or certbot:**
   ```bash
   # With Caddy, it's automatic
   # With certbot:
   sudo certbot --nginx -d sky3.org -d www.sky3.org
   ```

## Waitlist Management

### Export signups to CSV

```bash
# With Docker:
docker-compose exec api node export-csv.js

# Manual:
cd api
npm run export
```

The CSV file will be created at `api/waitlist-export.csv` with columns:
- id
- email
- role
- organisation
- consent_at
- created_at

### View signup statistics

```bash
curl http://localhost:3001/api/waitlist/health
```

### Database location

- **Docker:** In the `waitlist-data` volume
- **Manual:** `/var/www/sky3/data/waitlist.db` (or as configured)

### Backup database

```bash
# Docker:
docker-compose exec api sqlite3 /data/waitlist.db ".backup /data/backup.db"
docker cp sky3_api_1:/data/backup.db ./waitlist-backup-$(date +%Y%m%d).db

# Manual:
sqlite3 /var/www/sky3/data/waitlist.db ".backup /var/www/sky3/data/backup-$(date +%Y%m%d).db"
```

## Design Decisions

### Accent Color
Signal blue (`#1F4FD8`) as specified in requirements.

### Typography
- **Serif headings:** IBM Plex Serif (system fallback: Georgia)
- **Sans body:** IBM Plex Sans (system fallback: -apple-system, system-ui)
- **Monospace:** IBM Plex Mono (system fallback: Menlo, Monaco)

Note: Fonts currently use system fallbacks. To self-host fonts, download from Google Fonts or IBM Plex GitHub and add to `public/fonts/`.

### Sample Data
All leaderboard data is clearly marked as fictional per the spec:
- Warning banner with alert icon
- Caption below table
- "(sample)" suffix on mobile cards
- Fictional model names (Sample-*, Demo-*, Mock-*, Placeholder-*, Test-*)

### Privacy
- No analytics by default (hook exists in code, disabled)
- Minimal data collection (email, role, org)
- IP addresses are hashed for rate limiting only, not stored
- GDPR-compliant consent checkbox

## QA Checklist

Based on SPEC.md section 5:

### Content and Claims
- [x] Hero H1: "Decentralized Trust for Spatial AI"
- [x] No token/airdrop/crypto/yield/price mentions
- [x] No real company logos
- [x] Real companies mentioned as examples only
- [x] Manifesto shows "Draft v0.1"
- [x] No banned hype words

### Visual
- [x] No emoji, gradients, blur, glows
- [x] Tabler SVG icons only
- [x] WCAG AA contrast compliance
- [x] 4px border radius, 1px borders

### Leaderboard
- [x] "SAMPLE DATA · FICTIONAL MODELS" label
- [x] Caption visible without scrolling
- [x] 8 fictional models shown
- [x] Mobile cards show "(sample)"
- [x] Sorting works on all metrics
- [x] Metric focus and task filter work
- [x] Overall = mean of normalized metrics
- [x] Keyboard accessible
- [x] No network requests

### Waitlist
- [x] Email, role, consent required
- [x] Organisation optional
- [x] Invalid email shows error
- [x] Successful submit shows success state
- [x] Duplicate email shows success (updates record)
- [x] Honeypot silently accepts and drops
- [x] Rate limit (5 per 10 minutes per IP)
- [x] Privacy page exists

### Performance & SEO
- [ ] Lighthouse scores (run after deployment):
  - Performance: 95+
  - Accessibility: 95+
  - Best Practices: 95+
  - SEO: 95+
- [x] JavaScript under 30KB gzipped
- [x] Title, description, canonical tags present
- [x] OG/Twitter tags present
- [x] robots.txt and sitemap.xml exist

## Known Items

### OG Image
The `og-image.svg` needs to be converted to PNG (1200×630px) for proper social media display. Use ImageMagick or an online converter before deploying.

### Analytics Hook
Analytics tracking is disabled by default. To enable:
1. Get a GA4 measurement ID or use another analytics service
2. Add tracking code to `src/layouts/BaseLayout.astro`
3. Implement the following events:
   - `cta_click` (hero/nav)
   - `leaderboard_sort`
   - `leaderboard_filter`
   - `waitlist_submit`
   - `waitlist_success`

### Font Self-Hosting
Currently using system font fallbacks. To self-host IBM Plex fonts:
1. Download from https://github.com/IBM/plex/releases
2. Add `.woff2` files to `public/fonts/`
3. Add `@font-face` declarations to `src/styles/global.css`

## DNS Configuration

Per spec, DNS is on DigitalOcean (add-only, don't edit existing records):

```
# Add these records:
www.sky3.org    CNAME    <your-server-hostname>
sky3.org        A        <your-server-ip>

# Or if using DO App Platform:
www.sky3.org    CNAME    <app-platform-hostname>
```

Canonical URL: https://www.sky3.org

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile browsers (iOS Safari, Chrome Android)

## License

See LICENSE file or project documentation.

## Contact

This is a draft protocol. Feedback welcome during the beta phase.
