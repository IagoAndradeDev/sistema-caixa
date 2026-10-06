async function login() {
    const user = document.querySelector(".box-user input").value;
    const password = document.querySelector(".box-password input").value;

    if (!user.trim() || !password.trim()) {
        return alert("Insira seu usuario e senha para entrar!");
    }

    try {
        const response = await fetch("/login", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                user,
                password
            })
        });

        const data = await response.json();

        if (!response.ok) {
            alert(data.erro);
            return;
        }

        console.log(data);
        console.log("Login realizado com sucesso!");

        window.location.href = "/notas/notas.html";

    } catch (error) {
        console.error("Erro ao fazer login:", error);
        alert("Erro ao conectar com o servidor.");
    }
}
