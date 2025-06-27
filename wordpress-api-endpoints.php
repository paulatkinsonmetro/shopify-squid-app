<?php
// WordPress API endpoints for Shopify app integration
// Add this to your WordPress theme's functions.php or as a separate plugin

// Register REST API routes
add_action('rest_api_init', function () {
    // Single endpoint that handles both check and create
    register_rest_route('shopify-connector/v1', '/create-user', array(
        'methods' => 'POST',
        'callback' => 'shopify_create_user',
        'permission_callback' => 'verify_shopify_request',
    ));

    // Get authentication token for existing user (optional)
    register_rest_route('shopify-connector/v1', '/get-token', array(
        'methods' => 'POST',
        'callback' => 'shopify_get_token',
        'permission_callback' => 'verify_shopify_request',
    ));
});

// Verify that the request is coming from Shopify
function verify_shopify_request($request) {
    // Get the raw request body
    $raw_body = file_get_contents('php://input');
    
    // Get Shopify signature from headers
    $shopify_signature = $request->get_header('X-Shopify-Signature');
    $shopify_hmac = $request->get_header('X-Shopify-Hmac-Sha256');
    
    // Get your Shopify app secret (define this in wp-config.php)
    $shopify_secret = defined('SHOPIFY_APP_SECRET') ? SHOPIFY_APP_SECRET : '';
    
    if (empty($shopify_secret)) {
        error_log('Shopify app secret not configured');
        return false;
    }
    
    // Verify Shopify signature
    if ($shopify_hmac) {
        $calculated_hmac = base64_encode(hash_hmac('sha256', $raw_body, $shopify_secret, true));
        if (!hash_equals($calculated_hmac, $shopify_hmac)) {
            error_log('Shopify HMAC verification failed');
            return false;
        }
    }
    
    // Additional security checks
    $origin = $request->get_header('Origin');
    $referer = $request->get_header('Referer');
    
    // Check if request is coming from your Shopify app domain
    $allowed_domains = array(
        'shopify-squid-app.vercel.app', // Your Vercel deployment
        'localhost:3000', // For development
        '127.0.0.1:3000'  // For development
    );
    
    $is_allowed_origin = false;
    foreach ($allowed_domains as $domain) {
        if (strpos($origin, $domain) !== false || strpos($referer, $domain) !== false) {
            $is_allowed_origin = true;
            break;
        }
    }
    
    if (!$is_allowed_origin) {
        error_log('Request from unauthorized origin: ' . $origin);
        return false;
    }
    
    // Rate limiting (optional)
    $client_ip = $_SERVER['REMOTE_ADDR'];
    $rate_limit_key = 'shopify_api_rate_limit_' . $client_ip;
    $rate_limit_count = get_transient($rate_limit_key);
    
    if ($rate_limit_count && $rate_limit_count > 10) { // Max 10 requests per minute
        error_log('Rate limit exceeded for IP: ' . $client_ip);
        return false;
    }
    
    // Update rate limit counter
    if ($rate_limit_count) {
        set_transient($rate_limit_key, $rate_limit_count + 1, 60);
    } else {
        set_transient($rate_limit_key, 1, 60);
    }
    
    return true;
}

// Single endpoint that checks if user exists, creates if not, and returns auth URL
function shopify_create_user(WP_REST_Request $request) {
    $params = $request->get_params();
    
    error_log('Create user called with: ' . print_r($params, true));

    if (!isset($params['email'])) {
        return new WP_REST_Response(['success' => false, 'message' => 'Email is required'], 400);
    }

    $email = sanitize_email($params['email']);
    $first_name = isset($params['first_name']) ? sanitize_text_field($params['first_name']) : '';
    $last_name = isset($params['last_name']) ? sanitize_text_field($params['last_name']) : '';
    $shop = isset($params['shop']) ? sanitize_text_field($params['shop']) : '';

    // Additional validation
    if (!is_email($email)) {
        return new WP_REST_Response(['success' => false, 'message' => 'Invalid email format'], 400);
    }

    if (!empty($shop) && !filter_var($shop, FILTER_VALIDATE_DOMAIN)) {
        return new WP_REST_Response(['success' => false, 'message' => 'Invalid shop domain'], 400);
    }

    // Check if user already exists
    $user = get_user_by('email', $email);

    if ($user) {
        // User exists, update shop info and return auth URL
        if ($shop) {
            update_user_meta($user->ID, 'shopify_store_url', $shop);
        }

        // Generate a simple auth token (you can customize this)
        $auth_token = generate_simple_auth_token($user->ID);

        return new WP_REST_Response([
            'success' => true,
            'userExists' => true,
            'userId' => $user->ID,
            'email' => $email,
            'authUrl' => get_site_url() . "/?auth_token=" . $auth_token,
            'message' => 'User already exists'
        ], 200);
    }

    // Create the user
    $user_id = wp_insert_user(array(
        'user_email' => $email,
        'first_name' => $first_name,
        'last_name' => $last_name,
        'user_login' => $email, // Use email as username
        'user_pass' => wp_generate_password(), // Generate a random password
        'role' => 'subscriber', // Or another appropriate role
    ));

    if (is_wp_error($user_id)) {
        return new WP_REST_Response([
            'success' => false, 
            'message' => $user_id->get_error_message()
        ], 500);
    }

    // Store shopify_store_url in wp_usermeta
    if ($shop) {
        add_user_meta($user_id, 'shopify_store_url', $shop, true);
    }

    // Generate auth token for the new user
    $auth_token = generate_simple_auth_token($user_id);

    return new WP_REST_Response([
        'success' => true,
        'userExists' => false,
        'userId' => $user_id,
        'email' => $email,
        'authUrl' => get_site_url() . "/?auth_token=" . $auth_token,
        'message' => 'User created successfully'
    ], 201);
}

