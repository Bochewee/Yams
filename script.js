document.addEventListener('DOMContentLoaded', function() {
    if (document.body.classList.contains('grid-page')) {
        generateGrid();
    } else if (document.body.classList.contains('scores-page')) {
        displayScores();
    } else if (document.body.classList.contains('player-setup-page')) {
        document.getElementById('playerForm').addEventListener('submit', function(event) {
            event.preventDefault();
            const form = document.getElementById('playerForm');
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
            window.location.href = 'grid.html';
        });
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
    localStorage.setItem('yamsPlayers', JSON.stringify(players));
}

function getPlayersFromLocalStorage() {
    return JSON.parse(localStorage.getItem('yamsPlayers')) || [];
}

function saveScoresToLocalStorage(scores) {
    localStorage.setItem('yamsScores', JSON.stringify(scores));
}

function getScoresFromLocalStorage() {
    return JSON.parse(localStorage.getItem('yamsScores')) || {};
}

function generateGrid() {
    const players = getPlayersFromLocalStorage();
    let gridHTML = '<table><tr><th></th>';

    players.forEach(player => {
        gridHTML += `<th>${player}</th>`;
    });

    gridHTML += '</tr>';
    const rows = [
        {label: '1', max: 5},
        {label: '2', max: 10},
        {label: '3', max: 15},
        {label: '4', max: 20},
        {label: '5', max: 25},
        {label: '6', max: 30},
        {label: 'Bonus', max: ''},
        {label: 'Premier Total', max: ''},
        {label: 'Min', max: 30, min: 5},
        {label: 'Max', max: 30, min: 5},
        {label: '2nd Total', max: ''},
        {label: 'Suite', points: [0, 20]},
        {label: 'Full', points: [0, 30]},
        {label: 'Carré', points: [0, 40]},
        {label: 'Yams', points: [0, 50]},
        {label: '3ème Total', max: ''},
        {label: '4ème Total', max: ''}
    ];

    rows.forEach(row => {
        gridHTML += `<tr><td>${row.label} ${row.max ? `(min ${row.min || 0}, max ${row.max})` : ''}</td>`;
        players.forEach((_, index) => {
            if (row.label === 'Bonus') {
                gridHTML += `<td><span id="bonus-${index}">0</span></td>`;
            } else if (row.label === 'Premier Total') {
                gridHTML += `<td><span id="premier-total-${index}">0</span></td>`;
            } else if (row.label === '2nd Total') {
                gridHTML += `<td><span id="second-total-${index}">0</span></td>`;
            } else if (row.label === '3ème Total') {
                gridHTML += `<td><span id="third-total-${index}">0</span></td>`;
            } else if (row.label === '4ème Total') {
                gridHTML += `<td><span id="fourth-total-${index}">0</span></td>`;
            } else if (row.label === 'Min' || row.label === 'Max') {
                gridHTML += `<td><input type="number" id="input-${row.label.toLowerCase()}-${index}" min="${row.min}" max="${row.max}" oninput="validateInput(${index}, '${row.label.toLowerCase()}')"></td>`;
            } else {
                gridHTML += `<td>${generateSelect(row.points || row.max, index, row.label)}</td>`;
            }
        });
        gridHTML += '</tr>';
    });

    gridHTML += '</table>';
    document.getElementById('gridContainer').innerHTML = gridHTML;

    // Ajouter des écouteurs pour les champs de points
    players.forEach((_, index) => {
        for (let i = 1; i <= 6; i++) {
            document.getElementById(`select-${index}-${i}`).addEventListener('change', () => {
                updateBonus(index);
                updatePremierTotal(index);
            });
        }
        document.getElementById(`input-min-${index}`).addEventListener('input', () => {
            validateInput(index, 'min');
            updateSecondTotal(index);
        });
        document.getElementById(`input-max-${index}`).addEventListener('input', () => {
            validateInput(index, 'max');
            updateSecondTotal(index);
        });
        ['Suite', 'Full', 'Carré', 'Yams'].forEach(label => {
            document.getElementById(`select-${index}-${label}`).addEventListener('change', () => {
                updateThirdTotal(index);
            });
        });
    });
}

function generateSelect(points, playerIndex, rowLabel) {
    let options = '<option value=""></option>';  // Option vide par défaut
    if (Array.isArray(points)) {
        points.forEach(point => {
            options += `<option value="${point}">${point}</option>`;
        });
    } else if (points) {
        for (let i = 1; i <= 5; i++) {  // Start from 1 to avoid 0
            options += `<option value="${i * parseInt(rowLabel)}">${i * parseInt(rowLabel)}</option>`;
        }
    }
    return `<select id="select-${playerIndex}-${rowLabel}">${options}</select>`;
}

function updateBonus(playerIndex) {
    let sum = 0;
    for (let i = 1; i <= 6; i++) {
        const value = document.getElementById(`select-${playerIndex}-${i}`).value;
        sum += value ? parseInt(value) : 0;
    }
    const bonus = sum >= 60 ? 30 : 0;
    document.getElementById(`bonus-${playerIndex}`).textContent = bonus;
    updatePremierTotal(playerIndex);
}

function updatePremierTotal(playerIndex) {
    let sum = 0;
    for (let i = 1; i <= 6; i++) {
        const value = document.getElementById(`select-${playerIndex}-${i}`).value;
        sum += value ? parseInt(value) : 0;
    }
    const bonus = parseInt(document.getElementById(`bonus-${playerIndex}`).textContent);
    const total = sum + bonus;
    document.getElementById(`premier-total-${playerIndex}`).textContent = total;
    updateFourthTotal(playerIndex);
}

function updateSecondTotal(playerIndex) {
    const min = parseInt(document.getElementById(`input-min-${playerIndex}`).value) || 0;
    const max = parseInt(document.getElementById(`input-max-${playerIndex}`).value) || 0;
    const secondTotal = max - min;
    document.getElementById(`second-total-${playerIndex}`).textContent = secondTotal;
    updateFourthTotal(playerIndex);
}

function updateThirdTotal(playerIndex) {
    const suite = parseInt(document.getElementById(`select-${playerIndex}-Suite`).value) || 0;
    const full = parseInt(document.getElementById(`select-${playerIndex}-Full`).value) || 0;
    const carre = parseInt(document.getElementById(`select-${playerIndex}-Carré`).value) || 0;
    const yams = parseInt(document.getElementById(`select-${playerIndex}-Yams`).value) || 0;
    const thirdTotal = suite + full + carre + yams;
    document.getElementById(`third-total-${playerIndex}`).textContent = thirdTotal;
    updateFourthTotal(playerIndex);
}

function updateFourthTotal(playerIndex) {
    const premierTotal = parseInt(document.getElementById(`premier-total-${playerIndex}`).textContent) || 0;
    const secondTotal = parseInt(document.getElementById(`second-total-${playerIndex}`).textContent) || 0;
    const thirdTotal = parseInt(document.getElementById(`third-total-${playerIndex}`).textContent) || 0;
    const fourthTotal = premierTotal + secondTotal + thirdTotal;
    document.getElementById(`fourth-total-${playerIndex}`).textContent = fourthTotal;
}

function validateInput(playerIndex, field) {
    const input = document.getElementById(`input-${field}-${playerIndex}`);
    const value = input.value;
    const minValue = 5;
    const maxValue = 30;
    if (value && (isNaN(value) || value < minValue || value > maxValue)) {
        input.setCustomValidity(`La valeur doit être entre ${minValue} et ${maxValue}`);
    } else {
        input.setCustomValidity('');
    }
}

function checkCompletion() {
    const inputs = document.querySelectorAll('td select, td input[type="number"]');
    let allFilled = true;
    let missingFields = [];

    inputs.forEach(input => {
        if (!input.value || (input.id.includes('second-total') && input.textContent === '0')) {
            allFilled = false;
            const row = input.closest('tr').children[0].textContent;
            const player = input.closest('table').querySelectorAll('th')[input.closest('td').cellIndex].textContent;
            missingFields.push(`${player} il reste ${row}`);
        }
    });

    const resultDiv = document.createElement('div');
    resultDiv.id = 'winner-message';
    if (allFilled) {
        let highestScore = 0;
        let winner = '';
        const players = getPlayersFromLocalStorage();
        const scores = getScoresFromLocalStorage();
        players.forEach((player, index) => {
            const score = parseInt(document.getElementById(`fourth-total-${index}`).textContent) || 0;
            if (score > highestScore) {
                highestScore = score;
                winner = player;
            }

            // Accumuler les scores
            if (!scores[player]) {
                scores[player] = { wins: 0, totalPoints: 0 };
            }
            scores[player].totalPoints += score;
        });

        if (winner) {
            scores[winner].wins += 1;
        }

        saveScoresToLocalStorage(scores);

        resultDiv.innerHTML = `
            <p>Tous les champs sont remplis. Le jeu est terminé!</p>
            <p>Le gagnant est : ${winner} avec ${highestScore} points.</p>
            <button onclick="restartGame()">Relancer la partie</button>
            <button onclick="window.location.href='index.html'">Retour au menu</button>
        `;
    } else {
        resultDiv.innerHTML = `
            <p>Il reste des champs non remplis:</p>
            <ul>${missingFields.map(field => `<li>${field}</li>`).join('')}</ul>
        `;
    }
    document.body.appendChild(resultDiv);
}

function restartGame() {
    const players = getPlayersFromLocalStorage();
    window.location.href = 'grid.html';
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
