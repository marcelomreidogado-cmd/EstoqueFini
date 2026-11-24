# Estoque FINI — guia do projeto

Gestão do quiosque FINI Pátio Petrópolis (franquia de balas): estoque, balas a granel (kg), escala, folha de ponto, compras, meta de itens e vendas diárias.

## Arquivos
- `estoque.html` — o sistema inteiro (~400 KB, arquivo único). Título e `APP_VERSION` no formato `"DD/MM/AAAA · V56_DESCRICAO"`.
- `index.html` — só redireciona para `estoque.html?v=<versão>` (quebra cache). **Ao mudar a versão, atualizar o parâmetro `v` aqui também.**

## Arquitetura
- Sem build. Números usam DM Sans com algarismos tabulares (a DM Mono foi retirada na V56). React 18 UMD via unpkg, escrito com `React.createElement` (sem JSX/Babel). SheetJS 0.18.5 (jsdelivr). Firebase compat 10.12.2 (só Firestore).
- Firebase projeto `ficha-tecnica-burger`. Coleções: `fini_estoque_quiosque`, `fini_balas_kg`, `fini_folha_ponto`, `fini_catalogo_compras`, `fini_vendas_diarias`, `fini_meta_itens`, `fini_escala`, `fini_backups_escala`, `fini_auditoria`.
- Acesso por PIN dentro do app (não usa Firebase Auth).

## Integrações
- **Extensão do Chrome** `extensao-catalogo-fini/` (v2, desde 23/11/2026): lê o catálogo do portal SULTS (`fini.sults.com.br`) e monta o carrinho. Lê tudo de uma vez (`PF('mainDatagridWVar').paginator.setRowsPerPage`), confere o código do cartão (`#input-<id>-jsf`) contra o da foto e devolve `totalPortal`; o carrinho usa `changeQnt<id>RmtCmd()` (DEFINE a quantidade, não soma). O app recusa extensão 1.x e leitura com menos itens que `totalPortal`. Instalação: `extensao-catalogo-fini/LEIA-ME.md`.
- `fini_vendas_diarias/{AAAA-MM}` → `dias.DD.{vendas,tc}` é lido pelo **Contas a Pagar Fini** (repo `contasapagar-fini`) para preencher vendas diárias. Não mudar esse formato sem ajustar lá também.

## Fluxo de trabalho
- Editar → extrair o `<script>` e validar com `node --check` → testar com dados de teste, nunca na coleção real → commit em português.
- Publicação: GitHub Pages da `main` (https://marcelomreidogado-cmd.github.io/EstoqueFini/), automática a cada push (1–2 min). Ao mudar a versão, atualizar `FINI_BUILD`, `APP_VERSION`, o `<title>` e o parâmetro `v` do `index.html`.
- Nunca apagar/sobrescrever coleções do Firestore sem backup.
- Usuário (Marcelo) trabalha em português do Brasil, no Mac, e prefere soluções simples, sem terminal.

## Padrão visual (obrigatório em toda mudança)
Polimento visual feito em 15/11/2026. Para não regredir (o Compras piorou em 16–17/11 por isso):
- **Não colocar estilo solto (`style="..."`) em linhas de tabela, listas ou cartões.** Criar ou reutilizar classes no bloco de CSS do projeto (indicado abaixo). Estilo inline só para valores dinâmicos (cor de loja, largura de barra).
- **Tabelas compactas:** cada linha de produto/cliente/lançamento cabe em ~2 linhas de texto. Controles extras (marcações, botões) ficam pequenos e na mesma linha; detalhes vão para um modal ou para a dica (`title`).
- **Nada passa da largura da tela**, exceto tabelas largas dentro de um contêiner que desliza (com a coluna de nome fixa à esquerda no celular).
- **Celular primeiro:** conferir em 390 px e em 1440 px. No celular: navegação numa faixa/barra única, filtros e chips em faixa que desliza, indicadores em 2 colunas, textos sem cortar no meio da palavra.
- **Números** com algarismos alinhados (`font-variant-numeric: tabular-nums`), sem fonte monoespaçada; valores com sinal não quebram linha.
- Reaproveitar as cores, raios, botões e chips que o sistema já usa — não criar um estilo novo para cada tela.

### Conferência antes de publicar
1. Abrir o sistema com **dados fictícios** e **sem acesso ao banco real** (veja "Como testar o visual" abaixo).
2. Fotografar as telas alteradas em 390 px e 1440 px (Playwright já instalado no ambiente; Chromium em `/opt/pw-browsers`).
3. Medir que `document.documentElement.scrollWidth` não passa da largura da janela em todas as abas.
4. Mostrar ao Marcelo as fotos de **antes e depois** na resposta e dizer o que não foi testado.

### Onde fica o visual / como testar o visual
- CSS no `<style>` do `estoque.html` (fim do bloco: "V56: polimento visual"). Telas em `React.createElement`; seletores da Escala usam `.ce-select`.
- Teste: Playwright com `addInitScript` definindo um `window.firebase` falso (Firestore compat com `collection/doc/get/onSnapshot`), bloqueando `gstatic.com/firebasejs` e servindo React 18 UMD do npm (`npm pack react@18 react-dom@18`); abrir `estoque.html?aba=<id>` para cada aba de `MODS`.
