let planos = {};
let vendedores = [];
let funcionalidades = [];
let filtroPropostas = '';
let propostasCache = [];
let propostasServidorCarregadas = false;
let filtroVendedor = '';
let filtroPlano = '';
let filtroStatus = '';
let filtroMes = '';
let filtroAno = '';
let propostaEmEdicao = null;

/* ==============================
   STORAGE / API
============================== */

const STORAGE_VENDEDORES = 'fiscalio_vendedores';
const STORAGE_PLANOS = 'fiscalio_planos_customizados';
const STORAGE_funcionalidades = 'fiscalio_funcionalidades';
const STORAGE_PROPOSTAS = 'fiscalio_propostas';

const API_PROPOSTAS = {
  salvar: 'api/salvar-proposta.php',
  listar: 'api/listar-propostas.php',
  carregar: 'api/carregar-proposta.php',
  excluir: 'api/excluir-proposta.php',
  atualizar: 'api/atualizar-proposta.php',
  atualizarStatus: 'api/atualizar-status-proposta.php'
};

/* ==============================
   ABAS DO SISTEMA
============================== */

function inicializarAbas() {

  document.querySelectorAll('.menu-item').forEach(function(botao) {

    botao.addEventListener('click', function() {

      abrirAba(botao.dataset.tab);

    });

  });

}

/* ==============================
   CARREGAR PLANOS
============================== */

async function carregarPlanos() {
  try {
    const resposta = await fetch('./data/planos.json?v=' + Date.now());
    planos = await resposta.json();

    const planosCustomizados = JSON.parse(
      localStorage.getItem(STORAGE_PLANOS) || '{}'
    );

    planos = {
      ...planos,
      ...planosCustomizados
    };

    renderizarPlanosCadastrados();

    console.log('Planos carregados:', planos);
  } catch (erro) {
    console.error('Erro ao carregar planos:', erro);
  }
}

/* ==============================
   ALTERAÇÃO DO PLANO
============================== */

function inicializarEventosPlano() {
  const selectPlano = document.getElementById('plano');

  if (selectPlano) {
    selectPlano.addEventListener('change', preencherPlano);
  }

  const moduloServico = document.getElementById('moduloServico');

  if (moduloServico) {
    moduloServico.addEventListener('change', preencherPlano);
  }
}

function preencherPlano() {
  const planoSelecionado = pegarValor('plano');

  if (!planoSelecionado || !planos[planoSelecionado]) {
    return;
  }

  const plano = planos[planoSelecionado];

  const moduloServico = pegarValor('moduloServico');

  const tabelaValores =
    moduloServico === 'nao'
      ? plano.semServico
      : plano.comServico;

  document.getElementById('fidelidade').value =
    plano.fidelidade || '';

  document.getElementById('cnpjs').value =
    plano.cnpjs || '';

  document.getElementById('usuarios').value =
    plano.usuarios || plano.usuariosInclusos || '';

  document.getElementById('valorLocal').value =
    tabelaValores?.valorLocal || plano.valorLocal || '';

  document.getElementById('valorNuvem').value =
    tabelaValores?.valorNuvem || plano.valorNuvem || '';

  document.getElementById('implantacao').value =
    plano.implantacao || '';

  document.getElementById('usuarioAdicional').value =
    plano.usuarioAdicional || '';
}

/* ==============================
   VENDEDORES
============================== */

async function carregarVendedores() {

  try {

    const resposta =
      await fetch(
        'api/listar-vendedores.php?v=' + Date.now()
      );

    if (!resposta.ok) {
      throw new Error(
        'Erro ao carregar vendedores do servidor.'
      );
    }

    vendedores =
      await resposta.json();

    if (!Array.isArray(vendedores)) {
      vendedores = [];
    }

    if (!vendedores.length) {

      vendedores = [
        {
          id: 'adriner',
          nome: 'Adriner Ferreira',
          cargo: 'Consultor',
          telefone: '11 4040-4010',
          whatsapp: '44 3142-4869',
          email: 'adriner.ferreira@fiscal.io',
          foto: ''
        }
      ];

    }

    renderizarVendedores();
    preencherSelectVendedores();

  } catch (erro) {

    console.error(
      'Erro ao carregar vendedores:',
      erro
    );

    vendedores = [
      {
        id: 'adriner',
        nome: 'Adriner Ferreira',
        cargo: 'Consultor',
        telefone: '11 4040-4010',
        whatsapp: '44 3142-4869',
        email: 'adriner.ferreira@fiscal.io',
        foto: ''
      }
    ];

    renderizarVendedores();
    preencherSelectVendedores();

  }

}

async function salvarVendedor() {

  const nome =
    pegarValor('cadVendedorNome');

  if (!nome) {
    alert('Informe o nome do vendedor.');
    return;
  }

  const campoNome =
    document.getElementById('cadVendedorNome');

  const idVendedor =
    campoNome.dataset.editandoId ||
    gerarId(nome);

  const vendedorExistente =
    vendedores.find(function(item) {
      return String(item.id) === String(idVendedor);
    });

  const vendedor = {
    id: idVendedor,
    nome: nome,
    cargo: pegarValor('cadVendedorCargo'),
    telefone: pegarValor('cadVendedorTelefone'),
    whatsapp: pegarValor('cadVendedorWhatsApp'),
    email: pegarValor('cadVendedorEmail'),
    foto: vendedorExistente?.foto || ''
  };

  const inputFoto =
    document.getElementById('cadVendedorFoto');

  if (
    inputFoto &&
    inputFoto.files &&
    inputFoto.files.length > 0
  ) {

    try {

      const formData =
        new FormData();

      formData.append(
        'foto',
        inputFoto.files[0]
      );

      const resposta =
        await fetch(
          'api/upload-vendedor-foto.php?v=' + Date.now(),
          {
            method: 'POST',
            body: formData
          }
        );

      const retorno =
        await resposta.json();

      if (
        !resposta.ok ||
        !retorno.success ||
        !retorno.arquivo
      ) {

        alert(
          retorno.message ||
          'Erro ao enviar foto.'
        );

        return;

      }

      vendedor.foto =
        retorno.arquivo + '?v=' + Date.now();

    } catch (erro) {

      console.error(
        'Erro ao enviar foto:',
        erro
      );

      alert(
        'Erro ao enviar foto.'
      );

      return;

    }

  }

  await concluirSalvarVendedor(
    vendedor
  );

}

/* ==============================
   PROPOSTAS SALVAS
============================== */

let ordenacaoPropostas = {
  campo: 'criadoEm',
  direcao: 'desc'
};

function carregarPropostas() {
  if (propostasServidorCarregadas) {
    return propostasCache;
  }

  return JSON.parse(
    localStorage.getItem(STORAGE_PROPOSTAS) || '[]'
  );
}

function salvarPropostas(lista) {
  propostasCache = Array.isArray(lista) ? lista : [];

  localStorage.setItem(
    STORAGE_PROPOSTAS,
    JSON.stringify(propostasCache)
  );
}

async function carregarPropostasServidor() {
  const lista = document.getElementById('listaPropostas');

  try {
    const resposta = await fetch(
      API_PROPOSTAS.listar + '?v=' + Date.now()
    );

    if (!resposta.ok) {
      throw new Error('Erro ao listar propostas.');
    }

    const propostas = await resposta.json();

    propostasServidorCarregadas = true;
    salvarPropostas(Array.isArray(propostas) ? propostas : []);
    renderizarPropostasSalvas();

  } catch (erro) {
    console.error('Erro ao carregar propostas do servidor:', erro);

    propostasServidorCarregadas = false;

    if (lista) {
      renderizarPropostasSalvas();
    }
  }
}

function normalizarNumeroProposta(numero) {
  return String(numero || '')
    .trim()
    .toUpperCase();
}

function propostaNumeroExiste(numero, versao, idIgnorado) {

  const numeroNormalizado =
    normalizarNumeroProposta(numero);

  const versaoNormalizada =
    String(versao || 'v.1')
      .trim()
      .toLowerCase();

  const propostas =
    carregarPropostas();

  return propostas.some(function(proposta) {

    const mesmoNumero =
      normalizarNumeroProposta(
        proposta.numero
      ) === numeroNormalizado;

    const versaoProposta =
      String(
        proposta.versao ||
        proposta.dados?.versao ||
        'v.1'
      )
      .trim()
      .toLowerCase();

    const mesmaVersao =
      versaoProposta === versaoNormalizada;

    const mesmaProposta =
      String(proposta.id) ===
      String(idIgnorado || '');

    return (
      mesmoNumero &&
      mesmaVersao &&
      !mesmaProposta
    );

  });

}

function extrairSequenciaNumerica(numero) {
  const match = String(numero || '').match(/(\d+)$/);

  if (!match) {
    return null;
  }

  return Number(match[1]);
}

function obterMaiorSequenciaProposta() {
  const propostas = carregarPropostas();

  let maior = null;

  propostas.forEach(function(proposta) {
    const sequencia =
      extrairSequenciaNumerica(proposta.numero);

    if (sequencia === null) {
      return;
    }

    if (maior === null || sequencia > maior) {
      maior = sequencia;
    }
  });

  return maior;
}

