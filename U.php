<?php
require_once __DIR__ . '/_config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonError('Méthode non autorisée.', 405);
}
exigerRole('commercant');

if (empty($_FILES['photo']['name'])) {
    jsonError('Aucun fichier reçu.');
}

$extensionsAutorisees = ['jpg', 'jpeg', 'png', 'webp'];
$extension = strtolower(pathinfo($_FILES['photo']['name'], PATHINFO_EXTENSION));

if (!in_array($extension, $extensionsAutorisees)) {
    jsonError("L'image doit être au format JPG, PNG ou WEBP.");
}
if ($_FILES['photo']['size'] > 3 * 1024 * 1024) {
    jsonError("L'image doit faire moins de 3 Mo.");
}

$dossier = __DIR__ . '/../uploads/produits';
if (!is_dir($dossier)) {
    mkdir($dossier, 0755, true);
}

$nomFichier = uniqid('img_', true) . '.' . $extension;

if (!move_uploaded_file($_FILES['photo']['tmp_name'], $dossier . '/' . $nomFichier)) {
    jsonError("Échec de l'enregistrement de l'image.", 500);
}

jsonSuccess(['nom_fichier' => $nomFichier, 'url' => '/uploads/produits/' . $nomFichier]);
