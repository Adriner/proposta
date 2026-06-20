<?php
session_start();

require_once __DIR__ . '/auditoria-helper.php';

header('Content-Type: application/json; charset=utf-8');

if (!isset($_SESSION['usuario_logado'])) {
  echo json_encode([
    'sucesso' => false,
    'mensagem' => 'Não autenticado.'
  ]);
  exit;
}

$input = json_decode(file_get_contents('php://input'), true);

if (!is_array($input)) {
  echo json_encode([
    'sucesso' => false,
    'mensagem' => 'JSON inválido.'
  ]);
  exit;
}

$id = intval($input['id'] ?? 0);
$uf = trim($input['uf'] ?? '');
$modelo = trim($input['modelo'] ?? '');
$operacao = trim($input['operacao'] ?? '');
$certificado = trim($input['certificado'] ?? '');
$prazo = trim($input['prazo'] ?? '');
$valor = floatval($input['valor'] ?? 0);
$ativo = (bool)($input['ativo'] ?? true);
$observacao = trim($input['observacao'] ?? '');
$alerta = trim($input['alerta'] ?? '');

if ($uf === '' || $modelo === '') {
  echo json_encode([
    'sucesso' => false,
    'mensagem' => 'UF e Modelo são obrigatórios.'
  ]);
  exit;
}

$arquivo = dirname(__DIR__) . '/data/dfe-master.json';

if (!file_exists($arquivo)) {
  file_put_contents($arquivo, '[]');
}

$dados = json_decode(file_get_contents($arquivo), true);

if (!is_array($dados)) {
  $dados = [];
}

$agora = date('Y-m-d H:i:s');

if ($id > 0) {

  foreach ($dados as &$item) {

    if (intval($item['id']) === $id) {

      $item['uf'] = $uf;
      $item['modelo'] = $modelo;
      $item['operacao'] = $operacao;
      $item['certificado'] = $certificado;
      $item['prazo'] = $prazo;
      $item['valor'] = $valor;
      $item['ativo'] = $ativo;
      $item['observacao'] = $observacao;
      $item['alerta'] = $alerta;
      $item['atualizadoEm'] = $agora;

      registrarAuditoria(
        'DFe Master',
        'Edição',
        $uf . ' - ' . $modelo,
        'Regra alterada'
      );

      break;
    }
  }

} else {

  $novoId = 1;

  foreach ($dados as $item) {
    $novoId = max($novoId, intval($item['id']) + 1);
  }

  $dados[] = [
    'id' => $novoId,
    'uf' => $uf,
    'modelo' => $modelo,
    'operacao' => $operacao,
    'certificado' => $certificado,
    'prazo' => $prazo,
    'valor' => $valor,
    'ativo' => $ativo,
    'observacao' => $observacao,
    'alerta' => $alerta,
    'criadoEm' => $agora
  ];

  registrarAuditoria(
    'DFe Master',
    'Cadastro',
    $uf . ' - ' . $modelo,
    'Nova regra criada'
  );
}

file_put_contents(
  $arquivo,
  json_encode(
    $dados,
    JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE
  ),
  LOCK_EX
);

echo json_encode([
  'sucesso' => true,
  'mensagem' => 'Regra salva com sucesso.'
]);