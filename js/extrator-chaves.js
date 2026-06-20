/* =========================================================
   EXTRATOR DE CHAVES DE ACESSO
========================================================= */

const LIMITE_ARQUIVOS_CHAVES = Infinity;

let dadosChaves = [];
let dadosSaltos = [];
let tabelaChaves = null;
let tabelaSaltos = null;

/* =========================================================
   PROCESSAMENTO PRINCIPAL
========================================================= */

function processarArquivosChaves() {
  const input = document.getElementById('keysFiles');
  const progresso = document.getElementById('keysProgress');

  if (!input || !input.files.length) {
    alert('Selecione um ou mais arquivos.');
    return;
  }

  if (input.files.length > LIMITE_ARQUIVOS_CHAVES) {
    alert('Quantidade de arquivos acima do limite permitido.');
    return;
  }

  dadosChaves = [];
  dadosSaltos = [];

  if (tabelaChaves) tabelaChaves.clearData();
  if (tabelaSaltos) tabelaSaltos.clearData();

  const arquivos = Array.from(input.files);
  let processados = 0;

  if (progresso) {
    progresso.innerText = `Lendo arquivo 0 de ${arquivos.length}...`;
  }

  arquivos.forEach(function (file) {
    const reader = new FileReader();

    reader.onload = function (e) {
      extrairChavesDoTexto(e.target.result, file.name);

      processados++;

      if (progresso) {
        progresso.innerText = `Lendo arquivo ${processados} de ${arquivos.length}...`;
      }

      if (processados === arquivos.length) {
        finalizarExtracaoChaves();

        if (progresso) {
          progresso.innerText = `Extração concluída: ${arquivos.length} arquivo(s) processado(s).`;
        }
      }
    };

    reader.onerror = function () {
      processados++;

      if (progresso) {
        progresso.innerText = `Erro ao ler o arquivo ${file.name}.`;
      }

      if (processados === arquivos.length) {
        finalizarExtracaoChaves();
      }
    };

    reader.readAsText(file, 'UTF-8');
  });
}

/* =========================================================
   EXTRAÇÃO
========================================================= */

function extrairChavesDoTexto(texto, arquivo) {
  if (!texto) return;

  const operacao = obterOperacaoSelecionada();
  const regex = /\d{44}/g;
  const encontradas = texto.match(regex) || [];

  encontradas.forEach(function (chave) {
    dadosChaves.push(montarRegistroChave(chave, arquivo, operacao));
  });
}

function montarRegistroChave(chave, arquivo, operacao) {
  const uf = chave.substring(0, 2);
  const aamm = chave.substring(2, 6);
  const cnpj = chave.substring(6, 20);
  const modelo = chave.substring(20, 22);
  const serie = chave.substring(22, 25);
  const numero = chave.substring(25, 34);
  const tipoEmissao = chave.substring(34, 35);
  const codigoNumerico = chave.substring(35, 43);
  const dv = chave.substring(43, 44);

  return {
    chave,
    arquivo,
    operacao,
    uf,
    emissao: formatarAAMM(aamm),
    cnpj,
    modelo,
    documento: identificarDocumento(modelo),
    serie: removerZerosEsquerda(serie),
    numero: removerZerosEsquerda(numero),
    numeroOriginal: numero,
    tipoEmissao,
    codigoNumerico,
    dv,
    status: validarChaveBasica(chave, modelo)
  };
}

function finalizarExtracaoChaves() {
  const totalEncontradas = dadosChaves.length;

  const mapa = new Map();
  let totalDuplicadas = 0;

  dadosChaves.forEach(function (item) {
    if (mapa.has(item.chave)) {
      totalDuplicadas++;
    } else {
      mapa.set(item.chave, item);
    }
  });

  dadosChaves = Array.from(mapa.values());

  const operacao = obterOperacaoSelecionada();

  if (operacao === 'saida' || operacao === 'ambos') {
    dadosSaltos = detectarSaltosNumeracao(dadosChaves);
  } else {
    dadosSaltos = [];
  }

  atualizarResumoChaves(
    totalEncontradas,
    dadosChaves.length,
    totalDuplicadas,
    dadosSaltos.length
  );

  montarTabelaChaves();
  montarTabelaSaltos();

  setTimeout(function () {
    if (tabelaChaves) tabelaChaves.redraw(true);
    if (tabelaSaltos) tabelaSaltos.redraw(true);
  }, 300);
}

/* =========================================================
   SALTOS DE NUMERAÇÃO
========================================================= */

