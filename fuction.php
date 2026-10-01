<?php
require_once __DIR__ . '/_config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    jsonError('Méthode non autorisée.', 405);
}

$categories = $pdo->query("SELECT * FROM categories ORDER BY id")->fetchAll();

jsonSuccess(['categories' => $categories]);
