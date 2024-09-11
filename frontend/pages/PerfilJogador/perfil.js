document.getElementById("salvar").addEventListener('click', function () {
    // Captura os dados dos inputs
    const nickname = document.getElementById('nickname').value;
    const nome = document.getElementById('nome').value;
    const nascimento = document.getElementById('nascimento').value;
    const descricao = document.getElementById('descricao').value;
    const numero = document.getElementById('numero').value;
    const posicao = document.getElementById('posicao').value;
    const altura = document.getElementById('altura').value;
    const peso = document.getElementById('peso').value;
    const pePref = document.getElementById('pePref').value;

    // Dados para enviar na requisição
    const dados = {
        user: nickname,
        nome: nome, // Adicionado nome no objeto
        nascimento: nascimento,
        bio: descricao,
        nCamiseta: parseInt(numero),
        posicao: posicao,
        altura: parseFloat(altura),
        peso: parseFloat(peso),
        peDominante: pePref
    };

    // Faz a requisição POST para a API Flask
    fetch('http://192.168.1.12:5000/add_jogador', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(dados), // Converte os dados para JSON
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok ' + response.statusText);
        }
        return response.json();
    })
    .then(data => {
        // Exibe uma mensagem de sucesso ou erro
        alert('Jogador adicionado com sucesso!');
        console.log('Success:', data);
    })
    .catch((error) => {
        console.error('Error:', error);
        alert('Ocorreu um erro ao adicionar o jogador.');
    });
});
