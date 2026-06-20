<?php
session_start();

header('Content-Type: application/json; charset=utf-8');

if (!isset($_SESSION['usuario_logado'])) {
  echo json_encode(['sucesso' => false, 'mensagem' => 'Não autenticado.']);
  exit;
}

$arquivo = dirname(__DIR__) . '/data/recovery.json';

if (!file_exists($arquivo)) {
  echo json_encode([
    'sucesso' => true,
    'recovery' => []
  ]);
  exit;
}

$conteudo = file_get_contents($arquivo);
$recovery = json_decode($conteudo, true);

if (!is_array($recovery)) {
  echo json_encode([
    'sucesso' => false,
    'mensagem' => 'recovery.json está inválido.'
  ]);
  exit;
}

echo json_encode([
  'sucesso' => true,
  'recovery' => $recovery
], JSON_UNESCAPED_UNICODE);