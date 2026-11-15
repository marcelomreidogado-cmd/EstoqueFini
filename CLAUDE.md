# Estoque FINI — guia do projeto

Gestão do quiosque FINI Pátio Petrópolis (franquia de balas): estoque, balas a granel (kg), escala, folha de ponto, compras, meta de itens e vendas diárias.

## Arquivos
- `estoque.html` — o sistema inteiro (~400 KB, arquivo único). Título e `APP_VERSION` no formato `"DD/MM/AAAA · V55_DESCRICAO"`.
- `index.html` — só redireciona para `estoque.html?v=<versão>` (quebra cache). **Ao mudar a versão, atualizar o parâmetro `v` aqui também.**

## Arquitetura
- Sem build. React 18 UMD via unpkg, escrito com `React.createElement` (sem JSX/Babel). SheetJS 0.18.5 (jsdelivr). Firebase compat 10.12.2 (só Firestore).
- Firebase projeto `ficha-tecnica-burger`. Coleções: `fini_estoque_quiosque`, `fini_balas_kg`, `fini_folha_ponto`, `fini_catalogo_compras`, `fini_vendas_diarias`, `fini_meta_itens`, `fini_escala`, `fini_backups_escala`, `fini_auditoria`.
- Acesso por PIN dentro do app (não usa Firebase Auth).

## Integrações
- `fini_vendas_diarias/{AAAA-MM}` → `dias.DD.{vendas,tc}` é lido pelo **Contas a Pagar Fini** (repo `contasapagar-fini`) para preencher vendas diárias. Não mudar esse formato sem ajustar lá também.

## Fluxo de trabalho
- Editar → extrair o `<script>` e validar com `node --check` → testar com dados de teste, nunca na coleção real → commit em português.
- Até hoje os envios foram por upload no GitHub ("Add files via upload"). Não há workflow de deploy no repositório.
- Nunca apagar/sobrescrever coleções do Firestore sem backup.
- Usuário (Marcelo) trabalha em português do Brasil, no Mac, e prefere soluções simples, sem terminal.
