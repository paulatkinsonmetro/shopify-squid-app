import { redirect } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import {
  Page,
  Layout,
  Card,
  Text,
  TextContainer,
  Button,
  InlineStack,
  Icon,
  Banner,
} from "@shopify/polaris";
import { authenticate } from "../shopify.server";

export const loader = async ({ request }) => {
  const { admin, session } = await authenticate.admin(request);
  
  // Check if user has active billing
  const { hasActivePayment } = await admin.billing.check({
    plans: ["basic-monthly", "basic-yearly", "multi-monthly", "multi-yearly", "business-monthly", "business-yearly", "enterprise-monthly", "enterprise-yearly"],
    isTest: true,
  });

  if (!hasActivePayment) {
    return redirect("/dashboard");
  }

  return { shop: session.shop };
};

export default function Welcome() {
  const { shop } = useLoaderData();

  const handleAccessWordPress = () => {
    // Navigate to WordPress integration page
    window.location.href = `/wordpress-integration?shop=${shop}`;
  };

  return (
    <Page title="Welcome to Squid Commerce Connector!" sectioned>
      <Layout>
        <Layout.Section>
          <Banner
            title="Setup Complete!"
            tone="success"
          >
            <p>Your billing has been successfully set up. You're now ready to configure your SAP to Shopify integration.</p>
          </Banner>
        </Layout.Section>

        <Layout.Section>
          <Card>
            <TextContainer spacing="tight">
              <Text variant="headingLg" as="h2">
                What's Next?
              </Text>
              <Text>
                Your Shopify store <strong>{shop}</strong> is now connected and ready for SAP integration.
              </Text>
            </TextContainer>
          </Card>
        </Layout.Section>

        <Layout.Section>
          <Card title="Setup Instructions" sectioned>
            <TextContainer spacing="tight">
              <Text variant="headingMd" as="h3">
                Step 1: Access Your WordPress Dashboard
              </Text>
              <Text>
                Click the button below to access your WordPress-based configuration panel where you can:
              </Text>
              <ul>
                <li>Configure your SAP connection settings</li>
                <li>Set up order synchronization rules</li>
                <li>Manage your integration preferences</li>
                <li>View sync history and logs</li>
              </ul>
              
              <InlineStack align="start" gap="400">
                <Button
                  primary
                  onClick={handleAccessWordPress}
                >
                  Access WordPress Dashboard
                </Button>
              </InlineStack>
            </TextContainer>
          </Card>
        </Layout.Section>

        <Layout.Section>
          <Card title="Need Help?" sectioned>
            <TextContainer spacing="tight">
              <Text>
                If you need assistance with setup or have questions about the integration:
              </Text>
              <ul>
                <li>Check our <a href="#" target="_blank" rel="noopener noreferrer">documentation</a></li>
                <li>Contact support at <a href="mailto:support@example.com">support@example.com</a></li>
                <li>Join our <a href="#" target="_blank" rel="noopener noreferrer">community forum</a></li>
              </ul>
            </TextContainer>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
} 
