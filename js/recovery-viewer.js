let recoveryItemAtual = null;

document.addEventListener('DOMContentLoaded', function () {
  carregarRecoveryProposta();

  const btnPdf = document.getElementById('btnGerarPdfRecovery');
  if (btnPdf) btnPdf.addEventListener('click', gerarPdfRecovery);
});

async function carregarRecoveryProposta() {
  const params = new URLSearchParams(window.location.search);
  const id = Number(params.get('id') || 0);

  if (!id) {
    alert('ID do Recovery não informado.');
    return;
  }

  try {
    const resposta = await fetch('api/listar-recovery.php', { cache: 'no-store' });
    const dados = await resposta.json();

    if (!dados.sucesso) {
      alert('Erro ao carregar Recovery.');
      return;
    }

    const item = (dados.recovery || []).find(r => Number(r.id || 0) === id);

    if (!item) {
      alert('Recovery não encontrado.');
      return;
    }

    recoveryItemAtual = item;

    preencherPropostaRecovery(item);
    await preencherVendedorRecovery(item);

  } catch (erro) {
    console.error('Erro ao carregar proposta Recovery:', erro);
    alert('Erro ao carregar proposta.');
  }
}

function preencherPropostaRecovery(item) {
  preencherTexto(
    'capaResumo',
    `${item.modelo || '-'} | ${item.uf || '-'} | ${formatarNumero(item.quantidade || 0)} XMLs para Recuperação`
  );

  preencherLogoClienteRecovery(item);

  const data = item.dataProposta || item.criadoEm || '';

  let dataFormatada = '';

  if (data) {
    dataFormatada = data.substring(0, 10).split('-').reverse().join('/');
  }

  preencherTexto(
    'capaPropostaInfo',
    `Proposta ${item.numeroProposta || '-'} | ${item.versao || 'v.1'} | ${dataFormatada}`
  );

  preencherTexto('escopoEmpresa', item.empresa || '-');
  preencherTexto('escopoContato', item.contato || '-');
  preencherTexto('escopoUf', item.uf || '-');
  preencherTexto('escopoModelo', item.modelo || '-');
  preencherTexto('escopoQuantidade', formatarNumero(item.quantidade || 0));
  preencherTexto('escopoPrazo', item.prazo || '-');
  preencherTexto('escopoCertificado', item.certificado || '-');

  preencherTexto('investValorUnitario', formatarUnitario(item.valorUnitario || 0));
  preencherTexto('investQuantidade', formatarNumero(item.quantidade || 0));
  preencherTexto('investQtdBox', formatarNumero(item.quantidade || 0));
  preencherTexto('investValorTotal', formatarMoeda(item.valorTotal || 0));
  preencherTexto('investObservacao', item.observacao || '');
  preencherTexto('investModelo', item.modelo || '-');
  preencherTexto('investUf', item.uf || '-');
}

function preencherLogoClienteRecovery(item) {
  const nome = document.getElementById('capaEmpresa');
  const img = document.getElementById('capaLogoClienteImagem');

  if (!nome || !img) return;

  if (item.logoCliente) {
    img.src = item.logoCliente;
    img.style.display = 'block';

    nome.style.display = 'none';
    return;
  }

  img.style.display = 'none';
  img.removeAttribute('src');

  nome.style.display = 'block';
  nome.textContent = item.empresa || 'Empresa';
}


async function preencherVendedorRecovery(item) {
  try {
    const resposta = await fetch('data/vendedores.json', { cache: 'no-store' });
    const vendedores = await resposta.json();

    const vendedorId =
      item.vendedorId ||
      item.vendedor_id ||
      item.vendedor ||
      item.consultor ||
      item.consultorId ||
      '';

    let vendedor = vendedores.find(v => String(v.id) === String(vendedorId));

    if (!vendedor && vendedorId) {
      vendedor = vendedores.find(v =>
        normalizarTexto(v.nome) === normalizarTexto(vendedorId)
      );
    }

    if (!vendedor) {
      vendedor = vendedores.find(v => v.id === 'adriner-ferreira') || vendedores[0];
    }

    if (!vendedor) return;

    preencherTexto('vendedorNome', vendedor.nome || '-');
    preencherTexto('vendedorCargo', vendedor.cargo || 'Consultor Comercial');

    preencherTexto(
      'vendedorTelefone',
      '☎ ' + (vendedor.whatsapp || vendedor.telefone || '-')
    );

    preencherTexto(
      'vendedorEmail',
      '✉ ' + (vendedor.email || '-')
    );

    preencherTexto(
      'vendedorSite',
      '🌐 www.fiscal.io'
    );

    const foto = document.getElementById('vendedorFoto');

    if (foto && vendedor.foto) {
      foto.innerHTML = '';

      const img = document.createElement('img');
      img.src = vendedor.foto;
      img.alt = vendedor.nome || 'Vendedor';

      foto.appendChild(img);
    }

  } catch (erro) {
    console.error('Erro ao carregar vendedor:', erro);
  }
}

function preencherTexto(id, texto) {
  const el = document.getElementById(id);
  if (el) el.textContent = texto;
}

function normalizarTexto(texto) {
  return String(texto || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

async function gerarPdfRecovery() {
  if (!recoveryItemAtual) {
    alert('Aguarde o carregamento da proposta antes de gerar o PDF.');
    return;
  }

  const { jsPDF } = window.jspdf;
  const pdf = new jsPDF('landscape', 'pt', [1280, 720]);

  const slides = document.querySelectorAll('.slide');

  for (let i = 0; i < slides.length; i++) {
    const canvas = await html2canvas(slides[i], {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff'
    });

    const imgData = canvas.toDataURL('image/jpeg', 0.95);

    if (i > 0) pdf.addPage([1280, 720], 'landscape');

    pdf.addImage(imgData, 'JPEG', 0, 0, 1280, 720);
  }

  pdf.save(gerarNomePdfRecovery(recoveryItemAtual));
}

function gerarNomePdfRecovery(item) {
  const numero = limparNomeArquivoRecovery(item.numeroProposta || 'sem-numero');
  const versao = limparNomeArquivoRecovery(item.versao || 'v.1');
  const empresa = limparNomeArquivoRecovery(item.empresa || 'empresa');
  const tipo = 'Baixa-XML-do-passado';

  return `Proposta-${numero}-${versao}-${empresa}-${tipo}.pdf`;
}

function limparNomeArquivoRecovery(texto) {
  return String(texto || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function formatarMoeda(valor) {
  return Number(valor || 0).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  });
}

function formatarUnitario(valor) {
  return 'R$ ' + Number(valor || 0).toFixed(3).replace('.', ',');
}

function formatarNumero(valor) {
  return Number(valor || 0).toLocaleString('pt-BR');
}