function detectarSaltosNumeracao(lista) {
  const grupos = {};

  lista
    .filter(function (item) {
      return item.status === 'Válida';
    })
    .forEach(function (item) {
      const chaveGrupo = [
        item.cnpj,
        item.modelo,
        item.serie
      ].join('|');

      if (!grupos[chaveGrupo]) {
        grupos[chaveGrupo] = [];
      }

      grupos[chaveGrupo].push(item);
    });

  const saltos = [];

  Object.keys(grupos).forEach(function (grupo) {
    const itens = grupos[grupo]
      .map(function (item) {
        return {
          ...item,
          numeroCalc: parseInt(item.numeroOriginal, 10)
        };
      })
      .filter(function (item) {
        return !isNaN(item.numeroCalc);
      })
      .sort(function (a, b) {
        return a.numeroCalc - b.numeroCalc;
      });

    for (let i = 1; i < itens.length; i++) {
      const anterior = itens[i - 1].numeroCalc;
      const atual = itens[i].numeroCalc;

      if (atual > anterior + 1) {
        saltos.push({
          cnpj: itens[i].cnpj,
          documento: itens[i].documento,
          modelo: itens[i].modelo,
          serie: itens[i].serie,
          numeroAnterior: anterior,
          numeroAtual: atual,
          intervaloFaltante: `${anterior + 1} até ${atual - 1}`,
          quantidadeFaltante: atual - anterior - 1,
          status: 'Salto encontrado'
        });
      }
    }
  });

  return saltos;
}

/* =========================================================
   TABELAS
========================================================= */

function montarTabelaChaves() {
  const grid = document.getElementById('gridChaves');

  if (!grid) return;

  if (typeof Tabulator === 'undefined') {
    alert('Tabulator não carregou. Verifique o script tabulator.min.js no index.html.');
    console.error('Tabulator is not defined.');
    return;
  }
const colunas = [
  {
    title: 'Chave de Acesso',
    field: 'chave',
    width: 325,
    minWidth: 305,
    headerFilter: true,
    formatter: function (cell) {
      const chave = cell.getValue();

      return `
        <a
          href="https://meudanfe.com.br/"
          target="_blank"
          rel="noopener"
          class="af-chave-link"
          onclick="copiarChaveAcesso('${chave}')"
          title="Copiar chave e abrir consulta"
        >
          ${chave}
        </a>
      `;
    }
  },

  { title: 'Doc.', field: 'documento', width: 72, headerFilter: true },
  { title: 'Mod.', field: 'modelo', width: 54, hozAlign: 'center', headerFilter: true },
  { title: 'Op.', field: 'operacao', width: 64, headerFilter: true },
  { title: 'UF', field: 'uf', width: 44, hozAlign: 'center', headerFilter: true },
  { title: 'Emissão', field: 'emissao', width: 78, headerFilter: true },
  { title: 'CNPJ Emit.', field: 'cnpj', width: 122, headerFilter: true },
  { title: 'Série', field: 'serie', width: 52, hozAlign: 'center', headerFilter: true },
  { title: 'Nº', field: 'numero', width: 78, headerFilter: true },
  { title: 'Arquivo', field: 'arquivo', widthGrow: 1, minWidth: 135, headerFilter: true },

  {
    title: 'Status',
    field: 'status',
    width: 76,
    hozAlign: 'center',
    headerFilter: true,
    formatter: function (cell) {
      const valor = cell.getValue();

      if (valor === 'Válida') {
        return `<span class="af-status-ok">Válida</span>`;
      }

      return `<span class="af-status-alerta">${valor}</span>`;
    }
  }
];
  

  if (tabelaChaves) {
    tabelaChaves.replaceData(dadosChaves);
    return;
  }

  tabelaChaves = new Tabulator('#gridChaves', {
    data: dadosChaves,
    columns: colunas,
    layout: 'fitColumns',
    height: '430px',
    movableColumns: true,
    resizableColumnFit: true,
    responsiveLayout: false,
    pagination: true,
    paginationSize: 20,
    paginationSizeSelector: [10, 20, 50, 100],
    placeholder: 'Nenhuma chave encontrada.',
    clipboard: true,
    selectableRows: true,
    columnDefaults: {
      headerSort: true,
      headerFilter: true,
      tooltip: true,
      vertAlign: 'middle'
    }
  });
}

function montarTabelaSaltos() {
  const grid = document.getElementById('gridSaltos');

  if (!grid) return;

  if (typeof Tabulator === 'undefined') {
    alert('Tabulator não carregou. Verifique o script tabulator.min.js no index.html.');
    console.error('Tabulator is not defined.');
    return;
  }

const colunas = [
  { title: 'CNPJ Emit.', field: 'cnpj', width: 135, headerFilter: true },
  { title: 'Doc.', field: 'documento', width: 78, headerFilter: true },
  { title: 'Mod.', field: 'modelo', width: 56, hozAlign: 'center', headerFilter: true },
  { title: 'Série', field: 'serie', width: 58, hozAlign: 'center', headerFilter: true },
  { title: 'Nº Ant.', field: 'numeroAnterior', width: 90, headerFilter: true },
  { title: 'Nº Atual', field: 'numeroAtual', width: 90, headerFilter: true },
  { title: 'Intervalo Faltante', field: 'intervaloFaltante', widthGrow: 2, minWidth: 150, headerFilter: true },
  { title: 'Qtd.', field: 'quantidadeFaltante', width: 72, hozAlign: 'right', headerFilter: true },

  {
    title: 'Status',
    field: 'status',
    width: 118,
    headerFilter: true,
    formatter: function (cell) {
      return `<span class="af-status-alerta">${cell.getValue()}</span>`;
    }
  }
];

  if (tabelaSaltos) {
    tabelaSaltos.replaceData(dadosSaltos);
    return;
  }

  tabelaSaltos = new Tabulator('#gridSaltos', {
    data: dadosSaltos,
    columns: colunas,
    layout: 'fitColumns',
    height: '300px',
    movableColumns: true,
    resizableColumnFit: true,
    responsiveLayout: false,
    pagination: true,
    paginationSize: 10,
    paginationSizeSelector: [10, 20, 50],
    placeholder: 'Nenhum salto de numeração encontrado.',
    clipboard: true,
    selectableRows: true,
    columnDefaults: {
      headerSort: true,
      headerFilter: true,
      tooltip: true,
      vertAlign: 'middle'
    }
  });
}

