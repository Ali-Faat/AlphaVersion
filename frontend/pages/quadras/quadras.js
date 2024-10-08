document.addEventListener('DOMContentLoaded', function() {
    const quadraList = document.querySelector('.quadra-list');
    const filterInput = document.getElementById('filter-name');
    const errorMessage = document.querySelector('.error-message');

    // Função para buscar e exibir as quadras
    async function fetchQuadras(nome = '') {
        try {
            let url = 'https://api.sportflyx.com:5000/api/quadras';
            if (nome) {
                url += `?nome=${encodeURIComponent(nome)}`;
            }
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`Erro HTTP: ${response.status}`);
            }
            const quadras = await response.json();

            // Limpar a lista de quadras
            quadraList.innerHTML = '';

            // Exibir as quadras na lista
            quadras.forEach(quadra => {
                const quadraItem = document.createElement('div');
                quadraItem.classList.add('quadra-item');

                // Logo da quadra usando a URL do campo 'imagens'
                const quadraLogo = document.createElement('img');
                quadraLogo.src = quadra.imagens; // URL do campo 'imagens'
                quadraLogo.alt = `${quadra.nome} logo`;
                quadraLogo.classList.add('quadra-logo');
                quadraItem.appendChild(quadraLogo);

                // Nome e endereço da quadra (link)
                const quadraInfo = document.createElement('div');
                quadraInfo.classList.add('quadra-info');

                const quadraLink = document.createElement('a');
                quadraLink.href = `../videos/videos.html?quadra_id=${quadra.id}`;
                quadraLink.dataset.quadraId = quadra.id;
                quadraLink.innerHTML = `<h3>${quadra.nome}</h3>`;
                quadraInfo.appendChild(quadraLink);

                const enderecoQuadra = document.createElement('p');
                enderecoQuadra.textContent = quadra.endereco;
                quadraInfo.appendChild(enderecoQuadra);

                quadraItem.appendChild(quadraInfo);

                // Avaliação da quadra com base em 'avaliacao_media'
                const quadraRating = document.createElement('div');
                quadraRating.classList.add('quadra-rating');

                for (let i = 0; i < 5; i++) {
                    const starIcon = document.createElement('i');
                    starIcon.classList.add('material-icons');
                    starIcon.textContent = i < Math.round(quadra.avaliacao_media) ? 'star' : 'star_border';
                    quadraRating.appendChild(starIcon);
                }

                quadraItem.appendChild(quadraRating);

                // Adicionar o item da quadra à lista
                quadraList.appendChild(quadraItem);
            });

        } catch (error) {
            console.error('Erro ao buscar quadras:', error);
            mostrarErro('Erro ao buscar quadras. Tente novamente mais tarde.');
        }
    }

    // Função para exibir mensagens de erro na interface
    function mostrarErro(mensagem) {
        errorMessage.textContent = mensagem;
        errorMessage.classList.add('show'); 

        setTimeout(() => {
            ocultarErro();
        }, 3000);
    }

    // Função para ocultar mensagens de erro na interface
    function ocultarErro() {
        errorMessage.classList.remove('show');
        errorMessage.textContent = ''; 
    }

    // Adicionar evento ao campo de entrada de nome de quadra
    if (filterInput) {
        filterInput.addEventListener('input', () => {
            const nome = filterInput.value.trim();
            fetchQuadras(nome);
        });
    }

    // Buscar e exibir as quadras ao carregar a página
    fetchQuadras();
});
