document.addEventListener('DOMContentLoaded', function() {
    const elems = document.querySelectorAll('.sidenav');
    M.Sidenav.init(elems);

    // Obter o menu desktop e o menu mobile
    const desktopMenu = document.querySelector('nav ul.right');
    const mobileMenu = document.querySelector('.sidenav');

    // Função para verificar o tamanho da tela e exibir o menu correto
    function checkScreenSize() {
        if (window.innerWidth < 768) {
            desktopMenu.classList.add('hide');
            mobileMenu.classList.remove('hide');
        } else {
            desktopMenu.classList.remove('hide');
            mobileMenu.classList.add('hide');
        }
    }

    // Chamar a função ao carregar a página e ao redimensionar a janela
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
});
