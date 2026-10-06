
async function criarConta() {
    const nome = document.querySelector(".box-sign-user input").value;
    const email = document.querySelector(".box-sign-email input").value;
    const password = document.querySelector(".box-sign-password input").value;
  
    if (!nome.trim() || !email.trim() || !password.trim()) {
        return alert("Insira suas informaçoes para criar sua conta!");
    }

    try {
        const response = await fetch("/accounts", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                nome,
                password,
                email
            })
        });

        const data = await response.json();

        if (!response.ok) {
            alert(data.erro);
            return;
        }

        console.log(data);
        console.log("Conta criada com sucesso!");
        alert("Conta criada com sucesso!");

        window.location.href = "/notas/notas.html";

    } catch (error) {
        console.error(error);
    }
}