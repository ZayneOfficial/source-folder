import { useEffect, useState } from "react";
import Header from "../components/Header";

function HelperDashboard() {
  const [funerals, setFunerals] = useState([]);
  const [selectedFuneral, setSelectedFuneral] = useState("");
  const [payments, setPayments] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadFunerals() {
      try {
        const response = await fetch("/api/funerals", { credentials: "include" });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || "Could not load funerals.");
        setFunerals(data.funerals || []);
      } catch (loadError) {
        setError(loadError.message);
      }
    }
    loadFunerals();
  }, []);

  useEffect(() => {
    if (!selectedFuneral) {
      return;
    }
    async function loadPayments() {
      try {
        const response = await fetch(`/api/payments/${selectedFuneral}`, { credentials: "include" });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || "Could not load payments.");
        setPayments(data.payments || []);
      } catch (loadError) {
        setError(loadError.message);
      }
    }
    loadPayments();
  }, [selectedFuneral]);

  async function requestPaymentChange(payment) {
    try {
      const response = await fetch("/api/payment-change-requests", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          payment_id: payment._id,
          new_status: payment.status === "PAID" ? "NOT PAID" : "PAID",
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Could not submit payment change.");
      setError("");
      setPayments((currentPayments) => currentPayments.filter((item) => item._id !== payment._id));
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  return (
    <div>
    <Header role="Helper" />
    <main className="container">
      {error && <div className="message error">{error}</div>}
      <section className="card">
        <div className="section-title">
          <h2>Payment Marking</h2>
        </div>

        <div className="toolbar">
          <select id="funeralSelect" value={selectedFuneral} onChange={(event) => setSelectedFuneral(event.target.value)}>
            <option value="">Select a funeral...</option>
            {funerals.map((funeral) => <option key={funeral._id} value={funeral._id}>{funeral.deceased_name} - {new Date(funeral.funeral_date).toLocaleDateString("en-ZA")}</option>)}
          </select>

          <input
            id="memberSearch"
            placeholder="Search VN, name, surname or phone"
          />
        </div>

        <div id="helperMessage" className="message"></div>

        <div id="paymentSummary" className="small">{selectedFuneral ? `Showing ${payments.length} members` : "Select a funeral to begin."}</div>

        <div className="table-wrap" style={{ marginTop: 10 }}>
          <table>
            <thead>
              <tr>
                <th>VN Number</th>
                <th>Name</th>
                <th>Surname</th>
                <th>Phone</th>
                <th>Current Status</th>
                <th>Action</th>
              </tr>
            </thead>

            <tbody id="paymentBody">
              {selectedFuneral && payments.length ? payments.map((payment) => <tr key={payment._id}>
                <td><b>{payment.vn_number}</b></td>
                <td>{payment.name}</td>
                <td>{payment.surname}</td>
                <td>{payment.phone}</td>
                <td><span className={`badge ${payment.status === "PAID" ? "paid" : "not-paid"}`}>{payment.status}</span></td>
                <td><button className="btn btn-primary" type="button" onClick={() => requestPaymentChange(payment)}>
                  {payment.status === "PAID" ? "Request NOT PAID" : "Request PAID"}
                </button></td>
              </tr>) : <tr><td colSpan="6" className="empty">{selectedFuneral ? "No members found." : "Select a funeral."}</td></tr>}
            </tbody>
          </table>
        </div>
      </section>
    </main>

    </div>
  );
}

export default HelperDashboard; 