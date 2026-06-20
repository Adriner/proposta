## Guia rápido para iniciar o projeto

Este é um passo a passo simples para começar a trabalhar neste projeto. Ele garante que você comece sempre na branch de desenvolvimento e, quando pronto, envie as mudanças para a branch principal.

Pré-requisitos:
- Ter o Git configurado e acesso ao repositório remoto.

1) Entrar na pasta do projeto

```bash
cd caminho/para/o/projeto
```

2) Ir para a branch de desenvolvimento (dev)

Neste repositório a branch de desenvolvimento chama-se `develop`. Caso a sua branch principal se chame `main`, substitua `principal` por `main` nas instruções abaixo.

```bash
# trocar para develop
git checkout develop

# pegar atualizações do remoto
git pull origin develop
```

3) Trabalhar nas alterações

- Faça as mudanças nos arquivos usando seu editor.
- Salve os arquivos.

4) Salvar (commit) e enviar (push) para a branch `develop`

```bash
# adicionar alterações
git add .

# criar commit com mensagem curta e explicativa
git commit -m "Descrição curta das mudanças"

# enviar para o remoto (branch develop)
git push origin develop
```

5) Publicar as mudanças na branch principal

Opção A — Via Pull Request (recomendado):
- Abra o repositório no GitHub e crie um Pull Request (PR) de `develop` para a branch principal (`principal` ou `main`).
- Peça revisão e faça o merge quando aprovado.

Opção B — Via linha de comando (usuários com acesso direto):

```bash
# atualizar a branch principal local
git checkout principal
git pull origin principal

# mesclar develop em principal
git merge develop

# enviar principal atualizada
git push origin principal

# voltar para develop para continuar trabalhando
git checkout develop
```

6) Dicas rápidas
- Sempre puxe (`git.pull`) antes de começar a trabalhar para evitar conflitos.
- Use mensagens de commit claras e curtas.
- Se o repositório usar `main` em vez de `principal`, troque o nome conforme necessário.

Se quiser, eu posso adicionar esse arquivo diretamente no repositório e comitar por você.
