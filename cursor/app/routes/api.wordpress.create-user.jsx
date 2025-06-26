import { json } from "@remix-run/node";
import { authenticate } from "../shopify.server";
import crypto from "crypto";

export const action = async ({ request }) => {
  const { session } = await authenticate.admin(request);

  if (request.method !== "POST") {
    return json({ error: "Method not allowed" }, { status: 405 });
  }

  try {
    const { email, shop, first_name, last_name } = await request.json();

    if (!email || !shop) {
      return json({ error: "Email and shop are required" }, { status: 400 });
    }

    // WordPress API configuration
    const WORDPRESS_API_URL = process.env.WORDPRESS_API_URL || "https://squidcommerce.com/wp-json/shopify-connector/v1";
    const SHOPIFY_APP_SECRET = process.env.SHOPIFY_API_SECRET;

    // Prepare request body
    const requestBody = JSON.stringify({
      email: email,
      shop: shop,
      first_name: first_name || '',
      last_name: last_name || '',
    });

    // Generate Shopify HMAC signature
    const hmac = crypto
      .createHmac('sha256', SHOPIFY_APP_SECRET)
      .update(requestBody, 'utf8')
      .digest('base64');

    // Single API call to check/create user and get JWT token
    const createUserResponse = await fetch(`${WORDPRESS_API_URL}/create-user`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Hmac-Sha256': hmac,
        'X-Shopify-Shop-Domain': shop,
        'User-Agent': 'Shopify-App/1.0',
        'bypass-tunnel-reminder': 'true',
      },
      body: requestBody,
    });

    if (!createUserResponse.ok) {
      const errorText = await createUserResponse.text();
      throw new Error(`WordPress API error: ${createUserResponse.status} - ${errorText}`);
    }

    const responseData = await createUserResponse.json();

    if (responseData.success) {
      // User created or already exists, return the auth URL with JWT token
      return json({
        success: true,
        authUrl: responseData.authUrl,
        userId: responseData.userId,
        userExists: responseData.userExists,
        message: responseData.message
      });
    } else {
      throw new Error(responseData.message || 'WordPress API returned error');
    }

  } catch (error) {
    console.error('WordPress create user error:', error);
    return json({ 
      error: "Failed to create WordPress user",
      details: error.message 
    }, { status: 500 });
  }
}; 
