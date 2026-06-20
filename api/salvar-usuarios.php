<?php
session_start();

require_once __DIR__ . '/auditoria-helper.php';

header('Content-Type: application/json; charset=utf-8');

if (!isset($_SESSION['usuario_logado'])) {
  echo json_encode(['sucesso' => false, 'mensagem' => 'Não autenticado.']);
  exit;
}

$usuarioLogado = $_SESSION['usuario_logado'];

if (($usuarioLogado['perfil'] ?? '') !== 'admin') {
  echo json_encode(['sucesso' => false, 'mensagem' => 'Sem permissão para alterar usuários.']);
  exit;
}

$input = json_decode(file_get_contents('php://input'), true);

if (!is_array($input)) {
  echo json_encode(['sucesso' => false, 'mensagem' => 'JSON inválido recebido pela API.']);
  exit;
}

$id = intval($input['id'] ?? 0);
$nome = trim($input['nome'] ?? '');
$email = trim($input['email'] ?? '');
$usuario = trim($input['usuario'] ?? '');
$senha = trim($input['senha'] ?? '');
$perfil = trim($input['perfil'] ?? 'comercial');
$ativo = (bool)($input['ativo'] ?? false);

if ($nome === '' || $email === '' || $usuario === '') {
  echo json_encode(['sucesso' => false, 'mensagem' => 'Nome, e-mail e usuário são obrigatórios.']);
  exit;
}

$dirData = dirname(__DIR__) . '/data';
$arquivo = $dirData . '/usuarios.json';

if (!is_dir($dirData)) {
  echo json_encode(['sucesso' => false, 'mensagem' => 'Pasta /data não encontrada.']);
  exit;
}

if (!file_exists($arquivo)) {
  $criou = file_put_contents($arquivo, "[]");
  if ($criou === false) {
    echo json_encode(['sucesso' => false, 'mensagem' => 'Não foi possível criar usuarios.json. Verifique permissão da pasta /data.']);
    exit;
  }
}

if (!is_writable($arquivo)) {
  echo json_encode(['sucesso' => false, 'mensagem' => 'usuarios.json não tem permissão de escrita.']);
  exit;
}

$conteudo = file_get_contents($arquivo);
$usuarios = json_decode($conteudo, true);

if (!is_array($usuarios)) {
  echo json_encode(['sucesso' => false, 'mensagem' => 'usuarios.json está inválido. Corrija o JSON antes de salvar.']);
  exit;
}

foreach ($usuarios as $u) {
  if (
    strtolower($u['usuario'] ?? '') === strtolower($usuario) &&
    intval($u['id'] ?? 0) !== $id
  ) {
    echo json_encode(['sucesso' => false, 'mensagem' => 'Este usuário já existe.']);
    exit;
  }
}

$agora = date('Y-m-d H:i:s');
$salvou = false;
$acaoAuditoria = '';
$detalhesAuditoria = '';

if ($id > 0) {
  foreach ($usuarios as &$u) {
    if (intval($u['id'] ?? 0) === $id) {

      $perfilAnterior = $u['perfil'] ?? '';
      $ativoAnterior = !empty($u['ativo']) ? 'ativo' : 'inativo';
      $emailAnterior = $u['email'] ?? '';
      $usuarioAnterior = $u['usuario'] ?? '';

      $u['nome'] = $nome;
      $u['email'] = $email;
      $u['usuario'] = $usuario;
      $u['perfil'] = $perfil;
      $u['ativo'] = $ativo;
      $u['atualizadoEm'] = $agora;
      $u['atualizadoPor'] = $usuarioLogado['nome'] ?? 'Sistema';

      if ($senha !== '') {
        $u['senha'] = $senha;
      }

      $ativoNovo = $ativo ? 'ativo' : 'inativo';

      $acaoAuditoria = 'Edição';
      $detalhesAuditoria =
        'Usuário atualizado: ' . $nome .
        ' | Login anterior: ' . $usuarioAnterior .
        ' | Login novo: ' . $usuario .
        ' | E-mail anterior: ' . $emailAnterior .
        ' | E-mail novo: ' . $email .
        ' | Perfil anterior: ' . $perfilAnterior .
        ' | Perfil novo: ' . $perfil .
        ' | Status anterior: ' . $ativoAnterior .
        ' | Status novo: ' . $ativoNovo .
        ($senha !== '' ? ' | Senha alterada' : '');

      $salvou = true;
      break;
    }
  }

  unset($u);

  if (!$salvou) {
    echo json_encode(['sucesso' => false, 'mensagem' => 'Usuário não encontrado para edição.']);
    exit;
  }

} else {
  if ($senha === '') {
    echo json_encode(['sucesso' => false, 'mensagem' => 'Senha obrigatória para novo usuário.']);
    exit;
  }

  $novoId = 1;

  foreach ($usuarios as $u) {
    $novoId = max($novoId, intval($u['id'] ?? 0) + 1);
  }

  $usuarios[] = [
    'id' => $novoId,
    'nome' => $nome,
    'email' => $email,
    'usuario' => $usuario,
    'senha' => $senha,
    'perfil' => $perfil,
    'ativo' => $ativo,
    'criadoEm' => $agora,
    'criadoPor' => $usuarioLogado['nome'] ?? 'Sistema',
    'atualizadoEm' => $agora,
    'atualizadoPor' => $usuarioLogado['nome'] ?? 'Sistema'
  ];

  $acaoAuditoria = 'Cadastro';
  $detalhesAuditoria =
    'Usuário criado: ' . $nome .
    ' | Login: ' . $usuario .
    ' | E-mail: ' . $email .
    ' | Perfil: ' . $perfil .
    ' | Status: ' . ($ativo ? 'ativo' : 'inativo');
}

$jsonFinal = json_encode($usuarios, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);

$resultado = file_put_contents($arquivo, $jsonFinal, LOCK_EX);

if ($resultado === false) {
  echo json_encode(['sucesso' => false, 'mensagem' => 'Falha ao gravar usuarios.json. Verifique permissão do arquivo.']);
  exit;
}

registrarAuditoria(
  'Usuários',
  $acaoAuditoria,
  $usuario,
  $detalhesAuditoria
);

echo json_encode([
  'sucesso' => true,
  'mensagem' => $id > 0 ? 'Usuário atualizado com sucesso.' : 'Usuário criado com sucesso.',
  'arquivo' => $arquivo
]);