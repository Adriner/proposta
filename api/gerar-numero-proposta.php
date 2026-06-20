<?php
session_start();

header('Content-Type: application/json; charset=utf-8');

$arquivo = dirname(__DIR__) . '/data/propostas/propostas-contador.json';

if (!file_exists($arquivo)) {
  file_put_contents($arquivo, json_encode([
    'ultimoNumero' => 0
  ], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
}

$fp = fopen($arquivo, 'c+');

if (!$fp) {
  echo json_encode([
    'sucesso' => false,
    'mensagem' => 'Não foi possível abrir o contador de propostas.'
  ]);
  exit;
}

flock($fp, LOCK_EX);

$conteudo = stream_get_contents($fp);
$dados = json_decode($conteudo, true);

if (!is_array($dados)) {
  $dados = ['ultimoNumero' => 0];
}

$ultimoNumero = intval($dados['ultimoNumero'] ?? 0);
$novoNumero = $ultimoNumero + 1;

$ano = date('y');
$numeroProposta = $ano . '-' . $novoNumero;

$dados['ultimoNumero'] = $novoNumero;

ftruncate($fp, 0);
rewind($fp);

fwrite($fp, json_encode($dados, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));

fflush($fp);
flock($fp, LOCK_UN);
fclose($fp);

echo json_encode([
  'sucesso' => true,
  'numeroProposta' => $numeroProposta,
  'ano' => intval($ano),
  'sequencial' => $novoNumero
], JSON_UNESCAPED_UNICODE);