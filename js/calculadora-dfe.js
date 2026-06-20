/* =========================================================
   CALCULADORA DFe - RECOVERY
   Compatível com o HTML da aba tab-downloads
========================================================= */

let regrasCalculadoraDFe = [];

/* =========================================================
   INICIALIZAÇÃO
========================================================= */

document.addEventListener('DOMContentLoaded', function () {
  inicializarCalculadoraDFe();
});

async function inicializarCalculadoraDFe() {
  await carregarRegrasCalculadoraDFe();

  const lista = document.getElementById('listaCalculosDfe');

  if (!lista) return;

  popularTodasUfsDFe();
  configurarEventosCalculadoraDFe();

  atualizarDiagnosticoDFe();
  calcularTotalGeralDFe();
}

/* =========================================================
   CARREGAR JSON
========================================================= */

async function carregarRegrasCalculadoraDFe() {
  try {
    const response = await fetch('data/regras-dfe.json?v=' + Date.now());

    if (!response.ok) {
      throw new Error('Erro ao carregar data/regras-dfe.json');
    }

    const dados = await response.json();

    regrasCalculadoraDFe = Array.isArray(dados) ? dados : [];

  } catch (error) {
    console.error('Erro ao carregar regras da Calculadora DFe:', error);
    regrasCalculadoraDFe = [];
  }
}

/* =========================================================
   EVENTOS
========================================================= */

function configurarEventosCalculadoraDFe() {
  const btnAdicionar = document.getElementById('btnAdicionarCalculoDfe');
  const btnSalvarObs = document.getElementById('btnSalvarObservacaoDownload');
  const btnGerarDiagnostico = document.getElementById('btnGerarDiagnosticoDownload');

  if (btnAdicionar) {
    btnAdicionar.addEventListener('click', adicionarLinhaCalculoDFe);
  }

  if (btnSalvarObs) {
    btnSalvarObs.addEventListener('click', salvarObservacaoDownloadDFe);
  }

  if (btnGerarDiagnostico) {
    btnGerarDiagnostico.addEventListener('click', gerarDiagnosticoDownloadDFe);
  }

  configurarEventosLinhasDFe();
}

function configurarEventosLinhasDFe() {
  document.querySelectorAll('.calculo-dfe-item').forEach(function (item) {
    const uf = item.querySelector('.downloadUf');
    const modelo = item.querySelector('.downloadModelo');
    const quantidade = item.querySelector('.downloadQuantidade');
    const valorUnitario = item.querySelector('.downloadsValorUnitario');
    const remover = item.querySelector('.btn-remover-calculo');

    if (uf) {
      uf.onchange = function () {
        aplicarRegraNaLinhaDFe(item);
        atualizarDiagnosticoDFe();
        calcularTotalGeralDFe();
      };
    }

    if (modelo) {
      modelo.onchange = function () {
        aplicarRegraNaLinhaDFe(item);
        calcularTotalGeralDFe();
      };
    }

    if (quantidade) {
      quantidade.oninput = function () {
        calcularLinhaDFe(item);
        calcularTotalGeralDFe();
      };
    }

    if (valorUnitario) {
      valorUnitario.oninput = function () {
        calcularLinhaDFe(item);
        calcularTotalGeralDFe();
      };

      valorUnitario.onblur = function () {
        valorUnitario.value = formatarMoedaDFe(
          obterNumeroMoedaDFe(valorUnitario.value)
        );

        calcularLinhaDFe(item);
        calcularTotalGeralDFe();
      };
    }

    if (remover) {
      remover.onclick = function () {
        const totalLinhas = document.querySelectorAll('.calculo-dfe-item').length;

        if (totalLinhas <= 1) {
          alert('É necessário manter pelo menos um cálculo.');
          return;
        }

        item.remove();
        calcularTotalGeralDFe();
        atualizarDiagnosticoDFe();
      };
    }

    aplicarRegraNaLinhaDFe(item);
  });
}

/* =========================================================
   UF / REGRA
========================================================= */

