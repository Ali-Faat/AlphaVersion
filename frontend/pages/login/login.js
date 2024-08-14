document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('loginForm');
    const errorMessage = document.querySelector('.error-message'); // Elemento para exibir mensagens de erro

    loginForm.addEventListener('submit', async (event) => {
        event.preventDefault();

        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;

        try {
            const response = await fetch('http://138.99.160.212:5000/api/login', {
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
                window.location.href = '../quadras/quadras.html';
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
        errorMessage.textContent = mensagem;
        errorMessage.classList.add('show'); // Supondo que há uma classe CSS 'show' para exibir a mensagem

        // Timeout para remover a mensagem de erro após 3 segundos
        setTimeout(() => {
            ocultarErro();
        }, 3000);
    }

    // Função para ocultar mensagens de erro na interface
    function ocultarErro() {
        errorMessage.classList.remove('show'); // Supondo que há uma classe CSS 'show' para ocultar a mensagem
        errorMessage.textContent = ''; // Limpar o texto da mensagem de erro
    }

    // Inicialização de componentes adicionais (se necessário)
    // M.AutoInit(); // Inicializar componentes do Materialize, se estiver em uso
});

// Função para alternar visibilidade da senha
document.getElementById('togglePassword').addEventListener('click', function (e) {
    const passwordInput = document.getElementById('password');
    const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
    passwordInput.setAttribute('type', type);
    this.textContent = type === 'password' ? '👁️' : '🙈';
});
