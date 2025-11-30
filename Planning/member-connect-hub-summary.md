# Member Connect Hub - Project Summary

## Overview
A membership enrollment web application for Pisgah Area SORBA, a mountain biking trail advocacy organization.

## Tech Stack
- **Frontend:** React + TypeScript
- **Styling:** Tailwind CSS
- **Components:** shadcn-ui
- **Build:** Vite
- **Forms:** React Hook Form + Zod validation
- **Routing:** React Router
- **Notifications:** Sonner (toast)

## Pages

### 1. **Index** (`/`)
- Hero section with call-to-action
- Mission statement
- Three membership tier cards (Bronze, Silver, Gold)
- Annual/Monthly payment toggle
- Shows pricing savings for annual plans

### 2. **Signup** (`/signup`)
- Membership registration form
- Payment frequency selector
- Personal information section (name, email, phone, address)
- Payment information (card details)
- Email opt-in checkbox
- Form validation with Zod schemas
- Displays total price at bottom

### 3. **Confirmation** (`/confirmation`)
- Success page after signup
- Shows membership receipt with transaction details
- Displays member benefits list
- Link back to home page

## Membership Tiers
- **Bronze:** $50/yr or $5/mo
- **Silver:** $100/yr or $10/mo (featured tier)
- **Gold:** $250/yr or $25/mo

## Key Features
- Responsive design (mobile-friendly)
- Form validation with error messages
- Toast notifications for user feedback
- URL parameters to pass selected tier through flow
- Clean, modern UI with gradients and animations
