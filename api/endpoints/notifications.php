<?php
// =========================================================
// Elevate Backend — Notifications API Endpoint
// =========================================================

require_once __DIR__ . '/../config/security.php';
require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../helpers/response.php';
require_once __DIR__ . '/../helpers/auth.php';

$pdo = getDBConnection();
$action = $_GET['action'] ?? $_POST['action'] ?? '';
$data = getRequestData();

switch ($action) {

    case 'send_all':
        $user = requireRole(['super_admin', 'admin']);
        $title   = trim($data['title'] ?? '');
        $message = trim($data['message'] ?? '');
        $link    = trim($data['link'] ?? '#');

        if (empty($title) || empty($message)) {
            sendError('عنوان الإشعار وتفاصيل الرسالة مطلوبة');
        }

        if ($pdo) {
            $stmt = $pdo->prepare("INSERT INTO notifications (user_id, title, message, link, type) VALUES (NULL, :t, :m, :l, 'global')");
            $stmt->execute(['t' => $title, 'm' => $message, 'l' => $link]);
        }
        sendSuccess('تم إرسال الإشعار لجميع الأعضاء بنجاح!');
        break;

    case 'mark_read':
        $user = requireAuth();
        $notifId = $data['id'] ?? null;
        if ($pdo && $notifId) {
            $stmt = $pdo->prepare("UPDATE notifications SET is_read = 1 WHERE id = :id AND (user_id = :u OR user_id IS NULL)");
            $stmt->execute(['id' => $notifId, 'u' => $user['id']]);
        }
        sendSuccess('تم تحديد الإشعار كمقروء');
        break;

    default: // List notifications for current user + global ones
        $user = getAuthUser();
        if ($pdo) {
            if ($user) {
                $stmt = $pdo->prepare("SELECT * FROM notifications WHERE user_id = :u OR user_id IS NULL ORDER BY id DESC LIMIT 50");
                $stmt->execute(['u' => $user['id']]);
            } else {
                $stmt = $pdo->query("SELECT * FROM notifications WHERE user_id IS NULL ORDER BY id DESC LIMIT 50");
            }
            $rows = $stmt->fetchAll();
            $formatted = array_map(function($r) {
                return [
                    'id' => 'notif_' . $r['id'],
                    'title' => $r['title'],
                    'message' => $r['message'],
                    'link' => $r['link'] ?: '#',
                    'date' => date('Y-m-d', strtotime($r['created_at'])),
                    'read' => (bool)$r['is_read']
                ];
            }, $rows);
            sendSuccess('قائمة الإشعارات', $formatted);
        } else {
            sendSuccess('قائمة الإشعارات', []);
        }
        break;
}
