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

$input = json_decode(file_get_contents('php://input'), true);

if (!is_array($input)) {
    echo json_encode([
        'sucesso' => false,
        'mensagem' => 'JSON inválido.'
    ]);
    exit;
}

$id = intval($input['id'] ?? 0);

$empresa = trim($input['empresa'] ?? '');
$cnpj = trim($input['cnpj'] ?? '');
$contato = trim($input['contato'] ?? '');
$email = trim($input['email'] ?? '');
$telefone = trim($input['telefone'] ?? '');
$logoCliente = trim($input['logoCliente'] ?? '');

if ($empresa === '') {
    echo json_encode([
        'sucesso' => false,
        'mensagem' => 'Empresa é obrigatória.'
    ]);
    exit;
}

$arquivo = dirname(__DIR__) . '/data/clientes.json';

if (!file_exists($arquivo)) {
    file_put_contents($arquivo, '[]');
}

$clientes = json_decode(file_get_contents($arquivo), true);

if (!is_array($clientes)) {
    $clientes = [];
}

$agora = date('Y-m-d H:i:s');
$clienteIdRetorno = 0;
$encontrou = false;

if ($id > 0) {

    foreach ($clientes as &$cliente) {

        if (intval($cliente['id'] ?? 0) === $id) {

            $cliente['empresa'] = $empresa;
            $cliente['cnpj'] = $cnpj;
            $cliente['contato'] = $contato;
            $cliente['email'] = $email;
            $cliente['telefone'] = $telefone;

            if ($logoCliente !== '') {
                $cliente['logoCliente'] = $logoCliente;
            }

            $cliente['atualizadoEm'] = $agora;

            $clienteIdRetorno = intval($cliente['id'] ?? 0);
            $encontrou = true;

            break;
        }
    }

    unset($cliente);

    if (!$encontrou) {
        echo json_encode([
            'sucesso' => false,
            'mensagem' => 'Cliente não encontrado para edição.'
        ]);
        exit;
    }

} else {

    foreach ($clientes as &$cliente) {

        if (
            mb_strtolower(trim($cliente['empresa'] ?? ''))
            ===
            mb_strtolower($empresa)
        ) {

            $cliente['cnpj'] = $cnpj;
            $cliente['contato'] = $contato;
            $cliente['email'] = $email;
            $cliente['telefone'] = $telefone;

            if ($logoCliente !== '') {
                $cliente['logoCliente'] = $logoCliente;
            }

            $cliente['atualizadoEm'] = $agora;

            $clienteIdRetorno = intval($cliente['id'] ?? 0);
            $encontrou = true;

            break;
        }
    }

    unset($cliente);

    if (!$encontrou) {

        $novoId = 1;

        foreach ($clientes as $cliente) {
            $novoId = max(
                $novoId,
                intval($cliente['id'] ?? 0) + 1
            );
        }

        $clienteIdRetorno = $novoId;

        $clientes[] = [
            'id' => $novoId,
            'empresa' => $empresa,
            'cnpj' => $cnpj,
            'contato' => $contato,
            'email' => $email,
            'telefone' => $telefone,
            'logoCliente' => $logoCliente,
            'criadoEm' => $agora,
            'atualizadoEm' => $agora
        ];
    }
}

file_put_contents(
    $arquivo,
    json_encode(
        $clientes,
        JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE
    ),
    LOCK_EX
);

echo json_encode([
    'sucesso' => true,
    'mensagem' => 'Cliente salvo com sucesso.',
    'clienteId' => $clienteIdRetorno
], JSON_UNESCAPED_UNICODE);