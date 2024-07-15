document.addEventListener('DOMContentLoaded', function () {
    const cadastroForm = document.getElementById('cadastro-form');
    const nomeCompletoInput = document.getElementById('nome_completo');
    const apelidoInput = document.getElementById('apelido');
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

        //Envio das informações para a api/cadastro
        const formCadastro = document.getElementById('cadastro-form'); // Seleciona o formulário de cadastro

        formCadastro.addEventListener('submit', async (event) => {
          event.preventDefault(); // Impede o envio padrão do formulário
      
          const formData = new FormData(formCadastro); // Obtém os dados do formulário
          const data = {};
          formData.forEach((value, key) => {
            data[key] = value;
          });
      
          try {
            const response = await fetch('http://138.99.160.212:5000/api/cadastro', { // Substitua pelo seu endereço
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify(data)
            });
      
            if (response.ok) {
              // Cadastro realizado com sucesso
              const loginUrl = '../login/index.html'; // URL da página de login
              const mensagemSucesso = 'Cadastro realizado com sucesso!<br>Faça login para continuar!';
      
              // Redireciona para a página de login com a mensagem
              window.location.href = `${loginUrl}?mensagem=${encodeURIComponent(mensagemSucesso)}`;
            } else {
              // Lidar com erros de cadastro (exibir mensagem de erro, etc.)
              const errorData = await response.json();
              console.error('Erro no cadastro:', errorData.error);
              // Exiba a mensagem de erro para o usuário
            }
          } catch (error) {
            console.error('Erro na requisição:', error);
            // Exiba uma mensagem de erro genérica para o usuário
          }
        });
});
