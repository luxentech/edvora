<?php
// =========================================================
// Elevate Backend — Opportunities API Endpoint
// =========================================================

require_once __DIR__ . '/../config/security.php';
require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../helpers/response.php';
require_once __DIR__ . '/../helpers/auth.php';

$pdo = getDBConnection();
$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? $_POST['action'] ?? '';
$data = getRequestData();

// Helper mapper for consistent output
function formatOpportunity($row) {
    return [
        'id'             => (string)$row['id'],
        'type'           => $row['category_slug'],
        'category'       => $row['company_or_org'],
        'name'           => $row['title_ar'],
        'title_en'       => $row['title_en'] ?? '',
        'imgInner'       => $row['img_inner'] ?? '',
        'imgOuter'       => $row['img_outer'] ?? '',
        'isFeatured'     => (bool)$row['is_featured'],
        'tags'           => $row['tags'] ?? '',
        'deadline'       => $row['deadline'] ?? '',
        'description'    => $row['description'] ?? '',
        'country'        => $row['country'] ?? 'العالم / أونلاين',
        'field'          => $row['field'] ?? 'عام',
        'specialization' => $row['specialization'] ?? 'الكل',
        'fundingType'    => $row['funding_type'] ?? 'funded',
        'attendanceType' => $row['attendance_type'] ?? 'online',
        'status'         => $row['status'] ?? 'visible',
        'viewsCount'     => (int)($row['views_count'] ?? 0),
        'created_at'     => $row['created_at'] ?? date('Y-m-d H:i:s')
    ];
}

