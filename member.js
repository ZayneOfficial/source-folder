const session=JSON.parse(localStorage.getItem("session")||"null");
if(!session||session.role!=="member")location.href="/";
const $=id=>document.getElementById(id);
function esc(v){return String(v??"").replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function d(v){return v?new Date(v).toLocaleDateString("en-ZA"):"—"}
function money(n){return "R"+Number(n||0).toLocaleString("en-ZA",{minimumFractionDigits:2,maximumFractionDigits:2})}
$("logoutBtn").onclick=async()=>{try{await fetch("/api/logout",{method:"POST"});}catch(e){} localStorage.removeItem("session");location.href="/"};
async function load(){
  const res=await fetch("/api/member-payments/"+encodeURIComponent(session.vn_number));
  const data=await res.json();
  if(!res.ok){alert(data.message||"Could not load account.");return}
  const m=data.member;
  $("memberHeader").textContent=`${m.vn_number} · ${m.name} ${m.surname}`;
  $("details").innerHTML=[
    ["VN Number",m.vn_number],["Name",`${m.name} ${m.surname}`],["Phone",m.phone],
    ["Join Date",d(m.join_date)],["Status",m.status]
  ].map(x=>`<div class="info-box">${esc(x[0])}<b>${esc(x[1])}</b></div>`).join("");
  $("dependentBody").innerHTML=(data.dependents||[]).map(dep=>`
    <tr>
      <td><b>${esc(dep.name)}</b></td>
      <td>${esc(dep.surname)}</td>
      <td>${esc(dep.relationship)}</td>
      <td>${d(dep.date_of_birth)}</td>
      <td>${esc(dep.status)}</td>
    </tr>`).join("") || `<tr><td colspan="5" class="empty">No dependants registered.</td></tr>`;

  $("paymentBody").innerHTML=data.payments.map(p=>`
    <tr><td><b>${esc(p.funeral_deceased_name)}</b> - ${d(p.funeral_date)}</td>
    <td>${money(p.contribution_amount)}</td>
    <td>${p.status==="PAID"?'<span class="badge paid">✅ PAID</span>':'<span class="badge not-paid">❌ NOT PAID</span>'}</td>
    <td>${d(p.payment_date)}</td></tr>`).join("")||`<tr><td colspan="4" class="empty">No funeral contributions yet.</td></tr>`;
}
load();