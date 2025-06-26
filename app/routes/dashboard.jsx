import { useState } from "react";
import { redirect } from "@remix-run/node";
import shopify from "../shopify.server"; // fixed import: default export, not { shopifyApp }
import {
  Page,
  Layout,
  Card,
  Text,
  TextContainer,
  InlineStack,
  Button,
  Badge,
  ButtonGroup,
} from "@shopify/polaris";

// Manual session retrieval
export const loader = async ({ request }) => {
  const sessionStorage = shopify.sessionStorage; // fixed usage
  const url = new URL(request.url);
  const shop = url.searchParams.get("shop");

  if (!shop) {
    return redirect("/auth"); // Missing shop, redirect to auth
  }

  // IMPORTANT: offline session IDs have "offline_" prefix
  const session = await sessionStorage.loadOfflineSession(`offline_${shop}`);

  if (!session) {
    return redirect(`/auth?shop=${shop}`);
  }

  return null;
};

export default function Dashboard() {
  const [billingCycle, setBillingCycle] = useState("monthly");
  const isMonthly = billingCycle === "monthly";

  const renderPrice = (monthly, yearly) =>
    isMonthly ? `$${monthly}/month` : `$${yearly}/year`;

  const renderBadge = () =>
    !isMonthly && <Badge tone="success">Save 10%</Badge>;

  const plans = [
    {
      id: "basic",
      title: "Basic Plan",
      monthly: 99.99,
      yearly: 1079.9,
      features: ["Single Site", "Email support", "30-day free trial"],
    },
    {
      id: "multi",
      title: "Multi Plan",
      monthly: 269.99,
      yearly: 2915.9,
      features: ["Up to 3 Sites", "Email support", "30-day free trial"],
    },
    {
      id: "business",
      title: "Business Plan",
      monthly: 399.99,
      yearly: 4319.9,
      features: ["Up to 10 Sites", "Priority email support", "30-day free trial"],
    },
    {
      id: "enterprise",
      title: "Enterprise Plan",
      monthly: 699.99,
      yearly: 7559.9,
      features: ["Unlimited Sites", "Dedicated support", "30-day free trial"],
    },
  ];

  const handleSelectPlan = (planId) => {
    // Pass shop as query param for session retrieval downstream
    const url = new URL(`/create-billing`, window.location.origin);
    url.searchParams.set("planId", planId);
    url.searchParams.set("shop", new URL(window.location.href).searchParams.get("shop"));
    window.location.href = url.toString();
  };

  return (
    <Page title="Welcome to Squid Commerce Connector" sectioned>
      <Layout>
        <Layout.Section>
          <Card>
            <TextContainer spacing="tight">
              <Text variant="headingLg" as="h2">
                Thanks for installing!
              </Text>
              <Text>
                This app connects your Shopify store to your WordPress-based backend.
              </Text>
              <Text>Select a plan to activate the service:</Text>
            </TextContainer>
          </Card>
        </Layout.Section>

        <Layout.Section>
          <ButtonGroup segmented>
            <Button
              pressed={isMonthly}
              onClick={() => setBillingCycle("monthly")}
            >
              Monthly
            </Button>
            <Button
              pressed={!isMonthly}
              onClick={() => setBillingCycle("yearly")}
            >
              Yearly
            </Button>
          </ButtonGroup>
        </Layout.Section>

        <Layout.Section>
          <InlineStack align="stretch" gap="800">
            {plans.map((plan) => {
              const planId = `${plan.id}-${isMonthly ? "monthly" : "yearly"}`;
              return (
                <Card key={plan.id} title={plan.title} sectioned>
                  <TextContainer spacing="tight">
                    <Text variant="headingMd" as="h3">
                      {renderPrice(plan.monthly, plan.yearly)} {renderBadge()}
                    </Text>
                    <ul>
                      {plan.features.map((feature, i) => (
                        <li key={i}>{feature}</li>
                      ))}
                    </ul>
                  </TextContainer>
                  <Button
                    primary
                    onClick={() => handleSelectPlan(planId)}
                  >
                    Select {plan.title}
                  </Button>
                </Card>
              );
            })}
          </InlineStack>
        </Layout.Section>
      </Layout>
    </Page>
  );
}




