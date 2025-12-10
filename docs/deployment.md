# Deployment Guide

This guide details how to deploy the **Office Maintenance Tracker** to Vercel and Google Cloud Run.

---

## 1. Deploy to Vercel (via GitHub)

Vercel is the easiest way to deploy this React application.

### Steps
1.  **Push to GitHub:** Ensure your project is pushed to a GitHub repository.
2.  **Login to Vercel:** Go to [vercel.com](https://vercel.com) and sign in.
3.  **Add New Project:** Click **"Add New..."** > **"Project"**.
4.  **Import Repository:** Select your GitHub repository for this app.
5.  **Configure Build:**
    Vercel should automatically detect the framework. Confirm these settings:
    *   **Framework Preset:** `Vite`
    *   **Root Directory:** `./`
    *   **Build Command:** `npm run build`
    *   **Output Directory:** `dist`
6.  **Deploy:** Click **"Deploy"**.

---

## 2. Deploy to Google Cloud Run

To deploy to Cloud Run, we use a Docker container. The necessary configuration files (`Dockerfile`, `nginx.conf`, `.dockerignore`) have been added to the project root.

### Prerequisites
*   [Google Cloud SDK (gcloud)](https://cloud.google.com/sdk/docs/install) installed and authenticated.
*   A Google Cloud Project created.

### Configuration Files Overview
*   **Dockerfile:** Builds the React app and sets up an Nginx server.
*   **nginx.conf:** Configures Nginx to serve the Single Page Application (SPA) correctly, handling routing.

### Deployment Steps

1.  **Open Terminal** in your project root.

2.  **Set your Project ID:**
    Replace `[YOUR_PROJECT_ID]` with your actual GCP project ID.
    ```bash
    gcloud config set project [YOUR_PROJECT_ID]
    ```

3.  **Build the Container Image:**
    This sends your code to Cloud Build, which builds the Docker image and stores it in the Container Registry.
    ```bash
    gcloud builds submit --tag gcr.io/[YOUR_PROJECT_ID]/maintenance-tracker
    ```

4.  **Deploy to Cloud Run:**
    This spins up the service.
    ```bash
    gcloud run deploy maintenance-tracker \
      --image gcr.io/[YOUR_PROJECT_ID]/maintenance-tracker \
      --platform managed \
      --region us-central1 \
      --allow-unauthenticated
    ```

    *   `--allow-unauthenticated`: Makes the website public.
    *   `--region`: Selects the data center (e.g., `us-central1`, `europe-west1`).

5.  **Access App:**
    The command will output a **Service URL** (e.g., `https://maintenance-tracker-xyz-uc.a.run.app`). Click it to view your deployed app.
