document.addEventListener('DOMContentLoaded', async () => {
    const videoContainer = document.getElementById('video-container');
    const quadraNomeElement = document.getElementById('quadra-nome');
    const dataPartidaInput = document.getElementById('data-partida');
    const horaPartidaSelect = document.getElementById('hora-partida');
    let partidas = [];
  
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
      return videoElement;
    }
  
    // Função para buscar informações do usuário autenticado
    async function buscarInformacoesUsuario() {
      try {
        const response = await fetch('http://138.99.160.212:5000/api/is_authenticated');
        const data = await response.json();
        if (data.authenticated) {
          const usuarioResponse = await fetch(`http://138.99.160.212:5000/api/usuarios/${data.usuario_id}`); // Substitua pela rota correta
          const usuario = await usuarioResponse.json();
          console.log('Informações do usuário:', usuario);
        } else {
          console.log('Usuário não autenticado');
          // Lógica para lidar com usuário não autenticado (redirecionar, etc.)
        }
      } catch (error) {
        console.error('Erro ao buscar informações do usuário:', error);
      }
    }
  
    // Função para buscar e exibir os vídeos da quadra
    async function fetchVideosByQuadra(quadraId) {
        try {
          console.log('Buscando partidas da quadra:', quadraId); // Log antes do fetch
          const partidasResponse = await fetch(`http://138.99.160.212:5000/api/partidas/${quadraId}`);
    
          if (!partidasResponse.ok) {
            throw new Error(`Erro HTTP: ${partidasResponse.status}`);
          }
    
          console.log('Resposta da API (partidas):', partidasResponse); // Log da resposta
          partidas = await partidasResponse.json();
          console.log('Partidas recebidas:', partidas); // Log das partidas recebidas
    
          // Função para atualizar o select de horas com base na data selecionada
          async function atualizarHorasPartida() {
            const dataSelecionada = dataPartidaInput.value;
            if (!dataSelecionada) {
              exibirMensagem('Selecione uma data.', videoContainer, false);
              return;
            }
          
            const dataFormatada = new Date(dataSelecionada).toISOString().split('T')[0];
            const partidasFiltradas = partidas.filter(partida => {
              if (partida.dh_inicio && partida.dh_inicio.includes('T')) {
                return partida.dh_inicio.startsWith(dataFormatada);
              } else {
                return false;
              }
            });
          
            // Limpar o select (sem usar Materialize)
            while (horaPartidaSelect.options.length > 0) {
              horaPartidaSelect.remove(0);
            }
            const defaultOption = document.createElement('option');
            defaultOption.value = '';
            defaultOption.text = 'Selecione a hora';
            defaultOption.disabled = true;
            defaultOption.selected = true;
            horaPartidaSelect.appendChild(defaultOption);
          
            if (partidasFiltradas.length === 0) {
              exibirMensagem('Nenhuma partida encontrada para esta data.', videoContainer, false);
            } else {
              const horasDisponiveis = new Set();
              partidasFiltradas.forEach(partida => {
                if (partida.dh_inicio && partida.dh_inicio.includes('T')) {
                  const horaInicio = partida.dh_inicio.split('T')[1].slice(0, -3);
                  if (!horasDisponiveis.has(horaInicio)) {
                    horasDisponiveis.add(horaInicio);

                    const option = document.createElement('option');
                    option.value = partida.id;
                    option.text = horaInicio;
                    horaPartidaSelect.appendChild(option);
                  }
                }
              });

              
            }
        }
  
        // Função para buscar e exibir os vídeos da partida selecionada
        async function fetchVideosByPartida() {
          const selectedPartidaId = horaPartidaSelect.value;
          const dataSelecionada = dataPartidaInput.value;
  
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
  
            videoContainer.innerHTML = '';
  
            if (videos.length === 0) {
              exibirMensagem('Nenhum vídeo encontrado para esta partida.', videoContainer);
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
          } catch (error) {
            console.error('Erro ao buscar vídeos da partida:', error);
            exibirMensagem('Ocorreu um erro ao carregar os vídeos.', videoContainer);
          }
        }
  
        // Adicionar evento de mudança ao input de data
        dataPartidaInput.addEventListener('change', atualizarHorasPartida);
  
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
  
    // Lógica principal
    const quadraId = getQuadraIdFromUrl();
    if (quadraId) {
      fetchQuadraNome(quadraId);
      fetchVideosByQuadra(quadraId);
      buscarInformacoesUsuario();
    } else {
      window.location.href = '../quadras/quadras.html'; 
    }
  
    // Inicializar componentes do Materialize
    //M.AutoInit();
  });
  