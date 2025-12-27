'use client'

import React, { useState, useEffect } from 'react';
import {
  House, // Placeholder for Home
  HandPlatter,
  ShoppingBag, // Placeholder for Orders
  Wallet, // Placeholder for Wallet
  Users, // Placeholder for About us
  Headset, // Placeholder for Contact us
  LucideIcon,
  LogOut // Import LogOut icon
} from 'lucide-react';
import { setCookie, parseCookies, destroyCookie } from 'nookies'; // Import destroyCookie
import { useRouter } from 'next/navigation';

// Define the props type for the SidebarItem component
interface SidebarItemProps {
  icon: LucideIcon; // Type the icon prop using LucideIcon
  text: string;
  href?: string; // Optional href
  badge?: string | null; // Optional badge, can be string or null
  isExternal?: boolean; // Optional boolean
  isBold?: boolean; // Optional boolean
  isSmall?: boolean; // Optional boolean
  onClick?: () => void; // Optional onClick handler
}

// Sidebar Item Component using TypeScript
const SidebarItem: React.FC<SidebarItemProps> = ({
  icon: Icon, // Rename icon prop to Icon for use as component
  text,
  href = '#', // Default value for href
  badge = null, // Default value for badge
  isExternal = false, // Default value for isExternal
  isBold = false, // Default value for isBold
  isSmall = false, // Default value for isSmall
  onClick // Include onClick handler
}) => {
    const commonClasses = `flex items-center py-2 px-4 text-gray-700 hover:bg-gray-100 rounded-md transition-colors duration-150 group ${
      isSmall ? 'text-sm' : 'text-base'
    } ${isBold ? 'font-semibold' : ''}`;

    // If href is provided, render an anchor tag
    if (href && href !== '#') {
        return (
            <a
                href={href}
                target={isExternal ? '_blank' : '_self'}
                rel={isExternal ? 'noopener noreferrer' : ''}
                className={commonClasses}
            >
                {/* Render the icon component */}
                <Icon className={`mr-3 h-5 w-5 flex-shrink-0 ${isSmall ? 'h-4 w-4' : ''}`} aria-hidden="true" />
                {/* Text content */}
                <span className="flex-grow">{text}</span>
                {/* Conditional rendering for the badge */}
                {badge && (
                  <span className="ml-2 inline-block py-0.5 px-2 text-xs font-medium text-white bg-green-500 rounded-full">
                    {badge}
                  </span>
                )}
            </a>
        );
    }

    // If no href (or href is '#'), render a button or div with onClick
    // Using a button for interactive items without navigation
    return (
        <button
            onClick={onClick} // Use the onClick handler
            className={`${commonClasses} w-full text-left focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-opacity-50`} // Added w-full, text-left, and focus styles
        >
            {/* Render the icon component */}
            <Icon className={`mr-3 h-5 w-5 flex-shrink-0 ${isSmall ? 'h-4 w-4' : ''}`} aria-hidden="true" />
            {/* Text content */}
            <span className="flex-grow">{text}</span>
            {/* Conditional rendering for the badge */}
            {badge && (
              <span className="ml-2 inline-block py-0.5 px-2 text-xs font-medium text-white bg-green-500 rounded-full">
                {badge}
              </span>
            )}
        </button>
    );
};


