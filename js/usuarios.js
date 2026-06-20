let usuariosSistema = [];
let usuarioEditandoId = 0;

document.addEventListener('DOMContentLoaded', function () {
  console.log('usuarios.js carregado');

  const btnSalvar = document.getElementById('btnSalvarUsuario');
  const btnNovo = document.getElementById('btnNovoUsuario');

  if (btnSalvar) {
    btnSalvar.addEventListener('click', salvarUsuario);
  }

  if (btnNovo) {
    btnNovo.addEventListener('click', limparFormularioUsuario);
  }

  carregarUsuarios();
});

async function carregarUsuarios() {
  const lista = document.getElementById('listaUsuarios');
  if (!lista) return;

  lista.innerHTML = '<div class="linha">Carregando usuários...</div>';

  try {
    const resposta = await fetch('api/listar-usuarios.php', {
      method: 'GET',
      cache: 'no-store'
    });

    const dados = await resposta.json();

    if (!dados.sucesso) {
      lista.innerHTML = `<div class="linha">${dados.mensagem || 'Erro ao carregar usuários.'}</div>`;
      return;
    }

    usuariosSistema = dados.usuarios || [];
    renderizarUsuarios();

  } catch (erro) {
    console.error('Erro ao carregar usuários:', erro);
    lista.innerHTML = '<div class="linha">Erro ao conectar com o servidor.</div>';
  }
}

function renderizarUsuarios() {
  const lista = document.getElementById('listaUsuarios');
  if (!lista) return;

  if (!usuariosSistema.length) {
    lista.innerHTML = '<div class="linha">Nenhum usuário cadastrado.</div>';
    return;
  }

  lista.innerHTML = '';

  usuariosSistema.forEach(function (u) {
    const linha = document.createElement('div');
    linha.className = 'linha usuario-linha';

    linha.innerHTML = `
      <strong>${escaparHTML(u.nome || '')}</strong>
      <span>${escaparHTML(u.usuario || '')}</span>
      <span>${escaparHTML(u.email || '')}</span>
      <span>${escaparHTML(u.perfil || '')}</span>
      <span>${u.ativo ? 'Ativo' : 'Inativo'}</span>
    `;

    linha.addEventListener('click', function () {
      preencherFormularioUsuario(u);
    });

    lista.appendChild(linha);
  });
}

function preencherFormularioUsuario(u) {
  usuarioEditandoId = Number(u.id || 0);

  document.getElementById('usuarioNome').value = u.nome || '';
  document.getElementById('usuarioEmail').value = u.email || '';
  document.getElementById('usuarioLogin').value = u.usuario || '';
  document.getElementById('usuarioSenha').value = '';
  document.getElementById('usuarioPerfil').value = u.perfil || 'comercial';
  document.getElementById('usuarioAtivo').checked = !!u.ativo;

  const titulo = document.getElementById('tituloFormularioUsuario');
  if (titulo) titulo.textContent = 'Editar usuário';
}

function limparFormularioUsuario() {
  usuarioEditandoId = 0;

  document.getElementById('usuarioNome').value = '';
  document.getElementById('usuarioEmail').value = '';
  document.getElementById('usuarioLogin').value = '';
  document.getElementById('usuarioSenha').value = '';
  document.getElementById('usuarioPerfil').value = 'comercial';
  document.getElementById('usuarioAtivo').checked = true;

  const titulo = document.getElementById('tituloFormularioUsuario');
  if (titulo) titulo.textContent = 'Novo usuário';
}

async function salvarUsuario() {
  console.log('Salvar usuário clicado');

  const payload = {
    id: usuarioEditandoId,
    nome: document.getElementById('usuarioNome').value.trim(),
    email: document.getElementById('usuarioEmail').value.trim(),
    usuario: document.getElementById('usuarioLogin').value.trim(),
    senha: document.getElementById('usuarioSenha').value.trim(),
    perfil: document.getElementById('usuarioPerfil').value,
    ativo: document.getElementById('usuarioAtivo').checked
  };

  try {
    const resposta = await fetch('api/salvar-usuarios.php', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const texto = await resposta.text();
    console.log('Resposta salvar-usuarios.php:', texto);

    let dados;

    try {
      dados = JSON.parse(texto);
    } catch (erroJson) {
      alert('A API retornou uma resposta inválida. Veja o console.');
      console.error('Resposta inválida da API:', texto);
      return;
    }

    alert(dados.mensagem || 'Processo concluído.');

    if (dados.sucesso) {
      limparFormularioUsuario();
      carregarUsuarios();
    }

  } catch (erro) {
    console.error('Erro ao salvar usuário:', erro);
    alert('Erro ao salvar usuário.');
  }
}

function escaparHTML(texto) {
  return String(texto)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

window.salvarUsuario = salvarUsuario;
window.limparFormularioUsuario = limparFormularioUsuario;
window.carregarUsuarios = carregarUsuarios;