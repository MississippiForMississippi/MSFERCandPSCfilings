# East Mississippi FERC Filing Monitor

A static, single-page report that summarizes recent FERC eLibrary filings
relevant to ten east-central Mississippi counties. Designed to be embedded
as a Smartsheet **Web Content** widget or shared as a public link.

## Files

| Path         | Role                                                                 |
| ------------ | -------------------------------------------------------------------- |
| `index.html` | Page markup. Loads `data.js` then `app.js`.                          |
| `styles.css` | All visual styling. Earth-tone, printer-friendly.                    |
| `app.js`     | Render layer — reads `window.FERC_DATA` and paints the table & cards.|
| `data.js`    | **The data feed.** Overwrite this file from your scheduled task.     |

No backend, no build step, no cookies, no localStorage. Open `index.html`
directly in a browser, or host the four files anywhere static.

## Updating rows from a scheduled task

The whole report is driven by a single global object `window.FERC_DATA`
defined in `data.js`. To publish new results, **overwrite `data.js`** with
the same shape:

```js
window.FERC_DATA = {
  last_checked: "2025-01-15T08:00:00-06:00",   // ISO 8601 with TZ offset
  check_status: "ok",                          // "ok" | "error" | "no_results"
  since_last_check: 2,                         // count of new filings since previous run
  rows: [
    {
      is_new: true,                                    // amber row + "New" pill
      filed_date: "2025-01-14",                        // YYYY-MM-DD
      accession: "20250114-5037",
      docket: "ER25-1234-000",
      filer: "Entergy Mississippi, LLC",
      filing: "Application for transmission interconnection — Lauderdale County substation expansion.",
      counties: ["Lauderdale"],                        // proper-case county names
      keywords: ["substation expansion", "transmission upgrades"],
      deadline: "2025-02-13",                          // YYYY-MM-DD or null
      deadline_type: "Comment",                        // "Comment" | "Intervention" | "Protest" | ""
      link: "https://elibrary.ferc.gov/eLibrary/filelist?accession_number=20250114-5037"
    }
  ]
};
```

Field notes:

- `link` — if omitted, the report auto-generates an eLibrary URL from `accession`.
- `is_new` — set `true` for filings that appeared in this run but not the previous one.
- `deadline` — when within 14 days, the cell renders in alert (rust) color.
- Rows are rendered in the order provided. Sort newest first before writing.
- Empty state: write `rows: []` (the page shows the seeded "no relevant
  new filings" row automatically).

The simplest implementation in a cron job:

1. Run the eLibrary check.
2. Build the JS literal above.
3. Write it to `data.js`, prefixed with the same header comment.
4. Re-publish the four files to the same hosting location.

## Deployment

Static. Recommended path: deploy the project directory
`/home/user/workspace/ferc-filing-monitor` with `deploy_website` (entry
point `index.html`). Re-deploying the same path replaces the files in
place — the URL stays stable, so the Smartsheet widget keeps working.

For Smartsheet:

1. Deploy and copy the public URL.
2. In your sheet, add a **Web Content** widget and paste the URL.
3. The page is responsive and printer-friendly; no further config needed.

## Privacy / sandbox notes

- No `localStorage`, `sessionStorage`, `indexedDB`, or cookies.
- No analytics, no tracking pixels.
- Only outbound link target is FERC eLibrary itself.

## Source

All data is drawn from the public [FERC eLibrary](https://elibrary.ferc.gov/eLibrary/search).
This project links every row back to the official record. Always confirm
details against the original filing before acting.
