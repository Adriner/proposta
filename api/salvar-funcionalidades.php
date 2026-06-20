<?php
header('Content-Type: application/json; charset=utf-8');

$baseDir = dirname(__DIR__) . '/data';
$arquivo = $baseDir . '/funcionalidades.json';

$entrada = file_get_contents('php://input');
$dados = json_decode($entrada, true);

if (!is_array($dados)) {
  http_response_code(400);
  echo json_encode([
    'success' => false,
    'message' => 'JSON inválido.'
  ]);
  exit;
}

if (!is_dir($baseDir)) {
  mkdir($baseDir, 0755, true);
}

$json = json_encode(
  $dados,
  JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES
);

if (file_put_contents($arquivo, $json) === false) {
  http_response_code(500);
  echo json_encode([
    'success' => false,
    'message' => 'Não foi possível salvar funcionalidades.json.'
  ]);
  exit;
}

echo json_encode([
  'success' => true,
  'message' => 'Funcionalidades salvas com sucesso.'
]);