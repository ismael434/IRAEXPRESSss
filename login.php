<?php
require_once __DIR__ . '/_config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonError('Méthode non autorisée.', 405);
}

$donnees = corpsJson();
$telephone = nettoyer($donnees['telephone'] ?? '');
$motDePasse = $donnees['mot_de_passe'] ?? '';

$stmt = $pdo->prepare("SELECT * FROM utilisateurs WHERE telephone = ?");
$stmt->execute([$telephone]);
$utilisateur = $stmt->fetch();

if (!$utilisateur || !password_verify($motDePasse, $utilisateur['mot_de_passe'])) {
    jsonError('Numéro de téléphone ou mot de passe incorrect.', 401);
}
if ($utilisateur['statut'] === 'suspendu') {
    jsonError('Votre compte a été suspendu. Contactez le support IRA EXPRESS.', 403);
}

$_SESSION['user_id'] = $utilisateur['id'];
$_SESSION['role'] = $utilisateur['role'];
$_SESSION['nom'] = $utilisateur['nom'];

jsonSuccess(['utilisateur' => [
    'id' => $utilisateur['id'],
    'nom' => $utilisateur['nom'],
    'role' => $utilisateur['role'],
]]);
