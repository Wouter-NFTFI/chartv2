# Deploying to Cloudflare Pages

This document outlines the steps to deploy the React application to Cloudflare Pages.

## Prerequisites

1. A Cloudflare account (sign up at https://dash.cloudflare.com/sign-up)
2. Node.js installed locally
3. Wrangler CLI installed (already included in the project dependencies)

## Local Development with Cloudflare

To test your application locally with Cloudflare Pages:

1. Build your application:
   ```
   npm run build
   ```

2. Start the local development server with Wrangler:
   ```
   npm run pages:dev
   ```

## Deployment Process

There are two ways to deploy to Cloudflare Pages:

### Option 1: Manual Deployment using Wrangler

1. Log in to your Cloudflare account through Wrangler:
   ```
   npx wrangler login
   ```

2. Deploy your application:
   ```
   npm run pages:deploy
   ```

### Option 2: GitHub Integration (Continuous Deployment)

1. Push your code to a GitHub repository

2. Log in to the Cloudflare dashboard

3. Go to Pages > Create a project

4. Select your GitHub repository and follow the setup steps:
   - Set the build command to: `npm run build`
   - Set the build output directory to: `dist`
   - Configure environment variables if needed

5. Click "Save and Deploy"

## Custom Domains

After deployment, you can configure a custom domain:

1. Go to your Cloudflare Pages project
2. Click on "Custom domains"
3. Follow the instructions to add your domain

## Environment Variables

To set environment variables for your deployment:

1. Go to your Cloudflare Pages project
2. Navigate to Settings > Environment variables
3. Add your environment variables

## Troubleshooting

- If you encounter issues with the build, check the build logs in the Cloudflare dashboard
- Make sure your build produces output in the `dist` directory
- Verify that your project has the correct dependencies installed 