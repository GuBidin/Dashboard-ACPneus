// script.js
// Atualiza a data no cabeçalho
const hoje = new Date();
const dias  = ['Domingo','Segunda','Terça','Quarta','Quinta','Sexta','Sábado'];
const meses = ['jan','fev','mar','abr','mai','jun','jul','ago','set','out','nov','dez'];
// Exibe a data no formato "Segunda, 1 de jan"
document.getElementById('headerDate').textContent =
  dias[hoje.getDay()] + ', ' + hoje.getDate() + ' de ' + meses[hoje.getMonth()];