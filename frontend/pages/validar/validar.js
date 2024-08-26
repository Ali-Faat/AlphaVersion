document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const apelido = urlParams.get('apelido'); // Extrai o apelido da URL
    const apelidoUsuarioSpan = document.getElementById('apelido-usuario');
    const mensagemBoasVindas = document.getElementById('mensagem-boas-vindas');
    const emailInput = document.getElementById('email');
    const senhaInput = document.getElementById('senha');
    const validarEmailBtn = document.getElementById('validar-email');
    const mensagemVerificacao = document.getElementById('mensagem-verificacao');

    // Preenche o apelido no elemento de boas-vindas
    if (apelido) {
        apelidoUsuarioSpan.textContent = apelido;
    } else {
        apelidoUsuarioSpan.textContent = 'Usuário';
    }

    // Confirmação do e-mail com senha (POST)
    validarEmailBtn.addEventListener('click', () => {
        const email = emailInput.value;
        const senha = senhaInput.value;

        if (!email || !senha) {
            mensagemVerificacao.textContent = 'Por favor, insira o e-mail e a senha.';
            return;
        }

        validarEmailBtn.disabled = true;
        mensagemVerificacao.textContent = 'Validando, por favor aguarde...';

        fetch('http://138.99.160.212:5000/confirmar_email', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email: email, senha: senha })
        })
        .then(response => {
            return response.json();
        })
        .then(data => {
            if (data.success) {
                alert(data.message);  // Exibe a mensagem de sucesso
                window.location.href = 'http://goalcast.com.br:8000/pages/login/login.html';  // Redireciona
            } else {
                alert(data.error);  // Exibe a mensagem de erro
            }
        })
        .catch(error => {
            console.error('Erro:', error);
        });
    });
});
