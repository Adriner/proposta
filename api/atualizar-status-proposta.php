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

if (
    !$payload ||
    empty($payload['id']) ||
    empty($payload['status'])
) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => 'ID da proposta ou status ausente.'
    ]);
    exit;
}

$id = trim($payload['id']);
$id = preg_replace('/[^a-zA-Z0-9\-_]/', '', $id);

$status = trim($payload['status']);

$statusPermitidos = [
    'Rascunho',
    'Enviada',
    'Negociação',
    'Fechada',
    'Perdida'
];

if (!in_array($status, $statusPermitidos, true)) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => 'Status comercial inválido.'
    ]);
    exit;
}

$arquivo = $baseDir . '/' . $id . '.json';

if (!file_exists($arquivo)) {
    http_response_code(404);
    echo json_encode([
        'success' => false,
        'message' => 'Proposta não encontrada para atualização de status.'
    ]);
    exit;
}

$dadosAtuais = json_decode(
    file_get_contents($arquivo),
    true
);

if (!$dadosAtuais || !is_array($dadosAtuais)) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Não foi possível ler os dados atuais da proposta.'
    ]);
    exit;
}

$dadosAtuais['status'] = $status;
$dadosAtuais['atualizadoEm'] = date('c');

if (
    isset($dadosAtuais['dados']) &&
    is_array($dadosAtuais['dados'])
) {
    $dadosAtuais['dados']['status'] = $status;
}

$gravou = file_put_contents(
    $arquivo,
    json_encode(
        $dadosAtuais,
        JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE
    )
);

if ($gravou === false) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Não foi possível gravar o novo status da proposta.'
    ]);
    exit;
}

echo json_encode([
    'success' => true,
    'message' => 'Status comercial atualizado com sucesso.',
    'id' => $id,
    'status' => $status,
    'arquivo' => basename($arquivo)
]);