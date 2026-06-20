<?php
session_start();

header('Content-Type: application/json; charset=utf-8');

if (!isset($_SESSION['usuario_logado'])) {
  echo json_encode([
    'logado' => false
  ]);
  exit;
}

echo json_encode([
  'logado' => true,
  'usuario' => $_SESSION['usuario_logado']
]);