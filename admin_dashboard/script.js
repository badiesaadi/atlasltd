// Import Supabase functions from the CDN
import { createClient } from 'https://esm.sh/@supabase/supabase-js';

// Supabase configuration
const supabaseUrl = 'https://ilinrjsoxjedgqhryvwy.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlsaW5yanNveGplZGdxaHJ5dnd5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ3OTQyNzMsImV4cCI6MjA2MDM3MDI3M30.YZRTgSGK6L_rJPYqPKcawT7KlR5c9MRMj6fyHIHmzOc';
const supabase = createClient(supabaseUrl, supabaseKey);

console.log("Supabase initialized");

// DOM elements
const loginSection = document.getElementById("login-section");
const dashboard = document.getElementById("dashboard");
const loginBtn = document.getElementById("login-btn");
const logoutBtn = document.getElementById("logout-btn");
const status = document.getElementById("login-status");
const messagesBody = document.getElementById("messages-body");
const modal = document.getElementById("message-modal");
const closeModalBtn = document.querySelector(".close-button");
const searchBar = document.getElementById("search-bar");
const transportFilter = document.getElementById("transport-filter");
const exportCsvBtn = document.getElementById("export-csv");

// Function to show toast
function showToast(message) {
  const toast = document.getElementById("toast");
  toast.textContent = message;
  toast.style.display = "block";
  setTimeout(() => {
    toast.style.display = "none";
  }, 3000);
}

// Login
loginBtn.addEventListener("click", async () => {
  const email = document.getElementById("admin-email").value;
  const password = document.getElementById("admin-password").value;

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      throw error;
    }

    status.textContent = "Logged in!";
    status.style.color = "green";
  } catch (error) {
    console.error("Login error:", error);
    showToast("Login failed: " + error.message);
  }
});

// Logout
logoutBtn.addEventListener("click", async () => {
  await supabase.auth.signOut();
  loginSection.style.display = "block";
  dashboard.style.display = "none";
});

// Watch auth state
supabase.auth.onAuthStateChange((event, session) => {
  if (event === "SIGNED_IN") {
    loginSection.style.display = "none";
    dashboard.style.display = "block";
    loadMessages();
  } else if (event === "SIGNED_OUT") {
    loginSection.style.display = "block";
    dashboard.style.display = "none";
  }
});

let allMessages = [];

// Load messages
async function loadMessages() {
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('archived', false) // Only fetch non-archived messages
    .order('timestamp', { ascending: false });

  if (error) {
    console.error("Error fetching messages:", error);
    messagesBody.innerHTML = `<tr><td colspan="10">Failed to load messages.</td></tr>`;
    return;
  }

  if (!data || data.length === 0) {
    messagesBody.innerHTML = `<tr><td colspan="10">No messages found.</td></tr>`;
    return;
  }

  allMessages = data;
  updateTable(allMessages);
  updateKPIs(allMessages);
  updateChart(allMessages);
}

// Update table with messages
function updateTable(messages) {
  messagesBody.innerHTML = "";

  messages.forEach((message) => {
    const row = document.createElement("tr");
    row.dataset.message = JSON.stringify(message);

    // Click to show modal (excluding action buttons)
    row.addEventListener("click", function(e) {
      if (!e.target.classList.contains("action-btn")) {
        showMessageModal(message);
      }
    });

    row.innerHTML = `
      <td>${message.name || ""}</td>
      <td>${message.email || ""}</td>
      <td>${message.phone || ""}</td>
      <td>${message.weight || ""}</td>
      <td>${message.departure || ""}</td>
      <td>${message.delivery || ""}</td>
      <td>${message.transportation || ""}</td>
      <td>${truncateText(message.message || "", 30)}</td>
      <td>${message.timestamp ? new Date(message.timestamp).toLocaleString() : ""}</td>
      <td>
        <button class="action-btn reply-btn" data-email="${message.email}" data-name="${message.name}">Reply</button>
        <button class="action-btn archive-btn" data-id="${message.id}">Archive</button>
      </td>
    `;

    messagesBody.appendChild(row);
  });
}

// Update KPI cards
function updateKPIs(messages) {
  // Total inquiries
  document.getElementById('total-inquiries').textContent = messages.length;

  // Transportation stats
  const transportCounts = { freight: 0, air: 0, road: 0 };
  messages.forEach(msg => {
    if (msg.transportation in transportCounts) {
      transportCounts[msg.transportation]++;
    }
  });
  const total = messages.length || 1;
  document.getElementById('transport-stats').textContent = `
    Air: ${(transportCounts.air / total * 100).toFixed(1)}%,
    Freight: ${(transportCounts.freight / total * 100).toFixed(1)}%,
    Road: ${(transportCounts.road / total * 100).toFixed(1)}%
  `;

  // Average weight
  let totalWeight = 0;
  let weightCount = 0;
  messages.forEach(msg => {
    if (msg.weight !== "Not provided") {
      const weights = msg.weight.split(/\s+/).map(Number);
      weights.forEach(w => {
        if (!isNaN(w)) {
          totalWeight += w;
          weightCount++;
        }
      });
    }
  });
  const avgWeight = weightCount ? (totalWeight / weightCount).toFixed(2) : 0;
  document.getElementById('avg-weight').textContent = avgWeight;
}

