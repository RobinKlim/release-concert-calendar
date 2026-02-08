# Quick Start Guide

## Prerequisites

- Node.js v18+ installed
- Music files tagged with MusicBrainz Picard

## Installation

### 1. Install Backend

```bash
cd backend
npm install
```

### 2. Install Frontend

```bash
cd frontend
npm install
```

## Running the App

### Option 1: Use the start scripts

Open two terminal windows:

**Terminal 1 - Backend:**
```bash
./start-backend.sh
```

**Terminal 2 - Frontend:**
```bash
./start-frontend.sh
```

### Option 2: Manual start

**Terminal 1 - Backend:**
```bash
cd backend
npm start
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm start
```

## Access the App

Open your browser and go to: **http://localhost:4200**

## First Time Setup

1. In the app, enter the **absolute path** to your music library
   - Example: `/Users/yourname/Music`
   - Or use the included test library: `/Users/robin-klimczak-arbeit/private-projects/release-concert-calendar/music-library`

2. Click **"Scan Library"**
   - The app will scan your music files
   - It will extract MusicBrainz artist IDs from file tags
   - Found artists will be displayed

3. Click **"Fetch Releases"**
   - The app will fetch release data from MusicBrainz
   - This may take a few minutes depending on the number of artists
   - Releases will appear in the calendar

## Using the App

- **Simple list view**: All releases in chronological order
- **Upcoming releases** are highlighted in green
- Each release shows:
  - Title
  - Artist name
  - Release type (Album, Single, EP, etc.)
  - Release date

## Troubleshooting

### Backend won't start
- Make sure port 3000 is not in use
- Check if Node.js is installed: `node --version`

### Frontend won't start
- Make sure port 4200 is not in use
- Check if Angular dependencies are installed

### No artists found
- Make sure your music files are tagged with MusicBrainz Picard
- Check that the MusicBrainz Artist ID tag is present
- Verify the path to your music library is correct and absolute

### No releases found
- Make sure you clicked "Fetch Releases" after scanning
- Check your internet connection (needed for MusicBrainz API)
- Be patient - fetching releases for many artists takes time (1 request per second due to API rate limits)

## Data Storage

- **Artists**: Stored in `backend/data/artists.json`
- **Releases**: Stored in `backend/data/releases.json`

You can delete these files to reset the app.

## Next Steps

The MVP is complete! Future enhancements could include:
- Concert data from Bandsintown
- Notifications for new releases
- Favorite artists
- Filter by location for concerts
- Export calendar to ICS format
