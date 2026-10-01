<?php
require_once __DIR__ . '/_config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    jsonError('Méthode non autorisée.', 405);
}

$slug = $_GET['slug'] ?? '';

$stmt = $pdo->prepare("SELECT * FROM categories WHERE slug = ?");
$stmt->execute([$slug]);
$categorie = $stmt->fetch();

if (!$categorie) {
    jsonError('Catégorie introuvable.', 404);
}

$stmt = $pdo->prepare("
    SELECT p.*, b.nom_boutique, b.id AS boutique_id
    FROM produits p
    JOIN boutiques b ON b.id = p.boutique_id
    WHERE p.categorie_id = ? AND p.statut = 'disponible'
    ORDER BY p.date_ajout DESC
");
$stmt->execute([$categorie['id']]);
$produits = $stmt->fetchAll();

jsonSuccess(['categorie' => $categorie, 'produits' => $produits]);
