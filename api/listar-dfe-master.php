<?php
session_start();

header('Content-Type: application/json; charset=utf-8');

if (!isset($_SESSION['usuario_logado'])) {
  echo json_encode(['sucesso' => false, 'mensagem' => 'Não autenticado.']);
  exit;
}

$arquivo = dirname(__DIR__) . '/data/dfe-master.json';

if (!file_exists($arquivo)) {
  echo json_encode([
    'sucesso' => true,
    'regras' => []
  ]);
  exit;
}

$conteudo = file_get_contents($arquivo);
$regras = json_decode($conteudo, true);

if (!is_array($regras)) {
  echo json_encode([
    'sucesso' => false,
    'mensagem' => 'dfe-master.json está inválido.'
  ]);
  exit;
}

echo json_encode([
  'sucesso' => true,
  'regras' => $regras
], JSON_UNESCAPED_UNICODE);