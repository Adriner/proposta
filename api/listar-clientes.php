<?php
session_start();

header('Content-Type: application/json; charset=utf-8');

if (!isset($_SESSION['usuario_logado'])) {
  echo json_encode(['sucesso' => false, 'mensagem' => 'Não autenticado.']);
  exit;
}

$arquivo = dirname(__DIR__) . '/data/clientes.json';

if (!file_exists($arquivo)) {
  file_put_contents($arquivo, '[]');
}

$clientes = json_decode(file_get_contents($arquivo), true);

if (!is_array($clientes)) {
  $clientes = [];
}

echo json_encode([
  'sucesso' => true,
  'clientes' => $clientes
], JSON_UNESCAPED_UNICODE);