
/// =========== INICIANDO FUNCOES VOLTADAS PARA PAGINA VERIFICAR

/// Tela de carregamento

let intervaloIA;

function carregarIA(ativo) {
    const Carregamento = document.querySelector(".Carregamento");
    const CarregamentoText = document.getElementById("Carregamento-text");

    if (ativo) {
        Carregamento.style.display = "flex";

        const mensagens = [
            "A IA está analisando suas informações...",
            "Organizando os dados...",
            "Pensando na melhor resposta...",
            "Quase pronto...",
            "Finalizando os resultados..."
        ];

        let i = 0;
        CarregamentoText.textContent = mensagens[0];
        clearInterval(intervaloIA);

        intervaloIA = setInterval(() => {
            i = (i + 1) % mensagens.length;
            CarregamentoText.textContent = mensagens[i];
        }, 2500);

    } else {
        Carregamento.style.display = "none";
        clearInterval(intervaloIA);
        intervaloIA = null;
    }

}

let fechamentoBloqueado = false;
let tempoRestante = 0;
let intervaloFechamento = null;

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

/// Analiza a nota do sistema e coloca o valor analizado na tela, ativando e desativando tela de carregamento

async function analisarNota() {
    const input = document.getElementById("imagem-sistema").files[0];
    const arquivo = await fileToBase64(input);

        try {
        const mensagem = [
            {
                role: "user",
                content: [
                        {
                            type: "input_text",
                            text: `Analise esta nota fiscal.

            Extraia SOMENTE estas informações:

            1. Total dinheiro
            2. Total Pix
            3. Credito
            3. Debito
            4. Total Vendas = Vendas Liquidas - IFOOD

            Responda EXATAMENTE neste formato JSON:

            {
                "dinheiro": 0,
                "pix": 0,
                "credito": 0,
                "debito": 0,
                "total_vendas": 0
            }

            Não coloque nenhum texto antes ou depois do JSON.
            Se alguma informação não estiver visível, deixe o campo vazio.`},
                        {
                            type: "input_image",
                            image_url: arquivo
                        }
                    ]
                }
            ];
        const resposta = await puter.ai.chat(mensagem, {
            model: "gpt-5.6-luna"
        });

        const dados = JSON.parse(resposta.message.content);

        document.querySelector(".resultado strong").innerText = `R$ ${dados.total_vendas.toFixed(2).replace(".", ",")}`;
        document.querySelector(".linha-valores .dinheiro_sistema").innerText = `R$ ${dados.dinheiro.toFixed(2).replace(".", ",")}`;
        document.querySelector(".linha-valores .pix_sistema").innerText = `R$ ${dados.pix.toFixed(2).replace(".", ",")}`;
        document.querySelector(".linha-valores .credito_sistema").innerText = `R$ ${dados.credito.toFixed(2).replace(".", ",")}`;
        document.querySelector(".linha-valores .debito_sistema").innerText = `R$ ${dados.debito.toFixed(2).replace(".", ",")}`;
        return dados;

    } catch (erro) {
        console.error("Erro ao analisar:", erro);
        carregarIA(false)
    }
}

/// Analiza a nota da maquina e coloca o valor analizado na tela, ativando e desativando tela de carregamento

async function analisarMaquina() {
    const input = document.getElementById("imagem-maquina").files[0];
    const arquivo = await fileToBase64(input);

        try {
        const mensagem = [
            {
                role: "user",
                content: [
                        {
                            type: "input_text",
                            text: `Analise esta nota fiscal.

            Extraia SOMENTE estas informações:

            1. Total Pix
            2. Total Credito
            3. Total Debito
            4. Total de vendas

            Responda EXATAMENTE neste formato JSON:

            {
                "pix": 0,
                "credito": 0,
                "debito": 0,
                "total_vendas": 0
            }

            Não coloque nenhum texto antes ou depois do JSON.
            Se alguma informação não estiver visível, deixe o campo vazio.`},
                        {
                            type: "input_image",
                            image_url: arquivo
                        }
                    ]
                }
            ];
        const resposta = await puter.ai.chat(mensagem, {
            model: "gpt-5.6-luna"
        });
        const dados = JSON.parse(resposta.message.content);

        document.querySelector(".linha-valores .pix_maquina").innerText = `R$ ${dados.pix.toFixed(2).replace(".", ",")}`;
        document.querySelector(".linha-valores .credito_maquina").innerText = `R$ ${dados.credito.toFixed(2).replace(".", ",")}`;
        document.querySelector(".linha-valores .debito_maquina").innerText = `R$ ${dados.debito.toFixed(2).replace(".", ",")}`;
        return dados; 
    } catch (erro) {
        console.error("Erro ao analisar:", erro);
        carregarIA(false);
    }
    

}


