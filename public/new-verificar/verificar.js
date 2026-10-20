
/// =========== INICIANDO FUNCOES VOLTADAS PARA PAGINA VERIFICAR

/// TODOS OS ELEMENTOS
const elementOptions = {
    data: {
        dataHoje: document.querySelector(".data p")
    },
    dados: {
        sistemaDados: {},
        maquinaDados: {}
    },

    arquivos: {
        arquivoSistema: {
            inputSistema: document.querySelector("#arquivo-sistema")
        },
        arquivoMaquina: {
            inputMaquina: document.querySelector("#arquivo-maquina")
        }
    },

    valoresSistema: {
        linhaDinheiro: {
            numberDinheiro: document.querySelector(".box-valores-sistema .box-linha-sistema .linha .number-dinheiro")
        },
        linhaPix: {
            numberPix: document.querySelector(".box-valores-sistema .box-linha-sistema .linha .number-pix")
        },
        linhaCredito: {
            numberCredito: document.querySelector(".box-valores-sistema .box-linha-sistema .linha .number-credito")
        },
        linhaDebito: {
            numberDebito: document.querySelector(".box-valores-sistema .box-linha-sistema .linha .number-debito")
        }
    },

    valoresMaquina: {
        linhaPix: {
            numberPix: document.querySelector(".box-valores-maquina .box-linha-maquina .linha .number-pix")
        },
        linhaCredito: {
            numberCredito: document.querySelector(".box-valores-maquina .box-linha-maquina .linha .number-credito")
        },
        linhaDebito: {
            numberDebito: document.querySelector(".box-valores-maquina .box-linha-maquina .linha .number-debito")
        }
    },

    valoresAjustes: {
        linhaDinheiro: {
            numberDinheiro: document.querySelector(".box-valores-ajustes .box-linha-ajustes .linha .number-dinheiro")
        },
        linhaPix: {
            numberPix: document.querySelector(".box-valores-ajustes .box-linha-ajustes .linha .number-pix")
        },
        linhaCredito: {
            numberCredito: document.querySelector(".box-valores-ajustes .box-linha-ajustes .linha .number-credito")
        },
        linhaDebito: {
            numberDebito: document.querySelector(".box-valores-ajustes .box-linha-ajustes .linha .number-debito")
        }
    },

    fechamentoCaixa: {
        linhaCaixaAnterior: {
            numberCaixaAnterior: document.querySelector(".box-fechamentos .box-linha-fechamentos .linha-fechamentos .number-caixa-anterior")
        },
        linhaCaixaEsperado: {
            numberCaixaEsperado: document.querySelector(".box-fechamentos .box-linha-fechamentos .linha-fechamentos .number-caixa-esperado")
        },
        linhaCaixaAtual: {
            numberCaixaAtual: document.querySelector(".box-fechamentos .box-linha-fechamentos .linha-fechamentos .number-caixa-atual")
        },
        linhaDinheiroDia: {
            numberDinheiroDia: document.querySelector(".box-fechamentos .box-linha-fechamentos .linha-fechamentos .number-dinheiro")
        }
    },

    resultadoCaixa: {
        linhaValorFinal: {
            numberValorFinal: document.querySelector(".box-resultado .box-valor-final .valor-final .number")
        },
        linhaValorLiquido: {
            numberValorLiquido: document.querySelector(".box-resultado .box-valor-liquido .valor-liquido .number")
        }
    },

    buttons: {
        buttonAjustar: document.querySelector(".btn-ajuste button"),
        buttonFechar: document.querySelector(".btn-fechar button"),
        buttonVoltar: document.querySelector(".btn-voltar button")
    }
};


elementOptions.buttons.buttonAjustar.addEventListener("click", verificarCaixa)
elementOptions.buttons.buttonFechar.addEventListener("click", fechar)
elementOptions.buttons.buttonVoltar.addEventListener("click", () => history.back())

elementOptions.arquivos.arquivoSistema.inputSistema.addEventListener('change', () => analisarNota())
elementOptions.arquivos.arquivoMaquina.inputMaquina.addEventListener('change', () => analisarMaquina())

