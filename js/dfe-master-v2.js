let dfeMasterV2 = [];
let dfeMasterV2EditandoId = 0;

document.addEventListener('DOMContentLoaded', function () {
  carregarDfeMasterV2();

  const uf = document.getElementById('dfeV2Uf');

  if (uf) {
    uf.addEventListener('change', carregarUfNoFormularioDfeV2);
  }
});

async function carregarDfeMasterV2() {
  try {
    const resp = await fetch('api/carregar-dfe-master-v2.php?v=' + Date.now());
    const json = await resp.json();

    if (!json.sucesso) {
      alert(json.mensagem || 'Erro ao carregar DFe Master V2.');
      return;
    }

    dfeMasterV2 = Array.isArray(json.dados) ? json.dados : [];
    renderizarListaDfeMasterV2();

  } catch (erro) {
    console.error('Erro ao carregar DFe Master V2:', erro);
    alert('Erro ao carregar DFe Master V2.');
  }
}

function carregarUfNoFormularioDfeV2() {
  const uf = document.getElementById('dfeV2Uf').value;

  if (!uf) {
    limparFormularioDfeV2(false);
    return;
  }

  const item = dfeMasterV2.find(function (regra) {
    return regra.uf === uf;
  });

  if (!item) {
    dfeMasterV2EditandoId = 0;
    return;
  }

  preencherFormularioDfeV2(item);
}

function preencherFormularioDfeV2(item) {
  dfeMasterV2EditandoId = Number(item.id || 0);

  setValorDfeV2('dfeV2Uf', item.uf);
  setCheckDfeV2('dfeV2EntradaSemChave', item.entradaSemChave);
  setCheckDfeV2('dfeV2SaidaSemChave', item.saidaSemChave);
  setCheckDfeV2('dfeV2EntradaComChave', item.entradaComChave);
  setCheckDfeV2('dfeV2SaidaComChave', item.saidaComChave);
  setCheckDfeV2('dfeV2NfceSemChave', item.nfceSemChave);

  setValorDfeV2('dfeV2PrazoComChave', item.prazoComChave);
  setValorDfeV2('dfeV2PrazoSemChave', item.prazoSemChave);
  setValorDfeV2('dfeV2PrazoNfce', item.prazoNfce);
  setValorDfeV2('dfeV2Certificado', item.certificado);
  setValorDfeV2('dfeV2ValorXml', item.valorXml);
  setValorDfeV2('dfeV2Observacao', item.observacao);
  setValorDfeV2('dfeV2Alerta', item.alerta);

  setCheckDfeV2('dfeV2Ativo', item.ativo);
}

async function salvarDfeMasterV2() {
  const item = montarItemDfeMasterV2();

  if (!item.uf) {
    alert('Selecione a UF.');
    return;
  }

  const existenteIndex = dfeMasterV2.findIndex(function (regra) {
    return regra.uf === item.uf;
  });

  if (existenteIndex >= 0) {
    item.id = dfeMasterV2[existenteIndex].id;
    dfeMasterV2[existenteIndex] = item;
  } else {
    item.id = obterProximoIdDfeV2();
    dfeMasterV2.push(item);
  }

  try {
    const resp = await fetch('api/salvar-dfe-master-v2.php', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(dfeMasterV2)
    });

    const json = await resp.json();

    if (!json.sucesso) {
      alert(json.mensagem || 'Erro ao salvar DFe Master V2.');
      return;
    }

    alert('DFe Master V2 salvo com sucesso.');
    carregarDfeMasterV2();

  } catch (erro) {
    console.error('Erro ao salvar DFe Master V2:', erro);
    alert('Erro ao salvar DFe Master V2.');
  }
}

function montarItemDfeMasterV2() {
  return {
    id: dfeMasterV2EditandoId || obterProximoIdDfeV2(),
    uf: getValorDfeV2('dfeV2Uf'),

    entradaSemChave: getCheckDfeV2('dfeV2EntradaSemChave'),
    saidaSemChave: getCheckDfeV2('dfeV2SaidaSemChave'),

    entradaComChave: getCheckDfeV2('dfeV2EntradaComChave'),
    saidaComChave: getCheckDfeV2('dfeV2SaidaComChave'),

    nfceSemChave: getCheckDfeV2('dfeV2NfceSemChave'),

    prazoComChave: getValorDfeV2('dfeV2PrazoComChave'),
    prazoSemChave: getValorDfeV2('dfeV2PrazoSemChave'),
    prazoNfce: getValorDfeV2('dfeV2PrazoNfce'),

    certificado: getValorDfeV2('dfeV2Certificado') || 'A1/A3',

    valorXml: Math.round(Number(getValorDfeV2('dfeV2ValorXml') || 0) * 1000) / 1000,

    observacao: getValorDfeV2('dfeV2Observacao'),
    alerta: getValorDfeV2('dfeV2Alerta'),

    ativo: getCheckDfeV2('dfeV2Ativo'),

    atualizadoEm: new Date().toLocaleString('pt-BR')
  };
}

