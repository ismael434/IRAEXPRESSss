<?php
require_once __DIR__ . '/_config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonError('Méthode non autorisée.', 405);
}
if (!estConnecte() || $_SESSION['role'] !== 'client') {
    jsonError('Vous devez être connecté en tant que client pour commander.', 401);
}

$donnees = corpsJson();
$panier = $donnees['panier'] ?? [];
$quartier = nettoyer($donnees['quartier'] ?? '');
$adresse = nettoyer($donnees['adresse'] ?? '');
$telephone = nettoyer($donnees['telephone'] ?? '');
$modePaiement = ($donnees['mode_paiement'] ?? '') === 'mobile_money' ? 'mobile_money' : 'a_la_livraison';

if (empty($panier) || empty($quartier) || empty($adresse) || empty($telephone)) {
    jsonError('Merci de remplir tous les champs et de vérifier votre panier.');
}

$parBoutique = [];
foreach ($panier as $item) {
    $parBoutique[$item['boutiqueId']][] = $item;
}

$idsCrees = [];

try {
    $pdo->beginTransaction();

    foreach ($parBoutique as $boutiqueId => $articles) {
        $total = 0;
        foreach ($articles as $article) {
            $total += $article['prix'] * $article['quantite'];
        }
        $fraisLivraison = 500;

        $stmt = $pdo->prepare("
            INSERT INTO commandes (client_id, boutique_id, adresse_livraison, quartier_livraison, telephone_contact, montant_total, frais_livraison, mode_paiement)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ");
        $stmt->execute([
            $_SESSION['user_id'],
            $boutiqueId,
            $adresse,
            $quartier,
            $telephone,
            $total,
            $fraisLivraison,
            $modePaiement
        ]);
        $commandeId = $pdo->lastInsertId();
        $idsCrees[] = $commandeId;

        $stmtLigne = $pdo->prepare("
            INSERT INTO commande_produits (commande_id, produit_id, quantite, prix_unitaire)
            VALUES (?, ?, ?, ?)
        ");
        foreach ($articles as $article) {
            $stmtLigne->execute([$commandeId, $article['id'], $article['quantite'], $article['prix']]);
            $pdo->prepare("UPDATE produits SET stock = GREATEST(0, stock - ?) WHERE id = ?")
                ->execute([$article['quantite'], $article['id']]);
        }
    }

    $pdo->commit();
} catch (Exception $e) {
    $pdo->rollBack();
    jsonError('Erreur lors de la validation de la commande.', 500);
}

jsonSuccess(['commandes_creees' => $idsCrees], 201);
