// ======================================================
// CORE.JS — Autenticação, sessão, api(), estado global, navegação entre abas
// Carregado primeiro: define funções e variáveis usadas por todos os outros arquivos
// ======================================================


// ======================================================
// AUTENTICAÇÃO, SESSÃO E SEGURANÇA
// Tudo que controla login, token e redirecionamento
// ======================================================
const SUPA_URL = 'https://lnqnyxoluosjilmyodhz.supabase.co';
const SUPA_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxucW55eG9sdW9zamlsbXlvZGh6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg1MjQwNDksImV4cCI6MjA5NDEwMDA0OX0.wihQxSpw-tT_PxANoRECgkRd5g8ZoN4iFI7C2hFm8gY';

function getSessao() {
  try { return JSON.parse(localStorage.getItem('ac_session')); } catch { return null; }
}

function sair() {
  localStorage.removeItem('ac_session');
  window.location.href = 'pages/login.html';
}

(function verificarSessao() {
  const s = getSessao();
  if (!s || Date.now() > s.expires_at) {
    localStorage.removeItem('ac_session');
    window.location.href = 'pages/login.html';
  }
})();

// ======================================================
// FUNÇÃO BASE DE COMUNICAÇÃO COM O SUPABASE (API)
// Toda requisição ao banco passa obrigatoriamente por aqui
// ======================================================
function getHeaders() {
  const s = getSessao();
  return {
    'Content-Type':  'application/json',
    'apikey':        SUPA_KEY,
    'Authorization': 'Bearer ' + (s ? s.access_token : SUPA_KEY),
  };
}

async function api(path, method = 'GET', body = null) {
  const opts = { method, headers: getHeaders() };
  if (method === 'POST')  opts.headers['Prefer'] = 'return=representation';
  if (method === 'PATCH') opts.headers['Prefer'] = 'return=minimal';
  if (method === 'DELETE') opts.headers['Prefer'] = 'return=minimal';
  if (body) opts.body = JSON.stringify(body);
  const r = await fetch(SUPA_URL + '/rest/v1/' + path, opts);
  if (r.status === 401) { sair(); return; }
  if (!r.ok) throw new Error(await r.text());
  const t = await r.text();
  return t ? JSON.parse(t) : [];
}

// ======================================================
// ESTADO GLOBAL DO SISTEMA (MEMÓRIA TEMPORÁRIA)
// Esses arrays guardam os dados carregados do banco
// ======================================================
let funcionarios = [], servicos = [], atendimentos = [];
let pneus = [], movimentacoes = [];
let custosFixos = [], custosServico = [], fornecedores = [], comprasFornecedor = [];

async function carregarDados() {
  const hoje = new Date().toISOString().split('T')[0];
  const mesAtual = new Date().getMonth() + 1;
  const anoAtual = new Date().getFullYear();

  // Nomes na mesma ordem das chamadas abaixo, usados só para identificar
  // qual tabela falhou em caso de erro (não altera o formato dos dados).
  const fontes = [
    'funcionarios', 'servicos', 'atendimentos', 'pneus', 'movimentacoes',
    'custosFixos', 'custosServico', 'fornecedores', 'comprasFornecedor'
  ];

  // Promise.allSettled: se UMA chamada falhar (tabela ausente, RLS, etc.),
  // as outras continuam sendo carregadas normalmente. Antes, com Promise.all,
  // uma única falha derrubava TODOS os dados (inclusive os gráficos, que
  // dependem de "atendimentos") sem nenhum aviso visível na tela.
  const resultados = await Promise.allSettled([
    api('funcionarios?order=nome'),
    api('servicos?ativo=eq.true&order=nome'),
    api('atendimentos?horario=gte.' + hoje + 'T00:00:00&order=horario.desc'),
    api('pneus?ativo=eq.true&order=marca'),
    api('pneus_movimentacoes?order=created_at.desc&limit=50'),
    api('custos_fixos?mes=eq.' + mesAtual + '&ano=eq.' + anoAtual + '&order=categoria'),
    api('custos_servico?order=servico'),
    api('fornecedores?ativo=eq.true&order=nome'),
    api('compras_fornecedor?order=created_at.desc&limit=50')
  ]);

  const falhas = [];

  resultados.forEach((res, i) => {
    if (res.status === 'fulfilled') {
      switch (fontes[i]) {
        case 'funcionarios':       funcionarios      = res.value || []; break;
        case 'servicos':           servicos          = res.value || []; break;
        case 'atendimentos':       atendimentos      = res.value || []; break;
        case 'pneus':              pneus             = res.value || []; break;
        case 'movimentacoes':      movimentacoes     = res.value || []; break;
        case 'custosFixos':        custosFixos       = res.value || []; break;
        case 'custosServico':      custosServico     = res.value || []; break;
        case 'fornecedores':       fornecedores      = res.value || []; break;
        case 'comprasFornecedor':  comprasFornecedor = res.value || []; break;
      }
    } else {
      // Mantém o dado antigo em memória (não zera a tela) e registra a falha
      falhas.push(fontes[i]);
      console.error('Falha ao carregar "' + fontes[i] + '":', res.reason);
    }
  });

  if (falhas.length > 0) {
    setStatus(false);
    showToast('Erro ao carregar: ' + falhas.join(', '), true);
  } else {
    setStatus(true);
  }
}
// ======================================================
// 🟢 STATUS DE CONEXÃO COM O BANCO (ONLINE / OFFLINE)
// Apenas feedback visual no topo da tela
// ======================================================
function setStatus(ok) {
  document.getElementById('statusDot').className = 'status-dot' + (ok ? ' online' : '');
  document.getElementById('statusTxt').textContent = ok ? 'online' : 'offline';
}

