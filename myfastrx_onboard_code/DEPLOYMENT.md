# Deployment Guide

This application is built with Vite and React Router. Follow these steps to deploy to your server.

## Build the Application

Run the build command to create production files:

```bash
npm run build
```

This will create a `dist` folder with all the production files.

## Server Configuration

Since this app uses React Router with client-side routing, you need to configure your server to handle the `/onboard` route and other routes properly.

### For Apache (.htaccess)

The `.htaccess` file is already included in the project. Make sure:
1. The `.htaccess` file is in your `dist` folder
2. Apache has `mod_rewrite` enabled
3. AllowOverride is set to All in your Apache config

### For Nginx

Use the `nginx.conf` example provided. Key points:
- Set `root` to your `dist` folder path
- The `try_files $uri $uri/ /index.html;` directive handles client-side routing

### For Vercel/Netlify

The `vercel.json` file is already included. These platforms handle SPA routing automatically.

## Deployment Steps

1. **Build the application:**
   ```bash
   npm run build
   ```

2. **Upload the `dist` folder** to your server

3. **Configure your web server** to:
   - Serve files from the `dist` folder
   - Handle client-side routing (see server configs above)

4. **Access your application:**
   - Main page: `https://domain.com/`
   - Onboard page: `https://domain.com/onboard`

## Important Notes

- The application uses client-side routing, so all routes must be handled by serving `index.html`
- Make sure your server is configured to handle the `/onboard` route correctly
- The build output is in the `dist` folder - upload this entire folder to your server
