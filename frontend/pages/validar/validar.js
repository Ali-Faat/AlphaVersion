document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    const mensagemBoasVindas = document.getElementById('mensagem-boas-vindas');
    const apelidoUsuarioSpan = document.getElementById('apelido-usuario');
    const senhaInput = document.getElementById('senha');
    const validarEmailBtn = document.getElementById('validar-email');
    const mensagemVerificacao = document.getElementById('mensagem-verificacao');

    if (!token) {
        mensagemVerificacao.textContent = 'Token de verificação não encontrado na URL.';
        return;
    }

    // Primeira requisição: Obter dados do usuário (GET)
    fetch(`/validar_email?token=${token}`)
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                // Token válido, exibir mensagem de boas-vindas com o apelido
                const usuario = data.usuario;
                apelidoUsuarioSpan.textContent = usuario.apelido;
            } else {
                mensagemVerificacao.textContent = data.error;
                mensagemBoasVindas.style.display = 'none'; // Ocultar a mensagem de boas-vindas
                senhaInput.style.display = 'none';      // Ocultar o campo de senha
                validarEmailBtn.style.display = 'none'; // Ocultar o botão de validar
            }
        })
        .catch(error => {
            mensagemVerificacao.textContent = 'Erro ao validar token. Por favor, tente novamente mais tarde.';
            mensagemBoasVindas.style.display = 'none'; // Ocultar a mensagem de boas-vindas
            senhaInput.style.display = 'none';      // Ocultar o campo de senha
            validarEmailBtn.style.display = 'none'; // Ocultar o botão de validar
        });

    // Segunda requisição: Confirmar email com senha (POST)
    validarEmailBtn.addEventListener('click', () => {
        const senha = senhaInput.value;
        fetch('/confirmar_email', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ token: token, senha: senha })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                mensagemVerificacao.textContent = data.message;
                // Redirecionar para a página de login após um tempo (opcional)
                setTimeout(() => {
                    window.location.href = '../login/login.html';
                }, 3000); // Redireciona após 3 segundos
            } else {
                mensagemVerificacao.textContent = data.error;
            }
        })
        .catch(error => {
            mensagemVerificacao.textContent = 'Erro ao confirmar email. Por favor, tente novamente mais tarde.';
        });
    });
});
