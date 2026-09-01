// ======================================================
// CUSTOS.JS — Margem de lucro, custos fixos, fornecedores, compras
// ======================================================

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

  // Custo dos pneus vendidos — usa o custo real cadastrado no pneu (p.custo),
  // NÃO o valor_unit da movimentação de venda (que é o preço de VENDA, não o
  // custo). Usar valor_unit ali fazia "custo" e "receita" ficarem sempre
  // idênticos, zerando o lucro artificialmente.
  const custoPneus = movimentacoes
    .filter(m => m.tipo === 'venda')
    .reduce((s, m) => {
      const pneu = pneus.find(p => p.id === m.pneu_id);
      const custoUnit = pneu ? parseFloat(pneu.custo || 0) : 0;
      return s + custoUnit * m.quantidade;
    }, 0);

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
      <div class="metric-value sm">${brl(custoTotal)}</div>
      <div class="metric-sub">fixos + pneus vendidos</div>
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
  </div>

  <div class="margem-card" style="margin-top:16px">
    <div class="card-header" style="margin-bottom:16px;padding-bottom:12px;border-bottom:0.5px solid var(--border)">
      <svg viewBox="0 0 24 24" style="width:16px;height:16px;stroke:var(--blue);fill:none;stroke-width:2;stroke-linecap:round;stroke-linejoin:round"><polyline points="23 18 13.5 8.5 8.5 13.5 1 6"/></svg>
      <span class="card-title">Compras de estoque — ${nomeMes} (informativo)</span>
    </div>
    <div class="margem-row"><span>Total comprado de fornecedores</span><span>${brl(totalCompras)}</span></div>
    <div style="color:var(--text-hint);font-size:12px;margin-top:4px">Não entra no cálculo de custo/lucro acima — vira custo só quando o pneu é vendido.</div>
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