function popularTodasUfsDFe() {
  const ufs = [...new Set(
    regrasCalculadoraDFe
      .filter(item => item && item.ativo !== false)
      .map(item => String(item.uf || '').toUpperCase())
      .filter(Boolean)
  )].sort();

  document.querySelectorAll('.downloadUf').forEach(function (select) {
    const valorAtual = select.value;

    select.innerHTML = '';

    ufs.forEach(function (uf) {
      const option = document.createElement('option');
      option.value = uf;
      option.textContent = uf;
      select.appendChild(option);
    });

    if (valorAtual) {
      select.value = valorAtual;
    }
  });
}

function obterRegraPorUfDFe(uf) {
  return regrasCalculadoraDFe.find(item =>
    String(item.uf || '').toUpperCase() === String(uf || '').toUpperCase() &&
    item.ativo !== false
  );
}

/* =========================================================
   APLICAR REGRA NA LINHA
========================================================= */

function aplicarRegraNaLinhaDFe(item) {
  const selectUf = item.querySelector('.downloadUf');
  const inputValor = item.querySelector('.downloadsValorUnitario');

  const uf = selectUf?.value || '';
  const regra = obterRegraPorUfDFe(uf);

  if (!regra) {
    if (inputValor) inputValor.value = formatarMoedaDFe(0);
    calcularLinhaDFe(item);
    return;
  }

  if (inputValor) {
    inputValor.value = formatarMoedaDFe(regra.valorXml || 0);
  }

  preencherTextosUfDFe(regra);
  calcularLinhaDFe(item);
}

/* =========================================================
   CÁLCULO DA LINHA
========================================================= */

function calcularLinhaDFe(item) {
  const quantidade = Number(
    item.querySelector('.downloadQuantidade')?.value || 0
  );

  const valorUnitario = obterNumeroMoedaDFe(
    item.querySelector('.downloadsValorUnitario')?.value || 0
  );

  const total = quantidade * valorUnitario;

  const campoTotal = item.querySelector('.downloadValorItem');

  if (campoTotal) {
    campoTotal.value = formatarMoedaDFe(total);
  }

  return total;
}

/* =========================================================
   TOTAL GERAL
========================================================= */

function calcularTotalGeralDFe() {
  let total = 0;

  document.querySelectorAll('.calculo-dfe-item').forEach(function (item) {
    total += calcularLinhaDFe(item);
  });

  const campoTotal = document.getElementById('downloadValorTotal');

  if (campoTotal) {
    campoTotal.textContent = formatarMoedaDFe(total);
  }

  return total;
}

/* =========================================================
   ADICIONAR NOVA LINHA
========================================================= */

function adicionarLinhaCalculoDFe() {
  const lista = document.getElementById('listaCalculosDfe');
  const primeiraLinha = document.querySelector('.calculo-dfe-item');

  if (!lista || !primeiraLinha) return;

  const novaLinha = primeiraLinha.cloneNode(true);
  const novoIndex = document.querySelectorAll('.calculo-dfe-item').length;

  novaLinha.dataset.index = novoIndex;

  const quantidade = novaLinha.querySelector('.downloadQuantidade');
  const valorUnitario = novaLinha.querySelector('.downloadsValorUnitario');
  const valorItem = novaLinha.querySelector('.downloadValorItem');

  if (quantidade) quantidade.value = 1000;
  if (valorUnitario) valorUnitario.value = '';
  if (valorItem) valorItem.value = formatarMoedaDFe(0);

  lista.appendChild(novaLinha);

  popularTodasUfsDFe();
  configurarEventosLinhasDFe();

  aplicarRegraNaLinhaDFe(novaLinha);
  calcularTotalGeralDFe();
}

/* =========================================================
   DIAGNÓSTICO
========================================================= */

