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
            const partidasResponse = await fetch(`http://127.0.0.1:5000/api/partidas/${quadraId}`);
            if (!partidasResponse.ok) {
                throw new Error(`Erro HTTP: ${partidasResponse.status}`);
            }
            const partidas = await partidasResponse.json();
    
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
                horaPartidaSelect.innerHTML = ''; // Limpar as opções de hora
                const defaultOption = document.createElement('option');
                defaultOption.value = '';
                defaultOption.text = 'Selecione a hora';
                defaultOption.disabled = true; // Desabilita a opção padrão
                defaultOption.selected = true; // Seleciona a opção padrão
                horaPartidaSelect.appendChild(defaultOption);
                const horasDisponiveis = new Set(); // Conjunto para armazenar as horas únicas
    
                // Filtrar as partidas pela data selecionada
                const partidasFiltradas = partidas.filter(partida => {
                    return partida.dh_inicio && partida.dh_inicio.startsWith(dataSelecionada);
                });
    
                if (partidasFiltradas.length === 0) {
                    exibirMensagem('Nenhuma partida encontrada para esta data.', videoContainer, false);
                } else {
                    partidasFiltradas.forEach(partida => {
                        const horaInicio = partida.dh_inicio.split(' ')[1].slice(0, -3); // Extrai a hora (HH:mm)
                        if (!horasDisponiveis.has(horaInicio)) { // Verifica se a hora já foi adicionada
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
    
                if (!selectedPartidaId) {
                    exibirMensagem('Selecione uma partida para ver os vídeos.', videoContainer, false);
                    return;
                }
    
                try {
                    const response = await fetch(`http://127.0.0.1:5000/api/videos?quadra_id=${quadraId}&partida_id=${selectedPartidaId}`);
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
    
            // Inicializar o componente datepicker do Materialize (após criar o elemento)
            M.Datepicker.init(dataPartidaInput, {
                format: 'yyyy-mm-dd', // Definir o formato
                onSelect: atualizarHorasPartida // Atualiza as horas ao selecionar uma data
            });
    
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
