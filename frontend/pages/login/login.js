document.addEventListener('DOMContentLoaded', function() {
    // Manipulação do formulário de login
    const loginForm = document.getElementById('loginForm');
    const errorMessage = document.querySelector('.error-message'); // Verifique se este seletor está correto e se o elemento existe no HTML

    loginForm.addEventListener('submit', async (event) => {
        event.preventDefault();

        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;

        try {
            const response = await fetch('http://beta.sportflyx.com:5000/api/login', {
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
        if (errorMessage) {
            errorMessage.textContent = mensagem;
            errorMessage.classList.add('show'); // Certifique-se que essa classe CSS existe e está estilizada no CSS

            // Timeout para remover a mensagem de erro após 3 segundos
            setTimeout(() => {
                ocultarErro();
            }, 3000);
        } else {
            console.error('Elemento de mensagem de erro não encontrado no DOM.');
        }
    }

    // Função para ocultar mensagens de erro na interface
    function ocultarErro() {
        if (errorMessage) {
            errorMessage.classList.remove('show'); // Supondo que há uma classe CSS 'show' para ocultar a mensagem
            errorMessage.textContent = ''; // Limpar o texto da mensagem de erro
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

function initResetPassword() {
    const forgotPasswordBtn = document.querySelector('.btn-secondary');
    const resetPasswordPopup = document.getElementById('resetPasswordPopup');
    const closePopupBtn = document.getElementById('closePopup');
    const resetPasswordForm = document.getElementById('resetPasswordForm');
    const infoMessage = document.getElementById('infoMessage');

    // Mostrar o pop-up quando o botão "Esqueci a senha" for clicado
    forgotPasswordBtn.addEventListener('click', () => {
        resetPasswordPopup.style.display = 'block';
    });

    // Fechar o pop-up quando o botão de fechar for clicado
    closePopupBtn.addEventListener('click', () => {
        resetPasswordPopup.style.display = 'none';
        infoMessage.style.display = 'none'; // Esconde a mensagem de informação, se houver
    });

    // Enviar o formulário de redefinição de senha
    resetPasswordForm.addEventListener('submit', async (event) => {
        event.preventDefault();

        const email = document.getElementById('resetEmail').value;

        try {
            const response = await fetch('http://beta.sportflyx.com:5000/api/reset-password', {
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

    // Fechar o pop-up se o usuário clicar fora dele
    window.addEventListener('click', (event) => {
        if (event.target == resetPasswordPopup) {
            resetPasswordPopup.style.display = 'none';
            infoMessage.style.display = 'none'; // Esconde a mensagem de informação, se houver
        }
    });
}