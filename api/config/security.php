<?php
// =========================================================
// Elevate Backend — Security & CORS Configuration
// =========================================================

// Set headers for CORS, JSON response, and security
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Max-Age: 3600");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With, X-Auth-Token, X-Auth-User");

// Security Headers
header("X-Content-Type-Options: nosniff");
header("X-Frame-Options: SAMEORIGIN");
header("X-XSS-Protection: 1; mode=block");

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

/**
 * XSS Sanitization function
 */
function sanitizeInput($data) {
    if (is_array($data)) {
        foreach ($data as $key => $val) {
            $data[$key] = sanitizeInput($val);
        }
        return $data;
    }
    return htmlspecialchars(trim($data), ENT_QUOTES, 'UTF-8');
}

/**
 * Get request JSON body
 */
function getRequestData() {
    $input = file_get_contents('php://input');
    $data = json_decode($input, true);
    if (json_last_error() === JSON_ERROR_NONE && is_array($data)) {
        return sanitizeInput($data);
    }
    return sanitizeInput($_POST);
}
