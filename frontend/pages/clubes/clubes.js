document.getElementById('addClubeForm').addEventListener('submit', async function (event) {
    event.preventDefault(); // Evita o envio do formulário de forma padrão

    // Coleta os dados do formulário
    const idusuariocriador = document.getElementById('idusuariocriador').value;
    const nome = document.getElementById('nome').value;
    const icon = document.getElementById('icon').value;
    const idarenasede = document.getElementById('idarenasede').value;
    const senha = document.getElementById('senha').value;

    // Cria um objeto com os dados para enviar via API
    const data = {
        idusuariocriador: idusuariocriador,
        nome: nome,
        icon: icon,
        idarenasede: idarenasede,
        senha: senha
    };

    try {
        // Envio da requisição POST para a API
        const response = await fetch('https://api.sportflyx.com/api/clubes', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });

        // Verifica se a resposta foi bem-sucedida
        if (response.ok) {
            const result = await response.json();
            alert('Clube adicionado com sucesso! ID: ' + result.idclubes);
        } else {
            const error = await response.json();
            alert('Erro ao adicionar clube: ' + error.message);
        }
    } catch (error) {
        alert('Erro de rede: ' + error);
    }
});