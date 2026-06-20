<?php

function registrarAuditoria($modulo, $acao, $registro, $detalhes = '') {
  $dirData = dirname(__DIR__) . '/data';
  $arquivo = $dirData . '/auditoria.json';

  if (!is_dir($dirData)) {
    return false;
  }

  if (!file_exists($arquivo)) {
    file_put_contents($arquivo, "[]");
  }

  $auditoria = json_decode(file_get_contents($arquivo), true);

  if (!is_array($auditoria)) {
    $auditoria = [];
  }

  $usuarioLogado = $_SESSION['usuario_logado'] ?? [];

  $novoId = 1;

  foreach ($auditoria as $item) {
    $novoId = max($novoId, intval($item['id'] ?? 0) + 1);
  }

  $auditoria[] = [
    'id' => $novoId,
    'dataHora' => date('Y-m-d H:i:s'),
    'usuario' => $usuarioLogado['nome'] ?? 'Sistema',
    'perfil' => $usuarioLogado['perfil'] ?? '',
    'modulo' => $modulo,
    'acao' => $acao,
    'registro' => $registro,
    'detalhes' => $detalhes
  ];

  file_put_contents(
    $arquivo,
    json_encode($auditoria, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE),
    LOCK_EX
  );

  return true;
}