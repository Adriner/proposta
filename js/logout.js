async function fazerLogout() {

  if (!confirm('Deseja realmente sair do sistema?')) {
    return;
  }

  try {

    const resposta = await fetch('api/logout.php', {
      method: 'POST'
    });

    const dados = await resposta.json();

    if (dados.sucesso) {
      window.location.href = 'admin/login.html';
    }

  } catch (erro) {

    console.error(erro);

    alert('Erro ao realizar logout.');
  }

}