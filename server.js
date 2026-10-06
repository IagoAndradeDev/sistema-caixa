const express = require("express");
const Database = require("better-sqlite3");

const app = express();

const PORT = 3000;


// ==========================
// CONFIGURAÇÕES
// ==========================

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(express.static("public"));

app.get("/", (req, res) => {
    res.sendFile(__dirname + "/public/login/login.html");
});

// ==========================
// BANCO DE CONTAS
// ==========================

const dbAccounts = new Database("./database/accounts.db");

dbAccounts.exec(`
    CREATE TABLE IF NOT EXISTS accounts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user TEXT NOT NULL,
        password TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE
    )
`);


// ==========================
// BANCO DO CAIXA
// ==========================

const dbCaixa = new Database("./database/caixa.db");

dbCaixa.exec(`
    CREATE TABLE IF NOT EXISTS fechamentos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        data TEXT NOT NULL,
        operador TEXT NOT NULL,
        valor_anterior REAL DEFAULT 0,
        caixa_atual REAL DEFAULT 0,
        caixa_final REAL DEFAULT 0,
        valor_gasto REAL DEFAULT 0,
        valor_final REAL DEFAULT 0,
        diferenca REAL DEFAULT 0,
        motivo TEXT,
        observacao TEXT,
        horario_bloqueio INTEGER
    )
`);

console.log("Banco de contas conectado!");
console.log("Banco de caixa conectado!");


// ==========================
// LOGIN
// ==========================

app.post("/login", (req, res) => {

    const { user, password } = req.body;

    if (!user || !password) {
        return res.status(400).json({
            erro: "Insira seu usuário e senha!"
        });
    }

    try {

        const usuario = dbAccounts
            .prepare("SELECT * FROM accounts WHERE user = ?")
            .get(user);

        if (!usuario) {
            return res.status(401).json({
                erro: "Esse usuário não existe!"
            });
        }

        if (usuario.password !== password) {
            return res.status(401).json({
                erro: "Senha incorreta!"
            });
        }

        res.status(200).json({
            mensagem: "Login realizado com sucesso!",

            usuario: {
                id: usuario.id,
                nome: usuario.user,
                email: usuario.email
            }
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            erro: "Erro interno do servidor."
        });
    }
});


// ==========================
// CADASTRO
// ==========================

app.post("/accounts", (req, res) => {

    const { nome, password, email } = req.body;

    try {

        const existe = dbAccounts
            .prepare(
                "SELECT * FROM accounts WHERE user = ? OR email = ?"
            )
            .get(nome, email);

        if (existe) {

            if (existe.user === nome) {
                return res.status(409).json({
                    erro: "Esse usuário já existe!"
                });
            }

            if (existe.email === email) {
                return res.status(409).json({
                    erro: "Esse email já está sendo usado!"
                });
            }
        }

        const result = dbAccounts
            .prepare(`
                INSERT INTO accounts (user, password, email)
                VALUES (?, ?, ?)
            `)
            .run(nome, password, email);

        res.status(201).json({
            id: result.lastInsertRowid,
            nome,
            email
        });

    } catch (error) {

        res.status(400).json({
            erro: error.message
        });
    }
});


// ==========================
// LISTAR USUÁRIOS
// ==========================

app.get("/accounts", (req, res) => {

    const usuarios = dbAccounts
        .prepare("SELECT id, user, email FROM accounts")
        .all();

    res.json(usuarios);
});


// ==========================
// VALOR DO CAIXA
// ==========================

app.get("/api/valor-caixa", (req, res) => {

    const resultado = dbCaixa
        .prepare(`
            SELECT caixa_atual
            FROM fechamentos
            ORDER BY id DESC
            LIMIT 1
        `)
        .get();

    res.json({
        caixa_atual: resultado
            ? resultado.caixa_atual
            : 0
    });
});


// ==========================
// VALOR ANTERIOR
// ==========================

