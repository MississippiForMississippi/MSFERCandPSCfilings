/*
 * Example payload illustrating every supported field.
 * NOT loaded by the page. Use as a reference for your scheduled task.
 * Overwrite data.js with content of this shape.
 */
window.FERC_DATA = {
  last_checked: "2025-01-15T08:00:00-06:00",
  check_status: "ok",
  since_last_check: 2,
  rows: [
    {
      is_new: true,
      filed_date: "2025-01-14",
      accession: "20250114-5037",
      docket: "ER25-1234-000",
      filer: "Entergy Mississippi, LLC",
      filing: "Application for transmission interconnection serving a proposed large-load customer near Meridian; includes 230 kV substation expansion at the Lauderdale–Kemper line.",
      counties: ["Lauderdale", "Kemper"],
      keywords: ["large-load customer", "substation expansion", "transmission upgrades"],
      deadline: "2025-02-13",
      deadline_type: "Comment",
      link: "https://elibrary.ferc.gov/eLibrary/filelist?accession_number=20250114-5037"
    },
    {
      is_new: true,
      filed_date: "2025-01-13",
      accession: "20250113-5102",
      docket: "CP25-77-000",
      filer: "Southern Natural Gas Company, L.L.C.",
      filing: "Notice of intent — proposed compressor station upgrade and pipeline lateral crossing Jasper and Clarke counties.",
      counties: ["Jasper", "Clarke"],
      keywords: ["compressor stations", "pipeline infrastructure"],
      deadline: "2025-02-03",
      deadline_type: "Intervention",
      link: "https://elibrary.ferc.gov/eLibrary/filelist?accession_number=20250113-5102"
    },
    {
      is_new: false,
      filed_date: "2024-12-22",
      accession: "20241222-5004",
      docket: "QF25-12-000",
      filer: "Choctaw Solar I, LLC",
      filing: "Self-certification of qualifying facility status for a 75 MW solar generation project with 30 MW battery storage in Choctaw County.",
      counties: ["Choctaw"],
      keywords: ["solar generation", "battery storage", "interconnection studies"],
      deadline: null,
      deadline_type: "",
      link: "https://elibrary.ferc.gov/eLibrary/filelist?accession_number=20241222-5004"
    }
  ]
};