//// file 7
// import { useState } from "react";
// import { redirect } from "@remix-run/node";
// import { shopifyApp } from "../shopify.server"; // adjust path if needed
// import {
//   Page,
//   Layout,
//   Card,
//   Text,
//   TextContainer,
//   InlineStack,
//   Button,
//   Badge,
//   ButtonGroup,
// } from "@shopify/polaris";

// // Manual session retrieval
// export const loader = async ({ request }) => {
//   const sessionStorage = shopifyApp.sessionStorage;
//   const url = new URL(request.url);
//   const shop = url.searchParams.get("shop");

//   if (!shop) {
//     return redirect("/auth"); // Missing shop, redirect to auth
//   }

//   const session = await sessionStorage.loadOfflineSession(shop);

//   if (!session) {
//     return redirect(`/auth?shop=${shop}`);
//   }

//   return null;
// };

// export default function Dashboard() {
//   const [billingCycle, setBillingCycle] = useState("monthly");
//   const isMonthly = billingCycle === "monthly";

//   const renderPrice = (monthly, yearly) =>
//     isMonthly ? `$${monthly}/month` : `$${yearly}/year`;

//   const renderBadge = () =>
//     !isMonthly && <Badge tone="success">Save 10%</Badge>;

//   const plans = [
//     {
//       id: "basic",
//       title: "Basic Plan",
//       monthly: 99.99,
//       yearly: 1079.9,
//       features: ["Single Site", "Email support", "30-day free trial"],
//     },
//     {
//       id: "multi",
//       title: "Multi Plan",
//       monthly: 269.99,
//       yearly: 2915.9,
//       features: ["Up to 3 Sites", "Email support", "30-day free trial"],
//     },
//     {
//       id: "business",
//       title: "Business Plan",
//       monthly: 399.99,
//       yearly: 4319.9,
//       features: ["Up to 10 Sites", "Priority email support", "30-day free trial"],
//     },
//     {
//       id: "enterprise",
//       title: "Enterprise Plan",
//       monthly: 699.99,
//       yearly: 7559.9,
//       features: ["Unlimited Sites", "Dedicated support", "30-day free trial"],
//     },
//   ];

//   const handleSelectPlan = (planId) => {
//     window.location.href = `/create-billing?planId=${planId}`;
//   };

//   return (
//     <Page title="Welcome to Squid Commerce Connector" sectioned>
//       <Layout>
//         <Layout.Section>
//           <Card>
//             <TextContainer spacing="tight">
//               <Text variant="headingLg" as="h2">
//                 Thanks for installing!
//               </Text>
//               <Text>
//                 This app connects your Shopify store to your WordPress-based backend.
//               </Text>
//               <Text>Select a plan to activate the service:</Text>
//             </TextContainer>
//           </Card>
//         </Layout.Section>

//         <Layout.Section>
//           <ButtonGroup segmented>
//             <Button
//               pressed={isMonthly}
//               onClick={() => setBillingCycle("monthly")}
//             >
//               Monthly
//             </Button>
//             <Button
//               pressed={!isMonthly}
//               onClick={() => setBillingCycle("yearly")}
//             >
//               Yearly
//             </Button>
//           </ButtonGroup>
//         </Layout.Section>

//         <Layout.Section>
//           <InlineStack align="stretch" gap="800">
//             {plans.map((plan) => {
//               const planId = `${plan.id}-${isMonthly ? "monthly" : "yearly"}`;
//               return (
//                 <Card key={plan.id} title={plan.title} sectioned>
//                   <TextContainer spacing="tight">
//                     <Text variant="headingMd" as="h3">
//                       {renderPrice(plan.monthly, plan.yearly)} {renderBadge()}
//                     </Text>
//                     <ul>
//                       {plan.features.map((feature, i) => (
//                         <li key={i}>{feature}</li>
//                       ))}
//                     </ul>
//                   </TextContainer>
//                   <Button
//                     primary
//                     onClick={() => handleSelectPlan(planId)}
//                   >
//                     Select {plan.title}
//                   </Button>
//                 </Card>
//               );
//             })}
//           </InlineStack>
//         </Layout.Section>
//       </Layout>
//     </Page>
//   );
// }




