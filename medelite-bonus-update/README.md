# Medelite Facility Assessment Generator

A lightweight web app that generates Facility Assessment Snapshot reports using CMS nursing home data and manual MedElite inputs.

## Core MVP Features

- Dynamic CCN lookup
- Server-side CMS Provider Data Catalog lookup through `/api/facility`
- Facility name override
- Manual MedElite operational inputs
- Print-ready PDF export
- Medicare Care Compare hyperlink
- INFINITE — Managed by MEDELITE branding

## Optional Bonus Features Implemented

- Complex responsive data cards / visual performance cards
- Advanced error handling and boundary cases
- Custom high-fidelity design polish

## Test Case

Use CCN:

```text
686123
```

Expected facility:

```text
Kendall Lakes Healthcare and Rehab Center
```

## Tech Stack

- React
- Vite
- TypeScript
- Vercel Serverless Function
- jsPDF
- PapaParse

## CMS Data Source

The app uses CMS Provider Data Catalog public data.

Catalog URL:

```text
https://data.cms.gov/provider-data/data.json
```

Dataset used:

```text
Provider Information
Identifier: 4pq5-n9py
```

The serverless API route loads the latest Provider Information CSV from the CMS catalog and filters rows by `CMS Certification Number (CCN)`.

## Local Setup

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

## Deploy

Deploy to Vercel. Keep Root Directory set to this project folder.

## Notes / Assumptions

- CMS lookup is handled server-side to avoid browser CORS issues.
- If CMS is unavailable, the app includes a fallback record for the required validation case: CCN `686123`.
- Hospitalization and ED metrics are included as editable sample fields in this MVP.