function podeExcluirPropostaPorNumero(numero) {
  const sequencia =
    extrairSequenciaNumerica(numero);

  const maiorSequencia =
    obterMaiorSequenciaProposta();

  if (sequencia === null || maiorSequencia === null) {
    return false;
  }

  return sequencia === maiorSequencia;
}

async function salvarPropostaHistorico(dados) {
  const numero = dados.numero || '';
  const empresa = dados.empresa || '';

  if (!numero) {
    alert('Informe o número da proposta.');
    return null;
  }

if (
  propostaNumeroExiste(
    dados.numero,
    dados.versao
  )
) {
  alert(
    'Já existe uma proposta com este número e esta versão.'
  );

  return null;
}

  const idBase = gerarId(
    (numero || 'proposta') + '-' + (empresa || Date.now())
  );

  const proposta = {
    id: idBase,
    numero: numero,
    empresa: empresa,
    status: dados.status || 'Rascunho',
    contato: dados.contato || '',
    consultor: dados.consultorNome || '',
    plano: dados.plano || '',
    modeloOferta: dados.modeloOferta || '',
    data: dados.data || '',
    validade: dados.validade || '',
    criadoEm: new Date().toISOString(),
    dados: {
      ...dados,
      status: dados.status || 'Rascunho'
    }
  };

  try {
    const resposta = await fetch(API_PROPOSTAS.salvar, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(proposta)
    });

    const retorno = await resposta.json();

    if (!resposta.ok || !retorno.success) {
      alert(
        retorno.message ||
        'Não foi possível salvar a proposta no servidor.'
      );

      return null;
    }

    proposta.id = retorno.id || proposta.id;

    const propostas = carregarPropostas();

    propostas.unshift(proposta);

    propostasServidorCarregadas = true;
    salvarPropostas(propostas);
    renderizarPropostasSalvas();

    return proposta;

  } catch (erro) {
    console.error('Erro ao salvar proposta no servidor:', erro);

    alert(
      'Não foi possível salvar a proposta no servidor.\n\n' +
      'Verifique a conexão ou a API.'
    );

    return null;
  }
}

function ordenarPropostas(lista) {
  return [...lista].sort(function(a, b) {
    const campo = ordenacaoPropostas.campo;
    const direcao = ordenacaoPropostas.direcao;

    let valorA = a[campo] || '';
    let valorB = b[campo] || '';

    if (campo === 'plano') {
      const ordemPlano = {
        basico: 1,
        avancado: 2,
        enterprise: 3
      };

      if (campo === 'versaoAtual') {

  valorA =
    Number(
      a.versaoAtual ||
      a.dados?.versaoAtual ||
      1
    );

  valorB =
    Number(
      b.versaoAtual ||
      b.dados?.versaoAtual ||
      1
    );

}
      
      
      valorA = ordemPlano[valorA] || 99;
      valorB = ordemPlano[valorB] || 99;
    }

    if (campo === 'status') {
      const ordemStatus = {
        Rascunho: 1,
        Enviada: 2,
        Negociação: 3,
        Fechada: 4,
        Perdida: 5
      };

      valorA = ordemStatus[valorA] || 99;
      valorB = ordemStatus[valorB] || 99;
    }

    if (campo === 'data' || campo === 'criadoEm') {
      valorA = new Date(valorA || 0).getTime();
      valorB = new Date(valorB || 0).getTime();
    }

    if (typeof valorA === 'string') {
      valorA = valorA.toLowerCase();
      valorB = String(valorB).toLowerCase();
    }

    if (valorA < valorB) {
      return direcao === 'asc' ? -1 : 1;
    }

    if (valorA > valorB) {
      return direcao === 'asc' ? 1 : -1;
    }

    return 0;
  });
}

function alternarOrdenacaoPropostas(campo) {
  if (ordenacaoPropostas.campo === campo) {
    ordenacaoPropostas.direcao =
      ordenacaoPropostas.direcao === 'asc'
        ? 'desc'
        : 'asc';
  } else {
    ordenacaoPropostas.campo = campo;
    ordenacaoPropostas.direcao = 'asc';
  }

  renderizarPropostasSalvas();
}

function iconeOrdenacao(campo) {
  if (ordenacaoPropostas.campo !== campo) {
    return '';
  }

  return ordenacaoPropostas.direcao === 'asc'
    ? ' ↑'
    : ' ↓';
}


function converterMoedaParaNumero(valor) {
  if (!valor) {
    return 0;
  }

  const texto = String(valor)
    .replace('/mês', '')
    .replace('R$', '')
    .replace(/\s/g, '')
    .replace(/\./g, '')
    .replace(',', '.')
    .trim();

  const numero = Number(texto);

  return Number.isFinite(numero)
    ? numero
    : 0;
}

function obterValorMensalProposta(proposta) {

  const dados =
    proposta.dados || {};

  const valorLocal =
    converterMoedaParaNumero(
      dados.valorLocal ||
      proposta.valorLocal ||
      ''
    );

  const valorNuvem =
    converterMoedaParaNumero(
      dados.valorNuvem ||
      proposta.valorNuvem ||
      ''
    );

  const modelo =
    dados.modeloOferta ||
    proposta.modeloOferta ||
    '';

  if (modelo === 'local') {
    return valorLocal;
  }

  if (modelo === 'nuvem') {
    return valorNuvem;
  }

  if (valorLocal > 0 && valorNuvem > 0) {
    return Math.max(
      valorLocal,
      valorNuvem
    );
  }

  return valorLocal || valorNuvem || 0;
}

function obterValorImplantacaoProposta(proposta) {

  const dados =
    proposta.dados || {};

  return converterMoedaParaNumero(
    dados.implantacao ||
    proposta.implantacao ||
    ''
  );
}

function formatarMoedaBR(valor) {
  return Number(valor || 0).toLocaleString(
    'pt-BR',
    {
      style: 'currency',
      currency: 'BRL'
    }
  );
}

function converterMoedaParaNumero(valor) {
  if (!valor) {
    return 0;
  }

  const texto = String(valor)
    .replace('/mês', '')
    .replace('R$', '')
    .replace(/\s/g, '')
    .replace(/\./g, '')
    .replace(',', '.')
    .trim();

  const numero = Number(texto);

  return Number.isFinite(numero)
    ? numero
    : 0;
}

function obterValorMensalProposta(proposta) {
  const dados =
    proposta.dados || proposta;

  const valorLocal =
    converterMoedaParaNumero(
      dados.valorLocal
    );

  const valorNuvem =
    converterMoedaParaNumero(
      dados.valorNuvem
    );

  const modelo =
    dados.modeloOferta ||
    proposta.modeloOferta ||
    '';

  if (modelo === 'local') {
    return valorLocal;
  }

  if (modelo === 'nuvem') {
    return valorNuvem;
  }

  return Math.max(
    valorLocal,
    valorNuvem
  );
}

function obterValorImplantacaoProposta(proposta) {
  const dados =
    proposta.dados || proposta;

  return converterMoedaParaNumero(
    dados.implantacao
  );
}

function formatarMoedaBR(valor) {
  return Number(valor || 0).toLocaleString(
    'pt-BR',
    {
      style: 'currency',
      currency: 'BRL'
    }
  );
}

function criarCardDashboard(
  classe,
  titulo,
  quantidade,
  recorrencia,
  implantacao
) {

  return `
    <div class="card-status ${classe}">

      <div class="card-status-topo">
        <span class="card-status-titulo">
          ${titulo}
        </span>

        <strong class="card-status-quantidade">
          ${quantidade}
        </strong>
      </div>

      <div class="card-status-direita">

        <div class="card-fin-linha">
          <span>Rec.</span>
          <strong>${formatarMoedaBR(recorrencia)}</strong>
        </div>

        <div class="card-fin-linha">
          <span>Impl.</span>
          <strong>${formatarMoedaBR(implantacao)}</strong>
        </div>

      </div>

    </div>
  `;
}

