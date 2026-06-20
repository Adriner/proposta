/* =========================================================
   CALCULADORA RECOVERY
========================================================= */

let regrasRecovery = [];
let recoveryItens = [];
let recoveryEditandoId = 0;

document.addEventListener('DOMContentLoaded', function () {
  inicializarCalculadoraRecovery();
});

async function inicializarCalculadoraRecovery() {
  await carregarRegrasRecovery();
  await carregarRecoverySalvos();

  const uf = document.getElementById('recoveryUf');
  const modelo = document.getElementById('recoveryModelo');
  const quantidade = document.getElementById('recoveryQuantidade');
  const valorXml = document.getElementById('recoveryValorXml');

  if (uf) uf.addEventListener('change', atualizarCalculadoraRecoveryPorUf);
  if (modelo) modelo.addEventListener('change', calcularRecovery);
  if (quantidade) quantidade.addEventListener('input', calcularRecovery);
  if (valorXml) valorXml.addEventListener('input', calcularRecovery);

  atualizarCalculadoraRecoveryPorUf();
}

/* =========================================================
   CARREGAR REGRAS DFE MASTER V2
========================================================= */

async function carregarRegrasRecovery() {
  try {
    const resposta = await fetch('api/carregar-dfe-master-v2.php');
    const dados = await resposta.json();

    if (!dados.sucesso || !Array.isArray(dados.regras)) {
      regrasRecovery = [];
      return;
    }

    regrasRecovery = dados.regras.filter(function (item) {
      return item && item.ativo === true;
    });

  } catch (erro) {
    console.error('Erro ao carregar regras Recovery:', erro);
    regrasRecovery = [];
  }
}

function obterRegraRecoveryPorUf(uf) {
  uf = String(uf || '').trim().toUpperCase();

  return regrasRecovery.find(function (item) {
    return String(item.uf || '').trim().toUpperCase() === uf;
  }) || null;
}

/* =========================================================
   ATUALIZAR TELA POR UF
========================================================= */

function atualizarCalculadoraRecoveryPorUf() {
  const campoUf = document.getElementById('recoveryUf');
  if (!campoUf) return;

  const regra = obterRegraRecoveryPorUf(campoUf.value);

  if (!regra) {
    limparDadosTecnicosRecovery();
    calcularRecovery();
    return;
  }

  const capacidade = montarCapacidadeRecovery(regra);

  preencherTextoRecovery('recoveryRecuperamos', capacidade.recuperamos.join(', ') || 'Não disponível');
  preencherTextoRecovery('recoveryNaoRecuperamos', capacidade.naoRecuperamos.join(', ') || 'Não informado');

  preencherTextoRecovery('recoveryCertificado', regra.certificado || 'Não informado');
  preencherTextoRecovery('recoveryPrazoComChave', regra.prazoComChave || 'Não informado');
  preencherTextoRecovery('recoveryPrazoSemChave', regra.prazoSemChave || 'Não informado');
  preencherTextoRecovery('recoveryPrazoNfce', regra.prazoNfce || 'Não informado');
  preencherTextoRecovery('recoveryObservacao', regra.observacao || '');
  preencherTextoRecovery('recoveryAlerta', regra.alerta || '');

  const campoValor = document.getElementById('recoveryValorXml');

  if (campoValor) {
    campoValor.value = formatarNumeroRecovery(regra.valorXml || 0);
  }

  calcularRecovery();
}

function montarCapacidadeRecovery(regra) {
  const recuperamos = [];
  const naoRecuperamos = [];

  adicionarCapacidadeRecovery(regra.entradaSemChave, 'Entrada sem chave', recuperamos, naoRecuperamos);
  adicionarCapacidadeRecovery(regra.saidaSemChave, 'Saída sem chave', recuperamos, naoRecuperamos);
  adicionarCapacidadeRecovery(regra.entradaComChave, 'Entrada com chave', recuperamos, naoRecuperamos);
  adicionarCapacidadeRecovery(regra.saidaComChave, 'Saída com chave', recuperamos, naoRecuperamos);
  adicionarCapacidadeRecovery(regra.nfceSemChave, 'NFC-e sem chave', recuperamos, naoRecuperamos);

  return {
    recuperamos,
    naoRecuperamos
  };
}

function adicionarCapacidadeRecovery(ativo, texto, recuperamos, naoRecuperamos) {
  if (ativo === true) {
    recuperamos.push(texto);
  } else {
    naoRecuperamos.push(texto);
  }
}

/* =========================================================
   CÁLCULO
========================================================= */

function calcularRecovery() {
  const quantidade = obterNumeroRecovery('recoveryQuantidade');
  const valorXml = obterNumeroRecovery('recoveryValorXml');

  const total = quantidade * valorXml;

  preencherTextoRecovery('recoveryTotalXml', quantidade.toLocaleString('pt-BR'));
  preencherTextoRecovery('recoveryTotalValor', formatarMoedaRecovery(total));

  const campoTotal = document.getElementById('recoveryValorTotal');

  if (campoTotal) {
    campoTotal.value = total.toFixed(2);
  }

  return total;
}

