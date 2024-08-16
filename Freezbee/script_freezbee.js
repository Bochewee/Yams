let currentPlayerIndex = 0; // Index du joueur actuel
let currentTurn = 1; // Tour actuel
let clickCount = 0; // Nombre de clics du joueur actuel
let playerClicks = []; // Tableau pour stocker les scores des clics
const maxClicks = 3; // Nombre maximum de clics

document.addEventListener('DOMContentLoaded', function () {
    if (document.body.classList.contains('game-freezbee-page')) {
        generateGrid();
        drawTarget();
        document.getElementById('targetCanvas').addEventListener('click', handleClick);
    } else if (document.body.classList.contains('player-setup-page')) {
        document.getElementById('playerFormFreezbee').addEventListener('submit', function (event) {
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
            window.location.href = 'index.html'; // Redirection vers la page de jeu
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


function handleClick(event) {
    const canvas = document.getElementById('targetCanvas');
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    const distanceFromCenter = Math.sqrt(Math.pow(x - 200, 2) + Math.pow(y - 200, 2));
    let points = 0;

    if (distanceFromCenter <= 40) {
        points = 100; // Noir
    } else if (distanceFromCenter <= 80) {
        points = 50; // Jaune
    } else if (distanceFromCenter <= 120) {
        points = 25; // Rouge
    } else if (distanceFromCenter <= 160) {
        points = 10; // Bleu
    } else {
        points = 0; // Blanc
    }

    if (clickCount < maxClicks) {
        // Ajouter le score au tableau des clics
        playerClicks[clickCount] = points;
        clickCount++;
    } else {
        // Remplacer le plus ancien clic (cercle)
        playerClicks[clickCount % maxClicks] = points;
        clickCount++;
    }

    // Afficher les points en direct
    document.getElementById('liveScore').textContent = playerClicks.reduce((acc, curr) => acc + curr, 0);
}

// Fonction pour terminer le tour
function nextPlayer() {
    const players = getPlayersFromLocalStorage();

    if (currentTurn <= 10 && currentPlayerIndex < players.length) {
        // Sauvegarder les points du joueur actuel dans la grille des scores
        const totalPoints = playerClicks.reduce((acc, curr) => acc + curr, 0);
        document.getElementById(`score-${currentPlayerIndex}-${currentTurn}`).value = totalPoints;

        // Réinitialiser les clics pour le prochain joueur
        clickCount = 0;
        playerClicks = [];

        // Mettre à jour le total du joueur
        updateTotal(currentPlayerIndex);

        // Passer au joueur suivant ou au prochain tour
        currentPlayerIndex++;

        if (currentPlayerIndex >= players.length) {
            currentPlayerIndex = 0;
            currentTurn++;
        }

        // Réinitialiser l'affichage du score en direct
        document.getElementById('liveScore').textContent = '0';

        // Si tous les tours sont terminés, vérifier la fin du jeu
        if (currentTurn > 10) {
            checkCompletion();
        }
    }
}

// Fonction de fin de partie
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

    // Rediriger vers la page des scores
    window.location.href = 'scores.html';
}

// Fonction pour afficher les scores triés par nombre de victoires et, en cas d'égalité, par total de points
function displaySortedScores() {
    const scores = getScoresFromLocalStorage();
    const sortedPlayers = Object.keys(scores).sort((a, b) => {
        if (scores[a].wins === scores[b].wins) {
            return scores[b].totalPoints - scores[a].totalPoints; // Trier par points en cas d'égalité de victoires
        }
        return scores[b].wins - scores[a].wins; // Trier par victoires
    });

    // Afficher les scores triés
    const scoresBody = document.getElementById('scoresBody');
    scoresBody.innerHTML = '';

    sortedPlayers.forEach(player => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${player}</td>
            <td>${scores[player].wins}</td>
            <td>${scores[player].totalPoints}</td>
            <td><button onclick="deletePlayer('${player}')">Supprimer</button></td>
        `;
        scoresBody.appendChild(row);
    });
}

function deletePlayer(player) {
    const scores = getScoresFromLocalStorage();
    delete scores[player];
    saveScoresToLocalStorage(scores);
    displaySortedScores();
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
    const gameContainer = document.getElementById('gameContainerFreezbee');

    if (!gameContainer) {
        console.error("L'élément gameContainerFreezbee est introuvable.");
        return;
    }

    let gridHTML = '<table class="game-grid"><tr><th>Tour</th>';

    // Afficher les noms des joueurs au-dessus du tableau
    players.forEach(player => {
        gridHTML += `<th>${player}</th>`;
    });

    gridHTML += '</tr>';

    // Générer les tours de 1 à 10
    for (let i = 1; i <= 10; i++) {
        gridHTML += `<tr><td>Tour ${i}</td>`;
        players.forEach((_, index) => {
            gridHTML += `
                <td>
                    <input type="number" class="score-input" id="score-${index}-${i}" min="0" max="300" step="10" readonly>
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
    
    // Insérer la grille dans l'élément "gameContainerFreezbee"
    gameContainer.innerHTML = gridHTML;
}


function updateTotal(playerIndex) {
    let total = 0;
    for (let i = 1; i <= 10; i++) {
        const score = parseInt(document.getElementById(`score-${playerIndex}-${i}`).value) || 0;
        total += score;
    }
    document.getElementById(`total-${playerIndex}`).textContent = total;
}

// Fonction pour dessiner la cible
function drawTarget() {
    const canvas = document.getElementById('targetCanvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const radiusValues = [200, 160, 120, 80, 40];

    ctx.fillStyle = '#CCCCCC'; // Gris
    ctx.beginPath();
    ctx.arc(200, 200, radiusValues[0], 0, 2 * Math.PI);
    ctx.fill();

    ctx.fillStyle = '#0000FF'; // Bleu (10 points)
    ctx.beginPath();
    ctx.arc(200, 200, radiusValues[1], 0, 2 * Math.PI);
    ctx.fill();

    ctx.fillStyle = '#FF0000'; // Rouge (25 points)
    ctx.beginPath();
    ctx.arc(200, 200, radiusValues[2], 0, 2 * Math.PI);
    ctx.fill();

    ctx.fillStyle = '#FFFF00'; // Jaune (50 points)
    ctx.beginPath();
    ctx.arc(200, 200, radiusValues[3], 0, 2 * Math.PI);
    ctx.fill();

    ctx.fillStyle = '#000000'; // Noir (100 points)
    ctx.beginPath();
    ctx.arc(200, 200, radiusValues[4], 0, 2 * Math.PI);
    ctx.fill();
}
