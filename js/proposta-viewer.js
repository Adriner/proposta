/* =========================================================
   PROPOSTA VIEWER - FISCAL.IO
========================================================= */

let funcionalidadesSistema = [];

document.addEventListener('DOMContentLoaded', function () {
  carregarDadosPropostaViewer();
});

async function carregarDadosPropostaViewer() {
  const parametros = new URLSearchParams(window.location.search);
  const idProposta = parametros.get('id');

  if (!idProposta) {
    alert('ID da proposta não informado.');
    return;
  }

  try {
    const resposta = await fetch(
      'api/carregar-proposta.php?id=' + encodeURIComponent(idProposta) + '&v=' + Date.now()
    );

    if (!resposta.ok) {
      throw new Error('Erro ao carregar proposta.');
    }

    const retorno = await resposta.json();

    if (retorno.success === false) {
      throw new Error(retorno.message || 'Proposta não encontrada.');
    }

    const dados =
      retorno.dados ||
      retorno.proposta ||
      retorno.data ||
      retorno;

    await atualizarConsultorPeloCadastro(dados);

    window.__dados = dados;

    await carregarFuncionalidadesSistema();

    preencherCamposBasicos(dados);
    preencherPlano(dados);
    preencherLogoCliente(dados);
    preencherFuncionalidades(dados);
    preencherInvestimento(dados);
    preencherConsultor(dados);

  } catch (erro) {
    console.error(erro);
    alert('Não foi possível carregar os dados da proposta.');
  }
}

/* =========================================================
   ATUALIZAR CONSULTOR PELO CADASTRO ATUAL
========================================================= */

async function atualizarConsultorPeloCadastro(dados) {
  try {
    const resposta = await fetch(
      'api/listar-vendedores.php?v=' + Date.now()
    );

    if (!resposta.ok) {
      return dados;
    }

    const vendedores = await resposta.json();

    if (!Array.isArray(vendedores)) {
      return dados;
    }

    const nomeConsultor = String(dados.consultorNome || '')
      .trim()
      .toLowerCase();

    if (!nomeConsultor) {
      return dados;
    }

    const vendedorAtual = vendedores.find(function(vendedor) {
      return String(vendedor.nome || '')
        .trim()
        .toLowerCase() === nomeConsultor;
    });

    if (!vendedorAtual) {
      return dados;
    }

    dados.consultorNome = vendedorAtual.nome || dados.consultorNome || '';
    dados.consultorCargo = vendedorAtual.cargo || dados.consultorCargo || '';
    dados.consultorTelefone = vendedorAtual.telefone || dados.consultorTelefone || '';
    dados.consultorWhatsApp = vendedorAtual.whatsapp || dados.consultorWhatsApp || '';
    dados.consultorEmail = vendedorAtual.email || dados.consultorEmail || '';
    dados.fotoConsultor = vendedorAtual.foto || dados.fotoConsultor || '';

    return dados;

  } catch (erro) {
    console.error('Erro ao atualizar consultor pelo cadastro:', erro);
    return dados;
  }
}

/* =========================================================
   FUNCIONALIDADES JSON
========================================================= */

async function carregarFuncionalidadesSistema() {
  try {
    const resposta = await fetch(
      'data/funcionalidades.json?v=' + Date.now()
    );

    if (!resposta.ok) {
      throw new Error('Erro ao carregar funcionalidades.');
    }

    funcionalidadesSistema = await resposta.json();

    if (!Array.isArray(funcionalidadesSistema)) {
      funcionalidadesSistema = [];
    }

  } catch (erro) {
    console.error('Erro ao carregar funcionalidades:', erro);
    funcionalidadesSistema = [];
  }
}

/* =========================================================
   CAMPOS BÁSICOS
========================================================= */

function preencherCamposBasicos(dados) {
  document.querySelectorAll('[data-campo]').forEach(function (el) {
    const campo = el.getAttribute('data-campo');

    if (
      campo === 'consultorNome' ||
      campo === 'consultorCargo' ||
      campo === 'consultorEmail' ||
      campo === 'consultorTelefone' ||
      campo === 'consultorWhatsapp' ||
      campo === 'consultorWhatsApp'
    ) {
      return;
    }

    let valor = '';

    if (campo === 'dataFormatada') {
      valor = formatarData(dados.data);
    } else {
      valor = dados[campo] || '';
    }

    el.textContent = valor;
  });
}

/* =========================================================
   PLANO
========================================================= */

function preencherPlano(dados) {
  const nomePlano = obterNomePlano(dados);

  preencherTextoPorId(
    'capa-plano',
    'Fiscal.io Monitor | ' + nomePlano
  );

  preencherTextoPorId('func-plano-nome-1', nomePlano);
  preencherTextoPorId('func-plano-nome-2', nomePlano);
}

