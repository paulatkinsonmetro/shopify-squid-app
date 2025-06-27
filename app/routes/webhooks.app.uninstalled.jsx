import { authenticate } from "../shopify.server";

export const action = async ({ request }) => {
  const { shop, session, topic } = await authenticate.webhook(request);

  console.log(`Received ${topic} webhook for ${shop}`);

  // With MemorySessionStorage, sessions are stored in memory
  // The session will be automatically cleaned up when the app restarts
  // No manual database operations needed

  return new Response();
};
