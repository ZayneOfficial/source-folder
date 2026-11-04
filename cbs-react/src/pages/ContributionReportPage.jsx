import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import { toJpeg, toPng } from "html-to-image";
import "./ContributionReportPage.css";

const INITIAL_ROWS = [
  { branch: "HOUT BAY", amount: "R7 380.00" },
  { branch: "NEAREST", amount: "R80.00" },
  { branch: "WYNBERG", amount: "R4 410.00" },
  { branch: "SEA POINT", amount: "R450.00" },
  { branch: "KAYELITSHA MARANE", amount: "R7 080.00" },
  { branch: "NYANGA JUNCTION", amount: "R3 270.00" },
  { branch: "BLACKHEATH", amount: "R1 230.00" },
  { branch: "GUGULETHU", amount: "R750.00" },
  { branch: "KLAMPTUS", amount: "R1 280.00" },
  { branch: "KAYELITSHA SITE B", amount: "R800.00" },
  { branch: "MAMALAY", amount: "R90.00" },
  { branch: "GUGULETHU MALL", amount: "R90.00" },
  { branch: "FISHHOEK", amount: "R650.00" },
  { branch: "KOMSA", amount: "R850.00" },
  { branch: "KUILSRIVER", amount: "R390.00" },
  { branch: "KRAAIFONTEIN", amount: "R420.00" },
  { branch: "DEFT", amount: "R330.00" },
  { branch: "MPULENI", amount: "R330.00" },
  { branch: "MPAZA", amount: "R180.00" },
  { branch: "MAITLAND", amount: "R300.00" },
  { branch: "LANGA", amount: "R168.00" },
  { branch: "PARKLANDS", amount: "R270.00" },
  { branch: "BROOKLYN", amount: "R90.00" },
];

function ContributionReportPage() {
  const reportRef = useRef(null);
  const [title, setTitle] = useState("TINASHE MAKONZA FUNERAL");
  const [rows, setRows] = useState(() => INITIAL_ROWS.map((row, id) => ({ ...row, id })));
  const [nextId, setNextId] = useState(INITIAL_ROWS.length);
  const [expenses, setExpenses] = useState("");
  const [totalCash, setTotalCash] = useState("");
  const [firstContact, setFirstContact] = useState("MR NYAMAZAMO: +27 84 784 5074");
  const [secondContact, setSecondContact] = useState("MR CHIKWASHA: +27 676 758 067");
  const [exportingFormat, setExportingFormat] = useState("");
  const [exportError, setExportError] = useState("");

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
    setRows((currentRows) =>
      currentRows.map((row) => (row.id === id ? { ...row, [key]: value } : row)),
    );
  }

  function addRow() {
    setRows((currentRows) => [...currentRows, { id: nextId, branch: "", amount: "" }]);
    setNextId((currentId) => currentId + 1);
  }

  function resetReport() {
    setTitle("TINASHE MAKONZA FUNERAL");
    setRows(INITIAL_ROWS.map((row, id) => ({ ...row, id })));
    setNextId(INITIAL_ROWS.length);
    setExpenses("");
    setTotalCash("");
    setFirstContact("MR NYAMAZAMO: +27 84 784 5074");
    setSecondContact("MR CHIKWASHA: +27 676 758 067");
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
        Edit the report fields below. Choose “Print / Save as PDF”, then select “Save as PDF” in the print dialog.
      </p>

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
            onChange={(event) => setTitle(event.target.value)}
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
                    onClick={() => setRows((currentRows) => currentRows.filter((item) => item.id !== row.id))}
                  >
                    ×
                  </button>
                </td>
              </tr>
            ))}
            <tr className="report-expenses-row">
              <th scope="row">EXPENSES</th>
              <td><input aria-label="Expenses" value={expenses} onChange={(event) => setExpenses(event.target.value)} /></td>
              <td className="report-row-action"></td>
            </tr>
            <tr className="report-total-row">
              <th scope="row">TOTAL CASH</th>
              <td><input aria-label="Total cash" value={totalCash} onChange={(event) => setTotalCash(event.target.value)} /></td>
              <td className="report-row-action"></td>
            </tr>
          </tbody>
        </table>

        <footer className="report-footer">
          <div className="report-contact-title">FOR INQUIRIES CONTACT</div>
          <div className="report-contact-lines">
            <input aria-label="First contact" value={firstContact} onChange={(event) => setFirstContact(event.target.value)} />
            <span>OR</span>
            <input aria-label="Second contact" value={secondContact} onChange={(event) => setSecondContact(event.target.value)} />
          </div>
          <div className="report-signature">
            <span>SIGNATURE:</span>
            <img className="report-signature-image" src="/signature.png" alt="Signature" />
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
