# Job Application Dashboard

A lightweight static dashboard for tracking robotics/software engineering job opportunities and application progress.

> Screenshot placeholder: add a screenshot to `assets/screenshot.png` and update this section.

## Features

- Dynamic data loading from `data/jobs.json`
- Summary cards (Tracked Jobs, Not Applied, Active Applications, Interviews, Offers)
- Interactive job table with:
  - Search
  - Filters (status, priority, availability, company, location, tag)
  - Sorting
- Job detail modal with:
  - Metadata
  - Documents
  - Contacts
  - Timeline
  - Notes
- Leaflet + OpenStreetMap map with marker popups
- Filter synchronization between table, summary cards, and map
- Graceful handling of missing optional fields

## Architecture

The app is fully static and GitHub Pages compatible.

- **Data layer**: `data/jobs.json`
- **Schema documentation**: `data/jobs.schema.json`
- **Application logic**: `js/*.js`
- **Presentation**: `index.html`
- **Styling**: `css/style.css`

## Repository Structure

```
job-dashboard/
├── index.html
├── README.md
├── data/
│   ├── jobs.json
│   └── jobs.schema.json
├── js/
│   ├── app.js
│   ├── jobs.js
│   ├── filters.js
│   └── map.js
├── css/
│   └── style.css
└── assets/
```

## Local Development

Because this project uses browser `fetch`, run it from a local web server.

### Option 1: Python

```bash
python3 -m http.server 8080
```

Then open <http://localhost:8080>.

### Option 2: VS Code Live Server

Open the repository and start Live Server.

## GitHub Pages Deployment

1. Push to GitHub.
2. Go to repository **Settings → Pages**.
3. Set source to **Deploy from a branch**.
4. Select branch (for example `main`) and root folder (`/`).
5. Save.

## jobs.json Documentation

`data/jobs.json` must be an array of job objects.

Required core fields:

- `id` (string)
- `company` (string)
- `position` (string)
- `priority` (`high|medium|low`)
- `status` (`interested|preparing|applied|hr_screen|technical_interview|final_interview|offer|rejected|withdrawn|closed`)
- `availability` (`available|unknown|closed`)
- `lastUpdate` (date string)

Optional fields include location, links, dates, documents, contacts, timeline, notes, and tags.

See `data/jobs.schema.json` for the full documented schema.

## Editing Data

Update `data/jobs.json` manually.

### 1) Add a job

Add a new object to the jobs array with a unique `id`.

### 2) Update application status

Change `status` to one of the supported stage values.

### 3) Add timeline events

Append objects to `timeline`:

```json
{
  "date": "2026-08-25",
  "type": "note",
  "description": "Application preparation started."
}
```

### 4) Add documents

Append objects to `documents`:

```json
{
  "type": "cv",
  "name": "CV",
  "submitted": true,
  "version": "2026-08",
  "url": null
}
```

### 5) Add contacts

Append objects to `contacts`:

```json
{
  "name": "Recruiter Name",
  "role": "Recruiter",
  "relation": "Application contact"
}
```

### 6) Change priority

Set `priority` to `high`, `medium`, or `low`.

### 7) Mark a job as closed

Set `availability` to `closed`.

### 8) Add map coordinates

Set location coordinates:

```json
"location": {
  "city": "Vienna",
  "country": "Austria",
  "latitude": 48.2082,
  "longitude": 16.3738
}
```

Jobs without coordinates still appear in all non-map views.

## Privacy Warning

Do **not** commit sensitive information to this repository.

Do not include private phone numbers, private email conversations, confidential references, contracts, or private documents. Keep document URLs optional and store only metadata when needed.

## Future Development Ideas

- Optional JSON editing helper UI (still static)
- GitHub API-assisted workflow for data updates
- Automated availability monitoring via GitHub Actions with safe states:
  - `reachable`
  - `possibly_closed`
  - `closed`
  - `check_failed`
- Additional analytics (response rates, average stage duration)
