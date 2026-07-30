<?php
// =========================================================
// Elevate Backend — Auth & RBAC Middleware
// =========================================================

require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/response.php';

function generateAuthToken($userId) {
    return bin2hex(random_bytes(32)) . '.' . base64_encode((string)$userId) . '.' . time();
}

function getAuthUser() {
    $headers = getallheaders();
    $token = $headers['X-Auth-Token'] ?? $headers['x-auth-token'] ?? $_SERVER['HTTP_X_AUTH_TOKEN'] ?? null;
    $username = $headers['X-Auth-User'] ?? $headers['x-auth-user'] ?? $_SERVER['HTTP_X_AUTH_USER'] ?? null;

    if (!$token) {
        return null;
    }

    $pdo = getDBConnection();
    if (!$pdo) {
        // Fallback for offline DB simulation
        if ($username) {
            return [
                'id' => 1,
                'username' => $username,
                'role' => ($username === 'admin' ? 'super_admin' : 'user'),
                'full_name' => $username
            ];
        }
        return null;
    }

    try {
        $stmt = $pdo->prepare("SELECT id, username, email, full_name, avatar, role, is_email_verified FROM users WHERE username = :u LIMIT 1");
        $stmt->execute(['u' => $username]);
        $user = $stmt->fetch();
        if ($user) {
            return $user;
        }
    } catch (Exception $e) {}

    return null;
}

function requireAuth() {
    $user = getAuthUser();
    if (!$user) {
        sendError('يرجى تسجيل الدخول للوصول لهذه الخدمة', 401);
    }
    return $user;
}

function requireRole($allowedRoles = ['super_admin', 'admin']) {
    $user = requireAuth();
    if (!in_array($user['role'], $allowedRoles)) {
        sendError('ليس لديك الصلاحيات الكافية للقيام بهذا الإجراء', 403);
    }
    return $user;
}
