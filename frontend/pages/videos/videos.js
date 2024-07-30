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

  // Função para buscar e exibir os vídeos da quadra
  async function fetchVideosByQuadra(quadraId) {
      try {
          const response = await fetch(`http://138.99.160.212:5000/api/partidas/${quadraId}`);

          if (!response.ok) {
              throw new Error(`Erro HTTP: ${response.status}`);
          }

          partidas = await response.json();

          // Função para atualizar o select de horas com base na data selecionada
          function atualizarHorasPartida() {
              const dataSelecionada = dataPartidaInput.value;
              if (!dataSelecionada) {
                  exibirMensagem('Selecione uma data.', videoContainer, false);
                  return;
              }

              const dataFormatada = new Date(dataSelecionada).toISOString().split('T')[0];
              const partidasFiltradas = partidas.filter(partida => partida.dh_inicio.startsWith(dataFormatada));

              // Limpar o select
              horaPartidaSelect.innerHTML = '';

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

                  // Atualizar os vídeos para a primeira partida encontrada
                  fetchVideosByPartida(partidasFiltradas[0].id);
              }
          }

          // Função para buscar e exibir os vídeos da partida selecionada
          async function fetchVideosByPartida(partidaId) {
              const dataSelecionada = dataPartidaInput.value;
              const dataFormatada = new Date(dataSelecionada).toISOString().split('T')[0];

              try {
                  const response = await fetch(`http://138.99.160.212:5000/api/videos?quadra_id=${quadraId}&partida_id=${partidaId}&data_inicio=${dataFormatada}`);
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
  } else {
      window.location.href = '../quadras/quadras.html'; 
  }

  // Inicializar componentes do Materialize
  M.AutoInit();
});
