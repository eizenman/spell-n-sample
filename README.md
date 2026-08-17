# spell-n-sample Project

**Welcome to spell-n-sample project**

## About

This repository contains a minimal React application that demonstrates how to integrate with the **Audiotool** authentication system.  

## Getting Started

1. **Clone** the repository  
   ```bash
   git clone <repository‑url>
   cd spell-n-sample
   ```

2. **Install dependencies**  
   ```bash
   npm install
   ```

3. **Create a local environment file** (`.env.local`) and set the required variables:

   ```dotenv
   VITE_APP_ID=your_app_id          # Your Audiotool app ID
   VITE_APP_BASE_URL=https://api.your-audiotool-app.com  # Base URL for your Audiotool backend
   VITE_FUNCTIONS_VERSION=latest    # Optional: version of the serverless functions you use
   ```

4. **Run** the development server  
   ```bash
   npm run dev
   ```

The app will be available at `http://127.0.0.1:5173`.

## Authentication

- The application uses Audiotool for user authentication.
- Sign‑in, sign‑up, password reset and OAuth flows are handled by the Audiotool SDK (`@audiotool/nexus`).

## Documentation & Support

- **Audiotool Docs** – https://docs.audiotool.com