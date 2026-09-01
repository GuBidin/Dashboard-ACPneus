// ======================================================
// PAINEL.JS — Dashboard principal, gráficos e ranking
// ======================================================

// ======================================================
// RENDERIZAÇÃO DO PAINEL PRINCIPAL (DASHBOARD)
// Cálculos de métricas, totais, ranking e horários
// ======================================================
function renderPainel() {
  const hojeStr = new Date().toISOString().split('T')[0];
  const total = atendimentos.length;

  // Faturamento de hoje = serviços (atendimentos) + vendas de pneus feitas hoje.
  // Antes esse cálculo só somava atendimentos, então uma venda de pneu nunca
  // aparecia no faturamento do Painel.
  const fatServicos = atendimentos.reduce((s, a) => s + parseFloat(a.valor || 0), 0);
  const fatPneus = movimentacoes
    .filter(m => m.tipo === 'venda' && m.created_at && m.created_at.split('T')[0] === hojeStr)
    .reduce((s, m) => s + parseFloat(m.total || 0), 0);
  const fat = fatServicos + fatPneus;
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