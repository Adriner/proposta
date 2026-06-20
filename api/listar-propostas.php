<?php
header('Content-Type: application/json; charset=utf-8');

$baseDir = dirname(__DIR__) . '/data/propostas';

if (!is_dir($baseDir)) {
    echo json_encode([]);
    exit;
}

$arquivos = glob($baseDir . '/*.json');
$propostas = [];

foreach ($arquivos as $arquivo) {
    $json = file_get_contents($arquivo);
    $dados = json_decode($json, true);

    if (!$dados || !is_array($dados)) {
        continue;
    }

    $dadosInternos =
        isset($dados['dados']) && is_array($dados['dados'])
            ? $dados['dados']
            : [];

    $propostas[] = [
        'id' => $dados['id'] ?? basename($arquivo, '.json'),
        'numero' => $dados['numero'] ?? ($dadosInternos['numero'] ?? ''),
        'empresa' => $dados['empresa'] ?? ($dadosInternos['empresa'] ?? ''),
        'contato' => $dados['contato'] ?? ($dadosInternos['contato'] ?? ''),
        'consultor' => $dados['consultorNome'] ?? ($dados['consultor'] ?? ($dadosInternos['consultorNome'] ?? '')),
        'plano' => $dados['plano'] ?? ($dadosInternos['plano'] ?? ''),
        'modeloOferta' => $dados['modeloOferta'] ?? ($dadosInternos['modeloOferta'] ?? ''),
        'status' => $dados['status'] ?? ($dadosInternos['status'] ?? 'Rascunho'),

        'versao' => $dados['versao'] ?? ($dadosInternos['versao'] ?? 'v.1'),
        'versaoAtual' => $dados['versaoAtual'] ?? ($dadosInternos['versaoAtual'] ?? 1),

        'valorLocal' => $dados['valorLocal'] ?? ($dadosInternos['valorLocal'] ?? ''),
        'valorNuvem' => $dados['valorNuvem'] ?? ($dadosInternos['valorNuvem'] ?? ''),
        'implantacao' => $dados['implantacao'] ?? ($dadosInternos['implantacao'] ?? ''),
        'usuarioAdicional' => $dados['usuarioAdicional'] ?? ($dadosInternos['usuarioAdicional'] ?? ''),
        'valorUsuariosAdicionais' => $dados['valorUsuariosAdicionais'] ?? ($dadosInternos['valorUsuariosAdicionais'] ?? 0),

        'data' => $dados['data'] ?? ($dadosInternos['data'] ?? ''),
        'validade' => $dados['validade'] ?? ($dadosInternos['validade'] ?? ''),
        'criadoEm' => $dados['criadoEm'] ?? '',
        'atualizadoEm' => $dados['atualizadoEm'] ?? '',

        'dados' => $dadosInternos
    ];
}

usort($propostas, function ($a, $b) {
    return strcmp($b['criadoEm'], $a['criadoEm']);
});

echo json_encode($propostas, JSON_UNESCAPED_UNICODE);