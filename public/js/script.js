// LOGIN
document.getElementById('loginForm').addEventListener('submit', async function (e) {
  e.preventDefault();
  const username = document.getElementById('loginUsername').value;
  const password = document.getElementById('loginPassword').value;

  const res = await fetch('/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  });

  const msg = await res.text();
  alert(msg);
  if (res.ok) {
    window.location.href = '/chat.html';
  }
});

// REGISTER
document.getElementById('registerForm').addEventListener('submit', async function (e) {
  e.preventDefault();
  const username = document.getElementById('regUsername').value;
  const password = document.getElementById('regPassword').value;

  const res = await fetch('/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  });

  const msg = await res.text();
  alert(msg);
  if (res.ok) {
    window.location.href = '/chat.html';
  }
});
