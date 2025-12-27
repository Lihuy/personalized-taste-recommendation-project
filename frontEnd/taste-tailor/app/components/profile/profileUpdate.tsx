'use client'; // This directive marks this file as a Client Component.
// It instructs Next.js to render this component on the browser, enabling the use
// of hooks like useState and useEffect, as well as browser-specific APIs.

import React, { useState, useEffect } from 'react'; // Import React and necessary hooks for state management and side effects.
import { parseCookies } from 'nookies'; // Import parseCookies from nookies to easily access browser cookies.
import { useRouter } from 'next/navigation'; // Import useRouter for programmatic navigation in a Client Component.
import PersonalInfoUpdate from '@/components/profile/personalInfoUpdate'; // Import the component for updating personal information.
import PersonalSecurityUpdate from '@/components/profile/securityInfoUpdate'; // Import the component for updating security information.

// Functional component for the Personal Info page.
// This component orchestrates the display and state management for the profile update section.
const ProfileUpdatePage: React.FC = () => {
  // State variables to hold user profile information retrieved from cookies.
  const [userFirstName, setUserFirstName] = useState('');
  const [userLastName, setUserLastName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [userID, setUserID] = useState(''); // State to store the user's ID.
  const [profilePicture, setProfilePicture] = useState(''); // State to store the profile picture filename.
  // State variable to track the currently active section ('profileInfo' or 'securityInfo').
  const [currentSection, setCurrentSection] = useState('profileInfo');
  // State variable to manage the loading state while checking authentication cookies.
  const [isLoading, setIsLoading] = useState(true);
  // Initialize the router hook for navigation.
  const router = useRouter();

  // useEffect hook to run side effects, specifically for checking authentication cookies on component mount.
  useEffect(() => {
    // Parse all available cookies.
    const cookies = parseCookies();
    // Extract specific user-related cookies.
    const loggedInCookie = cookies['isLoggedIn'];
    const userFirstNameCookie = cookies['userFirstName'];
    const userLastNameCookie = cookies['userLastName'];
    const userEmailCookie = cookies['userEmail'];
    const userIDCookie = cookies['userID'];
    const profilePictureCookie = cookies['profilePictureFileName'];

    // Check if the user is NOT logged in based on the cookies.
    // Redirect to the login page if the user is not authenticated.
    if (loggedInCookie === 'false' && !userFirstNameCookie && !userLastNameCookie && !userEmailCookie && !userIDCookie) {
      router.push('/'); // Redirect to the root route (presumably the login/homepage).
    } else {
      // If cookies indicate a user is potentially logged in, populate the state with cookie data.
      setUserFirstName(userFirstNameCookie);
      setUserLastName(userLastNameCookie);
      setUserEmail(userEmailCookie);
      setUserID(userIDCookie);
      setProfilePicture(profilePictureCookie);
      setIsLoading(false); // Set loading to false once cookie check and state population are done.
    }
  }, [router]); // Dependency array: useEffect runs only when `router` changes (which typically happens once).

  // Handler function to change the currently displayed profile section.
  const handleProfileNavigation = (message: string) => {
    setCurrentSection(message); // Update the state with the new section identifier.
  };

  // Show a loading message while the authentication check is in progress.
  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-100">Loading profile...</div>;
  }

  // Main render function for the profile update page.
  return (
    // Outer container with padding, background color, and margin.
    <div className="min-h-screen bg-gray-100 p-4 mt-4 md:p-8">
      {/* Layout container for sidebar and main content, uses flexbox for layout */}
      <div className="flex flex-col md:flex-row bg-white rounded-lg shadow-md overflow-hidden">
        {/* Sidebar Navigation */}
        <div className="w-full md:w-64 bg-gray-50 p-6 border-b md:border-b-0 md:border-r border-gray-200">
          <nav>
            <ul>
              {/* Personal Info navigation link */}
              <li className="mb-2">
                {/* Anchor tag acting as a navigation item */}
                <a onClick={() => handleProfileNavigation('profileInfo')} // Call handler on click to switch section
                   className={`block py-2 px-4 rounded-md cursor-pointer transition-colors
                  ${currentSection === 'profileInfo' ? 'text-gray-800 bg-gray-200 font-semibold' : 'text-gray-600 hover:bg-gray-100'}`}>
                  Personal info {/* Link text */}
                </a>
              </li>
              {/* Security navigation link */}
              <li className="mb-2">
                 {/* Anchor tag acting as a navigation item */}
                <a onClick={() => handleProfileNavigation('securityInfo')} // Call handler on click to switch section
                   className={`block py-2 px-4 rounded-md cursor-pointer transition-colors
                  ${currentSection === 'securityInfo' ? 'text-gray-800 bg-gray-200 font-semibold' : 'text-gray-600 hover:bg-gray-100'}`}>
                  Security {/* Link text */}
                </a>
              </li>
            </ul>
          </nav>
        </div>

        {/* Main Content Area - Conditionally Renders Profile Sections */}
        {currentSection === 'profileInfo' ? (
          // Render PersonalInfoUpdate component if currentSection is 'profileInfo'
          <PersonalInfoUpdate
            userFirstName={userFirstName}
            userLastName={userLastName}
            userEmail={userEmail}
            userID={userID}
            userProfilePicture={profilePicture}
          />
        ) : currentSection === 'securityInfo' ? (
          // Render PersonalSecurityUpdate component if currentSection is 'securityInfo'
          <PersonalSecurityUpdate userID={userID} />
        ) : null} {/* Render nothing if the section is not recognized */}
      </div>
    </div>
  );
};

// Export the component as the default export for the page.
export default ProfileUpdatePage;