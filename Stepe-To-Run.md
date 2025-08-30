Step 1: Navigate to the mobile-app directory
```bash
cd mobile-app
```

### Step 2: Install Dependencies
```bash
npm install
```

### Step 3: Set up Environment Variables
Create a `.env.local` file in the `mobile-app` folder:
```bash
# Create the environment file
New-Item -Path ".env.local" -ItemType File

# Add your Google AI API key (you'll need to edit this file manually)
# Add this line to .env.local:
# GEMINI_API_KEY=your_actual_api_key_here
```

### Step 4: Run the Development Server
```bash
npm run dev
```

## Alternative: Run Without AI Features

If you don't have the Google AI API key and want to run just the Next.js part:

### Option 1: Build and Start Production Mode
```bash
npm run build
npm run start
```

### Option 2: Modify the dev script temporarily
Edit `package.json` in the `mobile-app` folder and change the dev script from:
```json
"dev": "npm run genkit:dev & next dev --turbopack -p 9002"
```
to:
```json
"dev": "next dev --turbopack -p 9002"
```

## What Each Command Does

- **`npm install`** - Installs all required dependencies
- **`npm run dev`** - Starts both Next.js dev server and Genkit AI server
- **`npm run build`** - Creates production build
- **`npm run start`** - Runs production server

## Access the App

Once running successfully:
- **Main app**: http://localhost:9002
- **Genkit AI server**: http://localhost:4000 (if running with AI features)

## Troubleshooting

If you still get permission errors:
1. Close any editors or terminals that might be using the files
2. Try running PowerShell as Administrator
3. Check if any processes are locking the files

## Current Project Structure

Your project now has:
- `mobile-app/` - Contains your Next.js app files
- `admin-dashboard/` - For admin features
- `docs/` - Documentation
- Git repository properly configured

The main entry point will be in `mobile-app/src/app/page.tsx` once you get it running.

Would you like me to help you with any specific part of the setup or troubleshooting?
