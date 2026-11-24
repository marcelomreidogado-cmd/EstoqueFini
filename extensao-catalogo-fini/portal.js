// Funções executadas DENTRO da página do portal FINI (SULTS), no mesmo contexto do site.
// Cada função precisa ser independente (o Chrome copia só o corpo dela para a página).

// Lê TODOS os produtos de uma vez: pede ao portal uma página com todos os cartões
// (em vez de rolar/paginar, que era o que misturava nome, preço e foto entre produtos).
async function finiLerCatalogoPortal(unidadeEsperada) {
  const esperar = ms => new Promise(r => setTimeout(r, ms));
  const falha = (codigo, mensagem) => ({ ok: false, codigo, mensagem });
  const grade = () => window.PrimeFaces && PrimeFaces.widgets && PrimeFaces.widgets.mainDatagridWVar;
  for (let i = 0; i < 60 && !grade(); i++) await esperar(250);
  if (!grade()) {
    const semLogin = /login|entrar|acesso/i.test(location.pathname + " " + document.title) || !!document.querySelector("input[type=password]");
    return semLogin ? falha("PORTAL_SEM_LOGIN", "Faça login no portal FINI neste Chrome e tente de novo.") : falha("PORTAL_NAO_ABERTO", "A lista de produtos do portal não abriu. Abra Compras › Produtos no portal e tente de novo.");
  }
  const textoUnidade = (document.body.innerText.match(/Comprando para a unidade:?\s*([^\n]+)/i) || [])[1] || "";
  if (!textoUnidade) return falha("UNIDADE_NAO_IDENTIFICADA", "Não consegui ler a unidade selecionada no portal. Confira se está em 70270F | Pátio Petrópolis Shopping.");
  if (unidadeEsperada && !textoUnidade.includes(unidadeEsperada)) return falha("UNIDADE_INCORRETA", `O portal está comprando para "${textoUnidade.trim()}". Troque para ${unidadeEsperada} | Pátio Petrópolis Shopping e tente de novo.`);

  const w = grade(), total = Number(w.cfg?.paginator?.rowCount || 0);
  const ajaxLivre = () => !window.PrimeFaces?.ajax?.Queue || PrimeFaces.ajax.Queue.isEmpty();
  const cartoes = () => [...document.querySelectorAll(".ui-datagrid-column")].filter(c => c.querySelector('[id^="input-"][id$="-jsf"]'));
  if (total && cartoes().length < total) {
    w.paginator.setRowsPerPage(Math.max(total, 500));
    for (let i = 0; i < 240 && (cartoes().length < total || !ajaxLivre()); i++) await esperar(500);
  }
  const lista = cartoes();
  if (total && lista.length < total) return falha("LEITURA_INCOMPLETA", `O portal mostrou ${lista.length} de ${total} produtos. Nada foi alterado; tente de novo.`);

  const numero = t => Number(String(t || "").replace(/[^\d,]/g, "").replace(",", "."));
  const produtos = [], descartados = [];
  for (const c of lista) {
    const jsf = c.querySelector('[id^="input-"][id$="-jsf"]');
    const id = (jsf.id.match(/^input-(\d+)-jsf$/) || [])[1];
    const img = c.querySelector("img.comercial-compras-produto-card-image") || c.querySelector('img[src*="ComercialProduto/"]');
    const src = img ? String(img.getAttribute("src") || "").split("?")[0] : "";
    const idFoto = (src.match(/ComercialProduto\/(\d+)\//) || [])[1] || null;
    const nome = (c.querySelector(".info-produto-title")?.innerText || "").trim();
    const referencia = ([...c.querySelectorAll("label")].map(l => l.innerText.trim()).find(t => /^Ref\./i.test(t)) || "").replace(/^Ref\.\s*/i, "");
    const categoria = (c.querySelector(".comercial-compras-produto-badge")?.innerText || "").trim();
    const precoTxt = [...c.querySelectorAll("span")].map(s => s.innerText.trim()).find(t => /^R\$\s*[\d.,]+$/.test(t)) || "";
    const passo = Number(c.querySelector(`#input-${id}`)?.getAttribute("step") || 1);
    // Só o aviso do portal "Vendido em múltiplos de N" conta (o nome de alguns produtos fala em "múltiplo de 30" da caixa, mas ali a compra é por caixa).
    const multiploTxt = (c.innerText.match(/Vendido em m[uú]ltiplos de\s*([\d.]+)/i) || [])[1];
    const multiplo = multiploTxt ? String(Number(multiploTxt.replace(/\./g, ""))) : passo > 1 ? String(passo) : "";
    const preco = numero(precoTxt);
    // Conferência por cartão: o código do campo de quantidade e o da foto têm de ser o mesmo produto.
    if (!id || !nome || !(preco > 0) || (idFoto && idFoto !== id)) { descartados.push({ id, idFoto, nome }); continue; }
    produtos.push({ id, nome, categoria, referencia, preco, imagem: src.startsWith("http") ? src : (src ? new URL(src, location.href).href : ""), multiplo, disponivelCompra: true });
  }
  const ids = new Set(produtos.map(p => p.id));
  if (ids.size !== produtos.length) return falha("LEITURA_MISTURADA", "Apareceram produtos repetidos na leitura. Nada foi alterado; tente de novo.");
  return { ok: true, produtos, totalPortal: total || lista.length, descartados, unidade: textoUnidade.trim(), lidoEm: new Date().toISOString() };
}

// Coloca no carrinho cada item { id, quantidade, multiplo }. No portal, o seletor de quantidade do cartão
// já grava a quantidade no carrinho (testado em 23/11/2026): o sistema chama o mesmo comando do portal,
// e a quantidade é DEFINIDA (não somada) — mandar de novo não duplica. Não finaliza o pedido.
async function finiEnviarPedidoPortal(itens, unidadeEsperada) {
  const esperar = ms => new Promise(r => setTimeout(r, ms));
  const leitura = await finiLerCatalogoPortal(unidadeEsperada); // todos os cartões na tela e unidade certa
  if (!leitura.ok) return leitura;
  const porId = new Map(leitura.produtos.map(p => [p.id, p]));
  const ajaxLivre = async () => { for (let i = 0; i < 80; i++) { if (!window.PrimeFaces?.ajax?.Queue || PrimeFaces.ajax.Queue.isEmpty()) return true; await esperar(250); } return false; };
  const adicionados = [], indisponiveis = [], falhas = [];
  for (const item of itens || []) {
    const id = String(item.id), produto = porId.get(id), comando = window[`changeQnt${id}RmtCmd`];
    if (!produto || !document.getElementById(`input-${id}-jsf`) || typeof comando !== "function") { indisponiveis.push({ id, nome: item.nome, motivo: "Produto não está à venda no portal agora" }); continue; }
    // O portal aceita quantidade fora do múltiplo; arredonda aqui para cima para não errar o pedido.
    const multiplo = Math.max(1, Math.round(Number(produto.multiplo || item.multiplo) || 1));
    const pedida = Math.max(0, Math.floor(Number(item.quantidade) || 0));
    const quantidade = pedida ? Math.ceil(pedida / multiplo) * multiplo : 0;
    if (!quantidade) continue;
    document.getElementById(`input-${id}-jsf`).value = String(quantidade);
    comando();
    await esperar(200);
    const terminou = await ajaxLivre();
    await esperar(150);
    const confirmado = document.getElementById(`input-${id}-jsf`)?.value; // o portal redesenha o campo com o valor gravado
    if (terminou && String(confirmado) === String(quantidade)) adicionados.push({ id, quantidade });
    else falhas.push({ id, nome: item.nome || produto.nome, motivo: terminou ? `O portal ficou com ${confirmado || 0} em vez de ${quantidade}` : "O portal não respondeu a tempo" });
  }
  return { ok: true, adicionados, indisponiveis, falhas };
}
