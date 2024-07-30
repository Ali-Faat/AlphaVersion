document.addEventListener('DOMContentLoaded', function () {
    const cadastroForm = document.getElementById('cadastro-form');
    const nomeCompletoInput = document.getElementById('nome_completo');
    const apelidoInput = document.getElementById('apelido');
    const emailInput = document.getElementById('email');
    const celularInput = document.getElementById('celular');
    const senhaInput = document.getElementById('senha');
    const confirmaSenhaInput = document.getElementById('confirma_senha');
    const errorMessage = document.querySelector('.error-message');

    function validarNomeCompleto() {
        const nome = nomeCompletoInput.value.trim();
        return nome.split(' ').length >= 2;
    }

    function validarApelido() {
        const apelido = apelidoInput.value.trim();
        return apelido.length <= 20;
    }

    function validarEmail() {
        const email = emailInput.value.trim();
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }

    function aplicarMascaraCelular(input) {
        let valor = input.value.replace(/\D/g, '');
        valor = valor.replace(/^(\d{2})(\d)/g, '($1) $2');
        valor = valor.replace(/(\d)(\d{4})$/, '$1-$2');
        input.value = valor;
    }

    celularInput.addEventListener('input', () => {
        aplicarMascaraCelular(celularInput);
        if (!validarCelular()) {
            mostrarErro(celularInput, 'Digite um número de celular válido no formato (DD) XXXXX-XXXX.');
        } else {
            ocultarErro(celularInput);
        }
    });

    function validarSenha() {
        const senha = senhaInput.value.trim();
        return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{6,}$/.test(senha);
    }

    function validarConfirmaSenha() {
        const senha = senhaInput.value.trim();
        const confirmaSenha = confirmaSenhaInput.value.trim();
        return senha === confirmaSenha;
    }

    function mostrarErro(inputElement, mensagem) {
        const errorContainer = document.getElementById('error-container');
        errorContainer.textContent = mensagem;
        errorContainer.classList.add('show');

        setTimeout(() => {
            ocultarErro(errorContainer);
        }, 3000);
    }

    function ocultarErro(errorContainer) {
        errorContainer.classList.remove('show');
    }

    nomeCompletoInput.addEventListener('blur', () => {
        if (!validarNomeCompleto()) {
            mostrarErro(nomeCompletoInput, 'Digite pelo menos dois nomes.');
        } else {
            ocultarErro(nomeCompletoInput);
        }
    });

    apelidoInput.addEventListener('blur', () => {
        if (!validarApelido()) {
            mostrarErro(apelidoInput, 'O apelido deve ter no máximo 20 caracteres.');
        } else {
            ocultarErro(apelidoInput);
        }
    });

    emailInput.addEventListener('blur', () => {
        if (!validarEmail()) {
            mostrarErro(emailInput, 'Digite um e-mail válido.');
        } else {
            ocultarErro(emailInput);
        }
    });

    celularInput.addEventListener('blur', () => {
        if (!validarCelular()) {
            mostrarErro(celularInput, 'Digite um número de celular válido no formato (DD) XXXXX-XXXX.');
        } else {
            ocultarErro(celularInput);
        }
    });

    senhaInput.addEventListener('blur', () => {
        if (!validarSenha()) {
            mostrarErro(senhaInput, 'A senha deve ter pelo menos 6 caracteres, 1 letra maiúscula, 1 letra minúscula, 1 número e 1 caractere especial.');
        } else {
            ocultarErro(senhaInput);
        }
    });

    confirmaSenhaInput.addEventListener('blur', () => {
        if (!validarConfirmaSenha()) {
            mostrarErro(confirmaSenhaInput, 'As senhas não coincidem.');
        } else {
            ocultarErro(confirmaSenhaInput);
        }
    });

    cadastroForm.addEventListener('submit', async (event) => {
        event.preventDefault();

        if (!validarNomeCompleto() || !validarApelido() || !validarEmail() || !validarCelular() || !validarSenha() || !validarConfirmaSenha()) {
            mostrarErro(cadastroForm, 'Por favor, preencha todos os campos corretamente.');
            return;
        }

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
