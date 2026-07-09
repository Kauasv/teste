import { db, collection, addDoc, getDocs, deleteDoc, doc } from "./firebase.js";

window.adicionarAcrescimo = () => {
    const lista = document.getElementById("listaAcrescimos");

    lista.innerHTML += `
        <div class="acrescimo">
            <input class="nomeAcrescimo" placeholder="Nome do acréscimo">
            <input class="precoAcrescimo" type="number" step="0.01" placeholder="Preço">
            <button type="button" onclick="removerAcrescimo(this)">X</button>
        </div>
    `;
};

window.removerAcrescimo = (botao) => {
    botao.parentElement.remove();
};

const btnSalvar = document.getElementById("salvar");
const lista = document.getElementById("lista");

btnSalvar.addEventListener("click", async () => {
    const nome = document.getElementById("nome").value;
    const descricao = document.getElementById("descricao").value;
    const preco = Number(document.getElementById("preco").value);
    const categoria = document.getElementById("categoria").value;
    const imagem = document.getElementById("imagem").value;

    const camposAcrescimos = document.querySelectorAll(".acrescimo");
    let acrescimos = [];

    camposAcrescimos.forEach((item) => {
        const nomeAcrescimo = item.querySelector(".nomeAcrescimo").value;
        const precoAcrescimo = Number(item.querySelector(".precoAcrescimo").value);

        if (nomeAcrescimo.trim() !== "") {
            acrescimos.push({
                nome: nomeAcrescimo,
                preco: precoAcrescimo
            });
        }
    });

    console.log("Acréscimos:", acrescimos);

    await addDoc(collection(db, "produtos"), {
        nome,
        descricao,
        preco,
        categoria,
        imagem,
        ativo: true,
        acrescimos
    });

    alert("Produto cadastrado com sucesso!");
    location.reload();
});

async function carregarProdutos() {
    lista.innerHTML = "";
    const querySnapshot = await getDocs(collection(db, "produtos"));

    querySnapshot.forEach((produto) => {
        const dados = produto.data();

        lista.innerHTML += `
            <div class="produto-admin">
                <b>${dados.nome}</b>
                <p>R$ ${dados.preco}</p>
                <button onclick="excluir('${produto.id}')">Excluir</button>
            </div>
        `;
    });
}

window.excluir = async (id) => {
    await deleteDoc(doc(db, "produtos", id));
    carregarProdutos();
};

// Inicialização
carregarProdutos();