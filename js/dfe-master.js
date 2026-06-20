let regrasDfeMaster = [];
let dfeEditandoId = 0;

document.addEventListener('DOMContentLoaded', function () {
  const btnSalvar = document.getElementById('btnSalvarDfe');
  const btnNovo = document.getElementById('btnNovoDfe');

  if (btnSalvar) {
    btnSalvar.addEventListener('click', salvarDfeMaster);
  }

  if (btnNovo) {
    btnNovo.addEventListener('click', limparFormularioDfeMaster);
  }

  carregarDfeMaster();
});

async function carregarDfeMaster() {
  const lista = document.getElementById('listaDfeMaster');
  if (!lista) return;

  lista.innerHTML = '<div class="linha">Carregando regras...</div>';

  try {
    const resposta = await fetch('api/listar-dfe-master.php', {
      method: 'GET',
      cache: 'no-store'
    });

    const dados = await resposta.json();

    if (!dados.sucesso) {
      lista.innerHTML = `<div class="linha">${dados.mensagem || 'Erro ao carregar regras.'}</div>`;
      return;
    }

    regrasDfeMaster = dados.regras || [];
    renderizarDfeMaster();

  } catch (erro) {
    console.error('Erro ao carregar DFe Master:', erro);
    lista.innerHTML = '<div class="linha">Erro ao conectar com o servidor.</div>';
  }
}

function renderizarDfeMaster() {
  const lista = document.getElementById('listaDfeMaster');
  if (!lista) return;

  if (!regrasDfeMaster.length) {
    lista.innerHTML = '<div class="linha">Nenhuma regra cadastrada.</div>';
    return;
  }

  lista.innerHTML = '';

  regrasDfeMaster.forEach(function (r) {
    const linha = document.createElement('div');
    linha.className = 'linha usuario-linha';

    linha.innerHTML = `
      <strong>${escaparHTML(r.uf || '')} - ${escaparHTML(r.modelo || '')}</strong>
      <span>${escaparHTML(r.operacao || '')}</span>
      <span>${escaparHTML(r.prazo || '')}</span>
      <span>R$ ${Number(r.valor || 0).toFixed(3)}</span>
      <span>${r.ativo ? 'Ativo' : 'Inativo'}</span>
    `;

    linha.addEventListener('click', function () {
      preencherFormularioDfeMaster(r);
    });

    lista.appendChild(linha);
  });
}

function preencherFormularioDfeMaster(r) {
  dfeEditandoId = Number(r.id || 0);

  document.getElementById('dfeUf').value = r.uf || '';
  document.getElementById('dfeModelo').value = r.modelo || 'NF-e';
  document.getElementById('dfeOperacao').value = r.operacao || '';
  document.getElementById('dfeCertificado').value = r.certificado || '';
  document.getElementById('dfePrazo').value = r.prazo || '';
  document.getElementById('dfeValor').value = r.valor || 0;
  document.getElementById('dfeAtivo').checked = !!r.ativo;
  document.getElementById('dfeObservacao').value = r.observacao || '';
  document.getElementById('dfeAlerta').value = r.alerta || '';
}

function limparFormularioDfeMaster() {
  dfeEditandoId = 0;

  document.getElementById('dfeUf').value = '';
  document.getElementById('dfeModelo').value = 'NF-e';
  document.getElementById('dfeOperacao').value = '';
  document.getElementById('dfeCertificado').value = '';
  document.getElementById('dfePrazo').value = '';
  document.getElementById('dfeValor').value = '';
  document.getElementById('dfeAtivo').checked = true;
  document.getElementById('dfeObservacao').value = '';
  document.getElementById('dfeAlerta').value = '';
}

async function salvarDfeMaster() {
  const payload = {
    id: dfeEditandoId,
    uf: document.getElementById('dfeUf').value.trim().toUpperCase(),
    modelo: document.getElementById('dfeModelo').value,
    operacao: document.getElementById('dfeOperacao').value.trim(),
    certificado: document.getElementById('dfeCertificado').value.trim(),
    prazo: document.getElementById('dfePrazo').value.trim(),
    valor: document.getElementById('dfeValor').value,
    ativo: document.getElementById('dfeAtivo').checked,
    observacao: document.getElementById('dfeObservacao').value.trim(),
    alerta: document.getElementById('dfeAlerta').value.trim()
  };

  try {
    const resposta = await fetch('api/salvar-dfe-master.php', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const dados = await resposta.json();

    alert(dados.mensagem || 'Processo concluído.');

    if (dados.sucesso) {
      limparFormularioDfeMaster();
      carregarDfeMaster();
    }

  } catch (erro) {
    console.error('Erro ao salvar DFe Master:', erro);
    alert('Erro ao salvar regra do DFe Master.');
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

window.salvarDfeMaster = salvarDfeMaster;
window.carregarDfeMaster = carregarDfeMaster;
window.limparFormularioDfeMaster = limparFormularioDfeMaster;