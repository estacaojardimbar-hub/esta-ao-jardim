const apiBase = '/api';
const tokenKey = 'estacao-jardim-token';

const sections = {
  auth: document.getElementById('auth-section'),
  menu: document.getElementById('menu-section'),
  reservation: document.getElementById('reservation-section'),
  order: document.getElementById('order-section'),
  history: document.getElementById('history-section'),
};

const statusEl = document.getElementById('status');
const authButton = document.getElementById('btn-login');
const logoutButton = document.getElementById('btn-logout');
const tabButtons = Array.from(document.querySelectorAll('.tabs button'));

let menuItems = [];

function setStatus(message, danger = false) {
  statusEl.textContent = message;
  statusEl.style.color = danger ? '#c9423d' : 'var(--text)';
}

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
    throw new Error(body?.message || response.statusText || 'Erro de rede');
  }
  return body;
}

function showSection(sectionKey) {
  Object.values(sections).forEach((section) => section.classList.add('hidden'));
  if (sections[sectionKey]) {
    sections[sectionKey].classList.remove('hidden');
  }
  tabButtons.forEach((button) => button.classList.toggle('active', button.dataset.tab === sectionKey));
}

function showAuthPanel() {
  showSection('auth');
}

function updateAuthState() {
  const token = getToken();
  logoutButton.classList.toggle('hidden', !token);
  authButton.textContent = token ? 'Conta conectada' : 'Entrar / Registrar';
}

async function loadMenu() {
  try {
    const menu = await fetchJson(`${apiBase}/menu`);
    menuItems = menu;
    const menuList = document.getElementById('menu-list');
    menuList.innerHTML = menu.map((item) => `
      <article class="menu-card">
        <strong>${item.name}</strong>
        <small>${item.category || 'Sem categoria'}</small>
        <p>${item.description || ''}</p>
        <div class="meta">
          <span>R$ ${Number(item.price).toFixed(2)}</span>
          <span>${item.available ? 'Disponível' : 'Indisponível'}</span>
        </div>
      </article>
    `).join('');

    const orderItems = document.getElementById('order-items');
    orderItems.innerHTML = menu
      .filter((item) => item.available)
      .map((item) => `
        <div class="menu-card">
          <strong>${item.name}</strong>
          <p>R$ ${item.price.toFixed(2)}</p>
          <label>Quantidade<input class="quantity-field" type="number" min="0" value="0" data-item-id="${item.id}" /></label>
        </div>
      `)
      .join('');
  } catch (error) {
    setStatus(error.message, true);
  }
}

async function loadHistory() {
  try {
    const [reservations, orders] = await Promise.all([
      fetchJson(`${apiBase}/reservations`, { headers: authorizedHeaders() }),
      fetchJson(`${apiBase}/orders`, { headers: authorizedHeaders() }),
    ]);

    const reservationHistory = document.getElementById('reservation-history');
    reservationHistory.innerHTML = reservations.length
      ? reservations.map((res) => `
        <article class="history-card">
          <strong>Reserva para ${res.guests} pessoas</strong>
          <p>${new Date(res.date).toLocaleDateString()} às ${res.time}</p>
          <p>Status: ${res.status}</p>
          <p>${res.notes || ''}</p>
        </article>
      `).join('')
      : '<p>Nenhuma reserva encontrada.</p>';

    const orderHistory = document.getElementById('order-history');
    orderHistory.innerHTML = orders.length
      ? orders.map((order) => `
        <article class="history-card">
          <strong>Pedido #${order.id.slice(0, 8)}</strong>
          <p>Total: R$ ${Number(order.total).toFixed(2)}</p>
          <p>Status: ${order.status}</p>
          <p>Mesa: ${order.tableNumber || 'Não informado'}</p>
          <p>${order.items.map((item) => `${item.quantity}x ${item.name}`).join(', ')}</p>
        </article>
      `).join('')
      : '<p>Nenhum pedido cadastrado.</p>';
  } catch (error) {
    setStatus(error.message, true);
  }
}

