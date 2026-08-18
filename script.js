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
  try {
    const hoje = new Date().toISOString().split('T')[0];
    const mesAtual = new Date().getMonth() + 1;
    const anoAtual = new Date().getFullYear();

[funcionarios, servicos, atendimentos, pneus, movimentacoes,
 custosFixos, custosServico, fornecedores, comprasFornecedor] = await Promise.all([
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
    setStatus(true);
  } catch (e) { setStatus(false); console.error(e); }
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


// ======================================================
// RENDERIZAÇÃO DO PAINEL PRINCIPAL (DASHBOARD)
// Cálculos de métricas, totais, ranking e horários
// ======================================================
function renderPainel() {
  const total = atendimentos.length;
  const fat   = atendimentos.reduce((s, a) => s + parseFloat(a.valor || 0), 0);
  const porFunc = {};
  atendimentos.forEach(a => {
    const n = a.funcionario_nome || 'N/A';
    if (!porFunc[n]) porFunc[n] = { nome: n, qtd: 0, val: 0 };
    porFunc[n].qtd++;
    porFunc[n].val += parseFloat(a.valor || 0);
  });
  const topFuncs = Object.values(porFunc).sort((a, b) => b.val - a.val);
  const topFunc  = topFuncs[0];
  const porHora = {};
  for (let h = 7; h <= 18; h++) porHora[h] = 0;
  atendimentos.forEach(a => {
    const h = new Date(a.horario).getHours();
    if (h >= 7 && h <= 18) porHora[h]++;
  });
  const peakHora = Object.entries(porHora).sort((a, b) => b[1] - a[1])[0];
  return `
  <p class="section-title">Resumo de hoje</p>
  <div class="cards-grid">
    <div class="metric-card">
      <div class="metric-icon blue"><svg viewBox="0 0 24 24"><path d="M1 3h15l2 7H3L1 3z"/><circle cx="7" cy="17" r="2"/><circle cx="15" cy="17" r="2"/></svg></div>
      <div class="metric-label">Veículos hoje</div>
      <div class="metric-value">${total}</div>
      <div class="metric-sub">atendimentos</div>
    </div>
    <div class="metric-card">
      <div class="metric-icon green"><svg viewBox="0 0 24 24"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg></div>
      <div class="metric-label">Faturamento</div>
      <div class="metric-value sm">${brl(fat)}</div>
      <div class="metric-sub">hoje</div>
    </div>
    <div class="metric-card">
      <div class="metric-icon amber"><svg viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 21 12 17.77 5.82 21 7 14.14 2 9.27l6.91-1.01L12 2z"/></svg></div>
      <div class="metric-label">Top funcionário</div>
      <div class="metric-value sm">${topFunc ? topFunc.nome : '—'}</div>
      <div class="metric-sub">${topFunc ? topFunc.qtd + ' serviço(s)' : ''}</div>
    </div>
    <div class="metric-card">
      <div class="metric-icon coral"><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg></div>
      <div class="metric-label">Horário mais cheio</div>
      <div class="metric-value sm">${peakHora && peakHora[1] > 0 ? peakHora[0] + 'h' : '—'}</div>
      <div class="metric-sub">${peakHora && peakHora[1] > 0 ? peakHora[1] + ' atend.' : ''}</div>
    </div>
  </div>
  <p class="section-title">Análises</p>
  ${renderGraficos()}
  <p class="section-title">Equipe e atendimentos</p>
  ${renderRankingEAtendimentos()}`;
}

// ======================================================
// GERAÇÃO DOS GRÁFICOS VISUAIS DO PAINEL
// Serviços mais feitos e movimento por horário
// ======================================================
function renderGraficos() {
  const porServ = {};
  atendimentos.forEach(a => { porServ[a.servico] = (porServ[a.servico] || 0) + 1; });
  const topServs = Object.entries(porServ).sort((a, b) => b[1] - a[1]).slice(0, 5);
  const maxServ  = topServs[0] ? topServs[0][1] : 1;
  const porHora  = {};
  for (let h = 7; h <= 18; h++) porHora[h] = 0;
  atendimentos.forEach(a => {
    const h = new Date(a.horario).getHours();
    if (h >= 7 && h <= 18) porHora[h]++;
  });
  const maxHora  = Math.max(...Object.values(porHora), 1);
  const peakHora = Object.entries(porHora).sort((a, b) => b[1] - a[1])[0][0];
  const servHTML = topServs.length > 0
    ? topServs.map(([s, q]) => `
      <div class="bar-row">
        <div class="bar-label"><span>${s}</span><span>${q}x</span></div>
        <div class="bar-track"><div class="bar-fill" data-pct="${Math.round(q/maxServ*100)}" style="width:0%"></div></div>
      </div>`).join('')
    : '<div style="color:var(--text-hint);font-size:13px;padding:12px 0">Nenhum serviço registrado hoje</div>';
  return `
  <div class="panels-grid">
    <div class="card">
      <div class="card-header">
        <svg viewBox="0 0 24 24"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>
        <span class="card-title">Serviços mais feitos</span>
      </div>
      ${servHTML}
    </div>
    <div class="card">
      <div class="card-header">
        <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
        <span class="card-title">Movimento por horário</span>
      </div>
      <div class="hour-grid">
        ${Object.entries(porHora).map(([h, q]) => `
        <div class="hour-cell">
          <div class="hour-bar-wrap">
            <div class="hour-bar ${h == peakHora && q > 0 ? 'peak' : ''}" data-h="${Math.round(q/maxHora*100)}" style="height:4px"></div>
          </div>
          <div class="hour-label">${h}h</div>
          <div class="hour-count">${q}</div>
        </div>`).join('')}
      </div>
    </div>
  </div>`;
}

// ======================================================
//  ANIMAÇÃO VISUAL DAS BARRAS DOS GRÁFICOS
// ======================================================
function animateBars() {
  setTimeout(() => {
    document.querySelectorAll('.bar-fill[data-pct]').forEach(b => { b.style.width = b.dataset.pct + '%'; });
    document.querySelectorAll('.hour-bar[data-h]').forEach(b => { b.style.height = Math.max(4, parseInt(b.dataset.h) / 100 * 80) + 'px'; });
  }, 100);
}

// ======================================================
// RANKING DE FUNCIONÁRIOS E LISTA DE ATENDIMENTOS
// Parte inferior do painel
// ======================================================
function renderRankingEAtendimentos() {
  const porFunc = {};
  atendimentos.forEach(a => {
    const n = a.funcionario_nome || 'N/A';
    if (!porFunc[n]) porFunc[n] = { nome: n, qtd: 0, val: 0 };
    porFunc[n].qtd++;
    porFunc[n].val += parseFloat(a.valor || 0);
  });
  const topFuncs = Object.values(porFunc).sort((a, b) => b.val - a.val);
  const rankingHTML = topFuncs.length > 0
    ? topFuncs.map((f, i) => `
      <div class="list-item">
        <div class="list-item-left">
          <div class="rank ${i === 0 ? 'gold' : ''}">${i + 1}</div>
          <div><div class="list-name">${f.nome}</div><div class="list-sub">${f.qtd} serviço${f.qtd !== 1 ? 's' : ''}</div></div>
        </div>
        <div class="list-val">${brl(f.val)}</div>
      </div>`).join('')
    : `<div class="empty"><svg viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>Nenhum atendimento hoje</div>`;
  const atendimentosHTML = atendimentos.length > 0
    ? atendimentos.slice(0, 10).map(a => `
      <div class="list-item">
        <div class="list-item-left">
          <div>
            <div class="list-name">${a.placa || '—'} <span class="tag ${a.tipo_veiculo === 'Carreta' ? 'blue' : 'green'}">${a.tipo_veiculo || 'Caminhão'}</span></div>
            <div class="list-sub">${a.servico} · ${a.funcionario_nome || '—'}</div>
          </div>
        </div>
        <div>
          <div class="list-val">${brl(a.valor)}</div>
          <div class="list-val-sub">${new Date(a.horario).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</div>
        </div>
      </div>`).join('')
    : `<div class="empty"><svg viewBox="0 0 24 24"><path d="M1 3h15l2 7H3L1 3z"/><circle cx="7" cy="17" r="2"/><circle cx="15" cy="17" r="2"/></svg>Nenhum atendimento registrado hoje</div>`;
  return `
  <div class="bottom-grid">
    <div class="card">
      <div class="card-header"><svg viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 21 12 17.77 5.82 21 7 14.14 2 9.27l6.91-1.01L12 2z"/></svg><span class="card-title">Ranking</span></div>
      ${rankingHTML}
    </div>
    <div class="card">
      <div class="card-header"><svg viewBox="0 0 24 24"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg><span class="card-title">Últimos atendimentos</span></div>
      ${atendimentosHTML}
    </div>
  </div>`;
}

// ======================================================
// FORMULÁRIO PARA REGISTRAR NOVO ATENDIMENTO
// Tela "Registrar"
// ======================================================
function renderRegistrar() {
  return `
  <div class="form-container">
    <p class="section-title">Novo atendimento</p>
    <div class="form-card">
      <div class="form-grid">
        <div class="form-group">
          <label>Placa do veículo</label>
          <input id="f-placa" placeholder="ABC-1234" style="text-transform:uppercase">
        </div>
        <div class="form-group">
          <label>Tipo de veículo</label>
          <select id="f-tipo">
            <option value="Caminhão">🚛 Caminhão</option>
            <option value="Carreta">🚚 Carreta</option>
          </select>
        </div>
        <div class="form-group">
          <label>Serviço</label>
          <select id="f-servico"><option value="">Selecione o serviço...</option></select>
        </div>
        <div class="form-group">
          <label>Valor cobrado (R$)</label>
          <input id="f-valor" type="number" step="0.01" min="0" placeholder="0,00">
        </div>
        <div class="form-group" id="outro-wrap" style="display:none">
          <label>Nome do serviço</label>
          <input id="f-servico-outro" placeholder="Digite o serviço">
        </div>
        <div class="form-group">
          <label>Funcionário responsável</label>
          <select id="f-func"><option value="">Selecione o funcionário...</option></select>
        </div>
      </div>
      <hr class="form-divider">
      <button class="btn-primary" id="btn-registrar" onclick="registrar()">Registrar atendimento</button>
    </div>
  </div>`;
}

// ======================================================
// PREENCHIMENTO AUTOMÁTICO DOS CAMPOS SELECT
// Carrega serviços e funcionários no formulário
// ======================================================
function preencherSelects() {
  const selServ = document.getElementById('f-servico');
  const selFunc = document.getElementById('f-func');
  if (!selServ || !selFunc) return;
  selServ.innerHTML = '<option value="">Selecione o serviço...</option>';
  servicos.forEach(s => {
    selServ.innerHTML += `<option value="${s.nome}" data-preco="${s.preco_sugerido || ''}">${s.nome}${s.preco_sugerido ? ' — ' + brl(s.preco_sugerido) : ''}</option>`;
  });
  selServ.innerHTML += '<option value="__outro__">Outro (digitar)</option>';
  selFunc.innerHTML = '<option value="">Selecione o funcionário...</option>';
  funcionarios.forEach(f => {
    selFunc.innerHTML += `<option value="${f.id}" data-nome="${f.nome}">${f.nome}</option>`;
  });
  selServ.addEventListener('change', () => {
    const v = selServ.value;
    document.getElementById('outro-wrap').style.display = v === '__outro__' ? 'flex' : 'none';
    const preco = selServ.selectedOptions[0]?.dataset.preco;
    if (preco) document.getElementById('f-valor').value = preco;
  });
}

// ======================================================
// ENVIO DO ATENDIMENTO PARA O SUPABASE (SALVAR)
// ======================================================
async function registrar() {
  const btn = document.getElementById('btn-registrar');
  btn.disabled = true;
  btn.textContent = 'Registrando...';
  const placa    = document.getElementById('f-placa').value.trim().toUpperCase();
  const tipo     = document.getElementById('f-tipo').value;
  const servSel  = document.getElementById('f-servico').value;
  const servico  = servSel === '__outro__' ? document.getElementById('f-servico-outro').value.trim() : servSel;
  const valor    = parseFloat(document.getElementById('f-valor').value);
  const funcSel  = document.getElementById('f-func');
  const funcId   = parseInt(funcSel.value);
  const funcNome = funcSel.selectedOptions[0]?.dataset.nome || '';
  if (!servico || !valor || !funcId) {
    showToast('Preencha todos os campos!', true);
    btn.disabled = false;
    btn.textContent = 'Registrar atendimento';
    return;
  }
  try {
    await api('atendimentos', 'POST', { placa, tipo_veiculo: tipo, servico, valor, funcionario_id: funcId, funcionario_nome: funcNome });
    showToast('Atendimento registrado com sucesso!');
    showTab('painel');
  } catch (e) { showToast('Erro ao registrar!', true); }
  btn.disabled = false;
  btn.textContent = 'Registrar atendimento';
}

// ======================================================
// TELA DE GERENCIAMENTO DO SISTEMA
// Cadastro e remoção de funcionários e serviços
// ======================================================
// ======================================================
// TELA DE GERENCIAMENTO — COM SUBNAVEGAÇÃO
// ======================================================
let gerenciarTab = 'funcionarios';

function renderGerenciar() {
  return `
  <div class="subnav">
    <button class="subnav-btn ${gerenciarTab === 'funcionarios' ? 'active' : ''}" onclick="trocarGerenciar('funcionarios')">👷 Funcionários</button>
    <button class="subnav-btn ${gerenciarTab === 'servicos'     ? 'active' : ''}" onclick="trocarGerenciar('servicos')">🔧 Serviços</button>
    <button class="subnav-btn ${gerenciarTab === 'atendimentos' ? 'active' : ''}" onclick="trocarGerenciar('atendimentos')">📋 Atendimentos</button>
    <button class="subnav-btn ${gerenciarTab === 'veiculos'     ? 'active' : ''}" onclick="trocarGerenciar('veiculos')">🚛 Veículos</button>
  </div>
  <div id="gerenciar-content"></div>`;
}

function trocarGerenciar(tab) {
  gerenciarTab = tab;
  document.querySelectorAll('.subnav-btn').forEach((b, i) => {
    const tabs = ['funcionarios','servicos','atendimentos','veiculos'];
    b.classList.toggle('active', tabs[i] === tab);
  });
  renderGerenciarContent();
}

function renderGerenciarContent() {
  const c = document.getElementById('gerenciar-content');
  if (!c) return;
  if (gerenciarTab === 'funcionarios') c.innerHTML = renderFuncionarios();
  if (gerenciarTab === 'servicos')     c.innerHTML = renderServicos();
  if (gerenciarTab === 'atendimentos') c.innerHTML = renderAtendimentosGerenciar();
  if (gerenciarTab === 'veiculos')     c.innerHTML = renderVeiculos();
}

// ======================================================
// FUNCIONÁRIOS
// ======================================================
function renderFuncionarios() {
  return `
  <div class="card" style="max-width:600px">
    <div class="card-header">
      <svg viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
      <span class="card-title">Funcionários</span>
    </div>
    ${funcionarios.length > 0 ? funcionarios.map(f => `
    <div class="manage-row">
      <div>
        <div class="manage-name">${f.nome} ${!f.ativo ? '<span class="badge-inativo">inativo</span>' : ''}</div>
      </div>
      <div class="action-btns">
        <button class="btn-edit" onclick="editarFuncionario(${f.id}, '${f.nome}')">Editar</button>
        <button class="btn-deactivate" onclick="toggleFuncionario(${f.id}, ${f.ativo})">${f.ativo ? 'Desativar' : 'Ativar'}</button>
        <button class="btn-danger" onclick="deleteFuncionario(${f.id})">Remover</button>
      </div>
    </div>`).join('') : '<div style="color:var(--text-hint);font-size:13px;padding:12px 0">Nenhum funcionário cadastrado</div>'}
    <div class="add-form" id="form-func">
      <div class="form-group"><label>Nome do funcionário</label><input id="new-func-nome" placeholder="Ex: Carlos"></div>
      <div class="add-form-row">
        <button class="btn-primary" onclick="addFuncionario()">Adicionar</button>
        <button class="btn-secondary" onclick="toggleForm('form-func')">Cancelar</button>
      </div>
    </div>
    <button class="btn-secondary" onclick="toggleForm('form-func')">+ Adicionar funcionário</button>
  </div>`;
}

// ======================================================
// SERVIÇOS
// ======================================================
function renderServicos() {
  return `
  <div class="card" style="max-width:600px">
    <div class="card-header">
      <svg viewBox="0 0 24 24"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>
      <span class="card-title">Serviços e preços</span>
    </div>
    ${servicos.length > 0 ? servicos.map(s => `
    <div class="manage-row">
      <div>
        <div class="manage-name">${s.nome}</div>
        <div class="manage-sub">${s.preco_sugerido ? brl(s.preco_sugerido) : 'Preço livre'}</div>
      </div>
      <div class="action-btns">
        <button class="btn-edit" onclick="editarServico(${s.id}, '${s.nome}', '${s.preco_sugerido || ''}')">Editar</button>
        <button class="btn-danger" onclick="deleteServico(${s.id})">Remover</button>
      </div>
    </div>`).join('') : '<div style="color:var(--text-hint);font-size:13px;padding:12px 0">Nenhum serviço cadastrado</div>'}
    <div class="add-form" id="form-serv">
      <div class="form-group"><label>Nome do serviço</label><input id="new-serv-nome" placeholder="Ex: Troca de Pneu"></div>
      <div class="form-group"><label>Preço sugerido (opcional)</label><input id="new-serv-preco" type="number" step="0.01" placeholder="0,00"></div>
      <div class="add-form-row">
        <button class="btn-primary" onclick="addServico()">Adicionar</button>
        <button class="btn-secondary" onclick="toggleForm('form-serv')">Cancelar</button>
      </div>
    </div>
    <button class="btn-secondary" onclick="toggleForm('form-serv')">+ Adicionar serviço</button>
  </div>`;
}

// ======================================================
// PNEUS — RENDER PRINCIPAL
// ======================================================
let pneusTab = 'estoque';

async function renderPneus() {
  return `
  <div class="pneus-subnav">
    <button class="subnav-btn ${pneusTab === 'estoque' ? 'active' : ''}"     onclick="trocarPneus('estoque')">📦 Estoque</button>
    <button class="subnav-btn ${pneusTab === 'movimentacoes' ? 'active' : ''}" onclick="trocarPneus('movimentacoes')">📋 Movimentações</button>
    <button class="subnav-btn ${pneusTab === 'cadastrar' ? 'active' : ''}"   onclick="trocarPneus('cadastrar')">➕ Cadastrar pneu</button>
  </div>
  <div id="pneus-content">
    ${renderPneusContent()}
  </div>`;
}

function trocarPneus(tab) {
  pneusTab = tab;
  document.querySelectorAll('.pneus-subnav .subnav-btn').forEach((b, i) => {
    const tabs = ['estoque','movimentacoes','cadastrar'];
    b.classList.toggle('active', tabs[i] === tab);
  });
  document.getElementById('pneus-content').innerHTML = renderPneusContent();
}

function renderPneusContent() {
  if (pneusTab === 'estoque')       return renderEstoque();
  if (pneusTab === 'movimentacoes') return renderMovimentacoes();
  if (pneusTab === 'cadastrar')     return renderCadastrarPneu();
  return '';
}

// ======================================================
// ESTOQUE
// ======================================================
function renderEstoque() {
  if (pneus.length === 0) return `
    <div class="empty">
      <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="3"/></svg>
      Nenhum pneu cadastrado ainda
    </div>`;

  return `
  <div class="pneus-grid">
    ${pneus.map(p => `
    <div class="pneu-card">
      <div class="pneu-card-top">
        <div>
          <div class="pneu-marca">${p.marca}</div>
          <div class="pneu-medida">${p.medida}</div>
        ${p.fornecedor_nome ? `<div style="margin-top:4px">
  <span class="fornecedor-badge 
  ${fornecedores.find(f=>f.id===p.fornecedor_id)?.tipo || 'nacional'}">${p.fornecedor_nome}
          </span>
        </div>` : ''}
        </div>
        <div class="pneu-estoque">
          <div class="pneu-estoque-num ${p.estoque <= 2 ? 'baixo' : 'ok'}">${p.estoque}</div>
          <div class="pneu-estoque-label">em estoque</div>
        </div>
      </div>
      <div class="pneu-precos">
        <div class="pneu-preco-item">
          <div class="pneu-preco-label">Custo</div>
          <div class="pneu-preco-val">${brl(p.custo)}</div>
        </div>
        <div class="pneu-preco-item">
          <div class="pneu-preco-label">Venda</div>
          <div class="pneu-preco-val">${brl(p.preco_venda)}</div>
        </div>
        <div class="pneu-preco-item">
          <div class="pneu-preco-label">Margem</div>
          <div class="pneu-preco-val" style="color:var(--green)">
            ${p.custo > 0 ? Math.round((p.preco_venda - p.custo) / p.custo * 100) + '%' : '—'}
          </div>
        </div>
      </div>
      <div class="pneu-actions">
        <button class="btn-compra" onclick="abrirCompra(${p.id})">+ Compra</button>
        <button class="btn-venda"  onclick="abrirVenda(${p.id})">− Venda</button>
        <button class="btn-edit"   onclick="editarPneu(${p.id})">✏️</button>
        <button class="btn-danger" onclick="deletePneu(${p.id})">🗑️</button>
      </div>
    </div>`).join('')}
  </div>`;
}

// ======================================================
// MOVIMENTAÇÕES
// ======================================================
function renderMovimentacoes() {
  return `
  <div class="card">
    <div class="card-header">
      <svg viewBox="0 0 24 24"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>
      <span class="card-title">Últimas movimentações</span>
    </div>
    ${movimentacoes.length > 0 ? movimentacoes.map(m => {
      const pneu = pneus.find(p => p.id === m.pneu_id);
      return `
      <div class="list-item">
        <div class="list-item-left">
          <div class="rank ${m.tipo === 'venda' ? 'gold' : ''}" style="${m.tipo === 'compra' ? 'background:var(--blue-light);color:var(--blue)' : ''}">
            ${m.tipo === 'compra' ? '▲' : '▼'}
          </div>
          <div>
            <div class="list-name">${pneu ? pneu.marca + ' ' + pneu.medida : 'Pneu'} <span class="tag ${m.tipo === 'venda' ? 'green' : 'blue'}">${m.tipo}</span></div>
            <div class="list-sub">${m.quantidade} un · ${m.funcionario_nome || '—'} ${m.observacao ? '· ' + m.observacao : ''}</div>
          </div>
        </div>
        <div>
          <div class="list-val">${brl(m.total)}</div>
          <div class="list-val-sub">${new Date(m.created_at).toLocaleString('pt-BR', { day:'2-digit', month:'2-digit', hour:'2-digit', minute:'2-digit' })}</div>
        </div>
      </div>`;
    }).join('') : '<div class="empty"><svg viewBox="0 0 24 24"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/></svg>Nenhuma movimentação ainda</div>'}
  </div>`;
}

// ======================================================
// CADASTRAR PNEU
// ======================================================
function renderCadastrarPneu() {
  return `
  <div class="card" style="max-width:500px">
    <div class="card-header">
      <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="3"/></svg>
      <span class="card-title">Cadastrar novo pneu</span>
    </div>
    <div class="form-grid">
      <div class="form-group">
        <label>Marca</label>
        <input id="np-marca" placeholder="Ex: Bridgestone">
      </div>
      <div class="form-group">
        <label>Medida</label>
        <input id="np-medida" placeholder="Ex: 295/80R22.5">
      </div>
      <div class="form-group">
        <label>Fornecedor</label>
        <select id="np-forn">
          <option value="">Selecione...</option>
          ${fornecedores.map(f => `<option value="${f.id}" data-nome="${f.nome}">${f.nome} <span class="fornecedor-badge ${f.tipo}">${f.tipo}</span></option>`).join('')}
        </select>
      </div>
      <div class="form-group">
        <label>Custo de compra (R$)</label>
        <input id="np-custo" type="number" step="0.01" placeholder="0,00">
      </div>
      <div class="form-group">
        <label>Preço de venda (R$)</label>
        <input id="np-venda" type="number" step="0.01" placeholder="0,00">
      </div>
      <div class="form-group">
        <label>Estoque inicial</label>
        <input id="np-estoque" type="number" min="0" placeholder="0">
      </div>
    </div>
    <hr class="form-divider">
    <button class="btn-primary" onclick="cadastrarPneu()">Cadastrar pneu</button>
  </div>`;
}
async function cadastrarPneu() {
  console.log('cadastrarPneu chamado');
  const marca    = document.getElementById('np-marca').value.trim();
  const medida   = document.getElementById('np-medida').value.trim();
  const fornSel  = document.getElementById('np-forn');
  const fornId   = parseInt(fornSel.value) || null;
  const fornNome = fornSel.selectedOptions[0]?.dataset.nome || '';
  const custo    = parseFloat(document.getElementById('np-custo').value || 0);
  const venda    = parseFloat(document.getElementById('np-venda').value || 0);
  const estoque  = parseInt(document.getElementById('np-estoque').value || 0);

  console.log({ marca, medida, fornId, custo, venda, estoque });

  if (!marca || !medida) { showToast('Preencha marca e medida!', true); return; }

  try {
    // 1. Cadastra o pneu
    await api('pneus', 'POST', { marca, medida, custo, preco_venda: venda, estoque });

    // 2. Se tiver fornecedor e estoque inicial, registra a compra automaticamente
    if (fornId && estoque > 0 && custo > 0) {
      await api('compras_fornecedor', 'POST', {
        fornecedor_id:   fornId,
        fornecedor_nome: fornNome,
        descricao:       marca + ' ' + medida,
        quantidade:      estoque,
        valor_unit:      custo,
        total:           estoque * custo
      });
    }

    showToast('Pneu cadastrado!');
    await carregarDados();
    trocarPneus('estoque');
  } catch (e) { showToast('Erro ao cadastrar!', true); }
}

// ======================================================
// COMPRA DE PNEU
// ======================================================
function abrirCompra(id) {
  const p = pneus.find(x => x.id === id);
  if (!p) return;
  abrirModal(`Registrar compra — ${p.marca} ${p.medida}`, `
    <div class="form-grid" style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
      <div class="form-group">
        <label>Fornecedor</label>
        <select id="mov-forn">
          <option value="">Selecione...</option>
          ${fornecedores.map(f => `<option value="${f.id}" data-nome="${f.nome}">${f.nome}</option>`).join('')}
        </select>
      </div>
      <div class="form-group">
        <label>Quantidade</label>
        <input id="mov-qtd" type="number" min="1" value="1">
      </div>
      <div class="form-group">
        <label>Custo unitário (R$)</label>
        <input id="mov-valor" type="number" step="0.01" value="${p.custo}">
      </div>
      <div class="form-group">
        <label>Observação (opcional)</label>
        <input id="mov-obs" placeholder="Ex: NF 1234">
      </div>
    </div>`, async () => {
    const fornSel  = document.getElementById('mov-forn');
    const fornId   = parseInt(fornSel.value);
    const fornNome = fornSel.selectedOptions[0]?.dataset.nome || '';
    const qtd      = parseInt(document.getElementById('mov-qtd').value);
    const valor    = parseFloat(document.getElementById('mov-valor').value);
    const obs      = document.getElementById('mov-obs').value.trim();
    if (!qtd || !valor) { showToast('Preencha os campos!', true); return; }
    try {
      // 1. Registra movimentação de estoque
      await api('pneus_movimentacoes', 'POST', {
        pneu_id: id, tipo: 'compra', quantidade: qtd,
        valor_unit: valor, total: qtd * valor,
        observacao: obs
      });

      // 2. Atualiza estoque e custo do pneu
      await api('pneus?id=eq.' + id, 'PATCH', {
        estoque: p.estoque + qtd,
        custo: valor
      });

      // 3. Registra automaticamente no financeiro do fornecedor
      if (fornId) {
        await api('compras_fornecedor', 'POST', {
          fornecedor_id: fornId,
          fornecedor_nome: fornNome,
          descricao: p.marca + ' ' + p.medida,
          quantidade: qtd,
          valor_unit: valor,
          total: qtd * valor
        });
      }

      showToast('Compra registrada!');
      document.getElementById('modal-overlay').classList.remove('open');
      await carregarDados();
      trocarPneus('estoque');
    } catch (e) { showToast('Erro!', true); }
  });
}

// ======================================================
// VENDA DE PNEU
// ======================================================
function abrirVenda(id) {
  const p = pneus.find(x => x.id === id);
  if (!p) return;
  abrirModal(`Registrar venda — ${p.marca} ${p.medida}`, `
    <div class="form-grid" style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
      <div class="form-group">
        <label>Quantidade (estoque: ${p.estoque})</label>
        <input id="mov-qtd" type="number" min="1" max="${p.estoque}" value="1">
      </div>
      <div class="form-group">
        <label>Preço unitário (R$)</label>
        <input id="mov-valor" type="number" step="0.01" value="${p.preco_venda}">
      </div>
      <div class="form-group">
        <label>Funcionário</label>
        <select id="mov-func">
          <option value="">Selecione...</option>
          ${funcionarios.filter(f => f.ativo).map(f => `<option value="${f.nome}">${f.nome}</option>`).join('')}
        </select>
      </div>
      <div class="form-group">
        <label>Observação (opcional)</label>
        <input id="mov-obs" placeholder="Ex: Cliente João">
      </div>
    </div>`, async () => {
    const qtd   = parseInt(document.getElementById('mov-qtd').value);
    const valor = parseFloat(document.getElementById('mov-valor').value);
    const func  = document.getElementById('mov-func').value;
    const obs   = document.getElementById('mov-obs').value.trim();
    if (!qtd || !valor) { showToast('Preencha os campos!', true); return; }
    if (qtd > p.estoque) { showToast('Quantidade maior que o estoque!', true); return; }
    try {
      await api('pneus_movimentacoes', 'POST', {
        pneu_id: id, tipo: 'venda', quantidade: qtd,
        valor_unit: valor, total: qtd * valor,
        funcionario_nome: func, observacao: obs
      });
      await api('pneus?id=eq.' + id, 'PATCH', { estoque: p.estoque - qtd });
      showToast('Venda registrada!');
      document.getElementById('modal-overlay').classList.remove('open');
      await carregarDados();
      trocarPneus('estoque');
    } catch (e) { showToast('Erro!', true); }
  });
}

// ======================================================
// EDITAR PNEU
// ======================================================
function editarPneu(id) {
  const p = pneus.find(x => x.id === id);
  if (!p) return;
  abrirModal(`Editar — ${p.marca} ${p.medida}`, `
    <div class="form-grid" style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
      <div class="form-group">
        <label>Marca</label>
        <input id="ep-marca" value="${p.marca}">
      </div>
      <div class="form-group">
        <label>Medida</label>
        <input id="ep-medida" value="${p.medida}">
      </div>
      <div class="form-group">
        <label>Custo (R$)</label>
        <input id="ep-custo" type="number" step="0.01" value="${p.custo}">
      </div>
      <div class="form-group">
        <label>Preço de venda (R$)</label>
        <input id="ep-venda" type="number" step="0.01" value="${p.preco_venda}">
      </div>
      <div class="form-group">
        <label>Estoque atual</label>
        <input id="ep-estoque" type="number" min="0" value="${p.estoque}">
      </div>
    </div>`, async () => {
    const marca   = document.getElementById('ep-marca').value.trim();
    const medida  = document.getElementById('ep-medida').value.trim();
    const custo   = parseFloat(document.getElementById('ep-custo').value);
    const venda   = parseFloat(document.getElementById('ep-venda').value);
    const estoque = parseInt(document.getElementById('ep-estoque').value);
    if (!marca || !medida) { showToast('Preencha marca e medida!', true); return; }
    try {
      await api('pneus?id=eq.' + id, 'PATCH', { marca, medida, custo, preco_venda: venda, estoque });
      showToast('Pneu atualizado!');
      document.getElementById('modal-overlay').classList.remove('open');
      await carregarDados();
      trocarPneus('estoque');
    } catch (e) { showToast('Erro!', true); }
  });
}

// ======================================================
// DELETAR PNEU
// ======================================================
async function deletePneu(id) {
  if (!confirm('Remover este pneu do estoque?')) return;
  try {
    await api('pneus?id=eq.' + id, 'PATCH', { ativo: false });
    showToast('Pneu removido!');
    await carregarDados();
    trocarPneus('estoque');
  } catch (e) { showToast('Erro!', true); }
}

// ======================================================
// ATENDIMENTOS — EDITAR E DELETAR
// ======================================================
function renderAtendimentosGerenciar() {
  // Busca todos atendimentos (não só hoje)
  return `
  <div class="card">
    <div class="card-header">
      <svg viewBox="0 0 24 24"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
      <span class="card-title">Atendimentos de hoje</span>
    </div>
    ${atendimentos.length > 0 ? atendimentos.map(a => `
    <div class="list-item">
      <div class="list-item-left">
        <div>
          <div class="list-name">${a.placa || '—'} <span class="tag ${a.tipo_veiculo === 'Carreta' ? 'blue' : 'green'}">${a.tipo_veiculo || 'Caminhão'}</span></div>
          <div class="list-sub">${a.servico} · ${a.funcionario_nome || '—'} · ${brl(a.valor)}</div>
        </div>
      </div>
      <div class="action-btns">
        <button class="btn-edit" onclick="editarAtendimento(${a.id})">Editar</button>
        <button class="btn-danger" onclick="deleteAtendimento(${a.id})">Deletar</button>
      </div>
    </div>`).join('') : '<div class="empty"><svg viewBox="0 0 24 24"><path d="M1 3h15l2 7H3L1 3z"/><circle cx="7" cy="17" r="2"/><circle cx="15" cy="17" r="2"/></svg>Nenhum atendimento hoje</div>'}
  </div>`;
}

// ======================================================
// VEÍCULOS — HISTÓRICO POR PLACA
// ======================================================
function renderVeiculos() {
  const porPlaca = {};
  atendimentos.forEach(a => {
    const p = a.placa || 'SEM PLACA';
    if (!porPlaca[p]) porPlaca[p] = { placa: p, tipo: a.tipo_veiculo, qtd: 0, total: 0, atendimentos: [] };
    porPlaca[p].qtd++;
    porPlaca[p].total += parseFloat(a.valor || 0);
    porPlaca[p].atendimentos.push(a);
  });
  const veiculos = Object.values(porPlaca).sort((a, b) => b.qtd - a.qtd);

  return `
  <div class="card">
    <div class="card-header">
      <svg viewBox="0 0 24 24"><path d="M1 3h15l2 7H3L1 3z"/><circle cx="7" cy="17" r="2"/><circle cx="15" cy="17" r="2"/></svg>
      <span class="card-title">Veículos atendidos hoje</span>
    </div>
    ${veiculos.length > 0 ? veiculos.map(v => `
    <div class="list-item">
      <div class="list-item-left">
        <div>
          <div class="list-name">${v.placa} <span class="tag ${v.tipo === 'Carreta' ? 'blue' : 'green'}">${v.tipo || 'Caminhão'}</span></div>
          <div class="list-sub">${v.qtd} serviço${v.qtd !== 1 ? 's' : ''} · ${brl(v.total)}</div>
        </div>
      </div>
    </div>`).join('') : '<div class="empty"><svg viewBox="0 0 24 24"><path d="M1 3h15l2 7H3L1 3z"/><circle cx="7" cy="17" r="2"/><circle cx="15" cy="17" r="2"/></svg>Nenhum veículo hoje</div>'}
  </div>`;
}

// ======================================================
// MODAL
// ======================================================
function abrirModal(titulo, body, onSave) {
  document.getElementById('modal-title').textContent = titulo;
  document.getElementById('modal-body').innerHTML = body;
  document.getElementById('modal-save').onclick = onSave;
  document.getElementById('modal-overlay').classList.add('open');
}

function fecharModal(e) {
  if (e && e.target !== document.getElementById('modal-overlay')) return;
  document.getElementById('modal-overlay').classList.remove('open');
}

// ======================================================
// EDITAR FUNCIONÁRIO
// ======================================================
function editarFuncionario(id, nome) {
  abrirModal('Editar funcionário', `
    <div class="form-group">
      <label>Nome</label>
      <input id="edit-func-nome" value="${nome}">
    </div>`, async () => {
    const novoNome = document.getElementById('edit-func-nome').value.trim();
    if (!novoNome) { showToast('Digite o nome!', true); return; }
    try {
      await api('funcionarios?id=eq.' + id, 'PATCH', { nome: novoNome });
      showToast('Funcionário atualizado!');
      document.getElementById('modal-overlay').classList.remove('open');
      await showTab('gerenciar');
      trocarGerenciar('funcionarios');
    } catch (e) { showToast('Erro ao atualizar!', true); }
  });
}

// ======================================================
// ATIVAR / DESATIVAR FUNCIONÁRIO
// ======================================================
async function toggleFuncionario(id, ativo) {
  const acao = ativo ? 'desativar' : 'ativar';
  if (!confirm(`Deseja ${acao} este funcionário?`)) return;
  try {
    await api('funcionarios?id=eq.' + id, 'PATCH', { ativo: !ativo });
    showToast(`Funcionário ${ativo ? 'desativado' : 'ativado'}!`);
    await showTab('gerenciar');
    trocarGerenciar('funcionarios');
  } catch (e) { showToast('Erro!', true); }
}

// ======================================================
// EDITAR SERVIÇO
// ======================================================
function editarServico(id, nome, preco) {
  abrirModal('Editar serviço', `
    <div class="form-group" style="margin-bottom:12px">
      <label>Nome do serviço</label>
      <input id="edit-serv-nome" value="${nome}">
    </div>
    <div class="form-group">
      <label>Preço sugerido (opcional)</label>
      <input id="edit-serv-preco" type="number" step="0.01" value="${preco}">
    </div>`, async () => {
    const novoNome  = document.getElementById('edit-serv-nome').value.trim();
    const novoPreco = document.getElementById('edit-serv-preco').value;
    if (!novoNome) { showToast('Digite o nome!', true); return; }
    try {
      await api('servicos?id=eq.' + id, 'PATCH', { nome: novoNome, preco_sugerido: novoPreco ? parseFloat(novoPreco) : null });
      showToast('Serviço atualizado!');
      document.getElementById('modal-overlay').classList.remove('open');
      await showTab('gerenciar');
      trocarGerenciar('servicos');
    } catch (e) { showToast('Erro ao atualizar!', true); }
  });
}

// ======================================================
// EDITAR ATENDIMENTO
// ======================================================
function editarAtendimento(id) {
  const a = atendimentos.find(x => x.id === id);
  if (!a) return;
  abrirModal('Editar atendimento', `
    <div class="form-grid" style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
      <div class="form-group">
        <label>Placa</label>
        <input id="edit-placa" value="${a.placa || ''}" style="text-transform:uppercase">
      </div>
      <div class="form-group">
        <label>Tipo</label>
        <select id="edit-tipo">
          <option value="Caminhão" ${a.tipo_veiculo === 'Caminhão' ? 'selected' : ''}>🚛 Caminhão</option>
          <option value="Carreta"  ${a.tipo_veiculo === 'Carreta'  ? 'selected' : ''}>🚚 Carreta</option>
        </select>
      </div>
      <div class="form-group">
        <label>Serviço</label>
        <input id="edit-servico" value="${a.servico || ''}">
      </div>
      <div class="form-group">
        <label>Valor (R$)</label>
        <input id="edit-valor" type="number" step="0.01" value="${a.valor || ''}">
      </div>
      <div class="form-group">
        <label>Funcionário</label>
        <select id="edit-func">
          ${funcionarios.map(f => `<option value="${f.id}" data-nome="${f.nome}" ${f.id === a.funcionario_id ? 'selected' : ''}>${f.nome}</option>`).join('')}
        </select>
      </div>
    </div>`, async () => {
    const placa    = document.getElementById('edit-placa').value.trim().toUpperCase();
    const tipo     = document.getElementById('edit-tipo').value;
    const servico  = document.getElementById('edit-servico').value.trim();
    const valor    = parseFloat(document.getElementById('edit-valor').value);
    const funcSel  = document.getElementById('edit-func');
    const funcId   = parseInt(funcSel.value);
    const funcNome = funcSel.selectedOptions[0]?.dataset.nome || '';
    if (!servico || !valor) { showToast('Preencha todos os campos!', true); return; }
    try {
      await api('atendimentos?id=eq.' + id, 'PATCH', { placa, tipo_veiculo: tipo, servico, valor, funcionario_id: funcId, funcionario_nome: funcNome });
      showToast('Atendimento atualizado!');
      document.getElementById('modal-overlay').classList.remove('open');
      await showTab('gerenciar');
      trocarGerenciar('atendimentos');
    } catch (e) { showToast('Erro ao atualizar!', true); }
  });
}

// ======================================================
// DELETAR ATENDIMENTO
// ======================================================
async function deleteAtendimento(id) {
  if (!confirm('Deletar este atendimento?')) return;
  try {
    await api('atendimentos?id=eq.' + id, 'DELETE');
    showToast('Atendimento removido!');
    await showTab('gerenciar');
    trocarGerenciar('atendimentos');
  } catch (e) { showToast('Erro ao remover!', true); }
}

// ======================================================
// PREENCHIMENTO DAS LISTAS DE FUNCIONÁRIOS E SERVIÇOS
// ======================================================
function preencherListas() {
  renderGerenciarContent();
}

// ======================================================
// FUNÇÕES AUXILIARES: ADICIONAR / REMOVER ITENS
// ======================================================
function toggleForm(id) { document.getElementById(id).classList.toggle('open'); }

async function addFuncionario() {
  const nome = document.getElementById('new-func-nome').value.trim();
  if (!nome) { showToast('Digite o nome!', true); return; }
  try { await api('funcionarios', 'POST', { nome }); showToast('Funcionário adicionado!'); showTab('gerenciar'); }
  catch (e) { showToast('Erro ao adicionar!', true); }
}

async function addServico() {
  const nome  = document.getElementById('new-serv-nome').value.trim();
  const preco = document.getElementById('new-serv-preco').value;
  if (!nome) { showToast('Digite o nome do serviço!', true); return; }
  try { await api('servicos', 'POST', { nome, preco_sugerido: preco ? parseFloat(preco) : null }); showToast('Serviço adicionado!'); showTab('gerenciar'); }
  catch (e) { showToast('Erro ao adicionar!', true); }
}

async function deleteFuncionario(id) {
  if (!confirm('Remover este funcionário?')) return;
  try { await api('funcionarios?id=eq.' + id, 'DELETE'); showToast('Funcionário removido!'); showTab('gerenciar'); }
  catch (e) { showToast('Erro ao remover!', true); }
}

async function deleteServico(id) {
  if (!confirm('Remover este serviço?')) return;
  try { await api('servicos?id=eq.' + id, 'DELETE'); showToast('Serviço removido!'); showTab('gerenciar'); }
  catch (e) { showToast('Erro ao remover!', true); }
}

// ======================================================
// CUSTOS — RENDER PRINCIPAL
// ======================================================
let custosTab = 'margem';

async function renderCustos() {
  return `
  <div class="pneus-subnav">
    <button class="subnav-btn ${custosTab === 'margem'      ? 'active' : ''}" onclick="trocarCustos('margem')">📊 Margem de Lucro</button>
    <button class="subnav-btn ${custosTab === 'fixos'       ? 'active' : ''}" onclick="trocarCustos('fixos')">🏠 Custos Fixos</button>
    <button class="subnav-btn ${custosTab === 'servico'     ? 'active' : ''}" onclick="trocarCustos('servico')">🔧 Custos por Serviço</button>
    <button class="subnav-btn ${custosTab === 'fornecedores'? 'active' : ''}" onclick="trocarCustos('fornecedores')">🚚 Fornecedores</button>
    <button class="subnav-btn ${custosTab === 'compras'     ? 'active' : ''}" onclick="trocarCustos('compras')">📦 Compras</button>
  </div>
  <div id="custos-content">
    ${renderCustosContent()}
  </div>`;
}

function trocarCustos(tab) {
  custosTab = tab;
  document.querySelectorAll('.pneus-subnav .subnav-btn').forEach((b, i) => {
    const tabs = ['margem','fixos','servico','fornecedores','compras'];
    b.classList.toggle('active', tabs[i] === tab);
  });
  document.getElementById('custos-content').innerHTML = renderCustosContent();
}

function renderCustosContent() {
  if (custosTab === 'margem')       return renderMargem();
  if (custosTab === 'fixos')        return renderCustosFixos();
  if (custosTab === 'servico')      return renderCustosServico();
  if (custosTab === 'fornecedores') return renderFornecedores();
  if (custosTab === 'compras')      return renderCompras();
  return '';
}

// ======================================================
// MARGEM DE LUCRO
// ======================================================
function renderMargem() {
  const mesAtual  = new Date().getMonth() + 1;
  const anoAtual  = new Date().getFullYear();
  const nomeMes   = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho',
                     'Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'][mesAtual - 1];

  // Faturamento do dia (serviços)
  const fatDia = atendimentos.reduce((s, a) => s + parseFloat(a.valor || 0), 0);

  // Vendas de pneus do mês
  const vendasPneus = movimentacoes
    .filter(m => m.tipo === 'venda')
    .reduce((s, m) => s + parseFloat(m.total || 0), 0);

  // Custo dos pneus vendidos
  const custoPneus = movimentacoes
    .filter(m => m.tipo === 'venda')
    .reduce((s, m) => s + (parseFloat(m.valor_unit || 0) * m.quantidade), 0);

  // Total custos fixos do mês
  const totalFixos = custosFixos.reduce((s, c) => s + parseFloat(c.valor || 0), 0);

  // Compras do mês
  const totalCompras = comprasFornecedor.reduce((s, c) => s + parseFloat(c.total || 0), 0);

  // Agrupamento por categoria
  const porCategoria = {};
  custosFixos.forEach(c => {
    if (!porCategoria[c.categoria]) porCategoria[c.categoria] = 0;
    porCategoria[c.categoria] += parseFloat(c.valor || 0);
  });

  const receitaTotal  = fatDia + vendasPneus;
  const custoTotal    = totalFixos + custoPneus;
  const lucro         = receitaTotal - custoTotal;
  const margem        = receitaTotal > 0 ? (lucro / receitaTotal * 100).toFixed(1) : 0;

  return `
  <div class="custos-resumo-grid">
    <div class="metric-card">
      <div class="metric-icon green"><svg viewBox="0 0 24 24"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/></svg></div>
      <div class="metric-label">Receita hoje</div>
      <div class="metric-value sm">${brl(receitaTotal)}</div>
      <div class="metric-sub">serviços + pneus</div>
    </div>
    <div class="metric-card">
      <div class="metric-icon coral"><svg viewBox="0 0 24 24"><polyline points="23 18 13.5 8.5 8.5 13.5 1 6"/></svg></div>
      <div class="metric-label">Custos do mês</div>
      <div class="metric-value sm">${brl(totalFixos)}</div>
      <div class="metric-sub">${nomeMes} ${anoAtual}</div>
    </div>
    <div class="metric-card">
      <div class="metric-icon ${lucro >= 0 ? 'green' : 'coral'}">
        <svg viewBox="0 0 24 24"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
      </div>
      <div class="metric-label">Lucro estimado</div>
      <div class="metric-value sm ${lucro >= 0 ? 'margem-positivo' : 'margem-negativo'}">${brl(lucro)}</div>
      <div class="metric-sub">receita − custos</div>
    </div>
    <div class="metric-card">
      <div class="metric-icon ${margem >= 20 ? 'green' : 'amber'}">
        <svg viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 21 12 17.77 5.82 21 7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
      </div>
      <div class="metric-label">Margem de lucro</div>
      <div class="metric-value sm ${margem >= 20 ? 'margem-positivo' : 'margem-negativo'}">${margem}%</div>
      <div class="metric-sub">${margem >= 20 ? 'saudável ✅' : 'atenção ⚠️'}</div>
    </div>
  </div>

  <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px">
    <div class="margem-card">
      <div class="card-header" style="margin-bottom:16px;padding-bottom:12px;border-bottom:0.5px solid var(--border)">
        <svg viewBox="0 0 24 24" style="width:16px;height:16px;stroke:var(--green);fill:none;stroke-width:2;stroke-linecap:round;stroke-linejoin:round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/></svg>
        <span class="card-title">Receitas</span>
      </div>
      <div class="margem-row"><span>Serviços hoje</span><span>${brl(fatDia)}</span></div>
      <div class="margem-row"><span>Vendas de pneus</span><span>${brl(vendasPneus)}</span></div>
      <div class="margem-row total"><span>Total</span><span class="margem-positivo">${brl(receitaTotal)}</span></div>
    </div>

    <div class="margem-card">
      <div class="card-header" style="margin-bottom:16px;padding-bottom:12px;border-bottom:0.5px solid var(--border)">
        <svg viewBox="0 0 24 24" style="width:16px;height:16px;stroke:var(--coral);fill:none;stroke-width:2;stroke-linecap:round;stroke-linejoin:round"><polyline points="23 18 13.5 8.5 8.5 13.5 1 6"/></svg>
        <span class="card-title">Custos do mês — ${nomeMes}</span>
      </div>
      ${Object.entries(porCategoria).map(([cat, val]) => `
      <div class="margem-row">
        <span><span class="custo-categoria-badge ${cat}">${cat}</span></span>
        <span>${brl(val)}</span>
      </div>`).join('') || '<div style="color:var(--text-hint);font-size:13px;padding:8px 0">Nenhum custo lançado este mês</div>'}
      <div class="margem-row"><span>Custo pneus vendidos</span><span>${brl(custoPneus)}</span></div>
      <div class="margem-row total"><span>Total</span><span class="margem-negativo">${brl(custoTotal)}</span></div>
    </div>
  </div>`;
}

// ======================================================
// CUSTOS FIXOS
// ======================================================
function renderCustosFixos() {
  const mesAtual = new Date().getMonth() + 1;
  const anoAtual = new Date().getFullYear();
  const nomeMes  = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho',
                    'Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'][mesAtual - 1];
  const total    = custosFixos.reduce((s, c) => s + parseFloat(c.valor || 0), 0);

  const categorias = ['Energia','Água','Internet','Salário','Recapagem','Carcaca','Sucata','Banda','Outro'];

  return `
  <div class="card" style="max-width:700px">
    <div class="card-header">
      <svg viewBox="0 0 24 24"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
      <span class="card-title">Custos fixos — ${nomeMes} ${anoAtual}</span>
      <span style="margin-left:auto;font-size:13px;color:var(--text-muted)">Total: <strong>${brl(total)}</strong></span>
    </div>
    ${custosFixos.length > 0 ? custosFixos.map(c => `
    <div class="manage-row">
      <div>
        <div class="manage-name">${c.nome} <span class="custo-categoria-badge ${c.categoria}">${c.categoria}</span></div>
        <div class="manage-sub">${brl(c.valor)}</div>
      </div>
      <div class="action-btns">
        <button class="btn-edit"   onclick="editarCustoFixo(${c.id}, '${c.nome}', '${c.categoria}', ${c.valor})">Editar</button>
        <button class="btn-danger" onclick="deleteCustoFixo(${c.id})">Remover</button>
      </div>
    </div>`).join('') : '<div style="color:var(--text-hint);font-size:13px;padding:12px 0">Nenhum custo lançado este mês</div>'}

    <div class="add-form" id="form-custo-fixo">
      <div class="form-grid" style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
        <div class="form-group">
          <label>Descrição</label>
          <input id="cf-nome" placeholder="Ex: Conta de energia">
        </div>
        <div class="form-group">
          <label>Categoria</label>
          <select id="cf-cat">
            ${categorias.map(c => `<option value="${c}">${c}</option>`).join('')}
          </select>
        </div>
        <div class="form-group">
          <label>Valor (R$)</label>
          <input id="cf-valor" type="number" step="0.01" placeholder="0,00">
        </div>
      </div>
      <div class="add-form-row">
        <button class="btn-primary" onclick="addCustoFixo()">Adicionar</button>
        <button class="btn-secondary" onclick="toggleForm('form-custo-fixo')">Cancelar</button>
      </div>
    </div>
    <button class="btn-secondary" onclick="toggleForm('form-custo-fixo')">+ Lançar custo</button>
  </div>`;
}

