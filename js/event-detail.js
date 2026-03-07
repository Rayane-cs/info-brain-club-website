;(function () {
  "use strict";

  function getEventIdFromUrl() {
    var params = new URLSearchParams(window.location.search);
    return params.get("id");
  }

  function setText(id, value) {
    var el = document.getElementById(id);
    if (el) {
      el.textContent = value;
    }
  }

  function updateSeatsUI(taken, total) {
    var takenEl = document.getElementById("taken-seats");
    var totalEl = document.getElementById("total-seats");
    var progressEl = document.getElementById("seats-progress");

    if (takenEl) takenEl.textContent = String(taken);
    if (totalEl) totalEl.textContent = String(total);

    var percent = total > 0 ? (taken / total) * 100 : 0;
    if (progressEl) {
      progressEl.style.width = percent + "%";
    }
  }

  function showError(message) {
    var el = document.getElementById("event-error");
    if (!el) return;
    el.textContent = message;
    el.hidden = false;
  }

  async function loadEventAndWireRegistration() {
    var eventId = getEventIdFromUrl();
    var registerBtn = document.getElementById("register-btn");

    if (!eventId) {
      showError("Invalid event link.");
      if (registerBtn) registerBtn.disabled = true;
      return;
    }

    var totalSeats = 0;
    var takenSeats = 0;
    var currentEvent = null;

    if (typeof getSupabaseClient !== "function") {
      showError("Cannot load event data (Supabase client missing).");
      if (registerBtn) registerBtn.disabled = true;
      return;
    }

    try {
      var client = await getSupabaseClient();
      var resp = await client
        .from("events")
        .select("id,title,description,location,event_date,event_time,category,image_url,capacity,regis_user")
        .eq("id", eventId)
        .single();

      if (resp.error || !resp.data) {
        throw resp.error || new Error("Event not found");
      }

      currentEvent = resp.data;

      // Fill header
      setText("event-title", currentEvent.title || "Event");
      setText("event-category-pill", currentEvent.category || "Event");

      var shortDesc = currentEvent.description || "";
      setText("event-description", shortDesc);
      setText("event-long-description", shortDesc);

      setText("event-date-text", currentEvent.event_date || "Date TBA");
      setText("event-time-text", currentEvent.event_time || "Time TBA");
      setText("event-location-text", currentEvent.location || "Location TBA");

      var img = document.getElementById("event-image");
      if (img && currentEvent.image_url) {
        img.src = currentEvent.image_url;
      }

      var chip = document.getElementById("event-chip-text");
      if (chip) {
        chip.textContent = currentEvent.category || "Upcoming";
      }

      totalSeats = typeof currentEvent.capacity === "number" ? currentEvent.capacity : 0;
      takenSeats = typeof currentEvent.regis_user === "number" ? currentEvent.regis_user : 0;
      updateSeatsUI(takenSeats, totalSeats);
    } catch (e) {
      console.error("Error loading event:", e);
      showError("Could not load this event.");
      if (registerBtn) registerBtn.disabled = true;
      return;
    }

    async function handleRegisterClick() {
      if (typeof redirectIfGuest === "function") {
        var allowed = await redirectIfGuest();
        if (!allowed) return;
      }

      if (takenSeats >= totalSeats && totalSeats > 0) {
        if (typeof showNotification === "function") {
          showNotification("This event is full.", "warning");
        }
        return;
      }

      try {
        var client = await getSupabaseClient();
        var userResp = await client.auth.getUser();
        var user = userResp && userResp.data ? userResp.data.user : null;

        if (!user) {
          if (typeof showNotification === "function") {
            showNotification("You must sign in first", "warning");
          }
          setTimeout(function () {
            window.location.href = "/index.html";
          }, 800);
          return;
        }

        // Prevent duplicate registrations
        var existingResp = await client
          .from("event_registrations")
          .select("id", { count: "exact", head: true })
          .eq("event_id", currentEvent.id)
          .eq("user_id", user.id);

        if (!existingResp.error && existingResp.count > 0) {
          if (typeof showNotification === "function") {
            showNotification("You are already registered for this event.", "info");
          }
          return;
        }

        var insertResp = await client
          .from("event_registrations")
          .insert({
            event_id: currentEvent.id,
            user_id: user.id
          });

        if (insertResp.error) {
          throw insertResp.error;
        }

        takenSeats += 1;

        // Sync regis_user column
        try {
          await client
            .from("events")
            .update({ regis_user: takenSeats })
            .eq("id", currentEvent.id);
        } catch (syncError) {
          console.error("Error updating regis_user for event:", syncError);
        }

        updateSeatsUI(takenSeats, totalSeats);

        var msg = "You have registered for this event.";
        if (typeof showNotification === "function") {
          showNotification(msg, "success");
        } else {
          alert(msg);
        }
      } catch (err) {
        console.error("Error registering for event:", err);
        if (typeof showNotification === "function") {
          showNotification("Could not complete registration.", "error");
        }
      }
    }

    if (registerBtn) {
      registerBtn.addEventListener("click", handleRegisterClick);
    }
  }

  // Kick off
  loadEventAndWireRegistration();
})();

