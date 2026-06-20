<?php
session_start();

header('Content-Type: application/json; charset=utf-8');

$input = json_decode(file_get_contents('php://input'), true);

$usuario = trim($input['usuario'] ?? '');
$senha = trim($input['senha'] ?? '');

$arquivoUsuarios = dirname(__DIR__) . '/data/usuarios.json';

if (!file_exists($arquivoUsuarios)) {
  echo json_encode([
    'sucesso' => false,
    'mensagem' => 'Arquivo de usuários não encontrado.'
  ]);
  exit;
}

$usuarios = json_decode(file_get_contents($arquivoUsuarios), true);

if (!is_array($usuarios)) {
  echo json_encode([
    'sucesso' => false,
    'mensagem' => 'Arquivo de usuários inválido.'
  ]);
  exit;
}

foreach ($usuarios as $u) {
  if (
    strtolower($u['usuario'] ?? '') === strtolower($usuario) &&
    ($u['senha'] ?? '') === $senha &&
    ($u['ativo'] ?? false) === true
  ) {
    $_SESSION['usuario_logado'] = [
      'id' => $u['id'],
      'nome' => $u['nome'],
      'email' => $u['email'],
      'perfil' => $u['perfil']
    ];

    echo json_encode([
      'sucesso' => true,
      'usuario' => $_SESSION['usuario_logado']
    ]);
    exit;
  }
}

echo json_encode([
  'sucesso' => false,
  'mensagem' => 'Usuário ou senha inválidos.'
]);