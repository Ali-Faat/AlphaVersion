document.addEventListener('DOMContentLoaded', function() {
    const quadraList = document.querySelector('.quadra-list');
    const filterInput = document.getElementById('filter-name');
    const errorMessage = document.querySelector('.error-banner');
    const closeBanner = document.getElementById('close-banner');

    // Função para buscar e exibir as quadras
    async function fetchQuadras(nome = '') {
        try {
            let url = 'http://138.99.160.212:5000/api/quadras';
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

                // Link para a página de vídeos da quadra
                const quadraLink = document.createElement('a');
                quadraLink.href = `../videos/videos.html?quadra_id=${quadra.id}`;
                quadraLink.dataset.quadraId = quadra.id;
                quadraLink.innerHTML = `<h3>${quadra.nome}</h3>`;
                quadraItem.appendChild(quadraLink);

                // Exibir o endereço da quadra
                const enderecoQuadra = document.createElement('p');
                enderecoQuadra.textContent = quadra.endereco;
                quadraItem.appendChild(enderecoQuadra);

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
        errorMessage.querySelector('#error-text').textContent = mensagem;
        errorMessage.classList.add('show');

        // Timeout para remover a mensagem de erro após 10 segundos
        setTimeout(() => {
            ocultarErro();
        }, 10000);
    }

    // Função para ocultar mensagens de erro na interface
    function ocultarErro() {
        errorMessage.classList.remove('show');
        errorMessage.querySelector('#error-text').textContent = '';
    }

    // Listener para o botão de fechar o banner
    closeBanner.addEventListener('click', ocultarErro);

    // Adicionar evento ao campo de entrada de nome de quadra
    if (filterInput) {
        filterInput.addEventListener('input', () => {
            const nome = filterInput.value.trim();
            fetchQuadras(nome);
        });
    }

    // Buscar e exibir as quadras ao carregar a página
    fetchQuadras();

    // Aplicar o tema com base na preferência do sistema
    const prefersDarkScheme = window.matchMedia("(prefers-color-scheme: dark)");
    if (prefersDarkScheme.matches) {
        document.documentElement.setAttribute("data-theme", "dark");
    } else {
        document.documentElement.setAttribute("data-theme", "light");
    }
});
