# Cape Town Burial Society Portal

## Install on a phone

The portal is a Progressive Web App (PWA). Once it is deployed over HTTPS, open
its web address on the phone:

- **Android:** Open the site in Chrome, then choose **Install app** or **Add to
  Home screen** from the browser menu.
- **iPhone:** Open the site in Safari, tap **Share**, then choose **Add to Home
  Screen**.

The installed app uses the CBS name and icon and opens without the browser
toolbar. Sign-in and portal data still require an internet connection to reach
the application server and its database; the service worker only caches the
app shell and static files.

## Build and serve

Install dependencies and create the production build:

```sh
npm install
npm run build
```

The build writes the app, web manifest, and service worker to `dist/`. Serve it
from the same origin as the `/api` endpoints using HTTPS in production; browsers
do not allow PWA installation from ordinary insecure HTTP sites. The existing
Express server serves `dist/` and provides the API.

For local development, run `npm run dev`; the Vite development server proxies
`/api` requests to `http://localhost:3000`.
