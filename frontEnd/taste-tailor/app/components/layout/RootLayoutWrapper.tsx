'use client' // This directive indicates that this component should be rendered on the client side.
// This is necessary because it uses context providers and potentially hooks or browser APIs
// that are only available in the browser environment.

import React from 'react'; // Import the React library.
import MainHeader from "@/components/layout/mainHeader"; // Import the MainHeader component. This is likely the main navigation/header for the application.
import { RestaurantProvider } from '@/context/RestaurantContext'; // Import the RestaurantProvider context provider.
// This provider likely manages state and logic related to restaurants, making it accessible to its children.
import { ShoppingCartProvider } from '@/context/ShoppingCartContext'; // Import the ShoppingCartProvider context provider.
// This provider likely manages state and logic related to the shopping cart, making it accessible to its children.

// Define the interface for the props expected by the RootLayoutWrapper component.
// It expects a 'children' prop, which represents the nested content that this wrapper will wrap around.
interface RootLayoutWrapperProps {
  children: React.ReactNode; // children is a React node, which can be any renderable element (JSX, string, array, etc.).
}

// The RootLayoutWrapper functional component.
// It receives 'children' as a prop and wraps it along with the MainHeader inside context providers.
const RootLayoutWrapper: React.FC<RootLayoutWrapperProps> = ({ children }) => {
  return (
    // Wrap the entire content (MainHeader and children) with the context providers.
    // Nesting providers makes the context from the inner provider available to components
    // within it, and context from the outer provider available to components within *it*
    // (which includes the inner provider and its children).
    <RestaurantProvider> {/* The outer provider for restaurant-related context */}
      <ShoppingCartProvider> {/* The inner provider for shopping cart context */}
        {/* The MainHeader is placed inside the providers, so it can access both contexts */}
        <MainHeader />
        {/* The 'main' element wraps the children prop, which represents the page content.
            These children components can also access both RestaurantContext and ShoppingCartContext. */}
        <main>{children}</main>
      </ShoppingCartProvider>
    </RestaurantProvider>
  );
};

// Export the RootLayoutWrapper component as the default export.
export default RootLayoutWrapper;