async function addCustoFixo() {
  const nome = document.getElementById('cf-nome').value.trim();
  const cat  = document.getElementById('cf-cat').value;
  const val  = parseFloat(document.getElementById('cf-valor').value);
  if (!nome || !val) { showToast('Preencha todos os campos!', true); return; }
  try {
    await api('custos_fixos', 'POST', {
      nome, categoria: cat, valor: val,
      mes: new Date().getMonth() + 1,
      ano: new Date().getFullYear()
    });
    showToast('Custo lançado!');
    await carregarDados();
    trocarCustos('fixos');
  } catch (e) { showToast('Erro!', true); }
}

function editarCustoFixo(id, nome, cat, valor) {
  const categorias = ['energia','agua','internet','salario','recapagem','carcaca','sucata','banda','outro'];
  abrirModal('Editar custo fixo', `
    <div class="form-group" style="margin-bottom:12px">
      <label>Descrição</label>
      <input id="ecf-nome" value="${nome}">
    </div>
    <div class="form-group" style="margin-bottom:12px">
      <label>Categoria</label>
      <select id="ecf-cat">
        ${categorias.map(c => `<option value="${c}" ${c === cat ? 'selected' : ''}>${c}</option>`).join('')}
      </select>
    </div>
    <div class="form-group">
      <label>Valor (R$)</label>
      <input id="ecf-valor" type="number" step="0.01" value="${valor}">
    </div>`, async () => {
    const novoNome = document.getElementById('ecf-nome').value.trim();
    const novoCat  = document.getElementById('ecf-cat').value;
    const novoVal  = parseFloat(document.getElementById('ecf-valor').value);
    if (!novoNome || !novoVal) { showToast('Preencha todos os campos!', true); return; }
    try {
      await api('custos_fixos?id=eq.' + id, 'PATCH', { nome: novoNome, categoria: novoCat, valor: novoVal });
      showToast('Custo atualizado!');
      document.getElementById('modal-overlay').classList.remove('open');
      await carregarDados();
      trocarCustos('fixos');
    } catch (e) { showToast('Erro!', true); }
  });
}

