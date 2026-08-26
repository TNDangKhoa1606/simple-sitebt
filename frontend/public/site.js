const visitsEl = document.getElementById('visits');
const lastVisitEl = document.getElementById('lastVisit');
const statusEl = document.getElementById('status');
const messageFormEl = document.getElementById('messageForm');
const messageInputEl = document.getElementById('messageInput');
const messagesListEl = document.getElementById('messagesList');
const callBackendButtonEl = document.getElementById('callBackendButton');
const backendConnectionEl = document.getElementById('backendConnection');
const backendDetailsEl = document.getElementById('backendDetails');
const backendMessageEl = document.getElementById('backendMessage');
const backendServiceEl = document.getElementById('backendService');
const backendStatusEl = document.getElementById('backendStatus');
const backendErrorEl = document.getElementById('backendError');
const callBackend2ButtonEl = document.getElementById('callBackend2Button');
const backend2ConnectionEl = document.getElementById('backend2Connection');
const backend2JsonEl = document.getElementById('backend2Json');
const backend2ErrorEl = document.getElementById('backend2Error');

async function loadBackendMessage() {
  callBackendButtonEl.disabled = true;
  backendConnectionEl.textContent = 'Backend connection: TESTING...';
  backendDetailsEl.hidden = true;
  backendErrorEl.hidden = true;

  try {
    const response = await fetch('/api/hello');
    if (!response.ok) {
      throw new Error(`Request failed with status ${response.status}`);
    }

    const data = await response.json();
    backendConnectionEl.textContent = 'Backend connection: OK';
    backendMessageEl.textContent = data.message;
    backendServiceEl.textContent = data.service;
    backendStatusEl.textContent = data.status;
    backendDetailsEl.hidden = false;
  } catch (error) {
    backendConnectionEl.textContent = 'Backend connection: FAILED';
    backendErrorEl.textContent = error.message;
    backendErrorEl.hidden = false;
  } finally {
    callBackendButtonEl.disabled = false;
  }
}

callBackendButtonEl.addEventListener('click', loadBackendMessage);

async function loadBackend2() {
  callBackend2ButtonEl.disabled = true;
  backend2ConnectionEl.textContent = 'Backend #2 connection: TESTING...';
  backend2JsonEl.hidden = true;
  backend2ErrorEl.hidden = true;

  try {
    const response = await fetch('/api/backend2');
    const data = await response.json();

    if (!response.ok) {
      backend2JsonEl.textContent = JSON.stringify(data, null, 2);
      backend2JsonEl.hidden = false;
      throw new Error(
        data?.message ?? `Request failed with status ${response.status}`,
      );
    }

    backend2ConnectionEl.textContent = 'Backend #2 connection: OK';
    backend2JsonEl.textContent = JSON.stringify(data, null, 2);
    backend2JsonEl.hidden = false;
  } catch (error) {
    backend2ConnectionEl.textContent = 'Backend #2 connection: FAILED';
    backend2ErrorEl.textContent = error.message;
    backend2ErrorEl.hidden = false;
  } finally {
    callBackend2ButtonEl.disabled = false;
  }
}

callBackend2ButtonEl.addEventListener('click', loadBackend2);

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
