'use client'

import React, { useState, useEffect } from 'react'; // Import useEffect
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import Eye from "@/icons/Eye";
import EyeClosed from "@/icons/EyeClosed";
// Assuming Button component is needed, although it was commented out in the original
// import Button from "@/components/ui/button/Button";

// Functional component for the Personal Info page
interface PersonalSecurityUpdateProps {
  userID: string; // Assuming userID is passed as a prop
}

const PersonalSecurityUpdate: React.FC<PersonalSecurityUpdateProps> = ({ userID }) => {
  const [oldPassword, setOldPassword] = useState(''); // Initialize with empty string for input
  const [newPassword, setNewPassword] = useState(''); // Initialize with empty string for input
  const [confirmPassword, setConfirmPassword] = useState(''); // Initialize with empty string for input
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // --- State for CSRF Token ---
  const [csrfToken, setCsrfToken] = useState<string | null>(null);
  const [csrfError, setCsrfError] = useState<string | null>(null);
  // --- End State for CSRF Token ---

  // --- Fetch CSRF token on component mount ---
  useEffect(() => {
    const fetchCsrfToken = async () => {
      try {
        // Fetch CSRF token from backend
        // --- IMPORTANT: Include credentials (cookies) ---
        const response = await fetch('http://localhost:5000/get-csrf-token', {
          credentials: 'include' // This is crucial for the backend to set the session cookie
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch CSRF token: ${response.statusText}`);
        }

        const data = await response.json();
        setCsrfToken(data.csrf_token);
        setCsrfError(null); // Clear any previous errors
        console.log("CSRF token fetched successfully for PersonalSecurityUpdate.");

      } catch (error: any) {
        console.error('Error fetching CSRF token for PersonalSecurityUpdate:', error);
        setCsrfError('Could not load form. Please try again later.');
        setIsLoading(false); // Prevent form submission if token fetch fails
      }
    };

    fetchCsrfToken();
  }, []); // Empty dependency array ensures this runs only once on mount
  // --- End Fetch CSRF token ---


  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');
    console.log("handlePasswordChange triggered!");

    // --- Prevent submission if CSRF token is not loaded ---
    if (!csrfToken || csrfError) {
      setErrorMessage(csrfError || 'Form not loaded. Cannot submit.');
      return;
    }
    // --- End Prevent submission ---

    setIsLoading(true);

    // Basic frontend validation
    if (!oldPassword || !newPassword || !confirmPassword) {
        setErrorMessage("All password fields are required.");
        setIsLoading(false);
        return;
    }

    if (newPassword !== confirmPassword) {
        setErrorMessage("New password and confirmation password do not match.");
        setIsLoading(false);
        return;
    }

    // Optional: Add more password strength validation here if needed
    // Example: Check for minimum length, mix of characters, etc.
    // if (newPassword.length < 8) {
    //     setErrorMessage("New password must be at least 8 characters long.");
    //     setIsLoading(false);
    //     return;
    // }


    try {
      const response = await fetch('http://localhost:5000/taste_tailor_update_password', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          // --- Include CSRF token in the X-CSRFToken header ---
          'X-CSRFToken': csrfToken, // Include the fetched CSRF token
        },
        // Include credentials so the browser sends the Flask-Login session cookie
        credentials: 'include', // This is crucial for the browser to send the session cookie
        body: JSON.stringify({
          id: userID,
          old_password: oldPassword,
          new_password: newPassword,
          confirm_password: confirmPassword
        }),
      });

      // Check if the response is a redirect (status 3xx)
      if (response.redirected) {
           console.warn("Password update request redirected. User likely not authenticated on backend.");
           // The browser will follow the redirect to the login page.
           // Might want to handle this on the frontend, e.g., redirect to login page.
           // import { useRouter } from 'next/navigation';
           // const router = useRouter();
           // router.push('/auth/login'); // Example: Redirect to frontend login page
           // For now, we'll let the browser handle the redirect.
           setIsLoading(false); // Stop loading state
           return; // Stop further processing
      }

      // --- Handle JSON response if no redirect occurred ---
      const contentType = response.headers.get("content-type");
      if (!response.ok) { // Check for non-2xx status codes
           if (contentType && contentType.indexOf("application/json") !== -1) {
                const data = await response.json();
                // Handle JSON error response from backend
                setErrorMessage(data.error || data.message || `Failed to update password: ${response.statusText}`);
           } else {
                // Handle non-JSON error responses (like HTML CSRF error)
                const errorText = await response.text();
                console.error("Backend returned non-JSON error response for password update:", errorText);
                // Attempt to extract a friendly message from the HTML
                const parser = new DOMParser();
                const htmlDoc = parser.parseFromString(errorText, 'text/html');
                const errorMessageElement = htmlDoc.querySelector('h1') || htmlDoc.querySelector('p');
                const friendlyErrorMessage = errorMessageElement ? errorMessageElement.textContent : 'Unknown server error.';
                setErrorMessage(`Password update failed: ${response.status} ${response.statusText}. Server message: ${friendlyErrorMessage}`);
           }
      } else {
          // If response is OK (status 2xx), it should be JSON with success message
          const data = await response.json();
          setSuccessMessage(data.message || "Password updated successfully."); // Use backend message or a default
          // Clear fields on success
          setOldPassword('');
          setNewPassword('');
          setConfirmPassword('');
          // Optionally clear CSRF token state to force a re-fetch if needed for subsequent actions
          // setCsrfToken(null);
      }
      // --- End Handle JSON response ---

    } catch (error) {
      console.error('Password update failed:', error);
      setErrorMessage('An unexpected error occurred during password update.');
    }
    setIsLoading(false);
  };

  return (
    <>
      {/* Main Content Area - Modified to include profile details */}
      <div className="flex-1 p-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Security info</h1>
        {/* Profile Section based on the second image */}
        {/* Display Error Message */}
        {errorMessage && <p className="text-md text-center mb-8 text-red-700">{errorMessage}</p>}
        {/* Display Success Message */}
        {successMessage && <p className="text-md text-center mb-8 text-green-500">{successMessage}</p>}

         {/* --- Conditional rendering while fetching CSRF token --- */}
         {csrfToken === null ? (
             <p className="text-center text-gray-500">Loading form...</p>
         ) : csrfError ? (
              <p className="text-center text-red-700">{csrfError}</p>
         ) : (
         // --- Form and content are displayed once token is loaded ---
         <>
            <div className="flex flex-col items-center md:flex-row md:items-start mb-6">
              {/* Input Fields */}
              <div className="w-full">
                {/* Old Password Input */}
                <div className='relative'>
                  <Label htmlFor="oldPassword">
                    Enter old password <span className="text-gray-500">*</span>{" "}
                  </Label>
                  <Input
                    type={showOldPassword ? "text" : "password"}
                    id="oldPassword"
                    name="old_password" // Use backend field name
                    disabled={isLoading}
                    placeholder="Enter old password!" // Placeholder text
                    onChange={(e) => setOldPassword(e.target.value)}
                  />
                  <span
                    onClick={() => setShowOldPassword(!showOldPassword)}
                    className="absolute z-30 -translate-y-1/2 cursor-pointer right-4 top-1/2 bottom-1/2"
                  >
                    {showOldPassword ? (
                      <Eye className="size-6 fill-slate-200" />
                    ) : (
                      <EyeClosed className="size-6 fill-slate-200" />
                    )}
                  </span>
                </div>
                {/* New Password Input */}
                <div className='relative mt-4'> {/* Added mt-4 for spacing */}
                  <Label htmlFor="newPassword">
                    Enter new password <span className="text-gray-500">*</span>{" "}
                  </Label>
                  <Input
                    type={showNewPassword ? "text" : "password"}
                    id="newPassword"
                    name="new_password" // Use backend field name
                    disabled={isLoading}
                    placeholder="Enter new password!" // Placeholder text
                    onChange={(e) => setNewPassword(e.target.value)}
                  />
                  <span
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute z-30 -translate-y-1/2 cursor-pointer right-4 top-1/2 bottom-1/2"
                  >
                    {showNewPassword ? (
                      <Eye className="size-6 fill-slate-200" />
                    ) : (
                      <EyeClosed className="size-6 fill-slate-200" />
                    )}
                  </span>
                </div>
                {/* Confirm Password Input */}
                <div className='relative mt-4'> {/* Added mt-4 for spacing */}
                  <Label htmlFor="confirmPassword">
                    Confirmation password <span className="text-gray-500">*</span>{" "}
                  </Label>
                  <Input
                    type={showConfirmPassword ? "text" : "password"}
                    id="confirmPassword"
                    name="confirm_password" // Use backend field name
                    disabled={isLoading}
                    placeholder="Enter password again!" // Placeholder text
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                  <span
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute z-30 -translate-y-1/2 cursor-pointer right-4 top-1/2 bottom-1/2"
                  >
                    {showConfirmPassword ? (
                      <Eye className="size-6 fill-slate-200" />
                    ) : (
                      <EyeClosed className="size-6 fill-slate-200" />
                    )}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex justify-center mt-6"> {/* Added mt-6 for spacing */}
              <button
                className="w-full max-w-xs bg-green-600 text-white py-3 rounded-md hover:bg-green-800 focus:outline-none focus:ring-2 focus:ring-green-700 focus:ring-opacity-50 transition duration-300 disabled:opacity-50 disabled:cursor-not-allowed" // Added max-w-xs and disabled styles
                onClick={handlePasswordChange}
                disabled={isLoading || !csrfToken} // Disable button while loading or token is missing
              >
                {isLoading ? 'Updating...' : 'Confirm'} {/* Change button text while loading */}
              </button>
            </div>
         </>
         )} {/* End conditional rendering */}
      </div>
    </>
  );
};

export default PersonalSecurityUpdate;