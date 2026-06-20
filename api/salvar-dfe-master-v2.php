<?php
session_start();

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

$arquivo = dirname(__DIR__) . '/data/dfe-master-v2.json';

foreach ($input as &$item) {
  $item['valorXml'] = round(floatval($item['valorXml'] ?? 0), 3);
  $item['ativo'] = !empty($item['ativo']);
  $item['atualizadoEm'] = date('Y-m-d H:i:s');
}

file_put_contents(
  $arquivo,
  json_encode($input, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE)
);

echo json_encode([
  'sucesso' => true,
  'mensagem' => 'DFe Master V2 salvo com sucesso.'
], JSON_UNESCAPED_UNICODE);