async function deleteCustoFixo(id) {
  if (!confirm('Remover este custo?')) return;
  try {
    await api('custos_fixos?id=eq.' + id, 'DELETE');
    showToast('Custo removido!');
    await carregarDados();
    trocarCustos('fixos');
  } catch (e) { showToast('Erro!', true); }
}

// ======================================================
// CUSTOS POR SERVIÇO
// ======================================================
function renderCustosServico() {
  return `
  <div class="card" style="max-width:700px">
    <div class="card-header">
      <svg viewBox="0 0 24 24"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>
      <span class="card-title">Custos por serviço</span>
    </div>
    <div style="font-size:12px;color:var(--text-muted);margin-bottom:16px">Cadastre o custo de cada item por tipo de serviço (recapagem, carcaça, banda, sucata)</div>
    ${custosServico && custosServico.length > 0 ? custosServico.map(c => `
    <div class="manage-row">
      <div>
        <div class="manage-name">${c.servico}</div>
        <div class="manage-sub">${c.custo_item} · ${brl(c.valor)}</div>
      </div>
      <div class="action-btns">
        <button class="btn-danger" onclick="deleteCustoServico(${c.id})">Remover</button>
      </div>
    </div>`).join('') : '<div style="color:var(--text-hint);font-size:13px;padding:12px 0">Nenhum custo por serviço cadastrado</div>'}
    <div class="add-form" id="form-custo-serv">
      <div class="form-grid" style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
        <div class="form-group">
          <label>Serviço</label>
          <input id="cs-serv" placeholder="Ex: Recapagem">
        </div>
        <div class="form-group">
          <label>Item de custo</label>
          <select id="cs-item">
            <option value="recapagem">Recapagem</option>
            <option value="carcaca">Carcaça</option>
            <option value="banda">Banda</option>
            <option value="sucata">Sucata</option>
            <option value="energia">Energia</option>
            <option value="outro">Outro</option>
          </select>
        </div>
        <div class="form-group">
          <label>Valor (R$)</label>
          <input id="cs-valor" type="number" step="0.01" placeholder="0,00">
        </div>
      </div>
      <div class="add-form-row">
        <button class="btn-primary" onclick="addCustoServico()">Adicionar</button>
        <button class="btn-secondary" onclick="toggleForm('form-custo-serv')">Cancelar</button>
      </div>
    </div>
    <button class="btn-secondary" onclick="toggleForm('form-custo-serv')">+ Adicionar custo</button>
  </div>`;
}

