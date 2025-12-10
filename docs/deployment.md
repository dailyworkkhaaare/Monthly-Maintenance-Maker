# Deployment Guide

This guide covers how to deploy the **Office Maintenance Tracker** application using two popular methods: **Google Cloud Run** and **Vercel**.

Since this is a React Single Page Application (SPA) built with Vite, the deployment strategy generally involves building the static assets and serving them.

---

## Option 1: Vercel via GitHub (Recommended)

Vercel is optimized for frontend frameworks and offers the simplest deployment process for this type of application.

### Prerequisites
*   A [GitHub](https://github.com/) account.
*   A [Vercel](https://vercel.com/) account.
*   Your project code pushed to a GitHub repository.

### Steps

1.  **Push to GitHub:**
    Ensure your latest code (including `index.html`, `package.json`, etc.) is committed and pushed to your repository.

2.  **Import Project in Vercel:**
    *   Log in to your Vercel dashboard.
    *   Click **"Add New..."** -> **"Project"**.
    *   Select "Import" next to your GitHub repository.

3.  **Configure Project:**
    Vercel should automatically detect that this is a **Vite** project. Verify the following settings in the "Configure Project" screen:
    *   **Framework Preset:** `Vite`
    *   **Root Directory:** `./` (default)
    *   **Build Command:** `npm run build` (or `vite build`)
    *   **Output Directory:** `dist`

    *Note: If your project is missing a `package.json` with a build script, you may need to add one. Ensure your `package.json` looks similar to this:*
    ```json
    {
      "name": "office-maintenance-tracker",
      "version": "0.0.0",
      "scripts": {
        "dev": "vite",
        "build": "tsc && vite build",
        "preview": "vite preview"
      },
      "dependencies": {
        "react": "^18.2.0",
        "react-dom": "^18.2.0",
        "lucide-react": "^0.292.0"
      },
      "devDependencies": {
        "@types/react": "^18.2.37",
        "@types/react-dom": "^18.2.15",
        "@vitejs/plugin-react": "^4.2.0",
        "typescript": "^5.2.2",
        "vite": "^5.0.0"
      }
    }
    ```

4.  **Deploy:**
    Click **"Deploy"**. Vercel will install dependencies, build your project, and assign a live URL.

---

## Option 2: Google Cloud Run

Cloud Run is a managed compute platform that runs containers. To deploy a static React app on Cloud Run, you need to wrap it in a Docker container that includes a web server (like Nginx) to serve the files.

### Prerequisites
*   [Google Cloud Platform (GCP)](https://console.cloud.google.com/) account and project.
*   [gcloud CLI](https://cloud.google.com/sdk/docs/install) installed.
*   Docker installed locally (optional, but good for testing).

### 1. Create Configuration Files

Create the following two files in your project root to handle the containerization.

**`Dockerfile`**
```dockerfile
# Stage 1: Build the application
FROM node:18-alpine as builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Stage 2: Serve with Nginx
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
# Copy custom nginx config to handle React Router (SPA)
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 8080
CMD ["nginx", "-g", "daemon off;"]
```

**`nginx.conf`**
```nginx
server {
    listen 8080;
    server_name localhost;

    location / {
        root /usr/share/nginx/html;
        index index.html index.htm;
        # This is critical for SPAs: if a file isn't found, serve index.html
        try_files $uri $uri/ /index.html;
    }

    error_page 500 502 503 504 /50x.html;
    location = /50x.html {
        root /usr/share/nginx/html;
    }
}
```

### 2. Build and Submit the Image

Run the following commands in your terminal:

```bash
# 1. Login to Google Cloud
gcloud auth login

# 2. Set your project ID
gcloud config set project [YOUR_PROJECT_ID]

# 3. Enable required services
gcloud services enable cloudbuild.googleapis.com run.googleapis.com

# 4. Build the image using Cloud Build
gcloud builds submit --tag gcr.io/[YOUR_PROJECT_ID]/office-maintenance-tracker
```

### 3. Deploy to Cloud Run

Once the build is complete, deploy the service:

```bash
gcloud run deploy office-maintenance-tracker \
  --image gcr.io/[YOUR_PROJECT_ID]/office-maintenance-tracker \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated
```

*   **--allow-unauthenticated:** Makes the app accessible to the public internet.
*   **--region:** Choose a region close to your users.

After a successful deployment, the command line will output a `Service URL` where your app is live.
