document.addEventListener('DOMContentLoaded', function () {
    const videoContainer = document.getElementById('video-container');
    const partidaSelect = document.getElementById('partida-select');

    // Função para obter o ID da quadra da URL
    function getQuadraIdFromUrl() {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get('quadra_id');
    }

    function formatDate(dateStr) {
        const date = new Date(dateStr);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0'); // Mês começa em 0
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    // Função para exibir uma mensagem de erro/informação
    function exibirMensagem(mensagem, container, isError = true) {
        const messageElement = document.createElement('p');
        messageElement.textContent = mensagem;
        messageElement.style.color = isError ? 'red' : 'black';
        container.innerHTML = '';
        container.appendChild(messageElement);
    }

    // Função para criar um elemento de vídeo
    function criarVideoElement(video) {
        const videoElement = document.createElement('video');
        videoElement.src = video.url;
        videoElement.controls = true;
        videoElement.width = 320;
        videoElement.height = 240;
        return videoElement;
    }

    // Função para buscar e exibir os vídeos da quadra
    async function fetchVideosByQuadra(quadraId) {
        try {
            // Busca as partidas da quadra selecionada
            const partidasResponse = await fetch(`http://127.0.0.1:5000/api/partidas/${quadraId}`); // Substitua pela URL correta da sua API
            if (!partidasResponse.ok) {
                throw new Error(`Erro HTTP: ${partidasResponse.status}`);
            }
            const partidas = await partidasResponse.json();

            if (partidas.length === 0) {
                exibirMensagem('Nenhuma partida encontrada para esta quadra.', videoContainer);
                return;
            }

            // Popula o menu dropdown com as partidas
            const dataPartidaInput = document.getElementById('data-partida');
            const horaPartidaSelect = document.getElementById('hora-partida');

            horaPartidaSelect.innerHTML = ''; // Limpar as opções de hora
            const defaultOption = document.createElement('option');
            defaultOption.value = '';
            defaultOption.text = 'Selecione uma partida';
            horaPartidaSelect.appendChild(defaultOption);

            partidas.forEach(partida => {
                const option = document.createElement('option');
                option.value = partida.id;
                const dataFormatada = formatDate(partida.dh_inicio); // Formata a data
                option.text = dataFormatada ? dataFormatada : 'Partida sem data definida';
                partidaSelect.appendChild(option);
            });


           // Função para buscar e exibir os vídeos da partida selecionada
           async function fetchVideosByPartida() {
            const selectedPartidaId = horaPartidaSelect.value; // Obtém o ID da partida do select de hora

            if (!selectedPartidaId) {
                exibirMensagem('Selecione uma partida para ver os vídeos.', videoContainer, false);
                return;
            }

                try {
                    const response = await fetch(`http://138.99.160.212:5000/api/videos?quadra_id=${quadraId}&partida_id=${selectedPartidaId}`);
                    if (!response.ok) {
                        throw new Error(`Erro HTTP: ${response.status}`);
                    }
                    const videos = await response.json();

                    // Limpar o container de vídeos
                    videoContainer.innerHTML = '';

                    if (videos.length === 0) {
                        exibirMensagem('Nenhum vídeo encontrado para esta partida.', videoContainer);
                    } else {
                        // Exibir os vídeos
                        videos.forEach(video => {
                            const videoElement = criarVideoElement(video);
                            const videoTitle = document.createElement('h3');
                            videoTitle.textContent = video.tipo;
                            const videoItem = document.createElement('div');
                            videoItem.classList.add('video-item');

                            // Destacar o vídeo se o usuário for o criador
                            if (video.eh_criador) {
                                videoItem.classList.add('destaque');
                            }

                            videoItem.appendChild(videoTitle);
                            videoItem.appendChild(videoElement);

                            videoContainer.appendChild(videoItem);
                        });
                    }
                } catch (error) {
                    console.error('Erro ao buscar vídeos da partida:', error);
                    exibirMensagem('Ocorreu um erro ao carregar os vídeos.', videoContainer);
                }
            }

            M.Datepicker.init(dataPartidaInput, {
                format: 'dd-mm-yyyy', // Especificar o formato
                onSelect: atualizarHorasPartida
            });

            // Adicionar evento de mudança ao select de partidas
            partidaSelect.addEventListener('change', fetchVideosByPartida);
        } catch (error) {
            console.error('Erro ao buscar partidas da quadra:', error);
            exibirMensagem('Ocorreu um erro ao carregar as partidas.', videoContainer);
        }


    }
    // Função para buscar o nome da quadra
    async function fetchQuadraNome(quadraId) {
        try {
            const response = await fetch(`http://138.99.160.212:5000/api/quadras/${quadraId}`);
            if (!response.ok) {
                throw new Error(`Erro HTTP: ${response.status}`);
            }
            const quadra = await response.json();
            const quadraNomeElement = document.getElementById('quadra-nome');
            quadraNomeElement.innerHTML = quadra.nome;
        } 
        catch (error) {
            console.error('Erro ao buscar nome da quadra:', error);
            exibirMensagem('Ocorreu um erro ao carregar o nome da quadra.', quadraNomeElement);
        }
    }

    // Buscar o nome da quadra e os vídeos ao carregar a página
    const quadraId = getQuadraIdFromUrl();
    if (quadraId) {
        fetchQuadraNome(quadraId);
        fetchVideosByQuadra(quadraId);
    } 
    else {
        window.location.href = 'quadras.html'; 
    }

    // Inicializar componentes do Materialize
    M.AutoInit();
});