// Main Sidebar Component
const Sidebar: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userName, setUserName] = useState('');
  const [profilePicture, setProfilePicture] = useState('/images/assets/profile.jpg'); // Default placeholder
  const [isClientLoggedIn, setIsClientLoggedIn] = useState(false);
  const router = useRouter();

  // Function to read and update state from cookies
  const updateUserInfoFromCookies = () => {
  const cookies = parseCookies();
  const loggedInCookie = cookies['isLoggedIn'];
  const userFirstNameCookie = cookies['userFirstName']; // Get first name
  const userLastNameCookie = cookies['userLastName']; // Get last name
  const profilePictureCookie = cookies['profilePictureFileName'];
  const loginMethodCookie = cookies['loginMethod']; // Assuming cookie was set on login

  const isLoggedInNow = loggedInCookie === 'true';
  setIsLoggedIn(isLoggedInNow);

  if (isLoggedInNow) {
    // Construct the full name from first and last name cookies
    const fullName = `${userFirstNameCookie || ''} ${userLastNameCookie || ''}`.trim();
    setUserName(fullName || cookies['userMessage'] || ''); // Use full name, fallback to userMessage

    // Determine the correct profile picture URL
    let profilePicUrl = '/images/assets/profile.jpg'; // Default placeholder
    if (profilePictureCookie) {
        // Check login method to determine how to construct the URL
        if (loginMethodCookie === "Google" || loginMethodCookie === "Facebook") {
            // OAuth users might have a full URL stored directly
            profilePicUrl = profilePictureCookie;
        } else {
            // Regular users get picture from upload directory
            profilePicUrl = `http://localhost:5000/uploads/profile_pictures/${profilePictureCookie}`;
        }
    }
    setProfilePicture(profilePicUrl);
    } else {
      // If not logged in, reset state to default
      setUserName('');
      setProfilePicture('/images/assets/profile.jpg');
    }
  };


  useEffect(() => {
    // --- Initial load: Read cookies when component mounts ---
    updateUserInfoFromCookies();

    // --- Add event listeners to re-read cookies on focus/visibility change ---
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        updateUserInfoFromCookies();
      }
    };

    const handleFocus = () => {
      updateUserInfoFromCookies();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);

    // --- Cleanup: Remove event listeners when component unmounts ---
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };

  }, []); // Empty dependency array means this effect runs only on mount and unmount


  const handleProfileUpdate = () => {
    // Setting this cookie might not be necessary if navigate directly
    // setCookie(null, 'isProfileUpdate', 'true', { path: '/' });
    router.push('/profile/profileUpdate');
  };

  const handleLogout = async () => {
      try {
          // Call the backend logout endpoint
          const response = await fetch('http://localhost:5000/taste_tailor_logout', {
              method: 'GET', // Assuming logout is a GET request as per app.py
              credentials: 'include', // Ensure session cookie is sent to backend for logout
          });

          if (response.ok) {
              // Clear frontend cookies related to login/user info
              destroyCookie(null, 'isLoggedIn', { path: '/' });
              destroyCookie(null, 'userMessage', { path: '/' });
              destroyCookie(null, 'userFirstName', { path: '/' });
              destroyCookie(null, 'userLastName', { path: '/' });
              destroyCookie(null, 'userEmail', { path: '/' });
              destroyCookie(null, 'userID', { path: '/' });
              destroyCookie(null, 'profilePictureFileName', { path: '/' });
              destroyCookie(null, 'loginMethod', { path: '/' }); // Clear login method cookie

              // Update state to reflect logged out status
              setIsLoggedIn(false);
              setUserName('');
              setProfilePicture('/images/assets/profile.jpg'); // Reset to default picture

              // Redirect to login page
              router.push('/auth/login');
          } else {
              const errorData = await response.json(); // Attempt to parse JSON error
              console.error("Backend logout failed:", response.status, errorData.message);
              alert(`Logout failed: ${errorData.message || response.statusText}`); // Show error to user
          }
      } catch (error) {
          console.error('An error occurred during logout:', error);
          alert('An unexpected error occurred during logout.'); // Show generic error
      }
  };


  // Render the sidebar only if the user is logged in
  if (isLoggedIn) {
    return (
      // Main container div with Tailwind classes for layout and styling
      // Added fixed and left-0 h-screen to make it a fixed sidebar
      <div className="flex h-screen w-64 flex-col border-r border-gray-200 bg-white font-sans fixed left-0 top-0"> {/* Added fixed, left-0, top-0 */}
        {/* User Profile Section */}
        <div className="flex items-center p-4 border-b border-gray-200">
          {/* User Avatar */}
          <div className="flex items-center justify-center rounded-full bg-gray-200 mr-3">
            <img
              src={profilePicture}
              alt="Profile Picture"
              className="w-10 h-10 rounded-full object-cover border-4 border-gray-400"
              // Fallback for broken image
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.onerror = null; // prevents infinite loop
                target.src = "/images/assets/profile.jpg"; // Fallback placeholder
              }}
            /> {/* User Icon */}
          </div>
          {/* User name and account link */}
          <div>
            <div className="font-semibold text-gray-800">{userName}</div> {/* Display User Name */}
            <button onClick={handleProfileUpdate} className="text-sm text-blue-600 hover:underline">Update Profile</button> {/* Changed text */}
          </div>
        </div>

        {/* Main Navigation Section */}
        <nav className="flex-grow overflow-y-auto p-4 space-y-1">
          {/* Render SidebarItem components for each navigation link */}
          <SidebarItem icon={House} href="/" text="Home" isBold />
          <SidebarItem icon={HandPlatter} href="/menu/recommendationMenu" text="Recommendation" isBold />
          <SidebarItem icon={ShoppingBag} href="/layout/pastOrder" text="Orders" isBold />
          <SidebarItem icon={Wallet} text="Wallet" isBold /> {/* Update href if Wallet page exists */}
          <SidebarItem icon={Users} text="About" isBold /> {/* Update href if About page exists */}
          <SidebarItem icon={Headset} text="Contact Us" isBold /> {/* Update href if Contact Us page exists */}
        </nav>

        {/* Footer Section with Sign out Link */}
        <div className="border-t border-gray-200 p-4">
          {/* Use SidebarItem with onClick for the logout action */}
          <SidebarItem icon={LogOut} text="Sign out" isSmall onClick={handleLogout} />
        </div>
      </div>
    );
  }

  // If not logged in, return null or a minimal placeholder if needed
  return null;
};

// Export the Sidebar component as the default export
export default Sidebar;