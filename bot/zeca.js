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

// ─── Gera resposta com Gemini com suporte a Tools/Function Calling ─────
const axios = require('axios');
const API_URL = 'http://localhost:3000'; // Ajuste conforme porta real

// Definição das ferramentas que o Zeca pode usar
const zecaTools = [
  {
    functionDeclarations: [
      {
        name: 'criarReserva',
        description: 'Registra uma reserva de mesa para um cliente no banco de dados do bar.',
        parameters: {
          type: 'OBJECT',
          properties: {
            name: { type: 'STRING', description: 'Nome do cliente' },
            phone: { type: 'STRING', description: 'Número do WhatsApp ou telefone do cliente' },
            date: { type: 'STRING', description: 'Data da reserva no formato YYYY-MM-DD' },
            time: { type: 'STRING', description: 'Horário sugerido para reserva, ex: 19:30' },
            guests: { type: 'NUMBER', description: 'Número de pessoas' },
            notes: { type: 'STRING', description: 'Observações adicionais ou opcionais (aniversário, área vip, etc.)' }
          },
          required: ['name', 'phone', 'date', 'time', 'guests']
        }
      },
      {
        name: 'criarPedido',
        description: 'Envia um pedido de consumo (bebida ou porção) para uma mesa no bar.',
        parameters: {
          type: 'OBJECT',
          properties: {
            name: { type: 'STRING', description: 'Nome do cliente' },
            phone: { type: 'STRING', description: 'WhatsApp ou telefone' },
            tableNumber: { type: 'NUMBER', description: 'Número da mesa (opcional)' },
            items: {
              type: 'ARRAY',
              description: 'Lista de itens pedidos',
              items: {
                type: 'OBJECT',
                properties: {
                  name: { type: 'STRING', description: 'Nome do item exatamente como no cardápio, ex: Caipirinha Tropical, Chope Artesanal ou Mini Camarão' },
                  price: { type: 'NUMBER', description: 'Preço unitário do item' },
                  quantity: { type: 'NUMBER', description: 'Quantidade desejada' }
                },
                required: ['name', 'price', 'quantity']
              }
            }
          },
          required: ['name', 'phone', 'items']
        }
      }
    ]
  }
];

// Funções executoras
async function executarTool(call, phonePadrao) {
  const { name, args } = call;
  try {
    if (name === 'criarReserva') {
      const payload = {
        name: args.name,
        phone: args.phone || phonePadrao,
        date: args.date,
        time: args.time,
        guests: Number(args.guests),
        notes: args.notes || ''
      };
      const res = await axios.post(`${API_URL}/reservations`, payload);
      return `[Zeca Bot] Sucesso! Reserva criada para ${payload.name} dia ${payload.date} às ${payload.time}. ID: ${res.data.id}`;
    }

    if (name === 'criarPedido') {
      const payload = {
        name: args.name,
        phone: args.phone || phonePadrao,
        tableNumber: args.tableNumber ? Number(args.tableNumber) : undefined,
        items: args.items.map(i => ({
          name: i.name,
          price: Number(i.price),
          quantity: Number(i.quantity)
        }))
      };
      const res = await axios.post(`${API_URL}/orders`, payload);
      return `[Zeca Bot] Sucesso! Pedido enviado para cozinha/bar. Total: R$ ${res.data.total}. ID: ${res.data.id}`;
    }
  } catch (error) {
    console.error('❌ Erro na integração da API do Zeca:', error.response?.data || error.message);
    return `[Zeca Bot] Ops, houve um problema ao processar o seu pedido/reserva na nossa API interna. Motivo: ${error.response?.data?.message || error.message}`;
  }
  return 'Função desconhecida';
}

async function gerarResposta(chatId, mensagemUsuario) {
  try {
    addMensagem(chatId, 'user', mensagemUsuario);

    const chat = model.startChat({
      history: getHistorico(chatId).slice(0, -1),
      systemInstruction: ZECA_PROMPT,
      tools: zecaTools,
    });

    const result = await chat.sendMessage(mensagemUsuario);
    
    // Verifica se o modelo quer chamar alguma função
    const calls = result.response.functionCalls;
    if (calls && calls.length > 0) {
      console.log(`🤖 Zeca detectou intenção de ação:`, calls[0].name, calls[0].args);
      const output = await executarTool(calls[0], chatId.replace('@c.us', ''));
      
      // Envia o resultado da função de volta para o modelo concluir a conversa
      const followUp = await chat.sendMessage([
        {
          functionResponse: {
            name: calls[0].name,
            response: { result: output }
          }
        }
      ]);
      const respostaFinal = followUp.response.text();
      addMensagem(chatId, 'model', respostaFinal);
      return respostaFinal;
    }

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
    executablePath: 'C:\\Users\\Ana Beatriz\\.cache\\puppeteer\\chrome\\win64-149.0.7827.22\\chrome-win64\\chrome.exe',
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
  // setTimeout(() => client.initialize(), 5000); // restart desativado
});

// ─── Inicia o bot ────────────────────────────────────────────
console.log('\n🚀 Iniciando o ZECA...');
console.log('📍 Bar Estação Jardim — Bot de Atendimento');
console.log('─'.repeat(45));
client.initialize();

function detectarGenero(texto) {
  if (/sou mulher|minha|ela/i.test(texto)) return "feminino";
  if (/sou homem|meu|ele/i.test(texto)) return "masculino";
  return "neutro";
}

function ajustarGenero(resposta, genero) {
  if (genero === "feminino") {
    return resposta.replace("parceiro", "parceira");
  }
  return resposta;
}
