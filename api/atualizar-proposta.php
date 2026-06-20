<?php
header('Content-Type: application/json; charset=utf-8');

$baseDir = dirname(__DIR__) . '/data/propostas';

if (!is_dir($baseDir)) {
    http_response_code(404);
    echo json_encode([
        'success' => false,
        'message' => 'Diretório de propostas não encontrado.'
    ]);
    exit;
}

$input = file_get_contents('php://input');
$payload = json_decode($input, true);

if (!$payload || empty($payload['id'])) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => 'Dados inválidos ou ID da proposta ausente.'
    ]);
    exit;
}

$id = trim($payload['id']);
$id = preg_replace('/[^a-zA-Z0-9\-_]/', '', $id);

$arquivo = $baseDir . '/' . $id . '.json';

if (!file_exists($arquivo)) {
    http_response_code(404);
    echo json_encode([
        'success' => false,
        'message' => 'Proposta não encontrada para atualização.'
    ]);
    exit;
}

$dadosAtuais = json_decode(
    file_get_contents($arquivo),
    true
);

if (!$dadosAtuais) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Não foi possível ler os dados atuais da proposta.'
    ]);
    exit;
}

$payload['id'] = $id;
$payload['criadoEm'] = $dadosAtuais['criadoEm'] ?? ($payload['criadoEm'] ?? date('c'));
$payload['atualizadoEm'] = date('c');

file_put_contents(
    $arquivo,
    json_encode($payload, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE)
);

echo json_encode([
    'success' => true,
    'message' => 'Proposta atualizada com sucesso.',
    'id' => $id,
    'arquivo' => basename($arquivo)
]);