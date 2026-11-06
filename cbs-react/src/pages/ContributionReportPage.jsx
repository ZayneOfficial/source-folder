import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import { toJpeg, toPng } from "html-to-image";
import "./ContributionReportPage.css";

const INITIAL_ROWS = [
  { branch: "HOUT BAY", amount: "R00.00" },
  { branch: "NEAREST", amount: "R00.00" },
  { branch: "WYNBERG", amount: "R00.00" },
  { branch: "SEA POINT", amount: "R00.00" },
  { branch: "KAYELITSHA MARANE", amount: "R00.00" },
  { branch: "NYANGA JUNCTION", amount: "R00.00" },
  { branch: "BLACKHEATH", amount: "R00.00" },
  { branch: "GUGULETHU", amount: "R00.00" },
  { branch: "KLAMPTUS", amount: "R00.00" },
  { branch: "KAYELITSHA SITE B", amount: "R00.00" },
  { branch: "MAMALAY", amount: "R00.00" },
  { branch: "GUGULETHU MALL", amount: "R00.00" },
  { branch: "FISHHOEK", amount: "R00.00" },
  { branch: "KOMSA", amount: "R00.00" },
  { branch: "KUILSRIVER", amount: "R00.00" },
  { branch: "KRAAIFONTEIN", amount: "R00.00" },
  { branch: "DEFT", amount: "R00.00" },
  { branch: "MPULENI", amount: "R00.00" },
  { branch: "MPAZA", amount: "R00.00" },
  { branch: "MAITLAND", amount: "R00.00" },
  { branch: "LANGA", amount: "R00.00" },
  { branch: "PARKLANDS", amount: "R00.00" },
  { branch: "BROOKLYN", amount: "R00.00" },
];

const REPORT_STORAGE_KEY = "cbs.contributionReport";

function getCurrentDateValue() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function createInitialReport() {
  return {
    title: "TINASHE MAKONZA FUNERAL",
    rows: INITIAL_ROWS.map((row, id) => ({ ...row, id })),
    nextId: INITIAL_ROWS.length,
    expenses: "R00.00",
    totalCash: "R00.00",
    firstContact: "MR NYAMAZAMO: +27 84 784 5074",
    secondContact: "MR CHIKWASHA: +27 676 758 067",
    reportDate: getCurrentDateValue(),
  };
}

function isValidSavedReport(value) {
  return value
    && typeof value.title === "string"
    && Array.isArray(value.rows)
    && value.rows.every((row) =>
      Number.isInteger(row.id)
      && typeof row.branch === "string"
      && typeof row.amount === "string")
    && Number.isInteger(value.nextId)
    && ["expenses", "totalCash", "firstContact", "secondContact", "reportDate"]
      .every((key) => typeof value[key] === "string");
}

function loadSavedReport() {
  try {
    const saved = localStorage.getItem(REPORT_STORAGE_KEY);
    if (!saved) return { report: createInitialReport(), error: "" };

    const report = JSON.parse(saved);
    if (!isValidSavedReport(report)) {
      throw new Error("Saved report data is invalid.");
    }

    return { report, error: "" };
  } catch (error) {
    const reason = error instanceof Error ? ` ${error.message}` : "";
    return {
      report: createInitialReport(),
      error: `Could not load the saved report.${reason}`,
    };
  }
}

