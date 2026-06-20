let regrasRecovery = [];
let recoveryItens = [];
let recoveryEditandoId = 0;
let recoveryItemAtual = null;

document.addEventListener('DOMContentLoaded', function () {
  carregarRegrasRecovery();
  carregarRecoverySalvos();

  const uf = document.getElementById('recoveryUf');
  const modelo = document.getElementById('recoveryModelo');
  const quantidade = document.getElementById('recoveryQuantidade');
  const valorUnitario = document.getElementById('recoveryValorUnitario');
  const btnSalvar = document.getElementById('btnSalvarRecovery');
  const btnNovo = document.getElementById('btnNovoRecovery');
  const btnNovaVersao = document.getElementById('btnNovaVersaoRecovery');

  if (uf) {
    uf.addEventListener('change', function () {
      limparEdicaoManualValorRecovery();
      calcularRecovery();
    });
  }

  if (modelo) {
    modelo.addEventListener('change', function () {
      limparEdicaoManualValorRecovery();
      calcularRecovery();
    });
  }

  if (quantidade) {
    quantidade.addEventListener('input', function () {
      if (valorUnitario && valorUnitario.dataset.editadoManual === 'sim') {
        recalcularTotalRecoveryManual();
      } else {
        calcularRecovery();
      }
    });
  }

  if (valorUnitario) {
    valorUnitario.addEventListener('input', recalcularTotalRecoveryManual);

    valorUnitario.addEventListener('blur', function () {
      const valor = desformatarMoedaRecovery(valorUnitario.value);
      valorUnitario.value = formatarUnitarioRecovery(valor);
      recalcularTotalRecoveryManual();
    });
  }

  if (btnSalvar) btnSalvar.addEventListener('click', salvarRecovery);
  if (btnNovo) btnNovo.addEventListener('click', limparFormularioRecovery);
  if (btnNovaVersao) btnNovaVersao.addEventListener('click', gerarNovaVersaoRecovery);
});

async function carregarRegrasRecovery() {
  try {
    const resposta = await fetch('api/listar-dfe-master.php', { cache: 'no-store' });
    const dados = await resposta.json();

    if (!dados.sucesso) return;

    regrasRecovery = dados.regras || [];
    preencherUfsRecovery();
    calcularRecovery();

  } catch (erro) {
    console.error('Erro ao carregar regras Recovery:', erro);
  }
}

async function carregarRecoverySalvos() {
  const lista = document.getElementById('listaRecovery');
  if (!lista) return;

  lista.innerHTML = '<div class="linha">Carregando recoveries...</div>';

  try {
    const resposta = await fetch('api/listar-recovery.php', { cache: 'no-store' });
    const dados = await resposta.json();

    if (!dados.sucesso) {
      lista.innerHTML = '<div class="linha">Erro ao carregar Recovery.</div>';
      return;
    }

    recoveryItens = dados.recovery || [];
    renderizarRecovery();

  } catch (erro) {
    console.error('Erro ao carregar recoveries:', erro);
    lista.innerHTML = '<div class="linha">Erro ao conectar com o servidor.</div>';
  }
}

async function gerarNumeroPropostaRecovery() {
  const resposta = await fetch('api/gerar-numero-proposta.php', { cache: 'no-store' });
  const dados = await resposta.json();

  if (!dados.sucesso || !dados.numeroProposta) {
    throw new Error(dados.mensagem || 'Não foi possível gerar o número da proposta.');
  }

  return dados;
}

function preencherUfsRecovery() {
  const select = document.getElementById('recoveryUf');
  if (!select) return;

  const ufs = [...new Set(
    regrasRecovery
      .filter(r => r.ativo)
      .map(r => String(r.uf || '').toUpperCase())
      .filter(Boolean)
  )].sort();

  select.innerHTML = '';

  ufs.forEach(function (uf) {
    const option = document.createElement('option');
    option.value = uf;
    option.textContent = uf;
    select.appendChild(option);
  });
}