switch ($action) {

    case 'autocomplete':
        $q = trim($_GET['q'] ?? '');
        if (strlen($q) < 2) {
            sendSuccess('نتائج البحث الفوري', []);
        }

        if ($pdo) {
            $stmt = $pdo->prepare("SELECT id, title_ar, company_or_org, category_slug FROM opportunities WHERE (title_ar LIKE :q OR tags LIKE :q OR company_or_org LIKE :q) AND status = 'visible' LIMIT 8");
            $stmt->execute(['q' => "%$q%"]);
            $results = $stmt->fetchAll();
            sendSuccess('نتائج التكميل التلقائي', $results);
        }
        sendSuccess('نتائج التكميل التلقائي', []);
        break;

    case 'save':
    case 'create':
    case 'update':
        $user = requireRole(['super_admin', 'admin', 'moderator']);
        $oppId = $data['id'] ?? null;
        $cat = trim($data['type'] ?? $data['category_slug'] ?? 'competitions');
        $company = trim($data['category'] ?? $data['company_or_org'] ?? '');
        $title = trim($data['name'] ?? $data['title_ar'] ?? '');
        $imgInner = trim($data['imgInner'] ?? $data['img_inner'] ?? '');
        $imgOuter = trim($data['imgOuter'] ?? $data['img_outer'] ?? '');
        $isFeatured = !empty($data['isFeatured']) ? 1 : 0;
        $tags = trim($data['tags'] ?? '');
        $deadline = !empty($data['deadline']) ? $data['deadline'] : null;
        $desc = trim($data['description'] ?? '');
        $status = trim($data['status'] ?? 'visible');

        if (empty($title) || empty($cat)) {
            sendError('عنوان الفرصة والتصنيف مطلوبة');
        }

        if ($pdo) {
            if ($oppId) {
                $stmt = $pdo->prepare("UPDATE opportunities SET category_slug = :c, company_or_org = :comp, title_ar = :t, img_inner = :ii, img_outer = :io, is_featured = :f, tags = :tags, deadline = :d, description = :desc, status = :st WHERE id = :id");
                $stmt->execute([
                    'c' => $cat, 'comp' => $company, 't' => $title, 'ii' => $imgInner, 'io' => $imgOuter,
                    'f' => $isFeatured, 'tags' => $tags, 'd' => $deadline, 'desc' => $desc, 'st' => $status,
                    'id' => $oppId
                ]);
            } else {
                $stmt = $pdo->prepare("INSERT INTO opportunities (category_slug, company_or_org, title_ar, img_inner, img_outer, is_featured, tags, deadline, description, status, created_by) VALUES (:c, :comp, :t, :ii, :io, :f, :tags, :d, :desc, :st, :uid)");
                $stmt->execute([
                    'c' => $cat, 'comp' => $company, 't' => $title, 'ii' => $imgInner, 'io' => $imgOuter,
                    'f' => $isFeatured, 'tags' => $tags, 'd' => $deadline, 'desc' => $desc, 'st' => $status,
                    'uid' => $user['id']
                ]);
                $oppId = $pdo->lastInsertId();
            }
        }
        sendSuccess('تم حفظ بيانات الفرصة بنجاح!', ['id' => $oppId]);
        break;

    case 'delete':
        $user = requireRole(['super_admin', 'admin']);
        $oppId = $_GET['id'] ?? $data['id'] ?? null;
        if (!$oppId) sendError('معرف الفرصة مطلوب');

        if ($pdo) {
            $stmt = $pdo->prepare("DELETE FROM opportunities WHERE id = :id");
            $stmt->execute(['id' => $oppId]);
        }
        sendSuccess('تم حذف الفرصة بنجاح');
        break;

    case 'toggle_save':
        $user = requireAuth();
        $oppId = $data['opportunity_id'] ?? $data['id'] ?? null;
        if (!$oppId) sendError('معرف الفرصة مطلوب');

        if ($pdo) {
            $stmt = $pdo->prepare("SELECT id FROM saved_opportunities WHERE user_id = :u AND opportunity_id = :o");
            $stmt->execute(['u' => $user['id'], 'o' => $oppId]);
            if ($stmt->fetch()) {
                $del = $pdo->prepare("DELETE FROM saved_opportunities WHERE user_id = :u AND opportunity_id = :o");
                $del->execute(['u' => $user['id'], 'o' => $oppId]);
                sendSuccess('تم إزالة الفرصة من المفضلة', ['saved' => false]);
            } else {
                $ins = $pdo->prepare("INSERT INTO saved_opportunities (user_id, opportunity_id) VALUES (:u, :o)");
                $ins->execute(['u' => $user['id'], 'o' => $oppId]);
                sendSuccess('تم إضافة الفرصة إلى المفضلة بنجاح!', ['saved' => true]);
            }
        }
        sendSuccess('تم تحديث المفضلة', ['saved' => true]);
        break;

    case 'detail':
        $id = $_GET['id'] ?? null;
        if (!$id) sendError('المعرف غير موجود');

        if ($pdo) {
            // Increment views
            $up = $pdo->prepare("UPDATE opportunities SET views_count = views_count + 1 WHERE id = :id");
            $up->execute(['id' => $id]);

            $stmt = $pdo->prepare("SELECT * FROM opportunities WHERE id = :id LIMIT 1");
            $stmt->execute(['id' => $id]);
            $row = $stmt->fetch();
            if ($row) {
                sendSuccess('تفاصيل الفرصة', formatOpportunity($row));
            }
        }
        sendError('الفرصة غير موجودة', 404);
        break;

    default:
        // List opportunities with filters
        $cat          = $_GET['category'] ?? '';
        $q            = trim($_GET['q'] ?? '');
        $country      = $_GET['country'] ?? '';
        $field        = $_GET['field'] ?? '';
        $fundingType  = $_GET['funding_type'] ?? '';
        $attendance   = $_GET['attendance_type'] ?? '';
        $featuredOnly = !empty($_GET['featured']);

        if ($pdo) {
            $sql = "SELECT * FROM opportunities WHERE 1=1";
            $params = [];

            if (!empty($cat)) {
                $sql .= " AND category_slug = :cat";
                $params['cat'] = $cat;
            }
            if (!empty($q)) {
                $sql .= " AND (title_ar LIKE :q OR tags LIKE :q OR company_or_org LIKE :q OR description LIKE :q)";
                $params['q'] = "%$q%";
            }
            if (!empty($country)) {
                $sql .= " AND country = :country";
                $params['country'] = $country;
            }
            if (!empty($field)) {
                $sql .= " AND field = :field";
                $params['field'] = $field;
            }
            if (!empty($fundingType)) {
                $sql .= " AND funding_type = :funding";
                $params['funding'] = $fundingType;
            }
            if (!empty($attendance)) {
                $sql .= " AND attendance_type = :attendance";
                $params['attendance'] = $attendance;
            }
            if ($featuredOnly) {
                $sql .= " AND is_featured = 1";
            }

            $sql .= " ORDER BY is_featured DESC, id DESC";

            $stmt = $pdo->prepare($sql);
            $stmt->execute($params);
            $rows = $stmt->fetchAll();

            $formatted = array_map('formatOpportunity', $rows);
            sendSuccess('قائمة الفرص', $formatted);
        } else {
            sendSuccess('قائمة الفرص المتاحة', []);
        }
        break;
}
