document.addEventListener('DOMContentLoaded', function() {
    const quadraList = document.querySelector('.quadra-item');
    const filterSelect = document.getElementById('filter-type');
    const layoutDropdown = document.getElementById('layoutDropdown');

    // Função para buscar e exibir as quadras
    async function fetchQuadras() {
        try {
            const response = await fetch('http://127.0.0.1:5000/api/quadras');
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

            // Aplicar o layout inicial (lista)
            changeLayout('list');
        } catch (error) {
            console.error('Erro ao buscar quadras:', error);
            // Lógica para exibir mensagem de erro na interface (ex: alert ou elemento na página)
        }
    }

    // Função para filtrar as quadras (ainda não implementada)
    function filterQuadras() {
        const filterType = filterSelect.value;
        // ... (Lógica para filtrar as quadras com base no tipo)
        fetchQuadras(); // Atualiza a lista de quadras após a filtragem
    }

    // Função para alternar entre os layouts
    function changeLayout(layout) {
        quadraList.className = `video-list ${layout}`;
    }

    // Adicionar evento ao select de filtro (se necessário)
    if (filterSelect) {
        filterSelect.addEventListener('change', filterQuadras);
    }

    // Inicializar componentes do Materialize
    M.AutoInit();

    // Buscar e exibir as quadras ao carregar a página
    fetchQuadras();
});
