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

    // Função para criar um elemento de vídeo
    function criarVideoElement(video) {
        const videoElement = document.createElement('video');
        videoElement.src = video.url;
        videoElement.controls = true;
        videoElement.width = 320;
        videoElement.height = 240;
        videoElement.setAttribute('preload', 'metadata');
        return videoElement;
    }

    // Função para exibir vídeos no container
    function exibirVideos(videos) {
        videoContainer.innerHTML = '';  // Limpar vídeos anteriores

        if (videos.length === 0) {
            const noVideosMessage = document.createElement('p');
            noVideosMessage.textContent = 'Nenhum vídeo encontrado para esta partida.';
            videoContainer.appendChild(noVideosMessage);
        } else {
            videos.forEach(video => {
                const videoElement = criarVideoElement(video);
                const videoTitle = document.createElement('h3');
                videoTitle.textContent = video.tipo;
                const videoItem = document.createElement('div');
                videoItem.classList.add('video-item');

                if (video.eh_criador) {
                    videoItem.classList.add('destaque');
                }

                videoItem.appendChild(videoTitle);
                videoItem.appendChild(videoElement);
                videoContainer.appendChild(videoItem);
            });
        }
    }

    // Função para buscar e exibir os vídeos da partida selecionada
    async function fetchAndExibirVideos(partidaId) {
        try {
            const quadraId = getQuadraIdFromUrl();
            console.log('Buscando vídeos para partida ID:', partidaId); // Log de depuração
            const response = await fetch(`http://138.99.160.212:5000/api/videos?quadra_id=${quadraId}&partida_id=${partidaId}`);
            
            if (!response.ok) {
                throw new Error(`Erro HTTP: ${response.status}`);
            }
    
            const videos = await response.json();
    
            console.log('Vídeos recebidos:', videos); // Log de depuração
    
            videoContainer.innerHTML = '';
    
            videos.forEach(video => {
                // Decodificar o vídeo
                const videoBlob = new Blob([Uint8Array.from(atob(video.video_blob), c => c.charCodeAt(0))], { type: 'video/mp4' });
                const videoUrl = URL.createObjectURL(videoBlob);
    
                const videoElement = document.createElement('video');
                videoElement.src = videoUrl;
                videoElement.controls = true;
                videoElement.width = 640;  // ou ajuste conforme necessário
                videoElement.height = 360; // ou ajuste conforme necessário
    
                const videoTitle = document.createElement('h3');
                videoTitle.textContent = `${video.data_criacao} ${video.eh_criador ? "(Criador)" : ""}`;
                const videoItem = document.createElement('div');
                videoItem.classList.add('video-item');
    
                videoItem.appendChild(videoTitle);
                videoItem.appendChild(videoElement);
                videoContainer.appendChild(videoItem);
            });
    
        } catch (error) {
            console.error('Erro ao buscar vídeos da partida:', error);
            exibirMensagem('Ocorreu um erro ao carregar os vídeos.', videoContainer);
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
            const response = await fetch(`http://138.99.160.212:5000/api/partidas/${quadraId}`);

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
            const response = await fetch(`http://138.99.160.212:5000/api/quadras/${quadraId}`);
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
    M.AutoInit();
});