function renderizarDashboardComercial(
  propostas
) {

  const dashboard =
    document.getElementById(
      'dashboardComercial'
    );

  if (!dashboard) {
    return;
  }

  propostas =
    Array.isArray(propostas)
      ? propostas
      : [];

  const propostasRascunho =
    propostas.filter(
      p => (p.status || 'Rascunho') === 'Rascunho'
    );

  const propostasEnviadas =
    propostas.filter(
      p => p.status === 'Enviada'
    );

  const propostasNegociacao =
    propostas.filter(
      p => p.status === 'Negociação'
    );

  const propostasFechadas =
    propostas.filter(
      p => p.status === 'Fechada'
    );

  const propostasPerdidas =
    propostas.filter(
      p => p.status === 'Perdida'
    );

  const total =
    propostas.length;

  const rascunho =
    propostasRascunho.length;

  const enviada =
    propostasEnviadas.length;

  const negociacao =
    propostasNegociacao.length;

  const fechada =
    propostasFechadas.length;

  const perdida =
    propostasPerdidas.length;

  const mrrTotal =
    propostas.reduce(
      (t, p) =>
        t +
        obterValorMensalProposta(p),
      0
    );

  const implantacaoTotal =
    propostas.reduce(
      (t, p) =>
        t +
        obterValorImplantacaoProposta(p),
      0
    );

  const mrrRascunho =
    propostasRascunho.reduce(
      (t, p) =>
        t +
        obterValorMensalProposta(p),
      0
    );

  const implantacaoRascunho =
    propostasRascunho.reduce(
      (t, p) =>
        t +
        obterValorImplantacaoProposta(p),
      0
    );

  const mrrEnviada =
    propostasEnviadas.reduce(
      (t, p) =>
        t +
        obterValorMensalProposta(p),
      0
    );

  const implantacaoEnviada =
    propostasEnviadas.reduce(
      (t, p) =>
        t +
        obterValorImplantacaoProposta(p),
      0
    );

  const mrrNegociacao =
    propostasNegociacao.reduce(
      (t, p) =>
        t +
        obterValorMensalProposta(p),
      0
    );

  const implantacaoNegociacao =
    propostasNegociacao.reduce(
      (t, p) =>
        t +
        obterValorImplantacaoProposta(p),
      0
    );

  const mrrFechada =
    propostasFechadas.reduce(
      (t, p) =>
        t +
        obterValorMensalProposta(p),
      0
    );

  const implantacaoFechada =
    propostasFechadas.reduce(
      (t, p) =>
        t +
        obterValorImplantacaoProposta(p),
      0
    );

  const mrrPerdida =
    propostasPerdidas.reduce(
      (t, p) =>
        t +
        obterValorMensalProposta(p),
      0
    );

  const implantacaoPerdida =
    propostasPerdidas.reduce(
      (t, p) =>
        t +
        obterValorImplantacaoProposta(p),
      0
    );

  dashboard.innerHTML = `
    <div class="dashboard-comercial">

      ${criarCardDashboard(
        'total',
        'Total',
        total,
        mrrTotal,
        implantacaoTotal
      )}

      ${criarCardDashboard(
        'rascunho',
        '🟡 Rascunho',
        rascunho,
        mrrRascunho,
        implantacaoRascunho
      )}

      ${criarCardDashboard(
        'enviada',
        '🔵 Enviada',
        enviada,
        mrrEnviada,
        implantacaoEnviada
      )}

      ${criarCardDashboard(
        'negociacao',
        '🟠 Negociação',
        negociacao,
        mrrNegociacao,
        implantacaoNegociacao
      )}

      ${criarCardDashboard(
        'fechada',
        '🟢 Fechada',
        fechada,
        mrrFechada,
        implantacaoFechada
      )}

      ${criarCardDashboard(
        'perdida',
        '🔴 Perdida',
        perdida,
        mrrPerdida,
        implantacaoPerdida
      )}

    </div>
  `;
}



function renderizarPropostasSalvas() {

  const lista =
    document.getElementById(
      'listaPropostas'
    );

  if (!lista) {
    return;
  }

  let propostas =
    carregarPropostas();

  renderizarDashboardComercial(
    propostas
  );


  if (filtroPropostas) {
    const busca = filtroPropostas.toLowerCase().trim();

propostas = propostas.filter(function(proposta) {
  const textoBusca = [
    proposta.numero,
    proposta.empresa,
    proposta.contato,
    proposta.consultor,
    proposta.plano,
    proposta.status,
    formatarNomePlano(proposta.plano),
    proposta.modeloOferta,
    proposta.data,
    formatarDataBR(proposta.data)
  ]
    .join(' ')
    .toLowerCase();

  const data = proposta.data || proposta.dados?.data || '';
  const ano = data ? data.substring(0, 4) : '';
  const mes = data ? data.substring(5, 7) : '';

  return (
    (!busca || textoBusca.includes(busca)) &&
    (!filtroVendedor || proposta.consultor === filtroVendedor) &&
    (!filtroPlano || proposta.plano === filtroPlano) &&
    (!filtroStatus || (proposta.status || 'Rascunho') === filtroStatus) &&
    (!filtroMes || mes === filtroMes) &&
    (!filtroAno || ano === filtroAno)
  );
});
  }

  propostas = ordenarPropostas(propostas);

  if (!propostas.length) {
    lista.innerHTML = `
      <div class="linha">
        <strong>Nenhuma proposta encontrada</strong>
        <span>Altere a pesquisa ou gere uma nova proposta.</span>
      </div>
    `;
    return;
  }

  lista.innerHTML = `
    <div class="linha linha-proposta cabecalho-propostas">
      <button type="button" class="coluna-ordenavel" data-ordenar="numero">
        Nº${iconeOrdenacao('numero')}
      </button>

      <button type="button" class="coluna-ordenavel" data-ordenar="empresa">
        Empresa${iconeOrdenacao('empresa')}
      </button>

      <button type="button" class="coluna-ordenavel" data-ordenar="consultor">
        Consultor${iconeOrdenacao('consultor')}
      </button>

      <button type="button" class="coluna-ordenavel" data-ordenar="plano">
        Plano${iconeOrdenacao('plano')}
      </button>
      
      <button type="button" class="coluna-ordenavel" data-ordenar="versaoAtual">
  		Versão${iconeOrdenacao('versaoAtual')}
		</button>
      

      <button type="button" class="coluna-ordenavel" data-ordenar="status">
        Status${iconeOrdenacao('status')}
      </button>

      <button type="button" class="coluna-ordenavel" data-ordenar="data">
        Data${iconeOrdenacao('data')}
      </button>

      <strong>Ações</strong>
    </div>

    ${propostas.map(function(proposta) {
      return `
        <div class="linha linha-proposta proposta-linha" data-id="${escaparHTML(proposta.id)}">
          <strong>${escaparHTML(proposta.numero || '-')}</strong>

          <span>${escaparHTML(proposta.empresa || '-')}</span>

          <span>${escaparHTML(proposta.consultor || '-')}</span>

          <span>${escaparHTML(formatarNomePlano(proposta.plano) || '-')}</span>
          <span class="badge-versao">
  ${escaparHTML(
    proposta.versao ||
    proposta.dados?.versao ||
    'v.1'
  )}
</span>

          <select
  class="status-proposta"
  data-id="${escaparHTML(proposta.id)}">

  <option value="Rascunho" ${
    (proposta.status || 'Rascunho') === 'Rascunho' ? 'selected' : ''
  }>🟡 Rascunho</option>

  <option value="Enviada" ${
    proposta.status === 'Enviada' ? 'selected' : ''
  }>🔵 Enviada</option>

  <option value="Negociação" ${
    proposta.status === 'Negociação' ? 'selected' : ''
  }>🟠 Negociação</option>

  <option value="Fechada" ${
    proposta.status === 'Fechada' ? 'selected' : ''
  }>🟢 Fechada</option>

  <option value="Perdida" ${
    proposta.status === 'Perdida' ? 'selected' : ''
  }>🔴 Perdida</option>

</select>

          <span>${escaparHTML(formatarDataBR(proposta.data) || '-')}</span>

          <div class="linha-acoes">
            <button type="button" class="btn-mini btn-abrir-proposta" data-id="${escaparHTML(proposta.id)}">
              Abrir
            </button>

            <button type="button" class="btn-mini btn-editar-proposta" data-id="${escaparHTML(proposta.id)}">
              Editar
            </button>

            <button type="button" class="btn-mini btn-duplicar-proposta" data-id="${escaparHTML(proposta.id)}">
              Duplicar
            </button>
            
            

            <button type="button" class="btn-mini btn-excluir-proposta" data-id="${escaparHTML(proposta.id)}">
              Excluir
            </button>
          </div>
        </div>
      `;
    }).join('')}
  `;

  document.querySelectorAll('.coluna-ordenavel').forEach(function(botao) {
    botao.addEventListener('click', function() {
      alternarOrdenacaoPropostas(botao.dataset.ordenar);
    });
  });

  document.querySelectorAll('.btn-abrir-proposta').forEach(function(botao) {
    botao.addEventListener('click', function(evento) {
      evento.stopPropagation();
      abrirPropostaSalva(botao.dataset.id);
    });
  });

  document.querySelectorAll('.btn-editar-proposta').forEach(function(botao) {
    botao.addEventListener('click', function(evento) {
      evento.stopPropagation();
      editarPropostaSalva(botao.dataset.id);
    });
  });

  document.querySelectorAll('.btn-duplicar-proposta').forEach(function(botao) {
    botao.addEventListener('click', function(evento) {
      evento.stopPropagation();
      duplicarPropostaSalva(botao.dataset.id);
    });
  });
  
  document.querySelectorAll('.btn-excluir-proposta').forEach(function(botao) {
  botao.addEventListener('click', function(evento) {
    evento.stopPropagation();
    excluirPropostaSalva(botao.dataset.id);
  });
});

  document
  .querySelectorAll('.status-proposta')
  .forEach(function(select) {

    select.addEventListener(
      'change',
      function(evento) {

        evento.stopPropagation();

        alterarStatusProposta(
          this.dataset.id,
          this.value
        );

      }
    );

  });

  document.querySelectorAll('.proposta-linha').forEach(function(linha) {
    linha.addEventListener('dblclick', function() {
      abrirPropostaSalva(linha.dataset.id);
    });
  });
}

