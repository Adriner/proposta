/* =========================================================
   FUNCIONALIDADES DINÂMICAS
========================================================= */

function escaparHTMLFuncionalidade(texto) {
  return String(texto || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function normalizarNomePlanoCompacto(plano) {
  const nomes = {
    basico: 'Básico',
    avancado: 'Avançado',
    enterprise: 'Enterprise'
  };

  return nomes[String(plano || '').toLowerCase()] || plano || 'Enterprise';
}

function obterPlanoCompacto() {
  const dados =
    JSON.parse(localStorage.getItem('dadosPropostaFiscalio') || '{}');

  const params =
    new URLSearchParams(window.location.search);

  return {
    plano: dados.plano || params.get('plano') || 'enterprise',
    planoNome: dados.planoNome || normalizarNomePlanoCompacto(dados.plano || params.get('plano') || 'enterprise'),
    cnpjs: dados.cnpjs || '',
    creditoDownloads: dados.creditoDownloads || '',
    armazenamento: dados.armazenamento || 'Ilimitado'
  };
}

async function carregarFuncionalidadesCompacta() {
  try {
    const resposta =
      await fetch('./data/funcionalidades.json?v=' + Date.now());

    if (!resposta.ok) {
      throw new Error('Erro ao carregar funcionalidades.json');
    }

    const lista =
      await resposta.json();

    return Array.isArray(lista) ? lista : [];

  } catch (erro) {
    console.error('Erro ao carregar funcionalidades:', erro);
    return [];
  }
}

function filtrarFuncionalidadesPorPlano(lista, plano) {
  const chavePlano =
    String(plano || '').toLowerCase();

  return lista.filter(function(item) {
    return (
      item &&
      item.nome &&
      item[chavePlano] === true
    );
  });
}

function montarLinhasFuncionalidadesCompacta(itens) {
  const linhas = [];

  for (let i = 0; i < itens.length; i += 2) {
    const itemA = itens[i];
    const itemB = itens[i + 1];

    linhas.push(`
      <div class="func-linha">
        <div class="func-texto">
          ${escaparHTMLFuncionalidade(itemA ? itemA.nome : '')}
        </div>

        <div class="func-valor">
          ${itemA ? '<span class="func-check">✓</span>' : ''}
        </div>

        <div class="func-texto">
          ${escaparHTMLFuncionalidade(itemB ? itemB.nome : '')}
        </div>

        <div class="func-valor">
          ${itemB ? '<span class="func-check">✓</span>' : ''}
        </div>
      </div>
    `);
  }

  return linhas.join('');
}

async function renderizarFuncionalidadesCompacta() {
  const proposta =
    obterPlanoCompacto();

  const listaCompleta =
    await carregarFuncionalidadesCompacta();

  const funcionalidadesPlano =
    filtrarFuncionalidadesPorPlano(
      listaCompleta,
      proposta.plano
    );

  const parte1Container =
    document.getElementById('funcionalidades-parte-1');

  const parte2Container =
    document.getElementById('funcionalidades-parte-2');

  const nomePlano1 =
    document.getElementById('func-plano-nome-1');

  const nomePlano2 =
    document.getElementById('func-plano-nome-2');

  if (nomePlano1) {
    nomePlano1.textContent = proposta.planoNome;
  }

  if (nomePlano2) {
    nomePlano2.textContent = proposta.planoNome;
  }

  if (!parte1Container && !parte2Container) {
    return;
  }

  const limiteParte1 = 24;

  const parte1 =
    funcionalidadesPlano.slice(0, limiteParte1);

  const parte2 =
    funcionalidadesPlano.slice(limiteParte1);

  if (parte1Container) {
    parte1Container.innerHTML =
      montarLinhasFuncionalidadesCompacta(parte1);
  }

  if (parte2Container) {
    const paginaParte2 =
      parte2Container.closest('.pagina');

    if (parte2.length > 0) {
      parte2Container.innerHTML =
        montarLinhasFuncionalidadesCompacta(parte2);

      if (paginaParte2) {
        paginaParte2.style.display = '';
      }
    } else {
      parte2Container.innerHTML = '';

      if (paginaParte2) {
        paginaParte2.style.display = 'none';
      }
    }
  }

  console.log('Funcionalidades renderizadas:', {
    plano: proposta.plano,
    total: funcionalidadesPlano.length,
    parte1: parte1.length,
    parte2: parte2.length
  });
}



document.addEventListener('DOMContentLoaded', function() {
  renderizarFuncionalidadesCompacta();
});

/* =========================================================
   CAPA - TEXTO DO PLANO
========================================================= */

function renderizarCapaPlanoCompacta() {
  const dados =
    JSON.parse(localStorage.getItem('dadosPropostaFiscalio') || '{}');

  const nomePlano =
    normalizarNomePlanoCompacto(dados.plano || 'enterprise');

  const campoCapa =
    document.getElementById('capaPlano');

  if (!campoCapa) {
    return;
  }

  campoCapa.textContent =
    'Fiscal.io Monitor | Plano ' + nomePlano;
}

document.addEventListener('DOMContentLoaded', function() {
  setTimeout(renderizarCapaPlanoCompacta, 300);
  setTimeout(renderizarCapaPlanoCompacta, 800);
  setTimeout(renderizarCapaPlanoCompacta, 1500);
  });
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

      pdf.save('Proposta-Fiscalio.pdf');

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