/// Confere os valores do sistema junto ao da maquininha e colocar direto na tela

function conferirCaixa(sistema, maquininha) {
    const ajusteCredito = maquininha.credito - sistema.credito;
    const ajusteDebito = maquininha.debito - sistema.debito;
    const ajustePix = maquininha.pix - sistema.pix;

    const credito = maquininha.credito;
    const debito = maquininha.debito;
    const pix = maquininha.pix;

    const dinheiro_sistema = sistema.total_vendas - sistema.credito - sistema.debito - sistema.pix;
    const dinheiroCorrigido = dinheiro_sistema - ajusteCredito - ajusteDebito - ajustePix;

    document.querySelector(".linha-valores_ajustado .dinheiro_ajustado").innerText =`R$ ${dinheiroCorrigido.toFixed(2).replace(".", ",")}`;
    document.querySelector(".linha-valores_ajustado .pix_ajustado").innerText =`R$ ${ajustePix.toFixed(2).replace(".", ",")}`;
    document.querySelector(".linha-valores_ajustado .credito_ajustado").innerText = `R$ ${ajusteCredito.toFixed(2).replace(".", ",")}`;
    document.querySelector(".linha-valores_ajustado .debito_ajustado").innerText =`R$ ${ajusteDebito.toFixed(2).replace(".", ",")}`;

    return {
        credito,
        debito,
        pix,
        dinheiro: dinheiroCorrigido
    };
}

/// Função que é chamada para iniciar toda a verificação

async function verificarCaixa() {
    const respostaAnterior = await fetch("/api/valor-anterior");
    const respostaAtual = await fetch("/api/valor-caixa");
    
    const dadosAtual = await respostaAtual.json();
    const dadosAnterior = await respostaAnterior.json();

    const fotoSistema = document.getElementById("imagem-sistema");
    const fotoMaquina = document.getElementById("imagem-maquina");

    const ultimoCaixa = await dadosAnterior.valor_anterior;
    const caixaAtual = await dadosAtual.caixa_atual;

    if (!fotoSistema.files.length || !fotoMaquina.files.length) {
        alert("É necessário enviar as duas fotos antes de continuar.");
        return;
    }

    carregarIA(true);

    const sistema = await analisarNota();
    const maquininha = await analisarMaquina();
    const ajustados = conferirCaixa(sistema, maquininha);
    const valorAjustado = ajustados.dinheiro;
    const caixaEsperado = ultimoCaixa + valorAjustado
    const valorFinal =  caixaAtual - caixaEsperado;

    if (!sistema || !maquininha) {
        console.error("Não foi possível obter os dados.");
        carregarIA(false);
        return;

    }

    document.querySelector(".caixa_anterior").innerText = `R$ ${ultimoCaixa.toFixed(2).replace(".", ",")}`;
    document.querySelector(".caixa_esperado").innerText = `R$ ${caixaEsperado.toFixed(2).replace(".", ",")}`;
    document.querySelector(".caixa_atual").innerText = `R$ ${caixaAtual.toFixed(2).replace(".", ",")}`;
    document.querySelector(".dinheiro_dia").innerText = `R$ ${valorAjustado.toFixed(2).replace(".", ",")}`;
    document.querySelector(".resultado-caixa strong").innerText = `R$ ${valorFinal.toFixed(2).replace(".", ",")}`;

    carregarIA(false);
    verificarDiferencaCaixa(valorFinal);

}