async function addCustoServico() {
  const serv = document.getElementById('cs-serv').value.trim();
  const item = document.getElementById('cs-item').value;
  const val  = parseFloat(document.getElementById('cs-valor').value);
  if (!serv || !val) { showToast('Preencha todos os campos!', true); return; }
  try {
    await api('custos_servico', 'POST', { servico: serv, custo_item: item, valor: val });
    showToast('Custo adicionado!');
    await carregarDados();
    trocarCustos('servico');
  } catch (e) { showToast('Erro!', true); }
}

async function deleteCustoServico(id) {
  if (!confirm('Remover este custo?')) return;
  try {
    await api('custos_servico?id=eq.' + id, 'DELETE');
    showToast('Removido!');
    await carregarDados();
    trocarCustos('servico');
  } catch (e) { showToast('Erro!', true); }
}

// ======================================================
// FORNECEDORES
// ======================================================
function renderFornecedores() {
  return `
  <div class="card" style="max-width:600px">
    <div class="card-header">
      <svg viewBox="0 0 24 24"><path d="M1 3h15l2 7H3L1 3z"/><circle cx="7" cy="17" r="2"/><circle cx="15" cy="17" r="2"/></svg>
      <span class="card-title">Fornecedores</span>
    </div>
    ${fornecedores.map(f => `
    <div class="manage-row">
      <div>
        <div class="manage-name">${f.nome} <span class="fornecedor-badge ${f.tipo}">${f.tipo}</span></div>
      </div>
      <div class="action-btns">
        <button class="btn-edit"   onclick="editarFornecedor(${f.id}, '${f.nome}', '${f.tipo}')">Editar</button>
        <button class="btn-danger" onclick="deleteFornecedor(${f.id})">Remover</button>
      </div>
    </div>`).join('')}
    <div class="add-form" id="form-forn">
      <div class="form-grid" style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
        <div class="form-group">
          <label>Nome</label>
          <input id="fn-nome" placeholder="Ex: Mogicap">
        </div>
        <div class="form-group">
          <label>Tipo</label>
          <select id="fn-tipo">
            <option value="nacional">Nacional</option>
            <option value="importado">Importado</option>
            <option value="banda">Banda</option>
          </select>
        </div>
      </div>
      <div class="add-form-row">
        <button class="btn-primary" onclick="addFornecedor()">Adicionar</button>
        <button class="btn-secondary" onclick="toggleForm('form-forn')">Cancelar</button>
      </div>
    </div>
    <button class="btn-secondary" onclick="toggleForm('form-forn')">+ Adicionar fornecedor</button>
  </div>`;
}

