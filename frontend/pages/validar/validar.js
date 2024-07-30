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
    fetch(`http://138.99.160.212:5000/validar_email?token=${token}`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Erro ao validar token.');
            }
            return response.json();
        })
        .then(data => {
            if (data.success) {
                const usuario = data.usuario;
                apelidoUsuarioSpan.textContent = usuario.apelido;
            } else {
                mensagemVerificacao.textContent = data.error;
                mensagemBoasVindas.style.display = 'none';
                senhaInput.style.display = 'none';
                validarEmailBtn.style.display = 'none';
            }
        })
        .catch(error => {
            mensagemVerificacao.textContent = error.message;
            mensagemBoasVindas.style.display = 'none';
            senhaInput.style.display = 'none';
            validarEmailBtn.style.display = 'none';
        });

    // Segunda requisição: Confirmar email com senha (POST)
    validarEmailBtn.addEventListener('click', () => {
        const senha = senhaInput.value;
        fetch('http://138.99.160.212:5000/confirmar_email', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ token: token, senha: senha })
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Erro ao confirmar email.');
            }
            return response.json();
        })
        .then(data => {
            if (data.success) {
                mensagemVerificacao.textContent = data.message;
                setTimeout(() => {
                    window.location.href = '../login/login.html';
                }, 3000);
            } else {
                mensagemVerificacao.textContent = data.error;
            }
        })
        .catch(error => {
            mensagemVerificacao.textContent = error.message;
        });
    });
});
