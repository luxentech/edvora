<?php
// =========================================================
// Elevate Backend — Admin Dashboard & System Control Endpoint
// =========================================================

require_once __DIR__ . '/../config/security.php';
require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../helpers/response.php';
require_once __DIR__ . '/../helpers/auth.php';

$pdo = getDBConnection();
$action = $_GET['action'] ?? $_POST['action'] ?? '';
$data = getRequestData();

switch ($action) {

    case 'stats':
        $user = requireRole(['super_admin', 'admin', 'moderator']);
        if ($pdo) {
            $uCount = $pdo->query("SELECT COUNT(*) FROM users")->fetchColumn();
            $oCount = $pdo->query("SELECT COUNT(*) FROM opportunities")->fetchColumn();
            $cCount = $pdo->query("SELECT COUNT(*) FROM comments")->fetchColumn();
            $lCount = $pdo->query("SELECT COUNT(*) FROM likes")->fetchColumn();
            $pCount = $pdo->query("SELECT COUNT(*) FROM partners")->fetchColumn();
            $mCount = $pdo->query("SELECT COUNT(*) FROM contact_messages WHERE reply_status = 'unread'")->fetchColumn();

            sendSuccess('إحصائيات النظام', [
                'users' => (int)$uCount,
                'opportunities' => (int)$oCount,
                'comments' => (int)$cCount,
                'likes' => (int)$lCount,
                'partners' => (int)$pCount,
                'unread_messages' => (int)$mCount
            ]);
        } else {
            sendSuccess('إحصائيات النظام', [
                'users' => 1542,
                'opportunities' => 50,
                'comments' => 0,
                'likes' => 0,
                'partners' => 0,
                'unread_messages' => 0
            ]);
        }
        break;

    case 'users_list':
        $user = requireRole(['super_admin', 'admin']);
        if ($pdo) {
            $stmt = $pdo->query("SELECT id, username, email, full_name, role, is_email_verified, created_at FROM users ORDER BY id DESC");
            $users = $stmt->fetchAll();
            sendSuccess('قائمة المستخدمين', $users);
        } else {
            sendSuccess('قائمة المستخدمين', []);
        }
        break;

    case 'update_user_role':
        $user = requireRole(['super_admin']);
        $targetId = $data['id'] ?? null;
        $newRole  = $data['role'] ?? 'user';

        if (!in_array($newRole, ['super_admin', 'admin', 'moderator', 'user'])) {
            sendError('الصلاحية المحددة غير صالحة');
        }

        if ($pdo && $targetId) {
            $stmt = $pdo->prepare("UPDATE users SET role = :r WHERE id = :id");
            $stmt->execute(['r' => $newRole, 'id' => $targetId]);
        }
        sendSuccess('تم تغيير صلاحية المستخدم بنجاح!');
        break;

    case 'delete_user':
        $user = requireRole(['super_admin']);
        $targetId = $data['id'] ?? $_GET['id'] ?? null;

        if ($pdo && $targetId) {
            $stmt = $pdo->prepare("DELETE FROM users WHERE id = :id");
            $stmt->execute(['id' => $targetId]);
        }
        sendSuccess('تم حذف المستخدم بنجاح');
        break;

    case 'logs':
        $user = requireRole(['super_admin', 'admin']);
        if ($pdo) {
            $stmt = $pdo->query("SELECT l.*, u.username FROM activity_logs l LEFT JOIN users u ON l.user_id = u.id ORDER BY l.id DESC LIMIT 100");
            $logs = $stmt->fetchAll();
            sendSuccess('سجل العمليات', $logs);
        } else {
            sendSuccess('سجل العمليات', []);
        }
        break;

    default:
        sendError('إجراء المدير غير معروف', 404);
        break;
}
