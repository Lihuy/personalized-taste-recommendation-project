'use client'; // This directive indicates that this module should be rendered on the client-side.
// It enables the use of browser-specific APIs, state, and effects.

import React from 'react'; // Import the React library. While not directly referenced in the JSX here,
// it's necessary for the JSX transformation process.
import CheckOut from '@/components/layout/CheckOut'; // Import the CheckOut component.
// This component likely contains the UI and logic related to the checkout process.

// This is the default export function for the checkout page.
// In Next.js's App Router, this component represents the page content for the corresponding route segment.
export default function CheckoutPage() {
  // Render the CheckOut component.
  // The entire checkout functionality and appearance are handled within this component.
  return (
    <CheckOut />
  );
}