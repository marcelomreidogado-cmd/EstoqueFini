const UNIDADE = "70270F";
const PORTAL_PRODUTOS = "https://fini.sults.com.br/comercial/compras/produto?ctx=compras-list&u=272";
const PORTAL_CARRINHO = "https://fini.sults.com.br/comercial/compras/carrinho";

function esperarCarregar(tabId, limiteMs = 60000) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => { chrome.tabs.onUpdated.removeListener(ouvir); reject(Object.assign(new Error("O portal FINI demorou para abrir."), { codigo: "PORTAL_NAO_ABERTO" })); }, limiteMs);
    function ouvir(id, info) {
      if (id === tabId && info.status === "complete") { clearTimeout(timer); chrome.tabs.onUpdated.removeListener(ouvir); resolve(); }
    }
    chrome.tabs.onUpdated.addListener(ouvir);
  });
}

// Abre (ou reaproveita) uma aba do portal SEMPRE na lista de produtos, sem filtros, para a leitura sair completa.
async function abrirPortal() {
  const abertas = await chrome.tabs.query({ url: "https://fini.sults.com.br/*" });
  let aba = abertas[0];
  if (aba) await chrome.tabs.update(aba.id, { url: PORTAL_PRODUTOS });
  else aba = await chrome.tabs.create({ url: PORTAL_PRODUTOS, active: false });
  await esperarCarregar(aba.id);
  const atual = await chrome.tabs.get(aba.id);
  if (!String(atual.url || "").includes("/comercial/compras/produto")) {
    await chrome.tabs.update(aba.id, { active: true });
    throw Object.assign(new Error("Faça login no portal FINI na aba que foi aberta e tente de novo."), { codigo: "PORTAL_SEM_LOGIN" });
  }
  return aba.id;
}

// Carrega portal.js na página do portal (as duas funções ficam disponíveis lá) e chama a pedida.
async function rodarNoPortal(tabId, nomeFuncao, args) {
  await chrome.scripting.executeScript({ target: { tabId }, world: "MAIN", files: ["portal.js"] });
  const [resultado] = await chrome.scripting.executeScript({ target: { tabId }, world: "MAIN", func: (nome, argumentos) => window[nome](...argumentos), args: [nomeFuncao, args] });
  return resultado?.result || { ok: false, codigo: "ERRO_EXTENSAO", mensagem: "O portal não devolveu resposta." };
}

async function tratar(msg) {
  if (msg.tipo === "ATUALIZAR_CATALOGO") {
    const tabId = await abrirPortal();
    return rodarNoPortal(tabId, "finiLerCatalogoPortal", [UNIDADE]);
  }
  if (msg.tipo === "ENVIAR_PEDIDO") {
    const tabId = await abrirPortal();
    const resposta = await rodarNoPortal(tabId, "finiEnviarPedidoPortal", [msg.itens || [], UNIDADE]);
    if (resposta.ok && resposta.adicionados?.length) await chrome.tabs.update(tabId, { url: PORTAL_CARRINHO, active: true });
    return resposta;
  }
  return { ok: false, codigo: "TIPO_DESCONHECIDO", mensagem: "Pedido desconhecido." };
}

chrome.runtime.onMessage.addListener((msg, _remetente, responder) => {
  tratar(msg).then(responder).catch(e => responder({ ok: false, codigo: e.codigo || "ERRO_EXTENSAO", mensagem: e.message || String(e) }));
  return true;
});
