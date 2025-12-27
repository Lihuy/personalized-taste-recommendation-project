'use client'; // This directive marks this component as a Client Component, meaning it will be rendered in the browser.
// This is necessary if the component uses browser-specific APIs, hooks like useState or useEffect, or needs event handlers.

import React from 'react'; // Import the React library, required for using JSX and creating React components.
import PastOrder from '@/components/layout/pastOrder'; // Import the PastOrder component.
// This component likely displays a user's history of past orders.

// This is the default export function for the past orders page.
// In Next.js's App Router, this function component renders the UI for the route it corresponds to.
export default function PastOrderPage() {
  // Render the PastOrder component.
  // This component is responsible for fetching and displaying the past order details.
  return (
    <PastOrder />
  );
}