function obterNomePlano(dados) {
  const valorPlano = obterValorPlano(dados);
  const chave = obterChavePlano(valorPlano);

  const planos = {
    basico: 'Plano Básico',
    avancado: 'Plano Avançado',
    enterprise: 'Plano Enterprise'
  };

  return planos[chave] || valorPlano || 'Plano Básico';
}

function obterValorPlano(dados) {
  return (
    dados.plano ||
    dados.plano_nome ||
    dados.nomePlano ||
    dados.nome_plano ||
    dados.planoSelecionado ||
    dados.tipoPlano ||
    dados.tipo_plano ||
    ''
  );
}

function obterChavePlano(valor) {
  return String(valor || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace('plano ', '')
    .replace(/\s+/g, '');
}

/* =========================================================
   FUNCIONALIDADES DINÂMICAS
========================================================= */

function preencherFuncionalidades(dados) {
  const plano = obterChavePlano(obterValorPlano(dados));

  const funcionalidadesPlano = funcionalidadesSistema
    .filter(function(item) {
      return item && item.nome && item[plano] === true;
    })
    .sort(function(a, b) {
      return Number(a.ordem || 9999) - Number(b.ordem || 9999);
    });

  const gridParte1 = document.getElementById('funcionalidades-parte-1');
  const gridParte2 = document.getElementById('funcionalidades-parte-2');
  const secaoParte2 = document.querySelector('.func-parte-2');

  if (!gridParte1) return;

  const coluna1 = funcionalidadesPlano.slice(0, 19);
  const coluna2 = funcionalidadesPlano.slice(19, 38);
  const coluna3 = funcionalidadesPlano.slice(38, 57);
  const coluna4 = funcionalidadesPlano.slice(57, 76);

  renderizarCardsFuncionalidades(gridParte1, coluna1, coluna2);

  if ((coluna3.length > 0 || coluna4.length > 0) && gridParte2) {
    renderizarCardsFuncionalidades(gridParte2, coluna3, coluna4);

    if (secaoParte2) {
      secaoParte2.style.display = '';
    }
  } else if (secaoParte2) {
    secaoParte2.style.display = 'none';
  }

  console.log('Funcionalidades renderizadas:', {
    plano: plano,
    total: funcionalidadesPlano.length,
    coluna1: coluna1.length,
    coluna2: coluna2.length,
    coluna3: coluna3.length,
    coluna4: coluna4.length
  });
}

function renderizarCardsFuncionalidades(container, colunaEsquerda, colunaDireita) {
  container.innerHTML = '';

  const totalLinhas = Math.max(
    colunaEsquerda.length,
    colunaDireita.length
  );

  for (let i = 0; i < totalLinhas; i++) {
    const esquerda = colunaEsquerda[i]?.nome || '';
    const direita = colunaDireita[i]?.nome || '';

    container.innerHTML += `
      <div class="func-linha">
        <div class="func-texto">
          ${escaparHTML(esquerda)}
        </div>

        <div class="func-check">
          ${esquerda ? '✓' : ''}
        </div>

        <div class="func-texto">
          ${escaparHTML(direita)}
        </div>

        <div class="func-check">
          ${direita ? '✓' : ''}
        </div>
      </div>
    `;
  }
}

/* =========================================================
   LOGO CLIENTE
========================================================= */

function preencherLogoCliente(dados) {
  const img = document.getElementById('logoClienteImagem');
  const texto = document.getElementById('logoClienteTexto');

  if (dados.logoCliente && img) {
    img.src = dados.logoCliente;
    img.style.display = 'block';

    if (texto) texto.style.display = 'none';
  } else {
    if (img) img.style.display = 'none';

    if (texto) {
      texto.textContent = dados.empresa || 'Cliente';
      texto.style.display = 'block';
    }
  }
}

/* =========================================================
   INVESTIMENTO
========================================================= */

function preencherInvestimento(dados) {
  const nomePlano = obterNomePlano(dados);

  const escopo = gerarEscopoInvestimento(dados);

  const descricao = `
    <p><strong>${escaparHTML(nomePlano)}:</strong></p>
    ${escopo.map(item => `<p>› ${escaparHTML(item)}</p>`).join('')}
  `;

  preencherHtmlPorId('investDescricao', descricao);

  const mensalidade = obterMensalidade(dados);
  const implantacao = dados.implantacao || dados.valorImplantacao || dados.setup || 0;
  const validade = dados.validade || dados.validadeProposta || dados.dataValidade || '';

  preencherTextoPorId('investMensalidade', formatarMoeda(mensalidade));
  preencherTextoPorId('investImplantacao', formatarMoeda(implantacao));
  preencherHtmlPorId('investLicencas', montarTextoLicencas(dados));
  preencherTextoPorId('investValidade', formatarData(validade));
}

function gerarEscopoInvestimento(dados) {
  const itens = [];

  const plano = obterChavePlano(obterValorPlano(dados));

  const campoInvestimento = {
    basico: 'basicoInvestimento',
    avancado: 'avancadoInvestimento',
    enterprise: 'enterpriseInvestimento'
  }[plano] || 'enterpriseInvestimento';

  const cnpjs = dados.cnpjs || '';
  const usuarios = dados.usuarios || '';
  const usuariosAdicionais = Number(dados.usuariosAdicionais || 0);
  const moduloServico = String(dados.moduloServico || '').toLowerCase();
  const escopoAutomatico = String(dados.escopoAutomatico || 'sim').toLowerCase();

  if (escopoAutomatico === 'sim') {
    if (cnpjs) {
      itens.push(`Monitoramento de até ${cnpjs} CNPJs/CPFs`);
    }

    if (usuarios) {
      itens.push(`Licença para ${usuarios} usuário${Number(usuarios) > 1 ? 's' : ''}`);
    }

    if (usuariosAdicionais > 0) {
      itens.push(`${usuariosAdicionais} usuário${usuariosAdicionais > 1 ? 's' : ''} adicional${usuariosAdicionais > 1 ? 'is' : ''}`);
    }

    const funcionalidadesInvestimento = funcionalidadesSistema
  .filter(function(item) {
    return (
      item &&
      item.nome &&
      item[campoInvestimento] === true
    );
  })
  .sort(function(a, b) {
    return Number(a.ordem || 9999) - Number(b.ordem || 9999);
  });

funcionalidadesInvestimento
  .forEach(function(item) {
    itens.push(item.nome);
  });
  }


  
  
  if (dados.escopoComercial) {
    String(dados.escopoComercial)
      .split('\n')
      .map(item => item.trim())
      .filter(Boolean)
      .forEach(item => itens.push(item));
  }

  return itens.length
    ? itens
    : ['Monitoramento, captura, gestão e auditoria de documentos fiscais eletrônicos.'];
}
function obterMensalidade(dados) {
  const modelo = String(dados.modeloOferta || '').toLowerCase();

  if (modelo.includes('nuvem') && dados.valorNuvem) {
    return dados.valorNuvem;
  }

  if (modelo.includes('local') && dados.valorLocal) {
    return dados.valorLocal;
  }

  return (
    dados.valorNuvem ||
    dados.valorLocal ||
    dados.mensalidade ||
    dados.valorMensal ||
    dados.valor ||
    0
  );
}

function montarTextoLicencas(dados) {
  const valor =
    dados.valorLicencaAdicional ||
    dados.licencaAdicional ||
    dados.valorUsuarioAdicional ||
    dados.usuarioAdicional ||
    0;

  if (!valor) return '';

  return `Licenças adicionais <strong>${formatarMoeda(valor)}</strong>`;
}

/* =========================================================
   CONSULTOR
========================================================= */

function preencherConsultor(dados) {
  const nome = dados.consultorNome || dados.vendedorNome || dados.nomeVendedor || '';
  const cargo = dados.consultorCargo || dados.vendedorCargo || dados.cargoVendedor || '';
  const email = dados.consultorEmail || dados.vendedorEmail || dados.emailVendedor || '';
  const telefone = dados.consultorTelefone || dados.vendedorTelefone || dados.telefoneVendedor || '';
  const whatsapp = dados.consultorWhatsApp || dados.consultorWhatsapp || dados.vendedorWhatsapp || dados.whatsappVendedor || '';
  const fotoUrl = dados.fotoConsultor || dados.consultorFoto || dados.vendedorFoto || dados.fotoVendedor || dados.foto || '';

  preencherTextoPorIdCampo('consultorNome', nome);
  preencherTextoPorIdCampo('consultorCargo', cargo);
  preencherTextoPorIdCampo('consultorEmail', email);

  const telefoneFinal = whatsapp && whatsapp !== telefone
    ? `${telefone} | ${whatsapp}`
    : telefone;

  preencherTextoPorIdCampo('consultorTelefone', telefoneFinal);

  const foto = document.getElementById('fotoConsultor');

  if (foto && fotoUrl) {
    foto.src = fotoUrl + (fotoUrl.includes('?') ? '&' : '?') + 'v=' + Date.now();
    foto.style.display = 'block';
    foto.style.opacity = '1';
  }
}

/* =========================================================
   HELPERS
========================================================= */

function preencherTextoPorId(id, valor) {
  const el = document.getElementById(id);

  if (el) {
    el.textContent = valor || '';
  }
}

function preencherHtmlPorId(id, valor) {
  const el = document.getElementById(id);

  if (el) {
    el.innerHTML = valor || '';
  }
}

function preencherTextoPorIdCampo(campo, valor) {
  const el = document.querySelector(`[data-campo="${campo}"]`);

  if (el) {
    el.textContent = valor || '';
  }
}

function formatarMoeda(valor) {
  if (valor === null || valor === undefined || valor === '') {
    return 'R$ 0,00';
  }

  const texto = String(valor).trim();

  if (texto.toLowerCase().includes('sem custo')) {
    return 'Sem custo';
  }

  const numero = Number(
    texto
      .replace('R$', '')
      .replace('/mês', '')
      .replace('/mes', '')
      .replace('mês', '')
      .replace('mes', '')
      .replace(/\./g, '')
      .replace(',', '.')
      .trim()
  );

  if (Number.isNaN(numero)) {
    return texto;
  }

  return numero.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  });
}

