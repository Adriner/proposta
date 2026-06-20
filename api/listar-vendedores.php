<?php

header('Content-Type: application/json; charset=utf-8');

$arquivo =
    dirname(__DIR__) . '/data/vendedores.json';

if (!file_exists($arquivo)) {
    file_put_contents($arquivo, json_encode([], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
}

$conteudo =
    file_get_contents($arquivo);

$vendedores =
    json_decode($conteudo, true);

if (!is_array($vendedores)) {
    $vendedores = [];
}

echo json_encode(
    $vendedores,
    JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE
);