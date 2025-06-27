import { useState, useEffect } from "react";
import { useLoaderData, useNavigate } from "@remix-run/react";
import { redirect } from "@remix-run/node";
import {
  Page,
  Layout,
  Card,
  Text,
  TextContainer,
  Button,
  Banner,
  Spinner,
  InlineStack,
} from "@shopify/polaris";
import { authenticate } from "../shopify.server";

export const loader = async ({ request }) => {
  const { admin, session } = await authenticate.admin(request);
  
  try {
    // Check if user has active billing
    const { hasActivePayment } = await admin.billing.check({
      plans: ["basic-monthly", "basic-yearly", "multi-monthly", "multi-yearly", "business-monthly", "business-yearly", "enterprise-monthly", "enterprise-yearly"],
      isTest: true,
    });

    if (!hasActivePayment) {
      return redirect("/dashboard");
    }
  } catch (error) {
    console.error("Billing check error:", error);
    // If billing check fails, redirect to dashboard
    return redirect("/dashboard");
  }

  return { 
    shop: session.shop,
    shopEmail: session.onlineAccessInfo?.associated_user?.email || "admin@example.com" // Fallback email
  };
};

export default function WordPressIntegration() {
  const { shop, shopEmail } = useLoaderData();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [wordpressUrl, setWordpressUrl] = useState(null);

  useEffect(() => {
    handleWordPressAuth();
  }, []);

  const handleWordPressAuth = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Single API call to check/create user and get JWT token
      const createUserResponse = await fetch('/api/wordpress/create-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: shopEmail,
          shop: shop,
          first_name: 'Shopify', // You can get this from session if available
          last_name: 'User',
        }),
      });

      if (!createUserResponse.ok) {
        throw new Error('Failed to create/check WordPress user');
      }

      const responseData = await createUserResponse.json();
      
      if (responseData.success) {
        setWordpressUrl(responseData.authUrl);
      } else {
        throw new Error(responseData.message || 'Failed to process user');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRetry = () => {
    handleWordPressAuth();
  };

  if (isLoading) {
    return (
      <Page title="Connecting to WordPress Dashboard" sectioned>
        <Layout>
          <Layout.Section>
            <Card>
              <div style={{ textAlign: 'center', padding: '2rem' }}>
                <Spinner size="large" />
                <TextContainer spacing="tight">
                  <Text variant="headingMd" as="h3">
                    Connecting to WordPress...
                  </Text>
                  <Text>
                    Setting up your SAP integration dashboard
                  </Text>
                </TextContainer>
              </div>
            </Card>
          </Layout.Section>
        </Layout>
      </Page>
    );
  }

  if (error) {
    return (
      <Page title="WordPress Integration" sectioned>
        <Layout>
          <Layout.Section>
            <Banner title="Connection Error" tone="critical">
              <p>Failed to connect to WordPress: {error}</p>
              <InlineStack gap="400">
                <Button onClick={handleRetry}>Retry</Button>
                <Button onClick={() => navigate('/welcome')}>Back to Welcome</Button>
              </InlineStack>
            </Banner>
          </Layout.Section>
        </Layout>
      </Page>
    );
  }

  return (
    <Page 
      title="SAP Integration Dashboard" 
      subtitle="Configure your SAP to Shopify connection"
      sectioned
    >
      <Layout>
        <Layout.Section>
          <Card>
            <div style={{ height: '80vh', width: '100%' }}>
              {wordpressUrl && (
                <iframe
                  src={wordpressUrl}
                  style={{
                    width: '100%',
                    height: '100%',
                    border: 'none',
                    borderRadius: '8px',
                  }}
                  title="WordPress SAP Integration Dashboard"
                  allow="fullscreen"
                />
              )}
            </div>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
} 