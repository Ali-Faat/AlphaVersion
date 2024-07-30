document.addEventListener('DOMContentLoaded', function () {
    const cadastroForm = document.getElementById('cadastro-form');

    cadastroForm.addEventListener('submit', async (event) => {
        event.preventDefault();

        const formData = new FormData(cadastroForm);
        const data = {};
        formData.forEach((value, key) => {
            data[key] = value;
        });

        try {
            const response = await fetch('http://138.99.160.212:5000/api/cadastro', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });

            if (response.ok) {
                const mensagemSucesso = 'Cadastro realizado com sucesso! Faça login para continuar!';
                window.location.href = '../login/login.html';
                window.alert(`${mensagemSucesso}`);
            } else {
                const errorData = await response.json();
                console.error('Erro no cadastro:', errorData.error);
            }
        } catch (error) {
            console.error('Erro na requisição:', error);
        }
    });
});
