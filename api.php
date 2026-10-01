<?php
require_once __DIR__ . '/_config.php';

if (estConnecte()) {
    jsonSuccess([
        'connecte' => true,
        'utilisateur' => [
            'id' => $_SESSION['user_id'],
            'nom' => $_SESSION['nom'],
            'role' => $_SESSION['role'],
        ],
    ]);
} else {
    jsonSuccess(['connecte' => false]);
}
