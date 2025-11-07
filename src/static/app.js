document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;

        // Build participants list (avatar initials + email + delete icon). If none, show a friendly prompt.
        const participants = details.participants || [];
        let participantsListHTML = "";
        if (participants.length) {
          participantsListHTML = "<ul class='participants-list'>";
          participants.forEach((p) => {
            // Derive simple initials from the part before the '@' (split on dots/underscores/dashes)
            const namePart = p.split("@")[0] || "";
            const initials = namePart
              .split(/[.\-_]/)
              .map((s) => (s[0] || "").toUpperCase())
              .slice(0, 2)
              .join("");
            participantsListHTML += `<li><span class="avatar">${initials}</span><span class="participant-email">${p}</span><span class="delete-icon" title="Remove" data-activity="${name}" data-email="${p}">&#128465;</span></li>`;
          });
          participantsListHTML += "</ul>";
        } else {
          participantsListHTML = `<ul class="no-participants"><li><span class="info">Be the first to sign up</span></li></ul>`;
        }

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
          <div class="participants">
            <h5>Participants</h5>
            ${participantsListHTML}
          </div>
        `;

        activitiesList.appendChild(activityCard);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);

        // Add event listeners for delete icons
        setTimeout(() => {
          const deleteIcons = activityCard.querySelectorAll(".delete-icon");
          deleteIcons.forEach((icon) => {
            icon.addEventListener("click", async (e) => {
              const activityName = icon.getAttribute("data-activity");
              const email = icon.getAttribute("data-email");
              if (confirm(`Remove ${email} from ${activityName}?`)) {
                try {
                  const response = await fetch(`/activities/${encodeURIComponent(activityName)}/unregister?email=${encodeURIComponent(email)}`, {
                    method: "POST",
                  });
                  const result = await response.json();
                  if (response.ok) {
                    messageDiv.textContent = result.message;
                    messageDiv.className = "success";
                    fetchActivities();
                  } else {
                    messageDiv.textContent = result.detail || "An error occurred";
                    messageDiv.className = "error";
                  }
                  messageDiv.classList.remove("hidden");
                  setTimeout(() => {
                    messageDiv.classList.add("hidden");
                  }, 5000);
                } catch (error) {
                  messageDiv.textContent = "Failed to unregister. Please try again.";
                  messageDiv.className = "error";
                  messageDiv.classList.remove("hidden");
                }
              }
            });
          });
        }, 0);
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        signupForm.reset();
        fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  fetchActivities();
});
