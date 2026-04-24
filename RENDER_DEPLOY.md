# Render deploy guide

This repo is prepared for Render with:

- 1 web service for the React app + Node API + Socket.IO
- 1 private MySQL service
- 1 disk for MySQL data
- product and avatar images stored in MySQL

## Before you start

1. Push this project to GitHub.
2. Make sure the branch you want to deploy already contains:
   - `render.yaml`
   - the latest backend changes in `server/index.js` and `server/db.js`

## Fastest path: deploy from `render.yaml`

1. Log in to Render.
2. Click `New` -> `Blueprint`.
3. Connect the GitHub repo that contains this project.
4. Select the branch to deploy.
5. Render will read `render.yaml` and show 2 services:
   - `navshop-react-node-mysql`
   - `navshop-react-node-web`
6. Review the plans:
   - both are set to `starter`
   - this is intentional because private MySQL and persistent disks are not available on free static hosting
7. When Render asks for secrets, enter:
   - `MYSQL_PASSWORD`: choose a strong password
   - `MYSQL_ROOT_PASSWORD`: choose another strong password
8. Click `Apply`.

## What Render will create

### 1. MySQL private service

- Service type: private service
- Runtime: image
- Image: `docker.io/mysql:8.4`
- Disk mount: `/var/lib/mysql`

### 2. Web service

- Build command: `npm ci && npm run build`
- Start command: `npm start`
- Health check: `/api/health`

## After the first deploy

1. Wait for MySQL to finish its first boot.
2. Wait for the web service to finish deploying.
3. Open the web service URL from Render.
4. Test these URLs:
   - `/api/health`
   - `/`
   - `/admin/chat`

## Expected behavior on first run

- The app will create tables automatically.
- The app will create the default admin account automatically.
- The app will seed sample products automatically if the products table is empty.

Default seeded admin:

- Email: `admin@gmail.com`
- Password: `admin123`

Change this account after deploy if you use the app beyond testing.

## If you add a custom domain later

The server already accepts the Render URL automatically via `RENDER_EXTERNAL_URL`.

If you also want to allow a custom domain for API/WebSocket requests:

1. Open the web service in Render.
2. Go to `Environment`.
3. Add `CLIENT_URL`.
4. Set it to your domain, for example:

```env
CLIENT_URL=https://shop.yourdomain.com
```

If you need more than one allowed origin, use a comma-separated list:

```env
CLIENT_URL=https://shop.yourdomain.com,https://www.shop.yourdomain.com
```

## If the web service fails on the first deploy

This repo already retries database startup automatically.

If MySQL is still not ready in time:

1. Open the web service in Render.
2. Click `Manual Deploy`.
3. Click `Restart service`.

Usually one restart is enough after MySQL becomes healthy.

## Important notes

- Uploaded product and avatar images are stored in MySQL blobs.
- If you remove the MySQL disk, database data will be lost.
- This setup uses same-origin hosting: frontend, API, uploads, and Socket.IO are all served from the same Render web service URL.

## Manual fallback if Blueprint is not used

If Blueprint setup fails for any reason, create services manually in this order:

1. Create a private service for MySQL from image `docker.io/mysql:8.4`.
2. Attach a 10 GB disk at `/var/lib/mysql`.
3. Set env vars:
   - `MYSQL_DATABASE=navshop_react`
   - `MYSQL_USER=navshop`
   - `MYSQL_PASSWORD=<your password>`
   - `MYSQL_ROOT_PASSWORD=<your root password>`
4. Create a Node web service from this repo.
5. Set:
   - Build command: `npm ci && npm run build`
   - Start command: `npm start`
   - Health check path: `/api/health`
6. Add env vars:
   - `DB_HOST=<internal mysql hostname from Render>`
   - `DB_PORT=3306`
   - `DB_NAME=navshop_react`
   - `DB_USER=navshop`
   - `DB_PASS=<same MYSQL_PASSWORD>`
   - `DB_SKIP_CREATE=true`
   - `DB_CONNECT_RETRIES=60`
   - `DB_CONNECT_RETRY_MS=5000`
   - `JWT_SECRET=<strong secret>`
