# Git Repository Guide

## ✅ Git Repository Initialized!

The project is now under version control with an initial commit.

### Current Status

```bash
$ git log --oneline
fe14c06 Initial commit: Release Concert Calendar MVP
```

**Initial commit includes:**
- Complete backend (Node.js/Express)
- Complete frontend (Angular + Tailwind)
- All documentation files
- Example music library
- Startup scripts
- Configuration files

---

## Working with Git

### Check Status
```bash
git status
```

### Stage Changes
```bash
# Stage specific files
git add backend/server.js

# Stage all changes
git add .

# Stage by pattern
git add "*.js"
```

### Commit Changes
```bash
git commit -m "Add feature: concert data integration"
```

**Note:** If you encounter a gpg.format error, use:
```bash
GIT_CONFIG_GLOBAL=/dev/null git commit -m "Your message"
```

### View History
```bash
# Simple log
git log --oneline

# Detailed log
git log

# Graph view
git log --graph --oneline --all
```

### Create Branches
```bash
# Create and switch to new branch
git checkout -b feature/concert-integration

# Switch back to main
git checkout main

# Merge branch
git merge feature/concert-integration
```

---

## Recommended Workflow

### 1. Before Making Changes
```bash
git status                    # Check current state
git checkout -b feature/name  # Create feature branch
```

### 2. Make Your Changes
```bash
# Edit files...
# Test changes...
```

### 3. Commit Changes
```bash
git add .
git commit -m "Descriptive message about changes"
```

### 4. Merge to Main
```bash
git checkout main
git merge feature/name
```

---

## .gitignore Files

The project has `.gitignore` files to exclude:

**Root `.gitignore`:**
- `node_modules/`
- `dist/`
- `*.db`, `*.db-*`
- `.env`
- `.DS_Store`
- `.idea/`

**Backend `.gitignore`:**
- `node_modules/`
- `data/*.db`
- `.env`

**Frontend `.gitignore`:**
- `node_modules/`
- `.angular/`
- `dist/`

These files/folders won't be tracked by git.

---

## Common Git Commands

| Command | Description |
|---------|-------------|
| `git status` | See what's changed |
| `git add <file>` | Stage a file |
| `git add .` | Stage all changes |
| `git commit -m "msg"` | Commit staged changes |
| `git log` | View commit history |
| `git diff` | See unstaged changes |
| `git diff --staged` | See staged changes |
| `git checkout <file>` | Discard changes to file |
| `git reset HEAD <file>` | Unstage a file |
| `git branch` | List branches |
| `git checkout -b <name>` | Create new branch |

---

## Connecting to GitHub (Optional)

If you want to push this to GitHub:

### 1. Create GitHub Repository
- Go to github.com
- Click "New repository"
- Name it `release-concert-calendar`
- Don't initialize with README (we already have one)

### 2. Add Remote
```bash
git remote add origin https://github.com/yourusername/release-concert-calendar.git
```

### 3. Push to GitHub
```bash
git push -u origin main
```

### 4. Future Pushes
```bash
git push
```

---

## Fixing the gpg.format Error

If you see this error:
```
error: invalid value for 'gpg.format': ''
fatal: bad config variable 'gpg.format' in file '/Users/robin-klimczak-arbeit/.gitconfig' at line 7
```

**Temporary fix (per command):**
```bash
GIT_CONFIG_GLOBAL=/dev/null git <command>
```

**Permanent fix:**
```bash
# Edit your global git config
nano ~/.gitconfig

# Find and remove or fix the line:
# [gpg]
#   format = 

# Either delete the line or set it to a valid value like:
# [gpg]
#   format = openpgp
```

Or simply:
```bash
git config --global --unset gpg.format
```

---

## Best Practices

### Commit Messages
✅ Good:
```
Add Bandsintown API integration for concerts
Fix date formatting in calendar view
Update README with concert features
```

❌ Bad:
```
updates
fix
asdf
```

### Commit Frequency
- Commit after completing a feature
- Commit before major refactoring
- Commit daily if actively developing
- Don't commit broken code to main

### Branch Naming
```
feature/concert-integration
fix/date-parsing-bug
docs/api-documentation
refactor/database-service
```

---

## Summary

✅ Git is initialized  
✅ Initial commit created (fe14c06)  
✅ 64 files tracked  
✅ .gitignore configured  
✅ Ready for development  

You're all set to track changes and maintain version history!
