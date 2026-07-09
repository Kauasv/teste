import { db, collection, getDocs } from "./firebase.js";

const produtosDiv = document.getElementById("produtos");
const categoriasDiv = document.getElementById("categorias");
const buscaInput = document.getElementById("busca");

let produtos = [];
let produtoAtual = null;
let quantidade = 1;

// Carrega o carrinho salvo no localStorage ou inicia vazio
let carrinho = JSON.parse(localStorage.getItem("carrinho_confeitaria")) || [];

async function carregarProdutos() {
    const snapshot = await getDocs(collection(db, "produtos"));
    produtos = [];
    snapshot.forEach(doc => {
        produtos.push({ id: doc.id, ...doc.data() });
    });
    criarCategorias();
    renderizar(produtos);
    atualizarContadorBadge();
}

function renderizar(lista) {
    produtosDiv.innerHTML = "";
    lista.forEach(produto => {
        const preco = Number(produto.preco).toFixed(2).replace(".", ",");
        produtosDiv.innerHTML += `
            <div class="produto-item" onclick="abrirProduto('${produto.id}')">
                <img src="${produto.imagem}" alt="${produto.nome}" onerror="this.src='img/sem-imagem.png'">
                <div class="produto-info">
                    <h3>${produto.nome}</h3>
                    <p>${produto.descricao}</p>
                    <strong>R$ ${preco}</strong>
                </div>
            </div>
        `;
    });
}

function criarCategorias() {
    const categorias = [...new Set(produtos.map(p => p.categoria))];
    categoriasDiv.innerHTML = `<button onclick="filtrarCategoria('Todos')">Todos</button>`;
    categorias.forEach(cat => {
        categoriasDiv.innerHTML += `<button onclick="filtrarCategoria('${cat}')">${cat}</button>`;
    });
}

window.filtrarCategoria = (categoria) => {
    if (categoria === "Todos") { renderizar(produtos); return; }
    const filtrados = produtos.filter(p => p.categoria === categoria);
    renderizar(filtrados);
};

buscaInput.addEventListener("input", (e) => {
    const termo = e.target.value.toLowerCase();
    const filtrados = produtos.filter(p => p.nome.toLowerCase().includes(termo));
    renderizar(filtrados);
});

window.abrirProduto = (id) => {
    const produto = produtos.find(p => p.id === id);
    produtoAtual = produto;
    quantidade = 1;

    document.getElementById("qtd").innerHTML = quantidade;
    document.getElementById("modalImagem").src = produto.imagem;
    document.getElementById("modalNome").innerHTML = produto.nome;
    document.getElementById("modalDescricao").innerHTML = produto.descricao;

    const lista = document.getElementById("listaAcrescimos");
    lista.innerHTML = "";

    if (produto.acrescimos) {
        produto.acrescimos.forEach(item => {
            lista.innerHTML += `
                <label>
                    <input type="checkbox" class="adicional" value="${item.preco}" data-nome="${item.nome}" onchange="atualizarTotal()">
                    ${item.nome} (+ R$ ${Number(item.preco).toFixed(2).replace(".", ",")})
                </label>
            `;
        });
    }
    atualizarTotal();
    document.getElementById("modal").style.display = "flex";
};

window.fecharModal = () => { document.getElementById("modal").style.display = "none"; };

window.aumentarQtd = () => { quantidade++; document.getElementById("qtd").innerHTML = quantidade; atualizarTotal(); };
window.diminuirQtd = () => { if (quantidade > 1) { quantidade--; document.getElementById("qtd").innerHTML = CabecalhoQtd(); } };
function CabecalhoQtd() { return quantidade; }

function atualizarTotal() {
    if (!produtoAtual) return;
    let total = Number(produtoAtual.preco);
    document.querySelectorAll(".adicional:checked").forEach(item => { total += Number(item.value); });
    total = total * quantidade;
    document.getElementById("totalProduto").innerHTML = "R$ " + total.toFixed(2).replace(".", ",");
}
window.atualizarTotal = atualizarTotal;

/* ========================================================
   LOGICA DO CARRINHO (LOCALSTORAGE & OPERAÇÕES)
======================================================== */

function salvarCarrinho() {
    localStorage.setItem("carrinho_confeitaria", JSON.stringify(carrinho));
    atualizarContadorBadge();
}

function atualizarContadorBadge() {
    const totalItens = carrinho.reduce((soma, item) => soma + item.quantidade, 0);
    document.getElementById("contador-carrinho").innerHTML = totalItens;
}

window.adicionarCarrinho = () => {
    if (!produtoAtual) return;

    let adicionaisEscolhidos = [];
    document.querySelectorAll(".adicional:checked").forEach(item => {
        adicionaisEscolhidos.push({
            nome: item.getAttribute("data-nome"),
            preco: Number(item.value)
        });
    });

    let precoBase = Number(produtoAtual.preco);
    let precoAdicionais = adicionaisEscolhidos.reduce((soma, item) => soma + item.preco, 0);
    let precoUnitarioTotal = precoBase + precoAdicionais;

    // Criamos uma chave para diferenciar produtos iguais com adicionais diferentes
    const strAdicionais = adicionaisEscolhidos.map(a => a.nome).sort().join(",");
    const itemChave = `${produtoAtual.id}_${strAdicionais}`;

    // Verifica se já existe exatamente essa combinação no carrinho
    const itemExistente = carrinho.find(item => item.chave === itemChave);

    if (itemExistente) {
        itemExistente.quantidade += quantidade;
        itemExistente.totalItem = itemExistente.quantidade * itemExistente.precoUnitario;
    } else {
        carrinho.push({
            chave: itemChave,
            id: produtoAtual.id,
            nome: produtoAtual.nome,
            quantidade: quantidade,
            precoUnitario: precoUnitarioTotal,
            totalItem: precoUnitarioTotal * quantidade,
            adicionais: adicionaisEscolhidos
        });
    }

    salvarCarrinho();
    fecharModal();
};

