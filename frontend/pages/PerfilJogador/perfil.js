document.addEventListener('DOMContentLoaded', function() {
    // Função para carregar CSS dinamicamente
    function carregarCSS(href) {
        const link = document.createElement("link");
        link.rel = "stylesheet";
        link.href = href;
        document.head.appendChild(link);
        document.getElementById('login-container').style.display = 'none';
    }

    // Função para salvar os dados do perfil
    const prx = document.getElementById('prx');
    prx.addEventListener('click', function(event) {
        document.getElementById('login-container').style.display = 'block';
        document.getElementById('span').style.display = 'none';
    });

    // Função para verificar se o usuário está autenticado via sessão
    function verificarAutenticacao() {
        fetch('https://api.sportflyx.com:5000/api/check_auth', { // Verifique se o caminho está correto
            method: 'GET',
            credentials: 'include' // Envia os cookies de sessão
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Erro na verificação de autenticação: ' + response.status);
            }
            return response.json();
        })
        .then(data => {
            if (data.autenticado) {
                // Se o usuário estiver autenticado, exibe o formulário de perfil e carrega o CSS de perfil
                document.getElementById('perfil-form').style.display = 'block';
                document.getElementById('login-container').style.display = 'none';
                carregarCSS('perfil.css'); // Carrega o CSS do perfil
            } else {
                // Se o usuário não estiver autenticado, exibe o formulário de login e carrega o CSS de login
                document.getElementById('perfil-form').style.display = 'none';
                document.getElementById('login-container').style.display = 'block';
                carregarCSS('login.css'); // Carrega o CSS do login
            }
        })
        .catch(error => {
            console.error('Erro ao verificar autenticação:', error);
            // Em caso de erro, exibe o formulário de login e carrega o CSS de login
            document.getElementById('perfil-form').style.display = 'none';
            document.getElementById('login-container').style.display = 'block';
            carregarCSS('login.css');
        });
    }

    // Função para alternar a visibilidade da senha
    const togglePasswordBtn = document.getElementById('togglePassword');
    const passwordInput = document.getElementById('password');

    togglePasswordBtn.addEventListener('click', function() {
        const type = passwordInput.type === 'password' ? 'text' : 'password';
        passwordInput.type = type;
        togglePasswordBtn.innerHTML = type === 'password' ? '&#128065;' : '&#128064;'; // Altera o ícone
    });

    // Função para realizar o login
    const loginForm = document.getElementById('loginForm');
    loginForm.addEventListener('submit', function(event) {
        event.preventDefault(); // Evita o envio padrão do formulário

        const email = document.getElementById('email').value;
        const password = passwordInput.value;

        const loginData = {
            email: email,
            password: password
        };

        // Realiza a requisição de login
        fetch('https://api.sportflyx.com:5000/api/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(loginData),
            credentials: 'include' // Envia os cookies de sessão
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Login falhou: ' + response.statusText);
            }
            return response.json();
        })
        .then(data => {
            if (data.message === 'Login bem-sucedido') {
                // Login bem-sucedido, exibe o formulário de perfil e carrega o CSS de perfil
                document.getElementById('login-container').style.display = 'none';
                document.getElementById('perfil-form').style.display = 'block';
                carregarCSS('perfil.css'); // Carrega o CSS do perfil
            } else {
                alert('Erro: ' + data.error);
            }
        })
        .catch(error => {
            console.error('Erro no login:', error);
            alert('Ocorreu um erro ao fazer login.');
        });
    });

    // Função para salvar os dados do perfil
    const salvarBtn = document.getElementById('salvar');
    salvarBtn.addEventListener('click', function(event) {
        event.preventDefault();

        const nickname = document.getElementById('nickname').value;
        const nome = document.getElementById('nome').value;
        const nascimento = document.getElementById('nascimento').value;
        const descricao = document.getElementById('descricao').value;
        const numero = document.getElementById('numero').value;
        const posicao = document.getElementById('posicao').value;
        const altura = document.getElementById('altura').value;
        const peso = document.getElementById('peso').value;
        const pePref = document.getElementById('pePref').value;

        const dados = {
            user: nickname,
            nome: nome,
            nascimento: nascimento,
            bio: descricao,
            nCamiseta: parseInt(numero),
            posicao: posicao,
            altura: parseFloat(altura),
            peso: parseFloat(peso),
            peDominante: pePref
        };

        // Envia os dados para o servidor
        fetch('https://api.sportflyx.com:5000/api/add_jogador', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(dados),
            credentials: 'include' // Envia os cookies de sessão
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Erro ao salvar: ' + response.statusText);
            }
            return response.json();
        })
        .then(data => {
            alert('Perfil salvo com sucesso!');
        })
        .catch(error => {
            console.error('Erro ao salvar perfil:', error);
            alert('Ocorreu um erro ao salvar o perfil.');
        });
    });

    // Verifica a autenticação ao carregar a página
    verificarAutenticacao();
});
