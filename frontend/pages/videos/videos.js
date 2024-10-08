document.addEventListener('DOMContentLoaded', async () => {
    const videoContainer = document.getElementById('video-container');
    const quadraNomeElement = document.getElementById('quadra-nome');
    const dataPartidaInput = document.getElementById('data-partida');
    const horaPartidaSelect = document.getElementById('hora-partida');
    let partidas = [];

    // Função para aplicar o tema preferido do sistema
    function applySystemTheme() {
        const prefersDarkScheme = window.matchMedia("(prefers-color-scheme: dark)").matches;
        if (prefersDarkScheme) {
            document.body.classList.add('dark-theme');
            document.body.classList.remove('light-theme');
        } else {
            document.body.classList.add('light-theme');
            document.body.classList.remove('dark-theme');
        }
    }

    applySystemTheme(); // Aplicar o tema na carga da página

    // Monitorar mudanças de preferência de tema
    window.matchMedia("(prefers-color-scheme: dark)").addEventListener('change', event => {
        applySystemTheme(); // Aplicar o tema quando o usuário muda a preferência do sistema
    });

    // Função para obter o ID da quadra da URL
    function getQuadraIdFromUrl() {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get('quadra_id');
    }

    // Função para exibir mensagens
    function exibirMensagem(mensagem, container, isError = true) {
        const messageElement = document.createElement('p');
        messageElement.textContent = mensagem;
        messageElement.style.color = isError ? 'red' : 'black';
        container.innerHTML = '';
        container.appendChild(messageElement);
    }

    function groupVideosByCreationDate(videos) {
        const groupedVideos = {};
    
        videos.forEach(video => {
            const key = video.data_criacao;
            if (!groupedVideos[key]) {
                groupedVideos[key] = [];
            }
            groupedVideos[key].push(video);
        });
    
        return groupedVideos;
    }

    // Função para buscar e exibir os vídeos da partida selecionada
    async function fetchAndExibirVideos(partidaId) {
        const spinner = document.getElementById('loading-spinner');
        try {
            spinner.style.display = 'flex'; // Mostrar o spinner
            const quadraId = getQuadraIdFromUrl();
            console.log('Buscando vídeos para partida ID:', partidaId); // Log de depuração
            const response = await fetch(`https://api.sportflyx.com:5000/api/videos?quadra_id=${quadraId}&partida_id=${partidaId}`);
            
            if (!response.ok) {
                throw new Error(`Erro HTTP: ${response.status}`);
            }
    
            const videos = await response.json();
            console.log('Vídeos recebidos:', videos); // Log de depuração
    
            const videoContainer = document.getElementById('video-container');
            if (!videoContainer) {
                console.error('Elemento video-container não encontrado!');
                return;
            }
    
            videoContainer.innerHTML = ''; // Limpa o container de vídeos
    
            if (videos.length === 0) {
                console.log('Nenhum vídeo encontrado para esta partida.');
                exibirMensagem('Nenhum vídeo encontrado para esta partida.', videoContainer, false);
                return;
            }
    
            const groupedVideos = groupVideosByCreationDate(videos);
    
            Object.keys(groupedVideos).forEach(dateKey => {
                const videoGroup = groupedVideos[dateKey];
                const groupDiv = document.createElement('div');
                groupDiv.classList.add('video-group');
    
                const tipo = videoGroup[0].tipo || 'Lance'; // Verificação de segurança
                const title = document.createElement('h3');
                title.textContent = tipo;
                groupDiv.appendChild(title);
    
                const videoContainerUpper = document.createElement('div');
                videoContainerUpper.classList.add('video-row');
    
                let meshVideoElement = null;
    
                videoGroup.forEach(video => {
                    const videoElement = document.createElement('video');
                    videoElement.src = `https://api.sportflyx.com:5000/api/video_stream/${video.video_id}`;
                    videoElement.controls = true;
    
                    if (video.tipo && video.tipo.toLowerCase().includes('mesh')) {
                        videoElement.classList.add('mesh');
                        meshVideoElement = videoElement;
                    } else {
                        videoElement.classList.add('cam');
                        videoContainerUpper.appendChild(videoElement);
                    }
                });
    
                groupDiv.appendChild(videoContainerUpper);
    
                if (meshVideoElement) {
                    const meshContainer = document.createElement('div');
                    meshContainer.classList.add('mesh-container');
                    meshContainer.appendChild(meshVideoElement);
                    groupDiv.appendChild(meshContainer);
                }
    
                const dateLabel = document.createElement('p');
                dateLabel.textContent = dateKey;
                groupDiv.appendChild(dateLabel);
    
                videoContainer.appendChild(groupDiv);
            });
    
        } catch (error) {
            console.error('Erro ao buscar vídeos da partida:', error);
            exibirMensagem('Ocorreu um erro ao carregar os vídeos.', videoContainer);
        } finally {
            spinner.style.display = 'none'; // Ocultar o spinner
        }
    }
    
    
    
    // Atualizar o select de horas com base na data selecionada
    function atualizarHorasPartida() {
        const dataSelecionada = dataPartidaInput.value;
        const quadraId = getQuadraIdFromUrl();

        if (!dataSelecionada) {
            exibirMensagem('Selecione uma data.', videoContainer, false);
            return;
        }
    
        console.log('Data Selecionada:', dataSelecionada);  // Log de depuração
    
        const partidasFiltradas = partidas.filter(partida => {
            const dataPartida = partida.dh_inicio.split('T')[0];
            const quadraIdPartida = partida.quadra_id;
    
            console.log('Comparando:', dataPartida, 'com', dataSelecionada);
            console.log('Comparando quadra_id:', quadraIdPartida, 'com', quadraId);
    
            return dataPartida === dataSelecionada && quadraIdPartida === quadraId;
        });
    
        console.log('Partidas Filtradas:', partidasFiltradas);  // Log de depuração
    
        // Limpar o select de horas
        horaPartidaSelect.innerHTML = '';

        // Adicionar uma opção padrão solicitando ao usuário que selecione uma partida
        const defaultOption = document.createElement('option');
        defaultOption.value = '';
        defaultOption.textContent = 'Selecione uma partida';
        defaultOption.disabled = true;
        defaultOption.selected = true;
        horaPartidaSelect.appendChild(defaultOption);
    
        if (partidasFiltradas.length === 0) {
            exibirMensagem('Nenhuma partida encontrada para esta data.', videoContainer, false);
        } else {
            partidasFiltradas.forEach(partida => {
                const option = document.createElement('option');
                const horaInicio = partida.dh_inicio.split('T')[1].slice(0, -3);
                option.value = partida.id;
                option.textContent = horaInicio;
                horaPartidaSelect.appendChild(option);
            });

            // Adicionar evento para atualizar vídeos ao selecionar uma hora
            horaPartidaSelect.addEventListener('change', function() {
                const partidaSelecionadaId = horaPartidaSelect.value;
                if (partidaSelecionadaId) {
                    fetchAndExibirVideos(partidaSelecionadaId);
                }
            });
        }
    }    

    // Função para buscar as partidas da quadra
    async function fetchPartidasByQuadra(quadraId) {
        try {
            console.log('Buscando partidas para quadra ID:', quadraId); // Log de depuração
            const response = await fetch(`https://api.sportflyx.com:5000/api/partidas/${quadraId}`);

            if (!response.ok) {
                throw new Error(`Erro HTTP: ${response.status}`);
            }

            partidas = await response.json();

            console.log('Partidas recebidas:', partidas); // Log de depuração

            // Adicionar evento de mudança ao input de data
            dataPartidaInput.addEventListener('change', atualizarHorasPartida);
        } catch (error) {
            console.error('Erro ao buscar partidas da quadra:', error);
            exibirMensagem('Ocorreu um erro ao carregar as partidas.', videoContainer);
        }
    }

    // Função para buscar o nome da quadra
    async function fetchQuadraNome(quadraId) {
        try {
            console.log('Buscando nome da quadra para ID:', quadraId); // Log de depuração
            const response = await fetch(`https://api.sportflyx.com:5000/api/quadras/${quadraId}`);
            if (!response.ok) {
                throw new Error(`Erro HTTP: ${response.status}`);
            }
            const quadra = await response.json();
            quadraNomeElement.textContent = quadra.nome;
            console.log('Nome da quadra recebido:', quadra.nome); // Log de depuração
        } catch (error) {
            console.error('Erro ao buscar nome da quadra:', error);
            exibirMensagem('Ocorreu um erro ao carregar o nome da quadra.', quadraNomeElement);
        }
    }

    // Lógica principal
    const quadraId = getQuadraIdFromUrl();
    console.log('ID da quadra obtido da URL:', quadraId); // Log de depuração
    if (quadraId) {
        fetchQuadraNome(quadraId);
        fetchPartidasByQuadra(quadraId);
    } else {
        console.error('Nenhum ID de quadra encontrado na URL'); // Log de depuração
        window.location.href = '../quadras/quadras.html'; 
    }

    // Inicializar componentes do Materialize
    const M = M.AutoInit();
});