//// file 5
// import { useState } from "react";
// import { redirect } from "@remix-run/node";
// import { authenticate } from "../shopify.server";  // adjust path if needed
// import {
//   Page,
//   Layout,
//   Card,
//   Text,
//   TextContainer,
//   InlineStack,
//   Button,
//   Badge,
//   ButtonGroup,
// } from "@shopify/polaris";


// // replaced the one below in order to use offline athentication
// export const loader = async ({ request }) => {
//   const session = await authenticate.offline(request);

//   if (!session) {
//     // Offline session missing, redirect to login (rare for offline sessions)
//     return redirect("/auth");
//   }

//   return null;
// };

// export default function Dashboard() {
//   const [billingCycle, setBillingCycle] = useState("monthly");
//   const isMonthly = billingCycle === "monthly";

//   const renderPrice = (monthly, yearly) =>
//     isMonthly ? `$${monthly}/month` : `$${yearly}/year`;

//   const renderBadge = () =>
//     !isMonthly && <Badge tone="success">Save 10%</Badge>;

//   const plans = [
//     {
//       id: "basic",
//       title: "Basic Plan",
//       monthly: 99.99,
//       yearly: 1079.9,
//       features: ["Single Site", "Email support", "30-day free trial"],
//     },
//     {
//       id: "multi",
//       title: "Multi Plan",
//       monthly: 269.99,
//       yearly: 2915.9,
//       features: ["Up to 3 Sites", "Email support", "30-day free trial"],
//     },
//     {
//       id: "business",
//       title: "Business Plan",
//       monthly: 399.99,
//       yearly: 4319.9,
//       features: ["Up to 10 Sites", "Priority email support", "30-day free trial"],
//     },
//     {
//       id: "enterprise",
//       title: "Enterprise Plan",
//       monthly: 699.99,
//       yearly: 7559.9,
//       features: ["Unlimited Sites", "Dedicated support", "30-day free trial"],
//     },
//   ];

//   const handleSelectPlan = (planId) => {
//     // Redirect to backend to create billing charge
//     window.location.href = `/create-billing?planId=${planId}`;
//   };

//   return (
//     <Page title="Welcome to Squid Commerce Connector" sectioned>
//       <Layout>
//         <Layout.Section>
//           <Card>
//             <TextContainer spacing="tight">
//               <Text variant="headingLg" as="h2">
//                 Thanks for installing!
//               </Text>
//               <Text>
//                 This app connects your Shopify store to your WordPress-based backend.
//               </Text>
//               <Text>Select a plan to activate the service:</Text>
//             </TextContainer>
//           </Card>
//         </Layout.Section>

//         <Layout.Section>
//           <ButtonGroup segmented>
//             <Button
//               pressed={isMonthly}
//               onClick={() => setBillingCycle("monthly")}
//             >
//               Monthly
//             </Button>
//             <Button
//               pressed={!isMonthly}
//               onClick={() => setBillingCycle("yearly")}
//             >
//               Yearly
//             </Button>
//           </ButtonGroup>
//         </Layout.Section>

//         <Layout.Section>
//           <InlineStack align="stretch" gap="800">
//             {plans.map((plan) => {
//               const planId = `${plan.id}-${isMonthly ? "monthly" : "yearly"}`; // Use this to match Shopify plan identifiers
//               return (
//                 <Card key={plan.id} title={plan.title} sectioned>
//                   <TextContainer spacing="tight">
//                     <Text variant="headingMd" as="h3">
//                       {renderPrice(plan.monthly, plan.yearly)} {renderBadge()}
//                     </Text>
//                     <ul>
//                       {plan.features.map((feature, i) => (
//                         <li key={i}>{feature}</li>
//                       ))}
//                     </ul>
//                   </TextContainer>
//                   <Button
//                     primary
//                     onClick={() => handleSelectPlan(planId)}
//                   >
//                     Select {plan.title}
//                   </Button>
//                 </Card>
//               );
//             })}
//           </InlineStack>
//         </Layout.Section>
//       </Layout>
//     </Page>
//   );
// }




