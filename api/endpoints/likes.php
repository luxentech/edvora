<?php
// =========================================================
// Elevate Backend — Likes API Endpoint
// =========================================================

require_once __DIR__ . '/../config/security.php';
require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../helpers/response.php';
require_once __DIR__ . '/../helpers/auth.php';

$pdo = getDBConnection();
$action = $_GET['action'] ?? $_POST['action'] ?? '';
$data = getRequestData();

switch ($action) {

    case 'toggle':
        $user = requireAuth();
        $oppId = $data['opportunity_id'] ?? $data['id'] ?? null;
        if (!$oppId) sendError('معرف الفرصة مطلوب');

        if ($pdo) {
            $stmt = $pdo->prepare("SELECT id FROM likes WHERE opportunity_id = :o AND user_id = :u");
            $stmt->execute(['o' => $oppId, 'u' => $user['id']]);
            if ($stmt->fetch()) {
                $del = $pdo->prepare("DELETE FROM likes WHERE opportunity_id = :o AND user_id = :u");
                $del->execute(['o' => $oppId, 'u' => $user['id']]);
                $liked = false;
            } else {
                $ins = $pdo->prepare("INSERT INTO likes (opportunity_id, user_id) VALUES (:o, :u)");
                $ins->execute(['o' => $oppId, 'u' => $user['id']]);
                $liked = true;
            }

            $countStmt = $pdo->prepare("SELECT COUNT(*) as cnt FROM likes WHERE opportunity_id = :o");
            $countStmt->execute(['o' => $oppId]);
            $count = (int)$countStmt->fetch()['cnt'];

            sendSuccess('تم تحديث الإعجاب', ['liked' => $liked, 'count' => $count]);
        } else {
            sendSuccess('تم تحديث الإعجاب', ['liked' => true, 'count' => 1]);
        }
        break;

    default: // Get likes map for all opportunities
        if ($pdo) {
            $stmt = $pdo->query("SELECT l.opportunity_id, u.username FROM likes l JOIN users u ON l.user_id = u.id");
            $rows = $stmt->fetchAll();
            $likesMap = [];
            foreach ($rows as $r) {
                $oppId = (string)$r['opportunity_id'];
                if (!isset($likesMap[$oppId])) {
                    $likesMap[$oppId] = [];
                }
                $likesMap[$oppId][] = $r['username'];
            }
            sendSuccess('بيانات الإعجابات', $likesMap);
        } else {
            sendSuccess('بيانات الإعجابات', (object)[]);
        }
        break;
}
