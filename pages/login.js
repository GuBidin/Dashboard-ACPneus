const SUPA_URL = 'https://lnqnyxoluosjilmyodhz.supabase.co';
const SUPA_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxucW55eG9sdW9zamlsbXlvZGh6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg1MjQwNDksImV4cCI6MjA5NDEwMDA0OX0.wihQxSpw-tT_PxANoRECgkRd5g8ZoN4iFI7C2hFm8gY';

// Se já tem sessão válida, vai direto pro painel
try {
  const s = JSON.parse(localStorage.getItem('ac_session'));
  if (s && Date.now() < s.expires_at) window.location.href = '../index.html';
} catch {}

document.getElementById('senha').addEventListener('keydown', e => {
  if (e.key === 'Enter') fazerLogin();
});

async function fazerLogin() {
  const email = document.getElementById('email').value.trim();
  const senha = document.getElementById('senha').value;
  const btn   = document.getElementById('btn-login');
  const erro  = document.getElementById('erro');

  erro.classList.remove('show');

  if (!email || !senha) {
    erro.textContent = 'Preencha e-mail e senha.';
    erro.classList.add('show');
    return;
  }

  btn.disabled = true;
  btn.textContent = 'Entrando...';

  try {
    const res = await fetch(`${SUPA_URL}/auth/v1/token?grant_type=password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'apikey': SUPA_KEY },
      body: JSON.stringify({ email, password: senha })
    });

    const data = await res.json();
    if (!res.ok || data.error) throw new Error();

    localStorage.setItem('ac_session', JSON.stringify({
  access_token:  data.access_token,
  refresh_token: data.refresh_token,
  expires_at:    Date.now() + (data.expires_in * 1000),
  user:          data.user
}));

    window.location.href = '../index.html';

  } catch {
    erro.textContent = 'E-mail ou senha incorretos. Tente novamente.';
    erro.classList.add('show');
    btn.disabled = false;
    btn.textContent = 'Entrar no painel';
  }
}