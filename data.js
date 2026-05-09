/*
 * FERC Filing Monitor — data feed
 * ----------------------------------------------------------------------------
 * This file is the single source of data for the static report at index.html.
 * A scheduled task (cron, GitHub Action, etc.) should overwrite this file with
 * fresh content after each FERC eLibrary check. Keep the variable name and
 * shape exactly as below — index.html reads `window.FERC_DATA`.
 *
 * Shape:
 *   window.FERC_DATA = {
 *     last_checked: "2025-01-15T08:00:00-06:00", // ISO 8601 with TZ
 *     check_status: "ok" | "error" | "no_results",
 *     since_last_check: 0, // count of new filings since previous run
 *     rows: [
 *       {
 *         is_new: true,                    // shows "new" pill
 *         filed_date: "2025-01-14",        // YYYY-MM-DD
 *         accession: "20250114-5037",
 *         docket: "ER25-1234-000",
 *         filer: "Entergy Mississippi, LLC",
 *         filing: "Application for transmission interconnection — Lauderdale County substation expansion",
 *         counties: ["Lauderdale"],        // matched counties (proper case)
 *         keywords: ["substation expansion", "transmission upgrades"],
 *         deadline: "2025-02-13",          // YYYY-MM-DD or null
 *         deadline_type: "Comment",        // "Comment", "Intervention", "Protest", or ""
 *         link: "https://elibrary.ferc.gov/eLibrary/filelist?accession_number=20250114-5037"
 *       }
 *     ]
 *   };
 *
 * Empty state: leave `rows: []` and the report will display the seeded
 * "No relevant new filings captured yet" row automatically.
 */

window.FERC_DATA = {
  last_checked: null,
  check_status: "no_results",
  since_last_check: 0,
  rows: []
};
