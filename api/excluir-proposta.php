<?php
header('Content-Type: application/json; charset=utf-8');

$baseDir = dirname(__DIR__) . '/data/propostas';

$input = file_get_contents('php://input');
$payload = json_decode($input, true);

$id = $payload['id'] ?? '';
$id = preg_replace('/[^a-zA-Z0-9\-_]/', '', $id);

if (!$id) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => 'ID da proposta não informado.'
    ]);
    exit;
}

$arquivo = $baseDir . '/' . $id . '.json';

if (!file_exists($arquivo)) {
    http_response_code(404);
    echo json_encode([
        'success' => false,
        'message' => 'Proposta não encontrada.'
    ]);
    exit;
}

unlink($arquivo);

echo json_encode([
    'success' => true,
    'message' => 'Proposta excluída com sucesso.'
]);