function calcularRecovery() {
  const uf = document.getElementById('recoveryUf')?.value || '';
  const modelo = document.getElementById('recoveryModelo')?.value || '';
  const quantidade = Number(document.getElementById('recoveryQuantidade')?.value || 0);
  const campoValorUnitario = document.getElementById('recoveryValorUnitario');

  const regra = regrasRecovery.find(function (r) {
    return String(r.uf || '').toUpperCase() === uf.toUpperCase()
      && String(r.modelo || '') === modelo
      && r.ativo;
  });

  if (!regra) {
    const valorAtual = campoValorUnitario
      ? desformatarMoedaRecovery(campoValorUnitario.value || '0')
      : 0;

    if (campoValorUnitario && campoValorUnitario.dataset.editadoManual !== 'sim') {
      campoValorUnitario.value = formatarUnitarioRecovery(0);
    }

    preencherResultadoRecovery(
      valorAtual,
      quantidade * valorAtual,
      '-',
      '-',
      'Nenhuma regra ativa encontrada.'
    );

    return;
  }

  let valorUnitario = Number(regra.valor || 0);

  if (campoValorUnitario && campoValorUnitario.dataset.editadoManual === 'sim') {
    valorUnitario = desformatarMoedaRecovery(campoValorUnitario.value);
  }

  const total = quantidade * valorUnitario;

  preencherResultadoRecovery(
    valorUnitario,
    total,
    regra.prazo || '-',
    regra.certificado || '-',
    regra.alerta || regra.observacao || '-'
  );
}

function preencherResultadoRecovery(valorUnitario, total, prazo, certificado, alerta) {
  const campoValorUnitario = document.getElementById('recoveryValorUnitario');
  const campoValorTotal = document.getElementById('recoveryValorTotal');
  const campoPrazo = document.getElementById('recoveryPrazo');
  const campoCertificado = document.getElementById('recoveryCertificado');
  const campoAlerta = document.getElementById('recoveryAlerta');

  if (campoValorUnitario && campoValorUnitario.dataset.editadoManual !== 'sim') {
    campoValorUnitario.value = formatarUnitarioRecovery(valorUnitario);
  }

  if (campoValorTotal) campoValorTotal.value = formatarMoedaRecovery(total);
  if (campoPrazo) campoPrazo.value = prazo;
  if (campoCertificado) campoCertificado.value = certificado;
  if (campoAlerta) campoAlerta.value = alerta;
}

function recalcularTotalRecoveryManual() {
  const campoValorUnitario = document.getElementById('recoveryValorUnitario');
  const campoValorTotal = document.getElementById('recoveryValorTotal');
  const quantidade = Number(document.getElementById('recoveryQuantidade')?.value || 0);

  if (!campoValorUnitario || !campoValorTotal) return;

  campoValorUnitario.dataset.editadoManual = 'sim';

  const valorUnitario = desformatarMoedaRecovery(campoValorUnitario.value);
  const total = quantidade * valorUnitario;

  campoValorTotal.value = formatarMoedaRecovery(total);
}

function limparEdicaoManualValorRecovery() {
  const campoValorUnitario = document.getElementById('recoveryValorUnitario');

  if (campoValorUnitario) {
    delete campoValorUnitario.dataset.editadoManual;
  }
}

function limparFormularioRecovery() {
  recoveryEditandoId = 0;
  recoveryItemAtual = null;

  const campos = {
    numeroProposta: document.getElementById('recoveryNumeroProposta'),
    versao: document.getElementById('recoveryVersao'),
    status: document.getElementById('recoveryStatus'),
    empresa: document.getElementById('recoveryEmpresa'),
    contato: document.getElementById('recoveryContato'),
    quantidade: document.getElementById('recoveryQuantidade'),
    certificado: document.getElementById('recoveryCertificado'),
    observacao: document.getElementById('recoveryObservacao')
  };

  if (campos.numeroProposta) campos.numeroProposta.value = '';
  if (campos.versao) campos.versao.value = 'v.1';
  if (campos.status) campos.status.value = 'Rascunho';
  if (campos.empresa) campos.empresa.value = '';
  if (campos.contato) campos.contato.value = '';
  if (campos.quantidade) campos.quantidade.value = 1000;
  if (campos.certificado) campos.certificado.value = '';
  if (campos.observacao) campos.observacao.value = '';

  limparEdicaoManualValorRecovery();
  calcularRecovery();
}

