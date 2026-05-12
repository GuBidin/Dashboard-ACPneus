// ==========================================
//  CONFIGURAÇÃO SUPABASE
// ==========================================
const SUPA_URL = 'https://lnqnyxoluosjilmyodhz.supabase.co';
const SUPA_KEY = 'sb_publishable_9-C2g0v7lAfhHNvbclTw0A_aPnm_2Sc';

const HEADERS = {
  'Content-Type':  'application/json',
  'apikey':        SUPA_KEY,
  'Authorization': 'Bearer ' + SUPA_KEY,
};

// ==========================================
//  FUNÇÃO BASE DE API
// ==========================================
async function api(path, method = 'GET', body = null) {
  const opts = { method, headers: { ...HEADERS } };
  if (body) opts.body = JSON.stringify(body);
  const r = await fetch(SUPA_URL + '/rest/v1/' + path, opts);
  if (!r.ok) throw new Error(await r.text());
  const t = await r.text();
  return t ? JSON.parse(t) : [];
}

// ==========================================
//  ESTADO GLOBAL
// ==========================================
let funcionarios = [];
let servicos     = [];
let atendimentos = [];

// ==========================================
//  CARREGAR DADOS DO SUPABASE
// ==========================================
async function carregarDados() {
  try {
    const hoje = new Date().toISOString().split('T')[0];
    [funcionarios, servicos, atendimentos] = await Promise.all([
      api('funcionarios?ativo=eq.true&order=nome'),
      api('servicos?ativo=eq.true&order=nome'),
      api('atendimentos?horario=gte.' + hoje + 'T00:00:00&order=horario.desc')
    ]);
    setStatus(true);
  } catch (e) {
    setStatus(false);
    console.error('Erro ao carregar dados:', e);
  }
}

// ==========================================
//  STATUS ONLINE/OFFLINE
// ==========================================
function setStatus(ok) {
  document.getElementById('statusDot').className = 'status-dot' + (ok ? ' online' : '');
  document.getElementById('statusTxt').textContent = ok ? 'online' : 'offline';
}

// ==========================================
//  FORMATAR MOEDA
// ==========================================
function brl(v) {
  return 'R$ ' + parseFloat(v || 0).toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

// ==========================================
//  TOAST
// ==========================================
function showToast(msg, err = false) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className = 'toast' + (err ? ' error' : '') + ' show';
  setTimeout(() => t.className = 'toast', 2800);
}

// ==========================================
//  DATA NO FOOTER DA SIDEBAR
// ==========================================
const hoje = new Date();
const dias  = ['Domingo','Segunda','Terça','Quarta','Quinta','Sexta','Sábado'];
const meses = ['jan','fev','mar','abr','mai','jun','jul','ago','set','out','nov','dez'];

document.getElementById('headerDate').textContent =
  dias[hoje.getDay()] + ', ' + hoje.getDate() + ' de ' + meses[hoje.getMonth()];

// ==========================================
//  NAVEGAÇÃO ENTRE ABAS
// ==========================================
let currentTab = 'painel';

const pageTitles = {
  painel:    { title: 'Painel',    sub: 'Resumo do dia de hoje' },
  registrar: { title: 'Registrar', sub: 'Novo atendimento' },
  gerenciar: { title: 'Gerenciar', sub: 'Funcionários e serviços' }
};

async function showTab(tab) {
  currentTab = tab;

  ['painel', 'registrar', 'gerenciar'].forEach(t => {
    document.getElementById('tab-' + t).classList.toggle('active', t === tab);
  });

  document.getElementById('pageTitle').textContent = pageTitles[tab].title;
  document.getElementById('pageSub').textContent   = pageTitles[tab].sub;

  await carregarDados();

  if (tab === 'painel') {
    document.getElementById('main-content').innerHTML = renderPainel();
    animateBars();
  }
  if (tab === 'registrar') {
    document.getElementById('main-content').innerHTML = renderRegistrar();
    preencherSelects();
  }
  if (tab === 'gerenciar') {
    document.getElementById('main-content').innerHTML = renderGerenciar();
    preencherListas();
  }
}

