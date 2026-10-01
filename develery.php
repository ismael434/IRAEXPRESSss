<?php

/**
 * API Livreur — IRA EXPRESS
 *   GET  ?action=stats           → statistiques du tableau de bord
 *   POST ?action=disponibilite   → active/désactive la disponibilité
 *   GET  ?action=disponibles     → commandes en préparation, sans livreur
 *   GET  ?action=mes_commandes   → commandes attribuées à ce livreur
 *   POST ?action=prendre         → prend en charge une commande disponible
 *   POST ?action=statut          → met à jour le statut d'une livraison
 */

require_once __DIR__ . '/_config.php';
exigerRole('livreur');

$action = $_GET['action'] ?? '';
$livreurId = $_SESSION['user_id'];

switch ($action) {

    case 'stats':
        $stmt = $pdo->prepare("SELECT * FROM livreurs WHERE utilisateur_id = ?");
        $stmt->execute([$livreurId]);
        $infos = $stmt->fetch();

        $nbAttribuees = $pdo->prepare("SELECT COUNT(*) FROM commandes WHERE livreur_id = ? AND statut IN ('attribuee','en_livraison')");
        $nbAttribuees->execute([$livreurId]);

        $nbLivrees = $pdo->prepare("SELECT COUNT(*) FROM commandes WHERE livreur_id = ? AND statut = 'livree'");
        $nbLivrees->execute([$livreurId]);

        $nbDisponibles = $pdo->query("SELECT COUNT(*) FROM commandes WHERE statut = 'en_preparation' AND livreur_id IS NULL")->fetchColumn();

        jsonSuccess([
            'disponible' => (bool) $infos['disponible'],
            'nb_attribuees' => (int) $nbAttribuees->fetchColumn(),
            'nb_livrees' => (int) $nbLivrees->fetchColumn(),
            'nb_disponibles' => (int) $nbDisponibles,
        ]);
        break;

    case 'disponibilite':
        $d = corpsJson();
        $valeur = !empty($d['disponible']) ? 1 : 0;
        $stmt = $pdo->prepare("UPDATE livreurs SET disponible = ? WHERE utilisateur_id = ?");
        $stmt->execute([$valeur, $livreurId]);
        jsonSuccess(['disponible' => (bool) $valeur]);
        break;

    case 'disponibles':
        $stmt = $pdo->query("
            SELECT c.*, b.nom_boutique
            FROM commandes c JOIN boutiques b ON b.id = c.boutique_id
            WHERE c.statut = 'en_preparation' AND c.livreur_id IS NULL
            ORDER BY c.date_commande ASC
        ");
        jsonSuccess(['commandes' => $stmt->fetchAll()]);
        break;

    case 'mes_commandes':
        $stmt = $pdo->prepare("
            SELECT c.*, u.nom AS nom_client, b.nom_boutique
            FROM commandes c
            JOIN utilisateurs u ON u.id = c.client_id
            JOIN boutiques b ON b.id = c.boutique_id
            WHERE c.livreur_id = ?
            ORDER BY FIELD(c.statut,'attribuee','en_livraison','livree'), c.date_commande DESC
        ");
        $stmt->execute([$livreurId]);
        $commandes = $stmt->fetchAll();
        foreach ($commandes as &$c) {
            $c['statut_libelle'] = libelleStatut($c['statut']);
        }
        jsonSuccess(['commandes' => $commandes]);
        break;

    case 'prendre':
        $d = corpsJson();
        $commandeId = (int) ($d['id'] ?? 0);
        $stmt = $pdo->prepare("UPDATE commandes SET livreur_id = ?, statut = 'attribuee' WHERE id = ? AND livreur_id IS NULL");
        $stmt->execute([$livreurId, $commandeId]);
        jsonSuccess(['message' => 'Commande prise en charge.']);
        break;

    case 'statut':
        $d = corpsJson();
        $commandeId = (int) ($d['id'] ?? 0);
        $nouveauStatut = $d['statut'] ?? '';
        if (!in_array($nouveauStatut, ['en_livraison', 'livree'])) {
            jsonError('Statut invalide.');
        }
        if ($nouveauStatut === 'livree') {
            $stmt = $pdo->prepare("UPDATE commandes SET statut = ?, date_livraison = NOW() WHERE id = ? AND livreur_id = ?");
        } else {
            $stmt = $pdo->prepare("UPDATE commandes SET statut = ? WHERE id = ? AND livreur_id = ?");
        }
        $stmt->execute([$nouveauStatut, $commandeId, $livreurId]);
        jsonSuccess(['message' => 'Statut mis à jour.']);
        break;

    default:
        jsonError('Action inconnue.', 404);
}
