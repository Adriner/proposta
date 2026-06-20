<?php

header('Content-Type: application/json; charset=utf-8');

$arquivo =
    dirname(__DIR__) . '/data/vendedores.json';

if (!file_exists($arquivo)) {
    file_put_contents($arquivo, json_encode([], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
}

$entrada =
    json_decode(file_get_contents('php://input'), true);

if (!$entrada || empty($entrada['id']) || empty($entrada['nome'])) {
    http_response_code(400);

    echo json_encode([
        'success' => false,
        'message' => 'Dados do vendedor inválidos.'
    ]);

    exit;
}

$vendedores =
    json_decode(file_get_contents($arquivo), true);

if (!is_array($vendedores)) {
    $vendedores = [];
}

$vendedores =
    array_values(
        array_filter($vendedores, function($item) use ($entrada) {
            return ($item['id'] ?? '') !== $entrada['id'];
        })
    );

$vendedores[] = [
    'id' => $entrada['id'],
    'nome' => $entrada['nome'],
    'cargo' => $entrada['cargo'] ?? '',
    'telefone' => $entrada['telefone'] ?? '',
    'whatsapp' => $entrada['whatsapp'] ?? '',
    'email' => $entrada['email'] ?? '',
    'foto' => $entrada['foto'] ?? ''
];

file_put_contents(
    $arquivo,
    json_encode($vendedores, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE)
);

echo json_encode([
    'success' => true,
    'message' => 'Vendedor salvo com sucesso.',
    'vendedor' => $entrada
]);