// ======================================================
// INIT.JS — Perfil do usuário e inicialização do sistema
// Deve ser o ÚLTIMO script carregado (chama showTab, que depende de tudo acima)
// ======================================================


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
// Carrega painel ao abrir. A cada 30s, recarrega os dados e
// re-renderiza a aba atual (se for uma aba de leitura), garantindo
// que qualquer transação feita — nessa aba ou em outra — apareça
// automaticamente sem precisar trocar de aba na mão.
// "Registrar" e "Gerenciar" ficam fora, para não apagar formulário
// que o usuário esteja preenchendo no momento.
// ======================================================

carregarPerfil();
showTab('painel');

const ABAS_AUTO_REFRESH = ['painel', 'pneus', 'custos'];

setInterval(() => {
  if (ABAS_AUTO_REFRESH.includes(currentTab)) showTab(currentTab);
}, 30000);