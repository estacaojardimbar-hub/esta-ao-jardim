/*
 * ╔══════════════════════════════════════════════════════════════╗
 * ║  ZECA — Bot de Atendimento Inteligente                      ║
 * ║  Bar Estação Jardim · WhatsApp + Google Gemini              ║
 * ╚══════════════════════════════════════════════════════════════╝
 */

const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// ─── Configuração ────────────────────────────────────────────
const GEMINI_API_KEY = 'AIzaSyCbIQ9S54zGaOPNMS6qhHA9YpiF6Vjsfi0';
const NUMERO_BAR = '5511947196813'; // Número do Estação Jardim

// ─── Inicializa o Gemini ─────────────────────────────────────
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

// ─── Personalidade do ZECA (System Prompt) ───────────────────
const ZECA_PROMPT = `
Você é o ZECA, o atendente virtual do Bar Estação Jardim.
Você é simpático, descontraído e fala como um carioca/paulista gente boa.
Use emojis com moderação (1-2 por mensagem). Seja direto e útil.

REGRAS IMPORTANTES:
- Nunca invente informações. Se não souber, diga "vou verificar com a equipe".
- Sempre incentive a pessoa a visitar o bar ou fazer uma reserva.
- Respostas curtas (máximo 3-4 linhas), como se fosse uma conversa de WhatsApp real.
- Nunca diga que é uma IA. Você é o Zeca, atendente do bar.

INFORMAÇÕES DO BAR:
- Nome: Bar Estação Jardim
- Tipo: Bar, Drinks e Eventos
- Horário: Terça a Domingo, 16h às 02h (Segunda fechado)
- Endereço: Rua do Bar, 123 - Estação Jardim
- WhatsApp: +55 11 94719-6813
- Instagram: @estacaojardimbar
- Reservas: Pelo WhatsApp ou pelo site

CARDÁPIO DE DRINKS:
- Caipirinha Tropical (cachaça, limão, açúcar, toque de maracujá) — R$ 28
- Chope Artesanal (copo gelado na pressão) — R$ 16
- Mini Camarão (camarões crocantes com maionese de limão) — R$ 34

EVENTOS PROGRAMADOS:
- Quinta do Pagode (toda quinta, 19h-23h) — Grupo Sementes do Samba
- Samba de Raiz (sábados especiais, 17h-00h) — Batuke na Alma + convidados
- Aniversário do Estação (evento especial, 20h-02h) — Programação surpresa

PORÇÕES DISPONÍVEIS:
- Temos mais de 30 opções de porções e petiscos variados
- Destaque para frutos do mar, espetinhos e tábuas de frios

COMO RESPONDER:
- Saudação: Responda de forma calorosa e pergunte como pode ajudar
- Cardápio: Liste os destaques e pergunte se quer ver mais opções
- Reserva: Peça nome, data, horário e número de pessoas
- Evento: Informe os próximos eventos e ofereça reserva
- Preço: Informe o valor e sugira combos
- Localização: Passe o endereço e ofereça mandar a localização
- Reclamação: Peça desculpas, diga que vai resolver e passe para a gerência
`;

// ─── Memória de conversa por contato ─────────────────────────
const conversas = new Map();

function getHistorico(chatId) {
  if (!conversas.has(chatId)) {
    conversas.set(chatId, []);
  }
  return conversas.get(chatId);
}

function addMensagem(chatId, role, text) {
  const historico = getHistorico(chatId);
  historico.push({ role, parts: [{ text }] });
  // Mantém apenas as últimas 20 mensagens para economizar tokens
  if (historico.length > 20) {
    historico.splice(0, historico.length - 20);
  }
}

// ─── Gera resposta com Gemini ────────────────────────────────
async function gerarResposta(chatId, mensagemUsuario) {
  try {
    addMensagem(chatId, 'user', mensagemUsuario);

    const chat = model.startChat({
      history: getHistorico(chatId).slice(0, -1), // Tudo menos a última (que vamos enviar agora)
      systemInstruction: ZECA_PROMPT,
    });

    const result = await chat.sendMessage(mensagemUsuario);
    const resposta = result.response.text();

    addMensagem(chatId, 'model', resposta);

    return resposta;
  } catch (error) {
    console.error('❌ Erro ao gerar resposta do Gemini:', error.message);
    return 'Opa, deu uma travada aqui! 😅 Tenta de novo em alguns segundos ou manda um "oi" que eu volto!';
  }
}

// ─── Inicializa o WhatsApp Client ────────────────────────────
const client = new Client({
  authStrategy: new LocalAuth({ dataPath: './sessao-zeca' }),
  puppeteer: {
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--disable-gpu',
    ],
  },
});

// ─── Eventos do WhatsApp ─────────────────────────────────────

// QR Code para conectar
client.on('qr', (qr) => {
  console.log('\n╔══════════════════════════════════════════╗');
  console.log('║  🤖 ZECA — Escaneie o QR Code abaixo    ║');
  console.log('║  Abra o WhatsApp > Aparelhos Conectados  ║');
  console.log('╚══════════════════════════════════════════╝\n');
  qrcode.generate(qr, { small: true });
});

// Quando conectar com sucesso
client.on('ready', () => {
  console.log('\n╔══════════════════════════════════════════╗');
  console.log('║  ✅ ZECA está ONLINE e pronto!           ║');
  console.log('║  Esperando mensagens dos clientes...     ║');
  console.log('╚══════════════════════════════════════════╝\n');
});

// Quando receber uma mensagem
client.on('message', async (msg) => {
  // Ignora mensagens de grupo e status
  const chat = await msg.getChat();
  if (chat.isGroup) return;
  if (msg.from === 'status@broadcast') return;

  // Ignora mensagens do próprio bot
  if (msg.fromMe) return;

  const contato = await msg.getContact();
  const nome = contato.pushname || 'Cliente';
  const texto = msg.body;

  console.log(`📩 ${nome}: ${texto}`);

  // Gera a resposta inteligente com Gemini
  const resposta = await gerarResposta(msg.from, texto);

  console.log(`🤖 Zeca: ${resposta}`);

  // Envia a resposta
  await msg.reply(resposta);
});

// Erros de autenticação
client.on('auth_failure', (msg) => {
  console.error('❌ Falha na autenticação:', msg);
});

// Desconexão
client.on('disconnected', (reason) => {
  console.log('🔌 Desconectado:', reason);
  console.log('Reiniciando em 5 segundos...');
  setTimeout(() => client.initialize(), 5000);
});

// ─── Inicia o bot ────────────────────────────────────────────
console.log('\n🚀 Iniciando o ZECA...');
console.log('📍 Bar Estação Jardim — Bot de Atendimento');
console.log('─'.repeat(45));
client.initialize();