function buscarPropostaPorId(id) {
  const propostas = carregarPropostas();

  return propostas.find(function(item) {
    return String(item.id) === String(id);
  });
}

async function carregarPropostaCompleta(id) {
  const propostaLocal = buscarPropostaPorId(id);

  if (propostaLocal && propostaLocal.dados) {
    return propostaLocal;
  }

  try {
    const resposta = await fetch(
      API_PROPOSTAS.carregar + '?id=' + encodeURIComponent(id)
    );

    const proposta = await resposta.json();

    if (!resposta.ok) {
      throw new Error(proposta.message || 'Proposta não encontrada.');
    }

    return proposta;

  } catch (erro) {
    console.error('Erro ao carregar proposta:', erro);
    alert('Não foi possível carregar esta proposta.');
    return null;
  }
}

async function abrirPropostaSalva(id) {
  const proposta = await carregarPropostaCompleta(id);

  if (!proposta) {
    return;
  }

  const dados =
    proposta.dados || proposta;

  localStorage.setItem(
    'dadosPropostaFiscalio',
    JSON.stringify(dados)
  );

  window.open(
    'proposta.html?id=' + encodeURIComponent(id),
    '_blank'
  );
}

async function editarPropostaSalva(id) {

  const proposta =
    await carregarPropostaCompleta(id);

  if (!proposta) {
    return;
  }

  propostaEmEdicao = proposta;

  const dados =
    proposta.dados || proposta;

  preencherFormularioComDados(dados);

  abrirAba('tab-proposta');

  atualizarModoEdicao();

}
const CAMPOS_VERSAO_COMERCIAL = [
  'plano',
  'valorLocal',
  'valorNuvem',
  'implantacao',
  'fidelidade',
  'usuarios',
  'usuariosAdicionais',
  'usuarioAdicional',
  'cnpjs',
  'modeloOferta',
  'moduloServico'
];

function normalizarValorComparacao(valor) {
  return String(valor ?? '')
    .trim()
    .replace(/\s+/g, ' ')
    .toLowerCase();
}

function houveAlteracaoComercial(dadosAntigos, dadosNovos) {
  return CAMPOS_VERSAO_COMERCIAL.some(function(campo) {
    return (
      normalizarValorComparacao(dadosAntigos?.[campo]) !==
      normalizarValorComparacao(dadosNovos?.[campo])
    );
  });
}

function obterNumeroVersaoAtual(proposta) {
  const versaoAtual =
    Number(proposta?.versaoAtual || proposta?.dados?.versaoAtual || 1);

  if (!Number.isFinite(versaoAtual) || versaoAtual < 1) {
    return 1;
  }

  return versaoAtual;
}

async function salvarAlteracoesProposta() {

  if (!propostaEmEdicao) {
    alert('Nenhuma proposta em edição.');
    return;
  }

  const dados = montarDadosFormulario();

  const propostaAtualizada = {
    id: propostaEmEdicao.id,
    numero: dados.numero,
    empresa: dados.empresa,
    versao: dados.versao || 'v.1',
    versaoAtual: Number(String(dados.versao || 'v.1').replace(/\D/g, '')) || 1,
    historicoVersoes: propostaEmEdicao.historicoVersoes || [],
    status: dados.status || propostaEmEdicao.status || 'Rascunho',
    contato: dados.contato || '',
    consultor: dados.consultorNome || '',
    plano: dados.plano || '',
    modeloOferta: dados.modeloOferta || '',
    data: dados.data || '',
    validade: dados.validade || '',
    criadoEm: propostaEmEdicao.criadoEm || new Date().toISOString(),
    atualizadoEm: new Date().toISOString(),
    dados: {
      ...dados,
      versao: dados.versao || 'v.1',
      versaoAtual: Number(String(dados.versao || 'v.1').replace(/\D/g, '')) || 1,
      status: dados.status || propostaEmEdicao.status || 'Rascunho'
    }
  };

  try {

    const resposta = await fetch(API_PROPOSTAS.atualizar, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(propostaAtualizada)
    });

    const resultado = await resposta.json();

    if (!resposta.ok || !resultado.success) {
      alert(resultado.message || 'Erro ao atualizar proposta.');
      return;
    }

    alert('Proposta atualizada com sucesso!');

    propostaEmEdicao = null;

    atualizarModoEdicao();

    await carregarPropostasServidor();

    abrirAba('tab-propostas');

  } catch (erro) {

    console.error('Erro ao atualizar proposta:', erro);
    alert('Erro ao atualizar proposta.');

  }
}
async function duplicarPropostaSalva(id) {
  const proposta = await carregarPropostaCompleta(id);

  if (!proposta) {
    return;
  }

  const dadosBase =
    proposta.dados || proposta;

  const versaoAtual =
    Number(
      String(
        dadosBase.versao || 'v.1'
      ).replace(/\D/g, '')
    ) || 1;

  const dadosDuplicados = {
    ...dadosBase,
    id: '',
    numero: dadosBase.numero || '',
    versao: 'v.' + (versaoAtual + 1),
    status: 'Rascunho'
  };

  propostaEmEdicao = null;

  preencherFormularioComDados(dadosDuplicados);
  abrirAba('tab-proposta');
}
async function excluirPropostaSalva(id) {
  const proposta = buscarPropostaPorId(id);

  if (!proposta) {
    alert('Proposta não encontrada.');
    return;
  }

  if (!podeExcluirPropostaPorNumero(proposta.numero)) {
    alert(
      'Esta proposta não pode ser excluída porque existem propostas criadas depois dela.\n\n' +
      'Para manter a sequência comercial sem buracos, registre uma observação no campo "Observações comerciais".\n\n' +
      'Se necessário, crie uma nova proposta substituindo esta.'
    );

    return;
  }

  const confirmar = confirm(
    'Deseja realmente excluir a última proposta da sequência?\n\n' +
    (proposta.numero || '') +
    ' - ' +
    (proposta.empresa || '')
  );

  if (!confirmar) {
    return;
  }

  try {
    const resposta = await fetch(API_PROPOSTAS.excluir, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        id: proposta.id
      })
    });

    const retorno = await resposta.json();

    if (!resposta.ok || !retorno.success) {
      alert(
        retorno.message ||
        'Não foi possível excluir a proposta.'
      );

      return;
    }

    const propostas = carregarPropostas().filter(function(item) {
      return String(item.id) !== String(id);
    });

    salvarPropostas(propostas);
    renderizarPropostasSalvas();

  } catch (erro) {
    console.error('Erro ao excluir proposta:', erro);
    alert('Não foi possível excluir a proposta no servidor.');
  }
}


async function alterarStatusProposta(
  id,
  novoStatus
) {

  try {

    const resposta =
      await fetch(
        API_PROPOSTAS.atualizarStatus,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            id: id,
            status: novoStatus
          })
        }
      );

    const retorno =
      await resposta.json();

    if (
      !resposta.ok ||
      !retorno.success
    ) {

      alert(
        retorno.message ||
        'Erro ao atualizar status.'
      );

      await carregarPropostasServidor();

      return;

    }

    const propostas =
      carregarPropostas();

    const proposta =
      propostas.find(
        p => String(p.id) === String(id)
      );

    if (proposta) {

      proposta.status =
        novoStatus;

      if (proposta.dados) {

        proposta.dados.status =
          novoStatus;

      }

    }

    salvarPropostas(propostas);

    renderizarDashboardComercial(
      propostas
    );

    renderizarPropostasSalvas();

  } catch (erro) {

    console.error(
      'Erro ao atualizar status:',
      erro
    );

    alert(
      'Erro ao atualizar status.'
    );

    await carregarPropostasServidor();

  }

}
function preencherFormularioComDados(dados) {
  definirValor('numeroProposta', dados.numero);
  definirValor('versaoProposta', dados.versao);
  definirValor('empresa', dados.empresa);
  definirValor('contato', dados.contato);

  definirValor('fidelidade', dados.fidelidade);
  definirValor('participantes', dados.participantes);
  definirValor('necessidades', dados.necessidades);

  definirValor('plano', dados.plano);
  definirValor('moduloServico', dados.moduloServico);
  definirValor('modeloOferta', dados.modeloOferta);

  definirValor('dataProposta', dados.data);
  definirValor('validade', dados.validade);

  definirValor('cnpjs', dados.cnpjs);
  definirValor('usuarios', dados.usuarios);
  definirValor('usuariosAdicionais', dados.usuariosAdicionais);
  definirValor('valorLocal', dados.valorLocal);
  definirValor('valorNuvem', dados.valorNuvem);
  definirValor('implantacao', dados.implantacao);
  definirValor('usuarioAdicional', dados.usuarioAdicional);

  definirValor('consultorNome', dados.consultorNome);
  definirValor('consultorCargo', dados.consultorCargo);
  definirValor('consultorTelefone', dados.consultorTelefone);
  definirValor('consultorWhatsApp', dados.consultorWhatsApp);
  definirValor('consultorEmail', dados.consultorEmail);

  definirValor('observacoesComerciais', dados.observacoesComerciais);
  definirValor('escopoAutomatico', dados.escopoAutomatico || 'sim');
  definirValor('escopoComercial', dados.escopoComercial || '');

  if (dados.logoCliente) {
    localStorage.setItem(
      'logoClientePropostaEditada',
      dados.logoCliente
    );
  }

const selectConsultor = document.getElementById('consultorSelecionado');

if (selectConsultor && dados.consultorNome) {
  const vendedorAtual = vendedores.find(function(vendedor) {
    return String(vendedor.nome || '').trim().toLowerCase() ===
      String(dados.consultorNome || '').trim().toLowerCase();
  });

  if (vendedorAtual) {
    selectConsultor.value = vendedorAtual.id;
    preencherConsultorSelecionado();
  }
}

}

