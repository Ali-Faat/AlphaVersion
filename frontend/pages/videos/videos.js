document.addEventListener('DOMContentLoaded', function () {
    const videoContainer = document.getElementById('video-container');
    const quadraNomeElement = document.getElementById('quadra-nome');
    const partidaSelect = document.getElementById('partida-select');
    const dataPartidaInput = document.getElementById('data-partida');
    let partidas = [];

    // Função para obter o ID da quadra da URL
    function getQuadraIdFromUrl() {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get('quadra_id');
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
            console.log('Buscando partidas da quadra:', quadraId); // Log antes da requisição

            // Busca as partidas da quadra selecionada
            const partidasResponse = await fetch(`http://138.99.160.212:5000/api/partidas/${quadraId}`);

            if (!partidasResponse.ok) {
                throw new Error(`Erro HTTP: ${partidasResponse.status}`);
            }

            partidas = await partidasResponse.json();
            console.log('Partidas encontradas:', partidas); // Log após a requisição

            if (partidas.length === 0) {
                exibirMensagem('Nenhuma partida encontrada para esta quadra.', videoContainer);
                return;
            }

            // Cria o menu dropdown com as partidas
            const dataPartidaInput = document.getElementById('data-partida');
            const horaPartidaSelect = document.getElementById('hora-partida');

            // Função para atualizar o menu suspenso de horas com base na data selecionada
            function atualizarHorasPartida() {
                const dataSelecionada = dataPartidaInput.value;

                // Obter a data em formato Date
                const dataDate = new Date(dataSelecionada);

                // Formatar a data como yyyy-mm-dd
                const dataFormatada = dataDate.toISOString().split('T')[0];

                horaPartidaSelect.innerHTML = ''; // Limpar as opções de hora
                const defaultOption = document.createElement('option');
                defaultOption.value = '';
                defaultOption.text = 'Selecione a hora';
                defaultOption.disabled = true;
                defaultOption.selected = true;
                horaPartidaSelect.appendChild(defaultOption);

                const horasDisponiveis = new Set();

                // Filtrar as partidas pela data selecionada
                const partidasFiltradas = partidas.filter(partida => {
                    return partida.dh_inicio && partida.dh_inicio.startsWith(dataFormatada);
                });

                if (partidasFiltradas.length === 0) {
                    exibirMensagem('Nenhuma partida encontrada para esta data.', videoContainer, false);
                } else {
                    partidasFiltradas.forEach(partida => {
                        const horaInicio = partida.dh_inicio.split(' ')[1].slice(0, -3);
                        if (!horasDisponiveis.has(horaInicio)) {
                            horasDisponiveis.add(horaInicio);
                            const option = document.createElement('option');
                            option.value = partida.id;
                            option.text = horaInicio;
                            horaPartidaSelect.appendChild(option);
                        }
                    });
                }
            }

            // Função para buscar e exibir os vídeos da partida selecionada
            async function fetchVideosByPartida() {
                const selectedPartidaId = partidaSelect.value;
                const dataSelecionada = dataPartidaInput.value; // Obter a data do input

                // Obter a data em formato Date
                const dataDate = new Date(dataSelecionada);

                // Formatar a data como yyyy-mm-dd
                const dataFormatada = dataDate.toISOString().split('T')[0];

                if (!dataFormatada || !selectedPartidaId) {
                    exibirMensagem('Selecione uma data e hora para ver os vídeos.', videoContainer, false);
                    return;
                }

                try {
                    const response = await fetch(`http://138.99.160.212:5000/api/videos?quadra_id=${quadraId}&partida_id=${selectedPartidaId}&data_inicio=${dataFormatada}`);
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


            
            // Adicionar evento de mudança ao select de partidas
            partidaSelect.addEventListener('change', fetchVideosByPartida);

            // Buscar os vídeos da primeira partida por padrão (se houver)
            atualizarHorasPartida();
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
            quadraNomeElement.textContent = quadra.nome;
        } catch (error) {
            console.error('Erro ao buscar nome da quadra:', error);
            exibirMensagem('Ocorreu um erro ao carregar o nome da quadra.', quadraNomeElement);
        }
    }

    // Buscar o nome da quadra e os vídeos ao carregar a página
    const quadraId = getQuadraIdFromUrl();
    if (quadraId) {
        fetchQuadraNome(quadraId);
        fetchVideosByQuadra(quadraId); // Carrega as partidas, mas não os vídeos
    } else {
        // Redirecionar para a página inicial ou exibir uma mensagem de erro
        window.location.href = 'quadras.html'; 
    }

    // Inicializar componentes do Materialize
    M.AutoInit();
});
