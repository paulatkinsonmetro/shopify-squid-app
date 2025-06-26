import { authenticate } from "../shopify.server";

export const action = async ({ request }) => {
  const { topic, shop, session, admin } = await authenticate.webhook(request);

  if (!session) {
    return new Response("Unauthorized", { status: 401 });
  }

  switch (topic) {
    case "APP_SUBSCRIPTIONS_UPDATE":
      // Handle subscription updates
      const payload = await request.json();
      console.log("Billing webhook received:", payload);
      
      // You can add logic here to:
      // - Update user status in your database
      // - Send welcome emails
      // - Update WordPress user permissions
      
      break;
      
    case "APP_SUBSCRIPTIONS_APP_UNINSTALLED":
      // Handle app uninstall
      console.log("App uninstalled for shop:", shop);
      
      // Clean up WordPress user access if needed
      // You might want to revoke WordPress access here
      
      break;
      
    default:
      console.log(`Unhandled webhook topic: ${topic}`);
  }

  return new Response("OK", { status: 200 });
}; 