document.addEventListener('DOMContentLoaded', function () {
    const cadastroForm = document.getElementById('cadastro-form');
    const nomeCompletoInput = document.getElementById('nome_completo');
    const apelidoInput = document.getElementById('apelido');
    const numeroJogadorInput = document.getElementById('numero_jogador');
    const emailInput = document.getElementById('email');
    const celularInput = document.getElementById('celular');
    const senhaInput = document.getElementById('senha');
    const confirmaSenhaInput = document.getElementById('confirma_senha');
    const errorMessage = document.querySelector('.error-message');

    // Função para validar o nome completo
    function validarNomeCompleto() {
        const nome = nomeCompletoInput.value.trim();
        return nome.split(' ').length >= 2; // Verifica se há pelo menos 2 nomes
    }

    // Função para validar o apelido
    function validarApelido() {
        const apelido = apelidoInput.value.trim();
        return apelido.length <= 20; // Verifica se o apelido tem no máximo 20 caracteres
    }

    // Função para validar o número do jogador
    function validarNumeroJogador() {
        const numero = numeroJogadorInput.value.trim();
        return /^\d{2}$/.test(numero); // Verifica se o número tem exatamente 2 dígitos
    }

    // Função para validar o email
    function validarEmail() {
        const email = emailInput.value.trim();
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email); // Verifica se o email tem um formato válido
    }

    // Função para aplicar a máscara no campo de celular
    function aplicarMascaraCelular(input) {
        let valor = input.value.replace(/\D/g, ''); // Remove tudo que não for dígito
        valor = valor.replace(/^(\d{2})(\d)/g, '($1) $2'); // Coloca parênteses em volta dos dois primeiros dígitos
        valor = valor.replace(/(\d)(\d{4})$/, '$1-$2'); // Coloca hífen entre o quinto e o sexto dígitos
        input.value = valor;
    }

    // Adicionar evento de input ao campo de celular
    celularInput.addEventListener('input', () => {
        aplicarMascaraCelular(celularInput);
        // Validação do celular após aplicar a máscara
        if (!validarCelular()) {
            mostrarErro(celularInput, 'Digite um número de celular válido no formato (DD) XXXXX-XXXX.');
        } else {
            ocultarErro(celularInput);
        }
    });

    // Função para validar a senha
    function validarSenha() {
        const senha = senhaInput.value.trim();
        return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{6,}$/.test(senha); // Verifica se a senha tem pelo menos 6 caracteres, 1 letra maiúscula, 1 letra minúscula, 1 número e 1 caractere especial
    }

    // Função para validar a confirmação da senha
    function validarConfirmaSenha() {
        const senha = senhaInput.value.trim();
        const confirmaSenha = confirmaSenhaInput.value.trim();
        return senha === confirmaSenha; // Verifica se as senhas são iguais
    }

// Função para exibir/ocultar mensagem de erro
function mostrarErro(inputElement, mensagem) {
    const errorContainer = document.getElementById('error-container'); // Seleciona o container de erro
    errorContainer.textContent = mensagem;
    errorContainer.classList.add('show'); // Exibe a mensagem

    // Timeout para remover a mensagem de erro após 10 segundos
    setTimeout(() => {
        ocultarErro(errorContainer); // Passa o container como argumento
    }, 3000);
}

function ocultarErro(errorContainer) { // Recebe o container como argumento
    errorContainer.classList.remove('show'); // Oculta a mensagem
}

    // Adicionar eventos de blur aos campos do formulário
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

    numeroJogadorInput.addEventListener('blur', () => {
        if (!validarNumeroJogador()) {
            mostrarErro(numeroJogadorInput, 'O número deve ter exatamente 2 dígitos.');
        } else {
            ocultarErro(numeroJogadorInput);
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

    // Função para enviar os dados do formulário de cadastro para a API
async function registro() {
    // Obter os valores dos campos do formulário
    const nomeCompleto = document.getElementById('nome_completo').value;
    const apelido = document.getElementById('apelido').value;
    const numeroJogador = document.getElementById('numero_jogador').value;
    const email = document.getElementById('email').value;
    const celular = document.getElementById('celular').value;
    const senha = document.getElementById('senha').value;
    const confirmaSenha = document.getElementById('confirma_senha').value;

    // Verificar se todos os campos estão válidos
    if (!validarNomeCompleto() || !validarApelido() || !validarNumeroJogador() ||
        !validarEmail() || !validarCelular() || !validarSenha() || !validarConfirmaSenha()) {
        return; // Não envia o formulário se houver erros de validação
    }

    try {
        const response = await fetch('http://138.99.160.212:5000/api/cadastro', { // Substitua pela URL da sua API
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
                senha: senha,
                confirma_senha: confirmaSenha
            })
        });

        if (response.ok) {
            // Cadastro bem-sucedido
            console.log('Cadastro bem-sucedido!');
            window.location.href = '/login'; // Redireciona para a página de login
        } else {
            // Cadastro falhou
            const errorData = await response.json();
            console.error('Erro no cadastro:', errorData.error);

            // Exibir mensagem de erro
            if (errorMessage) {
                errorMessage.textContent = errorData.error;
                errorMessage.style.display = 'block'; 
            } else {
                alert(errorData.error); 
            }
        }
    } catch (error) {
        console.error('Erro na requisição:', error);
        // Exibir mensagem de erro genérica
        if (errorMessage) {
            errorMessage.textContent = 'Ocorreu um erro ao realizar o cadastro.';
            errorMessage.style.display = 'block'; 
        } else {
            alert('Ocorreu um erro ao realizar o cadastro.');
        }
    }
}

});
cadastroForm.addEventListener('submit', registro); // Chama a função registro ao enviar o formulário
