# Extensão FINI · Catálogo e Pedido (versão 2)

Liga o sistema **Estoque FINI** ao portal de compras da FINI (SULTS), na unidade **70270F | Pátio Petrópolis Shopping**.

- **Atualizar catálogo:** lê **todos** os produtos do portal de uma só vez e confere cada cartão
  (o código do produto no campo de quantidade e na foto precisam ser iguais). Se faltar
  algum produto ou algo vier misturado, nada é gravado.
- **Enviar ao carrinho:** coloca a quantidade de cada produto no carrinho do portal, já no
  múltiplo de venda. Se o produto já estiver no carrinho, a quantidade é **trocada** (não somada).
  **Nunca finaliza o pedido.**

## Por que trocar a versão 1
A versão 1 lia o portal rolando a página. Os cartões são reaproveitados enquanto a página
rola, e em 23/11/2026 isso gravou 30 produtos com nome, preço e foto de outro produto.
A versão 2 pede ao próprio portal uma página com todos os produtos e não rola nada.
O sistema (a partir da V58) recusa a versão 1.

## Instalar (uma vez, no Chrome do Mac)
1. Baixe a pasta `extensao-catalogo-fini` (ou o arquivo .zip e dê dois cliques para descompactar).
2. No Chrome, abra `chrome://extensions`.
3. Ligue **Modo do desenvolvedor** (canto superior direito).
4. Se aparecer a extensão antiga do catálogo FINI, clique em **Remover**.
5. Clique em **Carregar sem compactação** e escolha a pasta `extensao-catalogo-fini`.
6. Recarregue a página do sistema Estoque FINI (Cmd+R).

## Usar
1. Esteja logado no portal FINI no mesmo Chrome.
2. No sistema, aba **Catálogo** › **Atualizar catálogo**. A extensão abre o portal sozinha em outra aba.
3. Para pedir: preencha as quantidades nos cartões e clique em **Enviar ao carrinho FINI**.
   No fim, a aba do carrinho do portal abre para você conferir e finalizar lá.

## Arquivos
- `manifest.json` — configuração da extensão.
- `ponte.js` — roda na página do sistema e conversa com a extensão.
- `background.js` — abre o portal e executa a leitura ou o envio.
- `portal.js` — o que roda dentro do portal (leitura e carrinho).
