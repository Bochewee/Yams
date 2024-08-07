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
                    <input type="number" class="score-input" id="score-${index}-${i}" min="0" max="300" step="10">
                    <button class="photo-button" onclick="openCamera(${index}, ${i})">&#128247;</button> <!-- Icône de caméra -->
                </td>`;
        });
        gridHTML += '</tr>';
    }

    gridHTML += '</table>';
    document.getElementById('gameContainerFreezbee').innerHTML = gridHTML;
}

function openCamera(playerIndex, tour) {
    const modal = document.getElementById("imageModal");
    const video = document.getElementById("video");
    const canvas = document.getElementById("canvas");
    const context = canvas.getContext("2d");
    const upload = document.getElementById("upload");

    modal.style.display = "block";

    // Accéder à la caméra
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        navigator.mediaDevices.getUserMedia({ video: true }).then(function(stream) {
            video.srcObject = stream;
            video.play();
        }).catch(function(error) {
            alert("Erreur lors de l'accès à la caméra : " + error.message);
        });
    } else {
        alert("Accès à la caméra non supporté dans ce navigateur.");
    }

    document.getElementById("snap").onclick = function() {
        context.drawImage(video, 0, 0, 640, 480);
        detectScore(canvas, playerIndex, tour);
    };

    upload.onchange = function(event) {
        const file = event.target.files[0];
        const reader = new FileReader();
        reader.onload = function(e) {
            const img = new Image();
            img.onload = function() {
                context.drawImage(img, 0, 0, 640, 480);
                detectScore(canvas, playerIndex, tour);
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    };
}

function closeModal() {
    const modal = document.getElementById("imageModal");
    modal.style.display = "none";
}

function detectScore(canvas, playerIndex, tour) {
    let src = cv.imread(canvas);
    let dst = new cv.Mat();
    let low = new cv.Mat(src.rows, src.cols, src.type(), [0, 0, 0, 0]);
    let high = new cv.Mat(src.rows, src.cols, src.type(), [0, 0, 0, 255]);

    let frisbeeColors = {
        'bleu': { low: [100, 150, 0, 0], high: [140, 255, 255, 255] },
        'vert': { low: [40, 100, 0, 0], high: [80, 255, 255, 255] },
        'orange': { low: [5, 100, 0, 0], high: [15, 255, 255, 255] }
    };

    let scores = {
        'bleu': 0,
        'vert': 0,
        'orange': 0
    };

    cv.cvtColor(src, src, cv.COLOR_RGBA2RGB);
    cv.cvtColor(src, src, cv.COLOR_RGB2HSV);

    for (let color in frisbeeColors) {
        let lowColor = new cv.Mat(src.rows, src.cols, src.type(), frisbeeColors[color].low);
        let highColor = new cv.Mat(src.rows, src.cols, src.type(), frisbeeColors[color].high);

        cv.inRange(src, lowColor, highColor, dst);
        let contours = new cv.MatVector();
        let hierarchy = new cv.Mat();
        cv.findContours(dst, contours, hierarchy, cv.RETR_CCOMP, cv.CHAIN_APPROX_SIMPLE);

        for (let i = 0; i < contours.size(); ++i) {
            let cnt = contours.get(i);
            let moments = cv.moments(cnt, false);
            let cx = moments.m10 / moments.m00;
            let cy = moments.m01 / moments.m00;

            if (isInZone(cx, cy, '100')) {
                scores[color] += 100;
            } else if (isInZone(cx, cy, '50')) {
                scores[color] += 50;
            } else if (isInZone(cx, cy, '25')) {
                scores[color] += 25;
            } else if (isInZone(cx, cy, '10')) {
                scores[color] += 10;
            }
        }

        lowColor.delete();
        highColor.delete();
        contours.delete();
        hierarchy.delete();
    }

    low.delete();
    high.delete();
    src.delete();
    dst.delete();

    let detectedScore = scores['bleu'] + scores['vert'] + scores['orange'];
    if (detectedScore > 0) {
        document.getElementById(`score-${playerIndex}-${tour}`).value = detectedScore;
        closeModal();
    } else {
        alert("L'image n'est pas suffisamment claire. Veuillez réessayer.");
    }
}

function isInZone(x, y, zone) {
    // Implémentez votre logique pour déterminer si les coordonnées (x, y) se trouvent dans la zone spécifiée
    // Exemple de logique : vérifiez si les coordonnées se trouvent dans une zone prédéfinie pour chaque score
    switch (zone) {
        case '100':
            return (x > 270 && x < 370) && (y > 170 && y < 270);  // Adaptez ces valeurs pour votre cible
        case '50':
            return (x > 170 && x < 470) && (y > 70 && y < 370);   // Adaptez ces valeurs pour votre cible
        case '25':
            return (x > 70 && x < 570) && (y > 70 && y < 470);    // Adaptez ces valeurs pour votre cible
        case '10':
            return (x > 0 && x < 640) && (y > 0 && y < 480);      // Adaptez ces valeurs pour votre cible
        default:
            return false;
    }
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
