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
      // Reset activity selector (keep placeholder)
      activitySelect.innerHTML = '<option value="">-- Select an activity --</option>';

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;

        // Build basic activity card
        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
          ${details.participants && details.participants.length ? `<div class="participants"><div class="participants-title">Participants</div><ul class="participants-list"></ul></div>` : `<p class="no-participants">No participants yet</p>`}
        `;

        // If there are participants, create list items with delete buttons
        if (details.participants && details.participants.length) {
          const ul = activityCard.querySelector('.participants-list');
          details.participants.forEach(p => {
            const li = document.createElement('li');
            const span = document.createElement('span');
            span.className = 'participant-email';
            span.textContent = p;

            const btn = document.createElement('button');
            btn.className = 'delete-participant';
            btn.dataset.activity = name;
            btn.dataset.email = p;
            btn.type = 'button';
            btn.textContent = '✕';

            li.appendChild(span);
            li.appendChild(btn);
            ul.appendChild(li);
          });
        }

        activitiesList.appendChild(activityCard);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
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
        messageDiv.className = "message success";
        signupForm.reset();
        // Refresh activities list to reflect the new participant without requiring a page reload
        fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "message error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "message error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Event delegation for delete/unregister buttons
  activitiesList.addEventListener('click', async (e) => {
    if (!e.target.classList.contains('delete-participant')) return;
    const activity = e.target.dataset.activity;
    const email = e.target.dataset.email;
    if (!activity || !email) return;
    if (!confirm(`Unregister ${email} from ${activity}?`)) return;

    try {
      const res = await fetch(`/activities/${encodeURIComponent(activity)}/unregister?email=${encodeURIComponent(email)}`, { method: 'POST' });
      const result = await res.json();
      if (res.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = 'message success';
        // Refresh the activities list so the removed participant disappears
        fetchActivities();
      } else {
        messageDiv.textContent = result.detail || 'Failed to unregister';
        messageDiv.className = 'message error';
      }
      messageDiv.classList.remove('hidden');
      setTimeout(() => messageDiv.classList.add('hidden'), 5000);
    } catch (err) {
      console.error('Error unregistering participant:', err);
      messageDiv.textContent = 'Failed to unregister. Please try again.';
      messageDiv.className = 'message error';
      messageDiv.classList.remove('hidden');
      setTimeout(() => messageDiv.classList.add('hidden'), 5000);
    }
  });

  // Initialize app
  fetchActivities();
});
