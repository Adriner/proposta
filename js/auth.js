document.addEventListener('DOMContentLoaded', async () => {
  try {
    const resposta = await fetch('api/verificar-login.php', {
      method: 'GET',
      cache: 'no-store'
    });

    const dados = await resposta.json();

    if (!dados.logado) {
      window.location.href = 'admin/login.html';
      return;
    }

    window.usuarioLogado = dados.usuario;

    const nomeUsuario = document.getElementById('usuarioLogadoNome');
    if (nomeUsuario && dados.usuario && dados.usuario.nome) {
      nomeUsuario.textContent = dados.usuario.nome;
    }

  } catch (erro) {
    console.error('Erro ao verificar login:', erro);
    window.location.href = 'admin/login.html';
  }
});