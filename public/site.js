const visitsEl = document.getElementById('visits');
const lastVisitEl = document.getElementById('lastVisit');
const statusEl = document.getElementById('status');
const messageFormEl = document.getElementById('messageForm');
const messageInputEl = document.getElementById('messageInput');
const messagesListEl = document.getElementById('messagesList');

async function loadStats() {
  try {
    const response = await fetch('/api/stats');
    if (!response.ok) {
      throw new Error(`Request failed with status ${response.status}`);
    }

    const data = await response.json();
    visitsEl.textContent = String(data.totalVisits);
    lastVisitEl.textContent = new Date(data.lastVisitAt).toLocaleString();
    statusEl.textContent = `Cached in Redis for ${data.cacheTtlSeconds}s`;
  } catch (error) {
    statusEl.textContent = `Could not load stats: ${error.message}`;
  }
}

async function loadMessages() {
  try {
    const response = await fetch('/api/messages');
    if (!response.ok) {
      throw new Error(`Request failed with status ${response.status}`);
    }

    const messages = await response.json();
    messagesListEl.innerHTML = '';

    if (!messages.length) {
      const li = document.createElement('li');
      li.className = 'empty';
      li.textContent = 'No saved messages yet.';
      messagesListEl.appendChild(li);
      return;
    }

    for (const message of messages) {
      const li = document.createElement('li');
      const savedAt = new Date(message.createdAt).toLocaleString();
      li.innerHTML = `<span class="text"></span><span class="saved-at">${savedAt}</span>`;
      li.querySelector('.text').textContent = message.text;
      messagesListEl.appendChild(li);
    }
  } catch (error) {
    statusEl.textContent = `Could not load messages: ${error.message}`;
  }
}

messageFormEl.addEventListener('submit', async (event) => {
  event.preventDefault();
  const text = messageInputEl.value.trim();
  if (!text) {
    return;
  }

  try {
    const response = await fetch('/api/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text }),
    });

    if (!response.ok) {
      throw new Error(`Save failed with status ${response.status}`);
    }

    messageInputEl.value = '';
    await loadMessages();
    statusEl.textContent = 'Saved to PostgreSQL successfully.';
  } catch (error) {
    statusEl.textContent = `Could not save message: ${error.message}`;
  }
});

loadStats();
loadMessages();
