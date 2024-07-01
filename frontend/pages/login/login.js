document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('login-form');

    loginForm.addEventListener('submit', async (event) => {
        event.preventDefault();

        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;

        try {
            const response = await fetch('http://127.0.0.1:5000/api/login', {
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
                window.location.href = '../quadras/quadras.html'
            } else {
                const errorData = await response.json();
                console.error('Erro no login:', errorData.error);
                // Lógica para exibir mensagem de erro na interface
            }
        } catch (error) {
            console.error('Erro na requisição:', error);
            // Lógica para exibir mensagem de erro na interface
        }
    });
});

document.addEventListener('DOMContentLoaded', function() {
    M.AutoInit(); // Inicializar componentes do Materialize
});
