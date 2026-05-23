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
});

function wpp(msg){
  const tel = '5511947196813'; // Número do Estação Jardim (formato: país+DD+numero)
  const url = `https://wa.me/${tel}?text=${encodeURIComponent(msg)}`;
  window.open(url, '_blank');
}

function selH(el){
  document.querySelectorAll('.hc').forEach(h=>h.classList.remove('sel'));
  el.classList.add('sel');
}

function solicitarReserva(){
  const nome = document.getElementById('r-nome')?.value || '';
  const tel = document.getElementById('r-tel')?.value || '';
  const pax = document.getElementById('r-pax')?.value || '';
  const data = document.getElementById('r-data')?.value || '';
  const ev = document.getElementById('r-ev')?.value || '';
  const obs = document.getElementById('r-obs')?.value || '';
  const horario = document.querySelector('.hc.sel')?.innerText || '';
  const msg = `Olá, quero reservar uma mesa. Nome: ${nome} Tel: ${tel} Pessoas: ${pax} Data: ${data} Horário: ${horario} Evento: ${ev} Observações: ${obs}`;
  wpp(msg);
}

function tgFaq(el){
  const item = el.parentElement;
  if(item) item.classList.toggle('open');
}
