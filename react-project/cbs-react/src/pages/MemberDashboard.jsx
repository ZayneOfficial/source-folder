import { useEffect, useState } from "react";
import Header from "../components/Header";

function formatDate(value) {
  return value ? new Date(value).toLocaleDateString("en-ZA") : "-";
}

function formatMoney(value) {
  return `R${Number(value || 0).toLocaleString("en-ZA", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function MemberDashboard() {
    const [account, setAccount] = useState(null);
    const [error, setError] = useState("");

    useEffect(() => {
      async function loadAccount() {
        try {
          const memberVn = localStorage.getItem("member_vn");
          if (!memberVn) throw new Error("Member session is missing. Please log in again.");
          const response = await fetch(`/api/member-payments/${encodeURIComponent(memberVn)}`, {
            credentials: "include",
          });
          const data = await response.json();
          if (!response.ok) throw new Error(data.message || "Could not load account.");
          setAccount(data);
        } catch (loadError) {
          setError(loadError.message);
        }
      }

      loadAccount();
    }, []);

    const member = account?.member;
    return (
        <>
          <Header role="Member" />
          <main className="container">
      {error && <div className="message error">{error}</div>}
      <section className="card">
        <div className="section-title"><h2>My Details</h2></div>
        <div className="member-hero" id="details">
          <div className="info-box"><span className="small">Member</span><b>{member ? `${member.name} ${member.surname}` : "Loading..."}</b></div>
          <div className="info-box"><span className="small">VN Number</span><b>{member?.vn_number || "Loading..."}</b></div>
          <div className="info-box"><span className="small">Status</span><b>{member?.status || "Loading..."}</b></div>
        </div>
      </section>
      <section className="card" style={{ marginTop: 14 }}>
        <div className="section-title"><h2>My Dependants</h2></div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Surname</th>
                <th>Relationship</th>
                <th>Date of Birth</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody id="dependentBody">
              {account?.dependents?.length ? account.dependents.map((dependent) => (
                <tr key={dependent._id}>
                  <td>{dependent.name}</td>
                  <td>{dependent.surname}</td>
                  <td>{dependent.relationship}</td>
                  <td>{formatDate(dependent.date_of_birth)}</td>
                  <td>{dependent.status}</td>
                </tr>
              )) : <tr><td colSpan="5" className="empty">{account ? "No dependants registered." : "Loading..."}</td></tr>}
            </tbody>
          </table>
        </div>
      </section>

      <section className="card" style={{ marginTop: 14 }}>
        <div className="section-title"><h2>My Funeral Contributions</h2></div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Funeral Name - Date</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Date Paid</th>
              </tr>
            </thead>
            <tbody id="paymentBody">
              {account?.payments?.length ? account.payments.map((payment) => (
                <tr key={payment._id}>
                  <td>{payment.funeral_deceased_name} - {formatDate(payment.funeral_date)}</td>
                  <td>{formatMoney(payment.contribution_amount)}</td>
                  <td><span className={`badge ${payment.status === "PAID" ? "paid" : "not-paid"}`}>{payment.status}</span></td>
                  <td>{formatDate(payment.payment_date)}</td>
                </tr>
              )) : <tr><td colSpan="4" className="empty">{account ? "No funeral contributions yet." : "Loading..."}</td></tr>}
            </tbody>
          </table>
        </div>
      </section>
    </main>  
        </>
    );
}

export default MemberDashboard;