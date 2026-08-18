const loadedAtEl = document.getElementById('loadedAt');
const connectionStateEl = document.getElementById('connectionState');
const refreshButtonEl = document.getElementById('refreshButton');

loadedAtEl.textContent = new Intl.DateTimeFormat('vi-VN', {
  dateStyle: 'short',
  timeStyle: 'medium',
}).format(new Date());

function updateConnectionState() {
  connectionStateEl.textContent = navigator.onLine
    ? 'Đang trực tuyến'
    : 'Đang ngoại tuyến';
}

window.addEventListener('online', updateConnectionState);
window.addEventListener('offline', updateConnectionState);
refreshButtonEl.addEventListener('click', () => window.location.reload());

updateConnectionState();
