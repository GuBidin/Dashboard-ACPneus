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

function showTab(tab) {
  currentTab = tab;

  // Atualiza botões da sidebar
  ['painel', 'registrar', 'gerenciar'].forEach(t => {
    document.getElementById('tab-' + t).classList.toggle('active', t === tab);
  });

  // Atualiza título da página
  document.getElementById('pageTitle').textContent = pageTitles[tab].title;
  document.getElementById('pageSub').textContent   = pageTitles[tab].sub;
  // ==========================================
//  RENDER PAINEL — CARDS DE MÉTRICAS
// ==========================================
function renderPainel() {
  return `
  <p class="section-title">Resumo de hoje</p>
  <div class="cards-grid">

    <div class="metric-card">
      <div class="metric-icon blue">
        <svg viewBox="0 0 24 24"><path d="M1 3h15l2 7H3L1 3z"/><circle cx="7" cy="17" r="2"/><circle cx="15" cy="17" r="2"/></svg>
      </div>
      <div class="metric-label">Veículos hoje</div>
      <div class="metric-value" id="m-carros">0</div>
      <div class="metric-sub">atendimentos</div>
    </div>

    <div class="metric-card">
      <div class="metric-icon green">
        <svg viewBox="0 0 24 24"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
      </div>
      <div class="metric-label">Faturamento</div>
      <div class="metric-value sm" id="m-fat">R$ 0,00</div>
      <div class="metric-sub">hoje</div>
    </div>

    <div class="metric-card">
      <div class="metric-icon amber">
        <svg viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 21 12 17.77 5.82 21 7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
      </div>
      <div class="metric-label">Top funcionário</div>
      <div class="metric-value sm" id="m-func">—</div>
      <div class="metric-sub" id="m-func-sub"></div>
    </div>

    <div class="metric-card">
      <div class="metric-icon coral">
        <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
      </div>
      <div class="metric-label">Horário mais cheio</div>
      <div class="metric-value sm" id="m-hora">—</div>
      <div class="metric-sub" id="m-hora-sub"></div>
    </div>

  </div>

<p class="section-title">Análises</p>
  ${renderGraficos()}

  <p class="section-title">Equipe e atendimentos</p>
  ${renderRankingEAtendimentos()}

  `;

}

  // Placeholder por enquanto
// Renderiza a aba correta
if (tab === 'painel')    document.getElementById('main-content').innerHTML = renderPainel();
if (tab === 'registrar') {document.getElementById('main-content').innerHTML = renderRegistrar();}
if (tab === 'gerenciar') document.getElementById('main-content').innerHTML = '<p style="color:var(--text-muted)">⚙️ Gerenciar virá aqui...</p>';

  document.getElementById('main-content').innerHTML = content[tab];
}

// ==========================================
//  INICIA O APP
// ==========================================
showTab('painel');
if (tab === 'painel') {
  document.getElementById('main-content').innerHTML = renderPainel();
  animateBars();
}

// ==========================================
//  RENDER GRÁFICOS
// ==========================================
function renderGraficos() {
  // Dados zerados — virão do Supabase no próximo passo
  const servicos = [];
  const horarios = {
    7: 0, 8: 0, 9: 0, 10: 0, 11: 0,
    12: 0, 13: 0, 14: 0, 15: 0, 16: 0,
    17: 0, 18: 0
  };
  const maxServ = 1;
  const maxHora = 1;
  const peakHora = null;

  return `
  <div class="panels-grid">

    <!-- SERVIÇOS MAIS FEITOS -->
    <div class="card">
      <div class="card-header">
        <svg viewBox="0 0 24 24"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>
        <span class="card-title">Serviços mais feitos</span>
      </div>
      <div style="color: var(--text-hint); font-size: 13px; padding: 12px 0;">
        Nenhum serviço registrado hoje
      </div>
    </div>

    <!-- HORÁRIOS -->
    <div class="card">
      <div class="card-header">
        <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
        <span class="card-title">Movimento por horário</span>
      </div>
      <div class="hour-grid">
        ${Object.entries(horarios).map(([h, q]) => `
        <div class="hour-cell">
          <div class="hour-bar-wrap">
            <div class="hour-bar" style="height: 4px"></div>
          </div>
          <div class="hour-label">${h}h</div>
          <div class="hour-count">0</div>
        </div>`).join('')}
      </div>
    </div>

  </div>
  `;
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
  // Dados zerados — virão do Supabase no próximo passo
  const funcionarios = [];
  const atendimentos = [];

  const rankingHTML = funcionarios.length > 0
    ? funcionarios.map((f, i) => `
      <div class="list-item">
        <div class="list-item-left">
          <div class="rank ${i === 0 ? 'gold' : ''}">${i + 1}</div>
          <div>
            <div class="list-name">${f.nome}</div>
            <div class="list-sub">${f.qtd} serviço${f.qtd !== 1 ? 's' : ''}</div>
          </div>
        </div>
        <div class="list-val">${f.val}</div>
      </div>`).join('')
    : `<div class="empty">
        <svg viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
        Nenhum atendimento hoje
      </div>`;

  const atendimentosHTML = atendimentos.length > 0
    ? atendimentos.map(a => `
      <div class="list-item">
        <div class="list-item-left">
          <div>
            <div class="list-name">
              ${a.placa || '—'}
              <span class="tag ${a.tipo === 'Carreta' ? 'blue' : 'green'}">${a.tipo}</span>
            </div>
            <div class="list-sub">${a.servico} · ${a.funcionario}</div>
          </div>
        </div>
        <div>
          <div class="list-val">${a.valor}</div>
          <div class="list-val-sub">${a.hora}</div>
        </div>
      </div>`).join('')
    : `<div class="empty">
        <svg viewBox="0 0 24 24"><path d="M1 3h15l2 7H3L1 3z"/><circle cx="7" cy="17" r="2"/><circle cx="15" cy="17" r="2"/></svg>
        Nenhum atendimento registrado hoje
      </div>`;

  return `
  <div class="bottom-grid">

    <!-- RANKING -->
    <div class="card">
      <div class="card-header">
        <svg viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 21 12 17.77 5.82 21 7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
        <span class="card-title">Ranking</span>
      </div>
      ${rankingHTML}
    </div>

    <!-- ÚLTIMOS ATENDIMENTOS -->
    <div class="card">
      <div class="card-header">
        <svg viewBox="0 0 24 24"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
        <span class="card-title">Últimos atendimentos</span>
      </div>
      ${atendimentosHTML}
    </div>

  </div>
  `;
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
            <option value="__outro__">Outro (digitar)</option>
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
  </div>
  `;
}

// ==========================================
//  REGISTRAR ATENDIMENTO (sem Supabase ainda)
// ==========================================
async function registrar() {
  const btn = document.getElementById('btn-registrar');
  btn.disabled = true;
  btn.textContent = 'Registrando...';

  const placa   = document.getElementById('f-placa').value.trim().toUpperCase();
  const tipo    = document.getElementById('f-tipo').value;
  const servSel = document.getElementById('f-servico').value;
  const servico = servSel === '__outro__'
    ? document.getElementById('f-servico-outro').value.trim()
    : servSel;
  const valor   = document.getElementById('f-valor').value;
  const funcId  = document.getElementById('f-func').value;

  if (!servico || !valor || !funcId) {
    showToast('Preencha todos os campos!', true);
    btn.disabled = false;
    btn.textContent = 'Registrar atendimento';
    return;
  }

  // Por enquanto só mostra o toast — Supabase vem no próximo commit!
  showToast('Atendimento registrado com sucesso!');
  btn.disabled = false;
  btn.textContent = 'Registrar atendimento';
}
