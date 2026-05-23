document.addEventListener('DOMContentLoaded', ()=>{
  const splash = document.getElementById('splash');
  if(splash) setTimeout(()=>splash.classList.add('out'), 900);

  // Ensure a page is visible
  if(!document.querySelector('.page.active')){
    const first = document.querySelector('.page');
    if(first) first.classList.add('active');
  }

  // Simple sidebar navigation if elements have data-target
  document.querySelectorAll('.ni[data-target]').forEach(el=>{
    el.addEventListener('click', ()=>{
      document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'));
      const id = el.getAttribute('data-target');
      const target = document.getElementById(id);
      if(target) target.classList.add('active');
      document.querySelectorAll('.ni').forEach(n=>n.classList.remove('active'));
      el.classList.add('active');
    });
  });
  // mobile bottom nav
  document.querySelectorAll('.mn[data-target]').forEach(el=>{
    el.addEventListener('click', ()=>{
      document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'));
      const id = el.getAttribute('data-target');
      const target = document.getElementById(id);
      if(target) target.classList.add('active');
      document.querySelectorAll('.mn').forEach(n=>n.classList.remove('active'));
      el.classList.add('active');
    });
  });

  const reservationInputs = document.querySelectorAll('#r-nome,#r-tel,#r-pax,#r-data,#r-ev,#r-obs');
  reservationInputs.forEach(i=>i.addEventListener('input', updatePreview));
  updatePreview();
});

function wpp(msg){
  const tel = '5511947196813'; // Número do Estação Jardim (formato: país+DD+numero)
  const url = `https://wa.me/${tel}?text=${encodeURIComponent(msg)}`;
  window.open(url, '_blank');
}

function selH(el){
  document.querySelectorAll('.hc').forEach(h=>h.classList.remove('sel'));
  el.classList.add('sel');
  updatePreview();
}

function formatDate(dateString){
  if(!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('pt-BR', { weekday:'short', day:'2-digit', month:'short' });
}

function showToast(message, duration=2800){
  const toast = document.getElementById('toast');
  if(!toast) return;
  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(window._toastTimer);
  window._toastTimer = setTimeout(()=>toast.classList.remove('show'), duration);
}

// --- Pedido / Cardápio ---
window._order = window._order || [];

function addToOrder(name, price){
  window._order.push({name, price});
  updateOrderUI();
  showToast(`${name} adicionado ao pedido` , 1400);
}

function updateOrderUI(){
  const itemsEl = document.getElementById('order-items');
  const countEl = document.getElementById('order-count');
  if(!itemsEl || !countEl) return;
  itemsEl.innerHTML = '';
  if(window._order.length === 0){
    itemsEl.innerHTML = '<div style="padding:12px;color:var(--muted)">Nenhum item adicionado.</div>';
  } else {
    window._order.forEach((it, idx)=>{
      const div = document.createElement('div');
      div.className = 'order-item';
      div.innerHTML = `<div class="oi-name">${it.name}</div><div class="oi-price">${it.price}</div><button class="oi-remove" onclick="removeFromOrder(${idx})" aria-label="Remover">✖</button>`;
      itemsEl.appendChild(div);
    });
  }
  countEl.innerText = window._order.length;
}

function removeFromOrder(index){
  if(index>=0 && index < window._order.length){
    const removed = window._order.splice(index,1)[0];
    updateOrderUI();
    showToast(`${removed.name} removido`, 1200);
  }
}

function clearOrder(){
  window._order = [];
  updateOrderUI();
}

function sendOrder(){
  if(window._order.length === 0){
    showToast('Adicione itens antes de enviar.');
    return;
  }
  const nome = document.getElementById('r-nome')?.value.trim() || '';
  const tel = document.getElementById('r-tel')?.value.trim() || '';
  if(!nome || !tel){
    showToast('Preencha nome e WhatsApp para enviar pedido.');
    return;
  }
  const lines = ['Olá! Gostaria de fazer um pedido para retirada/mesa:','Nome: '+nome,'WhatsApp: '+tel,'--- Itens ---'];
  window._order.forEach(it => lines.push(`${it.name} — ${it.price}`));
  const msg = lines.join('\n');
  showToast('Abrindo WhatsApp...', 1200);
  setTimeout(()=>wpp(msg), 480);
}

// Wire order panel open/close
document.addEventListener('DOMContentLoaded', ()=>{
  const toggle = document.getElementById('order-toggle');
  const panel = document.getElementById('order-body');
  const clearBtn = document.getElementById('order-clear');
  if(toggle && panel){
    toggle.addEventListener('click', ()=>{
      const open = panel.style.display === 'block';
      panel.style.display = open ? 'none' : 'block';
    });
  }
  if(clearBtn) clearBtn.addEventListener('click', clearOrder);
  updateOrderUI();
});

function updatePreview(){
  const nome = document.getElementById('r-nome')?.value.trim();
  const pax = document.getElementById('r-pax')?.value || '1';
  const data = document.getElementById('r-data')?.value || '';
  const ev = document.getElementById('r-ev')?.value || 'Sem evento específico';
  const horario = document.querySelector('.hc.sel')?.innerText || 'A combinar';
  const preview = document.getElementById('preview-text');
  if(!preview) return;
  const dateText = data ? formatDate(data) : 'data a combinar';
  preview.innerText = `${nome ? nome + ' · ' : ''}${pax} pessoas · ${dateText} · ${horario}${ev ? ' · ' + ev : ''}`;
}

function solicitarReserva(){
  const nome = document.getElementById('r-nome')?.value.trim();
  const tel = document.getElementById('r-tel')?.value.trim();
  const pax = document.getElementById('r-pax')?.value || '1';
  const data = document.getElementById('r-data')?.value || '';
  const ev = document.getElementById('r-ev')?.value || '';
  const obs = document.getElementById('r-obs')?.value.trim();
  const horario = document.querySelector('.hc.sel')?.innerText || 'A combinar';
  if(!nome || !tel){
    showToast('Preencha nome e WhatsApp antes de enviar.');
    return;
  }
  if(!data){
    showToast('Informe a data da reserva.');
    return;
  }
  const dataFormatada = data ? formatDate(data) : 'A combinar';
  const eventoTexto = ev ? ev : 'Nenhum evento específico';
  const mensagem = [
    'Olá! Gostaria de reservar uma mesa no Estação Jardim.',
    `Nome: ${nome}`,
    `WhatsApp: ${tel}`,
    `Pessoas: ${pax}`,
    `Data: ${dataFormatada}`,
    `Horário: ${horario}`,
    `Evento: ${eventoTexto}`,
    obs ? `Observações: ${obs}` : ''
  ].filter(Boolean).join('\n');
  showToast('Redirecionando para o WhatsApp...');
  setTimeout(()=>wpp(mensagem), 420);
}

function tgFaq(el){
  const item = el.parentElement;
  if(item) item.classList.toggle('open');
}