// ==========================================
//  RENDER PAINEL
// ==========================================
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
      <div class="metric-icon blue">
        <svg viewBox="0 0 24 24"><path d="M1 3h15l2 7H3L1 3z"/><circle cx="7" cy="17" r="2"/><circle cx="15" cy="17" r="2"/></svg>
      </div>
      <div class="metric-label">Veículos hoje</div>
      <div class="metric-value">${total}</div>
      <div class="metric-sub">atendimentos</div>
    </div>

    <div class="metric-card">
      <div class="metric-icon green">
        <svg viewBox="0 0 24 24"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
      </div>
      <div class="metric-label">Faturamento</div>
      <div class="metric-value sm">${brl(fat)}</div>
      <div class="metric-sub">hoje</div>
    </div>

    <div class="metric-card">
      <div class="metric-icon amber">
        <svg viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 21 12 17.77 5.82 21 7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
      </div>
      <div class="metric-label">Top funcionário</div>
      <div class="metric-value sm">${topFunc ? topFunc.nome : '—'}</div>
      <div class="metric-sub">${topFunc ? topFunc.qtd + ' serviço(s)' : ''}</div>
    </div>

    <div class="metric-card">
      <div class="metric-icon coral">
        <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
      </div>
      <div class="metric-label">Horário mais cheio</div>
      <div class="metric-value sm">${peakHora && peakHora[1] > 0 ? peakHora[0] + 'h' : '—'}</div>
      <div class="metric-sub">${peakHora && peakHora[1] > 0 ? peakHora[1] + ' atend.' : ''}</div>
    </div>

  </div>

  <p class="section-title">Análises</p>
  ${renderGraficos()}

  <p class="section-title">Equipe e atendimentos</p>
  ${renderRankingEAtendimentos()}
  `;
}

// ==========================================
//  RENDER GRÁFICOS
// ==========================================
function renderGraficos() {
  const porServ = {};
  atendimentos.forEach(a => {
    porServ[a.servico] = (porServ[a.servico] || 0) + 1;
  });
  const topServs = Object.entries(porServ).sort((a, b) => b[1] - a[1]).slice(0, 5);
  const maxServ  = topServs[0] ? topServs[0][1] : 1;

  const porHora = {};
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
        <div class="bar-track">
          <div class="bar-fill" data-pct="${Math.round(q / maxServ * 100)}" style="width:0%"></div>
        </div>
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
            <div class="hour-bar ${h == peakHora && q > 0 ? 'peak' : ''}"
                 data-h="${Math.round(q / maxHora * 100)}"
                 style="height:4px"></div>
          </div>
          <div class="hour-label">${h}h</div>
          <div class="hour-count">${q}</div>
        </div>`).join('')}
      </div>
    </div>
  </div>`;
}

// ==========================================
//  ANIMAR BARRAS
// ==========================================
function animateBars() {
  setTimeout(() => {
    document.querySelectorAll('.bar-fill[data-pct]').forEach(b => {
      b.style.width = b.dataset.pct + '%';
    });
    document.querySelectorAll('.hour-bar[data-h]').forEach(b => {
      b.style.height = Math.max(4, parseInt(b.dataset.h) / 100 * 80) + 'px';
    });
  }, 100);
}

// ==========================================
//  RENDER RANKING + ATENDIMENTOS
// ==========================================
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
          <div>
            <div class="list-name">${f.nome}</div>
            <div class="list-sub">${f.qtd} serviço${f.qtd !== 1 ? 's' : ''}</div>
          </div>
        </div>
        <div class="list-val">${brl(f.val)}</div>
      </div>`).join('')
    : `<div class="empty">
        <svg viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
        Nenhum atendimento hoje
      </div>`;

  const atendimentosHTML = atendimentos.length > 0
    ? atendimentos.slice(0, 10).map(a => `
      <div class="list-item">
        <div class="list-item-left">
          <div>
            <div class="list-name">
              ${a.placa || '—'}
              <span class="tag ${a.tipo_veiculo === 'Carreta' ? 'blue' : 'green'}">${a.tipo_veiculo || 'Caminhão'}</span>
            </div>
            <div class="list-sub">${a.servico} · ${a.funcionario_nome || '—'}</div>
          </div>
        </div>
        <div>
          <div class="list-val">${brl(a.valor)}</div>
          <div class="list-val-sub">${new Date(a.horario).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</div>
        </div>
      </div>`).join('')
    : `<div class="empty">
        <svg viewBox="0 0 24 24"><path d="M1 3h15l2 7H3L1 3z"/><circle cx="7" cy="17" r="2"/><circle cx="15" cy="17" r="2"/></svg>
        Nenhum atendimento registrado hoje
      </div>`;

  return `
  <div class="bottom-grid">
    <div class="card">
      <div class="card-header">
        <svg viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 21 12 17.77 5.82 21 7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
        <span class="card-title">Ranking</span>
      </div>
      ${rankingHTML}
    </div>
    <div class="card">
      <div class="card-header">
        <svg viewBox="0 0 24 24"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
        <span class="card-title">Últimos atendimentos</span>
      </div>
      ${atendimentosHTML}
    </div>
  </div>`;
}