function gerarNovaVersaoRecovery() {
  if (!recoveryItemAtual || !recoveryItemAtual.numeroProposta) {
    alert('Selecione uma proposta já salva para gerar uma nova versão.');
    return;
  }

  recoveryEditandoId = 0;

  const campoVersao = document.getElementById('recoveryVersao');
  const novaVersao = incrementarVersaoRecovery(
    campoVersao?.value || recoveryItemAtual.versao || 'v.1'
  );

  if (campoVersao) campoVersao.value = novaVersao;

  const campoStatus = document.getElementById('recoveryStatus');
  if (campoStatus) campoStatus.value = 'Revisada';

  alert(`Nova versão criada: ${recoveryItemAtual.numeroProposta} - ${novaVersao}. Clique em Salvar para gravar.`);
}

async function salvarRecovery() {
  const empresa = document.getElementById('recoveryEmpresa')?.value.trim() || '';
  const contato = document.getElementById('recoveryContato')?.value.trim() || '';

  const valorUnitario = desformatarMoedaRecovery(
    document.getElementById('recoveryValorUnitario')?.value || '0'
  );

  const valorTotal = desformatarMoedaRecovery(
    document.getElementById('recoveryValorTotal')?.value || '0'
  );

  let numeroProposta =
    document.getElementById('recoveryNumeroProposta')?.value.trim() ||
    recoveryItemAtual?.numeroProposta ||
    '';

  let anoProposta = recoveryItemAtual?.ano || null;
  let sequencialProposta = recoveryItemAtual?.sequencial || null;

  if (!numeroProposta) {
    try {
      const numeroGerado = await gerarNumeroPropostaRecovery();

      numeroProposta = numeroGerado.numeroProposta;
      anoProposta = numeroGerado.ano;
      sequencialProposta = numeroGerado.sequencial;

      const campoNumero = document.getElementById('recoveryNumeroProposta');
      if (campoNumero) campoNumero.value = numeroProposta;

    } catch (erro) {
      console.error('Erro ao gerar número da proposta:', erro);
      alert('Não foi possível gerar o número da proposta.');
      return;
    }
  }

  let logoCliente =
    document.getElementById('recoveryLogoCliente')?.value ||
    recoveryItemAtual?.logoCliente ||
    '';

  const campoLogoArquivo = document.getElementById('recoveryLogoArquivo');

  if (campoLogoArquivo && campoLogoArquivo.files && campoLogoArquivo.files[0]) {
    try {
      const formData = new FormData();
      formData.append('logo', campoLogoArquivo.files[0]);

      const respostaUpload = await fetch('api/upload-logo-cliente.php', {
        method: 'POST',
        body: formData
      });

      const dadosUpload = await respostaUpload.json();

      if (!dadosUpload.sucesso) {
        alert(dadosUpload.mensagem || 'Erro ao enviar o logo do cliente.');
        return;
      }

      logoCliente = dadosUpload.arquivo || '';

      const campoLogoCliente = document.getElementById('recoveryLogoCliente');
      if (campoLogoCliente) campoLogoCliente.value = logoCliente;

    } catch (erro) {
      console.error('Erro no upload do logo:', erro);
      alert('Erro ao enviar o logo do cliente.');
      return;
    }
  }

  let clienteId =
    Number(document.getElementById('recoveryClienteId')?.value || 0) ||
    Number(recoveryItemAtual?.clienteId || 0) ||
    0;

  if (empresa) {
    try {
      const respostaCliente = await fetch('api/salvar-cliente.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: clienteId,
          empresa: empresa,
          contato: contato,
          logoCliente: logoCliente
        })
      });

      const dadosCliente = await respostaCliente.json();

      if (!dadosCliente.sucesso) {
        alert(dadosCliente.mensagem || 'Erro ao salvar cliente.');
        return;
      }

      clienteId = Number(dadosCliente.clienteId || clienteId || 0);

      const campoClienteId = document.getElementById('recoveryClienteId');
      if (campoClienteId) campoClienteId.value = clienteId;

    } catch (erro) {
      console.error('Erro ao salvar cliente:', erro);
      alert('Erro ao salvar cliente.');
      return;
    }
  }

  const versao =
    document.getElementById('recoveryVersao')?.value.trim() ||
    recoveryItemAtual?.versao ||
    'v.1';

  const status =
    document.getElementById('recoveryStatus')?.value.trim() ||
    recoveryItemAtual?.status ||
    'Rascunho';

  const payload = {
    id: recoveryEditandoId,

    numeroProposta: numeroProposta,
    ano: anoProposta,
    sequencial: sequencialProposta,
    versao: normalizarVersaoRecovery(versao),
    status: status,

    dataProposta: document.getElementById('recoveryDataProposta')?.value || '',
    validadeProposta: document.getElementById('recoveryValidadeProposta')?.value || '',

    clienteId: clienteId,
    logoCliente: logoCliente,

    vendedor: obterVendedorLogadoRecovery(),
    empresa: empresa,
    contato: contato,
    uf: document.getElementById('recoveryUf')?.value || '',
    modelo: document.getElementById('recoveryModelo')?.value || '',
    quantidade: Number(document.getElementById('recoveryQuantidade')?.value || 0),
    valorUnitario: valorUnitario,
    valorTotal: valorTotal,
    prazo: document.getElementById('recoveryPrazo')?.value || '',
    certificado: document.getElementById('recoveryCertificado')?.value || '',
    alerta: document.getElementById('recoveryAlerta')?.value || '',
    observacao: document.getElementById('recoveryObservacao')?.value.trim() || ''
  };

  try {
    const resposta = await fetch('api/salvar-recovery.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const dados = await resposta.json();

    alert(dados.mensagem || 'Processo concluído.');

    if (dados.sucesso) {
      limparFormularioRecovery();
      carregarRecoverySalvos();
    }

  } catch (erro) {
    console.error('Erro ao salvar Recovery:', erro);
    alert('Erro ao salvar Recovery.');
  }
}
function renderizarRecovery() {
  const lista = document.getElementById('listaRecovery');

  if (!lista) return;

  lista.innerHTML = '';

  if (!Array.isArray(recoveryItens) || recoveryItens.length === 0) {
    lista.innerHTML = `
      <div class="linha-vazia">
        Nenhuma proposta Recovery encontrada.
      </div>
    `;
    return;
  }

  recoveryItens.forEach(function (item) {
    const linha = document.createElement('div');
    linha.className = 'recovery-linha';

    linha.innerHTML = `
      <strong>
        ${escaparHTMLRecovery(item.numeroProposta || 'Sem número')}
        ${escaparHTMLRecovery(item.versao || 'v.1')}
        -
        ${escaparHTMLRecovery(item.empresa || '')}
      </strong>

      <span>
        ${escaparHTMLRecovery(item.uf || '')}
        /
        ${escaparHTMLRecovery(item.modelo || '')}
      </span>

      <span>
        ${Number(item.quantidade || 0).toLocaleString('pt-BR')}
      </span>

      <span>
        ${formatarMoedaRecovery(item.valorTotal || 0)}
      </span>

      <span class="recovery-linha-status">
        ${escaparHTMLRecovery(item.status || 'Rascunho')}
      </span>

      <span>
        ${escaparHTMLRecovery(item.criadoEm || item.dataProposta || '')}
      </span>

      <button
  type="button"
  class="btn-secundario"
  onclick="window.open('recovery-viewer.html?id=${item.id}','_blank')"
>
  Gerar Proposta
</button>
    `;

    lista.appendChild(linha);
  });
}
function preencherFormularioRecovery(item) {
  recoveryEditandoId = Number(item.id || 0);
  recoveryItemAtual = item;

  const numeroProposta = document.getElementById('recoveryNumeroProposta');
  const versao = document.getElementById('recoveryVersao');
  const status = document.getElementById('recoveryStatus');
  const empresa = document.getElementById('recoveryEmpresa');
  const contato = document.getElementById('recoveryContato');
  const uf = document.getElementById('recoveryUf');
  const modelo = document.getElementById('recoveryModelo');
  const quantidade = document.getElementById('recoveryQuantidade');
  const valorUnitario = document.getElementById('recoveryValorUnitario');
  const valorTotal = document.getElementById('recoveryValorTotal');
  const prazo = document.getElementById('recoveryPrazo');
  const certificado = document.getElementById('recoveryCertificado');
  const alerta = document.getElementById('recoveryAlerta');
  const observacao = document.getElementById('recoveryObservacao');

  if (numeroProposta) numeroProposta.value = item.numeroProposta || '';
  if (versao) versao.value = item.versao || 'v.1';
  if (status) status.value = item.status || 'Rascunho';
  if (empresa) empresa.value = item.empresa || '';
  if (contato) contato.value = item.contato || '';
  if (uf) uf.value = item.uf || '';
  if (modelo) modelo.value = item.modelo || 'NF-e';
  if (quantidade) quantidade.value = item.quantidade || 0;
  if (valorUnitario) valorUnitario.value = formatarUnitarioRecovery(item.valorUnitario || 0);
  if (valorTotal) valorTotal.value = formatarMoedaRecovery(item.valorTotal || 0);
  if (prazo) prazo.value = item.prazo || '';
  if (certificado) certificado.value = item.certificado || '';
  if (alerta) alerta.value = item.alerta || '';
  if (observacao) observacao.value = item.observacao || '';

  if (valorUnitario) {
    valorUnitario.dataset.editadoManual = 'sim';
  }
}

