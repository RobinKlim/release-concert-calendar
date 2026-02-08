# 🚀 Start Here - Release Concert Calendar

## Quick Start (First Time Setup)

> **Note:** This has already been done for you! Just run the servers.

### 1. Install Backend Dependencies (if needed)
```bash
cd backend
npm install
cd ..
```

### 2. Install Frontend Dependencies (if needed)
```bash
cd frontend
npm install
cd ..
```

**All dependencies are now installed and configured!**

## Running the App

You need **TWO terminal windows**:

### Terminal 1 - Start Backend
```bash
cd backend
npm start
```

**Wait for:** `Server running on http://localhost:3000`

### Terminal 2 - Start Frontend
```bash
cd frontend
npm start
```

**Wait for:** `Angular Live Development Server is listening on localhost:4200`

Then open your browser to: **http://localhost:4200**

---

## Using the App

### Step 1: Scan Your Music Library
1. Enter the **absolute path** to your music folder
   - Example: `/Users/yourname/Music`
2. Click **"Scan Library"**
3. Wait for the scan to complete
4. You'll see your artists displayed

### Step 2: Fetch Releases
1. Click **"Fetch Releases"**
2. Wait (this takes ~1 second per artist)
3. Releases will appear in the calendar

### Step 3: Explore
- Switch between **Calendar View** and **List View**
- See upcoming releases highlighted in **green**
- Browse releases by date

---

## Important Notes

✅ Your music files **must be tagged** with MusicBrainz Picard  
✅ Use **absolute paths** (not relative like `~/Music`)  
✅ Backend must be running before frontend  
✅ Be patient when fetching releases (API rate limits)

## Troubleshooting

**Frontend won't start?**
- Make sure backend is running first
- Check that port 4200 is available
- Try `pkill -f "ng serve"` then restart

**Backend won't start?**
- Check that port 3000 is available
- Make sure you ran `npm install` in the backend folder

**No artists found?**
- Verify your music is tagged with MusicBrainz Picard
- Double-check the path is absolute and correct
- Make sure files are .mp3, .flac, .m4a, etc.

---

## Project Structure

```
📦 release-concert-calendar
├── 📁 backend/          ← Node.js API server
├── 📁 frontend/         ← Angular UI
├── 📁 music-library/    ← Your test music
└── 📄 README.md         ← Full documentation
```

---

## Next Steps

Once you have the app running:
1. Scan your actual music library
2. Fetch releases for your artists
3. Enjoy tracking upcoming releases!

For more details, see **README.md** and **QUICKSTART.md**