async function handleLogin(event) {
  event.preventDefault();
  const form = event.target;
  const data = {
    email: form.email.value.trim(),
    password: form.password.value.trim(),
  };

  try {
    const result = await fetchJson(`${apiBase}/auth/login`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    setToken(result.accessToken);
    updateAuthState();
    setStatus('Login realizado com sucesso.');
    showSection('menu');
    loadHistory();
  } catch (error) {
    setStatus(error.message, true);
  }
}

async function handleRegister(event) {
  event.preventDefault();
  const form = event.target;
  const data = {
    name: form.name.value.trim(),
    email: form.email.value.trim(),
    password: form.password.value.trim(),
  };

  try {
    const result = await fetchJson(`${apiBase}/auth/register`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    setToken(result.accessToken);
    updateAuthState();
    setStatus('Cadastro realizado com sucesso.');
    showSection('menu');
    loadHistory();
  } catch (error) {
    setStatus(error.message, true);
  }
}

async function handleReservation(event) {
  event.preventDefault();
  const form = event.target;
  
  let phone = '';
  let name = '';
  const token = getToken();

  if (!token) {
    // Modo Híbrido: Pede dados básicos se o usuário não estiver logado
    name = prompt('Por favor, informe seu nome para a reserva:');
    if (!name) return;
    phone = prompt('Por favor, informe seu número de WhatsApp/Telefone:');
    if (!phone) return;
  }

  const data = {
    date: form.date.value,
    time: form.time.value,
    guests: Number(form.guests.value),
    notes: form.notes.value.trim(),
    ...(token ? {} : { name, phone })
  };

  try {
    setStatus('Processando sua reserva...');
    await fetchJson(`${apiBase}/reservations`, {
      method: 'POST',
      body: JSON.stringify(data),
      headers: authorizedHeaders(),
    });
    setStatus('Reserva enviada com sucesso ao sistema.');
    form.reset();
    if (token) loadHistory();
  } catch (error) {
    console.error('Erro ao enviar reserva:', error);
    setStatus(`Erro ao enviar reserva: ${error.message}. Tente novamente.`, true);
    // WhatsApp Fallback
    const confirmFallback = confirm('Ops, a conexão com o servidor falhou. Deseja enviar sua reserva diretamente via WhatsApp?');
    if (confirmFallback) {
      const msg = `Olá! Gostaria de reservar uma mesa.\nNome: ${name || 'Cliente'}\nWhatsApp: ${phone || ''}\nData: ${data.date}\nHorário: ${data.time}\nPessoas: ${data.guests}\nNotas: ${data.notes}`;
      window.open(`https://wa.me/5511947196813?text=${encodeURIComponent(msg)}`, '_blank');
    }
  }
}

async function handleOrder(event) {
  event.preventDefault();
  const form = event.target;
  const items = Array.from(document.querySelectorAll('#order-items input[data-item-id]'))
    .map((input) => ({ id: input.dataset.itemId, quantity: Number(input.value) }))
    .filter((item) => item.quantity > 0)
    .map((item) => {
      const menuItem = menuItems.find((menu) => menu.id === item.id);
      return {
        name: menuItem.name,
        price: menuItem.price,
        quantity: item.quantity,
      };
    });

  if (!items.length) {
    setStatus('Escolha ao menos um item para o pedido.', true);
    return;
  }

  let phone = '';
  let name = '';
  const token = getToken();

  if (!token) {
    name = prompt('Por favor, informe seu nome para o pedido:');
    if (!name) return;
    phone = prompt('Por favor, informe seu número de WhatsApp/Telefone:');
    if (!phone) return;
  }

  const data = {
    tableNumber: Number(form.tableNumber.value),
    items,
    ...(token ? {} : { name, phone })
  };

  try {
    setStatus('Enviando seu pedido...');
    await fetchJson(`${apiBase}/orders`, {
      method: 'POST',
      body: JSON.stringify(data),
      headers: authorizedHeaders(),
    });
    setStatus('Pedido enviado com sucesso ao sistema.');
    form.reset();
    if (token) loadHistory();
  } catch (error) {
    console.error('Erro ao enviar pedido:', error);
    setStatus(`Erro ao enviar pedido: ${error.message}. Tente novamente.`, true);
    // WhatsApp Fallback
    const confirmFallback = confirm('Ops, o envio automático falhou. Deseja enviar seu pedido diretamente via WhatsApp?');
    if (confirmFallback) {
      const msg = `Olá! Gostaria de fazer o pedido para a Mesa ${data.tableNumber}.\nNome: ${name || 'Cliente'}\nWhatsApp: ${phone || ''}\nItens:\n` + 
        items.map(it => `- ${it.quantity}x ${it.name}`).join('\n');
      window.open(`https://wa.me/5511947196813?text=${encodeURIComponent(msg)}`, '_blank');
    }
  }
}

function handleTabChange(event) {
  const tab = event.target.dataset.tab;
  if (!tab) return;
  if (tab === 'history' && !getToken()) {
    showAuthPanel();
    setStatus('Faça login para ver seu histórico.');
    return;
  }
  showSection(tab);
}

async function init() {
  document.getElementById('login-form').addEventListener('submit', handleLogin);
  document.getElementById('register-form').addEventListener('submit', handleRegister);
  document.getElementById('reservation-form').addEventListener('submit', handleReservation);
  document.getElementById('order-form').addEventListener('submit', handleOrder);
  authButton.addEventListener('click', () => showAuthPanel());
  logoutButton.addEventListener('click', () => {
    setToken(null);
    updateAuthState();
    setStatus('Sessão encerrada.');
  });
  tabButtons.forEach((button) => button.addEventListener('click', handleTabChange));

  updateAuthState();
  await loadMenu();
  showSection('menu');
}

init();
