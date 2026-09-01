// ======================================================
// PNEUS.JS — Estoque, movimentações, compra e venda de pneus
// ======================================================

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