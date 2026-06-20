<?php
header('Content-Type: application/json; charset=utf-8');

$baseDir = dirname(__DIR__) . '/data/propostas';

if (!is_dir($baseDir)) {
    mkdir($baseDir, 0755, true);
}

$input = file_get_contents('php://input');
$payload = json_decode($input, true);

if (!$payload || empty($payload['numero'])) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => 'Dados inválidos ou número da proposta ausente.'
    ]);
    exit;
}

$numero = trim($payload['numero']);
$empresa = trim($payload['empresa'] ?? '');

$slug = strtolower($numero . '-' . $empresa);
$slug = iconv('UTF-8', 'ASCII//TRANSLIT', $slug);
$slug = preg_replace('/[^a-z0-9]+/', '-', $slug);
$slug = trim($slug, '-');

$arquivo = $baseDir . '/' . $slug . '.json';

if (file_exists($arquivo)) {
    http_response_code(409);
    echo json_encode([
        'success' => false,
        'message' => 'Já existe uma proposta salva com este número.'
    ]);
    exit;
}

$payload['id'] = $slug;
$payload['criadoEm'] = $payload['criadoEm'] ?? date('c');
$payload['atualizadoEm'] = $payload['atualizadoEm'] ?? date('c');

$payload['versaoAtual'] = 1;
$payload['versao'] = 'v.1';

if (
    !isset($payload['historicoVersoes']) ||
    !is_array($payload['historicoVersoes'])
) {
    $payload['historicoVersoes'] = [];
}

if (
    isset($payload['dados']) &&
    is_array($payload['dados'])
) {
    $payload['dados']['versaoAtual'] = 1;
    $payload['dados']['versao'] = 'v.1';
}

file_put_contents(
    $arquivo,
    json_encode($payload, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE)
);

echo json_encode([
    'success' => true,
    'message' => 'Proposta salva com sucesso.',
    'id' => $slug,
    'arquivo' => basename($arquivo)
]);