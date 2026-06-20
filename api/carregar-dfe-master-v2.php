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

$arquivo = dirname(__DIR__) . '/data/dfe-master-v2.json';

if (!file_exists($arquivo)) {
  file_put_contents($arquivo, json_encode([], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
}

$conteudo = file_get_contents($arquivo);
$dados = json_decode($conteudo, true);

if (!is_array($dados)) {
  $dados = [];
}

echo json_encode([
  'sucesso' => true,
  'dados' => $dados
], JSON_UNESCAPED_UNICODE);