function renderizarListaDfeMasterV2() {
  const lista = document.getElementById('listaDfeMasterV2');

  if (!lista) return;

  if (!dfeMasterV2.length) {
    lista.innerHTML = '<p>Nenhuma regra cadastrada.</p>';
    return;
  }

  const ordenados = [...dfeMasterV2].sort(function (a, b) {
    return String(a.uf).localeCompare(String(b.uf));
  });

  lista.innerHTML = ordenados.map(function (item) {
    return `
      <div class="dfe-v2-linha" onclick="preencherFormularioDfeV2PorUf('${item.uf}')">
        <strong>${escaparHtmlDfeV2(item.uf)}</strong>

        <span>${item.entradaSemChave ? '✓ Ent. s/ chave' : '✕ Ent. s/ chave'}</span>
        <span>${item.saidaSemChave ? '✓ Saída s/ chave' : '✕ Saída s/ chave'}</span>
        <span>${item.entradaComChave ? '✓ Ent. c/ chave' : '✕ Ent. c/ chave'}</span>
        <span>${item.saidaComChave ? '✓ Saída c/ chave' : '✕ Saída c/ chave'}</span>
        <span>${item.nfceSemChave ? '✓ NFC-e' : '✕ NFC-e'}</span>

        <span>${formatarMoedaDfeV2(item.valorXml)}</span>

        <em>${item.ativo ? 'Ativo' : 'Inativo'}</em>
      </div>
    `;
  }).join('');
}

function preencherFormularioDfeV2PorUf(uf) {
  const item = dfeMasterV2.find(function (regra) {
    return regra.uf === uf;
  });

  if (item) {
    preencherFormularioDfeV2(item);
  }
}

function limparFormularioDfeV2(limparUf = true) {
  dfeMasterV2EditandoId = 0;

  if (limparUf) setValorDfeV2('dfeV2Uf', '');

  setCheckDfeV2('dfeV2EntradaSemChave', false);
  setCheckDfeV2('dfeV2SaidaSemChave', false);
  setCheckDfeV2('dfeV2EntradaComChave', true);
  setCheckDfeV2('dfeV2SaidaComChave', true);
  setCheckDfeV2('dfeV2NfceSemChave', false);
  setCheckDfeV2('dfeV2Ativo', true);

  setValorDfeV2('dfeV2PrazoComChave', '12 anos');
  setValorDfeV2('dfeV2PrazoSemChave', '5 anos');
  setValorDfeV2('dfeV2PrazoNfce', 'Conforme disponibilidade da SEFAZ');
  setValorDfeV2('dfeV2Certificado', 'A1/A3');
  setValorDfeV2('dfeV2ValorXml', '0.11');
  setValorDfeV2('dfeV2Observacao', '');
  setValorDfeV2('dfeV2Alerta', '');
}

function obterProximoIdDfeV2() {
  if (!dfeMasterV2.length) return 1;

  return Math.max(...dfeMasterV2.map(function (item) {
    return Number(item.id || 0);
  })) + 1;
}

function getValorDfeV2(id) {
  const el = document.getElementById(id);
  return el ? String(el.value || '').trim() : '';
}

function setValorDfeV2(id, valor) {
  const el = document.getElementById(id);

  if (el) {
    el.value = valor ?? '';
  }
}

function getCheckDfeV2(id) {
  const el = document.getElementById(id);
  return el ? el.checked : false;
}

function setCheckDfeV2(id, valor) {
  const el = document.getElementById(id);

  if (el) {
    el.checked = Boolean(valor);
  }
}

function formatarMoedaDfeV2(valor) {
  return Number(valor || 0).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 3
  });
}

function escaparHtmlDfeV2(texto) {
  return String(texto || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}