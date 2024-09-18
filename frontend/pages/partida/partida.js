const formacoes = {
    '433': {
        goleiro: { top: '85%', left: '5%' },
        jogadores: [
            { top: '70%', left: '10%' }, // Defesa 1
            { top: '70%', left: '20%' }, // Defesa 2
            { top: '70%', left: '30%' }, // Defesa 3
            { top: '70%', left: '40%' }, // Defesa 4
            { top: '50%', left: '25%' }, // Meio-campo 1
            { top: '50%', left: '35%' }, // Meio-campo 2
            { top: '50%', left: '45%' }, // Meio-campo 3
            { top: '30%', left: '20%' }, // Ataque 1
            { top: '30%', left: '30%' }, // Ataque 2
            { top: '30%', left: '40%' }  // Ataque 3
        ]
    },
    '442': {
        goleiro: { top: '85%', left: '5%' },
        jogadores: [
            { top: '70%', left: '10%' }, // Defesa 1
            { top: '70%', left: '20%' }, // Defesa 2
            { top: '70%', left: '30%' }, // Defesa 3
            { top: '70%', left: '40%' }, // Defesa 4
            { top: '50%', left: '20%' }, // Meio-campo 1
            { top: '50%', left: '30%' }, // Meio-campo 2
            { top: '50%', left: '40%' }, // Meio-campo 3
            { top: '50%', left: '50%' }, // Meio-campo 4
            { top: '30%', left: '25%' }, // Ataque 1
            { top: '30%', left: '35%' }  // Ataque 2
        ]
    },
    '352': {
        goleiro: { top: '55%', left: '5%' },
        jogadores: [
            { top: '70%', left: '15%' }, // Defesa 1
            { top: '70%', left: '25%' }, // Defesa 2
            { top: '70%', left: '35%' }, // Defesa 3
            { top: '50%', left: '10%' }, // Meio-campo 1
            { top: '50%', left: '20%' }, // Meio-campo 2
            { top: '50%', left: '30%' }, // Meio-campo 3
            { top: '50%', left: '40%' }, // Meio-campo 4
            { top: '50%', left: '50%' }, // Meio-campo 5
            { top: '30%', left: '20%' }, // Ataque 1
            { top: '30%', left: '30%' }  // Ataque 2
        ]
    }
};

function alterarFormacaoA() {
    const formacaoSelecionada = document.getElementById("formationA").value;
    const formacao = formacoes[formacaoSelecionada];

    const goleiroA = document.querySelector('.jogador-a[data-num="goleiro"]');
    goleiroA.style.top = formacao.goleiro.top;
    goleiroA.style.left = formacao.goleiro.left;

    const jogadoresA = document.querySelectorAll('.jogador-a:not([data-num="goleiro"])');
    jogadoresA.forEach((jogador, index) => {
        jogador.style.top = formacao.jogadores[index].top;
        jogador.style.left = formacao.jogadores[index].left;
    });
}

function alterarFormacaoB() {
    const formacaoSelecionada = document.getElementById("formationB").value;
    const formacao = formacoes[formacaoSelecionada];

    const goleiroB = document.querySelector('.jogador-b[data-num="goleiro"]');
    goleiroB.style.top = formacao.goleiro.top;
    goleiroB.style.left = formacao.goleiro.left;

    const jogadoresB = document.querySelectorAll('.jogador-b:not([data-num="goleiro"])');
    jogadoresB.forEach((jogador, index) => {
        jogador.style.top = formacao.jogadores[index].top;
        jogador.style.left = formacao.jogadores[index].left;
    });
}