// ======================================================
// FUNÇÃO PARA FORMATAR VALORES EM REAL (R$)
// ======================================================
function brl(v) {
  return 'R$ ' + parseFloat(v || 0).toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

// ======================================================
// TOAST(ALERTA) DE MENSAGENS (SUCESSO / ERRO)
// Pequenas notificações que aparecem na tela
// ======================================================
function showToast(msg, err = false) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className = 'toast' + (err ? ' error' : '') + ' show';
  setTimeout(() => t.className = 'toast', 2800);
}

// ======================================================
// DATA ATUAL EXIBIDA NO FOOTER DA SIDEBAR
// ======================================================
const hoje = new Date();
const dias  = ['Domingo','Segunda','Terça','Quarta','Quinta','Sexta','Sábado'];
const meses = ['jan','fev','mar','abr','mai','jun','jul','ago','set','out','nov','dez'];

document.getElementById('headerDate').textContent =
  dias[hoje.getDay()] + ', ' + hoje.getDate() + ' de ' + meses[hoje.getMonth()];

// ======================================================
// NAVEGAÇÃO ENTRE AS ABAS DO SISTEMA
// Troca Painel, Registrar e Gerenciar dinamicamente
// ======================================================
let currentTab = 'painel';

const pageTitles = {
  painel:    { title: 'Painel',    sub: 'Resumo do dia de hoje' },
  registrar: { title: 'Registrar', sub: 'Novo atendimento' },
  gerenciar: { title: 'Gerenciar', sub: 'Funcionários e serviços' },
  pneus:     { title: 'Pneus',     sub: 'Estoque, compras e vendas' },
  custos:    { title: 'Custos',    sub: 'Margem de lucro e despesas' }
};

async function showTab(tab) {
  currentTab = tab;
['painel', 'registrar', 'gerenciar', 'pneus', 'custos'].forEach(t => {
  document.getElementById('tab-' + t).classList.toggle('active', t === tab);
});
  document.getElementById('pageTitle').textContent = pageTitles[tab].title;
  document.getElementById('pageSub').textContent   = pageTitles[tab].sub;
  await carregarDados();
  if (tab === 'painel') { document.getElementById('main-content').innerHTML = renderPainel(); animateBars(); }
  if (tab === 'registrar') { document.getElementById('main-content').innerHTML = renderRegistrar(); preencherSelects(); }
  if (tab === 'gerenciar') { document.getElementById('main-content').innerHTML = renderGerenciar(); renderGerenciarContent(); }
  if (tab === 'pneus') { document.getElementById('main-content').innerHTML = await renderPneus(); }
  if (tab === 'custos') {document.getElementById('main-content').innerHTML = await renderCustos();}
}