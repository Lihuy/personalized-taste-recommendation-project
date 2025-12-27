'use client'

import { useEffect } from 'react';
import { setCookie } from 'nookies';
import { useRouter } from 'next/navigation';

function GoogleCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    // This page is loaded by the browser after Google redirects back to the frontend.
    // Now, we make a fetch request to our backend to get the user data
    // using the session/cookie that the backend set during the /google/auth/ call.

    const fetchUserData = async () => {
      try {
        console.log("Attempting to fetch user data from backend...");
        // Make the API call to Flask backend's /api/me endpoint
        // The browser automatically includes the session cookie for the backend domain
        const response = await fetch('http://localhost:5000/taste_tailor_google_api', {
          credentials: 'include'
        });

        console.log("Fetch response status:", response.status);

        if (response.ok) {
          const data = await response.json();
          console.log("User data fetched successfully:", data);
          setCookie(null, 'isLoggedIn', data.isLoggedIn, {
            path: '/',
          });
          setCookie(null, 'userMessage', `Welcome, ${data.firstName}.`, {
            path: '/',
          });
           // Set other user cookies from the backend response if available
           setCookie(null, 'userFirstName', data.firstName, { path: '/' });
           setCookie(null, 'userLastName', data.lastName, { path: '/' });
           setCookie(null, 'userEmail', data.email, { path: '/' });
           setCookie(null, 'userID', data.userId, { path: '/' }); // Assuming backend sends userId
           setCookie(null, 'profilePictureFileName', data.profilePicture, { path: '/' }); // Assuming backend sends profilePicture
           setCookie(null, 'loginMethod', "Google", { path: '/' });
          router.push('/menu/mainMenu');
        } else {
          // Handle other potential API errors (e.g., 401 if session wasn't set correctly)
          const errorData = await response.json().catch(() => ({})); // Try to parse JSON, default to empty object on failure
          console.error('API error fetching user data:', response.status, errorData);
          // Redirect to login page on error
          router.push('/auth/login');
        }
      } catch (error) {
        console.error('Error during fetch to /taste_tailor_google_api:', error);
        // Redirect to login page on network error
        router.push('/auth/login');
      }
    };

    // Add a small delay before attempting to fetch user data
    // This gives the browser a moment to process the Set-Cookie header from the redirect
    const delay = 500; // 500 milliseconds
    console.log(`Waiting for ${delay}ms before fetching user data...`);
    const timer = setTimeout(fetchUserData, delay);

    // Cleanup the timer if the component unmounts before the delay is finished
    return () => clearTimeout(timer);

  }, [router]); // Add router to dependencies because it's used inside useEffect

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <p className="text-gray-700 text-lg">Processing login, please wait...</p> {/* Loading message */}
    </div>
  );
}

export default GoogleCallbackPage;