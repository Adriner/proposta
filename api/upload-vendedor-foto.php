<?php

header('Content-Type: application/json');

$diretorio = dirname(__DIR__) . '/assets/vendedores/';

if (!is_dir($diretorio)) {
    mkdir($diretorio, 0777, true);
}

if (
    !isset($_FILES['foto']) ||
    $_FILES['foto']['error'] !== UPLOAD_ERR_OK
) {

    http_response_code(400);

    echo json_encode([
        'success' => false,
        'message' => 'Nenhuma foto enviada.'
    ]);

    exit;
}

$nomeOriginal =
    $_FILES['foto']['name'];

$extensao =
    strtolower(
        pathinfo(
            $nomeOriginal,
            PATHINFO_EXTENSION
        )
    );

$permitidas = [
    'jpg',
    'jpeg',
    'png',
    'webp'
];

if (!in_array($extensao, $permitidas)) {

    http_response_code(400);

    echo json_encode([
        'success' => false,
        'message' => 'Formato inválido.'
    ]);

    exit;
}

$nomeArquivo =
    uniqid('vendedor_') .
    '.' .
    $extensao;

$caminhoCompleto =
    $diretorio .
    $nomeArquivo;

if (
    !move_uploaded_file(
        $_FILES['foto']['tmp_name'],
        $caminhoCompleto
    )
) {

    http_response_code(500);

    echo json_encode([
        'success' => false,
        'message' => 'Erro ao salvar foto.'
    ]);

    exit;
}

echo json_encode([
    'success' => true,
    'arquivo' => 'assets/vendedores/' . $nomeArquivo
]);