<?php

/**
 * API Commerçant — IRA EXPRESS
 * Toutes les actions de l'espace commerçant passent par ce fichier,
 * distinguées par le paramètre "action" (en GET ou dans le corps JSON POST).
 *
 * Actions disponibles :
 *   GET  ?action=stats               → statistiques du tableau de bord
 *   GET  ?action=produits            → liste des produits de la boutique
 *   POST ?action=produit_ajouter     → ajoute un produit
 *   POST ?action=produit_modifier    → modifie un produit
 *   POST ?action=produit_supprimer   → supprime un produit
 *   GET  ?action=commandes           → liste des commandes reçues
 *   POST ?action=commande_statut     → change le statut d'une commande
 *   GET  ?action=ventes              → historique des ventes livrées
 */

require_once __DIR__ . '/_config.php';
exigerRole('commercant');

$action = $_GET['action'] ?? '';

// Récupère la boutique du commerçant connecté (utile à presque toutes les actions)
$stmt = $pdo->prepare("SELECT * FROM boutiques WHERE utilisateur_id = ?");
$stmt->execute([$_SESSION['user_id']]);
$boutique = $stmt->fetch();

if (!$boutique) {
    jsonError('Aucune boutique associée à ce compte.', 404);
}
$boutiqueId = $boutique['id'];

