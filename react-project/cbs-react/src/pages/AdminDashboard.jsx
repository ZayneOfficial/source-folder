import { useEffect } from "react";
import Header from "../components/Header";

function AdminDashboard() {
  useEffect(() => {
    const listenerController = new AbortController();

    async function api(url, options = {}) {
      const response = await fetch(url, {
        ...options,
        credentials: "include",
        headers: { "Content-Type": "application/json", ...(options.headers || {}) },
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.message || "Request failed.");
      return data;
    }

    function showMessage(id, text, success = false) {
      const element = document.getElementById(id);
      element.textContent = text;
      element.className = `message ${success ? "success" : "error"}`;
    }

    async function loadMembers() {
      const search = document.getElementById("memberSearch").value;
      const data = await api(`/api/members?limit=50&search=${encodeURIComponent(search)}`);
      document.getElementById("totalMembers").textContent = data.total;
      document.getElementById("pageInfo").textContent = `Page ${data.page} of ${data.pages} (${data.total} members)`;
      document.getElementById("memberBody").innerHTML = data.members.map((member) => `
        <tr><td><b>${member.vn_number}</b></td><td>${member.name}</td><td>${member.surname}</td>
        <td>${member.phone}</td><td>${member.status}</td><td>${new Date(member.join_date).toLocaleDateString("en-ZA")}</td>
        <td><button class="btn btn-primary edit-member" data-id="${member._id}">Edit</button>
        <button class="btn btn-dark manage-dependents" data-id="${member._id}" data-label="${member.vn_number} - ${member.name} ${member.surname}">Dependants</button>
        <button class="btn btn-red delete-member" data-id="${member._id}">Delete</button></td></tr>
      `).join("") || '<tr><td colspan="7" class="empty">No members found.</td></tr>';
    }

    async function loadFunerals() {
      const data = await api("/api/funerals");
      const select = document.getElementById("funeralSelect");
      const selected = select.value;
      select.innerHTML = '<option value="">Select a funeral...</option>' + data.funerals.map((funeral) =>
        `<option value="${funeral._id}">${funeral.deceased_name} - ${new Date(funeral.funeral_date).toLocaleDateString("en-ZA")} (${funeral.status})</option>`
      ).join("");
      if (data.funerals.some((funeral) => funeral._id === selected)) select.value = selected;
    }

    async function loadPayments() {
      const funeralId = document.getElementById("funeralSelect").value;
      if (!funeralId) {
        document.getElementById("paymentBody").innerHTML = '<tr><td colspan="7" class="empty">Select a funeral.</td></tr>';
        document.getElementById("paymentSummary").textContent = "Select a funeral to begin.";
        return;
      }
      const search = document.getElementById("paymentSearch").value;
      const data = await api(`/api/payments/${funeralId}?search=${encodeURIComponent(search)}`);
      document.getElementById("paymentSummary").textContent = `${data.summary.paid}/${data.summary.total} PAID - ${data.summary.notPaid}/${data.summary.total} NOT PAID - R${data.summary.collected.toFixed(2)} collected`;
      document.getElementById("paidCount").textContent = `${data.summary.paid} / ${data.summary.total}`;
      document.getElementById("notPaidCount").textContent = `${data.summary.notPaid} / ${data.summary.total}`;
      document.getElementById("collected").textContent = `R${data.summary.collected.toFixed(2)}`;
      document.getElementById("paymentBody").innerHTML = data.payments.map((payment) => `
        <tr><td><b>${payment.vn_number}</b></td><td>${payment.name}</td><td>${payment.surname}</td><td>${payment.phone}</td>
        <td><span class="badge ${payment.status === "PAID" ? "paid" : "not-paid"}">${payment.status}</span></td><td>${payment.payment_date ? new Date(payment.payment_date).toLocaleDateString("en-ZA") : "-"}</td>
        <td><button class="btn ${payment.status === "PAID" ? "btn-red" : "btn-green"} toggle-payment" data-id="${payment._id}">${payment.status === "PAID" ? "Mark NOT PAID" : "Mark PAID"}</button></td></tr>
      `).join("") || '<tr><td colspan="7" class="empty">No payments found.</td></tr>';
    }

    async function loadDashboardData() {
      try {
        await Promise.all([loadMembers(), loadFunerals()]);
      } catch (loadError) {
        showMessage("memberMessage", loadError.message);
      }
    }

    document.getElementById("funeralSelect").addEventListener("change", () => loadPayments().catch((error) => showMessage("funeralMessage", error.message)), { signal: listenerController.signal });
    document.getElementById("paymentSearch").addEventListener("input", () => loadPayments().catch((error) => showMessage("funeralMessage", error.message)), { signal: listenerController.signal });
    document.getElementById("memberSearch").addEventListener("input", () => loadMembers().catch((error) => showMessage("memberMessage", error.message)), { signal: listenerController.signal });
    document.getElementById("refreshMembers").addEventListener("click", () => loadMembers().catch((error) => showMessage("memberMessage", error.message)), { signal: listenerController.signal });
    document.getElementById("memberForm").addEventListener("submit", async (event) => {
      event.preventDefault();
      try {
        await api("/api/members", { method: "POST", body: JSON.stringify({
          vn_number: document.getElementById("newVN").value, name: document.getElementById("newName").value,
          surname: document.getElementById("newSurname").value, phone: document.getElementById("newPhone").value,
          password: document.getElementById("newPassword").value, status: document.getElementById("newStatus").value,
        }) });
        event.target.reset();
        showMessage("memberMessage", "Member added successfully.", true);
        await loadMembers();
      } catch (error) { showMessage("memberMessage", error.message); }
    }, { signal: listenerController.signal });
    document.getElementById("funeralForm").addEventListener("submit", async (event) => {
      event.preventDefault();
      try {
        await api("/api/funerals", { method: "POST", body: JSON.stringify({
          deceased_name: document.getElementById("deceasedName").value,
          funeral_date: document.getElementById("funeralDate").value,
          contribution_amount: document.getElementById("funeralAmount").value,
        }) });
        event.target.reset();
        showMessage("funeralMessage", "Funeral created successfully.", true);
        await loadFunerals();
      } catch (error) { showMessage("funeralMessage", error.message); }
    }, { signal: listenerController.signal });
    document.getElementById("editFuneralBtn").addEventListener("click", async () => {
      const id = document.getElementById("funeralSelect").value;
      if (!id) return showMessage("funeralMessage", "Select a funeral first.");
      try {
        const data = await api("/api/funerals");
        const funeral = data.funerals.find((item) => item._id === id);
        document.getElementById("editFuneralPanel").dataset.id = funeral._id;
        document.getElementById("editFuneralName").value = funeral.deceased_name;
        document.getElementById("editFuneralDate").value = new Date(funeral.funeral_date).toISOString().slice(0, 10);
        document.getElementById("editFuneralAmount").value = funeral.contribution_amount;
        document.getElementById("editFuneralPanel").classList.remove("hidden");
      } catch (error) { showMessage("funeralMessage", error.message); }
    }, { signal: listenerController.signal });
    document.getElementById("editFuneralForm").addEventListener("submit", async (event) => {
      event.preventDefault();
      try {
        const id = document.getElementById("editFuneralPanel").dataset.id;
        await api(`/api/funerals/${id}`, { method: "PUT", body: JSON.stringify({
          deceased_name: document.getElementById("editFuneralName").value,
          funeral_date: document.getElementById("editFuneralDate").value,
          contribution_amount: document.getElementById("editFuneralAmount").value,
        }) });
        document.getElementById("editFuneralPanel").classList.add("hidden");
        showMessage("funeralMessage", "Funeral updated successfully.", true);
        await loadFunerals();
        await loadPayments();
      } catch (error) { showMessage("funeralMessage", error.message); }
    }, { signal: listenerController.signal });
    document.getElementById("cancelEditFuneral").addEventListener("click", () => document.getElementById("editFuneralPanel").classList.add("hidden"), { signal: listenerController.signal });
    document.getElementById("deleteFuneralBtn").addEventListener("click", async () => {
      const id = document.getElementById("funeralSelect").value;
      if (!id || !window.confirm("Delete this funeral and all its payment records?")) return;
      try {
        await api(`/api/funerals/${id}`, { method: "DELETE" });
        document.getElementById("funeralSelect").value = "";
        await loadFunerals();
        await loadPayments();
        showMessage("funeralMessage", "Funeral deleted successfully.", true);
      } catch (error) { showMessage("funeralMessage", error.message); }
    }, { signal: listenerController.signal });
    document.getElementById("closeSelectedFuneral").addEventListener("click", async () => {
      const id = document.getElementById("funeralSelect").value;
      if (!id) return showMessage("funeralMessage", "Select a funeral first.");
      try {
        await api(`/api/funerals/${id}/close`, { method: "PUT" });
        await loadFunerals();
        showMessage("funeralMessage", "Funeral closed successfully.", true);
      } catch (error) { showMessage("funeralMessage", error.message); }
    }, { signal: listenerController.signal });
    document.getElementById("paymentBody").addEventListener("click", async (event) => {
      const button = event.target.closest(".toggle-payment");
      if (!button) return;
      try { await api(`/api/payments/${button.dataset.id}/toggle`, { method: "PUT" }); await loadPayments(); }
      catch (error) { showMessage("funeralMessage", error.message); }
    }, { signal: listenerController.signal });
    document.getElementById("memberBody").addEventListener("click", async (event) => {
      const button = event.target.closest("button");
      if (!button) return;
      try {
        if (button.classList.contains("delete-member")) {
          if (!window.confirm("Delete this member and their dependants?")) return;
          await api(`/api/members/${button.dataset.id}`, { method: "DELETE" });
          await loadMembers();
        } else if (button.classList.contains("edit-member")) {
          const data = await api(`/api/members/${button.dataset.id}`);
          const member = data.member;
          document.getElementById("editMemberPanel").classList.remove("hidden");
          document.getElementById("editMemberPanel").dataset.id = member._id;
          document.getElementById("editVN").value = member.vn_number;
          document.getElementById("editName").value = member.name;
          document.getElementById("editSurname").value = member.surname;
          document.getElementById("editPhone").value = member.phone;
          document.getElementById("editStatus").value = member.status;
          document.getElementById("editJoinDate").value = new Date(member.join_date).toISOString().slice(0, 10);
        } else if (button.classList.contains("manage-dependents")) {
          await loadDependents(button.dataset.id, button.dataset.label);
        }
      } catch (error) { showMessage("memberMessage", error.message); }
    }, { signal: listenerController.signal });
    document.getElementById("editMemberForm").addEventListener("submit", async (event) => {
      event.preventDefault();
      try {
        const id = document.getElementById("editMemberPanel").dataset.id;
        await api(`/api/members/${id}`, { method: "PUT", body: JSON.stringify({
          name: document.getElementById("editName").value, surname: document.getElementById("editSurname").value,
          phone: document.getElementById("editPhone").value, status: document.getElementById("editStatus").value,
          join_date: document.getElementById("editJoinDate").value,
        }) });
        document.getElementById("editMemberPanel").classList.add("hidden");
        showMessage("memberMessage", "Member updated successfully.", true);
        await loadMembers();
      } catch (error) { showMessage("memberMessage", error.message); }
    }, { signal: listenerController.signal });
    document.getElementById("cancelEditMember").addEventListener("click", () => document.getElementById("editMemberPanel").classList.add("hidden"), { signal: listenerController.signal });
    document.getElementById("dependentForm").addEventListener("submit", async (event) => {
      event.preventDefault();
      try {
        const panel = document.getElementById("dependentsPanel");
        const id = panel.dataset.memberId;
        const dependentId = panel.dataset.dependentId;
        const payload = JSON.stringify({ name: document.getElementById("dependentName").value, surname: document.getElementById("dependentSurname").value,
          relationship: document.getElementById("dependentRelationship").value, date_of_birth: document.getElementById("dependentDob").value, status: document.getElementById("dependentStatus").value });
        await api(dependentId ? `/api/dependents/${dependentId}` : `/api/members/${id}/dependents`, { method: dependentId ? "PUT" : "POST", body: payload });
        panel.removeAttribute("data-dependent-id");
        event.target.reset();
        showMessage("dependentMessage", "Dependant saved successfully.", true);
        await loadDependents(id, document.getElementById("dependentMemberLabel").textContent);
      } catch (error) { showMessage("dependentMessage", error.message); }
    }, { signal: listenerController.signal });

    async function loadDependents(memberId, label) {
      const data = await api(`/api/members/${memberId}/dependents`);
      const panel = document.getElementById("dependentsPanel");
      panel.dataset.memberId = memberId;
      document.getElementById("dependentMemberLabel").textContent = label;
      panel.classList.remove("hidden");
      document.getElementById("dependentBody").innerHTML = data.dependents.map((dependent) => `<tr>
        <td>${dependent.name}</td><td>${dependent.surname}</td><td>${dependent.relationship}</td>
        <td>${new Date(dependent.date_of_birth).toLocaleDateString("en-ZA")}</td><td>${dependent.status}</td>
        <td><button class="btn btn-primary edit-dependent" data-id="${dependent._id}">Edit</button>
        <button class="btn btn-red delete-dependent" data-id="${dependent._id}">Delete</button></td></tr>`).join("") || '<tr><td colspan="6" class="empty">No dependants registered.</td></tr>';
      document.getElementById("dependentBody").closest(".table-wrap").scrollIntoView({ behavior: "smooth", block: "start" });
    }

    document.getElementById("dependentBody").addEventListener("click", async (event) => {
      const button = event.target.closest("button");
      if (!button) return;
      try {
        if (button.classList.contains("delete-dependent")) {
          if (!window.confirm("Delete this dependant?")) return;
          await api(`/api/dependents/${button.dataset.id}`, { method: "DELETE" });
          await loadDependents(document.getElementById("dependentsPanel").dataset.memberId, document.getElementById("dependentMemberLabel").textContent);
        } else {
          const data = await api(`/api/members/${document.getElementById("dependentsPanel").dataset.memberId}/dependents`);
          const dependent = data.dependents.find((item) => item._id === button.dataset.id);
          document.getElementById("dependentsPanel").dataset.dependentId = dependent._id;
          document.getElementById("dependentName").value = dependent.name;
          document.getElementById("dependentSurname").value = dependent.surname;
          document.getElementById("dependentRelationship").value = dependent.relationship;
          document.getElementById("dependentDob").value = new Date(dependent.date_of_birth).toISOString().slice(0, 10);
          document.getElementById("dependentStatus").value = dependent.status;
          document.getElementById("dependentSubmit").textContent = "Save Dependant";
        }
      } catch (error) { showMessage("dependentMessage", error.message); }
    }, { signal: listenerController.signal });
    document.getElementById("closeDependents").addEventListener("click", () => document.getElementById("dependentsPanel").classList.add("hidden"), { signal: listenerController.signal });

    loadDashboardData();
    return () => listenerController.abort();
  }, []);

  return (
    <>
      <Header role="Admin" />

      <main className="container">
        {/* ========================== STATISTICS ========================== */}
        <section className="stats">
          <div className="card">
            <div className="stat-label">TOTAL MEMBERS</div>
            <div className="stat-value" id="totalMembers">0</div>
          </div>

          <div className="card">
            <div className="stat-label">PAID</div>
            <div className="stat-value" id="paidCount">0 / 0</div>
          </div>

          <div className="card">
            <div className="stat-label">NOT PAID</div>
            <div className="stat-value" id="notPaidCount">0 / 0</div>
          </div>

          <div className="card">
            <div className="stat-label">TOTAL COLLECTED</div>
            <div className="stat-value" id="collected">R0</div>
          </div>
        </section>

        <div className="layout">
          {/* ========================== FUNERAL MANAGEMENT ========================== */}
          <section className="card">
            <div className="section-title">
              <h2>Funeral Management</h2>
            </div>

            <form id="funeralForm" className="form-grid">
              <div>
                <label>Deceased Name</label>
                <input id="deceasedName" required />
              </div>

              <div>
                <label>Funeral Date</label>
                <input id="funeralDate" type="date" required />
              </div>

              <div>
                <label>Contribution Amount (R)</label>
                <input
                  id="funeralAmount"
                  type="number"
                  min="0"
                  step="0.01"
                  defaultValue={200}
                  required
                />
              </div>

              <div>
                <label>&nbsp;</label>
                <button className="btn btn-dark" type="submit">
                  Create Funeral + Payments for all active members
                </button>
              </div>
            </form>

            <div id="funeralMessage" className="message"></div>

            <div className="toolbar funeral-actions">
              <button className="btn btn-primary" type="button" id="editFuneralBtn">
                ✏️ Edit Selected Funeral
              </button>

              <button className="btn btn-red" type="button" id="deleteFuneralBtn">
                🗑️ Delete Selected Funeral
              </button>

              <button className="btn btn-red" type="button" id="closeSelectedFuneral">
                🔒 Close Funeral
              </button>
            </div>

            {/* EDIT FUNERAL */}
            <div id="editFuneralPanel" className="edit-panel hidden">
              <div className="section-title">
                <h3>✏️ Edit Funeral</h3>

                <button type="button" className="btn btn-light" id="cancelEditFuneral">
                  Cancel
                </button>
              </div>

              <form id="editFuneralForm" className="form-grid">
                <div>
                  <label>Deceased Name</label>
                  <input id="editFuneralName" required />
                </div>

                <div>
                  <label>Funeral Date</label>
                  <input id="editFuneralDate" type="date" required />
                </div>

                <div>
                  <label>Contribution Amount (R)</label>
                  <input
                    id="editFuneralAmount"
                    type="number"
                    min="0"
                    step="0.01"
                    required
                  />
                </div>

                <div className="full">
                  <button className="btn btn-primary" type="submit">
                    💾 Save Funeral Changes
                  </button>
                </div>
              </form>

              <div className="small" style={{ marginTop: '8px' }}>
                Payment statuses and historical payment dates are not changed.
              </div>
            </div>
          </section>

          {/* ========================== HELPER APPROVALS ========================== */}
          <section className="card">
            <div className="section-title">
              <h2>🔔 Pending Helper Approvals</h2>

              <button className="btn btn-light" type="button" id="refreshApprovals">
                Refresh
              </button>
            </div>

            <div id="approvalMessage" className="message"></div>

            <div id="approvalSummary" className="small">
              Checking for pending changes...
            </div>

            <div className="table-wrap" style={{ marginTop: '10px' }}>
              <table className="payment-table">
                <thead>
                  <tr>
                    <th>Helper</th>
                    <th>Helper VN</th>
                    <th>Member VN</th>
                    <th>Member</th>
                    <th>Funeral</th>
                    <th>Current</th>
                    <th>Requested</th>
                    <th>Submitted</th>
                    <th>Action</th>
                  </tr>
                </thead>

                <tbody id="approvalBody">
                  <tr>
                    <td colSpan="9" className="empty">Loading pending changes...</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* ========================== PAYMENT MARKING ========================== */}
          <section className="card">
            <div className="section-title">
              <h2>Payment Marking</h2>
            </div>

            <div className="toolbar">
              <select id="funeralSelect">
                <option value="">Select a funeral...</option>
              </select>

              <input id="paymentSearch" placeholder="Search VN, name, surname or phone" />
            </div>

            <div className="filters">
              <button className="btn btn-light filter active" data-filter="">
                ALL
              </button>

              <button className="btn btn-green filter" data-filter="PAID">
                ✅ PAID
              </button>

              <button className="btn btn-red filter" data-filter="NOT PAID">
                ❌ NOT PAID
              </button>

              <button className="btn whatsapp" id="whatsappAll">
                📲 WhatsApp ALL NOT PAID
              </button>
            </div>

            <div className="toolbar" style={{ marginBottom: '10px' }}>
              <button className="btn btn-dark" id="pdfAll">PDF ALL</button>
              <button className="btn btn-green" id="pdfPaid">PDF PAID ONLY</button>
              <button className="btn btn-red" id="pdfNotPaid">PDF NOT PAID ONLY</button>
              <button className="btn btn-light" id="csvExport">CSV / Excel</button>
            </div>

            <div id="paymentSummary" className="small">
              Select a funeral to begin.
            </div>

            <div className="table-wrap" style={{ marginTop: '10px' }}>
              <table>
                <thead>
                  <tr>
                    <th>VN Number</th>
                    <th>Name</th>
                    <th>Surname</th>
                    <th>Phone</th>
                    <th>Payment Status</th>
                    <th>Date Paid</th>
                    <th>Action</th>
                  </tr>
                </thead>

                <tbody id="paymentBody">
                  <tr>
                    <td colSpan="7" className="empty">Select a funeral.</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* ========================== MEMBERS MANAGEMENT ========================== */}
          <section className="card">
            <div className="section-title">
              <h2>Members Management</h2>
              <span className="small"> 50 per page </span>
            </div>

            <div className="toolbar">
              <input id="memberSearch" placeholder="Search VN, name or phone" />
              <button className="btn btn-dark" id="refreshMembers">Refresh</button>
            </div>

            {/* ADD MEMBER */}
            <form id="memberForm" className="form-grid" style={{ margin: '10px 0' }}>
              <div>
                <label>VN Number</label>
                <input id="newVN" placeholder="VN501" required />
              </div>

              <div>
                <label>Name</label>
                <input id="newName" required />
              </div>

              <div>
                <label>Surname</label>
                <input id="newSurname" required />
              </div>

              <div>
                <label>Phone</label>
                <input id="newPhone" inputMode="tel" required />
              </div>

              <div>
                <label>Password</label>
                <input id="newPassword" defaultValue="1234" />
              </div>

              <div>
                <label>Status</label>
                <select id="newStatus">
                  <option>Active</option>
                  <option>Inactive</option>
                </select>
              </div>

              <div className="full">
                <button className="btn btn-primary" type="submit">Add Member</button>
              </div>
            </form>

            <div id="memberMessage" className="message"></div>

            {/* EDIT MEMBER */}
            <div id="editMemberPanel" className="edit-panel hidden">
              <div className="section-title">
                <h3>✏️ Edit Member</h3>

                <button type="button" className="btn btn-light" id="cancelEditMember">
                  Cancel
                </button>
              </div>

              <form id="editMemberForm" className="form-grid">
                <div>
                  <label>VN Number</label>
                  <input id="editVN" readOnly />
                </div>

                <div>
                  <label>Name</label>
                  <input id="editName" required />
                </div>

                <div>
                  <label>Surname</label>
                  <input id="editSurname" required />
                </div>

                <div>
                  <label>Phone</label>
                  <input id="editPhone" inputMode="tel" required />
                </div>

                <div>
                  <label>Status</label>
                  <select id="editStatus">
                    <option>Active</option>
                    <option>Inactive</option>
                  </select>
                </div>

                <div>
                  <label>Join Date</label>
                  <input id="editJoinDate" type="date" />
                </div>

                <div className="full">
                  <button className="btn btn-primary" type="submit">
                    💾 Save Changes
                  </button>
                </div>
              </form>
            </div>

            {/* MEMBERS TABLE */}
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>VN</th>
                    <th>Name</th>
                    <th>Surname</th>
                    <th>Phone</th>
                    <th>Status</th>
                    <th>Join Date</th>
                    <th>Action</th>
                  </tr>
                </thead>

                <tbody id="memberBody"></tbody>
              </table>
            </div>

            {/* DEPENDANTS MANAGEMENT */}
            <div id="dependentsPanel" className="edit-panel hidden" style={{ marginTop: '14px' }}>
              <div className="section-title">
                <div>
                  <h3>👨‍👩‍👧 Member Dependants</h3>
                  <div className="small" id="dependentMemberLabel"></div>
                </div>

                <button type="button" className="btn btn-light" id="closeDependents">
                  Close
                </button>
              </div>

              <form id="dependentForm" className="form-grid" style={{ marginTop: '10px' }}>
                <div>
                  <label>Name</label>
                  <input id="dependentName" required />
                </div>

                <div>
                  <label>Surname</label>
                  <input id="dependentSurname" required />
                </div>

                <div>
                  <label>Relationship</label>
                  <select id="dependentRelationship" required>
                    <option value="Wife">Wife</option>
                    <option value="Child">Child</option>
                  </select>
                </div>

                <div>
                  <label>Date of Birth</label>
                  <input id="dependentDob" type="date" required />
                  <div className="small" id="dependentDobHint">
                    For children, dependant must be 18 years old or younger.
                  </div>
                </div>

                <div>
                  <label>Status</label>
                  <select id="dependentStatus">
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>

                <div className="full">
                  <button className="btn btn-primary" type="submit" id="dependentSubmit">
                    Add Dependant
                  </button>
                </div>
              </form>

              <div id="dependentMessage" className="message"></div>

              <div className="table-wrap" style={{ marginTop: '10px', scrollMarginTop: '80px' }}>
                <table>
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Surname</th>
                      <th>Relationship</th>
                      <th>Date of Birth</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody id="dependentBody">
                    <tr>
                      <td colSpan="6" className="empty">
                        Select a member to manage dependants.
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* PAGINATION */}
            <div className="pagination">
              <button className="btn btn-light" id="prevPage">← Previous</button>
              <span id="pageInfo" className="small"> Page 1 </span>
              <button className="btn btn-light" id="nextPage">Next →</button>
            </div>
          </section>
        </div>
      </main>
    </>
  );
}

export default AdminDashboard;