// Get authentication token for existing user (optional endpoint)
function shopify_get_token(WP_REST_Request $request) {
    $params = $request->get_params();
    
    if (!isset($params['email'])) {
        return new WP_REST_Response(['success' => false, 'message' => 'Email is required'], 400);
    }

    $email = sanitize_email($params['email']);
    
    // Check if user exists
    $user = get_user_by('email', $email);
    
    if (!$user) {
        return new WP_REST_Response([
            'success' => false,
            'message' => 'User not found'
        ], 404);
    }

    // Generate auth token
    $auth_token = generate_simple_auth_token($user->ID);

    return new WP_REST_Response([
        'success' => true,
        'userId' => $user->ID,
        'email' => $email,
        'authUrl' => get_site_url() . "/?auth_token=" . $auth_token,
        'message' => 'Token generated successfully'
    ], 200);
}

// Generate a simple auth token (no Firebase required)
function generate_simple_auth_token($user_id) {
    $user = get_user_by('id', $user_id);
    
    if (!$user) {
        return false;
    }

    // Create a simple token with user info and expiration
    $token_data = array(
        'user_id' => $user_id,
        'email' => $user->user_email,
        'expires' => time() + (60 * 60 * 24), // 24 hours
        'nonce' => wp_create_nonce('shopify_auth_' . $user_id)
    );

    // Encode as base64 (simple but functional)
    $token = base64_encode(json_encode($token_data));
    
    // Store token in user meta for validation
    update_user_meta($user_id, 'shopify_auth_token', $token);
    update_user_meta($user_id, 'shopify_auth_expires', $token_data['expires']);

    return $token;
}

// Handle auth token authentication
add_action('init', 'handle_auth_token_authentication');

function handle_auth_token_authentication() {
    if (isset($_GET['auth_token'])) {
        $token = sanitize_text_field($_GET['auth_token']);
        
        try {
            // Decode the token
            $token_data = json_decode(base64_decode($token), true);
            
            if (!$token_data || !isset($token_data['user_id']) || !isset($token_data['expires'])) {
                error_log('Invalid token format: ' . $token);
                wp_die('Invalid authentication token');
            }

            // Check if token is expired
            if (time() > $token_data['expires']) {
                error_log('Token expired for user: ' . $token_data['user_id']);
                wp_die('Authentication token has expired');
            }

            // Verify the token matches what's stored
            $stored_token = get_user_meta($token_data['user_id'], 'shopify_auth_token', true);
            if ($token !== $stored_token) {
                error_log('Token mismatch for user: ' . $token_data['user_id']);
                wp_die('Invalid authentication token');
            }

            // Log in the user
            $user = get_user_by('id', $token_data['user_id']);
            if ($user) {
                wp_set_current_user($user->ID);
                wp_set_auth_cookie($user->ID);
                
                // Remove token from URL and redirect safely
                $current_url = $_SERVER['REQUEST_URI'];
                $clean_url = remove_query_arg('auth_token', $current_url);
                
                // If we're on the home page, redirect to dashboard
                if ($clean_url === '/' || $clean_url === '') {
                    $clean_url = home_url('/dashboard/');
                }
                
                // Ensure we have a valid URL
                if (!filter_var($clean_url, FILTER_VALIDATE_URL)) {
                    $clean_url = home_url('/dashboard/');
                }
                
                // Use wp_safe_redirect instead of wp_redirect
                wp_safe_redirect($clean_url);
                exit;
            } else {
                error_log('User not found for token: ' . $token_data['user_id']);
                wp_die('User not found');
            }
        } catch (Exception $e) {
            // Token is invalid or expired
            error_log('Auth token authentication failed: ' . $e->getMessage());
            wp_die('Authentication failed: ' . $e->getMessage());
        }
    }
}

// Include Shopify API endpoints
require_once get_stylesheet_directory() . '/shopify-api-endpoints.php';
?> 