async function addFornecedor() {
  const nome = document.getElementById('fn-nome').value.trim();
  const tipo = document.getElementById('fn-tipo').value;
  if (!nome) { showToast('Digite o nome!', true); return; }
  try {
    await api('fornecedores', 'POST', { nome, tipo });
    showToast('Fornecedor adicionado!');
    await carregarDados();
    trocarCustos('fornecedores');
  } catch (e) { showToast('Erro!', true); }
}

function editarFornecedor(id, nome, tipo) {
  abrirModal('Editar fornecedor', `
    <div class="form-group" style="margin-bottom:12px">
      <label>Nome</label>
      <input id="ef-nome" value="${nome}">
    </div>
    <div class="form-group">
      <label>Tipo</label>
      <select id="ef-tipo">
        <option value="nacional"  ${tipo === 'nacional'  ? 'selected' : ''}>Nacional</option>
        <option value="importado" ${tipo === 'importado' ? 'selected' : ''}>Importado</option>
        <option value="banda"     ${tipo === 'banda'     ? 'selected' : ''}>Banda</option>
      </select>
    </div>`, async () => {
    const novoNome = document.getElementById('ef-nome').value.trim();
    const novoTipo = document.getElementById('ef-tipo').value;
    if (!novoNome) { showToast('Digite o nome!', true); return; }
    try {
      await api('fornecedores?id=eq.' + id, 'PATCH', { nome: novoNome, tipo: novoTipo });
      showToast('Fornecedor atualizado!');
      document.getElementById('modal-overlay').classList.remove('open');
      await carregarDados();
      trocarCustos('fornecedores');
    } catch (e) { showToast('Erro!', true); }
  });
}

