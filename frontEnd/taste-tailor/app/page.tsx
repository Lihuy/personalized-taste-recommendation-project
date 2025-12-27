// This directive is necessary for components that use client-side features like hooks or event handlers.
// It tells Next.js that this component should be rendered on the client side.
"use client";

// Import the necessary React library.
import React from 'react';

// Import the MainBody component from its specified path.
// This component likely represents the main content area or body structure of the page.
import MainBody from "@/components/layout/mainBody";

// Import the MainMenu component from its specified path.
// This component likely represents the navigation or menu area of the page.
import MainMenu from "@/components/layout/mainMenu";

// Import the MainSection component from its specified path.
// This component likely represents a specific section within the main content.
import MainSection from "./components/layout/mainSection";

// Define the Home functional component.
// This is the main component for the home page of the application.
export default function Home() {
  // The component returns JSX, which describes the structure of the UI.
  return (
    // Using a React Fragment (<>...</>) allows grouping multiple elements
    // without adding an extra node to the DOM tree.
    <>
      {/* Render the MainBody component. */}
      <MainBody />

      {/* Render the MainMenu component. */}
      <MainMenu
        // Pass a 'show' prop with a boolean value (true) to control the visibility of the menu.
        show={true}
        // Pass an 'onCuisineSelect' prop, which is a function that will be called
        // when a cuisine is selected in the MainMenu. It logs the selected cuisine to the console.
        onCuisineSelect={(cuisine) => console.log(`Selected cuisine: ${cuisine}`)}
        // Pass a 'selectedCuisine' prop with a default value. This likely indicates
        // the currently selected cuisine in the menu.
        selectedCuisine="defaultCuisine"
      />

      {/* Render a standard HTML section element. */}
      <section>
        {/* Render the MainSection component inside the section. */}
        <MainSection />
      </section>
    </>
  )
}