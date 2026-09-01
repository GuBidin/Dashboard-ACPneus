// ======================================================
// GERENCIAR.JS — Funcionários, serviços, atendimentos, veículos, modal
// ======================================================

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