<?php
// =========================================================
// Elevate Backend — Categories API Endpoint
// =========================================================

require_once __DIR__ . '/../config/security.php';
require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../helpers/response.php';
require_once __DIR__ . '/../helpers/auth.php';

$pdo = getDBConnection();
$action = $_GET['action'] ?? $_POST['action'] ?? '';
$data = getRequestData();

switch ($action) {

    case 'update_status':
        $user = requireRole(['super_admin', 'admin']);
        $slug = trim($data['slug'] ?? $data['category'] ?? '');
        $status = trim($data['status'] ?? 'visible'); // visible, soon, hidden

        if (empty($slug)) sendError('رمز التصنيف مطلوب');

        if ($pdo) {
            $stmt = $pdo->prepare("UPDATE categories SET status = :st WHERE slug = :s");
            $stmt->execute(['st' => $status, 's' => $slug]);
        }
        sendSuccess('تم تحديث حالة القسم بنجاح!', ['slug' => $slug, 'status' => $status]);
        break;

    default:
        if ($pdo) {
            $stmt = $pdo->query("SELECT c.*, COUNT(o.id) as opp_count FROM categories c LEFT JOIN opportunities o ON c.slug = o.category_slug GROUP BY c.id ORDER BY c.display_order ASC");
            $categories = $stmt->fetchAll();
            sendSuccess('تجميعة التصنيفات', $categories);
        } else {
            sendSuccess('تجميعة التصنيفات', []);
        }
        break;
}