/// Verificação de caixa, caso tenha muita diferença ele abre um caixa de motivos

function verificarDiferencaCaixa(valor) {
    valor = Number(valor);
    if (isNaN(valor)) {
        console.error("Valor do caixa inválido.");
        return;
    }

    if (Math.abs(valor) < 5) {
        console.log("Caixa Fechado!");
        finalizarFechamentoCaixa();
        return;
    }

    const modal = document.querySelector("#ajusteCaixa");
    const valorDiferenca = document.querySelector("#valorDiferenca");
    const valorGasto = document.querySelector("#valorGasto");
    const motivo = document.querySelector("#motivoDiferenca");
    const observacao = document.querySelector("#observacaoDiferenca");

    if (!modal) {
        console.error("Elemento #ajusteCaixa não encontrado.");
        return;
    }

    if (valorDiferenca) {
        valorDiferenca.textContent =
            formatarMoeda(Math.abs(valor));
    }

    if (valorGasto) {
        valorGasto.value = "";
    }

    if (motivo) {
        motivo.value = "";
    }

    if (observacao) {
        observacao.value = "";
    }

    const titulo = modal.querySelector("h3");

    if (titulo) {
        if (valor < 0) {
            titulo.textContent = "⚠️ Falta no Caixa";
        } else {
            titulo.textContent = "⚠️ Sobra no Caixa";
        }
    }

    modal.classList.add("ativo");
}

/// Formatar os valores para moeda

function formatarMoeda(valor) {
    return new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL"
    }).format(valor);
}

/// Botão para confirmar o ajuste na caixa de motivos

function confirmarAjusteCaixa() {
    const motivo = document.querySelector("#motivoDiferenca");
    const valorGasto = document.querySelector("#valorGasto");
    const observacao = document.querySelector("#observacaoDiferenca");
    const resultadoCaixa = document.querySelector('.resultado-caixa strong');


    const valorResultado = Number(resultadoCaixa?.textContent.replace("R$", "").replace(/\./g, "").replace(",", ".").trim() || 0);
    console.log(valorResultado);

    if (!motivo || !valorGasto || !observacao) {
        console.error("Elementos do ajuste de caixa não encontrados.");
        return;
    }

    const motivoSelecionado = motivo.value;
    const valor = Number(valorGasto.value);
    const observacaoTexto = observacao.value.trim();

    if (!motivoSelecionado) {
        alert("Selecione o motivo da diferença.");
        motivo.focus();
        return;
    }

    if (isNaN(valor) || valor <= 0) {
        alert("Informe um valor válido para o ajuste.");
        valorGasto.focus();
        return;
    }

    const ajuste = {
        motivo: motivoSelecionado,
        valor: valor,
        observacao: observacaoTexto,
        data: new Date().toISOString()
    };

    const resultadoAtualizado = valorResultado + valor
    resultadoCaixa.innerText = `R$ ${resultadoAtualizado.toFixed(2).replace(".", ",")}`;

    const modal = document.querySelector("#ajusteCaixa");
    if (modal) {
        modal.classList.remove("ativo");
    }

    

    finalizarFechamentoCaixa();
}


/// Cancelar ajuste na caixa de motivos

function cancelarAjusteCaixa() {
    const modal = document.querySelector("#ajusteCaixa");
    if (modal) {
        modal.classList.remove("ativo");
    }
}


function finalizarFechamentoCaixa() {
    console.log("Caixa fechado com sucesso!");
    const botao = document.querySelector(".continuar");
    if (botao) {
        botao.disabled = false;
    }
}

/// FECHAR programa é salvar tudo e banco de dados

