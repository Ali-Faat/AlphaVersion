document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    const apelido = urlParams.get('apelido');
    const mensagemBoasVindas = document.getElementById('mensagem-boas-vindas');
    const apelidoUsuarioSpan = document.getElementById('apelido-usuario');
    const senhaInput = document.getElementById('senha');
    const validarEmailBtn = document.getElementById('validar-email');
    const mensagemVerificacao = document.getElementById('mensagem-verificacao');

    if (!token || !apelido) {
        console.error('Token ou apelido ausente na URL');
        return;
    }

    // Exibe o apelido diretamente da URL
    apelidoUsuarioSpan.textContent = apelido || 'Usuário';

    // Primeira requisição: Obter dados do usuário (GET)
    fetch(`http://138.99.160.212:5000/validar_email?token=${token}&apelido=${apelido}`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Erro ao validar token.');
            }
            return response.json();
        })
        .then(data => {
            if (data.success) {
                console.log('Validação bem-sucedida:', data);
                window.location.href = `http://goalcast.com.br:8000/pages/validar/validar.html?token=${token}`;
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

        if (!senha) {
            mensagemVerificacao.textContent = 'Por favor, insira uma senha.';
            return;
        }

        // Desabilita o botão para evitar múltiplos cliques
        validarEmailBtn.disabled = true;
        mensagemVerificacao.textContent = 'Validando, por favor aguarde...';

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
                validarEmailBtn.disabled = false;
            }
        })
        .catch(error => {
            mensagemVerificacao.textContent = error.message;
            validarEmailBtn.disabled = false;
        });
    });
});
