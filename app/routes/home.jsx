import { Frame, Page } from "@shopify/polaris";

export default function Home() {
  return (
    <Page title="SAP Business One Connector">
      <Frame>
        <iframe
          src="https://squidcommerce.com"  // Update URL
          style={{ width: "100%", height: "100vh", border: "none" }}
          title="Connector"
        />
      </Frame>
    </Page>
  );
}