/* =========================================================
   SALVAR / LISTAR
========================================================= */

async function salvarRecovery() {
  const dados = obterDadosRecoveryFormulario();

  if (!dados.uf) {
    alert('Informe a UF.');
    return;
  }

  if (!dados.quantidade || dados.quantidade <= 0) {
    alert('Informe a quantidade de XMLs.');
    return;
  }

  recoveryItens.push(dados);

  renderizarListaRecovery();
  limparCalculadoraRecovery();
}

async function carregarRecoverySalvos() {
  renderizarListaRecovery();
}

function obterDadosRecoveryFormulario() {
  const uf = obterValorRecovery('recoveryUf');
  const regra = obterRegraRecoveryPorUf(uf);

  return {
    id: recoveryEditandoId || Date.now(),
    uf: uf,
    modelo: obterValorRecovery('recoveryModelo'),
    quantidade: obterNumeroRecovery('recoveryQuantidade'),
    valorXml: obterNumeroRecovery('recoveryValorXml'),
    valorTotal: calcularRecovery(),
    certificado: regra ? regra.certificado : '',
    prazoComChave: regra ? regra.prazoComChave : '',
    prazoSemChave: regra ? regra.prazoSemChave : '',
    prazoNfce: regra ? regra.prazoNfce : '',
    observacao: regra ? regra.observacao : '',
    alerta: regra ? regra.alerta : ''
  };
}

function renderizarListaRecovery() {
  const lista = document.getElementById('listaRecovery');
  if (!lista) return;

  if (!recoveryItens.length) {
    lista.innerHTML = '<p class="texto-vazio">Nenhum item adicionado.</p>';
    return;
  }

  lista.innerHTML = recoveryItens.map(function (item) {
    return `
      <div class="recovery-item" onclick="editarRecovery(${item.id})">
        <strong>${escaparHtmlRecovery(item.uf)} - ${escaparHtmlRecovery(item.modelo || 'Recovery')}</strong>
        <span>${Number(item.quantidade || 0).toLocaleString('pt-BR')} XMLs</span>
        <span>${formatarMoedaRecovery(item.valorTotal || 0)}</span>
      </div>
    `;
  }).join('');
}

function editarRecovery(id) {
  const item = recoveryItens.find(function (registro) {
    return Number(registro.id) === Number(id);
  });

  if (!item) return;

  recoveryEditandoId = item.id;

  definirValorRecovery('recoveryUf', item.uf);
  definirValorRecovery('recoveryModelo', item.modelo);
  definirValorRecovery('recoveryQuantidade', item.quantidade);
  definirValorRecovery('recoveryValorXml', formatarNumeroRecovery(item.valorXml));

  atualizarCalculadoraRecoveryPorUf();
}

function limparCalculadoraRecovery() {
  recoveryEditandoId = 0;

  definirValorRecovery('recoveryUf', '');
  definirValorRecovery('recoveryModelo', '');
  definirValorRecovery('recoveryQuantidade', '');
  definirValorRecovery('recoveryValorXml', '');

  limparDadosTecnicosRecovery();
  calcularRecovery();
}

function limparDadosTecnicosRecovery() {
  preencherTextoRecovery('recoveryRecuperamos', '');
  preencherTextoRecovery('recoveryNaoRecuperamos', '');
  preencherTextoRecovery('recoveryCertificado', '');
  preencherTextoRecovery('recoveryPrazoComChave', '');
  preencherTextoRecovery('recoveryPrazoSemChave', '');
  preencherTextoRecovery('recoveryPrazoNfce', '');
  preencherTextoRecovery('recoveryObservacao', '');
  preencherTextoRecovery('recoveryAlerta', '');
}

/* =========================================================
   HELPERS
========================================================= */

function obterValorRecovery(id) {
  const el = document.getElementById(id);
  return el ? String(el.value || '').trim() : '';
}

function definirValorRecovery(id, valor) {
  const el = document.getElementById(id);
  if (el) el.value = valor || '';
}

function preencherTextoRecovery(id, valor) {
  const el = document.getElementById(id);
  if (el) el.textContent = valor || '';
}

function obterNumeroRecovery(id) {
  const el = document.getElementById(id);

  if (!el) return 0;

  return Number(
    String(el.value || '0')
      .replace(/\./g, '')
      .replace(',', '.')
      .replace(/[^\d.]/g, '')
  ) || 0;
}

function formatarNumeroRecovery(valor) {
  return Number(valor || 0).toFixed(2).replace('.', ',');
}

function formatarMoedaRecovery(valor) {
  return Number(valor || 0).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  });
}

function escaparHtmlRecovery(texto) {
  return String(texto || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}