<?php
// =========================================================
// Elevate Backend — Contact Us & Messages API Endpoint
// =========================================================

require_once __DIR__ . '/../config/security.php';
require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../helpers/response.php';
require_once __DIR__ . '/../helpers/auth.php';

$pdo = getDBConnection();
$action = $_GET['action'] ?? $_POST['action'] ?? '';
$data = getRequestData();

switch ($action) {

    case 'send':
    case 'submit':
        $name    = trim($data['name'] ?? '');
        $email   = trim($data['email'] ?? '');
        $subject = trim($data['subject'] ?? 'استفسار جديد');
        $message = trim($data['message'] ?? '');

        if (empty($name) || empty($email) || empty($message)) {
            sendError('جميع الحقول المطلوبة يجب ملؤها (الاسم، البريد، وتفاصيل الرسالة)');
        }

        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            sendError('البريد الإلكتروني غير صالح');
        }

        if ($pdo) {
            $stmt = $pdo->prepare("INSERT INTO contact_messages (name, email, subject, message) VALUES (:n, :e, :s, :m)");
            $stmt->execute(['n' => $name, 'e' => $email, 's' => $subject, 'm' => $message]);
        }
        sendSuccess('تم إرسال رسالتك بنجاح! سيتواصل معك فريقنا في أقرب وقت.');
        break;

    case 'reply':
        $user = requireRole(['super_admin', 'admin', 'moderator']);
        $msgId = $data['id'] ?? null;
        $reply = trim($data['reply'] ?? '');

        if (!$msgId || empty($reply)) sendError('الرسالة والرد مطلوبان');

        if ($pdo) {
            $stmt = $pdo->prepare("UPDATE contact_messages SET admin_reply = :r, reply_status = 'replied' WHERE id = :id");
            $stmt->execute(['r' => $reply, 'id' => $msgId]);
        }
        sendSuccess('تم حفظ الرد وتأكيده بنجاح');
        break;

    default: // List messages for admin
        $user = requireRole(['super_admin', 'admin', 'moderator']);
        if ($pdo) {
            $stmt = $pdo->query("SELECT * FROM contact_messages ORDER BY id DESC LIMIT 100");
            $rows = $stmt->fetchAll();
            sendSuccess('قائمة الرسائل', $rows);
        } else {
            sendSuccess('قائمة الرسائل', []);
        }
        break;
}
