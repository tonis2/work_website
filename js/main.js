// Contact form: submit via fetch, show inline status. Falls back to a normal
// POST (handled server-side) if JS is disabled.
(function () {
  var form = document.getElementById("contact-form");
  var status = document.getElementById("form-status");
  if (!form || !status) return;

  form.addEventListener("submit", function (e) {
    e.preventDefault();

    var btn = form.querySelector("button[type=submit]");
    var data = {
      name: form.name.value.trim(),
      email: form.email.value.trim(),
      message: form.message.value.trim(),
      website: form.website.value // honeypot
    };

    if (!data.name || !data.email || !data.message) {
      setStatus("err", "Please fill in all fields.");
      return;
    }

    btn.disabled = true;
    setStatus("", "Sending…");

    fetch(form.action, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    })
      .then(function (res) { return res.json().catch(function () { return {}; }).then(function (body) { return { ok: res.ok, body: body }; }); })
      .then(function (r) {
        if (r.ok) {
          form.reset();
          setStatus("ok", "Message sent — you'll hear back within one business day.");
        } else {
          setStatus("err", r.body.error || "Something went wrong. Email us directly instead.");
        }
      })
      .catch(function () {
        setStatus("err", "Network error. Email us directly instead.");
      })
      .finally(function () {
        btn.disabled = false;
      });
  });

  function setStatus(kind, msg) {
    status.className = "form-status" + (kind ? " " + kind : "");
    status.textContent = msg;
  }
})();