async function fechar() {
    const caixaAnterior = document.querySelector(".linha-valores_ajustado .caixa_anterior");
    const caixaAtual = document.querySelector(".linha-valores_ajustado .caixa_atual");
    const caixaFinal = document.querySelector(".resultado-caixa strong");
    const motivoElemento = document.querySelector("#motivoDiferenca");
    const valorGastoElemento = document.querySelector("#valorGasto");
    const dinheiroElemento = document.querySelector('.linha-valores_ajustado .dinheiro_ajustado');
    const observacaoElemento = document.querySelector("#observacaoDiferenca");
    const dataHoje = new Date().toLocaleString("pt-BR");

    const caixa_anterior = Number(caixaAnterior?.textContent.replace("R$", "").replace(/\./g, "").replace(",", ".").trim() || 0);
    const caixa_atual = Number(caixaAtual?.textContent.replace("R$", "").replace(/\./g, "").replace(",", ".").trim() || 0);
    const caixa_final = Number(caixaFinal?.textContent.replace("R$", "").replace(/\./g, "").replace(",", ".").trim() || 0);
    const dinheiroAjustado = Number(dinheiroElemento?.textContent.replace("R$", "").replace(/\./g, "").replace(",", ".").trim() || 0);

    const motivo = motivoElemento?.value || "";

    const valorGasto = Number(valorGastoElemento?.value || 0);
    const observacao = observacaoElemento?.value.trim() || "";
    const idFechamento = sessionStorage.getItem("idFechamento");

    const dados = {
        operador: "Iago",
        dataFechamento: dataHoje,
        caixa_anterior: caixa_anterior,
        caixa_atual: caixa_atual,
        caixa_final: caixa_final,
        motivo: motivo,
        valorGasto: valorGasto,
        observacao: observacao,
        dinheiro: dinheiroAjustado
    };

    try {
        const resposta = await fetch(`/api/fechamentos/${idFechamento}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({
                data: dados.dataFechamento,
                horario_bloqueio: Date.now() + (60 * 1000),
                operador: dados.operador,
                caixa_atual: dados.caixa_atual,
                caixa_final: dados.caixa_final,
                valor_gasto: dados.valorGasto,
                motivo: dados.motivo,
                observacao: dados.observacao
            })

        });

        if (!resposta.ok) {
            throw new Error(
                "Erro ao salvar o fechamento."
            );
        }

        const resultado = await resposta.json();

        console.log(
            "Fechamento salvo no banco:",
            resultado
        );

        enviarFechamentoWhatsApp(dados);
        iniciarLimiteFechamento();

    } catch (erro) {
        console.error(
            "Erro ao salvar fechamento:",
            erro
        );

        alert(
            "Não foi possível salvar o fechamento."
        );
    }
}

function enviarFechamentoWhatsApp(dados) {
    const telefoneDono = "5531982835205";
    const valorDia = dados.caixa_atual - dados.caixa_anterior + dados.valorGasto;
    const valorComAjuste = dados.caixa_atual + dados.valorGasto;
    const mensagem = `*CAIXA FECHADO - LAFAIETE*

Data: ${dados.dataFechamento}
Operador: ${dados.operador}

------------------------------
*RESUMO DO CAIXA*

Saldo Caixa Anterior: ${formatarMoeda(dados.caixa_anterior)}
Saldo Caixa Atual: ${formatarMoeda(dados.caixa_atual)}
Saldo Com Ajuste: ${formatarMoeda(valorComAjuste)}

Dinheiro Real Dia: ${formatarMoeda(valorDia)}
Dinheiro Corrigido: ${formatarMoeda(dados.dinheiro)}

Fechamento: ${formatarMoeda(dados.caixa_final)}

------------------------------
*AJUSTE*

${dados.motivo ? `Motivo: ${dados.motivo}\n` : ""}${dados.valorGasto ? `Valor do ajuste: ${formatarMoeda(dados.valorGasto)}\n` : ""}${dados.observacao ? `Observacao: ${dados.observacao}\n` : ""}
------------------------------

*Fechamento concluido com sucesso.*`;

    const url = `https://wa.me/${telefoneDono}?text=${encodeURIComponent(mensagem)}`;

    window.open(url, "_blank");

}

function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;

        reader.readAsDataURL(file);
    });
}