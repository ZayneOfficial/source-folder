fetch("/api/visits", {
  method: "POST",
  headers: {
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
    page: window.location.pathname
  })
}).catch(() => {});

const tabs = document.querySelectorAll(".tab");
tabs.forEach(tab => tab.addEventListener("click", () => {
  tabs.forEach(t => t.classList.remove("active"));
  tab.classList.add("active");
  document.getElementById("admin-login").classList.toggle("hidden", tab.dataset.tab !== "admin");
document.getElementById("member-login").classList.toggle("hidden", tab.dataset.tab !== "member");
document.getElementById("helper-login").classList.toggle("hidden", tab.dataset.tab !== "helper");
}));

const message = document.getElementById("loginMessage");
function showMessage(text, ok=false) {
  message.textContent = text;
  message.className = "message " + (ok ? "success" : "error");
}

document.getElementById("adminForm").addEventListener("submit", async e => {
  e.preventDefault();
  try {
    const res = await fetch("/api/login", {
      method: "POST",
      headers: {"Content-Type":"application/json"},
      body: JSON.stringify({
        email: adminEmail.value,
        password: adminPassword.value
      })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message);
    localStorage.setItem("session", JSON.stringify({ role:"admin", admin:data.admin }));
    location.href = "/admin.html";
  } catch (err) { showMessage(err.message); }
});

document.getElementById("memberForm").addEventListener("submit", async e => {
  e.preventDefault();
  try {
    const res = await fetch("/api/login", {
      method: "POST",
      headers: {"Content-Type":"application/json"},
     body: JSON.stringify({
  vn_number: memberVN.value.trim(),
  full_name: memberFullName.value.trim()
})
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message);
    localStorage.setItem("session", JSON.stringify({
      role:"member",
      member_id:data.member.member_id,
      vn_number:data.member.vn_number,
      member:data.member
    }));
    location.href = "/member.html";
  } catch (err) { showMessage(err.message); }
});

document.getElementById("helperForm").addEventListener("submit", async e => {
  e.preventDefault();

  try {
    const res = await fetch("/api/login", {
      method: "POST",
      headers: {"Content-Type":"application/json"},
      body: JSON.stringify({
        vn_number: helperVN.value,
        full_name: helperName.value,
        helper_password: helperPassword.value
      })
    });

    const data = await res.json();

    if (!res.ok) throw new Error(data.message);

    localStorage.setItem("session", JSON.stringify({
      role: "helper",
      helper_id: data.helper.helper_id,
      member_id: data.helper.member_id,
      vn_number: data.helper.vn_number,
      helper: data.helper
    }));

    location.href = "/helper.html";

  } catch (err) {
    showMessage(err.message);
  }
});

window.addEventListener("load", () => {
  const loader = document.getElementById("loadingScreen");

  setTimeout(() => {
    loader.style.opacity = "0";
    loader.style.transition = "opacity 0.4s ease";

    setTimeout(() => {
      loader.style.display = "none";
    }, 400);

  }, 300);
});