function normalizarVersaoRecovery(versao) {
  const numero = String(versao || '1').replace(/\D/g, '') || '1';
  return 'v.' + Number(numero);
}

function incrementarVersaoRecovery(versaoAtual) {
  const numero = Number(String(versaoAtual || 'v.1').replace(/\D/g, '') || 1);
  return 'v.' + (numero + 1);
}

function limparNomeArquivoRecovery(texto) {
  return String(texto || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function gerarNomePdfRecovery(item) {
  const numero = limparNomeArquivoRecovery(item.numeroProposta || 'sem-numero');
  const versao = limparNomeArquivoRecovery(item.versao || 'v.1');
  const empresa = limparNomeArquivoRecovery(item.empresa || 'empresa');
  const tipo = 'Baixa-XML-do-passado';

  return `Proposta ${numero}-${versao}-${empresa}-${tipo}.pdf`;
}

function obterVendedorLogadoRecovery() {
  try {
    const usuario = JSON.parse(localStorage.getItem('usuarioLogado') || '{}');

    return (
      usuario.vendedor ||
      usuario.vendedorId ||
      usuario.vendedor_id ||
      usuario.id ||
      usuario.login ||
      'adriner-ferreira'
    );
  } catch (erro) {
    return 'adriner-ferreira';
  }
}

function formatarMoedaRecovery(valor) {
  return Number(valor || 0).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  });
}

function formatarUnitarioRecovery(valor) {
  return 'R$ ' + Number(valor || 0).toFixed(3).replace('.', ',');
}

function desformatarMoedaRecovery(valor) {
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

function escaparHTMLRecovery(texto) {
  return String(texto)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}