app.get("/api/valor-anterior", (req, res) => {

    const resultado = dbCaixa
        .prepare(`
            SELECT valor_anterior
            FROM fechamentos
            ORDER BY id DESC
            LIMIT 1
        `)
        .get();

    res.json({
        valor_anterior: resultado
            ? resultado.valor_anterior
            : 0
    });
});


// ==========================
// TEMPO DE BLOQUEIO
// ==========================

app.get("/api/tempo-bloqueio", (req, res) => {

    const resultado = dbCaixa
        .prepare(`
            SELECT horario_bloqueio
            FROM fechamentos
            ORDER BY id DESC
            LIMIT 1
        `)
        .get();

    res.json({
        horario_bloqueio: resultado
            ? resultado.horario_bloqueio
            : 0
    });
});


// ==========================
// SALVAR FECHAMENTO
// ==========================

app.post("/api/fechamentos", (req, res) => {

    try {

        const {
            data,
            horario_bloqueio,
            operador,
            caixa_atual,
            caixa_final,
            valor_gasto,
            motivo,
            observacao
        } = req.body;


        const ultimo = dbCaixa
            .prepare(`
                SELECT caixa_atual
                FROM fechamentos
                ORDER BY id DESC
                LIMIT 1
            `)
            .get();


        const valor_anterior = ultimo
            ? Number(ultimo.caixa_atual)
            : 0;


        const novo_caixa_atual =
            Number(caixa_atual || 0);

        const novo_caixa_final =
            Number(caixa_final || 0);

        const novo_valor_gasto =
            Number(valor_gasto || 0);


        const diferenca =
            novo_caixa_atual - valor_anterior;


        const inserir = dbCaixa.prepare(`
            INSERT INTO fechamentos (
                data,
                operador,
                valor_anterior,
                caixa_atual,
                caixa_final,
                valor_gasto,
                diferenca,
                motivo,
                observacao,
                horario_bloqueio
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);


        const resultado = inserir.run(
            data || "",
            operador || "Iago",
            valor_anterior,
            novo_caixa_atual,
            novo_caixa_final,
            novo_valor_gasto,
            diferenca,
            motivo || "",
            observacao || "",
            horario_bloqueio || 0
        );


        res.json({
            sucesso: true,
            id: resultado.lastInsertRowid,
            valor_anterior,
            diferenca
        });


    } catch (erro) {

        console.error(
            "Erro ao salvar fechamento:",
            erro
        );

        res.status(500).json({
            sucesso: false,
            erro: "Erro ao salvar fechamento."
        });
    }
});


// ==========================
// ATUALIZAR FECHAMENTO
// ==========================

app.put("/api/fechamentos/:id", (req, res) => {

    try {

        const id = req.params.id;

        const {
            data,
            horario_bloqueio,
            operador,
            caixa_atual,
            caixa_final,
            valor_gasto,
            motivo,
            observacao
        } = req.body;


        const atualizar = dbCaixa.prepare(`
            UPDATE fechamentos
            SET
                data = ?,
                horario_bloqueio = ?,
                operador = ?,
                caixa_atual = ?,
                caixa_final = ?,
                valor_gasto = ?,
                motivo = ?,
                observacao = ?
            WHERE id = ?
        `);


        const resultado = atualizar.run(
            data,
            horario_bloqueio,
            operador || "Iago",
            Number(caixa_atual || 0),
            Number(caixa_final || 0),
            Number(valor_gasto || 0),
            motivo || "",
            observacao || "",
            id
        );


        res.json({
            sucesso: true,
            alterado: resultado.changes
        });


    } catch (erro) {

        console.error(
            "Erro ao atualizar fechamento:",
            erro
        );

        res.status(500).json({
            sucesso: false,
            erro: "Erro ao atualizar fechamento."
        });
    }
});


// ==========================
// SERVIDOR
// ==========================

app.listen(PORT, "0.0.0.0", () => {

    console.log(
        `Servidor rodando em http://localhost:${PORT}`
    );

});