function formatarData(data) {
  if (!data) return '';

  const partes = String(data).split('-');

  if (partes.length === 3) {
    return `${partes[2]}/${partes[1]}/${partes[0]}`;
  }

  const d = new Date(data);

  if (isNaN(d.getTime())) {
    return data;
  }

  return d.toLocaleDateString('pt-BR');
}

function escaparHTML(valor) {
  return String(valor || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function gerarNomeArquivoPdf() {
  const dados = window.__dados || {};

  const numero = dados.numero || 'sem-numero';
  const versao = dados.versao || 'v.1';
  const empresa = dados.empresa || 'Cliente';
  const plano = obterNomePlano(dados) || 'Plano';

  const nome = `Proposta ${numero} | ${versao} | ${empresa} - ${plano}`;

  return limparNomeArquivo(nome) + '.pdf';
}

function limparNomeArquivo(nome) {
  return String(nome || '')
    .replace(/[\\/:*?"<>|]/g, '-')
    .replace(/\s+/g, ' ')
    .trim();
}


function gerarNomeArquivoPdf() {
  const dados = window.__dados || {};

  const numero = dados.numero || 'sem-numero';
  const versao = dados.versao || 'v.1';
  const empresa = dados.empresa || 'Cliente';
  const plano = obterNomePlano(dados) || 'Plano';

  const nome =
    `Proposta ${numero} | ${versao} | ${empresa} - ${plano}`;

  return limparNomeArquivo(nome) + '.pdf';
}

function limparNomeArquivo(nome) {
  return String(nome || '')
    .replace(/[\\/:*?"<>|]/g, '-')
    .replace(/\s+/g, ' ')
    .trim();
}



/* =========================================================
   PDF
========================================================= */

console.log('PDF JS carregado com sucesso.');

window.addEventListener('load', function () {
  console.log('Window load executado.');

  const btnGerarPdf = document.getElementById('btnGerarPdf');

  console.log('Botão encontrado:', btnGerarPdf);

  if (!btnGerarPdf) {
    alert('Botão btnGerarPdf não encontrado.');
    return;
  }

  btnGerarPdf.addEventListener('click', gerarPdfProposta);

  async function gerarPdfProposta() {
    try {
      
      if (typeof html2canvas === 'undefined') {
        alert('Erro: html2canvas não carregado.');
        return;
      }

      if (!window.jspdf || !window.jspdf.jsPDF) {
        alert('Erro: jsPDF não carregado.');
        return;
      }

      const slides = Array.from(document.querySelectorAll('.pagina'))
        .filter(function (slide) {
          return window.getComputedStyle(slide).display !== 'none';
        });

      console.log('Slides encontrados:', slides.length);

      if (!slides.length) {
        alert('Nenhum slide encontrado.');
        return;
      }

      btnGerarPdf.disabled = true;
      btnGerarPdf.textContent = 'Gerando PDF...';

      document.body.classList.add('gerando-pdf');

      const pdf = new window.jspdf.jsPDF({
        orientation: 'landscape',
        unit: 'px',
        format: [1280, 720],
        compress: true
      });

      for (let i = 0; i < slides.length; i++) {
        const canvas = await html2canvas(slides[i], {
          scale: 2,
          useCORS: true,
          backgroundColor: '#ffffff',
          width: 1280,
          height: 720,
          windowWidth: 1280,
          windowHeight: 720
        });

        const imgData = canvas.toDataURL('image/jpeg', 0.88);

        if (i > 0) {
          pdf.addPage([1280, 720], 'landscape');
        }

        pdf.addImage(imgData, 'JPEG', 0, 0, 1280, 720, undefined, 'FAST');
      }

      pdf.save(gerarNomeArquivoPdf());

    } catch (erro) {
      console.error('Erro ao gerar PDF:', erro);
      alert('Erro ao gerar PDF. Veja o console.');

    } finally {
      document.body.classList.remove('gerando-pdf');
      btnGerarPdf.disabled = false;
      btnGerarPdf.textContent = '📄 Gerar PDF';
    }
  }
});