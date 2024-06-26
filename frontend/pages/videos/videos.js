document.addEventListener('DOMContentLoaded', function() {
    const videoList = document.querySelector('.video-list');
    const filterSelect = document.getElementById('filter-type');
    const layoutButtons = document.querySelectorAll('.layout-button');

    // Função para buscar e exibir os vídeos (substitua pela lógica real)
    function fetchVideos() {
        // ... (Lógica para buscar os vídeos do backend)
    }

    // Função para filtrar os vídeos
    function filterVideos() {
        const filterType = filterSelect.value;
        // ... (Lógica para filtrar os vídeos com base no tipo)
    }

    // Função para alternar entre os layouts
    function changeLayout(layout) {
        videoList.className = `video-list ${layout}`;
    }

    // Adicionar eventos aos botões de layout
    layoutButtons.forEach(button => {
        button.addEventListener('click', () => {
            changeLayout(button.dataset.layout);
        });
    });

    // Adicionar evento ao select de filtro
    filterSelect.addEventListener('change', filterVideos);

    // Buscar e exibir os vídeos iniciais
    fetchVideos();

    // Inicializar componentes do Materialize
    M.AutoInit();
});