/* ==============================
   UTILITÁRIOS
============================== */

function gerarId(texto) {
  return String(texto || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '') || String(Date.now());
}

function abrirAba(tabId) {

  document.querySelectorAll('.menu-item').forEach(function(item) {
    item.classList.remove('ativo');
  });

  document.querySelectorAll('.app-tab').forEach(function(tab) {
    tab.classList.remove('ativo');
  });

  const botao =
    document.querySelector(
      '.menu-item[data-tab="' + tabId + '"]'
    );

  const aba =
    document.getElementById(tabId);

  if (botao) {
    botao.classList.add('ativo');
  }

  if (aba) {
    aba.classList.add('ativo');
  }

  atualizarBotoesSidebar(tabId);

  if (tabId === 'tab-propostas') {
    carregarPropostasServidor();
  }

}

function atualizarBotoesSidebar(tabId) {

  const btnPrincipal =
    document.getElementById('btnGerarSidebar');

  const btnLimpar =
    document.getElementById('btnLimparInferior');

  if (!btnPrincipal || !btnLimpar) {
    return;
  }

  btnPrincipal.style.display = 'block';
  btnLimpar.style.display = 'block';

  if (tabId === 'tab-proposta') {

    btnPrincipal.textContent =
      propostaEmEdicao
        ? 'Salvar alterações'
        : 'Gerar proposta';

    btnLimpar.textContent =
      propostaEmEdicao
        ? 'Cancelar edição'
        : 'Limpar formulário';

    return;
  }

  if (tabId === 'tab-vendedores') {

    btnPrincipal.textContent =
      'Salvar vendedor';

    btnLimpar.textContent =
      'Limpar formulário';

    return;
  }

  if (tabId === 'tab-valores') {

    btnPrincipal.textContent =
      'Salvar plano';

    btnLimpar.textContent =
      'Limpar formulário';

    return;
  }

  if (tabId === 'tab-funcionalidades') {

    btnPrincipal.textContent =
      'Salvar funcionalidades';

    btnLimpar.textContent =
      'Limpar formulário';

    return;
  }

  if (tabId === 'tab-dfe-master-v2') {

    btnPrincipal.textContent =
      'Salvar DFe Master';

    btnLimpar.textContent =
      'Limpar formulário';

    return;
  }

  if (tabId === 'tab-propostas') {

    btnPrincipal.style.display =
      'none';

    btnLimpar.style.display =
      'none';

    return;
  }

}

function definirValor(id, valor) {
  const campo = document.getElementById(id);

  if (campo) {
    campo.value = valor ?? '';
  }
}

function formatarNomePlano(plano) {
  const nomes = {
    basico: 'Básico',
    avancado: 'Avançado',
    enterprise: 'Enterprise'
  };

  return nomes[plano] || plano || '';
}

function formatarDataBR(data) {
  if (!data) {
    return '';
  }

  const partes = String(data).split('-');

  if (partes.length !== 3) {
    return data;
  }

  return partes[2] + '/' + partes[1] + '/' + partes[0];
}

/* ==============================
   CADASTRO DE VENDEDORES
============================== */

async function salvarVendedor() {

  const nome =
    pegarValor('cadVendedorNome');

  if (!nome) {
    alert('Informe o nome do vendedor.');
    return;
  }

  const idVendedor =
    document
      .getElementById('cadVendedorNome')
      .dataset.editandoId ||
    gerarId(nome);

  const vendedorExistente =
    vendedores.find(function(item) {
      return item.id === idVendedor;
    });

  const vendedor = {
    id: idVendedor,
    nome: nome,
    cargo: pegarValor('cadVendedorCargo'),
    telefone: pegarValor('cadVendedorTelefone'),
    whatsapp: pegarValor('cadVendedorWhatsApp'),
    email: pegarValor('cadVendedorEmail'),
    foto: vendedorExistente?.foto || ''
  };

  const inputFoto =
    document.getElementById(
      'cadVendedorFoto'
    );

  if (
    inputFoto &&
    inputFoto.files &&
    inputFoto.files[0]
  ) {

    try {

      const formData =
        new FormData();

      formData.append(
        'foto',
        inputFoto.files[0]
      );

      const resposta =
        await fetch(
          'api/upload-vendedor-foto.php',
          {
            method: 'POST',
            body: formData
          }
        );

      const retorno =
        await resposta.json();

      if (
        retorno.success &&
        retorno.arquivo
      ) {

        vendedor.foto =
          retorno.arquivo;

      } else {

        alert(
          retorno.message ||
          'Erro ao enviar foto.'
        );

        return;
      }

    } catch (erro) {

      console.error(
        'Erro ao enviar foto:',
        erro
      );

      alert(
        'Erro ao enviar foto.'
      );

      return;

    }

  }

  concluirSalvarVendedor(
    vendedor
  );

}
async function concluirSalvarVendedor(vendedor) {

  try {

    const resposta =
      await fetch(
        'api/salvar-vendedor.php?v=' + Date.now(),
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(vendedor)
        }
      );

    const retorno =
      await resposta.json();

    if (
      !resposta.ok ||
      !retorno.success
    ) {

      alert(
        retorno.message ||
        'Não foi possível salvar o vendedor no servidor.'
      );

      return;

    }

    await carregarVendedores();

    const campoNome =
      document.getElementById('cadVendedorNome');

    campoNome.value = '';
    delete campoNome.dataset.editandoId;

    document.getElementById('cadVendedorCargo').value = '';
    document.getElementById('cadVendedorTelefone').value = '';
    document.getElementById('cadVendedorWhatsApp').value = '';
    document.getElementById('cadVendedorEmail').value = '';

    const foto =
      document.getElementById('cadVendedorFoto');

    if (foto) {
      foto.value = '';
    }

    const previewFoto =
      document.getElementById('previewVendedorFoto');

    const previewBox =
      document.getElementById('previewVendedor');

    if (previewFoto) {
      previewFoto.removeAttribute('src');
    }

    if (previewBox) {
      previewBox.classList.remove('com-foto');
    }

    alert('Vendedor salvo com sucesso.');

  } catch (erro) {

    console.error(
      'Erro ao salvar vendedor:',
      erro
    );

    alert(
      'Erro ao salvar vendedor no servidor.'
    );

  }

}
function renderizarVendedores() {
  const lista = document.getElementById('listaVendedores');

  if (!lista) {
    return;
  }

  lista.innerHTML = vendedores.map(function(vendedor) {
    return `
      <div class="linha vendedor-linha" data-id="${escaparHTML(vendedor.id)}">
        <strong>${escaparHTML(vendedor.nome)}</strong>
        <span>${escaparHTML(vendedor.cargo || '-')}</span>
        <span>${escaparHTML(vendedor.telefone || '-')}</span>
        <span>${escaparHTML(vendedor.email || '-')}</span>
      </div>
    `;
  }).join('');

  document.querySelectorAll('.vendedor-linha').forEach(function(linha) {
    linha.addEventListener('click', function() {
      carregarVendedorParaEdicao(linha.dataset.id);
    });
  });
}

function carregarVendedorParaEdicao(id) {
  const vendedor = vendedores.find(function(item) {
    return item.id === id;
  });

  if (!vendedor) {
    return;
  }

  document.getElementById('cadVendedorNome').value = vendedor.nome || '';
  document.getElementById('cadVendedorCargo').value = vendedor.cargo || '';
  document.getElementById('cadVendedorTelefone').value = vendedor.telefone || '';
  document.getElementById('cadVendedorWhatsApp').value = vendedor.whatsapp || '';
  document.getElementById('cadVendedorEmail').value = vendedor.email || '';

  document.getElementById('cadVendedorNome').dataset.editandoId = vendedor.id;

  const previewFoto = document.getElementById('previewVendedorFoto');
  const previewBox = document.getElementById('previewVendedor');

  if (previewFoto && previewBox && vendedor.foto) {
    previewFoto.src = vendedor.foto;
    previewBox.classList.add('com-foto');
  } else if (previewFoto && previewBox) {
    previewFoto.removeAttribute('src');
    previewBox.classList.remove('com-foto');
  }
}

