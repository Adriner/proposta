<?php
session_start();

header('Content-Type: application/json; charset=utf-8');

if (!isset($_SESSION['usuario_logado'])) {
  echo json_encode(['sucesso' => false, 'mensagem' => 'Não autenticado.']);
  exit;
}

$arquivo = dirname(__DIR__) . '/data/usuarios.json';

if (!file_exists($arquivo)) {
  echo json_encode(['sucesso' => true, 'usuarios' => []]);
  exit;
}

$usuarios = json_decode(file_get_contents($arquivo), true);

if (!is_array($usuarios)) {
  echo json_encode(['sucesso' => false, 'mensagem' => 'Arquivo de usuários inválido.']);
  exit;
}

foreach ($usuarios as &$usuario) {
  unset($usuario['senha']);
}

echo json_encode([
  'sucesso' => true,
  'usuarios' => $usuarios
]);