//// file 3
// import { useState } from "react";
// import {
//   Page,
//   Layout,
//   Card,
//   Text,
//   TextContainer,
//   InlineStack,
//   Button,
//   Box,
//   Badge,
//   ButtonGroup,
// } from "@shopify/polaris";

// export default function Dashboard() {
//   const [billingCycle, setBillingCycle] = useState("monthly");
//   const isMonthly = billingCycle === "monthly";

//   const renderPrice = (monthly, yearly) =>
//     isMonthly ? `$${monthly}/month` : `$${yearly}/year`;

//   const renderBadge = () =>
//     !isMonthly && <Badge tone="success">Save 10%</Badge>;

//   const plans = [
//     {
//       id: "basic",
//       title: "Basic Plan",
//       monthly: 99.99,
//       yearly: 1079.9,
//       features: ["Single Site", "Email support", "30-day free trial"],
//     },
//     {
//       id: "multi",
//       title: "Multi Plan",
//       monthly: 269.99,
//       yearly: 2915.9,
//       features: ["Up to 3 Sites", "Email support", "30-day free trial"],
//     },
//     {
//       id: "business",
//       title: "Business Plan",
//       monthly: 399.99,
//       yearly: 4319.9,
//       features: ["Up to 10 Sites", "Priority email support", "30-day free trial"],
//     },
//     {
//       id: "enterprise",
//       title: "Enterprise Plan",
//       monthly: 699.99,
//       yearly: 7559.9,
//       features: ["Unlimited Sites", "Dedicated support", "30-day free trial"],
//     },
//   ];

//   const handleSelectPlan = (planId) => {
//     // Redirect to backend to create billing charge
//     window.location.href = `/create-billing?planId=${planId}`;
//   };

//   return (
//     <Page title="Welcome to Squid Commerce Connector" sectioned>
//       <Layout>
//         <Layout.Section>
//           <Card>
//             <TextContainer spacing="tight">
//               <Text variant="headingLg" as="h2">
//                 Thanks for installing!
//               </Text>
//               <Text>
//                 This app connects your Shopify store to your WordPress-based backend.
//               </Text>
//               <Text>Select a plan to activate the service:</Text>
//             </TextContainer>
//           </Card>
//         </Layout.Section>

//         <Layout.Section>
//           <ButtonGroup segmented>
//             <Button
//               pressed={isMonthly}
//               onClick={() => setBillingCycle("monthly")}
//             >
//               Monthly
//             </Button>
//             <Button
//               pressed={!isMonthly}
//               onClick={() => setBillingCycle("yearly")}
//             >
//               Yearly
//             </Button>
//           </ButtonGroup>
//         </Layout.Section>

//         <Layout.Section>
//           <InlineStack align="stretch" gap="800">
//             {plans.map((plan) => {
//               const planId = `${plan.id}-${isMonthly ? "monthly" : "yearly"}`; // Use this to match Shopify plan identifiers
//               return (
//                 <Card key={plan.id} title={plan.title} sectioned>
//                   <TextContainer spacing="tight">
//                     <Text variant="headingMd" as="h3">
//                       {renderPrice(plan.monthly, plan.yearly)} {renderBadge()}
//                     </Text>
//                     <ul>
//                       {plan.features.map((feature, i) => (
//                         <li key={i}>{feature}</li>
//                       ))}
//                     </ul>
//                   </TextContainer>
//                   <Button
//                     primary
//                     onClick={() => handleSelectPlan(planId)}
//                   >
//                     Select {plan.title}
//                   </Button>
//                 </Card>
//               );
//             })}
//           </InlineStack>
//         </Layout.Section>
//       </Layout>
//     </Page>
//   );
// }




// file 2
// import { useState } from "react";
// import {
//   Page,
//   Layout,
//   Card,
//   Text,
//   TextContainer,
//   InlineStack,
//   Button,
//   Box,
//   Badge,
//   ButtonGroup,
// } from "@shopify/polaris";
// import { useFetcher } from "@remix-run/react";

