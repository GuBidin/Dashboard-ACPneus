// ======================================================
// REGISTRAR.JS \xe2\x80\x94 Formul\xc3\xa1rio de novo atendimento
// ======================================================

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