// ==========================================
//  RENDER FORMULÁRIO DE REGISTRO
// ==========================================
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
          <select id="f-servico">
            <option value="">Selecione o serviço...</option>
          </select>
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
          <select id="f-func">
            <option value="">Selecione o funcionário...</option>
          </select>
        </div>

      </div>
      <hr class="form-divider">
      <button class="btn-primary" id="btn-registrar" onclick="registrar()">
        Registrar atendimento
      </button>
    </div>
  </div>`;
}

// ==========================================
//  PREENCHER SELECTS DO FORMULÁRIO
// ==========================================
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

// ==========================================
//  REGISTRAR ATENDIMENTO
// ==========================================
async function registrar() {
  const btn = document.getElementById('btn-registrar');
  btn.disabled = true;
  btn.textContent = 'Registrando...';

  const placa    = document.getElementById('f-placa').value.trim().toUpperCase();
  const tipo     = document.getElementById('f-tipo').value;
  const servSel  = document.getElementById('f-servico').value;
  const servico  = servSel === '__outro__'
    ? document.getElementById('f-servico-outro').value.trim()
    : servSel;
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
    await api('atendimentos', 'POST', {
      placa, tipo_veiculo: tipo, servico,
      valor, funcionario_id: funcId, funcionario_nome: funcNome
    });
    showToast('Atendimento registrado com sucesso!');
    showTab('painel');
  } catch (e) {
    showToast('Erro ao registrar!', true);
  }

  btn.disabled = false;
  btn.textContent = 'Registrar atendimento';
}

// ==========================================
//  RENDER GERENCIAR
// ==========================================
function renderGerenciar() {
  return `
  <div class="manage-grid">
    <div class="card">
      <div class="card-header">
        <svg viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
        <span class="card-title">Funcionários</span>
      </div>
      <div id="lista-funcionarios"></div>
      <div class="add-form" id="form-func">
        <div class="form-group">
          <label>Nome do funcionário</label>
          <input id="new-func-nome" placeholder="Ex: Carlos">
        </div>
        <div class="add-form-row">
          <button class="btn-primary" onclick="addFuncionario()">Adicionar</button>
          <button class="btn-secondary" onclick="toggleForm('form-func')">Cancelar</button>
        </div>
      </div>
      <button class="btn-secondary" onclick="toggleForm('form-func')">+ Adicionar funcionário</button>
    </div>

    <div class="card">
      <div class="card-header">
        <svg viewBox="0 0 24 24"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>
        <span class="card-title">Serviços e preços</span>
      </div>
      <div id="lista-servicos"></div>
      <div class="add-form" id="form-serv">
        <div class="form-group">
          <label>Nome do serviço</label>
          <input id="new-serv-nome" placeholder="Ex: Troca de Pneu">
        </div>
        <div class="form-group">
          <label>Preço sugerido (opcional)</label>
          <input id="new-serv-preco" type="number" step="0.01" placeholder="0,00">
        </div>
        <div class="add-form-row">
          <button class="btn-primary" onclick="addServico()">Adicionar</button>
          <button class="btn-secondary" onclick="toggleForm('form-serv')">Cancelar</button>
        </div>
      </div>
      <button class="btn-secondary" onclick="toggleForm('form-serv')">+ Adicionar serviço</button>
    </div>
  </div>`;
}

// ==========================================
//  PREENCHER LISTAS DO GERENCIAR
// ==========================================
function preencherListas() {
  const listaFunc = document.getElementById('lista-funcionarios');
  const listaServ = document.getElementById('lista-servicos');
  if (!listaFunc || !listaServ) return;

  listaFunc.innerHTML = funcionarios.length > 0
    ? funcionarios.map(f => `
      <div class="manage-row">
        <div><div class="manage-name">${f.nome}</div></div>
        <button class="btn-danger" onclick="deleteFuncionario(${f.id})">Remover</button>
      </div>`).join('')
    : '<div style="color:var(--text-hint);font-size:13px;padding:12px 0">Nenhum funcionário cadastrado</div>';

  listaServ.innerHTML = servicos.length > 0
    ? servicos.map(s => `
      <div class="manage-row">
        <div>
          <div class="manage-name">${s.nome}</div>
          <div class="manage-sub">${s.preco_sugerido ? brl(s.preco_sugerido) : 'Preço livre'}</div>
        </div>
        <button class="btn-danger" onclick="deleteServico(${s.id})">Remover</button>
      </div>`).join('')
    : '<div style="color:var(--text-hint);font-size:13px;padding:12px 0">Nenhum serviço cadastrado</div>';
}

// ==========================================
//  HELPERS GERENCIAR
// ==========================================
function toggleForm(id) {
  document.getElementById(id).classList.toggle('open');
}

async function addFuncionario() {
  const nome = document.getElementById('new-func-nome').value.trim();
  if (!nome) { showToast('Digite o nome!', true); return; }
  try {
    await api('funcionarios', 'POST', { nome });
    showToast('Funcionário adicionado!');
    showTab('gerenciar');
  } catch (e) { showToast('Erro ao adicionar!', true); }
}

async function addServico() {
  const nome  = document.getElementById('new-serv-nome').value.trim();
  const preco = document.getElementById('new-serv-preco').value;
  if (!nome) { showToast('Digite o nome do serviço!', true); return; }
  try {
    await api('servicos', 'POST', { nome, preco_sugerido: preco ? parseFloat(preco) : null });
    showToast('Serviço adicionado!');
    showTab('gerenciar');
  } catch (e) { showToast('Erro ao adicionar!', true); }
}

async function deleteFuncionario(id) {
  if (!confirm('Remover este funcionário?')) return;
  try {
    await api('funcionarios?id=eq.' + id, 'DELETE');
    showToast('Funcionário removido!');
    showTab('gerenciar');
  } catch (e) { showToast('Erro ao remover!', true); }
}

async function deleteServico(id) {
  if (!confirm('Remover este serviço?')) return;
  try {
    await api('servicos?id=eq.' + id, 'DELETE');
    showToast('Serviço removido!');
    showTab('gerenciar');
  } catch (e) { showToast('Erro ao remover!', true); }
}

// ==========================================
//  INICIA O APP
// ==========================================
showTab('painel');

// Atualiza painel a cada 30 segundos
setInterval(() => {
  if (currentTab === 'painel') showTab('painel');
}, 30000);