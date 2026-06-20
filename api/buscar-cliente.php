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

$empresa = trim($_GET['empresa'] ?? '');
$cnpj = trim($_GET['cnpj'] ?? '');

$arquivo = dirname(__DIR__) . '/data/clientes.json';

if (!file_exists($arquivo)) {
    file_put_contents($arquivo, '[]');
}

$clientes = json_decode(file_get_contents($arquivo), true);

if (!is_array($clientes)) {
    $clientes = [];
}

$clienteEncontrado = null;

foreach ($clientes as $cliente) {

    if ($cnpj !== '') {

        if (($cliente['cnpj'] ?? '') === $cnpj) {
            $clienteEncontrado = $cliente;
            break;
        }

    } elseif ($empresa !== '') {

        if (
            mb_strtolower(trim($cliente['empresa'] ?? ''))
            ===
            mb_strtolower(trim($empresa))
        ) {
            $clienteEncontrado = $cliente;
            break;
        }
    }
}

echo json_encode([
    'sucesso' => true,
    'encontrado' => $clienteEncontrado !== null,
    'cliente' => $clienteEncontrado
], JSON_UNESCAPED_UNICODE);