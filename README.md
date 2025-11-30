# PAS Membership App

A membership management platform for Pisgah Area SORBA built with modern web technologies.

## Project Overview

This is the custom development repository for the PAS (Pisgah Area SORBA) Membership App. The initial UI design was created using [Lovable.dev](https://lovable.dev), and we've extended it with custom authentication (Clerk.dev) and membership management features.

**Repository**: https://github.com/liesto/pas-membership-app
**Original Lovable Project**: https://github.com/liesto/member-connect-hub

## How can I edit this code?

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## Environment Setup

Create a `.env.local` file in the project root with the following variables:

```
VITE_CLERK_PUBLISHABLE_KEY=your_clerk_key_here
```

The `.env.local` file is not tracked by git (see `.gitignore`) and should never be committed.

## How can I deploy this project?

This project is designed to be deployed to Netlify. Push to the `main` branch and Netlify will automatically build and deploy.

### Required Environment Variables for Deployment

Set these in your Netlify environment variables:
- `VITE_CLERK_PUBLISHABLE_KEY` - Your Clerk.dev publishable key
