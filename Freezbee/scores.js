document.addEventListener('DOMContentLoaded', function() {
    if (document.body.classList.contains('scores-page')) {
        displayScores(); // Afficher les scores uniquement sur la page des scores
    }
});

function getScoresFromLocalStorage() {
    return JSON.parse(localStorage.getItem('freezbeeScores')) || {};
}

function saveScoresToLocalStorage(scores) {
    localStorage.setItem('freezbeeScores', JSON.stringify(scores));
}

function displayScores() {
    const scores = getScoresFromLocalStorage();
    let scoresHTML = '<table><tr><th>Joueur</th><th>Victoires</th><th>Points Totaux</th><th>Action</th></tr>';
    
    // Parcourir chaque joueur dans l'objet scores
    for (const player in scores) {
        if (scores.hasOwnProperty(player)) {
            scoresHTML += `<tr id="row-${player}"><td>${player}</td><td>${scores[player].wins}</td><td>${scores[player].totalPoints}</td><td><button onclick="deletePlayer('${player}')">Supprimer</button></td></tr>`;
        }
    }

    scoresHTML += '</table>';
    document.getElementById('scoresTable').innerHTML = scoresHTML;
}

function deletePlayer(player) {
    // Récupérer les scores stockés
    let scores = getScoresFromLocalStorage();

    // Supprimer le joueur de l'objet des scores
    if (scores[player]) {
        delete scores[player];

        // Mettre à jour le stockage local avec les scores restants
        saveScoresToLocalStorage(scores);

        // Réafficher les scores après suppression
        displayScores();
    }
}
