/* =============================================================
 * FERC Filing Monitor — render layer
 * Reads window.FERC_DATA (set by data.js) and renders the report.
 * No localStorage / sessionStorage / cookies. No network calls.
 * ============================================================= */
(function () {
  "use strict";

  var WATCHED_COUNTIES = 82;
  var MISSISSIPPI_COUNTIES = [
    "Adams","Alcorn","Amite","Attala","Benton","Bolivar","Calhoun","Carroll",
    "Chickasaw","Choctaw","Claiborne","Clarke","Clay","Coahoma","Copiah",
    "Covington","DeSoto","Forrest","Franklin","George","Greene","Grenada",
    "Hancock","Harrison","Hinds","Holmes","Humphreys","Issaquena","Itawamba",
    "Jackson","Jasper","Jefferson","Jefferson Davis","Jones","Kemper",
    "Lafayette","Lamar","Lauderdale","Lawrence","Leake","Lee","Leflore",
    "Lincoln","Lowndes","Madison","Marion","Marshall","Monroe","Montgomery",
    "Neshoba","Newton","Noxubee","Oktibbeha","Panola","Pearl River","Perry",
    "Pike","Pontotoc","Prentiss","Quitman","Rankin","Scott","Sharkey",
    "Simpson","Smith","Stone","Sunflower","Tallahatchie","Tate","Tippah",
    "Tishomingo","Tunica","Union","Walthall","Warren","Washington","Wayne",
    "Webster","Wilkinson","Winston","Yalobusha","Yazoo"
  ];

  /* ---------- helpers ---------- */
  function $(id) { return document.getElementById(id); }

  function escapeHtml(s) {
    if (s === null || s === undefined) return "";
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function isSafeHttpUrl(u) {
    if (!u || typeof u !== "string") return false;
    return /^https?:\/\//i.test(u);
  }

  function formatDate(iso) {
    // Accept "YYYY-MM-DD" or full ISO; render as "Mon DD, YYYY".
    if (!iso) return "";
    var d;
    if (/^\d{4}-\d{2}-\d{2}$/.test(iso)) {
      var p = iso.split("-");
      d = new Date(Date.UTC(+p[0], +p[1] - 1, +p[2]));
    } else {
      d = new Date(iso);
    }
    if (isNaN(d.getTime())) return iso;
    var months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    var day = d.getUTCDate();
    return months[d.getUTCMonth()] + " " + day + ", " + d.getUTCFullYear();
  }

  function formatCheckedTimestamp(iso) {
    if (!iso) return { primary: "—", sub: "Awaiting first run" };
    var d = new Date(iso);
    if (isNaN(d.getTime())) return { primary: iso, sub: "" };
    var months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    var hh = d.getHours();
    var mm = d.getMinutes();
    var ampm = hh >= 12 ? "PM" : "AM";
    var hh12 = ((hh + 11) % 12) + 1;
    var mmStr = mm < 10 ? "0" + mm : "" + mm;
    var primary = months[d.getMonth()] + " " + d.getDate() + ", " + d.getFullYear();
    var sub = hh12 + ":" + mmStr + " " + ampm + " local";
    return { primary: primary, sub: sub };
  }

  function daysUntil(iso) {
    if (!iso) return null;
    var d;
    if (/^\d{4}-\d{2}-\d{2}$/.test(iso)) {
      var p = iso.split("-");
      d = new Date(Date.UTC(+p[0], +p[1] - 1, +p[2]));
    } else {
      d = new Date(iso);
    }
    if (isNaN(d.getTime())) return null;
    var now = new Date();
    var nowUtc = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
    return Math.round((d.getTime() - nowUtc) / 86400000);
  }

  function filingUrl(row) {
    return row && row.accession
      ? "https://elibrary.ferc.gov/eLibrary/filelist?accession_num=" + encodeURIComponent(row.accession)
      : (row && isSafeHttpUrl(row.link) ? row.link : null);
  }

  function publicCommentUrl() {
    return "https://ferconline.ferc.gov/quickcomment.aspx";
  }

  /* ---------- render ---------- */
  function emptyRowHtml(selectedCounty) {
    var title = selectedCounty
      ? "No filings currently tagged to " + selectedCounty + " County"
      : "No relevant new filings captured yet";
    var hint = selectedCounty
      ? "Try “All Mississippi filings” to review statewide or county-unspecified filings."
      : "The next automatic check will update this report.";
    return ''
      + '<tr class="empty-row"><td colspan="8">'
      + '<span class="empty-row__inner">'
      +   '<svg class="empty-row__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true">'
      +     '<rect x="3.5" y="4.5" width="17" height="15" rx="1.5"/>'
      +     '<line x1="3.5" y1="9" x2="20.5" y2="9"/>'
      +     '<line x1="8" y1="13" x2="16" y2="13"/>'
      +     '<line x1="8" y1="16" x2="14" y2="16"/>'
      +   '</svg>'
      +   '<span class="empty-row__title">' + escapeHtml(title) + '</span>'
      +   '<span class="empty-row__hint">' + escapeHtml(hint) + '</span>'
      + '</span>'
      + '</td></tr>';
  }

  function renderTagStack(counties, keywords) {
    var parts = [];
    (counties || []).forEach(function (c) {
      parts.push('<span class="tag tag--county">' + escapeHtml(c) + '</span>');
    });
    (keywords || []).forEach(function (k) {
      parts.push('<span class="tag">' + escapeHtml(k) + '</span>');
    });
    if (!parts.length) return '<span class="tag">—</span>';
    return '<div class="tag-stack">' + parts.join("") + '</div>';
  }

  function renderDeadlineCell(row) {
    if (!row.deadline) {
      return '<span class="deadline--none">—</span>';
    }
    var days = daysUntil(row.deadline);
    var soon = days !== null && days >= 0 && days <= 14;
    var cls = "deadline" + (soon ? " deadline--soon" : "");
    var typeLabel = row.deadline_type ? escapeHtml(row.deadline_type) : "Deadline";
    var sub = "";
    if (days !== null) {
      if (days < 0)      sub = "Passed";
      else if (days === 0) sub = "Today";
      else if (days === 1) sub = "Tomorrow";
      else                 sub = "in " + days + " days";
    }
    return ''
      + '<span class="' + cls + '">'
      +   '<span class="deadline__type">' + typeLabel + '</span>'
      +   '<span class="deadline__date">' + escapeHtml(formatDate(row.deadline)) + '</span>'
      +   (sub ? '<span class="deadline__type" style="color:var(--ink-faint);font-weight:500">' + sub + '</span>' : '')
      + '</span>';
  }

  function renderActionLink(row) {
    var url = filingUrl(row);
    if (!url) return '<span class="deadline--none">—</span>';
    return '<a class="action-link" href="' + escapeHtml(url) + '" target="_blank" rel="noopener noreferrer">View filing</a>';
  }

  function renderRow(row) {
    var cls = row.is_new ? ' class="is-new"' : '';
    var newPill = row.is_new ? '<span class="new-pill">New</span>' : '';
    return ''
      + '<tr' + cls + '>'
      +   '<td class="col-date" data-label="Filed">' + escapeHtml(formatDate(row.filed_date)) + newPill + '</td>'
      +   '<td class="col-accession mono" data-label="Accession">' + escapeHtml(row.accession || "—") + '</td>'
      +   '<td class="col-docket mono" data-label="Docket">' + escapeHtml(row.docket || "—") + '</td>'
      +   '<td class="col-filer filer" data-label="Filer">' + escapeHtml(row.filer || "—") + '</td>'
      +   '<td class="col-filing" data-label="Filing / request"><div class="filing-text">' + escapeHtml(row.filing || "—") + '</div></td>'
      +   '<td class="col-tags" data-label="Counties / keywords">' + renderTagStack(row.counties, row.keywords) + '</td>'
      +   '<td class="col-deadline" data-label="Deadline">' + renderDeadlineCell(row) + '</td>'
      +   '<td class="col-action" data-label="Action">' + renderActionLink(row) + '</td>'
      + '</tr>';
  }

  function renderTable(rows, selectedCounty) {
    var body = $("filings-body");
    if (!body) return;
    if (!rows || !rows.length) {
      body.innerHTML = emptyRowHtml(selectedCounty);
      return;
    }
    body.innerHTML = rows.map(renderRow).join("");
  }

  function rowMatchesCounty(row, county) {
    if (!county) return true;
    var selected = String(county).trim().toLowerCase();
    return (row.counties || []).some(function (c) {
      return String(c).trim().toLowerCase() === selected;
    });
  }

  function filteredRows(rows, county) {
    return (rows || []).filter(function (row) {
      return rowMatchesCounty(row, county);
    });
  }

  function updateFilterCount(totalRows, shownRows, county) {
    var target = $("county-filter-count");
    if (!target) return;
    if (!county) {
      target.textContent = "Showing all " + totalRows + " filings";
      return;
    }
    var noun = shownRows === 1 ? "filing" : "filings";
    target.textContent = "Showing " + shownRows + " " + noun + " tagged to " + county + " County";
  }

  function setupCountyFilter(rows) {
    var select = $("county-filter");
    if (!select) return;
    MISSISSIPPI_COUNTIES.forEach(function (county) {
      var option = document.createElement("option");
      option.value = county;
      option.textContent = county + " County";
      select.appendChild(option);
    });

    function applyCountyFilter() {
      var county = select.value;
      var nextRows = filteredRows(rows, county);
      renderTable(nextRows, county);
      updateFilterCount((rows || []).length, nextRows.length, county);
    }

    select.addEventListener("change", applyCountyFilter);
    applyCountyFilter();
  }

  function renderStatus(data) {
    var rows = (data && data.rows) || [];

    // Last checked
    var ck = formatCheckedTimestamp(data && data.last_checked);
    $("val-checked").textContent = ck.primary;
    $("val-checked-sub").textContent = ck.sub || "Awaiting first run";
    if (data && data.last_checked) $("card-checked").classList.add("is-fresh");

    // New filings (prefer explicit count, else count is_new)
    var newCount = (data && typeof data.since_last_check === "number")
      ? data.since_last_check
      : rows.filter(function (r) { return r.is_new; }).length;
    $("val-new").textContent = String(newCount);
    if (newCount > 0) $("card-new").classList.add("has-new");

    // Counties matched (unique across all rows)
    var seen = {};
    rows.forEach(function (r) {
      (r.counties || []).forEach(function (c) {
        var key = String(c).trim().toLowerCase();
        if (key) seen[key] = true;
      });
    });
    var countyCount = Object.keys(seen).length;
    $("val-counties").textContent = String(countyCount);
    $("val-counties-sub").textContent = "of " + WATCHED_COUNTIES + " watched";

    // Deadlines found
    var deadlineCount = rows.filter(function (r) { return !!r.deadline; }).length;
    $("val-deadlines").textContent = String(deadlineCount);
    if (deadlineCount > 0) $("card-deadlines").classList.add("has-deadlines");

    // New banner
    var banner = $("new-banner");
    if (newCount > 0) {
      var label = newCount === 1 ? "1 new filing" : newCount + " new filings";
      $("new-banner-count").textContent = label;
      banner.hidden = false;
    } else {
      banner.hidden = true;
    }
  }

  function renderDeadlineWatch(rows) {
    var section = $("deadline-watch");
    var list = $("deadline-watch-list");
    if (!section || !list) return;

    var deadlineRows = (rows || [])
      .filter(function (row) {
        var days = daysUntil(row.deadline);
        return row.deadline && days !== null && days >= 0;
      })
      .sort(function (a, b) {
        var ad = new Date(a.deadline).getTime();
        var bd = new Date(b.deadline).getTime();
        if (ad !== bd) return ad - bd;
        return String(a.docket || "").localeCompare(String(b.docket || ""));
      });

    if (!deadlineRows.length) {
      section.hidden = true;
      list.innerHTML = "";
      return;
    }

    section.hidden = false;
    list.innerHTML = deadlineRows.map(function (row) {
      var days = daysUntil(row.deadline);
      var dayLabel = days === 0 ? "Due today"
        : days === 1 ? "Due tomorrow"
        : "Due in " + days + " days";
      var fercUrl = filingUrl(row);
      var commentUrl = publicCommentUrl();
      return ''
        + '<article class="deadline-card">'
        +   '<div class="deadline-card__date">'
        +     '<span class="deadline-card__month">' + escapeHtml(formatDate(row.deadline)) + '</span>'
        +     '<span class="deadline-card__days">' + escapeHtml(dayLabel) + '</span>'
        +   '</div>'
        +   '<div class="deadline-card__body">'
        +     '<div class="deadline-card__meta">'
        +       '<span class="deadline-card__docket">' + escapeHtml(row.docket || "No docket") + '</span>'
        +       '<span class="deadline-card__accession">' + escapeHtml(row.accession || "") + '</span>'
        +     '</div>'
        +     '<h3 class="deadline-card__title">' + escapeHtml(row.deadline_type || "FERC deadline") + '</h3>'
        +     '<p class="deadline-card__text">' + escapeHtml(row.filing || "") + '</p>'
        +     '<div class="deadline-card__actions">'
        +       (fercUrl ? '<a class="deadline-card__link" href="' + escapeHtml(fercUrl) + '" target="_blank" rel="noopener noreferrer">View FERC filing</a>' : '')
        +       '<a class="deadline-card__link deadline-card__link--primary" href="' + escapeHtml(commentUrl) + '" target="_blank" rel="noopener noreferrer">Submit public comment</a>'
        +     '</div>'
        +     '<p class="deadline-card__hint">Use docket ' + escapeHtml(row.docket || "shown in the filing") + ' when FERC eComment asks for the docket number.</p>'
        +   '</div>'
        + '</article>';
    }).join("");
  }

  /* ---------- overflow detection ----------
     Adds .has-overflow when the table is wider than its wrapper, and toggles
     .is-scrolled-end when the user has scrolled to the right edge. Drives a
     subtle right-edge gradient + a screen-reader-friendly scroll hint. */
  function watchOverflow() {
    var wrap = document.getElementById("table-wrap");
    if (!wrap) return;
    function check() {
      var overflowing = wrap.scrollWidth - wrap.clientWidth > 1;
      wrap.classList.toggle("has-overflow", overflowing);
      var atEnd = wrap.scrollLeft + wrap.clientWidth >= wrap.scrollWidth - 1;
      wrap.classList.toggle("is-scrolled-end", overflowing && atEnd);
    }
    check();
    wrap.addEventListener("scroll", check, { passive: true });
    if (typeof ResizeObserver !== "undefined") {
      var ro = new ResizeObserver(check);
      ro.observe(wrap);
    } else {
      window.addEventListener("resize", check);
    }
  }

  function init() {
    var data = (typeof window !== "undefined" && window.FERC_DATA) ? window.FERC_DATA : null;
    if (!data) {
      data = { last_checked: null, since_last_check: 0, rows: [] };
    }
    renderStatus(data);
    renderDeadlineWatch(data.rows);
    setupCountyFilter(data.rows);
    watchOverflow();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