// Update bar chart
function updateChart(messages) {
  const ctx = document.getElementById('inquiries-chart').getContext('2d');
  const dailyCounts = {};

  // Group messages by date (YYYY-MM-DD)
  messages.forEach(msg => {
    const date = new Date(msg.timestamp).toISOString().split('T')[0];
    dailyCounts[date] = (dailyCounts[date] || 0) + 1;
  });

  const labels = Object.keys(dailyCounts).sort();
  const data = labels.map(date => dailyCounts[date]);

  // Destroy existing chart if it exists
  if (window.inquiriesChart) {
    window.inquiriesChart.destroy();
  }

  window.inquiriesChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [{
        label: 'Inquiries per Day',
        data: data,
        backgroundColor: 'rgba(99, 102, 241, 0.6)',
        borderColor: 'rgba(99, 102, 241, 1)',
        borderWidth: 1
      }]
    },
    options: {
      scales: {
        y: {
          beginAtZero: true,
          title: {
            display: true,
            text: 'Number of Inquiries'
          }
        },
        x: {
          title: {
            display: true,
            text: 'Date'
          }
        }
      },
      plugins: {
        legend: {
          display: false
        }
      }
    }
  });
}

// Search and filter
searchBar.addEventListener('input', () => {
  const query = searchBar.value.toLowerCase();
  const transport = transportFilter.value;

  const filtered = allMessages.filter(msg =>
    (msg.name.toLowerCase().includes(query) ||
     msg.email.toLowerCase().includes(query) ||
     msg.departure.toLowerCase().includes(query) ||
     msg.delivery.toLowerCase().includes(query)) &&
    (transport ? msg.transportation === transport : true)
  );
  updateTable(filtered);
  updateKPIs(filtered);
  updateChart(filtered);
});

transportFilter.addEventListener('change', () => {
  const query = searchBar.value.toLowerCase();
  const transport = transportFilter.value;

  const filtered = allMessages.filter(msg =>
    (msg.name.toLowerCase().includes(query) ||
     msg.email.toLowerCase().includes(query) ||
     msg.departure.toLowerCase().includes(query) ||
     msg.delivery.toLowerCase().includes(query)) &&
    (transport ? msg.transportation === transport : true)
  );
  updateTable(filtered);
  updateKPIs(filtered);
  updateChart(filtered);
});

// Sorting
document.querySelectorAll('th[data-sort]').forEach(header => {
  header.addEventListener('click', () => {
    const field = header.dataset.sort;
    const isAsc = header.classList.toggle('sort-asc');
    const isDesc = !isAsc;

    const sortedMessages = [...allMessages].sort((a, b) => {
      let valA = a[field] || '';
      let valB = b[field] || '';
      
      if (field === 'timestamp') {
        valA = new Date(valA).getTime();
        valB = new Date(valB).getTime();
      } else if (field === 'weight') {
        valA = parseFloat(valA.split(/\s+/)[0]) || 0;
        valB = parseFloat(valB.split(/\s+/)[0]) || 0;
      }

      if (isAsc) {
        return valA > valB ? 1 : -1;
      } else {
        return valA < valB ? 1 : -1;
      }
    });

    updateTable(sortedMessages);
  });
});

// Export to CSV
exportCsvBtn.addEventListener('click', async () => {
  const { data, error } = await supabase.from('messages').select('*').eq('archived', false);
  if (error) {
    showToast("Error exporting messages: " + error.message);
    return;
  }

  const csv = [
    ['Name', 'Email', 'Phone', 'Weight', 'Departure', 'Delivery', 'Transportation', 'Message', 'Timestamp'],
    ...data.map(msg => [
      msg.name,
      msg.email,
      msg.phone,
      msg.weight,
      msg.departure,
      msg.delivery,
      msg.transportation,
      msg.message,
      msg.timestamp
    ])
  ].map(row => row.join(',')).join('\n');

  const blob = new Blob([csv], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.setAttribute('href', url);
  a.setAttribute('download', 'messages.csv');
  a.click();
});

// Reply button handler
document.addEventListener('click', (e) => {
  if (e.target.classList.contains('reply-btn')) {
    const email = e.target.dataset.email;
    const name = e.target.dataset.name;
    window.location.href = `mailto:${email}?subject=Re: Inquiry from ${name}`;
  }
});

// Archive button handler
document.addEventListener('click', async (e) => {
  if (e.target.classList.contains('archive-btn')) {
    const id = e.target.dataset.id;
    const { error } = await supabase
      .from('messages')
      .update({ archived: true })
      .eq('id', id);

    if (error) {
      showToast("Error archiving message: " + error.message);
    } else {
      showToast("Message archived successfully!");
      loadMessages();
    }
  }
});

// Function to truncate text for table display
function truncateText(text, maxLength) {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + "...";
}

// Function to show message modal
function showMessageModal(message) {
  document.getElementById("modal-name").textContent = message.name || "";
  document.getElementById("modal-email").textContent = message.email || "";
  document.getElementById("modal-phone").textContent = message.phone || "";
  document.getElementById("modal-weight").textContent = message.weight || "";
  document.getElementById("modal-departure").textContent = message.departure || "";
  document.getElementById("modal-delivery").textContent = message.delivery || "";
  document.getElementById("modal-transportation").textContent = message.transportation || "";
  document.getElementById("modal-message").textContent = message.message || "";
  document.getElementById("modal-timestamp").textContent = message.timestamp ? new Date(message.timestamp).toLocaleString() : "";
  modal.style.display = "block";
}

// Close modal when clicking the X button
closeModalBtn.addEventListener("click", () => {
  modal.style.display = "none";
});

// Close modal when clicking outside of it
window.addEventListener("click", (event) => {
  if (event.target === modal) {
    modal.style.display = "none";
  }
});

// Real-time updates for messages
const messagesSubscription = supabase
  .channel('custom-all-channel')
  .on(
    'postgres_changes',
    { event: '*', schema: 'public', table: 'messages' },
    (payload) => {
      console.log('Change received!', payload);
      loadMessages();
    }
  )
  .subscribe();

// Cleanup subscription on page unload
window.addEventListener('beforeunload', () => {
  messagesSubscription.unsubscribe();
});