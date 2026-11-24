// Ponte entre a página do Estoque FINI e a extensão.
// A página manda { fonte: "FINI_CATALOGO_APP", tipo, id, ... } e recebe { fonte: "FINI_CATALOGO_EXTENSAO", id, ok, ... }.
(() => {
  const VERSAO = chrome.runtime.getManifest().version;
  const responder = (id, dados) => window.postMessage({ fonte: "FINI_CATALOGO_EXTENSAO", id, versaoExtensao: VERSAO, ...dados }, window.location.origin);
  window.addEventListener("message", evento => {
    const msg = evento.data;
    if (evento.source !== window || !msg || msg.fonte !== "FINI_CATALOGO_APP" || !msg.id) return;
    if (msg.tipo === "PING") { responder(msg.id, { ok: true }); return; }
    if (!["ATUALIZAR_CATALOGO", "ENVIAR_PEDIDO"].includes(msg.tipo)) { responder(msg.id, { ok: false, codigo: "TIPO_DESCONHECIDO", mensagem: `Pedido desconhecido: ${msg.tipo}` }); return; }
    try {
      chrome.runtime.sendMessage({ tipo: msg.tipo, itens: msg.itens || [] }, resposta => {
        if (chrome.runtime.lastError) { responder(msg.id, { ok: false, codigo: "ERRO_EXTENSAO", mensagem: "A extensão foi atualizada ou recarregada. Recarregue esta página (Cmd+R) e tente de novo." }); return; }
        responder(msg.id, resposta || { ok: false, codigo: "ERRO_EXTENSAO", mensagem: "A extensão não respondeu." });
      });
    } catch (e) {
      responder(msg.id, { ok: false, codigo: "ERRO_EXTENSAO", mensagem: "A extensão foi atualizada ou recarregada. Recarregue esta página (Cmd+R) e tente de novo." });
    }
  });
})();