function preencherSelectVendedores() {
  const select = document.getElementById('consultorSelecionado');

  if (!select) {
    return;
  }

  select.innerHTML = vendedores.map(function(vendedor) {
    return `
      <option value="${escaparHTML(vendedor.id)}">
        ${escaparHTML(vendedor.nome)}
      </option>
    `;
  }).join('');

  select.removeEventListener('change', preencherConsultorSelecionado);
  select.addEventListener('change', preencherConsultorSelecionado);

  preencherConsultorSelecionado();
}

function preencherConsultorSelecionado() {
  const id = pegarValor('consultorSelecionado');

  const vendedor = vendedores.find(function(item) {
    return item.id === id;
  });

  if (!vendedor) {
    return;
  }

  document.getElementById('consultorNome').value =
    vendedor.nome || '';

  document.getElementById('consultorCargo').value =
    vendedor.cargo || '';

  document.getElementById('consultorTelefone').value =
    vendedor.telefone || '';

  document.getElementById('consultorWhatsApp').value =
    vendedor.whatsapp || '';

  document.getElementById('consultorEmail').value =
    vendedor.email || '';

  localStorage.setItem(
    'fotoConsultorSelecionado',
    vendedor.foto || ''
  );
}

/* ==============================
   CADASTRO DE PLANOS E VALORES
============================== */

function salvarPlanoCustomizado() {
  const planoId = pegarValor('cadPlano');

  if (!planoId) {
    alert('Selecione o plano.');
    return;
  }

  const planoAtual = planos[planoId] || {};

  const planoAtualizado = {
    ...planoAtual,
    valorLocal: pegarValor('cadValorLocal'),
    valorNuvem: pegarValor('cadValorNuvem'),
    implantacao: pegarValor('cadImplantacao'),
    usuariosInclusos: pegarValor('cadUsuariosInclusos'),
    usuarios: pegarValor('cadUsuariosInclusos'),
    usuarioAdicional: pegarValor('cadUsuarioAdicional'),
    observacoesPlano: pegarValor('cadObservacoesPlano'),

    comServico: {
      ...(planoAtual.comServico || {}),
      valorLocal: pegarValor('cadValorLocal'),
      valorNuvem: pegarValor('cadValorNuvem')
    }
  };

  planos[planoId] = planoAtualizado;

  const planosCustomizados = JSON.parse(
    localStorage.getItem(STORAGE_PLANOS) || '{}'
  );

  planosCustomizados[planoId] = planoAtualizado;

  localStorage.setItem(
    STORAGE_PLANOS,
    JSON.stringify(planosCustomizados)
  );

  renderizarPlanosCadastrados();

  alert('Valores do plano salvos com sucesso.');

  if (pegarValor('plano') === planoId) {
    preencherPlano();
  }
}

function renderizarPlanosCadastrados() {
  const lista = document.getElementById('listaPlanos');

  if (!lista) {
    return;
  }

  const nomes = {
    basico: 'Básico',
    avancado: 'Avançado',
    enterprise: 'Enterprise'
  };

  lista.innerHTML = Object.keys(planos).map(function(id) {
    const plano = planos[id];

    return `
      <div class="linha">
        <strong>${nomes[id] || id}</strong>
        <span>${escaparHTML(plano.valorLocal || plano.comServico?.valorLocal || '-')}</span>
        <span>${escaparHTML(plano.valorNuvem || plano.comServico?.valorNuvem || '-')}</span>
        <span>${escaparHTML(plano.implantacao || '-')}</span>
      </div>
    `;
  }).join('');
}

/* ==============================
   DATA
============================== */

function preencherDataHoje() {
  const hoje = new Date();
  const dataFormatada = hoje.toISOString().split('T')[0];

  const campo = document.getElementById('dataProposta');

  if (campo) {
    campo.value = dataFormatada;
  }
}

function preencherValidade() {
  const validade = new Date();

  validade.setDate(
    validade.getDate() + 10
  );

  const dataFormatada = validade.toISOString().split('T')[0];

  const campo = document.getElementById('validade');

  if (campo) {
    campo.value = dataFormatada;
  }
}

/* ==============================
   PEGAR VALOR DE CAMPO
============================== */

function pegarValor(id) {
  const campo = document.getElementById(id);

  return campo ? campo.value : '';
}

/* ==============================
   LER LOGO DO CLIENTE
============================== */

function lerLogoCliente(callback) {
  const inputLogo = document.getElementById('logoCliente');

  if (!inputLogo || !inputLogo.files || !inputLogo.files[0]) {
    callback('');
    return;
  }

  const arquivo = inputLogo.files[0];
  const leitor = new FileReader();

  leitor.onload = function(evento) {
    callback(evento.target.result);
  };

  leitor.onerror = function() {
    console.error('Erro ao carregar o logo do cliente.');
    callback('');
  };

  leitor.readAsDataURL(arquivo);
}

/* ==============================
   MONTAR E ABRIR PROPOSTA
============================== */
function obterConsultorAtual() {
  const idSelecionado = pegarValor('consultorSelecionado');

  const consultor =
    vendedores.find(function(vendedor) {
      return String(vendedor.id) === String(idSelecionado);
    }) || {};

  return consultor;
}

function montarDadosFormulario() {
  const planoSelecionado = pegarValor('plano');
  const moduloServico = pegarValor('moduloServico');
  const dadosPlano = planos[planoSelecionado] || {};
  const consultorAtual = obterConsultorAtual();

  const usuariosAdicionais = Number(pegarValor('usuariosAdicionais') || 0);

  const valorUsuario = Number(
    (
      dadosPlano.usuarioAdicional ||
      pegarValor('usuarioAdicional') ||
      '0'
    )
      .replace('R$', '')
      .replace('/mês', '')
      .replace('/mes', '')
      .replace('mês', '')
      .replace('mes', '')
      .replace(/\./g, '')
      .replace(',', '.')
      .trim()
  );

  const totalUsuariosAdicionais = usuariosAdicionais * valorUsuario;

  let escopoFinal = [
    ...(dadosPlano.escopo || [])
  ];

  if (
    moduloServico === 'nao' &&
    Array.isArray(dadosPlano.removerSemServico)
  ) {
    escopoFinal = escopoFinal.filter(function(item) {
      return !dadosPlano.removerSemServico.includes(item);
    });
  }

  const logoSalvaEdicao =
    localStorage.getItem('logoClientePropostaEditada') ||
    propostaEmEdicao?.dados?.logoCliente ||
    propostaEmEdicao?.logoCliente ||
    '';

  return {
    numero: pegarValor('numeroProposta'),
    versao: pegarValor('versaoProposta'),
    empresa: pegarValor('empresa'),
    contato: pegarValor('contato'),
    logoCliente: logoSalvaEdicao,

    fidelidade: pegarValor('fidelidade'),
    participantes: pegarValor('participantes'),
    necessidades: pegarValor('necessidades'),

    plano: planoSelecionado,
    moduloServico: moduloServico,
    modeloOferta: pegarValor('modeloOferta'),

    data: pegarValor('dataProposta'),
    validade: pegarValor('validade'),

    cnpjs: pegarValor('cnpjs'),
    usuarios: pegarValor('usuarios'),
    usuariosAdicionais: usuariosAdicionais,
    valorUsuariosAdicionais: totalUsuariosAdicionais,

    valorLocal: pegarValor('valorLocal'),
    valorNuvem: pegarValor('valorNuvem'),
    implantacao: pegarValor('implantacao'),
    usuarioAdicional: pegarValor('usuarioAdicional'),

    escopo: escopoFinal,
    observacoes: dadosPlano.observacoes || [],
    escopoAutomatico: pegarValor('escopoAutomatico') || 'sim',
    escopoComercial: pegarValor('escopoComercial'),

    consultorNome: consultorAtual.nome || pegarValor('consultorNome'),
    consultorCargo: consultorAtual.cargo || pegarValor('consultorCargo'),
    consultorTelefone: consultorAtual.telefone || pegarValor('consultorTelefone'),
    consultorWhatsApp: consultorAtual.whatsapp || pegarValor('consultorWhatsApp'),
    consultorEmail: consultorAtual.email || pegarValor('consultorEmail'),
    fotoConsultor: consultorAtual.foto || '',

    observacoesComerciais: pegarValor('observacoesComerciais'),

    status:
      propostaEmEdicao?.status ||
      'Rascunho'
  };
}
function montarEAbrirProposta(logoClienteBase64) {
  if (propostaEmEdicao) {
    if (logoClienteBase64) {
      localStorage.setItem(
        'logoClientePropostaEditada',
        logoClienteBase64
      );
    }

    salvarAlteracoesProposta();
    return;
  }

  const dados = montarDadosFormulario();

  dados.logoCliente =
    logoClienteBase64 ||
    localStorage.getItem('logoClientePropostaEditada') ||
    '';

  dados.status = 'Rascunho';

  localStorage.removeItem('logoClientePropostaEditada');
  localStorage.removeItem('fotoConsultorSelecionado');

  console.log('Dados da proposta:', dados);

  localStorage.setItem(
    'dadosPropostaFiscalio',
    JSON.stringify(dados)
  );

  salvarPropostaHistorico(dados).then(function(propostaSalva) {
    if (!propostaSalva) {
      return;
    }

    window.open(
      'proposta.html?id=' + encodeURIComponent(propostaSalva.id),
      '_blank'
    );
  });
}
/* ==============================
   LIMPAR FORMULÁRIO
============================== */
function atualizarModoEdicao() {

  atualizarBotoesSidebar('tab-proposta');

}

