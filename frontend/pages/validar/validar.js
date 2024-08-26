document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    const apelido = urlParams.get('apelido'); // Extrai o apelido da URL
    const apelidoUsuarioSpan = document.getElementById('apelido-usuario');
    const mensagemBoasVindas = document.getElementById('mensagem-boas-vindas');
    const senhaInput = document.getElementById('senha');
    const validarEmailBtn = document.getElementById('validar-email');
    const mensagemVerificacao = document.getElementById('mensagem-verificacao');

    // Preenche o apelido no elemento de boas-vindas
    if (apelido) {
        apelidoUsuarioSpan.textContent = apelido;
    } else {
        apelidoUsuarioSpan.textContent = 'Usuário';
    }

    // Validação do token (GET)
    if (token) {
        fetch(`http://138.99.160.212:5000/validar_email?token=${token}`)
            .then(response => {
                if (!response.ok) {
                    throw new Error('Erro ao validar token.');
                }
                return response.json();
            })
            .then(data => {
                if (!data.success) {
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
    } else {
        console.error('Token ausente na URL');
        return;
    }

    // Confirmação do e-mail com senha (POST)
    validarEmailBtn.addEventListener('click', () => {
        const senha = senhaInput.value;

        if (!senha) {
            mensagemVerificacao.textContent = 'Por favor, insira uma senha.';
            return;
        }

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