// export default function Dashboard() {
//   const [billingCycle, setBillingCycle] = useState("monthly");
//   const isMonthly = billingCycle === "monthly";

//   const toggleBilling = () => {
//     setBillingCycle((prev) => (prev === "monthly" ? "yearly" : "monthly"));
//   };

//   const renderPrice = (monthly, yearly) =>
//     isMonthly ? `$${monthly}/month` : `$${yearly}/year`;

//   const renderBadge = () =>
//     !isMonthly && <Badge tone="success">Save 10%</Badge>;

//   const plans = [
//     {
//       id: "basic",
//       title: "Basic Plan",
//       monthly: 99.99,
//       yearly: 1079.9,
//       features: ["Single Site", "Email support", "30-day free trial"],
//     },
//     {
//       id: "multi",
//       title: "Multi Plan",
//       monthly: 269.99,
//       yearly: 2915.9,
//       features: ["Up to 3 Sites", "Email support", "30-day free trial"],
//     },
//     {
//       id: "business",
//       title: "Business Plan",
//       monthly: 399.99,
//       yearly: 4319.9,
//       features: ["Up to 10 Sites", "Priority email support", "30-day free trial"],
//     },
//     {
//       id: "enterprise",
//       title: "Enterprise Plan",
//       monthly: 699.99,
//       yearly: 7559.9,
//       features: ["Unlimited Sites", "Dedicated support", "30-day free trial"],
//     },
//   ];

//   return (
//     <Page title="Welcome to Squid Commerce Connector" sectioned>
//       <Layout>
//         <Layout.Section>
//           <Card>
//             <TextContainer spacing="tight">
//               <Text variant="headingLg" as="h2">
//                 Thanks for installing!
//               </Text>
//               <Text>
//                 This app connects your Shopify store to your WordPress-based backend.
//               </Text>
//               <Text>Select a plan to activate the service:</Text>
//             </TextContainer>
//           </Card>
//         </Layout.Section>

//         {/* Polaris ButtonGroup Toggle */}
//         <Layout.Section>
//           <ButtonGroup segmented>
//             <Button
//               pressed={isMonthly}
//               onClick={() => setBillingCycle("monthly")}
//             >
//               Monthly
//             </Button>
//             <Button
//               pressed={!isMonthly}
//               onClick={() => setBillingCycle("yearly")}
//             >
//               Yearly
//             </Button>
//           </ButtonGroup>
//         </Layout.Section>

//         {/* Plan Cards */}
//         <Layout.Section>
//           <InlineStack align="stretch" gap="800">
//             {plans.map((plan) => {
//               const fetcher = useFetcher();
//               const planId = `${plan.id}-${isMonthly ? "monthly" : "yearly"}`;
//               return (
//                 <Card key={plan.id} title={plan.title} sectioned>
//                   <TextContainer spacing="tight">
//                     <Text variant="headingMd" as="h3">
//                       {renderPrice(plan.monthly, plan.yearly)} {renderBadge()}
//                     </Text>
//                     <ul>
//                       {plan.features.map((feature, i) => (
//                         <li key={i}>{feature}</li>
//                       ))}
//                     </ul>
//                   </TextContainer>
//                   <fetcher.Form method="post" action="/api/subscribe">
//                     <input type="hidden" name="planId" value={planId} />
//                     <Button submit primary>
//                       Select {plan.title}
//                     </Button>
//                   </fetcher.Form>
//                 </Card>
//               );
//             })}
//           </InlineStack>
//         </Layout.Section>
//       </Layout>
//     </Page>
//   );
// }




//// file 1
// import { useState } from "react";
// import {
//   Page,
//   Layout,
//   Card,
//   Text,
//   TextContainer,
//   InlineStack,
//   Button,
//   Box,
//   Badge,
// } from "@shopify/polaris";
// import { useFetcher } from "@remix-run/react";

// export default function Dashboard() {
//   const [billingCycle, setBillingCycle] = useState("monthly");
//   const isMonthly = billingCycle === "monthly";

//   const toggleBilling = () => {
//     setBillingCycle((prev) => (prev === "monthly" ? "yearly" : "monthly"));
//   };

