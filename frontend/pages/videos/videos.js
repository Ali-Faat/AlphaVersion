document.addEventListener('DOMContentLoaded', function () {
    const videoContainer = document.getElementById('video-container');
    const quadraNomeElement = document.getElementById('quadra-nome');

    // Função para obter o ID da quadra da URL
    function getQuadraIdFromUrl() {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get('quadra_id');
    }

    // Função para buscar e exibir os vídeos da quadra
    async function fetchVideosByQuadra(quadraId) {
        try {
            const response = await fetch(`http://127.0.0.1:5000/api/videos?quadra_id=${quadraId}`);

            if (!response.ok) {
                throw new Error(`Erro HTTP: ${response.status}`);
            }

            const videos = await response.json();

            // Limpar o container de vídeos
            videoContainer.innerHTML = '';

            if (videos.length === 0) {
                const noVideosMessage = document.createElement('p');
                noVideosMessage.textContent = 'Nenhum vídeo encontrado para esta quadra.';
                videoContainer.appendChild(noVideosMessage);
            } else {
                videos.forEach(video => {
                    const videoElement = document.createElement('video');
                    videoElement.src = video.url;
                    videoElement.controls = true;
                    videoElement.width = 320;
                    videoElement.height = 240;

                    const videoTitle = document.createElement('h3');
                    videoTitle.textContent = video.tipo;

                    const videoItem = document.createElement('div');
                    videoItem.classList.add('video-item');
                    //videoItem.appendChild(videoTitle);
                    videoItem.appendChild(videoElement);

                    videoContainer.appendChild(videoItem);
                });
            }
        } catch (error) {
            console.error('Erro ao buscar vídeos da quadra:', error);
            // Exibir mensagem de erro na interface
            const errorMessage = document.createElement('p');
            errorMessage.textContent = 'Ocorreu um erro ao carregar os vídeos.';
            videoContainer.appendChild(errorMessage);
        }
    }

    // Função para buscar o nome da quadra
    async function fetchQuadraNome(quadraId) {
        try {
            const response = await fetch(`http://127.0.0.1:5000/api/quadras/${quadraId}`);
            if (!response.ok) {
                throw new Error(`Erro HTTP: ${response.status}`);
            }
            const quadra = await response.json();

            quadraNomeElement.textContent = quadra.nome;
        } catch (error) {
            console.error('Erro ao buscar nome da quadra:', error);
            // Exibir mensagem de erro na interface
            const errorMessage = document.createElement('p');
            errorMessage.textContent = 'Ocorreu um erro ao carregar o nome da quadra.';
            quadraNomeElement.appendChild(errorMessage); // Adiciona a mensagem ao elemento do nome da quadra
        }
    }

    // Buscar o nome da quadra e os vídeos ao carregar a página
    const quadraId = getQuadraIdFromUrl();
    if (quadraId) {
        fetchQuadraNome(quadraId);
        fetchVideosByQuadra(quadraId);
    } else {
        // Redirecionar para a página inicial ou exibir uma mensagem de erro
        window.location.href = 'quadras.html'; // Exemplo de redirecionamento
    }
});
