const apiBase = '/api';
const tokenKey = 'estacao-jardim-token';

const loginPanel = document.getElementById('login-panel');
const dashboardPanel = document.getElementById('dashboard-panel');
const loginForm = document.getElementById('admin-login-form');
const sectionTitle = document.getElementById('section-title');
const tableContainer = document.getElementById('table-container');

let currentTab = 'orders';

function getToken() {
  return localStorage.getItem(tokenKey);
}

function setToken(token) {
  if (token) {
    localStorage.setItem(tokenKey, token);
  } else {
    localStorage.removeItem(tokenKey);
  }
}

function authorizedHeaders() {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function fetchJson(url, options = {}) {
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });

  const body = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(body?.message || response.statusText || 'Sem autorização');
  }
  return body;
}

async function loadData() {
  try {
    if (currentTab === 'orders') {
      const orders = await fetchJson(`${apiBase}/admin/orders`, { headers: authorizedHeaders() });
      renderOrders(orders);
    } else {
      const reservations = await fetchJson(`${apiBase}/admin/reservations`, { headers: authorizedHeaders() });
      renderReservations(reservations);
    }
  } catch (error) {
    alert(error.message);
    setToken(null);
    showLogin();
  }
}

function renderOrders(orders) {
  sectionTitle.textContent = 'Gerenciamento de Pedidos';
  if (!orders.length) {
    tableContainer.innerHTML = '<p>Nenhum pedido encontrado.</p>';
    return;
  }
  tableContainer.innerHTML = `
    <table class="data-table">
      <thead>
        <tr>
          <th>Mesa</th>
          <th>Cliente</th>
          <th>Itens</th>
          <th>Total</th>
          <th>Status</th>
          <th>Ações</th>
        </tr>
      </thead>
      <tbody>
        ${orders.map(o => `
          <tr>
            <td>Mesa ${o.tableNumber || 'N/A'}</td>
            <td>${o.user?.name || 'Cliente'} (${o.user?.phone || 'WhatsApp'})</td>
            <td>${o.items.map(it => `${it.quantity}x ${it.name}`).join(', ')}</td>
            <td>R$ ${Number(o.total).toFixed(2)}</td>
            <td><span class="badge ${o.status}">${o.status}</span></td>
            <td>
              <select onchange="updateOrderStatus('${o.id}', this.value)">
                <option value="OPEN" ${o.status === 'OPEN' ? 'selected' : ''}>Aberto</option>
                <option value="PREPARING" ${o.status === 'PREPARING' ? 'selected' : ''}>Preparando</option>
                <option value="COMPLETED" ${o.status === 'COMPLETED' ? 'selected' : ''}>Concluído</option>
                <option value="CANCELLED" ${o.status === 'CANCELLED' ? 'selected' : ''}>Cancelar</option>
              </select>
            </td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
}

function renderReservations(reservations) {
  sectionTitle.textContent = 'Gerenciamento de Reservas';
  if (!reservations.length) {
    tableContainer.innerHTML = '<p>Nenhuma reserva encontrada.</p>';
    return;
  }
  tableContainer.innerHTML = `
    <table class="data-table">
      <thead>
        <tr>
          <th>Data</th>
          <th>Horário</th>
          <th>Cliente</th>
          <th>Pessoas</th>
          <th>Notas</th>
          <th>Status</th>
          <th>Ações</th>
        </tr>
      </thead>
      <tbody>
        ${reservations.map(r => `
          <tr>
            <td>${new Date(r.date).toLocaleDateString()}</td>
            <td>${r.time}</td>
            <td>${r.user?.name || 'Cliente'} (${r.user?.phone || 'WhatsApp'})</td>
            <td>${r.guests}</td>
            <td>${r.notes || ''}</td>
            <td><span class="badge ${r.status}">${r.status}</span></td>
            <td>
              <select onchange="updateReservationStatus('${r.id}', this.value)">
                <option value="PENDING" ${r.status === 'PENDING' ? 'selected' : ''}>Pendente</option>
                <option value="CONFIRMED" ${r.status === 'CONFIRMED' ? 'selected' : ''}>Confirmado</option>
                <option value="CANCELLED" ${r.status === 'CANCELLED' ? 'selected' : ''}>Cancelar</option>
              </select>
            </td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
}

async function updateOrderStatus(id, status) {
  try {
    await fetchJson(`${apiBase}/admin/orders/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
      headers: authorizedHeaders()
    });
    loadData();
  } catch (error) {
    alert(error.message);
  }
}

async function updateReservationStatus(id, status) {
  try {
    await fetchJson(`${apiBase}/admin/reservations/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
      headers: authorizedHeaders()
    });
    loadData();
  } catch (error) {
    alert(error.message);
  }
}

function showLogin() {
  loginPanel.classList.remove('hidden');
  dashboardPanel.classList.add('hidden');
}

function showDashboard() {
  loginPanel.classList.add('hidden');
  dashboardPanel.classList.remove('hidden');
  loadData();
}

loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = document.getElementById('admin-email').value;
  const password = document.getElementById('admin-password').value;

  try {
    const res = await fetchJson(`${apiBase}/auth/login`, {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
    if (res.user.role !== 'ADMIN') {
      alert('Acesso negado. Apenas administradores.');
      return;
    }
    setToken(res.accessToken);
    showDashboard();
  } catch (error) {
    alert(error.message);
  }
});

document.getElementById('tab-orders').addEventListener('click', (e) => {
  document.getElementById('tab-orders').classList.add('active');
  document.getElementById('tab-reservations').classList.remove('active');
  currentTab = 'orders';
  loadData();
});

document.getElementById('tab-reservations').addEventListener('click', (e) => {
  document.getElementById('tab-orders').classList.remove('active');
  document.getElementById('tab-reservations').classList.add('active');
  currentTab = 'reservations';
  loadData();
});

document.getElementById('btn-back').addEventListener('click', () => {
  window.location.href = 'index.html';
});

// Autologin check
if (getToken()) {
  showDashboard();
} else {
  showLogin();
}
window.updateOrderStatus = updateOrderStatus;
window.updateReservationStatus = updateReservationStatus;
