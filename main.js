/* Bill The Max — shared scripts */
(function () {
  "use strict";

  // ----- Mobile nav toggle -----
  var toggle = document.querySelector(".nav-toggle");
  var links = document.getElementById("nav-links");
  if (toggle && links) {
    toggle.addEventListener("click", function () {
      var open = links.classList.toggle("open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
    // Close menu when a link is clicked (mobile)
    links.addEventListener("click", function (e) {
      if (e.target.tagName === "A") {
        links.classList.remove("open");
        toggle.setAttribute("aria-expanded", "false");
      }
    });
  }

  // ----- Set current year in footer -----
  var yr = document.getElementById("year");
  if (yr) { yr.textContent = new Date().getFullYear(); }

  // ----- Contact form: AJAX submit to FormSubmit -----
  var form = document.getElementById("consult-form");
  if (form) {
    var endpoint = "https://formsubmit.co/ajax/b447a53f383b66d0dfea95539dd438a6";

    // Status message element (created once, inserted after the submit button)
    var status = document.createElement("p");
    status.className = "form-status";
    status.setAttribute("role", "status");
    status.setAttribute("aria-live", "polite");
    status.style.display = "none";
    var submitBtn = form.querySelector('button[type="submit"], [type="submit"]');
    if (submitBtn) {
      submitBtn.insertAdjacentElement("afterend", status);
    } else {
      form.appendChild(status);
    }

    function setStatus(message, ok) {
      status.textContent = message;
      status.style.display = "block";
      status.style.marginTop = "12px";
      status.style.fontWeight = "600";
      status.style.color = ok ? "#1f9d6b" : "#d24b4b";
    }

    form.addEventListener("submit", function (e) {
      e.preventDefault();

      // Honeypot — if a bot filled the hidden field, silently stop.
      var honey = form.querySelector('[name="_honey"]');
      if (honey && honey.value) { return; }

      var originalLabel = submitBtn ? submitBtn.textContent : "";
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = "Sending…";
      }
      status.style.display = "none";

      var payload = new FormData(form);

      // Make sure the person's address reaches the inbox in a usable form.
      // 1. _replyto sets the notification's Reply-To, so "Reply" goes to them, not FormSubmit.
      // 2. The address also goes into the subject line, so it's visible in the inbox list
      //    without having to open the message and read the field table.
      var emailField = form.querySelector('[name="email"]');
      var senderEmail = emailField && emailField.value ? emailField.value.trim() : "";
      var nameField = form.querySelector('[name="Full name"]');
      var senderName = nameField && nameField.value ? nameField.value.trim() : "";

      if (senderEmail) {
        payload.set("_replyto", senderEmail);
        payload.set(
          "_subject",
          "New consultation request — " +
            (senderName ? senderName + " — " : "") +
            senderEmail
        );
      }

      fetch(endpoint, {
        method: "POST",
        headers: { "Accept": "application/json" },
        body: payload
      })
        .then(function (res) {
          return res.json().catch(function () { return {}; }).then(function (data) {
            return { ok: res.ok, data: data };
          });
        })
        .then(function (result) {
          // FormSubmit answers 200 even when it refuses the submission (e.g. an
          // unactivated form), so res.ok alone would show a green "sent" message while
          // nothing was delivered. The real verdict is the "success" field, which comes
          // back as the string "true" rather than a boolean.
          var succeeded =
            result.ok &&
            result.data &&
            String(result.data.success).toLowerCase() === "true";

          if (succeeded) {
            form.reset();
            setStatus("Thanks! Your request has been sent — we'll reply within one business day.", true);
          } else {
            var msg = (result.data && result.data.message) ? result.data.message : "";
            setStatus("Sorry, something went wrong sending your message. Please email info@billthemax.com directly." + (msg ? " (" + msg + ")" : ""), false);
          }
        })
        .catch(function () {
          setStatus("Sorry, we couldn't send your message. Please email info@billthemax.com directly.", false);
        })
        .then(function () {
          if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = originalLabel;
          }
        });
    });
  }
})();
