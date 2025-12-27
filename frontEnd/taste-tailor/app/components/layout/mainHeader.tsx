'use client'

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, usePathname } from 'next/navigation';
import { setCookie, parseCookies, destroyCookie } from 'nookies';
import { Menu, MapPin, ChevronDown, X, Pencil, Circle, CircleDot, Search, ShoppingCart, LogOut } from 'lucide-react';
import Sidebar from '@/components/profile/Sidebar';
import { useRestaurant } from '@/context/RestaurantContext'; 
import { useShoppingCart } from '@/context/ShoppingCartContext'; 
import ShoppingCartOverlay from '@/components/profile/ShoppingCartOverlay';

// Define the type for the address data (Moved to RestaurantContext.tsx)
interface Address {
  id: number | string; // Added id property
  name: string;
  street: string;
  suburb: string;
  state: string;
  postcode: string;
  country: string;
}

export default function MainHeader() {

  // Consume the Restaurant context
  const {searchTerm, setSearchTerm, selectedAddress, setSelectedAddress} = useRestaurant();
  // Consume the Shopping Cart context
  const { getCartItemCount, clearCart } = useShoppingCart(); // Get clearCart from context

  const [isLoggedIn, setIsLoggedIn] = useState(false); // Renamed for clarity
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // Renamed for clarity

  // State for the location dropdown overlay and selected address (Now in context)
  const [isLocationOverlayOpen, setIsLocationOverlayOpen] = useState(false);

  // const [selectedAddress, setSelectedAddress] = useState<Address | null>(null); // Removed,
  // now in context

  const [addressInput, setAddressInput] = useState(""); // State for the address input field in the
  // overlay

  // Refs for positioning the location dropdown
  const locationButtonRef = useRef<HTMLDivElement>(null); // Ref for the clickable location
  // element
  const locationDropdownPanelRef = useRef<HTMLDivElement>(null); // Ref for the dropdown
  // panel
  const [locationDropdownPosition, setLocationDropdownPosition] = useState({ top: 0, left: 0 }); //
  // State for dropdown position

  // State for the shopping cart item count (placeholder) - Now derived from context
  // const [cartItemCount, setCartItemCount] = useState(0);

  // State to control the visibility of the Shopping CartOverlay
  const [isCartOverlayOpen, setIsCartOverlayOpen] = useState(false);

  const router = useRouter();
  const pathname = usePathname(); // Corrected variable name to pathname
  const [isMounted, setIsMounted] = useState(false);

  // Sample address data (replace with actual data fetched from API) - Added 'id'
  const sampleAddress: Address = {
    id: 1, // Added a sample ID
    name: 'Torrens University',
    street: '196 Flinders Street',
    suburb: 'Melbourne',
    state: 'VIC',
    postcode: '3000',
    country: 'Australia',
  };

  useEffect(() => {
    setIsMounted(true);
    const cookies = parseCookies();
    const loggedInCookie = cookies['isLoggedIn'];
    const userMessageCookie = cookies['userMessage'];
    const isLoggedInNow = loggedInCookie === 'true';
    setIsLoggedIn(isLoggedInNow);

    // --- Redirect logic for logged-in users on the root path ---
    // Check if the user is logged in AND the current path is the root ('/')
    if (isLoggedInNow && pathname === '/') {
        router.push('/menu/mainMenu');
        return;
    }
    // --- End Redirect logic ---

    // Existing logic for handling cookies and redirecting if not logged in
    if (!isLoggedInNow && !userMessageCookie) {
      // Set default cookies to false/empty if they are missing
      setCookie(null, 'isLoggedIn', 'false', { path: '/' });
      setCookie(null, 'userMessage', "", { path: '/' });
      setCookie(null, 'userFirstName', "", { path: '/' });
      setCookie(null, 'userLastName', "", { path: '/' });
      setCookie(null, 'userEmail', "", { path: '/' });
      setCookie(null, 'userID', "", { path: '/' });
      setCookie(null, 'profilePictureFileName', "", { path: '/' });
      setCookie(null, 'loginMethod', "", { path: '/' });
    }   
    if (!selectedAddress) {
        setSelectedAddress(sampleAddress);
    }
  }, [pathname, isLoggedIn, setSelectedAddress, selectedAddress, isMounted]); // Add dependencies

  // Effect to handle clicks outside the LOCATION dropdown
  useEffect(() => {
    if (!isMounted) return;
    const handleClickOutside = (event: MouseEvent) => {
      // Check if the click is outside the location dropdown panel AND not on the location button
      if (isLocationOverlayOpen && locationDropdownPanelRef.current && !(event.target
        instanceof Node && locationDropdownPanelRef.current.contains(event.target)) &&
        locationButtonRef.current && !(event.target instanceof Node &&
        locationButtonRef.current.contains(event.target))
      ){
        closeLocationOverlay();
      }
    };

    // Add event listener when the location dropdown is open
    if (isLocationOverlayOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    // Clean up the event listener when the component unmounts or the dropdown closes
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };

  }, [isLocationOverlayOpen, isMounted]); // Re-run effect when the state changes

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen); // Toggle sidebar state
  };

  const handleLogout = async () => {
      console.log("Attempting to log out...");
      try {
          // Call the backend logout endpoint
          const response = await fetch('http://localhost:5000/taste_tailor_logout', {
              method: 'GET', // Assuming logout is a GET request as per app.py
              credentials: 'include', // Ensure session cookie is sent to backend for logout
          });

          if (response.ok) {
              console.log("Backend logout successful.");
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
              setIsLoggedIn(false); // Update state
              // No need to set username/picture here, Sidebar component handles it based on cookies

              // Clear the cart data and cookie using the context function
              clearCart(); // Assuming clearCart is available in the scope

              // Redirect to login page (or home page if login is not required there)
              router.push('/');
          } else {
              // Handle non-OK response
              const contentType = response.headers.get("content-type");
              if (contentType && contentType.indexOf("application/json") !== -1) {
                  const errorData = await response.json(); // Attempt to parse JSON error
                  alert(`Logout failed: ${errorData.error || errorData.message || response.statusText}`); // Show error to user
              } else {
                   // Handle non-JSON error responses (like HTML)
                   const errorText = await response.text();
                   alert(`Logout failed: ${response.status} ${response.statusText}`); // Show generic error
              }
          }
      } catch (error) {
          alert("An unexpected error occurred during logout. Please try again.");
      }
  };


  //-- Location Overlay Functions
  const openLocationOverlay = () => {
    // Only open if mounted
    if (!isMounted || !isLocationOverlayOpen) {
      setIsLocationOverlayOpen(true);

      if (locationButtonRef.current) {
        const rect = locationButtonRef.current.getBoundingClientRect();
        setLocationDropdownPosition({ top: rect.bottom + 8, left: rect.left});
      }
    } else {
      setIsLocationOverlayOpen(false);
    }
  };

  const closeLocationOverlay = () => {
    setIsLocationOverlayOpen(false);
    setAddressInput(""); // Clear input when closing
  };

  const handleAddressSelect = (address: Address) => {
    setSelectedAddress(address); // Use context setter
    closeLocationOverlay();
  };

  const handleAddressInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setAddressInput(event.target.value);
    // In a real application, would use the Google Places API here
    // to fetch address suggestions based on the input value.
    console.log("Address input changed:", event.target.value);
  };

  // Function to simulate getting current location (replace with Geolocation API)
  const getCurrentLocation = () => {
    console.log("Attempting to get current location...");
    // In a real application, would use navigator.geolocation.getCurrentPosition()
    // to get the user's current location and then reverse geocode it using Google Geocoding API
    // to get the address details.
    console.log("Simulating getting current location. Replace with actual Geolocation API call.");
    // For demonstration, let's just select the sample address after a delay
    setTimeout(() => {
      setSelectedAddress(sampleAddress); // Use context setter
      closeLocationOverlay(); // Close overlay after selecting
    }, 1000);
  };

  //--- Search Functions ---
  const handleSearchInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const searchTerm = event.target.value;
    // setSearchInput(searchTerm); // No longer needed here, context manages it
    setSearchTerm(searchTerm); // Update the search term in the context
  };

  const handleSearchSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    // Search filtering is handled by the context provider based on the searchTerm
    console.log("Search submitted:", searchTerm);
  };

  //--- Shopping Cart Overlay Functions ---
  const openCartOverlay = () => {
    if (!isMounted) return;
    setIsCartOverlayOpen(true);
  };

  const closeCartOverlay = () => {
    setIsCartOverlayOpen(false);
  };

  // Get the live cart item count from the context
  const liveCartItemCount = getCartItemCount();

  // Determine header background based on pathname (example)
  const isProfilePage = pathname.startsWith('/profile');
  const headerBgClass = isProfilePage ?  'bg-black rounded-2xl' : 'bg-white border-b border-gray-200';
  const linkColorClass = isProfilePage ? 'text-white' : 'text-gray-800';

  return (
    <header className={`flex items-center justify-between p-2 relative ${headerBgClass}`}>
      {/* Group 1: Left Section (Sidebar Toggle, Logo, Title) */}
      <div className="flex items-center gap-4">
        {/* Sidebar Toggle Button (Conditionally render if logged in) */}
        {isLoggedIn ? (
          <div className="relative overflow-hidden">
            <button
              onClick={toggleSidebar}
              className={`p-2 rounded-md shadow-lg focus:outline-none z-50 relative transition-colors duration-200 ${isProfilePage ? 'bg-blue-500 text-white hover:bg-green-400' : 'bg-blue-500 text-white hover:bg-green-400'}`}
              aria-label="Toggle Profile Dashboard"
            >
              <Menu size={24} />
            </button>
            {/* Sidebar Overlay Background */}
            <div
              className={`fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity
                duration-300 ${
                isSidebarOpen ? 'opacity-50 visible' : 'opacity-0 invisible'
              }`}
              onClick={toggleSidebar}
            ></div>
            {/* Sidebar Component */}
            <div
              className={`fixed top-0 left-0 h-full w-64 bg-white shadow-xl transform
                transition-transform duration-300 ease-in-out z-50 ${
                isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
              }`}
            >
              <Sidebar />
            </div>
          </div>
        ) : <></>} {/* Render empty fragment if not logged in */}

        {/* Logo and Title */}
        <div className="flex items-start gap-4"> {/* Explicitly set classes */}
          <Link className={`font-semibold text-2xl ${linkColorClass}`} href="/">
            <Image
              src="/images/logo/logo.png"
              alt="Logo"
              width={40}
              height={40}
              className="rounded-lg"
            />
          </Link>
          <Link className={`text-left font-semibold text-2xl mt-1 ${linkColorClass}`}
            href="/">Taste Tailor</Link>
        </div>
      </div>

      {/* --- Group 2: Middle Section (Location Input, Search Bar, Shopping Cart) --- */}
      {/* Conditionally render this entire div only if mounted on the client */}
      {isMounted ? (
          <div className="flex items-center flex-grow justify-around gap-4 mx-4">
            {/* Location Input */}
            <div
              ref={locationButtonRef}
              className={`flex items-center border rounded-full px-4 py-2 shadow-sm cursor-pointer hover:bg-opacity-80 transition-colors duration-200 ${isProfilePage ? 'border-gray-600 hover:bg-gray-800 text-white' : 'border-gray-300 hover:bg-gray-100'}`}
              onClick={openLocationOverlay}
            >
              <MapPin size={20} className={`mr-2 ${isProfilePage ? 'text-gray-300' : 'text-gray-600'}`} />
              <div className="flex flex-col text-sm">
                <span className={`${isProfilePage ? 'text-gray-400' : 'text-gray-500'}`}>Delivery to</span>
                <span className={`font-semibold whitespace-nowrap overflow-hidden text-ellipsis max-w-[150px] ${isProfilePage ? 'text-white' : 'text-gray-800'}`}>
                    {selectedAddress ? `${selectedAddress.name || selectedAddress.street}, ${selectedAddress.suburb}` : 'Select Address'}
                </span>
              </div>
              <ChevronDown size={16} className={`ml-2 ${isProfilePage ? 'text-gray-400' : 'text-gray-600'}`} />
            </div>
            {/* Search Bar */}
            <form onSubmit={handleSearchSubmit} className="flex items-center flex-grow max-w-md">
              <div className={`relative flex items-center w-full rounded-full px-4 py-2 focus-within:ring-2 focus-within:ring-blue-500 transition-colors duration-200 ${isProfilePage ? 'bg-gray-700 focus-within:bg-gray-600' : 'bg-gray-100 focus-within:bg-white'}`}>
                <Search size={20} className={`mr-2 ${isProfilePage ? 'text-gray-400' : 'text-gray-500'}`} />
                <input
                  type="text"
                  placeholder="Search Taste Tailor"
                  className={`outline-none bg-transparent flex-grow ${isProfilePage ? 'text-gray-300 placeholder-gray-400' : 'text-gray-700'}`}
                  value={searchTerm}
                  onChange={handleSearchInputChange}
                />
              </div>
            </form>
            {/* Shopping Cart Icon */}
            <div
              className="relative cursor-pointer"
              onClick={openCartOverlay}
              aria-label="Open shopping cart"
            >
              <ShoppingCart size={24} className={`${isProfilePage ? 'text-slate-300 hover:text-white' : 'text-gray-600 hover:text-gray-800' } transition-colors duration-200`} />
              {liveCartItemCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold
                  rounded-full h-5 w-5 flex items-center justify-center">
                  {liveCartItemCount}
                </span>
              )}
            </div>
          </div>
      ) : (
          <div className="flex items-center flex-grow justify-around gap-4 mx-4">
              {/* Optional: Add a simple loading indicator or empty space here */}
              {/* <div className="text-gray-500">Loading Header...</div> */}
          </div>
      )}
      {/* --- End Group 2 --- */}


      {/* Group 3: Right Section (Auth Links) */}
      <div className={`flex items-center gap-8 ${isProfilePage ? 'text-white font-semibold' : 'text-gray-800'}`}>
        <nav className="flex items-center gap-6 mr-2">
          {isLoggedIn ? (
            <div className="flex items-center gap-6">
              <button className={`rounded-full px-6 py-2 cursor-pointer transition-colors duration-300 shadow-md hover:shadow-lg focus:outline-none focus:ring-3 focus:ring-red-400 focus:ring-opacity-75 active:bg-red-700 font-semibold text-lg ${isProfilePage ? 'my-logout-element hover:my-logout-element-hover text-white' : 'bg-red-500 text-white hover:bg-red-600'}`}
                 onClick={handleLogout}>Log Out</button>
            </div>
          ) : (
            <div className="flex items-center gap-6">
              <Link className={`rounded-full px-6 py-2 cursor-pointer transition-colors duration-300 shadow-md hover:shadow-lg focus:outline-none focus:ring-3 focus:ring-green-400 focus:ring-opacity-75 font-semibold text-lg ${isProfilePage ? 'my-login-element hover:my-login-element-hover text-white' : 'bg-green-500 text-white hover:bg-green-600'}`}
                href="/auth/login">Log In</Link>
              <Link className={`rounded-full px-6 py-2 cursor-pointer transition-colors duration-300 shadow-md hover:shadow-lg focus:outline-none focus:ring-3 focus:ring-blue-400 focus:ring-opacity-75 font-semibold text-lg ${isProfilePage ? 'my-signup-element hover:my-signup-element-hover text-white' : 'bg-blue-500 text-white hover:bg-blue-600'}`}
                href="/auth/register">Sign Up</Link>
            </div>
          )}
        </nav>
      </div>

      {/* Location Selection Overlay (Dropdown Style) */}
      {/* Conditionally render this overlay only if mounted and open */}
      {isMounted && isLocationOverlayOpen && (
        <div
          ref={locationDropdownPanelRef}
          className="absolute z-[100] w-80 bg-white rounded-lg shadow-xl p-4 border border-
            gray-200"
          style={{ top: locationDropdownPosition.top, left: locationDropdownPosition.left }}
        >
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-800">Enter Your Address</h3>
            <button onClick={closeLocationOverlay} aria-label="Close address selection">
              <X size={20} className="text-gray-500 hover:text-gray-700" />
            </button>
          </div>
          <div className="mb-4">
            <div className="flex items-center border border-gray-300 rounded-md px-3 py-2
              focus-within:ring-2 focus-within:ring-blue-500">
              <MapPin size={20} className="text-gray-500 mr-2" />
              <input
                type="text"
                placeholder="Address"
                className="outline-none bg-transparent flex-grow text-gray-700"
                value={addressInput}
                onChange={handleAddressInputChange}
              />
            </div>
          </div>
          <div className="space-y-3">
            <div
              className="flex items-center p-3 border border-gray-200 rounded-md cursor-
                pointer hover:bg-gray-100 transition-colors duration-200"
              onClick={() => handleAddressSelect(sampleAddress)}
            >
              {selectedAddress?.id === sampleAddress.id ? (
                <CircleDot size={20} className="text-blue-500 mr-3" />
              ) : (
                <Circle size={20} className="text-gray-400 mr-3" />
              )}
              <div>
                <div className="font-semibold text-gray-800">{sampleAddress.name}</div>
                <div className="text-sm text-gray-600">{`${sampleAddress.street},
                  ${sampleAddress.suburb}`}</div>
              </div>
              <div className="ml-auto">
                <Pencil size={16} className="text-gray-500 hover:text-gray-700" />
              </div>
            </div>
            <div
              className="flex items-center p-3 border border-gray-200 rounded-md cursor-
                pointer hover:bg-gray-100 transition-colors duration-200"
              onClick={getCurrentLocation}
            >
              <MapPin size={20} className="text-green-500 mr-3" />
              <div className="font-semibold text-green-700">Use Current Location</div>
            </div>
          </div>
        </div>
      )}

      {/* Render the ShoppingCartOverlay */}
      {/* Conditionally render this overlay only if mounted and open */}
      {isMounted && <ShoppingCartOverlay isOpen={isCartOverlayOpen} onClose={closeCartOverlay} />}

    </header>
  );
}