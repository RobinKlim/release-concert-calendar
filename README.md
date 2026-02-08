# Release Concert Calendar

A local web application that tracks upcoming releases from artists in your music library.

## Features

- 📁 Scan local music library for MusicBrainz-tagged files
- 🎵 Automatically detect artists from your music collection
- 📅 Fetch upcoming releases from MusicBrainz API
- 🎨 Clean, simple UI built with Angular and Tailwind CSS
- 💾 Local JSON storage for caching

## Architecture

### Backend (Node.js + Express)
- Scans music files and extracts MusicBrainz Artist IDs
- Fetches release data from MusicBrainz API
- Caches data in SQLite database
- Provides REST API for frontend

### Frontend (Angular + Tailwind)
- Clean, responsive UI
- Simple list view for releases
- Artist management
- Directory scanning interface

## Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Music files tagged with MusicBrainz Picard

## Setup

### 1. Install Backend Dependencies

```bash
cd backend
npm install
```

### 2. Install Frontend Dependencies

```bash
cd frontend
npm install
```

## Running the Application

### 1. Start the Backend Server

```bash
cd backend
npm start
```

The backend will run on `http://localhost:3000`

### 2. Start the Frontend Development Server

```bash
cd frontend
npm start
```

The frontend will run on `http://localhost:4200`

### 3. Open the Application

Open your browser and navigate to `http://localhost:4200`

## Usage

1. **Scan Your Music Library**
   - Enter the absolute path to your music library (e.g., `/Users/robin-klimczak-arbeit/private-projects/release-concert-calendar/music-library`)
   - Click "Scan Library"
   - The app will find all artists with MusicBrainz IDs

2. **Fetch Releases**
   - Click "Fetch Releases" to get release data from MusicBrainz
   - The app will fetch upcoming and recent releases for all your artists
   - This may take a few minutes depending on the number of artists

3. **View Releases**
   - See all releases in a simple list view
   - Upcoming releases are highlighted with a green badge
   - Sorted chronologically

## API Endpoints

### Artists
- `GET /api/artists` - Get all artists
- `GET /api/artists/:mbid` - Get specific artist

### Scanning
- `POST /api/scan` - Scan a directory for music files
  - Body: `{ "path": "/path/to/music" }`

### Releases
- `GET /api/releases` - Get all releases
- `GET /api/releases/upcoming` - Get only upcoming releases
- `GET /api/releases/artist/:mbid` - Get releases for specific artist
- `POST /api/releases/fetch` - Fetch releases from MusicBrainz
  - Body: `{ "artistMbid": "optional-mbid" }` (omit for all artists)

## Data Sources

- **MusicBrainz**: Open music encyclopedia providing artist and release information

## Future Enhancements

- 🎭 Concert data from Bandsintown API
- 🔔 Notifications for new releases
- ⭐ Favorite artists
- 🗺️ Concert filtering by location
- 📊 Statistics and insights

## Tech Stack

- **Backend**: Node.js, Express, SQLite, music-metadata, axios
- **Frontend**: Angular 21, Tailwind CSS
- **APIs**: MusicBrainz

## License

MIT
