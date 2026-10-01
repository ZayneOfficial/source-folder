const session = JSON.parse(localStorage.getItem("session") || "null");

      if (!session || session.role !== "helper") {
        location.href = "/";
      }

      const $ = (id) => document.getElementById(id);

      function esc(v) {
        return String(v ?? "").replace(
          /[&<>"']/g,
          (c) =>
            ({
              "&": "&amp;",
              "<": "&lt;",
              ">": "&gt;",
              '"': "&quot;",
              "'": "&#39;",
            })[c],
        );
      }

      function message(el, text, ok = false) {
        el.textContent = text;
        el.className = "message " + (ok ? "success" : "error");
      }

      $("helperHeader").textContent =
        `${session.vn_number} · ${session.helper.name} ${session.helper.surname}`;

      $("logoutBtn").onclick = async () => {
        try {
          await fetch("/api/logout", { method: "POST" });
        } catch (e) {}
        localStorage.removeItem("session");
        location.href = "/";
      };

      /* --------------------------------------------------
   LOAD FUNERALS
-------------------------------------------------- */

      async function loadFunerals() {
        try {
          const res = await fetch("/api/funerals");
          const data = await res.json();

          if (!res.ok) {
            throw new Error(data.message || "Could not load funerals.");
          }

          $("funeralSelect").innerHTML =
            `<option value="">Select a funeral...</option>` +
            data.funerals
              .map(
                (f) => `
        <option value="${esc(f._id)}">
          ${esc(f.deceased_name)}
          -
          ${new Date(f.funeral_date).toLocaleDateString("en-ZA")}
        </option>
      `,
              )
              .join("");
        } catch (err) {
          message($("helperMessage"), err.message);
        }
      }

      /* --------------------------------------------------
   LOAD PAYMENTS
-------------------------------------------------- */

      async function loadPayments() {
        const funeralId = $("funeralSelect").value;

        if (!funeralId) {
          $("paymentBody").innerHTML = `
      <tr>
        <td colspan="6" class="empty">
          Select a funeral.
        </td>
      </tr>
    `;

          $("paymentSummary").textContent = "Select a funeral to begin.";

          return;
        }

        try {
          const search = $("memberSearch").value.trim();

          const url =
            `/api/payments/${encodeURIComponent(funeralId)}` +
            `?search=${encodeURIComponent(search)}`;
          const res = await fetch(url);
          const data = await res.json();

          if (!res.ok) {
            throw new Error(data.message || "Could not load payments.");
          }

          const payments = data.payments || [];

          const paid = payments.filter((p) => p.status === "PAID").length;

          const notPaid = payments.filter(
            (p) => p.status === "NOT PAID",
          ).length;

          $("paymentSummary").textContent =
            `Showing ${payments.length} members · ` +
            `PAID: ${paid} · NOT PAID: ${notPaid}`;

          $("paymentBody").innerHTML =
            payments
              .map(
                (p) => `

        <tr>

          <td>
            <b>${esc(p.vn_number)}</b>
          </td>

          <td>${esc(p.name)}</td>

          <td>${esc(p.surname)}</td>

          <td>${esc(p.phone)}</td>

          <td>
            ${
              p.status === "PAID"
                ? '<span class="badge paid">✅ PAID</span>'
                : '<span class="badge not-paid">❌ NOT PAID</span>'
            }
          </td>

          <td>

            <button
              class="btn btn-green mark-payment"
              data-id="${esc(p._id)}"
              data-status="PAID"
              ${p.status === "PAID" ? "disabled" : ""}
            >
              Mark PAID
            </button>

            <button
              class="btn btn-red mark-payment"
              data-id="${esc(p._id)}"
              data-status="NOT PAID"
              ${p.status === "NOT PAID" ? "disabled" : ""}
            >
              Mark NOT PAID
            </button>

          </td>

        </tr>

      `,
              )
              .join("") ||
            `

        <tr>
          <td colspan="6" class="empty">
            No members found.
          </td>
        </tr>

      `;
        } catch (err) {
          message($("helperMessage"), err.message);
        }
      }

      /* --------------------------------------------------
   EVENTS
-------------------------------------------------- */

      $("funeralSelect").addEventListener("change", loadPayments);

      let searchTimer;

      $("memberSearch").addEventListener("input", () => {
        clearTimeout(searchTimer);

        searchTimer = setTimeout(loadPayments, 300);
      });

      /* --------------------------------------------------
   SUBMIT PAYMENT CHANGE
-------------------------------------------------- */

      $("paymentBody").addEventListener("click", async (e) => {
        const btn = e.target.closest(".mark-payment");

        if (!btn || btn.disabled) return;

        const paymentId = btn.dataset.id;

        const newStatus = btn.dataset.status;

        if (
          !confirm(
            `Submit this payment as ${newStatus}?\n\n` +
              `The change will remain PENDING until the main admin approves it.`,
          )
        ) {
          return;
        }

        btn.disabled = true;

        try {
          const res = await fetch("/api/payment-change-requests", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },

            body: JSON.stringify({
              payment_id: paymentId,

              new_status: newStatus,

              helper_id: session.helper_id,
            }),
          });

          const data = await res.json();

          if (!res.ok) {
            throw new Error(data.message || "Could not submit payment change.");
          }

          message(
            $("helperMessage"),
            "Payment change submitted and is now PENDING admin approval.",
            true,
          );

          await loadPayments();
        } catch (err) {
          message($("helperMessage"), err.message);

          btn.disabled = false;
        }
      });

      loadFunerals();