function atualizarDiagnosticoDFe() {
  const primeiraUf = document.querySelector('.downloadUf')?.value || '';
  const regra = obterRegraPorUfDFe(primeiraUf);

  if (!regra) {
    preencherDiagnosticoVazioDFe();
    return;
  }

  preencherTextosUfDFe(regra);

  const recuperamos = [];
  const naoRecuperamos = [];

  mapearCapacidadeDFe(regra).forEach(function (item) {
    if (item.disponivel) {
      recuperamos.push(item.nome);
    } else {
      naoRecuperamos.push(item.nome);
    }
  });

  preencherTextoPorIdDFe('downloadCertificado', regra.certificado || '-');
  preencherTextoPorIdDFe('downloadPrazoComChave', regra.prazoComChave || '-');
  preencherTextoPorIdDFe('downloadPrazoSemChave', regra.prazoSemChave || '-');
  preencherTextoPorIdDFe('downloadPrazoNfce', regra.prazoNfce || '-');
  preencherTextoPorIdDFe('downloadRecuperamos', recuperamos.join(', ') || '-');
  preencherTextoPorIdDFe('downloadNaoRecuperamos', naoRecuperamos.join(', ') || '-');
}

function preencherDiagnosticoVazioDFe() {
  preencherTextoPorIdDFe('downloadCertificado', '-');
  preencherTextoPorIdDFe('downloadPrazoComChave', '-');
  preencherTextoPorIdDFe('downloadPrazoSemChave', '-');
  preencherTextoPorIdDFe('downloadPrazoNfce', '-');
  preencherTextoPorIdDFe('downloadRecuperamos', '-');
  preencherTextoPorIdDFe('downloadNaoRecuperamos', '-');

  const observacao = document.getElementById('downloadObservacao');
  const alerta = document.getElementById('downloadAlerta');

  if (observacao) observacao.value = '';
  if (alerta) alerta.value = '';
}

function preencherTextosUfDFe(regra) {
  const observacao = document.getElementById('downloadObservacao');
  const alerta = document.getElementById('downloadAlerta');

  if (observacao) {
    observacao.value = regra.observacao || '';
  }

  if (alerta) {
    alerta.value = regra.alerta || '';
  }
}

function mapearCapacidadeDFe(regra) {
  return [
    {
      nome: 'Entrada sem chave',
      disponivel: regra.entradaSemChave === true
    },
    {
      nome: 'Saída sem chave',
      disponivel: regra.saidaSemChave === true
    },
    {
      nome: 'Entrada com chave',
      disponivel: regra.entradaComChave === true
    },
    {
      nome: 'Saída com chave',
      disponivel: regra.saidaComChave === true
    },
    {
      nome: 'NFC-e sem chave',
      disponivel: regra.nfceSemChave === true
    }
  ];
}

/* =========================================================
   SALVAR OBSERVAÇÃO EM MEMÓRIA
========================================================= */

function salvarObservacaoDownloadDFe() {
  const uf = document.querySelector('.downloadUf')?.value || '';
  const observacao = document.getElementById('downloadObservacao')?.value || '';
  const alerta = document.getElementById('downloadAlerta')?.value || '';

  const regra = obterRegraPorUfDFe(uf);

  if (!regra) {
    alert('Não existe regra cadastrada para esta UF.');
    return;
  }

  regra.observacao = observacao;
  regra.alerta = alerta;

  alert('Observações atualizadas nesta sessão. Depois ligamos isso em uma API PHP para salvar definitivo no JSON.');
}

/* =========================================================
   GERAR DIAGNÓSTICO
========================================================= */

function gerarDiagnosticoDownloadDFe() {
  atualizarDiagnosticoDFe();
  calcularTotalGeralDFe();

  alert('Diagnóstico comercial atualizado com sucesso.');
}

/* =========================================================
   UTILITÁRIOS
========================================================= */

function preencherTextoPorIdDFe(id, texto) {
  const elemento = document.getElementById(id);

  if (elemento) {
    elemento.textContent = texto;
  }
}

function formatarMoedaDFe(valor) {
  return Number(valor || 0).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  });
}

function obterNumeroMoedaDFe(valor) {
  if (typeof valor === 'number') return valor;

  return Number(
    String(valor || '')
      .replace(/\s/g, '')
      .replace('R$', '')
      .replace(/\./g, '')
      .replace(',', '.')
  ) || 0;
}