<?php
// =========================================================
// Elevate Backend — Partners API Endpoint
// =========================================================

require_once __DIR__ . '/../config/security.php';
require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../helpers/response.php';
require_once __DIR__ . '/../helpers/auth.php';

$pdo = getDBConnection();
$action = $_GET['action'] ?? $_POST['action'] ?? '';
$data = getRequestData();

switch ($action) {

    case 'save':
    case 'create':
    case 'update':
        $user = requireRole(['super_admin', 'admin']);
        $partnerId = $data['id'] ?? null;
        $name = trim($data['name'] ?? '');
        $type = trim($data['type'] ?? 'شريك');
        $logo = trim($data['logo'] ?? 'images/logo.png');

        if (empty($name)) sendError('اسم الشريك مطلوب');

        if ($pdo) {
            if ($partnerId) {
                $stmt = $pdo->prepare("UPDATE partners SET name = :n, type = :t, logo = :l WHERE id = :id");
                $stmt->execute(['n' => $name, 't' => $type, 'l' => $logo, 'id' => $partnerId]);
            } else {
                $stmt = $pdo->prepare("INSERT INTO partners (name, type, logo) VALUES (:n, :t, :l)");
                $stmt->execute(['n' => $name, 't' => $type, 'l' => $logo]);
                $partnerId = $pdo->lastInsertId();
            }
        }
        sendSuccess('تم حفظ بيانات الشريك بنجاح!', ['id' => $partnerId]);
        break;

    case 'delete':
        $user = requireRole(['super_admin', 'admin']);
        $partnerId = $_GET['id'] ?? $data['id'] ?? null;
        if ($pdo && $partnerId) {
            $stmt = $pdo->prepare("DELETE FROM partners WHERE id = :id");
            $stmt->execute(['id' => $partnerId]);
        }
        sendSuccess('تم حذف الشريك بنجاح');
        break;

    default: // List partners
        if ($pdo) {
            $stmt = $pdo->query("SELECT * FROM partners ORDER BY id DESC");
            $rows = $stmt->fetchAll();
            $formatted = array_map(function($r) {
                return [
                    'id'   => (string)$r['id'],
                    'name' => $r['name'],
                    'type' => $r['type'],
                    'logo' => $r['logo'] ?: 'images/logo.png'
                ];
            }, $rows);
            sendSuccess('قائمة الشركاء', $formatted);
        } else {
            sendSuccess('قائمة الشركاء', []);
        }
        break;
}