function ContributionReportPage() {
  const reportRef = useRef(null);
  const [initialSavedReport] = useState(loadSavedReport);
  const [report, setReport] = useState(initialSavedReport.report);
  const [saveError, setSaveError] = useState(initialSavedReport.error);
  const [exportingFormat, setExportingFormat] = useState("");
  const [exportError, setExportError] = useState("");
  const { title, rows, expenses, totalCash, firstContact, secondContact, reportDate } = report;

  function updateReport(updater) {
    const updatedReport = typeof updater === "function" ? updater(report) : updater;
    setReport(updatedReport);
    try {
      localStorage.setItem(REPORT_STORAGE_KEY, JSON.stringify(updatedReport));
      setSaveError("");
    } catch (error) {
      const reason = error instanceof Error ? ` ${error.message}` : "";
      setSaveError(`Could not save the report on this device.${reason}`);
    }
  }

  async function downloadImage(format) {
    if (!reportRef.current) return;

    setExportingFormat(format);
    setExportError("");
    try {
      const options = {
        pixelRatio: 2,
        cacheBust: true,
        backgroundColor: "#fff",
        filter: (node) => !node.classList?.contains("report-row-action"),
      };
      const imageUrl = format === "png"
        ? await toPng(reportRef.current, options)
        : await toJpeg(reportRef.current, { ...options, quality: 0.95 });
      const filename = title.trim().replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "").toLowerCase()
        || "contribution-report";
      const downloadLink = document.createElement("a");
      downloadLink.download = `${filename}.${format}`;
      downloadLink.href = imageUrl;
      downloadLink.click();
    } catch (error) {
      const reason = error instanceof Error ? ` ${error.message}` : "";
      setExportError(`Could not create the ${format.toUpperCase()} image.${reason}`);
    } finally {
      setExportingFormat("");
    }
  }

  function updateRow(id, key, value) {
    updateReport((current) => ({
      ...current,
      rows: current.rows.map((row) => (row.id === id ? { ...row, [key]: value } : row)),
    }));
  }

  function addRow() {
    updateReport((current) => ({
      ...current,
      rows: [...current.rows, { id: current.nextId, branch: "", amount: "R00.00" }],
      nextId: current.nextId + 1,
    }));
  }

  function resetReport() {
    updateReport(createInitialReport());
  }

  return (
    <main className="contribution-report-page">
      <nav className="report-toolbar" aria-label="Report actions">
        <Link className="btn btn-primary" to="/admin/dashboard">Back to dashboard</Link>
        <div className="report-toolbar-actions">
          <button className="btn btn-primary" type="button" onClick={resetReport}>
            Reset template
          </button>
          <button
            className="btn btn-primary"
            type="button"
            disabled={Boolean(exportingFormat)}
            onClick={() => downloadImage("png")}
          >
            {exportingFormat === "png" ? "Creating PNG..." : "Download PNG"}
          </button>
          <button
            className="btn btn-primary"
            type="button"
            disabled={Boolean(exportingFormat)}
            onClick={() => downloadImage("jpeg")}
          >
            {exportingFormat === "jpeg" ? "Creating JPEG..." : "Download JPEG"}
          </button>
          <button className="btn btn-primary" type="button" onClick={() => window.print()}>
            Print / Save as PDF
          </button>
        </div>
      </nav>

      {exportError && <p className="report-export-error" role="alert">{exportError}</p>}
      <p className="report-edit-hint">
        Changes are saved on this device and will remain available after you log out. Edit the report below, or choose “Print / Save as PDF” and then select “Save as PDF” in the print dialog.
      </p>
      {saveError && <p className="report-export-error" role="alert">{saveError}</p>}

      <article ref={reportRef} className="report-sheet" aria-label="Funeral contributions report">
        <svg className="report-decoration" viewBox="0 0 210 297" preserveAspectRatio="none" aria-hidden="true">
          <path fill="#009b3a" d="M0 0h48C24 10 18 27 10 47 7 55 4 63 0 68z" />
          <path fill="#ffd500" d="M0 0h41C20 11 15 28 7 48 4 55 2 61 0 64z" />
          <path fill="#ed1c24" d="M0 0h34C17 12 12 28 5 48 3 54 1 58 0 60z" />
          <path fill="#009b3a" d="M0 0h27C14 12 9 29 3 48 2 53 1 56 0 58z" />
          <path fill="#009b3a" d="M210 297h-48c24-10 30-27 38-47 3-8 6-16 10-21z" />
          <path fill="#ffd500" d="M210 297h-41c21-11 26-28 34-48 3-7 5-13 7-16z" />
          <path fill="#ed1c24" d="M210 297h-34c17-12 22-28 29-48 2-6 4-10 5-12z" />
          <path fill="#009b3a" d="M210 297h-27c13-12 18-29 24-48 2-5 3-8 3-10z" />
        </svg>

        <header className="report-brand">
          <img src="/cbs.png" alt="Cape Town Burial Society" />
          <div className="report-brand-name">
            <div>CAPE TOWN BURIAL SOCIETY</div>
            <div>DEPARTMENT OF FINANCE</div>
          </div>
        </header>

        <section className="report-heading">
          <input
            aria-label="Funeral name"
            className="report-title-input"
            value={title}
            onChange={(event) => updateReport((current) => ({ ...current, title: event.target.value }))}
          />
          <div className="report-subtitle">CONTRIBUTIONS</div>
        </section>

        <table className="report-table">
          <thead>
            <tr>
              <th scope="col">BRANCH</th>
              <th scope="col">AMOUNT</th>
              <th className="report-row-action" aria-hidden="true"></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr key={row.id}>
                <td>
                  <input
                    aria-label={`Branch ${index + 1}`}
                    value={row.branch}
                    onChange={(event) => updateRow(row.id, "branch", event.target.value)}
                  />
                </td>
                <td>
                  <input
                    aria-label={`Amount for branch ${index + 1}`}
                    value={row.amount}
                    onChange={(event) => updateRow(row.id, "amount", event.target.value)}
                  />
                </td>
                <td className="report-row-action">
                  <button
                    className="report-remove-row"
                    type="button"
                    aria-label={`Remove branch ${index + 1}`}
                    onClick={() => updateReport((current) => ({
                      ...current,
                      rows: current.rows.filter((item) => item.id !== row.id),
                    }))}
                  >
                    ×
                  </button>
                </td>
              </tr>
            ))}
            <tr className="report-expenses-row">
              <th scope="row">EXPENSES</th>
              <td><input aria-label="Expenses" value={expenses} onChange={(event) => updateReport((current) => ({ ...current, expenses: event.target.value }))} /></td>
              <td className="report-row-action"></td>
            </tr>
            <tr className="report-total-row">
              <th scope="row">TOTAL CASH</th>
              <td><input aria-label="Total cash" value={totalCash} onChange={(event) => updateReport((current) => ({ ...current, totalCash: event.target.value }))} /></td>
              <td className="report-row-action"></td>
            </tr>
          </tbody>
        </table>

        <footer className="report-footer">
          <div className="report-contact-title">FOR INQUIRIES CONTACT</div>
          <div className="report-contact-lines">
            <input aria-label="First contact" value={firstContact} onChange={(event) => updateReport((current) => ({ ...current, firstContact: event.target.value }))} />
            <span>OR</span>
            <input aria-label="Second contact" value={secondContact} onChange={(event) => updateReport((current) => ({ ...current, secondContact: event.target.value }))} />
          </div>
          <div className="report-signature">
            <span>SIGNATURE:</span>
            <img className="report-signature-image" src="/signature.png" alt="Signature" />
            <label className="report-date">
              <span>DATE:</span>
              <input
                aria-label="Report date"
                type="date"
                value={reportDate}
                onChange={(event) => updateReport((current) => ({ ...current, reportDate: event.target.value }))}
              />
            </label>
          </div>
        </footer>
      </article>

      <div className="report-screen-controls" aria-label="Edit report rows">
        <button className="btn btn-primary" type="button" onClick={addRow}>Add branch</button>
      </div>
    </main>
  );
}

export default ContributionReportPage;
