function formatarDataBR(dataISO) {

  if (!dataISO) {
    return '';
  }

  const partes =
    dataISO.split('-');

  if (partes.length !== 3) {
    return dataISO;
  }

  return `${partes[2]}/${partes[1]}/${partes[0]}`;

}

function normalizarPlano(plano) {

  const nomes = {
    basico: 'Básico',
    avancado: 'Avançado',
    enterprise: 'Enterprise'
  };

  return nomes[plano] || plano || '';

}

function escaparHTML(texto) {

  return String(texto || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');

}

function transformarTextoEmLista(texto) {

  if (!texto) {
    return [];
  }

  return String(texto)
    .split(/\n|;/)
    .map(function(item) {
      return item.trim();
    })
    .filter(function(item) {
      return item.length > 0;
    });

}

function obterTextoSolucao(dados) {

  const textos = {

    basico:
      'Com o Fiscal.io Monitor Básico, a empresa passa a contar com uma rotina mais segura para monitoramento, captura e organização dos documentos fiscais eletrônicos. A solução reduz atividades manuais, melhora o controle dos XMLs e apoia a conformidade fiscal no dia a dia.',

    avancado:
      'Com o Fiscal.io Monitor Avançado, a empresa amplia o controle fiscal com monitoramento de documentos eletrônicos, relatórios estratégicos e auditoria de arquivos EFD/SPED Fiscal. A solução contribui para reduzir retrabalho operacional, aumentar a rastreabilidade e melhorar os processos de conferência fiscal.',

    enterprise:
      'Com o Fiscal.io Monitor Enterprise, a empresa passa a contar com uma solução completa para monitoramento, captura, auditoria e integração dos documentos fiscais eletrônicos. O plano foi desenvolvido para operações que exigem maior controle, rastreabilidade, automação e conformidade fiscal em ambientes mais complexos.'

  };

  let texto =
    textos[dados.plano] || textos.basico;

  if (dados.moduloServico === 'nao') {

    texto =
      texto
        .replace('documentos fiscais eletrônicos', 'documentos fiscais eletrônicos, sem contemplar o módulo de Serviço / NFSe')
        .replace('monitoramento, captura, auditoria e integração dos documentos fiscais eletrônicos', 'monitoramento, captura, auditoria e integração dos documentos fiscais eletrônicos, sem contemplar o módulo de Serviço / NFSe');

  }

  return texto;

}

function renderizarLogoCliente(dados) {

  renderizarFotoConsultor(dados);
  
  const logoClienteTexto =
    document.getElementById('logoClienteTexto');

  const logoClienteImagem =
    document.getElementById('logoClienteImagem');

  if (
    logoClienteImagem &&
    dados.logoCliente
  ) {

    logoClienteImagem.src =
      dados.logoCliente;

    logoClienteImagem.style.display =
      'block';

    if (logoClienteTexto) {
      logoClienteTexto.style.display =
        'none';
    }

    return;

  }

  if (logoClienteTexto) {

    logoClienteTexto.textContent =
      dados.empresa || 'CLIENTE';

    logoClienteTexto.style.display =
      'block';

  }

  if (logoClienteImagem) {

    logoClienteImagem.removeAttribute('src');

    logoClienteImagem.style.display =
      'none';

  }

}

async function carregarFuncionalidades() {

  try {

    const resposta =
      await fetch('./data/funcionalidades.json?v=' + Date.now());

    if (!resposta.ok) {
      throw new Error('Não foi possível carregar funcionalidades.json');
    }

    return await resposta.json();

  } catch (erro) {

    console.error(
      'Erro ao carregar funcionalidades:',
      erro
    );

    return {};

  }

}

function obterListaFuncionalidades(funcionalidades, plano) {

  if (!Array.isArray(funcionalidades)) {
    return [];
  }

  return funcionalidades
    .filter(function(item) {
      return (
        item &&
        item.nome &&
        item[plano] === true
      );
    })
    .map(function(item) {
      return {
        nome: item.nome,
        valor: '✓'
      };
    });

}

function normalizarFuncionalidade(item) {

  if (typeof item === 'string') {

    return {
      nome: item,
      valor: '✓'
    };

  }

  return {
    nome:
      item.nome ||
      item.funcionalidade ||
      item.descricao ||
      item.recurso ||
      '',

    valor:
      item.valor ||
      item.status ||
      item.disponivel ||
      item.plano ||
      ''
  };

}

function classeValorFuncionalidade(valor) {

  const texto =
    String(valor || '').trim().toLowerCase();

  if (
    texto === '-' ||
    texto === 'não' ||
    texto === 'nao' ||
    texto === 'não incluso' ||
    texto === 'nao incluso'
  ) {
    return 'negativo';
  }

  if (
    texto === '✓' ||
    texto === '✔' ||
    texto === 'sim' ||
    texto === 'incluso'
  ) {
    return 'ok';
  }

  return 'texto';

}

function dividirEmColunas(lista, quantidadeColunas) {

  const colunas = [];
  const total = lista.length;
  const porColuna =
    Math.ceil(total / quantidadeColunas);

  for (let i = 0; i < quantidadeColunas; i++) {

    colunas.push(
      lista.slice(
        i * porColuna,
        (i + 1) * porColuna
      )
    );

  }

  return colunas;

}

function renderizarFuncionalidades(dados, funcionalidades) {

  const gridParte1 =
    document.getElementById('funcionalidades-parte-1');

  const gridParte2 =
    document.getElementById('funcionalidades-parte-2');

  if (!gridParte1 && !gridParte2) {
    return;
  }

  const lista =
    obterListaFuncionalidades(funcionalidades, dados.plano)
      .map(normalizarFuncionalidade)
      .filter(function(item) {
        return item.nome;
      });

  const planoNome =
    dados.planoNome || normalizarPlano(dados.plano);

  const titulo1 =
    document.getElementById('func-plano-nome-1');

  const titulo2 =
    document.getElementById('func-plano-nome-2');

  if (titulo1) titulo1.textContent = planoNome;
  if (titulo2) titulo2.textContent = planoNome;

  function montarLinhas(itens) {
    return itens
      .map(function(item) {
        return `
          <div class="func-linha">
            <span class="func-texto">
              ${escaparHTML(item.nome)}
            </span>
            <span class="func-check">✓</span>
          </div>
        `;
      })
      .join('');
  }

  if (!lista.length) {
    if (gridParte1) {
      gridParte1.innerHTML = `
        <div class="func-linha">
          <span class="func-texto">
            Nenhuma funcionalidade cadastrada para este plano.
          </span>
          <span class="func-check">-</span>
        </div>
      `;
    }

    if (gridParte2) {
      gridParte2.innerHTML = '';
    }

    return;
  }

  const limitePagina1 = 24;

  const parte1 =
    lista.slice(0, limitePagina1);

  const parte2 =
    lista.slice(limitePagina1);

  if (gridParte1) {
    gridParte1.innerHTML = montarLinhas(parte1);
  }

  if (gridParte2) {
    gridParte2.innerHTML = montarLinhas(parte2);
  }

}

function renderizarDiagnostico(dados) {

  const participantes =
    document.getElementById('participantesProposta');

  if (participantes) {

    const listaParticipantes =
      transformarTextoEmLista(dados.participantes);

    if (listaParticipantes.length) {

      participantes.innerHTML =
        listaParticipantes
          .map(function(item) {
            return `<div>${escaparHTML(item)}</div>`;
          })
          .join('');

    } else {

      participantes.innerHTML =
        `<div>${escaparHTML(dados.contato || 'Contato informado na proposta')}</div>`;

    }

  }

  const necessidades =
    document.getElementById('necessidadesProposta');

  if (necessidades) {

    const listaNecessidades =
      transformarTextoEmLista(dados.necessidades);

    if (listaNecessidades.length) {

      necessidades.innerHTML =
        listaNecessidades
          .map(function(item) {
            return `<div>${escaparHTML(item)}</div>`;
          })
          .join('');

    } else {

      necessidades.innerHTML =
        [
          'Necessidade de automatizar o monitoramento e download de documentos fiscais eletrônicos.',
          'Redução de atividades manuais na conferência e organização dos XMLs.',
          'Centralização das informações fiscais em uma plataforma única.',
          'Maior segurança no armazenamento e rastreabilidade dos documentos fiscais.'
        ]
          .map(function(item) {
            return `<div>${escaparHTML(item)}</div>`;
          })
          .join('');

    }

  }

  const textoSolucao =
    document.getElementById('textoSolucao');

  if (textoSolucao) {

    textoSolucao.textContent =
      obterTextoSolucao(dados);

  }

}

function preencherRodapesSlides(dados) {

  const textoProposta =
    `Proposta | ${dados.numero || ''} - ${dados.empresa || ''} - ${dados.planoNome || ''}`;

  document
    .querySelectorAll('.rodape-slide')
    .forEach(function(rodape) {

      rodape.innerHTML = `
        <span>${escaparHTML(textoProposta)}</span>
        <span>Fiscal.io Tecnologia da Informação Ltda. - CNPJ: 30.913.324/0001-81</span>
      `;

    });

}

async function renderizarInvestimento(dados) {

  const listaEscopo =
    document.getElementById('listaEscopo');

  if (listaEscopo) {

    const listaFuncionalidades =
      await carregarFuncionalidadesProposta();

    const funcionalidadesPlano =
      obterFuncionalidadesDoPlano(
        listaFuncionalidades,
        dados.plano
      );

    const htmlEscopo =
      gerarEscopoInvestimentoPorFuncionalidades(
        dados,
        funcionalidadesPlano
      );

    listaEscopo.innerHTML =
      htmlEscopo
        .replaceAll('<p>', '<li>')
        .replaceAll('</p>', '</li>');

  }

  const listaPremissas =
    document.getElementById('listaPremissas');

  if (listaPremissas) {

    listaPremissas.innerHTML = `
      <li>
        Para um correto funcionamento do sistema é necessário que o Fiscal.io Monitor seja a ferramenta principal de consultas para evitar o erro de "consumo indevido" retornado pelo Ambiente Nacional.
      </li>

      <li>
        É premissa a concessão de acesso remoto à Fiscal.io para que o serviço de instalação e/ou suporte técnico seja possível dentro dos padrões normais de atendimento.
      </li>
    `;

  }

  const listaObservacoes =
    document.getElementById('listaObservacoes');

  if (listaObservacoes) {

    listaObservacoes.innerHTML = `
      <li>Faturamento da instalação e da primeira parcela da assinatura no aceite desta proposta;</li>
      <li>Vencimento das faturas em 5 dias;</li>
      <li>O valor da assinatura mensal será reajustado anualmente aplicando-se o índice IPCA acumulado referente ao período de uso do software;</li>
      <li>A modalidade de comercialização é pelo uso do software e não pela aquisição de licenças (SaaS – Software as a Service);</li>
      <li>Pagamentos mensais recorrentes enquanto não houver cancelamento do serviço;</li>
      <li>A interrupção dos pagamentos implica na desativação de funcionalidades do sistema;</li>
      <li>
        Contrato de ${escaparHTML(dados.fidelidade || '12 meses')}. Após esse período as partes podem rescindir o contrato sem nenhum ônus desde que o interessado manifeste sua decisão por escrito com 60 dias de antecedência;
      </li>
      <li>Após o vencimento do boleto serão cobrados juros de 1% ao mês com acréscimo de multa de 5%;</li>
      <li>O serviço de suporte técnico não contempla casos de reinstalação do sistema. Em caso de necessidade o serviço será orçado como avulso.</li>
    `;

  }

  const bloco =
    document.getElementById('blocoInvestimento');

  if (!bloco) {
    return;
  }

  const usuariosAdicionais =
    Number(dados.usuariosAdicionais || 0);

  const valorUsuariosAdicionais =
    Number(dados.valorUsuariosAdicionais || 0);

  const valorUsuariosFormatado =
    valorUsuariosAdicionais.toLocaleString(
      'pt-BR',
      {
        style: 'currency',
        currency: 'BRL'
      }
    );

  const moduloServicoTexto =
    dados.moduloServico === 'nao'
      ? 'Não incluso'
      : 'Incluso';

  const valorLocalFinal =
    dados.valorLocal ||
    dados.valorNuvem ||
    '-';

  const valorNuvemFinal =
    dados.valorNuvem ||
    dados.valorLocal ||
    '-';

  const mostrarLocal =
    dados.modeloOferta !== 'nuvem';

  const mostrarNuvem =
    dados.modeloOferta !== 'local';

  let html = `
    <div class="plano-card">

      <h2>
        Plano ${escaparHTML(dados.planoNome || '')}
      </h2>

      ${
        mostrarLocal
          ? `
            <div class="linha-plano linha-destaque">
              <span>Versão Local</span>
              <strong>${escaparHTML(valorLocalFinal)}</strong>
            </div>
          `
          : ''
      }

      ${
        mostrarNuvem
          ? `
            <div class="linha-plano linha-destaque">
              <span>Versão Nuvem</span>
              <strong>${escaparHTML(valorNuvemFinal)}</strong>
            </div>
          `
          : ''
      }

      <div class="linha-plano">
        <span>CNPJs monitorados</span>
        <strong>${escaparHTML(dados.cnpjs || '-')}</strong>
      </div>

      <div class="linha-plano">
        <span>Usuários inclusos</span>
        <strong>${escaparHTML(dados.usuarios || '-')}</strong>
      </div>

      <div class="linha-plano">
        <span>Usuários adicionais</span>
        <strong>${usuariosAdicionais}</strong>
      </div>

      <div class="linha-plano">
        <span>Valor usuários adicionais</span>
        <strong>${escaparHTML(valorUsuariosFormatado)}</strong>
      </div>

      <div class="linha-plano">
        <span>Módulo Serviço / NFSe</span>
        <strong>${escaparHTML(moduloServicoTexto)}</strong>
      </div>

      <div class="linha-plano">
        <span>Implantação</span>
        <strong>${escaparHTML(dados.implantacao || '-')}</strong>
      </div>

      <div class="linha-plano">
        <span>Usuário adicional</span>
        <strong>${escaparHTML(dados.usuarioAdicional || '-')}</strong>
      </div>

      <div class="linha-plano">
        <span>Validade</span>
        <strong>${escaparHTML(dados.validadeFormatada || '-')}</strong>
      </div>

    </div>
  `;

  bloco.innerHTML = html;

}



function filtrarPaginasPorPlano(dados) {

  document
    .querySelectorAll('[data-planos]')
    .forEach(function(pagina) {

      const planosPermitidos =
        pagina
          .getAttribute('data-planos')
          .split(' ');

      if (!planosPermitidos.includes(dados.plano)) {
        pagina.remove();
      }

    });

}

/* ==============================
   CARREGAR DADOS DA PROPOSTA
============================== */

async function carregarDadosProposta() {

  const parametros =
    new URLSearchParams(
      window.location.search
    );

  const idProposta =
    parametros.get('id');

  const dadosURL =
    parametros.get('dados');

  let dados = null;

  if (idProposta) {

    try {

      const resposta =
        await fetch(
          'api/carregar-proposta.php?id=' +
          encodeURIComponent(idProposta)
        );

      const proposta =
        await resposta.json();

      if (!resposta.ok) {
        throw new Error(
          proposta.message ||
          'Proposta não encontrada.'
        );
      }

      dados =
        proposta.dados || proposta;

    } catch (erro) {

      console.error(
        'Erro ao carregar proposta do servidor:',
        erro
      );

      alert(
        'Não foi possível carregar os dados da proposta no servidor.'
      );

      return;
    }

  }

  if (!dados && dadosURL) {

    try {

      dados =
        JSON.parse(
          decodeURIComponent(dadosURL)
        );

    } catch (erro) {

      console.error(
        'Erro ao ler dados da URL:',
        erro
      );

    }

  }

  if (!dados) {

    const dadosSalvos =
      localStorage.getItem(
        'dadosPropostaFiscalio'
      );

    if (dadosSalvos) {
      dados = JSON.parse(dadosSalvos);
    }

  }

  if (!dados) {

    alert(
      'Nenhum dado de proposta encontrado. Volte para o formulário.'
    );

    return;
  }

  preencherCampos(dados);

}

carregarDadosProposta();

function renderizarFotoConsultor(dados) {

  const fotoConsultor =
    document.getElementById('fotoConsultor');

  if (!fotoConsultor) {
    return;
  }

  const caminhoFoto =
    dados.fotoConsultor ||
    localStorage.getItem('fotoConsultorSelecionado') ||
    '';

  if (caminhoFoto) {

    fotoConsultor.src =
      caminhoFoto;

    fotoConsultor.alt =
      dados.consultorNome || 'Consultor';

    fotoConsultor.style.display =
      'block';

  } else {

    fotoConsultor.removeAttribute('src');

    fotoConsultor.style.display =
      'none';

  }

}

async function carregarFuncionalidadesProposta() {
  return carregarFuncionalidades();
}

function obterFuncionalidadesDoPlano(lista, plano) {
  return lista.filter(function(item) {
    return (
      item &&
      item.nome &&
      item[plano] === true &&
      item.escopoInvestimento !== false
    );
  });
}

function gerarEscopoInvestimentoPorFuncionalidades(dados, funcionalidadesPlano) {
  const itens = [];

  const planoNome =
    dados.planoNome ||
    normalizarPlano(dados.plano || '');

  itens.push('<p><strong>' + escaparHTML(planoNome) + ':</strong></p>');

  if (dados.cnpjs) {
    itens.push('<p>› Monitoramento de até ' + escaparHTML(dados.cnpjs) + ' CNPJs/CPFs</p>');
  }

  if (dados.usuarios) {
    itens.push('<p>› Licença para ' + escaparHTML(dados.usuarios) + ' usuário(s)</p>');
  }

  if (dados.usuariosAdicionais && Number(dados.usuariosAdicionais) > 0) {
    itens.push('<p>› ' + escaparHTML(dados.usuariosAdicionais) + ' usuário(s) adicional(is)</p>');
  }

  funcionalidadesPlano.forEach(function(item) {
    itens.push('<p>› ' + escaparHTML(item.nome) + '</p>');
  });

  if (dados.escopoComercial) {
    String(dados.escopoComercial)
      .split('\n')
      .map(function(linha) {
        return linha.trim();
      })
      .filter(Boolean)
      .forEach(function(linha) {
        itens.push('<p>› ' + escaparHTML(linha) + '</p>');
      });
  }

  return itens.join('');
}