/* =========================================================
   BUSCA E EXPORTAÇÃO
========================================================= */

function buscarGlobalChaves() {
  const campo = document.getElementById('buscaGlobalChaves');

  if (!campo || !tabelaChaves) return;

  const termo = campo.value.trim().toLowerCase();

  if (!termo) {
    tabelaChaves.clearFilter();
    return;
  }

  tabelaChaves.setFilter(function (data) {
    return Object.values(data).some(function (valor) {
      return String(valor || '').toLowerCase().includes(termo);
    });
  });
}

function baixarCSVChaves() {
  if (!tabelaChaves || !dadosChaves.length) {
    alert('Nenhuma chave encontrada para exportar.');
    return;
  }

  tabelaChaves.download(
    'csv',
    'chaves-de-acesso-extraidas.csv',
    { bom: true }
  );
}

function baixarCSVSaltos() {
  if (!tabelaSaltos || !dadosSaltos.length) {
    alert('Nenhum salto de numeração encontrado para exportar.');
    return;
  }

  tabelaSaltos.download(
    'csv',
    'saltos-de-numeracao.csv',
    { bom: true }
  );
}

/* =========================================================
   RESUMO
========================================================= */

function atualizarResumoChaves(total, unicas, duplicadas, saltos) {
  atualizarTextoChaves('totalChaves', total);
  atualizarTextoChaves('totalUnicas', unicas);
  atualizarTextoChaves('totalDuplicadas', duplicadas);
  atualizarTextoChaves('totalSaltos', saltos);
}

function atualizarTextoChaves(id, valor) {
  const el = document.getElementById(id);

  if (el) {
    el.innerText = Number(valor || 0).toLocaleString('pt-BR');
  }
}

/* =========================================================
   UTILITÁRIOS
========================================================= */

function obterOperacaoSelecionada() {
  const selecionado = document.querySelector('input[name="tipoOperacao"]:checked');

  return selecionado ? selecionado.value : 'entrada';
}

function identificarDocumento(modelo) {
  const tipos = {
    '55': 'NF-e',
    '65': 'NFC-e',
    '57': 'CT-e',
    '67': 'CT-e OS',
    '58': 'MDF-e'
  };

  return tipos[modelo] || 'Desconhecido';
}

function validarChaveBasica(chave, modelo) {
  if (!/^\d{44}$/.test(chave)) {
    return 'Inválida';
  }

  const modelosConhecidos = ['55', '65', '57', '67', '58'];

  if (!modelosConhecidos.includes(modelo)) {
    return 'Modelo desconhecido';
  }

  return 'Válida';
}

function formatarAAMM(aamm) {
  if (!aamm || aamm.length !== 4) return '';

  const ano = '20' + aamm.substring(0, 2);
  const mes = aamm.substring(2, 4);

  return `${mes}/${ano}`;
}

function removerZerosEsquerda(valor) {
  const limpo = String(valor || '').replace(/^0+/, '');

  return limpo || '0';
}

function copiarChaveAcesso(chave) {
  if (navigator.clipboard) {
    navigator.clipboard.writeText(chave);
  }
}

/* =========================================================
   DRAG AND DROP
========================================================= */

document.addEventListener('DOMContentLoaded', function () {
  const dropzone = document.getElementById('keysDropzone');
  const input = document.getElementById('keysFiles');
  const progresso = document.getElementById('keysProgress');

  if (!dropzone || !input) return;

  dropzone.addEventListener('click', function () {
    input.click();
  });

  input.addEventListener('change', function () {
    if (progresso && input.files.length) {
      progresso.innerText = `${input.files.length} arquivo(s) selecionado(s). Clique em Extrair chaves.`;
    }
  });

  dropzone.addEventListener('dragover', function (e) {
    e.preventDefault();
    dropzone.classList.add('dragover');
  });

  dropzone.addEventListener('dragleave', function () {
    dropzone.classList.remove('dragover');
  });

  dropzone.addEventListener('drop', function (e) {
    e.preventDefault();
    dropzone.classList.remove('dragover');

    if (e.dataTransfer.files.length) {
      input.files = e.dataTransfer.files;

      if (progresso) {
        progresso.innerText = `${input.files.length} arquivo(s) selecionado(s). Clique em Extrair chaves.`;
      }
    }
  });
});