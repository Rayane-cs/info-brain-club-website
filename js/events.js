;(function () {
  "use strict";

  // Calendar filter buttons (visual only for now)
  var filterButtons = document.querySelectorAll(".calendar-filters .filter-btn");

  filterButtons.forEach(function (btn) {
    btn.addEventListener("click", function () {
      filterButtons.forEach(function (b) {
        b.classList.remove("active");
      });
      btn.classList.add("active");
    });
  });

  // Handle calendar day clicks
  var days = document.querySelectorAll(".calendar-grid .day");

  days.forEach(function (day) {
    day.addEventListener("click", function () {
      var eventName = day.getAttribute("data-event");
      if (eventName) {
        if (typeof showNotification === "function") {
          showNotification("Event on this day: " + eventName, "info");
        } else {
          alert("Event on this day: " + eventName);
        }
      } else {
        if (typeof showNotification === "function") {
          showNotification("No event scheduled on this day.", "info");
        } else {
          alert("No event on this day.");
        }
      }
    });
  });

  function getEventDetailUrl(evt) {
    if (!evt || !evt.id) return "/pages/events.html";
    return "/pages/event-detail.html?id=" + encodeURIComponent(evt.id);
  }

  function renderEventCard(evt) {
    var dateText = evt.event_date || "";
    var taken = typeof evt.regis_user === "number" ? evt.regis_user : 0;
    var capacityText = typeof evt.capacity === "number" ? String(evt.capacity) : "—";
    var seatsText = evt.capacity ? "Seats: " + taken + " / " + capacityText : "";
    var category = evt.category || "Event";
    var img = evt.image_url ||
      "https://images.unsplash.com/photo-1559136555-9303baea8ebd?auto=format&w=800";

    var detailsUrl = getEventDetailUrl(evt);

    return (
      '<div class="event-card" data-event="' + (evt.title || "") + '">' +
      '  <div class="event-image">' +
      '    <img src="' + img + '" alt="' + (evt.title || "Event") + '">' +
      (dateText
        ? '    <div class="date-badge">' + dateText + "</div>"
        : "") +
      "  </div>" +
      '  <div class="event-content">' +
      '    <span class="cat-tag">' + category + "</span>" +
      '    <h3 class="event-title">' + (evt.title || "Event") + "</h3>" +
      (seatsText
        ? '    <p class="event-seats">' + seatsText + "</p>"
        : "") +
      '    <a href="' + detailsUrl + '" class="event-link">View details</a>' +
      '    <a href="' + detailsUrl + '" class="event-register-btn">Register</a>' +
      "  </div>" +
      "</div>"
    );
  }

  function updateNextEventCard(evt) {
    var titleEl = document.querySelector(".next-event-title-row h2");
    var seatsLabel = document.querySelector(".next-event-card .seats-label");
    var metaItems = document.querySelectorAll(".next-event-card .meta-item span:last-child");

    if (!evt || !titleEl || !seatsLabel || metaItems.length < 2) return;

    titleEl.textContent = evt.title || "Next Event";

    var taken = typeof evt.regis_user === "number" ? evt.regis_user : 0;
    var capacityText = typeof evt.capacity === "number" ? String(evt.capacity) : "—";
    seatsLabel.innerHTML = "Seats: <strong>" + taken + " / " + capacityText + "</strong>";

    if (evt.event_date) {
      metaItems[0].textContent = evt.event_date + (evt.event_time ? " · " + evt.event_time : "");
    }
    if (evt.location) {
      metaItems[1].textContent = evt.location;
    }
  }

  async function loadEvents() {
    var grid = document.querySelector(".upcoming-grid");
    if (!grid) return;

    // Fallback: if Supabase helpers are not available, keep static HTML
    if (typeof getSupabaseClient !== "function") {
      return;
    }

    grid.innerHTML =
      '<p style="grid-column:1/-1;text-align:center;padding:32px 0;color:#6b7280;font-size:0.95rem;">Loading events...</p>';

    try {
      var client = await getSupabaseClient();
      var response = await client
        .from("events")
        .select("id,title,description,location,event_date,event_time,category,image_url,capacity,regis_user")
        .order("event_date", { ascending: true })
        .order("event_time", { ascending: true });

      if (response.error) {
        throw response.error;
      }

      var events = response.data || [];
      if (!events.length) {
        grid.innerHTML =
          '<p style="grid-column:1/-1;text-align:center;padding:32px 0;color:#6b7280;font-size:0.95rem;">No events published yet.</p>';
        return;
      }

      // Use the first event as "next event"
      var nextEvent = events[0];
      updateNextEventCard(nextEvent);

      grid.innerHTML = events.map(renderEventCard).join("");

      // Wire the main CTA to the next event details
      var nextEventRegisterBtn = document.getElementById("next-event-register");
      if (nextEventRegisterBtn && nextEvent) {
        var nextUrl = getEventDetailUrl(nextEvent);
        nextEventRegisterBtn.onclick = function () {
          window.location.href = nextUrl;
        };
      }
    } catch (e) {
      console.error("Error loading events:", e);
      grid.innerHTML =
        '<p style="grid-column:1/-1;text-align:center;padding:32px 0;color:#b91c1c;font-size:0.95rem;">Could not load events.</p>';
    }
  }

  loadEvents();
})();
