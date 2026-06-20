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

if (
    !isset($_FILES['logo']) ||
    $_FILES['logo']['error'] !== UPLOAD_ERR_OK
) {
    echo json_encode([
        'sucesso' => false,
        'mensagem' => 'Nenhum arquivo enviado.'
    ]);
    exit;
}

$pastaDestino = dirname(__DIR__) . '/uploads/clientes/';

if (!is_dir($pastaDestino)) {
    mkdir($pastaDestino, 0755, true);
}

$nomeOriginal = $_FILES['logo']['name'];
$extensao = strtolower(pathinfo($nomeOriginal, PATHINFO_EXTENSION));

$permitidos = ['png', 'jpg', 'jpeg', 'webp'];

if (!in_array($extensao, $permitidos)) {
    echo json_encode([
        'sucesso' => false,
        'mensagem' => 'Formato não permitido.'
    ]);
    exit;
}

$nomeArquivo = uniqid('cliente_', true) . '.' . $extensao;

$caminhoFisico = $pastaDestino . $nomeArquivo;

if (!move_uploaded_file($_FILES['logo']['tmp_name'], $caminhoFisico)) {
    echo json_encode([
        'sucesso' => false,
        'mensagem' => 'Erro ao salvar arquivo.'
    ]);
    exit;
}

$caminhoRelativo =
    'uploads/clientes/' . $nomeArquivo;

echo json_encode([
    'sucesso' => true,
    'arquivo' => $caminhoRelativo
]);