function formatNumber(valor) {
    return `R$ ${valor.toFixed(2).replace(".", ",")}`
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
    const div = document.querySelector(".box-linha-sistema")
    const input = elementOptions.arquivos.arquivoSistema.inputSistema.files[0];
    const arquivo = await fileToBase64(input);

    try {
        console.log(`SISTEMA: Iniciando análise do arquivo: ${input.name}`)
        const mensagem = [
            {
                role: "user",
                content: [
                        {
                            type: "input_text",
                            text: `Analise esta nota fiscal.

            Extraia SOMENTE estas informações:

            1. Total dinheiro
            2. CREDITO
            3. DEBITO
            4. PIX = PIX MAQ + PIX CONTA
            5. Total Vendas = Vendas Liquidas - IFOOD

            Responda EXATAMENTE neste formato JSON:

            {
                "dinheiro": 0,
                "credito": 0,
                "debito": 0,
                "pix": 0,
                "vendas": 0
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
        elementOptions.dados.sistemaDados = dados

        elementOptions.valoresSistema.linhaDinheiro.numberDinheiro.innerText = formatNumber(dados.dinheiro)
        elementOptions.valoresSistema.linhaPix.numberPix.innerText = formatNumber(dados.pix)
        elementOptions.valoresSistema.linhaCredito.numberCredito.innerText = formatNumber(dados.credito)
        elementOptions.valoresSistema.linhaDebito.numberDebito.innerText =  formatNumber(dados.debito)
        elementOptions.resultadoCaixa.linhaValorFinal.numberValorFinal.innerText = formatNumber(dados.vendas)

        div.classList.add('revelado')
        console.log('SISTEMA: Imagem analisada com sucesso!')
    } catch (erro) {
        console.error("SISTEMA: Erro ao analisar:", erro);
    }
}

/// Analiza a nota da maquina e coloca o valor analizado na tela, ativando e desativando tela de carregamento



async function analisarMaquina() {
    const div = document.querySelector(".box-linha-maquina")
    const input = elementOptions.arquivos.arquivoMaquina.inputMaquina.files[0];
    const arquivo = await fileToBase64(input);

    try {
        console.log(`MAQUINA: Iniciando análise do arquivo: ${input.name}`)
        const mensagem = [
            {
                role: "user",
                content: [
                        {
                            type: "input_text",
                            text: `Analise esta nota fiscal.

            Extraia SOMENTE estas informações:

            1. CREDITO
            2. DEBITO
            3. PIX
            4. VALOR TOTAL 

            Responda EXATAMENTE neste formato JSON:

            {
                "credito": 0,
                "debito": 0,
                "pix": 0,
                "vendas": 0
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
        elementOptions.dados.maquinaDados = dados

        elementOptions.valoresMaquina.linhaCredito.numberCredito.innerText = formatNumber(dados.credito)
        elementOptions.valoresMaquina.linhaDebito.numberDebito.innerText = formatNumber(dados.debito)
        elementOptions.valoresMaquina.linhaPix.numberPix.innerText = formatNumber(dados.pix)

        div.classList.add('revelado')
        console.log('MAQUINA: Imagem analisada com sucesso!')
    } catch (erro) {
        console.error("MAQUINA: Erro ao analisar:", erro);
    }
    

}


/// Confere os valores do sistema junto ao da maquininha e colocar direto na tela

function conferirCaixa(sistema, maquininha) {
    const div = document.querySelector(".box-linha-ajustes")
    const ajusteCredito = maquininha.credito - sistema.credito;
    const ajusteDebito = maquininha.debito - sistema.debito;
    const ajustePix = maquininha.pix - sistema.pix;
    const dinheiroCorrigido = sistema.dinheiro - (ajusteCredito + ajusteDebito + ajustePix)

    elementOptions.valoresAjustes.linhaDinheiro.numberDinheiro.innerText = formatNumber(dinheiroCorrigido)
    elementOptions.valoresAjustes.linhaCredito.numberCredito.innerText = formatNumber(ajusteCredito)
    elementOptions.valoresAjustes.linhaDebito.numberDebito.innerText = formatNumber(ajusteDebito)
    elementOptions.valoresAjustes.linhaPix.numberPix.innerText = formatNumber(ajustePix)
    div.classList.add('revelado')

    return {
        credito: ajusteCredito,
        debito: ajusteDebito,
        pix: ajustePix,
        dinheiro: dinheiroCorrigido
    };
}

/// Função que é chamada para iniciar toda a verificação

async function verificarCaixa() {
    const respostaAnterior = await fetch("/api/valor-anterior");
    const respostaAtual = await fetch("/api/valor-caixa");
    
    const dadosAtual = await respostaAtual.json();
    const dadosAnterior = await respostaAnterior.json();

    const fotoSistema = elementOptions.arquivos.arquivoSistema.inputSistema;
    const fotoMaquina = elementOptions.arquivos.arquivoMaquina.inputMaquina;

    const ultimoCaixa = await dadosAnterior.valor_anterior;
    const caixaAtual = await dadosAtual.caixa_atual;

    if (!fotoSistema.files.length || !fotoMaquina.files.length) {
        alert("É necessário enviar as duas fotos antes de continuar.");
        return;
    }

    const sistema = elementOptions.dados.sistemaDados
    const maquininha = elementOptions.dados.maquinaDados
    const ajustados = conferirCaixa(sistema, maquininha);
    const valorAjustado = ajustados.dinheiro;
    const caixaEsperado = ultimoCaixa + valorAjustado
    const valorFinal =  caixaAtual - caixaEsperado;

    if (!sistema || !maquininha) {
        console.error("Não foi possível obter os dados.");
        return;
    }

    elementOptions.fechamentoCaixa.linhaCaixaAnterior.numberCaixaAnterior.innerText = formatNumber(ultimoCaixa)
    elementOptions.fechamentoCaixa.linhaCaixaEsperado.numberCaixaEsperado.innerText = formatNumber(caixaEsperado)
    elementOptions.fechamentoCaixa.linhaCaixaAtual.numberCaixaAtual.innerText = formatNumber(caixaAtual)
    elementOptions.fechamentoCaixa.linhaDinheiroDia.numberDinheiroDia.innerText = formatNumber(valorAjustado)
    elementOptions.resultadoCaixa.linhaValorFinal.numberValorFinal.innerText = formatNumber(valorFinal)

   // verificarDiferencaCaixa(valorFinal);

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
    const caixaAnterior = elementOptions.fechamentoCaixa.linhaCaixaAnterior.numberCaixaAnterior;
    const caixaAtual = elementOptions.fechamentoCaixa.linhaCaixaAtual.numberCaixaAtual;
    const caixaFinal = elementOptions.resultadoCaixa.linhaValorFinal.numberValorFinal;
    const motivoElemento = document.querySelector("#motivoDiferenca");
    const valorGastoElemento = document.querySelector("#valorGasto");
    const dinheiroElemento = elementOptions.valoresAjustes.linhaDinheiro.numberDinheiro;
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


/// Dar inicio a data e colocar na tela

document.addEventListener("DOMContentLoaded", () => {
    const hoje = new Date();
    const data = hoje.toLocaleDateString('pt-BR');
    const botao = elementOptions.data.dataHoje;

    if (botao){
        botao.textContent = data;
    }
});



function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;

        reader.readAsDataURL(file);
    });
}

const inputSistema = document.querySelector("#arquivo-sistema");
const nomeSistema = document.querySelector(".nome-arquivo-sistema");
const inputMaquina = document.querySelector("#arquivo-maquina");
const nomeMaquina = document.querySelector(".nome-arquivo-maquina");

inputSistema.addEventListener("change", () => {
    nomeSistema.textContent = inputSistema.files.length
        ? inputSistema.files[0].name
        : "Nenhum arquivo escolhido";
});

inputMaquina.addEventListener("change", () => {
    nomeMaquina.textContent = inputMaquina.files.length
        ? inputMaquina.files[0].name
        : "Nenhum arquivo escolhido";
});