function limparFormulario() {
	propostaEmEdicao = null;
  const form = document.getElementById('formProposta');

  if (form) {
    form.reset();
  }

  localStorage.removeItem('logoClientePropostaEditada');

preencherDataHoje();
preencherValidade();
abrirAba('tab-proposta');
preencherConsultorSelecionado();
}

/* ==============================
   ESCAPAR HTML
============================== */

function escaparHTML(valor) {
  return String(valor || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/* ==============================
   EVENTOS
============================== */

function inicializarEventos() {
  const form = document.getElementById('formProposta');

  if (form) {
    form.addEventListener('submit', function(e) {
      e.preventDefault();

      lerLogoCliente(function(logoClienteBase64) {
        montarEAbrirProposta(logoClienteBase64);
      });
    });
  }

  const btnGerarSidebar =
  document.getElementById('btnGerarSidebar');

if (btnGerarSidebar) {
  btnGerarSidebar.addEventListener('click', function(evento) {
    evento.preventDefault();

    const abaAtiva =
      document.querySelector('.app-tab.ativo');

    const tabId =
      abaAtiva ? abaAtiva.id : 'tab-proposta';

    if (tabId === 'tab-proposta') {
      document
        .getElementById('formProposta')
        .requestSubmit();

      return;
    }

    if (tabId === 'tab-vendedores') {
      salvarVendedor();
      return;
    }

    if (tabId === 'tab-valores') {
      salvarPlanoCustomizado();
      return;
    }
    
    if (tabId === 'tab-funcionalidades') {
  salvarFuncionalidades();
  return;
}

if (tabId === 'tab-dfe-master-v2') {
  salvarDfeMasterV2();
  return;
}
    
    
  });
}
  
  
  const btnAdicionarFuncionalidade =
  document.getElementById(
    'btnAdicionarFuncionalidade'
  );

if (btnAdicionarFuncionalidade) {

  btnAdicionarFuncionalidade.addEventListener(
    'click',
    adicionarLinhaFuncionalidade
  );

}

const btnSalvarFuncionalidades =
  document.getElementById(
    'btnSalvarFuncionalidades'
  );

if (btnSalvarFuncionalidades) {

  btnSalvarFuncionalidades.addEventListener(
    'click',
    salvarFuncionalidades
  );

}
  
  
  
  const btnSalvarVendedor =
    document.getElementById('btnSalvarVendedor');

  if (btnSalvarVendedor) {
    btnSalvarVendedor.addEventListener(
      'click',
      salvarVendedor
    );
  }



  const btnLimparDados =
    document.getElementById(
      'btnLimparDados'
    );

  if (btnLimparDados) {
    btnLimparDados.addEventListener(
      'click',
      limparFormulario
    );
  }

  const btnLimparInferior =
    document.getElementById(
      'btnLimparInferior'
    );

if (btnLimparInferior) {
  btnLimparInferior.addEventListener(
    'click',
    function(evento) {
      evento.preventDefault();

      const abaAtiva =
        document.querySelector('.app-tab.ativo');

      const tabId =
        abaAtiva ? abaAtiva.id : 'tab-proposta';

      if (tabId === 'tab-dfe-master-v2') {
  limparFormularioDfeV2();
  return;
}
      
      if (tabId === 'tab-proposta') {
        limparFormulario();
        return;
      }

      if (tabId === 'tab-vendedores') {

        definirValor('cadVendedorNome', '');
        definirValor('cadVendedorCargo', '');
        definirValor('cadVendedorTelefone', '');
        definirValor('cadVendedorWhatsApp', '');
        definirValor('cadVendedorEmail', '');

        const campoNome =
          document.getElementById('cadVendedorNome');

        if (campoNome) {
          delete campoNome.dataset.editandoId;
        }

        const foto =
          document.getElementById('cadVendedorFoto');

        if (foto) {
          foto.value = '';
        }

        const previewFoto =
          document.getElementById('previewVendedorFoto');

        const previewBox =
          document.getElementById('previewVendedor');

        if (previewFoto) {
          previewFoto.removeAttribute('src');
        }

        if (previewBox) {
          previewBox.classList.remove('com-foto');
        }

        return;
      }

      if (tabId === 'tab-valores') {
        definirValor('cadValorLocal', '');
        definirValor('cadValorNuvem', '');
        definirValor('cadImplantacao', '');
        definirValor('cadUsuariosInclusos', '');
        definirValor('cadUsuarioAdicional', '');
        definirValor('cadObservacoesPlano', '');
      }
    }
  );
}
}
/* ==============================
   INICIALIZAÇÃO
============================== */

inicializarAbas();
inicializarEventosPlano();
inicializarEventos();
carregarVendedores();
carregarPlanos();
renderizarPropostasSalvas();
preencherDataHoje();
preencherValidade();
carregarPropostasServidor();
carregarFuncionalidades();
abrirAba('tab-proposta');

/* ==============================
   FILTRO DE PROPOSTAS
============================== */

const campoFiltro =
  document.getElementById(
    'filtroPropostas'
  );

if (campoFiltro) {
  campoFiltro.addEventListener(
    'input',
    function() {
      filtroPropostas = this.value;
      renderizarPropostasSalvas();
    }
  );
}
const campoFiltroPlano =
  document.getElementById('filtroPlano');

if (campoFiltroPlano) {
  campoFiltroPlano.addEventListener('change', function() {
    const campoPesquisa =
      document.getElementById('filtroPropostas');

    filtroPropostas = this.value;

    if (campoPesquisa) {
      campoPesquisa.value = this.value;
    }

    renderizarPropostasSalvas();
  });
}
const campoFiltroStatus =
  document.getElementById('filtroStatus');

if (campoFiltroStatus) {
  campoFiltroStatus.innerHTML = `
    <option value="">Status</option>
    <option value="Rascunho">Rascunho</option>
    <option value="Enviada">Enviada</option>
    <option value="Negociação">Negociação</option>
    <option value="Fechada">Fechada</option>
    <option value="Perdida">Perdida</option>
  `;

  campoFiltroStatus.addEventListener('change', function() {
    const campoPesquisa =
      document.getElementById('filtroPropostas');

    filtroPropostas = this.value;

    if (campoPesquisa) {
      campoPesquisa.value = this.value;
    }

    renderizarPropostasSalvas();
  });
}
const campoFiltroVendedor =
  document.getElementById('filtroVendedor');

if (campoFiltroVendedor) {

  campoFiltroVendedor.innerHTML = `
    <option value="">Vendedor</option>
    <option value="Adriner Ferreira">
      Adriner Ferreira
    </option>
    <option value="Natalia Alves">
      Natalia Alves
    </option>
  `;

  campoFiltroVendedor.addEventListener(
    'change',
    function() {

      const campoPesquisa =
        document.getElementById(
          'filtroPropostas'
        );

      filtroPropostas = this.value;

      if (campoPesquisa) {
        campoPesquisa.value = this.value;
      }

      renderizarPropostasSalvas();

    }
  );

}


const btnLimparFiltros =
  document.getElementById(
    'btnLimparFiltros'
  );

if (btnLimparFiltros) {

  btnLimparFiltros.addEventListener(
    'click',
    function() {

      const campoPesquisa =
        document.getElementById(
          'filtroPropostas'
        );

      const campoPlano =
        document.getElementById(
          'filtroPlano'
        );

      const campoStatus =
        document.getElementById(
          'filtroStatus'
        );

      const campoVendedor =
        document.getElementById(
          'filtroVendedor'
        );

      filtroPropostas = '';

      if (campoPesquisa) {
        campoPesquisa.value = '';
      }

      if (campoPlano) {
        campoPlano.selectedIndex = 0;
      }

      if (campoStatus) {
        campoStatus.selectedIndex = 0;
      }

      if (campoVendedor) {
        campoVendedor.selectedIndex = 0;
      }

      renderizarPropostasSalvas();

    }
  );

}

const campoFiltroMes =
  document.getElementById(
    'filtroMes'
  );

if (campoFiltroMes) {

  campoFiltroMes.innerHTML = `
    <option value="">Mês</option>
    <option value="-01-">Janeiro</option>
    <option value="-02-">Fevereiro</option>
    <option value="-03-">Março</option>
    <option value="-04-">Abril</option>
    <option value="-05-">Maio</option>
    <option value="-06-">Junho</option>
    <option value="-07-">Julho</option>
    <option value="-08-">Agosto</option>
    <option value="-09-">Setembro</option>
    <option value="-10-">Outubro</option>
    <option value="-11-">Novembro</option>
    <option value="-12-">Dezembro</option>
  `;

  campoFiltroMes.addEventListener(
    'change',
    function() {

      const campoPesquisa =
        document.getElementById(
          'filtroPropostas'
        );

      filtroPropostas = this.value;

      if (campoPesquisa) {
        campoPesquisa.value = this.value;
      }

      renderizarPropostasSalvas();

    }
  );

}

const campoFiltroAno =
  document.getElementById(
    'filtroAno'
  );

if (campoFiltroAno) {

  campoFiltroAno.innerHTML = `
    <option value="">Ano</option>
    <option value="2024">2024</option>
    <option value="2025">2025</option>
    <option value="2026">2026</option>
    <option value="2027">2027</option>
    <option value="2028">2028</option>
  `;

  campoFiltroAno.addEventListener(
    'change',
    function() {

      const campoPesquisa =
        document.getElementById(
          'filtroPropostas'
        );

      filtroPropostas = this.value;

      if (campoPesquisa) {
        campoPesquisa.value = this.value;
      }

      renderizarPropostasSalvas();

    }
  );

}

async function carregarFuncionalidades() {

  try {

    const resposta =
      await fetch(
        './data/funcionalidades.json?v=' +
        Date.now()
      );

    funcionalidades =
      await resposta.json();

    if (!Array.isArray(funcionalidades)) {
      funcionalidades = [];
    }

  } catch (erro) {

    console.error(
      'Erro ao carregar funcionalidades:',
      erro
    );

    funcionalidades = [];

  }

  funcionalidades =
    funcionalidades.map(function(item, indice) {

      return {
        nome: item.nome || '',
        categoria: item.categoria || 'downloads',
        ordem: item.ordem || indice + 1,

        basico: item.basico === true,
        basicoInvestimento: item.basicoInvestimento === true,

        avancado: item.avancado === true,
        avancadoInvestimento: item.avancadoInvestimento === true,

        enterprise: item.enterprise === true,
        enterpriseInvestimento: item.enterpriseInvestimento === true
      };

    });

  while (funcionalidades.length < 10) {

    funcionalidades.push({
      nome: '',
      categoria: 'downloads',
      ordem: funcionalidades.length + 1,

      basico: false,
      basicoInvestimento: false,

      avancado: false,
      avancadoInvestimento: false,

      enterprise: false,
      enterpriseInvestimento: false
    });

  }

  renderizarFuncionalidades();

}
function montarOptionsCategoria(categoriaAtual) {

  const categorias = [
    'downloads',
    'manifestacao',
    'filtros',
    'visualizacao',
    'relatorios',
    'sped',
    'integracao',
    'infraestrutura',
    'monitoramento',
    'armazenamento',
    'exportacao',
    'servicos'
  ];

  return categorias.map(function(categoria) {

    return `
      <option
        value="${escaparHTML(categoria)}"
        ${categoria === categoriaAtual ? 'selected' : ''}>
        ${escaparHTML(categoria)}
      </option>
    `;

  }).join('');

}

function renderizarFuncionalidades() {

  const tbody =
    document.getElementById('listaFuncionalidades');

  if (!tbody) {
    return;
  }

  funcionalidades.sort(function(a, b) {
    return Number(a.ordem || 9999) - Number(b.ordem || 9999);
  });

  tbody.innerHTML =
    funcionalidades.map(function(item, indice) {

      return `
        <tr>

          <td>
            <input
              type="number"
              class="func-ordem"
              data-index="${indice}"
              value="${escaparHTML(item.ordem || indice + 1)}">
          </td>

          <td>
            <input
              type="text"
              class="func-nome"
              data-index="${indice}"
              value="${escaparHTML(item.nome || '')}">
          </td>

          <td>
            <select
              class="func-categoria"
              data-index="${indice}">
              ${montarOptionsCategoria(item.categoria || '')}
            </select>
          </td>

          <td>
            <input
              type="checkbox"
              class="func-basico"
              data-index="${indice}"
              ${item.basico ? 'checked' : ''}>
          </td>

          <td>
            <input
              type="checkbox"
              class="func-basico-investimento"
              data-index="${indice}"
              ${item.basicoInvestimento ? 'checked' : ''}>
          </td>

          <td>
            <input
              type="checkbox"
              class="func-avancado"
              data-index="${indice}"
              ${item.avancado ? 'checked' : ''}>
          </td>

          <td>
            <input
              type="checkbox"
              class="func-avancado-investimento"
              data-index="${indice}"
              ${item.avancadoInvestimento ? 'checked' : ''}>
          </td>

          <td>
            <input
              type="checkbox"
              class="func-enterprise"
              data-index="${indice}"
              ${item.enterprise ? 'checked' : ''}>
          </td>

          <td>
            <input
              type="checkbox"
              class="func-enterprise-investimento"
              data-index="${indice}"
              ${item.enterpriseInvestimento ? 'checked' : ''}>
          </td>

        </tr>
      `;

    }).join('');

}

function adicionarLinhaFuncionalidade() {

  funcionalidades.push({
    nome: '',
    basico: false,
    avancado: false,
    enterprise: false
  });

  renderizarFuncionalidades();

}

async function salvarFuncionalidades() {

  const linhas =
    document.querySelectorAll('#listaFuncionalidades tr');

  const lista = [];

  linhas.forEach(function(linha, indice) {

    const nome =
      linha.querySelector('.func-nome')?.value?.trim();

    if (!nome) {
      return;
    }

    const ordem =
      Number(linha.querySelector('.func-ordem')?.value || indice + 1);

    lista.push({
      nome: nome,

      categoria:
        linha.querySelector('.func-categoria')?.value || 'downloads',

      ordem:
        Number.isFinite(ordem)
          ? ordem
          : indice + 1,

      basico:
        linha.querySelector('.func-basico')?.checked || false,

      basicoInvestimento:
        linha.querySelector('.func-basico-investimento')?.checked || false,

      avancado:
        linha.querySelector('.func-avancado')?.checked || false,

      avancadoInvestimento:
        linha.querySelector('.func-avancado-investimento')?.checked || false,

      enterprise:
        linha.querySelector('.func-enterprise')?.checked || false,

      enterpriseInvestimento:
        linha.querySelector('.func-enterprise-investimento')?.checked || false
    });

  });

  lista.sort(function(a, b) {
    return Number(a.ordem || 9999) - Number(b.ordem || 9999);
  });

  try {

    const resposta =
      await fetch('api/salvar-funcionalidades.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(lista)
      });

    const retorno =
      await resposta.json();

    if (!retorno.success) {
      alert(retorno.message || 'Erro ao salvar funcionalidades.');
      return;
    }

    funcionalidades = lista;

    alert('Funcionalidades salvas com sucesso.');

    renderizarFuncionalidades();

  } catch (erro) {

    console.error(erro);

    alert('Erro ao salvar funcionalidades.');

  }

}
async function carregarFuncionalidadesProposta() {
  try {
    const resposta = await fetch('./data/funcionalidades.json?v=' + Date.now());
    const lista = await resposta.json();

    return Array.isArray(lista) ? lista : [];
  } catch (erro) {
    console.error('Erro ao carregar funcionalidades da proposta:', erro);
    return [];
  }
}

function obterFuncionalidadesDoPlano(lista, plano) {
  const campoInvestimento = {
    basico: 'basicoInvestimento',
    avancado: 'avancadoInvestimento',
    enterprise: 'enterpriseInvestimento'
  }[plano] || 'enterpriseInvestimento';

  return lista.filter(function(item) {
    return (
      item &&
      item.nome &&
      item[plano] === true &&
      item[campoInvestimento] === true
    );
  });
}

function gerarEscopoInvestimentoPorFuncionalidades(dados, funcionalidadesPlano) {
  const itens = [];

  const plano =
    String(dados.plano || '')
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace('plano ', '')
      .replace(/\s+/g, '');

  const mapaInvestimento = {
    basico: 'basicoInvestimento',
    avancado: 'avancadoInvestimento',
    enterprise: 'enterpriseInvestimento'
  };

  const campoInvestimento =
    mapaInvestimento[plano] || 'enterpriseInvestimento';

  const planoNome =
    formatarNomePlano(dados.plano || '');

  itens.push('<p><strong>' + planoNome + ':</strong></p>');

  if (dados.cnpjs) {
    itens.push('<p>› Monitoramento de até ' + escaparHTML(dados.cnpjs) + ' CNPJs/CPFs</p>');
  }

  if (dados.usuarios) {
    itens.push('<p>› Licença para ' + escaparHTML(dados.usuarios) + ' usuário(s)</p>');
  }

  if (dados.usuariosAdicionais && Number(dados.usuariosAdicionais) > 0) {
    itens.push('<p>› ' + escaparHTML(dados.usuariosAdicionais) + ' usuário(s) adicional(is)</p>');
  }

  funcionalidadesPlano
    .filter(function(item) {
      return item && item.nome && item[campoInvestimento] === true;
    })
    .forEach(function(item) {
      itens.push('<p>› ' + escaparHTML(item.nome) + '</p>');
    });

  if (dados.escopoComercial) {
    String(dados.escopoComercial)
      .split('\n')
      .map(linha => linha.trim())
      .filter(Boolean)
      .forEach(function(linha) {
        itens.push('<p>› ' + escaparHTML(linha) + '</p>');
      });
  }

  return itens.join('');
}