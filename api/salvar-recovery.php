<?php
session_start();

require_once __DIR__ . '/auditoria-helper.php';

header('Content-Type: application/json; charset=utf-8');

if (!isset($_SESSION['usuario_logado'])) {
  echo json_encode(['sucesso' => false, 'mensagem' => 'Não autenticado.'], JSON_UNESCAPED_UNICODE);
  exit;
}

$input = json_decode(file_get_contents('php://input'), true);

if (!is_array($input)) {
  echo json_encode(['sucesso' => false, 'mensagem' => 'JSON inválido.'], JSON_UNESCAPED_UNICODE);
  exit;
}

$id = intval($input['id'] ?? 0);

$numeroProposta = trim($input['numeroProposta'] ?? '');
$ano = intval($input['ano'] ?? 0);
$sequencial = intval($input['sequencial'] ?? 0);
$versao = trim($input['versao'] ?? 'v.1');
$status = trim($input['status'] ?? 'Rascunho');

$dataProposta = trim($input['dataProposta'] ?? '');
$validadeProposta = trim($input['validadeProposta'] ?? '');

$clienteId = intval($input['clienteId'] ?? 0);
$logoCliente = trim($input['logoCliente'] ?? '');


$empresa = trim($input['empresa'] ?? '');
$contato = trim($input['contato'] ?? '');
$uf = trim($input['uf'] ?? '');
$modelo = trim($input['modelo'] ?? '');
$quantidade = intval($input['quantidade'] ?? 0);
$valorUnitario = round(floatval($input['valorUnitario'] ?? 0), 3);
$valorTotal = round(floatval($input['valorTotal'] ?? 0), 2);
$prazo = trim($input['prazo'] ?? '');
$certificado = trim($input['certificado'] ?? '');
$alerta = trim($input['alerta'] ?? '');
$observacao = trim($input['observacao'] ?? '');

if ($empresa === '' || $uf === '' || $modelo === '' || $quantidade <= 0) {
  echo json_encode(['sucesso' => false, 'mensagem' => 'Empresa, UF, modelo e quantidade são obrigatórios.'], JSON_UNESCAPED_UNICODE);
  exit;
}

if ($numeroProposta === '') {
  echo json_encode(['sucesso' => false, 'mensagem' => 'Número da proposta não informado.'], JSON_UNESCAPED_UNICODE);
  exit;
}

if ($ano <= 0 || $sequencial <= 0) {
  echo json_encode(['sucesso' => false, 'mensagem' => 'Ano e sequencial da proposta são obrigatórios.'], JSON_UNESCAPED_UNICODE);
  exit;
}

if ($versao === '') {
  $versao = 'v.1';
}

if ($status === '') {
  $status = 'Rascunho';
}

$arquivo = dirname(__DIR__) . '/data/recovery.json';
$pasta = dirname($arquivo);

if (!is_dir($pasta)) {
  mkdir($pasta, 0755, true);
}

if (!file_exists($arquivo)) {
  file_put_contents($arquivo, '[]', LOCK_EX);
}

$conteudo = file_get_contents($arquivo);
$dados = json_decode($conteudo, true);

if (!is_array($dados)) {
  $dados = [];
}

$agora = date('Y-m-d H:i:s');
$idSalvo = $id;

if ($id > 0) {
  $encontrou = false;

  foreach ($dados as &$item) {
    if (intval($item['id'] ?? 0) === $id) {
      $item['numeroProposta'] = $numeroProposta;
      $item['ano'] = $ano;
      $item['sequencial'] = $sequencial;
      $item['versao'] = $versao;
      $item['status'] = $status;

      $item['dataProposta'] = $dataProposta;
	  $item['validadeProposta'] = $validadeProposta;

	  $item['clienteId'] = $clienteId;
	  $item['logoCliente'] = $logoCliente;
      
      
      $item['empresa'] = $empresa;
      $item['contato'] = $contato;
      $item['uf'] = $uf;
      $item['modelo'] = $modelo;
      $item['quantidade'] = $quantidade;
      $item['valorUnitario'] = $valorUnitario;
      $item['valorTotal'] = $valorTotal;
      $item['prazo'] = $prazo;
      $item['certificado'] = $certificado;
      $item['alerta'] = $alerta;
      $item['observacao'] = $observacao;
      $item['atualizadoEm'] = $agora;

      $encontrou = true;
      $idSalvo = $id;

      registrarAuditoria(
        'Recovery',
        'Edição',
        $empresa,
        'Orçamento Recovery atualizado. Proposta ' . $numeroProposta . ' ' . $versao . '.'
      );

      break;
    }
  }

  unset($item);

  if (!$encontrou) {
    echo json_encode(['sucesso' => false, 'mensagem' => 'Recovery não encontrado para edição.'], JSON_UNESCAPED_UNICODE);
    exit;
  }

} else {
  $novoId = 1;

  foreach ($dados as $item) {
    $novoId = max($novoId, intval($item['id'] ?? 0) + 1);
  }

  $idSalvo = $novoId;

  $dados[] = [
    'id' => $novoId,

    'numeroProposta' => $numeroProposta,
    'ano' => $ano,
    'sequencial' => $sequencial,
    'versao' => $versao,
    'status' => $status,
    
    'dataProposta' => $dataProposta,
	'validadeProposta' => $validadeProposta,

	'clienteId' => $clienteId,
	'logoCliente' => $logoCliente,
    

    'empresa' => $empresa,
    'contato' => $contato,
    'uf' => $uf,
    'modelo' => $modelo,
    'quantidade' => $quantidade,
    'valorUnitario' => $valorUnitario,
    'valorTotal' => $valorTotal,
    'prazo' => $prazo,
    'certificado' => $certificado,
    'alerta' => $alerta,
    'observacao' => $observacao,

    'criadoEm' => $agora,
    'atualizadoEm' => $agora
  ];

  registrarAuditoria(
    'Recovery',
    'Cadastro',
    $empresa,
    'Novo orçamento Recovery criado. Proposta ' . $numeroProposta . ' ' . $versao . '.'
  );
}

$salvou = file_put_contents(
  $arquivo,
  json_encode($dados, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE),
  LOCK_EX
);

if ($salvou === false) {
  echo json_encode(['sucesso' => false, 'mensagem' => 'Erro ao gravar o arquivo recovery.json.'], JSON_UNESCAPED_UNICODE);
  exit;
}

echo json_encode([
  'sucesso' => true,
  'mensagem' => 'Recovery salvo com sucesso.',
  'id' => $idSalvo,
  'numeroProposta' => $numeroProposta,
  'ano' => $ano,
  'sequencial' => $sequencial,
  'versao' => $versao,
  'status' => $status
], JSON_UNESCAPED_UNICODE);