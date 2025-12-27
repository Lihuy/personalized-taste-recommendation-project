'use client'; // This directive specifies that this component is a client-side component.
// It means it will be rendered in the browser, enabling features like state, effects, and event listeners.

import React from 'react'; // Import the React library, necessary for building UI components with JSX.
import OrderCompleted from '@/components/layout/orderCompleted'; // Import the OrderCompleted component.
// This component is responsible for displaying content related to a completed order.

// This is the default export function for the order completed page.
// In a Next.js application using the App Router, this function component serves as the page
// for the route associated with this file.
export default function OrderCompletedPage() {
  // Render the OrderCompleted component.
  // This delegates the rendering of the order completion confirmation/details to the imported component.
  return (
    <OrderCompleted />
  );
}