async function deleteFornecedor(id) {
  if (!confirm('Remover este fornecedor?')) return;
  try {
    await api('fornecedores?id=eq.' + id, 'DELETE');
    showToast('Fornecedor removido!');
    await carregarDados();
    trocarCustos('fornecedores');
  } catch (e) { showToast('Erro!', true); }
}

// ======================================================
// COMPRAS POR FORNECEDOR
// ======================================================
function renderCompras() {
  const total = comprasFornecedor.reduce((s, c) => s + parseFloat(c.total || 0), 0);
  return `
  <div class="card">
    <div class="card-header">
      <svg viewBox="0 0 24 24"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
      <span class="card-title">Compras por fornecedor</span>
      <span style="margin-left:auto;font-size:13px;color:var(--text-muted)">Total: <strong>${brl(total)}</strong></span>
    </div>
    ${comprasFornecedor.length > 0 ? comprasFornecedor.map(c => {
      const forn = fornecedores.find(f => f.id === c.fornecedor_id);
      return `
      <div class="list-item">
        <div class="list-item-left">
          <div>
            <div class="list-name">${c.fornecedor_nome || '—'} ${forn ? `<span class="fornecedor-badge ${forn.tipo}">${forn.tipo}</span>` : ''}</div>
            <div class="list-sub">${c.descricao || '—'} · ${c.quantidade} un · ${brl(c.valor_unit)} cada</div>
          </div>
        </div>
        <div>
          <div class="list-val">${brl(c.total)}</div>
          <div class="list-val-sub">${new Date(c.created_at).toLocaleString('pt-BR', { day:'2-digit', month:'2-digit', hour:'2-digit', minute:'2-digit' })}</div>
        </div>
      </div>`;
    }).join('') : '<div class="empty"><svg viewBox="0 0 24 24"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/></svg>Nenhuma compra registrada</div>'}

    <div class="add-form" id="form-compra">
      <div class="form-grid" style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
        <div class="form-group">
          <label>Fornecedor</label>
          <select id="cp-forn">
            <option value="">Selecione...</option>
            ${fornecedores.map(f => `<option value="${f.id}" data-nome="${f.nome}">${f.nome}</option>`).join('')}
          </select>
        </div>
        <div class="form-group">
          <label>Descrição</label>
          <input id="cp-desc" placeholder="Ex: Pneu 295/80R22.5">
        </div>
        <div class="form-group">
          <label>Quantidade</label>
          <input id="cp-qtd" type="number" min="1" value="1">
        </div>
        <div class="form-group">
          <label>Valor unitário (R$)</label>
          <input id="cp-valor" type="number" step="0.01" placeholder="0,00">
        </div>
      </div>
      <div class="add-form-row">
        <button class="btn-primary" onclick="addCompra()">Registrar compra</button>
        <button class="btn-secondary" onclick="toggleForm('form-compra')">Cancelar</button>
      </div>
    </div>
<div style="margin-top:16px;padding:12px 16px;background:var(--green-light);border-radius:var(--radius-sm);font-size:13px;color:var(--green-dark)">
      💡 As compras são registradas automaticamente ao dar entrada de pneus na aba <strong>Pneus → Compra</strong>
    </div>
  </div>`;
}


// ======================================================
// PERFIL DO USUÁRIO LOGADO
// ======================================================
function carregarPerfil() {
  const s = getSessao();
  if (!s) return;
  const email  = s.user?.email || '';
  const nome   = s.user?.user_metadata?.full_name
              || s.user?.user_metadata?.name
              || email.split('@')[0]
              || 'Usuário';
  document.getElementById('user-name').textContent   = nome;
  document.getElementById('user-avatar').textContent = nome.charAt(0).toUpperCase();
}

// ======================================================
// INICIALIZAÇÃO AUTOMÁTICA DO SISTEMA
// Carrega painel ao abrir e atualiza a cada 30s
// ======================================================

carregarPerfil();
showTab('painel');

setInterval(() => {
  if (currentTab === 'painel') showTab('painel');
}, 30000);