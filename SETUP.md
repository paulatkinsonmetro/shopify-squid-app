# Squid Commerce Connector - Setup Guide

## Overview
This Shopify app handles billing for a SAP to Shopify integration service. The actual integration configuration is managed through a WordPress site that users access after completing billing.

## App Flow
1. User installs app from Shopify App Store
2. User is directed to plan selection dashboard
3. User selects a plan and completes Shopify managed billing
4. User is redirected to welcome page with setup instructions
5. User can access WordPress dashboard for SAP integration configuration

## Environment Variables Required

Create a `.env` file in your project root with the following variables:

```env
# Shopify App Configuration
SHOPIFY_API_KEY=your_shopify_api_key
SHOPIFY_API_SECRET=your_shopify_api_secret
SHOPIFY_APP_URL=https://your-app-domain.com
SHOPIFY_APP_NAME=Your App Name

# Database Configuration (if using Prisma)
DATABASE_URL="postgresql://username:password@localhost:5432/database_name"

# WordPress Integration Configuration
WORDPRESS_API_URL=https://squidcommerce.com/wp-json/shopify-connector/v1
WORDPRESS_SITE_URL=https://squidcommerce.com

# Development Configuration
NODE_ENV=development
SHOPIFY_APP_DEV_STORE=your-dev-store.myshopify.com
```

## WordPress Setup Requirements

### 1. WordPress Site Configuration
- WordPress site with REST API enabled
- JWT library installed (Firebase JWT)
- Custom API endpoints for Shopify integration
- JWT secret key configured

### 2. WordPress Files Required

#### A. Add to your WordPress theme's functions.php or as a plugin:

```php
<?php
// WordPress API endpoints for Shopify app integration
// Add this to your WordPress theme's functions.php or as a separate plugin

use Firebase\JWT\JWT;
use Firebase\JWT\Key;

// Include JWT library (adjust path as needed)
if (!file_exists(get_theme_file_path('/includes/src/JWT.php'))) {
    error_log('JWT.php not found at: ' . get_theme_file_path('/includes/src/JWT.php'));
}

require_once get_theme_file_path('includes/src/JWTExceptionWithPayloadInterface.php'); 
require_once get_theme_file_path('includes/src/ExpiredException.php');
require_once get_theme_file_path('includes/src/SignatureInvalidException.php');
require_once get_theme_file_path('includes/src/BeforeValidException.php');
require_once get_theme_file_path('includes/src/JWT.php');
require_once get_theme_file_path('includes/src/Key.php');

// Register REST API routes
add_action('rest_api_init', function () {
    // Check if user exists
    register_rest_route('shopify-connector/v1', '/check-user', array(
        'methods' => 'POST',
        'callback' => 'shopify_check_user',
        'permission_callback' => '__return_true',
    ));

    // Create new user
    register_rest_route('shopify-connector/v1', '/create-user', array(
        'methods' => 'POST',
        'callback' => 'shopify_create_user',
        'permission_callback' => '__return_true',
    ));

    // Get authentication token
    register_rest_route('shopify-connector/v1', '/get-token', array(
        'methods' => 'POST',
        'callback' => 'shopify_get_token',
        'permission_callback' => '__return_true',
    ));
});

// Check if user exists by email
function shopify_check_user(WP_REST_Request $request) {
    $params = $request->get_params();
    
    if (!isset($params['email'])) {
        return new WP_REST_Response(['success' => false, 'message' => 'Email is required'], 400);
    }

    $email = sanitize_email($params['email']);
    $shop = isset($params['shop']) ? sanitize_text_field($params['shop']) : '';

    // Check if user exists
    $user = get_user_by('email', $email);
    
    if ($user) {
        // User exists, generate JWT token
        $jwt_token = generate_jwt_token($user->ID);
        
        // Update shop information if provided
        if ($shop) {
            update_user_meta($user->ID, 'shopify_store_url', $shop);
        }

        return new WP_REST_Response([
            'success' => true,
            'userExists' => true,
            'userId' => $user->ID,
            'email' => $email,
            'authUrl' => get_site_url() . "/?token=" . $jwt_token,
            'message' => 'User found'
        ], 200);
    } else {
        return new WP_REST_Response([
            'success' => true,
            'userExists' => false,
            'message' => 'User not found'
        ], 200);
    }
}

// Create new user
function shopify_create_user(WP_REST_Request $request) {
    $params = $request->get_params();
    
    if (!isset($params['email'])) {
        return new WP_REST_Response(['success' => false, 'message' => 'Email is required'], 400);
    }

    $email = sanitize_email($params['email']);
    $shop = isset($params['shop']) ? sanitize_text_field($params['shop']) : '';
    $first_name = isset($params['first_name']) ? sanitize_text_field($params['first_name']) : '';
    $last_name = isset($params['last_name']) ? sanitize_text_field($params['last_name']) : '';

    // Check if user already exists
    $existing_user = get_user_by('email', $email);
    if ($existing_user) {
        // User already exists, return existing user info
        $jwt_token = generate_jwt_token($existing_user->ID);
        
        if ($shop) {
            update_user_meta($existing_user->ID, 'shopify_store_url', $shop);
        }

        return new WP_REST_Response([
            'success' => true,
            'userExists' => true,
            'userId' => $existing_user->ID,
            'email' => $email,
            'authUrl' => get_site_url() . "/?token=" . $jwt_token,
            'message' => 'User already exists'
        ], 200);
    }

    // Create new user
    $username = $email; // Use email as username
    $password = wp_generate_password(12, false); // Generate secure password
    
    $user_id = wp_create_user($username, $password, $email);
    
    if (is_wp_error($user_id)) {
        return new WP_REST_Response([
            'success' => false,
            'message' => $user_id->get_error_message()
        ], 500);
    }

    // Set user role
    $user = new WP_User($user_id);
    $user->set_role('subscriber'); // or 'shopify_user' if you have custom role

    // Update user meta
    if ($first_name) {
        update_user_meta($user_id, 'first_name', $first_name);
    }
    if ($last_name) {
        update_user_meta($user_id, 'last_name', $last_name);
    }
    if ($shop) {
        update_user_meta($user_id, 'shopify_store_url', $shop);
    }

    // Generate JWT token
    $jwt_token = generate_jwt_token($user_id);

    return new WP_REST_Response([
        'success' => true,
        'userExists' => false,
        'userId' => $user_id,
        'email' => $email,
        'authUrl' => get_site_url() . "/?token=" . $jwt_token,
        'message' => 'User created successfully'
    ], 200);
}

// Get authentication token for existing user
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

    // Generate JWT token
    $jwt_token = generate_jwt_token($user->ID);

    return new WP_REST_Response([
        'success' => true,
        'userId' => $user->ID,
        'email' => $email,
        'authUrl' => get_site_url() . "/?token=" . $jwt_token,
        'message' => 'Token generated successfully'
    ], 200);
}

// Generate JWT token
function generate_jwt_token($user_id) {
    $user = get_user_by('id', $user_id);
    
    if (!$user) {
        return false;
    }

    $issued_at = time();
    $expiration = $issued_at + (60 * 60 * 24); // 24 hours

    $payload = array(
        'iss' => get_site_url(),
        'iat' => $issued_at,
        'exp' => $expiration,
        'user_id' => $user_id,
        'email' => $user->user_email,
        'username' => $user->user_login
    );

    // Use your JWT secret key (define this in wp-config.php)
    $jwt_secret = defined('JWT_SECRET_KEY') ? JWT_SECRET_KEY : 'your-secret-key-here';
    
    return JWT::encode($payload, $jwt_secret, 'HS256');
}

// Handle JWT token authentication
add_action('init', 'handle_jwt_authentication');

function handle_jwt_authentication() {
    if (isset($_GET['token'])) {
        $token = sanitize_text_field($_GET['token']);
        
        try {
            $jwt_secret = defined('JWT_SECRET_KEY') ? JWT_SECRET_KEY : 'your-secret-key-here';
            $decoded = JWT::decode($token, new Key($jwt_secret, 'HS256'));
            
            // Log in the user
            $user = get_user_by('id', $decoded->user_id);
            if ($user) {
                wp_set_current_user($user->ID);
                wp_set_auth_cookie($user->ID);
                
                // Redirect to dashboard or remove token from URL
                $redirect_url = remove_query_arg('token', $_SERVER['REQUEST_URI']);
                if ($redirect_url === $_SERVER['REQUEST_URI']) {
                    $redirect_url = home_url('/dashboard/');
                }
                
                wp_redirect($redirect_url);
                exit;
            }
        } catch (Exception $e) {
            // Token is invalid or expired
            error_log('JWT authentication failed: ' . $e->getMessage());
        }
    }
}
?>
```