/* ========================================================
   MODAL DE CHECKOUT / DETALHES DO PEDIDO
======================================================== */

window.abrirCheckout = () => {
    renderizarItensCheckout();
    document.getElementById("modalCheckout").style.display = "flex";
};

window.fecharCheckout = () => {
    document.getElementById("modalCheckout").style.display = "none";
};

function renderizarItensCheckout() {
    const listaContainer = document.getElementById("itens-carrinho-lista");
    listaContainer.innerHTML = "";
    let totalGeral = 0;

    if (carrinho.length === 0) {
        listaContainer.innerHTML = `<p class="carrinho-vazio">Seu carrinho está vazio 😢</p>`;
        document.getElementById("total-geral-checkout").innerHTML = "R$ 0,00";
        return;
    }

    carrinho.forEach((item, index) => {
        totalGeral += item.totalItem;
        let txtAdicionais = item.adicionais.map(a => a.nome).join(", ");
        if (txtAdicionais) txtAdicionais = `<small>Adicionais: ${txtAdicionais}</small>`;

        listaContainer.innerHTML += `
            <div class="item-checkout-linha">
                <div class="item-checkout-info">
                    <h4>${item.nome}</h4>
                    ${txtAdicionais}
                    <span>R$ ${item.totalItem.toFixed(2).replace(".", ",")}</span>
                </div>
                <div class="item-checkout-acoes">
                    <div class="qtd-checkout-controle">
                        <button onclick="alterarQtdCheckout(${index}, -1)">-</button>
                        <span>${item.quantidade}</span>
                        <button onclick="alterarQtdCheckout(${index}, 1)">+</button>
                    </div>
                    <button class="btn-remover-item" onclick="removerItemCheckout(${index})">🗑️</button>
                </div>
            </div>
        `;
    });

    document.getElementById("total-geral-checkout").innerHTML = "R$ " + totalGeral.toFixed(2).replace(".", ",");
}

window.alterarQtdCheckout = (index, valor) => {
    carrinho[index].quantidade += valor;
    if (carrinho[index].quantidade <= 0) {
        carrinho.splice(index, 1);
    } else {
        carrinho[index].totalItem = carrinho[index].quantidade * carrinho[index].precoUnitario;
    }
    salvarCarrinho();
    renderizarItensCheckout();
};

window.removerItemCheckout = (index) => {
    carrinho.splice(index, 1);
    salvarCarrinho();
    renderizarItensCheckout();
};

window.alternarFormulario = () => {
    const tipoEnvio = document.querySelector('input[name="tipoEnvio"]:checked').value;
    const camposEntrega = document.getElementById("campos-entrega");
    
    if (tipoEnvio === "entrega") {
        camposEntrega.style.display = "block";
        document.getElementById("cliente-cep").required = true;
        document.getElementById("cliente-endereco").required = true;
    } else {
        camposEntrega.style.display = "none";
        document.getElementById("cliente-cep").required = false;
        document.getElementById("cliente-endereco").required = false;
    }
};

/* ========================================================
   DISPARO FINAL PARA O WHATSAPP
======================================================== */

window.finalizarPedido = () => {
    if (carrinho.length === 0) { alert("Adicione itens antes de finalizar!"); return; }

    const nome = document.getElementById("cliente-nome").value;
    const telefone = document.getElementById("cliente-telefone").value;
    const tipoEnvio = document.querySelector('input[name="tipoEnvio"]:checked').value;
    const pagamento = document.getElementById("cliente-pagamento").value;

    let msg = `🍰 *NOVO PEDIDO - Confeitaria Teste* 🍰\n\n`;
    msg += `👤 *Cliente:* ${nome}\n`;
    msg += `📞 *Contato:* ${telefone}\n`;
    msg += `📦 *Tipo:* ${tipoEnvio === "entrega" ? "🛵 Entrega" : "🛍️ Retirada no Local"}\n\n`;

    if (tipoEnvio === "entrega") {
        const cep = document.getElementById("cliente-cep").value;
        const endereco = document.getElementById("cliente-endereco").value;
        msg += `📍 *Endereço:* ${endereco}\n`;
        msg += `📮 *CEP:* ${cep}\n\n`;
    }

    msg += `🛒 *PRODUTOS:*\n`;
    let totalGeral = 0;

    carrinho.forEach(item => {
        msg += `• *${item.quantidade}x ${item.nome}*\n`;
        if (item.adicionais.length > 0) {
            msg += `  _Adicionais:_ ${item.adicionais.map(a => a.nome).join(", ")}\n`;
        }
        msg += `  _Preço:_ R$ ${item.totalItem.toFixed(2).replace(".", ",")}\n\n`;
        totalGeral += item.totalItem;
    });

    msg += `💳 *Forma de Pagamento:* ${pagamento}\n`;
    msg += `💰 *TOTAL DO PEDIDO:* R$ ${totalGeral.toFixed(2).replace(".", ",")}`;

    // Insira o número do whatsapp da sua loja aqui (DDI + DDD + Numero)
    const numeroLoja = "5531920027515"; 
    
    // Abre a API do WhatsApp
    const url = `https://api.whatsapp.com/send?phone=${numeroLoja}&text=${encodeURIComponent(msg)}`;
    
    // Opcional: Limpar carrinho após envio com sucesso
    carrinho = [];
    salvarCarrinho();
    fecharCheckout();
    
    window.open(url, "_blank");
};

// Inicialização
carregarProdutos();