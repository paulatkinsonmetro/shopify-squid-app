import { redirect } from "@remix-run/node";
import { authenticate } from "../shopify.server";

export const loader = async ({ request }) => {
  const url = new URL(request.url);
  const planId = url.searchParams.get("planId");

  if (!planId) {
    throw new Response("Missing planId", { status: 400 });
  }

  try {
    // Get session from request using authenticate.admin()
    const { admin, session } = await authenticate.admin(request);

    // Check billing status or request new billing URL
    const { hasActivePayment, confirmationUrl } = await admin.billing.check({
      plans: [planId],
      isTest: true,
    });

    if (hasActivePayment) {
      // User already has active billing, redirect to welcome page
      return redirect(`/welcome?shop=${session.shop}`);
    }

    return redirect(confirmationUrl);
  } catch (error) {
    console.error("Billing check error:", error);
    // If billing check fails, redirect to dashboard
    return redirect(`/dashboard?shop=${session?.shop || ''}`);
  }
};




//// file 2
// import { redirect } from "@remix-run/node";
// import prisma from "../db.server"; // ✅ This will work with Vite
// //import { prisma } from "~/db.server"; // Ensure this path matches your setup
// import shopify from "../shopify.server";

// export const loader = async ({ request }) => {
//   const url = new URL(request.url);
//   const planId = url.searchParams.get("planId");
//   const shop = url.searchParams.get("shop");

//   if (!planId || !shop) {
//     throw new Response("Missing planId or shop", { status: 400 });
//   }

//   // Retrieve offline session manually from the database
//   const session = await prisma.session.findUnique({
//     where: { id: `offline_${shop}` },
//   });

//   if (!session || !session.token) {
//     throw new Response("Session not found or missing token", { status: 401 });
//   }

//   const sessionObject = {
//     id: session.id,
//     shop: session.shop,
//     isOnline: false,
//     accessToken: session.token,
//     scope: session.scopes,
//   };

//   // Check billing status or request new billing URL
//   const { hasActivePayment, confirmationUrl } = await shopify.billing.check({
//     session: sessionObject,
//     plans: [planId],
//     isTest: true,
//   });

//   if (hasActivePayment) {
//     return redirect("/");
//   }

//   return redirect(confirmationUrl);
// };




//// file 1
// import { redirect } from "@remix-run/node";
// import shopify, { authenticate } from "../shopify.server";

// export const loader = async ({ request }) => {
//   const url = new URL(request.url);
//   const planId = url.searchParams.get("planId");

//   if (!planId) {
//     throw new Response("Missing planId", { status: 400 });
//   }

//   // Get session from request using authenticate.admin()
//   const session = await authenticate.admin(request);

//   // Check billing status or request new billing URL
//   const { hasActivePayment, confirmationUrl } = await shopify.billing.check({
//     session,
//     plans: [planId],
//     isTest: true,
//   });

//   if (hasActivePayment) {
//     return redirect("/"); // or dashboard
//   }

//   return redirect(confirmationUrl);
// };
