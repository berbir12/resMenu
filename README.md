# Table Scan System

A web application for restaurant table management, built with Vite, React, TypeScript, shadcn-ui, and Tailwind CSS.

## Getting Started

### Prerequisites

- Node.js (v18 or higher recommended)
- npm (comes with Node.js)

### Installation

Clone the repository and install dependencies:

```sh
# Clone the repository
git clone <YOUR_GIT_URL>

# Navigate to the project directory
cd table-scan-system

# Install dependencies
npm install
```

### Running the Development Server

Start the app locally:

```sh
npm run dev
```

Open your browser and go to the local URL shown in the terminal (usually http://localhost:5173).

## Project Structure

- `src/` — Main source code
  - `components/` — React components
  - `pages/` — Page components
  - `hooks/` — Custom React hooks
  - `integrations/` — External integrations (e.g., Supabase)
  - `lib/` — Utility functions
  - `assets/` — Images and static assets
- `public/` — Static files (e.g., favicon)

## Technologies Used

- Vite
- React
- TypeScript
- shadcn-ui
- Tailwind CSS

## Deployment

You can deploy this app to any static hosting service (e.g., Netlify, GitHub Pages). Build the app with:

```sh
npm run build
```

Then follow your hosting provider's instructions to deploy the contents of the `dist/` folder.

## Custom Domain

To use a custom domain, refer to your hosting provider's documentation for domain setup.

## License

This project is open source. Feel free to modify and use it for your own restaurant or table management needs.
