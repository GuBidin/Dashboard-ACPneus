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

  // Placeholder por enquanto
  const content = {
    painel:    '<p style="color:var(--text-muted)">📊 Cards de métricas virão aqui...</p>',
    registrar: '<p style="color:var(--text-muted)">📝 Formulário virá aqui...</p>',
    gerenciar: '<p style="color:var(--text-muted)">⚙️ Gerenciar virá aqui...</p>'
  };

  document.getElementById('main-content').innerHTML = content[tab];
}