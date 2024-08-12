document.addEventListener('DOMContentLoaded', function() {
    if (document.body.classList.contains('game-freezbee-page')) {
        generateGrid();
    } else if (document.body.classList.contains('scores-page')) {
        displayScores();
    } else if (document.body.classList.contains('player-setup-page')) {
        document.getElementById('playerFormFreezbee').addEventListener('submit', function(event) {
            event.preventDefault();
            const form = document.getElementById('playerFormFreezbee');
            const formData = new FormData(form);
            const players = [];
            for (let pair of formData.entries()) {
                players.push(pair[1].toUpperCase());
            }
            if (players.length < 2) {
                document.getElementById('error-message').style.display = 'block';
                return;
            }
            savePlayersToLocalStorage(players);
            window.location.href = 'index.html';
        });

        addPlayer(); // Ajouter un joueur initial
        addPlayer(); // Ajouter un deuxième joueur initial
    }
});

function addPlayer() {
    const playerNamesDiv = document.getElementById('playerNames');
    const playerCount = playerNamesDiv.children.length + 1;

    const playerContainer = document.createElement('div');
    playerContainer.classList.add('player-container');
    playerContainer.id = `player-${playerCount}`;

    const label = document.createElement('label');
    label.textContent = `Nom du joueur ${playerCount}`;
    const input = document.createElement('input');
    input.type = 'text';
    input.name = `player${playerCount}`;
    input.required = true;

    const removeButton = document.createElement('button');
    removeButton.type = 'button';
    removeButton.textContent = 'Supprimer';
    removeButton.onclick = function() {
        playerContainer.remove();
        updatePlayerLabels();
    };

    playerContainer.appendChild(label);
    playerContainer.appendChild(input);
    playerContainer.appendChild(removeButton);

    playerNamesDiv.appendChild(playerContainer);
}

function updatePlayerLabels() {
    const playerContainers = document.querySelectorAll('.player-container');
    playerContainers.forEach((container, index) => {
        const label = container.querySelector('label');
        label.textContent = `Nom du joueur ${index + 1}`;
        const input = container.querySelector('input');
        input.name = `player${index + 1}`;
        container.id = `player-${index + 1}`;
    });
}

function savePlayersToLocalStorage(players) {
    localStorage.setItem('freezbeePlayers', JSON.stringify(players));
}

function getPlayersFromLocalStorage() {
    return JSON.parse(localStorage.getItem('freezbeePlayers')) || [];
}

function saveScoresToLocalStorage(scores) {
    localStorage.setItem('freezbeeScores', JSON.stringify(scores));
}

function getScoresFromLocalStorage() {
    return JSON.parse(localStorage.getItem('freezbeeScores')) || {};
}

function generateGrid() {
    const players = getPlayersFromLocalStorage();
    let gridHTML = '<table class="game-grid"><tr><th>Tour</th>';

    players.forEach(player => {
        gridHTML += `<th>${player}</th>`;
    });

    gridHTML += '</tr>';

    for (let i = 1; i <= 10; i++) {
        gridHTML += `<tr><td>Tour ${i}</td>`;
        players.forEach((_, index) => {
            gridHTML += `
                <td>
                    <input type="number" class="score-input" id="score-${index}-${i}" min="0" max="300" step="10" oninput="updateTotal(${index})">
                </td>`;
        });
        gridHTML += '</tr>';
    }

    // Ajouter une ligne pour les totaux
    gridHTML += `<tr><td><strong>Total</strong></td>`;
    players.forEach((_, index) => {
        gridHTML += `<td><strong id="total-${index}">0</strong></td>`;
    });
    gridHTML += '</tr>';

    gridHTML += '</table>';
    document.getElementById('gameContainerFreezbee').innerHTML = gridHTML;
}


function checkCompletion() {
    const players = getPlayersFromLocalStorage();
    let scores = getScoresFromLocalStorage();

    let totalScores = players.map((_, index) => {
        let total = 0;
        for (let i = 1; i <= 10; i++) {
            const score = parseInt(document.getElementById(`score-${index}-${i}`).value) || 0;
            total += score;
        }
        return total;
    });

    let highestScore = Math.max(...totalScores);
    let winnerIndex = totalScores.indexOf(highestScore);
    let winner = players[winnerIndex];

    // Afficher le gagnant
    alert(`Le gagnant est ${winner} avec ${highestScore} points.`);

    // Mettre à jour les scores locaux
    players.forEach((player, index) => {
        if (!scores[player]) {
            scores[player] = { wins: 0, totalPoints: 0 };
        }
        scores[player].totalPoints += totalScores[index];
        if (index === winnerIndex) {
            scores[player].wins += 1;
        }
    });

    saveScoresToLocalStorage(scores);

    // Recharger la page des scores
    window.location.href = 'scores.html';
}

function displayScores() {
    const scores = getScoresFromLocalStorage();
    let scoresHTML = '<table><tr><th>Joueur</th><th>Victoires</th><th>Points Totaux</th><th>Action</th></tr>';
    for (const player in scores) {
        scoresHTML += `<tr><td>${player}</td><td>${scores[player].wins}</td><td>${scores[player].totalPoints}</td><td><button onclick="deletePlayer('${player}')">Supprimer</button></td></tr>`;
    }
    scoresHTML += '</table>';
    document.getElementById('scoresTable').innerHTML = scoresHTML;
}

function deletePlayer(player) {
    const scores = getScoresFromLocalStorage();
    delete scores[player];
    saveScoresToLocalStorage(scores);
    displayScores();
}
function updateTotal(playerIndex) {
    let total = 0;
    for (let i = 1; i <= 10; i++) {
        const score = parseInt(document.getElementById(`score-${playerIndex}-${i}`).value) || 0;
        total += score;
    }
    document.getElementById(`total-${playerIndex}`).textContent = total;
}

