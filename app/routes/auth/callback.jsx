import { redirect } from "@remix-run/node";
import shopify from "../../shopify.server";

export const loader = async ({ request }) => {
  try {
    // Validate Shopify's OAuth callback and save session
    const session = await shopify.auth.validateAuthCallback(request);

    // After successful authentication, redirect to dashboard with shop query param
    return redirect(`/dashboard?shop=${session.shop}`);
  } catch (error) {
    console.error("Failed to validate auth callback:", error);
    // Redirect to login on failure, or you can serve a custom error page
    return redirect("/auth.login");
  }
};
