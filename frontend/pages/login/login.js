document.addEventListener('DOMContentLoaded', async function() {

    // Função para carregar a URL da API a partir do arquivo config.json
    async function getApiUrl() {
        try {
            const response = await fetch('../../config.json'); // Caminho para o config.json
            if (!response.ok) {
                throw new Error('Erro ao carregar o arquivo config.json');
            }
            const config = await response.json();
            return config.API.API_URL; // Retorna a URL da API
        } catch (error) {
            console.error('Erro ao buscar a URL da API:', error);
            return null; // Lidar com o erro de forma apropriada
        }
    }


    // Função para buscar a URL da API
    const apiUrl = await getApiUrl(); // Carrega a URL da API dinamicamente

    if (!apiUrl) {
        console.error('Não foi possível carregar a URL da API.');
        return; // Pare a execução se a URL da API não foi carregada
    }

    // Manipulação do formulário de login
    const loginForm = document.getElementById('loginForm');

    loginForm.addEventListener('submit', async (event) => {
        event.preventDefault();

        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;

        try {
            const response = await fetch(`${apiUrl}api/login`, { // Usando a URL da API carregada
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    email: email,
                    password: password
                })
            });

            if (response.ok) {
                const data = await response.json();
                window.location.href = '../home/home.html';
            } else {
                const errorData = await response.json();
                console.error('Erro no login:', errorData.error);
                mostrarErro(errorData.error);
            }
        } catch (error) {
            console.error('Erro na requisição:', error);
            mostrarErro('Erro na requisição. Tente novamente mais tarde.');
        }
    });

    // Função para exibir mensagens de erro na interface
    function mostrarErro(mensagem) {
        let errorMessage = document.querySelector('.error-message');

        // Verifica se o elemento já existe
        if (!errorMessage) {
            // Se não existir, cria o elemento
            errorMessage = document.createElement('div');
            errorMessage.classList.add('error-message');
            errorMessage.style.color = 'red'; // Estilização básica, você pode mover isso para o CSS
            errorMessage.style.marginTop = '10px';

            // Insere o elemento de erro logo após o formulário
            loginForm.parentNode.insertBefore(errorMessage, loginForm.nextSibling);
        }

        // Define a mensagem de erro e mostra o elemento
        errorMessage.textContent = mensagem;
        errorMessage.classList.add('show'); // Se houver uma classe CSS para exibir o erro

        // Timeout para remover a mensagem de erro após 3 segundos
        setTimeout(() => {
            ocultarErro();
        }, 3000);
    }

    // Função para ocultar a mensagem de erro
    function ocultarErro() {
        const errorMessage = document.querySelector('.error-message');
        if (errorMessage) {
            errorMessage.classList.remove('show');
            errorMessage.textContent = ''; // Limpa o texto da mensagem
        }
    }

    // Função para alternar visibilidade da senha
    document.getElementById('togglePassword').addEventListener('click', function (e) {
        const passwordInput = document.getElementById('password');
        const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
        passwordInput.setAttribute('type', type);
        this.textContent = type === 'password' ? '👁️' : '🙈';
    });

    // Inicializa a funcionalidade de redefinição de senha
    initResetPassword();
});

// Função para inicializar o reset de senha
function initResetPassword() {
    const forgotPasswordBtn = document.querySelector('.btn-secondary');
    const resetPasswordPopup = document.getElementById('resetPasswordPopup');
    const closePopupBtn = document.getElementById('closePopup');
    const resetPasswordForm = document.getElementById('resetPasswordForm');
    const infoMessage = document.getElementById('infoMessage');

    forgotPasswordBtn.addEventListener('click', () => {
        resetPasswordPopup.style.display = 'block';
    });

    closePopupBtn.addEventListener('click', () => {
        resetPasswordPopup.style.display = 'none';
        infoMessage.style.display = 'none';
    });

    resetPasswordForm.addEventListener('submit', async (event) => {
        event.preventDefault();

        const email = document.getElementById('resetEmail').value;
        const apiUrl = await getApiUrl(); // Carrega a URL da API dinamicamente para o reset de senha

        try {
            const response = await fetch(`${apiUrl}api/reset-password`, { // Usando a URL da API carregada
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    email: email
                })
            });

            if (response.ok) {
                infoMessage.textContent = 'Se o e-mail estiver cadastrado, você receberá um link para redefinir sua senha.';
                infoMessage.style.display = 'block';
                infoMessage.style.color = 'green';
            } else {
                infoMessage.textContent = 'Erro ao enviar o e-mail. Tente novamente mais tarde.';
                infoMessage.style.display = 'block';
                infoMessage.style.color = 'red';
            }
        } catch (error) {
            console.error('Erro na requisição:', error);
            infoMessage.textContent = 'Erro na requisição. Tente novamente mais tarde.';
            infoMessage.style.display = 'block';
            infoMessage.style.color = 'red';
        }
    });

    window.addEventListener('click', (event) => {
        if (event.target == resetPasswordPopup) {
            resetPasswordPopup.style.display = 'none';
            infoMessage.style.display = 'none';
        }
    });
}
