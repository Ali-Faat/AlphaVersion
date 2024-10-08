document.addEventListener('DOMContentLoaded', function () {
    const cadastroForm = document.getElementById('cadastro-form');
    const nomeCompletoInput = document.getElementById('nome_completo');
    const apelidoInput = document.getElementById('apelido');
    const emailInput = document.getElementById('email');
    const celularInput = document.getElementById('celular');
    const senhaInput = document.getElementById('senha');
    const confirmaSenhaInput = document.getElementById('confirma_senha');
    const messageBanner = document.getElementById('message-banner');
    const messageText = document.getElementById('message-text');
    const closeBanner = document.getElementById('close-banner');

    let messageTimeout;

    // Função para mostrar mensagens de erro ou sucesso
    function mostrarMensagem(mensagem, tipo = 'error') {
        messageText.textContent = mensagem;
        messageBanner.classList.add('show');
        messageBanner.classList.add(tipo);

        // Fecha o banner automaticamente após 10 segundos
        messageTimeout = setTimeout(() => {
            ocultarMensagem();
        }, 10000);
    }

    // Função para ocultar o banner de mensagem
    function ocultarMensagem() {
        messageBanner.classList.remove('show');
        messageBanner.classList.remove('error', 'success');
        clearTimeout(messageTimeout); // Limpa o timeout caso o usuário feche o banner antes dos 10 segundos
    }

    // Listener para o botão de fechar o banner
    closeBanner.addEventListener('click', ocultarMensagem);

    // Funções de Validação (mantidas as mesmas)
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

    function validarCelular() {
        const celular = celularInput.value.trim();
        return /\(\d{2}\) \d{4,5}-\d{4}/.test(celular);
    }

    celularInput.addEventListener('input', () => {
        aplicarMascaraCelular(celularInput);
        if (!validarCelular()) {
            mostrarMensagem('Digite um número de celular válido no formato (DD) XXXXX-XXXX.', 'error');
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

    nomeCompletoInput.addEventListener('blur', () => {
        if (!validarNomeCompleto()) {
            mostrarMensagem('Digite pelo menos dois nomes.', 'error');
        }
    });

    apelidoInput.addEventListener('blur', () => {
        if (!validarApelido()) {
            mostrarMensagem('O apelido deve ter no máximo 20 caracteres.', 'error');
        }
    });

    emailInput.addEventListener('blur', () => {
        if (!validarEmail()) {
            mostrarMensagem('Digite um e-mail válido.', 'error');
        }
    });

    celularInput.addEventListener('blur', () => {
        if (!validarCelular()) {
            mostrarMensagem('Digite um número de celular válido no formato (DD) XXXXX-XXXX.', 'error');
        }
    });

    senhaInput.addEventListener('blur', () => {
        if (!validarSenha()) {
            mostrarMensagem('A senha deve ter pelo menos 6 caracteres, 1 letra maiúscula, 1 letra minúscula, 1 número e 1 caractere especial.', 'error');
        }
    });

    confirmaSenhaInput.addEventListener('blur', () => {
        if (!validarConfirmaSenha()) {
            mostrarMensagem('As senhas não coincidem.', 'error');
        }
    });

    cadastroForm.addEventListener('submit', async (event) => {
        event.preventDefault();

        if (!validarNomeCompleto() || !validarApelido() || !validarEmail() || !validarCelular() || !validarSenha() || !validarConfirmaSenha()) {
            mostrarMensagem('Por favor, preencha todos os campos corretamente.', 'error');
            return;
        }

        const formData = new FormData(cadastroForm);
        const data = {};
        formData.forEach((value, key) => {
            data[key] = value;
        });

        try {
            const response = await fetch('https://api.sportflyx.com:5000/api/cadastro', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });

            if (response.ok) {
                mostrarMensagem('Cadastro realizado com sucesso! Faça login para continuar!', 'success');
                setTimeout(() => {
                    window.location.href = '../login/login.html';
                }, 10000);
            } else {
                const errorData = await response.json();
                mostrarMensagem(`Erro no cadastro: ${errorData.error}`, 'error');
            }
        } catch (error) {
            mostrarMensagem('Erro na requisição. Tente novamente mais tarde.', 'error');
        }
    });
});
