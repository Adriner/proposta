let regrasDownloads = [];

document.addEventListener('DOMContentLoaded', function () {
  carregarRegrasDownloads();

  const uf = document.getElementById('downloadUf');
  const modelo = document.getElementById('downloadModelo');
  const quantidade = document.getElementById('downloadQuantidade');
  const valorUnitario = document.getElementById('downloadsValorUnitario');

  if (uf) {
    uf.addEventListener('change', function () {
      limparEdicaoManualValorDownload();
      calcularDownloadEspecial();
    });
  }

  if (modelo) {
    modelo.addEventListener('change', function () {
      limparEdicaoManualValorDownload();
      calcularDownloadEspecial();
    });
  }

  if (quantidade) {
    quantidade.addEventListener('input', function () {
      if (valorUnitario && valorUnitario.dataset.editadoManual === 'sim') {
        recalcularTotalDownloadManual();
      } else {
        calcularDownloadEspecial();
      }
    });
  }

  if (valorUnitario) {
    valorUnitario.addEventListener('input', recalcularTotalDownloadManual);

    valorUnitario.addEventListener('blur', function () {
      const valor = desformatarMoedaDownload(valorUnitario.value);
      valorUnitario.value = formatarMoedaUnitario(valor);
      recalcularTotalDownloadManual();
    });
  }
});

async function carregarRegrasDownloads() {
  try {
    const resposta = await fetch('api/listar-dfe-master.php', {
      method: 'GET',
      cache: 'no-store'
    });

    const dados = await resposta.json();

    if (!dados.sucesso) {
      console.error(dados.mensagem || 'Erro ao carregar DFe Master.');
      return;
    }

    regrasDownloads = dados.regras || [];
    preencherUfsDownloads();
    calcularDownloadEspecial();

  } catch (erro) {
    console.error('Erro ao carregar regras para downloads:', erro);
  }
}

function preencherUfsDownloads() {
  const select = document.getElementById('downloadUf');
  if (!select) return;

  const ufs = [...new Set(
    regrasDownloads
      .filter(r => r.ativo)
      .map(r => String(r.uf || '').toUpperCase())
      .filter(Boolean)
  )].sort();

  select.innerHTML = '';

  if (!ufs.length) {
    select.innerHTML = '<option value="">Nenhuma UF</option>';
    return;
  }

  ufs.forEach(function (uf) {
    const option = document.createElement('option');
    option.value = uf;
    option.textContent = uf;
    select.appendChild(option);
  });
}

function calcularDownloadEspecial() {
  const uf = document.getElementById('downloadUf')?.value || '';
  const modelo = document.getElementById('downloadModelo')?.value || '';
  const quantidade = Number(document.getElementById('downloadQuantidade')?.value || 0);
  const campoValorUnitario = document.getElementById('downloadsValorUnitario');

  const regra = regrasDownloads.find(function (r) {
    return String(r.uf || '').toUpperCase() === uf.toUpperCase()
      && String(r.modelo || '') === modelo
      && r.ativo;
  });

  if (!regra) {
    const valorAtual = campoValorUnitario
      ? desformatarMoedaDownload(campoValorUnitario.value || '0')
      : 0;

    if (campoValorUnitario && campoValorUnitario.dataset.editadoManual !== 'sim') {
      campoValorUnitario.value = formatarMoedaUnitario(0);
    }

    preencherResultadoDownload(
      valorAtual,
      quantidade * valorAtual,
      '-',
      'Nenhuma regra ativa encontrada para esta UF/modelo.'
    );

    return;
  }

  let valorUnitario = Number(regra.valor || 0);

  if (campoValorUnitario && campoValorUnitario.dataset.editadoManual === 'sim') {
    valorUnitario = desformatarMoedaDownload(campoValorUnitario.value);
  }

  const total = quantidade * valorUnitario;

  preencherResultadoDownload(
    valorUnitario,
    total,
    regra.prazo || '-',
    regra.alerta || regra.observacao || '-'
  );
}

function preencherResultadoDownload(valorUnitario, total, prazo, alerta) {
  const campoValorUnitario = document.getElementById('downloadsValorUnitario');
  const elValorTotal = document.getElementById('downloadValorTotal');
  const elPrazo = document.getElementById('downloadPrazo');
  const elAlerta = document.getElementById('downloadAlerta');

  if (campoValorUnitario && campoValorUnitario.dataset.editadoManual !== 'sim') {
    campoValorUnitario.value = formatarMoedaUnitario(valorUnitario);
  }

  if (elValorTotal) {
    elValorTotal.textContent = formatarMoeda(total);
  }

  if (elPrazo) {
    elPrazo.textContent = prazo;
  }

  if (elAlerta) {
    elAlerta.textContent = alerta;
  }
}

function recalcularTotalDownloadManual() {
  const campoValorUnitario = document.getElementById('downloadsValorUnitario');
  const elValorTotal = document.getElementById('downloadValorTotal');
  const quantidade = Number(document.getElementById('downloadQuantidade')?.value || 0);

  if (!campoValorUnitario || !elValorTotal) return;

  campoValorUnitario.dataset.editadoManual = 'sim';

  const valorUnitario = desformatarMoedaDownload(campoValorUnitario.value);
  const total = quantidade * valorUnitario;

  elValorTotal.textContent = formatarMoeda(total);
}

function limparEdicaoManualValorDownload() {
  const campoValorUnitario = document.getElementById('downloadsValorUnitario');

  if (campoValorUnitario) {
    delete campoValorUnitario.dataset.editadoManual;
  }
}

function formatarMoeda(valor) {
  return Number(valor || 0).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  });
}

function formatarMoedaUnitario(valor) {
  return 'R$ ' + Number(valor || 0).toFixed(3).replace('.', ',');
}

function desformatarMoedaDownload(valor) {
  if (!valor) return 0;

  let texto = String(valor)
    .replace('R$', '')
    .trim();

  if (texto.includes(',') && texto.includes('.')) {
    texto = texto.replace(/\./g, '').replace(',', '.');
  } else if (texto.includes(',')) {
    texto = texto.replace(',', '.');
  }

  return Number(texto) || 0;
}