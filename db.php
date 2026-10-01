<?php

/**
 * IRA EXPRESS — Bootstrap de l'API
 * Ce fichier ne produit JAMAIS de HTML : uniquement du JSON.
 * Il est inclus par tous les autres fichiers de api/.
 */

if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

define('DB_HOST', 'localhost');
define('DB_NAME', 'ira_express');
define('DB_USER', 'root');
define('DB_PASS', '');

try {
    $pdo = new PDO(
        "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4",
        DB_USER,
        DB_PASS,
        [
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        ]
    );
} catch (PDOException $e) {
    jsonError('Erreur de connexion à la base de données.', 500);
}

/** Envoie une réponse JSON de succès et arrête le script. */
function jsonSuccess($data = [], $statusCode = 200)
{
    http_response_code($statusCode);
    echo json_encode(['ok' => true] + (is_array($data) ? $data : ['data' => $data]), JSON_UNESCAPED_UNICODE);
    exit;
}

/** Envoie une réponse JSON d'erreur et arrête le script. */
function jsonError($message, $statusCode = 400)
{
    http_response_code($statusCode);
    echo json_encode(['ok' => false, 'erreur' => $message], JSON_UNESCAPED_UNICODE);
    exit;
}

/** Lit le corps JSON envoyé par le front (fetch) sous forme de tableau. */
function corpsJson()
{
    $donnees = json_decode(file_get_contents('php://input'), true);
    return is_array($donnees) ? $donnees : [];
}

function nettoyer($valeur)
{
    return htmlspecialchars(trim((string) $valeur), ENT_QUOTES, 'UTF-8');
}

function estConnecte()
{
    return isset($_SESSION['user_id']);
}

function exigerRole($role)
{
    if (!estConnecte() || $_SESSION['role'] !== $role) {
        jsonError('Accès refusé : vous devez être connecté en tant que ' . $role . '.', 403);
    }
}

function libelleStatut($statut)
{
    $labels = [
        'en_attente'     => 'En attente',
        'confirmee'      => 'Confirmée',
        'en_preparation' => 'En préparation',
        'attribuee'      => 'Attribuée à un livreur',
        'en_livraison'   => 'En cours de livraison',
        'livree'         => 'Livrée',
        'annulee'        => 'Annulée',
    ];
    return $labels[$statut] ?? $statut;
}
