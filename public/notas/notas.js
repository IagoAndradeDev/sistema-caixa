/// =========== INICIANDO FUNCOES VOLTADAS PARA PAGINA NOTAS

/// Iniciar Junto com o SITE

document.addEventListener("DOMContentLoaded", () => {
    carregarUltimoCaixa();
    iniciarLimiteFechamento();
    iniciarData()
});

/// Pega o valor da moeda ou da nota e multiplica pela quantidade. Depois já coloca o valor direto no site.

function valorTotal(valor, quantidade, dinheiro) {
    let resultado = valor * quantidade;
    document.querySelector(`.${dinheiro}`).innerText = `R$ ${resultado.toFixed(2).replace(".", ",")}`;
    somarTotal();
    return resultado;
}

/// Zerar todos os campos de moedas e notas ao mesmo tempo

function zerarQuantidades(){
    document.querySelectorAll("input").forEach(input => {input.value = "";});
    document.querySelectorAll(".totalMoeda-05, .totalMoeda-10, .totalMoeda-25, .totalMoeda-50, .totalMoeda-1, .totalNota-2, .totalNota-5, .totalNota-10, .totalNota-20, .totalNota-50, .totalNota-100, .resultado strong").forEach(total => {total.innerText = "R$0,00";});
}

/// Pega a soma de todos os valores e ja coloca o valor total separado

function somarTotal() {
    let total = 0;
    document.querySelectorAll('span[class^="totalMoeda-"], span[class^="totalNota-"]').forEach(span => {let valor = span.innerText.replace("R$", "").replace(",", ".").trim();total += Number(valor) || 0;});
    document.querySelector(".resultado strong").innerText = `R$ ${total.toFixed(2).replace(".", ",")}`;
}

/// Dar inicio a data e colocar na tela

function iniciarData(){
    const hoje = new Date();
    const data = hoje.toLocaleDateString('pt-BR');
    const botao = document.querySelector('.data strong');

    if (botao){
        botao.textContent = data;
    }
}

/// PRINCIPAL FUNÇÂO salvar dados do caixa em SQL

async function salvarCaixa(valor) {
    const valor_caixa = Number(valor);
    const tempo_bloqueio = Date.now() + 60 * 1000;

    const resposta = await fetch("/api/fechamentos", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            caixa_atual: valor_caixa,
            horario_bloqueio: tempo_bloqueio
        })
    });

    if (!resposta.ok) {
        throw new Error("Erro ao fechar caixa");
    }

    const resultado = await resposta.json();
    const idFechamento = resultado.id;
    console.log(idFechamento)
    sessionStorage.setItem("idFechamento", idFechamento);
    return resultado;
}

/// Carregar Ultimo calxa para tela

async function carregarUltimoCaixa() {
    const resposta = await fetch("/api/valor-caixa");
    const dados = await resposta.json();
    const ultimo_caixa = Number(dados.caixa_atual) || 0;
    const elemento = document.querySelector(".total strong");

    if (elemento) {
        elemento.innerText =
            `R$ ${ultimo_caixa.toFixed(2).replace(".", ",")}`;
    }

}

let fechamentoBloqueado = false;
let tempoRestante = 0;
let intervaloFechamento = null;

/// Serve para continuar o fechamento saindo da aba de notas e indo para verificaçoes, chamando as funçoes de salvar caixa

async function continuar() {
    if (fechamentoBloqueado) {
        return;
    }

    let total = 0;
    document.querySelectorAll('span[class^="totalMoeda-"], span[class^="totalNota-"]').forEach(span => {let valor = span.innerText.replace("R$", "").replace(",", ".").trim();total += Number(valor) || 0;});
    await salvarCaixa(total.toFixed(2));
    iniciarLimiteFechamento();
    window.location.href = "/verificar/verificar.html"
}

/// Inicia um fechamento no sistema de fechar para ter evitar qualquer tipo de fechamento em massa

async function iniciarLimiteFechamento() {
    const resposta = await fetch("/api/tempo-bloqueio");
    const dados_tempo = await resposta.json();
    const bloqueio = dados_tempo.horario_bloqueio;
    const botao = document.querySelector(".continuar");

    fechamentoBloqueado = true;

    if (botao){
        botao.disabled = true;
    }

    atualizarTextoBotao();

    intervaloFechamento = setInterval(() => {
        const agora = Date.now();
        const restante = bloqueio - agora;

        if (restante <= 0) {
            clearInterval(intervaloFechamento);
            fechamentoBloqueado = false;
            tempoRestante = 0;
            if (botao) {
                botao.disabled = false;
                botao.innerText = "Continuar";
            }
            return;
        }

        tempoRestante = Math.ceil(restante / 1000);
        atualizarTextoBotao();
    }, 1000);
}

/// Atualiza o botao quando ele e bloqueado por tempo

function atualizarTextoBotao() {
    const botao = document.querySelector(".continuar");
    const minutos = Math.floor(tempoRestante / 60);
    const segundos = tempoRestante % 60;

    if (botao) {
        botao.innerText = `Aguarde ${String(minutos).padStart(2, "0")}:${String(segundos).padStart(2, "0")}`;
    }
}