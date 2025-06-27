import { authenticate } from "../shopify.server";

export const action = async ({ request }) => {
  const { payload, session, topic, shop } = await authenticate.webhook(request);

  console.log(`Received ${topic} webhook for ${shop}`);
  const current = payload.current;

  // With MemorySessionStorage, sessions are stored in memory
  // The session scope will be automatically updated by the Shopify SDK
  // No manual database operations needed

  return new Response();
};
