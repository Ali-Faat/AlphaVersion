document.addEventListener('DOMContentLoaded', function() {
    const form = document.querySelector('.reset-form');

    form.addEventListener('submit', async function(event) {
        event.preventDefault(); // Impede o envio padrão do formulário

        // Captura os dados do formulário
        const email = document.querySelector('#email').value;
        const password = document.querySelector('#password').value;
        const confirmPassword = document.querySelector('#confirm-password').value;

        // Validação básica no lado do cliente
        if (password !== confirmPassword) {
            alert('As senhas não coincidem!');
            return;
        }

        // Dados que serão enviados para a API
        const data = {
            email: email,
            password: password
        };

        try {
            // Envio dos dados para a API
            const response = await fetch('http://138.99.160.212:5000/api/reset-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });

            // Verifica a resposta da API
            if (response.ok) {
                const result = await response.json();
                alert(result.message || 'Senha redefinida com sucesso!');
                // Redirecionar ou limpar o formulário conforme necessário
                window.location.href = '/login'; // Exemplo de redirecionamento após sucesso
            } else {
                const error = await response.json();
                alert(error.message || 'Ocorreu um erro ao redefinir a senha.');
            }
        } catch (error) {
            console.error('Erro ao redefinir a senha:', error);
            alert('Ocorreu um erro inesperado. Tente novamente mais tarde.');
        }
    });
});
