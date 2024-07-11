document.addEventListener('DOMContentLoaded', function () {
    const cadastroForm = document.getElementById('cadastro-form');
    const errorMessage = document.querySelector('.error-message');

    // Funções de validação
    function validarNomeCompleto() {
        const nome = nomeCompletoInput.value.trim();
        return nome.split(' ').length >= 2;
    }

    function validarApelido() {
        const apelido = apelidoInput.value.trim();
        return apelido.length <= 20;
    }

    function validarNumeroJogador() {
        const numero = numeroJogadorInput.value.trim();
        return /^\d{2}$/.test(numero);
    }

    function validarEmail() {
        const email = emailInput.value.trim();
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }

    function validarCelular() {
        const celular = celularInput.value.trim();
        return /^\(\d{2}\)\s\d{5}-\d{4}$/.test(celular);
    }

    function validarSenha() {
        const senha = senhaInput.value.trim();
        return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{6,}$/.test(senha);
    }

    function validarConfirmaSenha() {
        const senha = senhaInput.value.trim();
        const confirmaSenha = confirmaSenhaInput.value.trim();
        return senha === confirmaSenha;
    }

    // Função para aplicar a máscara no campo de celular
    function aplicarMascaraCelular(input) {
        let valor = input.value.replace(/\D/g, '');
        valor = valor.replace(/^(\d{2})(\d)/g, '($1) $2');
        valor = valor.replace(/(\d)(\d{4})$/, '$1-$2');
        input.value = valor;
    }

    // Função para exibir/ocultar mensagem de erro
    function mostrarErro(elemento, mensagem) {
        elemento.textContent = mensagem;
        elemento.classList.add('show');
        setTimeout(() => {
            ocultarErro(elemento);
        }, 3000); // 3 segundos
    }

    function ocultarErro(elemento) {
        elemento.textContent = '';
        elemento.classList.remove('show');
    }

    // Seleciona os elementos do formulário
    const nomeCompletoInput = document.getElementById('nome_completo');
    const apelidoInput = document.getElementById('apelido');
    const numeroJogadorInput = document.getElementById('numero_jogador');
    const emailInput = document.getElementById('email');
    const celularInput = document.getElementById('celular');
    const senhaInput = document.getElementById('senha');
    const confirmaSenhaInput = document.getElementById('confirma_senha');

    // Adicionar eventos de blur aos campos do formulário (validação em tempo real)
    nomeCompletoInput.addEventListener('blur', () => validarCampo(nomeCompletoInput, validarNomeCompleto, 'Digite pelo menos dois nomes.'));
    apelidoInput.addEventListener('blur', () => validarCampo(apelidoInput, validarApelido, 'O apelido deve ter no máximo 20 caracteres.'));
    numeroJogadorInput.addEventListener('blur', () => validarCampo(numeroJogadorInput, validarNumeroJogador, 'O número deve ter exatamente 2 dígitos.'));
    emailInput.addEventListener('blur', () => validarCampo(emailInput, validarEmail, 'Digite um e-mail válido.'));
    celularInput.addEventListener('blur', () => validarCampo(celularInput, validarCelular, 'Digite um número de celular válido no formato (DD) XXXXX-XXXX.'));
    senhaInput.addEventListener('blur', () => validarCampo(senhaInput, validarSenha, 'A senha deve ter pelo menos 6 caracteres, 1 letra maiúscula, 1 letra minúscula, 1 número e 1 caractere especial.'));
    confirmaSenhaInput.addEventListener('blur', () => validarCampo(confirmaSenhaInput, validarConfirmaSenha, 'As senhas não coincidem.'));

    // Função auxiliar para validar um campo e exibir/ocultar erro
    function validarCampo(inputElement, validationFunction, errorMessage) {
        if (!validationFunction()) {
            mostrarErro(errorMessage, errorMessage);
            inputElement.classList.add('invalid');
        } else {
            ocultarErro(errorMessage);
            inputElement.classList.remove('invalid');
        }
    }

    // Função para enviar os dados do formulário de cadastro para a API
    async function registrarUsuario(event) {
        event.preventDefault(); // Previne o comportamento padrão de envio do formulário

        // Obter os valores dos campos do formulário
        const nomeCompleto = nomeCompletoInput.value.trim();
        const apelido = apelidoInput.value.trim();
        const numeroJogador = numeroJogadorInput.value.trim();
        const email = emailInput.value.trim();
        const celular = celularInput.value.replace(/\D/g, ''); // Remove caracteres não numéricos
        const senha = senhaInput.value;

        try {
            const response = await fetch('http://138.99.160.212:5000/api/cadastro', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    nome_completo: nomeCompleto,
                    apelido: apelido,
                    numero_jogador: numeroJogador,
                    email: email,
                    celular: celular,
                    senha: senha
                })
            });

            if (response.ok) {
                // Cadastro bem-sucedido
                const data = await response.json();
                console.log(data.message);
                window.location.href = 'login.html'; // Redireciona para a página de login
            } else {
                // Cadastro falhou
                const errorData = await response.json();
                console.error('Erro no cadastro:', errorData.error);
                mostrarErro(errorMessage, errorData.error);
            }
        } catch (error) {
            console.error('Erro na requisição:', error);
            mostrarErro(errorMessage, 'Ocorreu um erro ao realizar o cadastro.');
        }
    }

    // Adicionar evento de input ao campo de celular (máscara)
    celularInput.addEventListener('input', () => aplicarMascaraCelular(celularInput));

    // Adicionar evento de submit ao formulário
    cadastroForm.addEventListener('submit', registrarUsuario);

    // Inicializar componentes do Materialize
    M.AutoInit();
});

