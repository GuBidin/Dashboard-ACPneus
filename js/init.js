// ======================================================
// INIT.JS \xe2\x80\x94 Perfil do usu\xc3\xa1rio e inicializa\xc3\xa7\xc3\xa3o do sistema
// Deve ser o \xc3\x9aLTIMO script carregado (chama showTab, que depende de tudo acima)
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
// Carrega painel ao abrir e atualiza a cada 30s
// ======================================================

carregarPerfil();
showTab('painel');

setInterval(() => {
  if (currentTab === 'painel') showTab('painel');
}, 30000);