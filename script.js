// script.js
// Atualiza a data no cabeçalho
const hoje = new Date();
const dias  = ['Domingo','Segunda','Terça','Quarta','Quinta','Sexta','Sábado'];
const meses = ['jan','fev','mar','abr','mai','jun','jul','ago','set','out','nov','dez'];
// Exibe a data no formato "Segunda, 1 de jan"
document.getElementById('headerDate').textContent =
  dias[hoje.getDay()] + ', ' + hoje.getDate() + ' de ' + meses[hoje.getMonth()];

// ==========================================
//  NAVEGAÇÃO ENTRE ABAS
// ==========================================
let currentTab = 'painel';

function showTab(tab) {
  currentTab = tab;

  // Atualiza botões
  ['painel', 'registrar', 'gerenciar'].forEach(t => {
    document.getElementById('tab-' + t).classList.toggle('active', t === tab);
  });

  // Atualiza conteúdo (por enquanto placeholder)
  const content = {
    painel:    '<p style="padding:20px;color:var(--text-muted)">📊 Painel virá aqui...</p>',
    registrar: '<p style="padding:20px;color:var(--text-muted)">📝 Formulário virá aqui...</p>',
    gerenciar: '<p style="padding:20px;color:var(--text-muted)">⚙️ Gerenciar virá aqui...</p>'
  };

  document.getElementById('main-content').innerHTML = content[tab];
}