switch ($action) {

    case 'stats':
        $nbProduits = $pdo->prepare("SELECT COUNT(*) FROM produits WHERE boutique_id = ?");
        $nbProduits->execute([$boutiqueId]);

        $nbAttente = $pdo->prepare("SELECT COUNT(*) FROM commandes WHERE boutique_id = ? AND statut = 'en_attente'");
        $nbAttente->execute([$boutiqueId]);

        $totalVentes = $pdo->prepare("SELECT COALESCE(SUM(montant_total),0) FROM commandes WHERE boutique_id = ? AND statut = 'livree'");
        $totalVentes->execute([$boutiqueId]);

        $stmt = $pdo->prepare("
            SELECT c.*, u.nom AS nom_client
            FROM commandes c JOIN utilisateurs u ON u.id = c.client_id
            WHERE c.boutique_id = ? ORDER BY c.date_commande DESC LIMIT 6
        ");
        $stmt->execute([$boutiqueId]);

        jsonSuccess([
            'boutique' => $boutique,
            'nb_produits' => (int) $nbProduits->fetchColumn(),
            'nb_commandes_attente' => (int) $nbAttente->fetchColumn(),
            'total_ventes' => (float) $totalVentes->fetchColumn(),
            'dernieres_commandes' => $stmt->fetchAll(),
        ]);
        break;

    case 'produits':
        $stmt = $pdo->prepare("
            SELECT p.*, c.nom AS nom_categorie
            FROM produits p JOIN categories c ON c.id = p.categorie_id
            WHERE p.boutique_id = ? ORDER BY p.date_ajout DESC
        ");
        $stmt->execute([$boutiqueId]);
        jsonSuccess(['produits' => $stmt->fetchAll()]);
        break;

    case 'produit_ajouter':
        $d = corpsJson();
        $nom = nettoyer($d['nom'] ?? '');
        $prix = (float) ($d['prix'] ?? 0);
        $categorieId = (int) ($d['categorie_id'] ?? 0);

        if (empty($nom) || $prix <= 0 || $categorieId <= 0) {
            jsonError('Merci de remplir correctement tous les champs obligatoires.');
        }

        $stmt = $pdo->prepare("
            INSERT INTO produits (boutique_id, categorie_id, nom, description, prix, stock, photo)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        ");
        $stmt->execute([
            $boutiqueId,
            $categorieId,
            $nom,
            nettoyer($d['description'] ?? ''),
            $prix,
            (int) ($d['stock'] ?? 0),
            $d['photo'] ?? null,
        ]);
        jsonSuccess(['id' => $pdo->lastInsertId()], 201);
        break;

    case 'produit_modifier':
        $d = corpsJson();
        $produitId = (int) ($d['id'] ?? 0);

        $verif = $pdo->prepare("SELECT id, photo FROM produits WHERE id = ? AND boutique_id = ?");
        $verif->execute([$produitId, $boutiqueId]);
        $existant = $verif->fetch();
        if (!$existant) {
            jsonError('Produit introuvable.', 404);
        }

        $nom = nettoyer($d['nom'] ?? '');
        $prix = (float) ($d['prix'] ?? 0);
        $categorieId = (int) ($d['categorie_id'] ?? 0);
        if (empty($nom) || $prix <= 0 || $categorieId <= 0) {
            jsonError('Merci de remplir correctement tous les champs obligatoires.');
        }

        $statut = in_array($d['statut'] ?? '', ['disponible', 'rupture', 'desactive']) ? $d['statut'] : 'disponible';
        $photo = !empty($d['photo']) ? $d['photo'] : $existant['photo'];

        $stmt = $pdo->prepare("
            UPDATE produits SET nom=?, categorie_id=?, description=?, prix=?, stock=?, photo=?, statut=?
            WHERE id=? AND boutique_id=?
        ");
        $stmt->execute([
            $nom,
            $categorieId,
            nettoyer($d['description'] ?? ''),
            $prix,
            (int) ($d['stock'] ?? 0),
            $photo,
            $statut,
            $produitId,
            $boutiqueId,
        ]);
        jsonSuccess(['message' => 'Produit modifié.']);
        break;

    case 'produit_supprimer':
        $d = corpsJson();
        $produitId = (int) ($d['id'] ?? 0);
        $stmt = $pdo->prepare("DELETE FROM produits WHERE id = ? AND boutique_id = ?");
        $stmt->execute([$produitId, $boutiqueId]);
        jsonSuccess(['message' => 'Produit supprimé.']);
        break;

    case 'commandes':
        $stmt = $pdo->prepare("
            SELECT c.*, u.nom AS nom_client
            FROM commandes c JOIN utilisateurs u ON u.id = c.client_id
            WHERE c.boutique_id = ? ORDER BY c.date_commande DESC
        ");
        $stmt->execute([$boutiqueId]);
        $commandes = $stmt->fetchAll();
        foreach ($commandes as &$c) {
            $c['statut_libelle'] = libelleStatut($c['statut']);
        }
        jsonSuccess(['commandes' => $commandes]);
        break;

    case 'commande_statut':
        $d = corpsJson();
        $commandeId = (int) ($d['id'] ?? 0);
        $nouveauStatut = $d['statut'] ?? '';
        if (!in_array($nouveauStatut, ['confirmee', 'en_preparation', 'annulee'])) {
            jsonError('Statut invalide.');
        }
        $stmt = $pdo->prepare("UPDATE commandes SET statut = ? WHERE id = ? AND boutique_id = ?");
        $stmt->execute([$nouveauStatut, $commandeId, $boutiqueId]);
        jsonSuccess(['message' => 'Statut mis à jour.']);
        break;

    case 'ventes':
        $stmt = $pdo->prepare("
            SELECT c.id, c.montant_total, c.date_commande, u.nom AS nom_client
            FROM commandes c JOIN utilisateurs u ON u.id = c.client_id
            WHERE c.boutique_id = ? AND c.statut = 'livree'
            ORDER BY c.date_commande DESC
        ");
        $stmt->execute([$boutiqueId]);
        $ventes = $stmt->fetchAll();

        $stmt2 = $pdo->prepare("
            SELECT p.nom, SUM(cp.quantite) AS total_vendu
            FROM commande_produits cp
            JOIN produits p ON p.id = cp.produit_id
            JOIN commandes c ON c.id = cp.commande_id
            WHERE c.boutique_id = ? AND c.statut = 'livree'
            GROUP BY p.id ORDER BY total_vendu DESC LIMIT 5
        ");
        $stmt2->execute([$boutiqueId]);

        jsonSuccess([
            'ventes' => $ventes,
            'total_ventes' => array_sum(array_column($ventes, 'montant_total')),
            'top_produits' => $stmt2->fetchAll(),
        ]);
        break;

    default:
        jsonError('Action inconnue.', 404);
}