//   const renderPrice = (monthly, yearly) =>
//     isMonthly ? `$${monthly}/month` : `$${yearly}/year`;

//   const renderBadge = () =>
//     !isMonthly && <Badge tone="success">Save 10%</Badge>;

//   const plans = [
//     {
//       id: "basic",
//       title: "Basic Plan",
//       monthly: 99.99,
//       yearly: 1079.9,
//       features: ["Single Site", "Email support", "30-day free trial"],
//     },
//     {
//       id: "multi",
//       title: "Multi Plan",
//       monthly: 269.99,
//       yearly: 2915.9,
//       features: ["Up to 3 Sites", "Email support", "30-day free trial"],
//     },
//     {
//       id: "business",
//       title: "Business Plan",
//       monthly: 399.99,
//       yearly: 4319.9,
//       features: ["Up to 10 Sites", "Priority email support", "30-day free trial"],
//     },
//     {
//       id: "enterprise",
//       title: "Enterprise Plan",
//       monthly: 699.99,
//       yearly: 7559.9,
//       features: ["Unlimited Sites", "Dedicated support", "30-day free trial"],
//     },
//   ];

//   return (
//     <Page title="Welcome to Squid Commerce Connector" sectioned>
//       <Layout>
//         <Layout.Section>
//           <Card>
//             <TextContainer spacing="tight">
//               <Text variant="headingLg" as="h2">
//                 Thanks for installing!
//               </Text>
//               <Text>
//                 This app connects your Shopify store to your WordPress-based backend.
//               </Text>
//               <Text>Select a plan to activate the service:</Text>
//             </TextContainer>
//           </Card>
//         </Layout.Section>

//         <Layout.Section>
//           <InlineStack align="center" gap="800">
//             <Text
//               variant="bodySm"
//               tone={isMonthly ? "strong" : "subdued"}
//               onClick={() => setBillingCycle("monthly")}
//               style={{ cursor: "pointer" }}
//             >
//               Monthly
//             </Text>
//             <Box
//               onClick={toggleBilling}
//               background="bg-subdued"
//               borderRadius="full"
//               padding="100"
//               cursor="pointer"
//               style={{
//                 width: 48,
//                 height: 24,
//                 display: "flex",
//                 alignItems: "center",
//                 justifyContent: isMonthly ? "flex-start" : "flex-end",
//               }}
//             >
//               <Box
//                 width="16px"
//                 height="16px"
//                 background="bg-primary"
//                 borderRadius="full"
//                 style={{
//                   transition: "transform 0.2s ease",
//                 }}
//               />
//             </Box>
//             <Text
//               variant="bodySm"
//               tone={!isMonthly ? "strong" : "subdued"}
//               onClick={() => setBillingCycle("yearly")}
//               style={{ cursor: "pointer" }}
//             >
//               Yearly
//             </Text>
//           </InlineStack>
//         </Layout.Section>

//         {/* Added gap="400" to the InlineStack for spacing between cards */}
//         <Layout.Section>
//           <InlineStack align="stretch" gap="800">
//             {plans.map((plan) => {
//               const fetcher = useFetcher();
//               const planId = `${plan.id}-${isMonthly ? "monthly" : "yearly"}`;
//               return (
//                 <Card key={plan.id} title={plan.title} sectioned>
//                   <TextContainer spacing="tight">
//                     <Text variant="headingMd" as="h3">
//                       {renderPrice(plan.monthly, plan.yearly)} {renderBadge()}
//                     </Text>
//                     <ul>
//                       {plan.features.map((feature, i) => (
//                         <li key={i}>{feature}</li>
//                       ))}
//                     </ul>
//                   </TextContainer>
//                   <fetcher.Form method="post" action="/api/subscribe">
//                     <input type="hidden" name="planId" value={planId} />
//                     <Button submit primary>
//                       Select {plan.title}
//                     </Button>
//                   </fetcher.Form>
//                 </Card>
//               );
//             })}
//           </InlineStack>
//         </Layout.Section>
//       </Layout>
//     </Page>
//   );
// }