#### B. Add to wp-config.php:

```php
// JWT Secret Key for Shopify integration
define('JWT_SECRET_KEY', 'your-super-secret-jwt-key-here');
```

#### C. Install JWT Library:

Download the Firebase JWT library and place it in your theme's includes/src/ directory:
- JWT.php
- Key.php
- JWTExceptionWithPayloadInterface.php
- ExpiredException.php
- SignatureInvalidException.php
- BeforeValidException.php

## Shopify Partner Dashboard Setup

### 1. Create Subscription Plans
In your Shopify Partner Dashboard:
1. Go to your app settings
2. Navigate to "Billing" section
3. Create the following plans:
   - `basic-monthly` - Basic Plan Monthly
   - `basic-yearly` - Basic Plan Yearly
   - `multi-monthly` - Multi Plan Monthly
   - `multi-yearly` - Multi Plan Yearly
   - `business-monthly` - Business Plan Monthly
   - `business-yearly` - Business Plan Yearly
   - `enterprise-monthly` - Enterprise Plan Monthly
   - `enterprise-yearly` - Enterprise Plan Yearly

### 2. Configure Webhooks
Ensure these webhooks are configured:
- `app_subscriptions/update` - For billing updates
- `app/uninstalled` - For app uninstall cleanup

## Development Setup

1. Install dependencies:
```bash
npm install
```

2. Set up database:
```bash
npx prisma generate
npx prisma migrate dev
```

3. Start development server:
```bash
npm run dev
```

## Testing the Flow

1. Install the app on a development store
2. Navigate to the dashboard to select a plan
3. Complete the billing process (use test mode)
4. Verify redirect to welcome page
5. Test WordPress integration access

## API Endpoints

The WordPress site will have these REST API endpoints:

- `POST /wp-json/shopify-connector/v1/check-user` - Check if user exists
- `POST /wp-json/shopify-connector/v1/create-user` - Create new user
- `POST /wp-json/shopify-connector/v1/get-token` - Get authentication token

## Security Considerations

1. **JWT Authentication**: Secure token-based authentication
2. **API Security**: Input sanitization and validation
3. **Data Protection**: Secure user data handling
4. **Session Management**: Proper WordPress session management

## Troubleshooting

### Common Issues:
1. **JWT Library**: Ensure Firebase JWT library is properly installed
2. **API Endpoints**: Verify REST API routes are registered
3. **Token Authentication**: Check JWT secret key configuration
4. **Iframe Loading**: Ensure WordPress site allows iframe embedding

### Debug Steps:
1. Check WordPress error logs for API issues
2. Verify JWT token generation and validation
3. Test API endpoints directly with Postman/curl
4. Check browser console for iframe loading errors 