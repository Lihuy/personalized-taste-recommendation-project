'use client'; // This directive indicates that this component is a Client Component.
// It requires rendering in the browser to use features like state, effects, and browser APIs.

import React, { useState, useEffect } from 'react'; // Import React and necessary hooks for state management and side effects.
import { useRouter } from 'next/navigation'; // Import useRouter hook for programmatic navigation in a Client Component.
import { CheckCircle } from 'lucide-react'; // Import the CheckCircle icon from lucide-react library.
import { parseCookies } from 'nookies'; // Import parseCookies from nookies to read cookies easily.

// Functional component for the Order Completed page.
// Displays a confirmation message after an order is presumably completed.
const OrderCompleted: React.FC = () => {
  // State to track if the client is logged in based on cookies.
  const [isClientLoggedIn, setIsClientLoggedIn] = useState(false);
  // State to track if the login status check using cookies has completed.
  const [isLoginCheckComplete, setIsLoginCheckComplete] = useState(false);
  // Initialize the router hook.
  const router = useRouter();

  // useEffect hook to perform actions on component mount, specifically checking login status via cookies.
  useEffect(() => {
      // Parse all available cookies.
      const cookies = parseCookies();
      // Get the 'isLoggedIn' cookie value.
      const loggedInCookie = cookies['isLoggedIn'];

      // Check the value of the loggedInCookie.
      if (loggedInCookie === 'true') {
          // If logged in, set the state to true.
          setIsClientLoggedIn(true);
      } else {
          // If not logged in, set the state to false.
          setIsClientLoggedIn(false);
          // Redirect the user to the home page if they are not logged in.
          router.push('/');
      }
      // After checking the cookie (regardless of the value), mark the check as complete.
      setIsLoginCheckComplete(true);
  }, [router]); // Dependency array: the effect runs once on mount and if the router object changes (unlikely in most cases).

  // Render a loading state while the login check is in progress.
  if (!isLoginCheckComplete) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
          <p className="text-gray-700 text-lg">Checking login status...</p>
      </div>
    );
  }

  // If the login check is complete and the user is not logged in, return null.
  // Note: The useEffect hook already handles redirection, so this might be redundant depending on exact timing,
  // but serves as a fallback to not render the content if redirection hasn't happened yet.
  if (!isClientLoggedIn) {
      return null;
  }

  // Render the order completed confirmation UI if the user is logged in.
  return (
    // Main container with flex layout to center content, min height, background color, and padding.
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
      {/* White card container with rounded corners, shadow, padding, and centered text. */}
      <div className="bg-white rounded-lg shadow-xl p-8 text-center">
        {/* Order Complete Icon */}
        {/* Using the imported CheckCircle icon with specific size, color, margin, and centering. */}
        <CheckCircle size={80} className="text-green-500 mx-auto mb-6" />

        {/* Completion Message Heading */}
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          Your orders have been delivered. {/* The main confirmation message */}
        </h2>

        {/* Thank You Message */}
        <p className="text-gray-600 text-lg">
          Thank you for using our services. {/* A supplementary thank you message */}
        </p>

        {/* Optional: Add a button to go back to the home/menu page */}
        {/* The commented-out code shows how a button could be added here */}
        {/*
        <button className="mt-6 px-6 py-3 bg-blue-600 text-white rounded-full font-semibold hover:bg-blue-700 transition-colors duration-200 shadow-md">
          Continue Shopping
        </button>
        */}
      </div>
    </div>
  );
};

// Export the component as the default export.
export default OrderCompleted;