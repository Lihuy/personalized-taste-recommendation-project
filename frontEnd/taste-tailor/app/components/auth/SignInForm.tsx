'use client'

import Checkbox from "@/components/form/input/Checkbox";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import Button from "@/components/ui/button/Button";
import Left from "@/icons/Left";
import Eye from "@/icons/Eye";
import EyeClosed from "@/icons/EyeClosed";
import Image from "next/image";
import Link from "next/link";
import React, { useState, useEffect } from "react"; // Import useEffect
import { setCookie, destroyCookie } from 'nookies'; // Import destroyCookie
import { useRouter } from 'next/navigation';

export default function SignInForm() {
    // Initialize state with empty strings or appropriate initial values
    const [email, setEmail] = useState(""); // Changed initial value
    const [password, setPassword] = useState(""); // Changed initial value
    const [showPassword, setShowPassword] = useState(false);
    const [isChecked, setIsChecked] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();

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
                console.log("CSRF token fetched successfully.");

            } catch (error: any) {
                console.error('Error fetching CSRF token:', error);
                setCsrfError('Could not load form. Please try again later.');
                setIsLoading(false); // Prevent form submission if token fetch fails
            }
        };

        fetchCsrfToken();
    }, []); // Empty dependency array ensures this runs only once on mount
    // --- End Fetch CSRF token ---


    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setErrorMessage('');
      setSuccessMessage('');
      console.log("handleSubmit triggered!");

      // --- Prevent submission if CSRF token is not loaded ---
      if (!csrfToken || csrfError) {
          setErrorMessage(csrfError || 'CSRF token not loaded. Cannot submit form.');
          return;
      }
      // --- End Prevent submission ---

      setIsLoading(true);

      // Basic validation (optional)
      if (!email || !password) {
          setErrorMessage("Please enter your email and password.");
          setIsLoading(false);
          return;
      }

      try {
        const response = await fetch('http://localhost:5000/taste_tailor_login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            // --- Include CSRF token in the X-CSRFToken header ---
            'X-CSRFToken': csrfToken, // Flask-WTF checks this header by default
          },
          // Include credentials so Flask-Login can set the session cookie
          credentials: 'include', // This is crucial for the browser to send the session cookie
          body: JSON.stringify({
            email: email,
            password: password,
            // --- Optionally include CSRF token in the body if WTF_CSRF_CHECK_JSON = True ---
            // csrf_token: csrfToken, // Include if backend is configured to check JSON body
          }),
        });

        // Check if the response indicates a redirect (status 3xx)
        if (response.redirected) {
             // If redirected, it means Flask-Login handled the redirect after successful login.
             // The browser will follow the redirect, and the target page should now have the session cookie.
             // Using window.location.href for a full page reload is often necessary after backend redirects
             window.location.href = response.url;
             return; // Stop further processing in this function
        }

        // --- Handle JSON response if no redirect occurred ---
        const contentType = response.headers.get("content-type");
        if (!response.ok) {
            if (contentType && contentType.indexOf("application/json") !== -1) {
                 const data = await response.json();
                 // Display backend error message
                 setErrorMessage(data.message || 'An error occurred during login.');
            } else {
                 // Handle non-JSON error responses (like the HTML CSRF error)
                 const errorText = await response.text();
                 console.error("Backend returned non-JSON error response:", errorText);
                 // Attempt to extract a friendly message from the HTML
                 const parser = new DOMParser();
                 const htmlDoc = parser.parseFromString(errorText, 'text/html');
                 const errorMessageElement = htmlDoc.querySelector('h1') || htmlDoc.querySelector('p');
                 const friendlyErrorMessage = errorMessageElement ? errorMessageElement.textContent : 'Unknown server error.';
                 setErrorMessage(`Login failed: ${response.status} ${response.statusText}. Server message: ${friendlyErrorMessage}`);
            }
        } else {
            // If response is OK (status 2xx), it should be JSON with success message
            const data = await response.json();
            if (data.message === "Login successful") {
                console.log("Login POST successful, received JSON response.");
                // Set frontend cookies
                setCookie(null, 'isLoggedIn', 'true', { path: '/' });
                setCookie(null, 'userMessage', data.profile, { path: '/' });
                setCookie(null, 'userFirstName', data.firstName, { path: '/' });
                setCookie(null, 'userLastName', data.lastName, { path: '/' });
                setCookie(null, 'userEmail', data.email, { path: '/' });
                setCookie(null, 'userID', data.id, { path: '/' });
                setCookie(null, 'profilePictureFileName', data.profilePicture, { path: '/' });

                setSuccessMessage(data.profile);

                // --- Backend Session Verification ---
                // Make a GET request to a protected endpoint to verify the backend session is active.
                // This is a good practice to ensure the session cookie is working.
                try {
                    const sessionCheckResponse = await fetch('http://localhost:5000/taste_tailor_google_api', { // Use your protected endpoint
                        method: 'GET',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        // Include credentials so the browser sends the Flask-Login session cookie
                        credentials: 'include',
                    });

                    if (sessionCheckResponse.ok) {
                        console.log("Backend session verified successfully.");
                        // Backend session is active, now redirect to the main menu
                        router.push('/menu/mainMenu');
                    } else {
                        // Backend session check failed, even though login POST was ok.
                        // This is unexpected and might indicate a cookie/session issue.
                        console.error("Backend session verification failed after login.", sessionCheckResponse.status);
                        setErrorMessage("Login successful, but session verification failed. Please try again.");
                        // Optionally log out the user on the backend here if session check fails
                        // This helps prevent a partial login state
                        await fetch('http://localhost:5000/taste_tailor_logout', { method: 'GET', credentials: 'include' });
                        destroyCookie(null, 'isLoggedIn', { path: '/' }); // Clear frontend cookie
                    }
                } catch (sessionCheckError) {
                    console.error("Error during backend session verification:", sessionCheckError);
                    setErrorMessage("Login successful, but an error occurred during session verification. Please try again.");
                     // Optionally log out the user on the backend here if session check fails
                    await fetch('http://localhost:5000/taste_tailor_logout', { method: 'GET', credentials: 'include' });
                    destroyCookie(null, 'isLoggedIn', { path: '/' }); // Clear frontend cookie
                }
                // --- End Backend Session Verification ---

            } else {
                 // Handle unexpected success response format
                 setErrorMessage(data.message || 'Login failed with an unexpected response.');
            }
        }
        // --- End Handle JSON response ---

      } catch (error) {
        console.error('Login failed:', error);
        setErrorMessage('An unexpected error occurred during login.');
      }
      setIsLoading(false);
    };

    const handleGoogleSignIn = async (e: React.FormEvent) => {
      e.preventDefault(); // Prevent default form submission
      // Ensure credentials are included for the initial Google redirect as well
      // The browser handles credentials for redirects, so just setting window.location.href is sufficient.
      window.location.href = 'http://localhost:5000/google/';
    };

    const handleFacebookSignIn = async (e: React.FormEvent) => {
       e.preventDefault(); // Prevent default form submission
       // Ensure credentials are included for the initial Facebook redirect as well
       // The browser handles credentials for redirects, so just setting window.location.href is sufficient.
      window.location.href = 'http://localhost:5000/facebook/';
    };

  return (
    <div className="w-full flex flex-col flex-1 items-center justify-center">
      <div className="w-full max-w-md sm:pt-10 mx-auto mb-5">
        <Link
          href="/"
          className="inline-flex items-center text-sm text-slate-600 transition-colors hover:text-black"
        >
          <Left />
          <span className="ml-2">Back to Home Page</span>
        </Link>
      </div>
      <div className="flex flex-col justify-center flex-1 w-full max-w-md mx-auto">
        <div>
          <div className="flex items-center justify-center mb-2">
            <Image
              className="rounded-lg"
              src="/images/logo/Logo.png"
              alt="Taste tailor logo"
              width="60"
              height="60"
            />
          </div>
          <div className="mb-5 sm:mb-8">
            <h1 className="mb-2 font-semibold text-gray-800 text-center text-title-sm sm:text-title-md">
              Sign In to Taste Tailor
            </h1>
            <p className="text-sm text-gray-500 text-center">
              Enter your email and password to sign in!
            </p>
          </div>
          {/* Display CSRF fetch error if any */}
          {csrfError && <p className="text-md text-center mb-8 text-red-700">{csrfError}</p>}
          {/* Display registration error */}
          {errorMessage && <p className="text-md text-center mb-8 text-red-700">{errorMessage}</p>}
          {/* Display success message */}
          {successMessage && <p className="text-md text-center mb-8 text-green-500">{successMessage}</p>}
          <div>
            {/* Disable form or show loading state while fetching CSRF token */}
            {csrfToken === null ? (
                 <p className="text-center text-gray-500">Refresh to load the login form...</p>
             ) : (
            <form onSubmit={handleSubmit}>
              <div className="space-y-6">
                <div>
                  <Label htmlFor="email"> {/* Added htmlFor */}
                    Email <span className="text-gray-500">*</span>{" "}
                  </Label>
                  <Input
                    type="email"
                    id="email" // Added id
                    name="email" // Added name
                    disabled={isLoading}
                    placeholder="Enter your email" // Changed placeholder
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="password"> {/* Added htmlFor */}
                    Password <span className="text-gray-500">*</span>{" "}
                  </Label>
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      id="password" // Added id
                      name="password" // Added name
                      disabled={isLoading}
                      placeholder="Enter your password"
                      onChange={(e) => setPassword(e.target.value)}
                    />
                    <span
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute z-30 -translate-y-1/2 cursor-pointer right-4 top-1/2"
                    >
                      {showPassword ? (
                        <Eye className="size-6 fill-slate-200" />
                      ) : (
                        <EyeClosed className="size-6 fill-slate-200" />
                      )}
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Checkbox checked={isChecked} onChange={setIsChecked} id="keepLoggedIn"/> {/* Added id */}
                    <Label htmlFor="keepLoggedIn" className="block font-normal text-gray-700 text-theme-sm cursor-pointer"> {/* Added Label and htmlFor */}
                      Keep me logged in
                    </Label>
                  </div>
                  <Link
                    href="/reset-password"
                    className="text-sm text-brand-500 hover:text-brand-600"
                  >
                    Forgot password?
                  </Link>
                </div>
                {/* --- Login Button (Submit) --- */}
                <div>
                    <button
                        type="submit" // This button submits the form
                        className="w-full text-white mt-2 py-3 px-7 bg-black rounded-lg cursor-pointer transition-colors hover:bg-green-700 hover:text-black disabled:opacity-50"
                        disabled={isLoading || !csrfToken} // Disable while loading or token is missing
                    >
                        {isLoading ? 'Signing In...' : 'Login'}
                    </button>
                </div>
                {/* --- End Login Button --- */}

                <div className="relative py-3 sm:py-5">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-200"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="p-2 text-slate-600 bg-white sm:px-5 sm:py-2">
                      Or
                    </span>
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-1 sm:gap-5">
                  <button
                    className="inline-flex items-center justify-center gap-3 py-3 text-sm font-normal italic text-white transition-colors bg-black rounded-lg px-7 hover:bg-green-700 hover:text-black"
                    onClick={handleGoogleSignIn}
                  >
                    <Image
                      src="/images/logo/Google.png"
                      alt="Goole logo"
                      width="25"
                      height="25"
                    />
                    Sign in with Google
                  </button>
                  <button
                    className="inline-flex items-center justify-center gap-3 py-3 text-sm font-normal italic text-white transition-colors bg-black rounded-lg px-7 hover:bg-green-700 hover:text-black"
                    onClick={handleFacebookSignIn}
                  >
                    <Image
                      src="/images/logo/Facebook.png"
                      alt="Facebook logo"
                      width="40"
                      height="40"
                    />
                    Sign in with Facebook
                  </button>
                </div>
                {/* --- Removed duplicate "Sign in" button ---
                <div>
                  <Button className="w-full" size="sm">
                    Sign in
                  </Button>
                </div>
                */}
              </div>
            </form>
             )} {/* End conditional rendering based on csrfToken */}

            <div className="flex items-center justify-center mt-5"> {/* Added margin-top */}
              <p className="text-sm font-normal text-center text-gray-700 sm:text-start">
                Don&apos;t have an account ? {""}
                <Link
                  href="/signup"
                  className="text-pink-600 hover:text-red-600 mx-1"
                >
                  Sign Up
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}