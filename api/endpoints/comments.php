<?php
// =========================================================
// Elevate Backend — Comments API Endpoint
// =========================================================

require_once __DIR__ . '/../config/security.php';
require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../helpers/response.php';
require_once __DIR__ . '/../helpers/auth.php';

$pdo = getDBConnection();
$action = $_GET['action'] ?? $_POST['action'] ?? '';
$data = getRequestData();

switch ($action) {

    case 'add':
        $user = requireAuth();
        $oppId = $data['cardId'] ?? $data['opportunity_id'] ?? null;
        $text  = trim($data['text'] ?? $data['comment_text'] ?? '');
        $parentId = $data['parent_id'] ?? null;

        if (!$oppId || empty($text)) {
            sendError('يرجى كتابة التعليق قبل الإرسال');
        }

        if ($pdo) {
            $stmt = $pdo->prepare("INSERT INTO comments (opportunity_id, user_id, parent_id, comment_text) VALUES (:o, :u, :p, :t)");
            $stmt->execute([
                'o' => $oppId,
                'u' => $user['id'],
                'p' => $parentId,
                't' => $text
            ]);
            $commentId = $pdo->lastInsertId();

            // Create notification for admin / opp owner
            $notif = $pdo->prepare("INSERT INTO notifications (title, message, link, type) VALUES (:t, :m, :l, 'comment')");
            $notif->execute([
                't' => 'تعليق جديد',
                'm' => 'قام ' . $user['username'] . ' بإضافة تعليق جديد على الفرصة رقم #' . $oppId,
                'l' => '?id=' . $oppId
            ]);
        } else {
            $commentId = time();
        }

        sendSuccess('تمت إضافة التعليق بنجاح!', [
            'id' => (string)$commentId,
            'cardId' => $oppId,
            'username' => $user['username'],
            'name' => $user['full_name'] ?? $user['username'],
            'text' => $text,
            'date' => date('Y-m-d H:i')
        ]);
        break;

    case 'delete':
        $user = requireAuth();
        $commentId = $data['id'] ?? $_GET['id'] ?? null;
        if (!$commentId) sendError('معرف التعليق مطلوب');

        if ($pdo) {
            // Only admin, moderator, or comment author can delete
            if ($user['role'] === 'super_admin' || $user['role'] === 'admin' || $user['role'] === 'moderator') {
                $stmt = $pdo->prepare("DELETE FROM comments WHERE id = :id");
                $stmt->execute(['id' => $commentId]);
            } else {
                $stmt = $pdo->prepare("DELETE FROM comments WHERE id = :id AND user_id = :u");
                $stmt->execute(['id' => $commentId, 'u' => $user['id']]);
            }
        }
        sendSuccess('تم حذف التعليق بنجاح');
        break;

    default: // List comments for an opportunity or all comments for admin
        $oppId = $_GET['cardId'] ?? $_GET['opportunity_id'] ?? null;

        if ($pdo) {
            if ($oppId) {
                $stmt = $pdo->prepare("SELECT c.*, u.username, u.full_name as name, u.avatar FROM comments c JOIN users u ON c.user_id = u.id WHERE c.opportunity_id = :o ORDER BY c.id DESC");
                $stmt->execute(['o' => $oppId]);
            } else {
                $stmt = $pdo->query("SELECT c.*, u.username, u.full_name as name, o.title_ar as opp_title FROM comments c JOIN users u ON c.user_id = u.id JOIN opportunities o ON c.opportunity_id = o.id ORDER BY c.id DESC LIMIT 100");
            }
            $rows = $stmt->fetchAll();
            $formatted = array_map(function($r) {
                return [
                    'id' => (string)$r['id'],
                    'cardId' => (string)($r['opportunity_id'] ?? ''),
                    'username' => $r['username'],
                    'name' => $r['name'] ?: $r['username'],
                    'text' => $r['comment_text'],
                    'date' => date('Y-m-d H:i', strtotime($r['created_at']))
                ];
            }, $rows);
            sendSuccess('قائمة التعليقات', $formatted);
        } else {
            sendSuccess('قائمة التعليقات', []);
        }
        break;
}
