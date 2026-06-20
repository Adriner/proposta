document.addEventListener('DOMContentLoaded', () => {

  const form = document.getElementById('formLogin');
  const mensagem = document.getElementById('mensagemLogin');

  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const usuario = document.getElementById('usuario').value.trim();
    const senha = document.getElementById('senha').value.trim();

    mensagem.innerHTML = 'Validando acesso...';
    mensagem.style.color = '#64748b';

    try {

      const resposta = await fetch('../api/login.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          usuario,
          senha
        })
      });

      const dados = await resposta.json();

      if (dados.sucesso) {

        mensagem.innerHTML = 'Login realizado com sucesso!';
        mensagem.style.color = '#16a34a';

        setTimeout(() => {
          window.location.href = '../index.html';
        }, 800);

      } else {

        mensagem.innerHTML =
          dados.mensagem || 'Usuário ou senha inválidos.';

        mensagem.style.color = '#dc2626';
      }

    } catch (erro) {

      console.error(erro);

      mensagem.innerHTML =
        'Erro ao conectar com o servidor.';

      mensagem.style.color = '#dc2626';
    }

  });

});