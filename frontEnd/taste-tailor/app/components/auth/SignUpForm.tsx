"use client";

import Checkbox from "@/components/form/input/Checkbox";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import Left from "@/icons/Left";
import Eye from "@/icons/Eye";
import EyeClosed from "@/icons/EyeClosed";
import Image from "next/image";
import Link from "next/link";
import React, { useState, useEffect } from "react"; // Import useEffect

export default function SignUpForm() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState(""); // Corrected syntax: setEmail = useState("") -> setEmail = useState("")
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false); // Corrected syntax: setShowPassword = useState(false) -> setShowPassword = useState(false)
  const [isChecked, setIsChecked] = useState(false);
  const [errorMessage, setErrorMessage] = useState(""); // Corrected syntax: setErrorMessage = useState(") -> setErrorMessage = useState("")
  const [successMessage, setSuccessMessage] = useState(""); // Corrected syntax: setSuccessMessage = useState(") -> setSuccessMessage = useState("")
  const [isLoading, setIsLoading] = useState(false); // Corrected syntax: setisLoading = useState(false) -> setIsLoading = useState(false)

  // State to store CSRF token (string or null)
  const [csrfToken, setCsrfToken] = useState<string | null>(null); // Corrected syntax: useState string null>(null) -> useState<string | null>(null)

  // State to handle CSRF token fetch errors (string or null)
  const [csrfError, setCsrfError] = useState<string | null>(null); // Corrected syntax: useState string null>(null) -> useState<string | null>(null)


  // --- Fetch CSRF token on component mount ---
  useEffect(() => {
    const fetchCsrfToken = async () => {
      try {
        // Ensure this URL is correct for backend's CSRF token endpoint
        // --- IMPORTANT: Include credentials (cookies) in the fetch request ---
        const response = await fetch('http://localhost:5000/get-csrf-token', {
            credentials: 'include' // This tells the browser to send cookies
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch CSRF token: ${response.statusText}`); // Corrected f-string syntax
        }

        const data = await response.json();
        setCsrfToken(data.csrf_token);
        setCsrfError(null); // Clear any previous errors

      } catch (error: any) { // Use 'any' or a more specific error type if preferred
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
    setErrorMessage(""); // Corrected syntax
    setSuccessMessage(""); // Corrected syntax

    // Prevent submission if CSRF token is not loaded or there was an error
    if (!csrfToken || csrfError) {
      setErrorMessage(csrfError || 'CSRF token not loaded. Cannot submit form.');
      return;
    }

    setIsLoading(true); // Corrected syntax

    // Basic validation (optional, but good practice)
    if (!firstName || !lastName || !email || !password || !isChecked) {
        setErrorMessage("Please fill in all required fields and accept terms.");
        setIsLoading(false); // Corrected syntax
        return;
    }

    try {
      // Ensure the URL is correct for backend's registration endpoint
      const response = await fetch('http://localhost:5000/taste_tailor_register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // --- Include CSRF token in the X-CSRFToken header ---
          'X-CSRFToken': csrfToken, // This is a standard place Flask-WTF checks
          // We will also include it in the body as per the backend expectation with
          // WTF_CSRF_CHECK_JSON = True
        },
        // --- IMPORTANT: Include credentials (cookies) in the fetch request ---
        credentials: 'include', // This tells the browser to send cookies
        // Send the state values and the CSRF token in the request body
        body: JSON.stringify({
            firstName,
            lastName,
            email,
            password,
            csrf_token: csrfToken, // Still include in body for WTF_CSRF_CHECK_JSON
        }),
      });

      // --- Improved Error Handling for Non-JSON Responses ---
      const contentType = response.headers.get("content-type");
      if (!response.ok) {
          if (contentType && contentType.indexOf("application/json") !== -1) {
              // If the response is JSON, parse it and get the error message
              const data = await response.json();
              if (data.errors) {
                  const otherErrors = Object.entries(data.errors)
                      .filter(([field]) => field !== 'csrf_token')
                      .map(([, errorList]) => errorList) // Corrected syntax: $.map(...) -> map(...)
                      .flat();

                  if (otherErrors.length > 0) {
                       setErrorMessage(otherErrors.join(", ")); // Join array into a single string
                  } else if (data.errors.csrf_token) {
                       setErrorMessage(data.message || 'CSRF token validation failed.');
                  } else {
                       setErrorMessage(data.message || 'An error occurred during registration.');
                  }
              } else {
                  setErrorMessage(data.message || 'An error occurred during registration.');
              }
          } else {
              // If the response is not JSON (e.g., HTML error page), read it as text
              const errorText = await response.text();
              console.error("Backend returned non-JSON error response:", errorText);
              // Attempt to extract a more friendly message from the HTML if possible
              const parser = new DOMParser();
              const htmlDoc = parser.parseFromString(errorText, 'text/html');
              const errorMessageElement = htmlDoc.querySelector('h1') || htmlDoc.querySelector('p');
              const friendlyErrorMessage = errorMessageElement ? errorMessageElement.textContent : 'Unknown server error.';

              setErrorMessage(`Registration failed: ${response.status} ${response.statusText}. Server message: ${friendlyErrorMessage}`); // Corrected f-string syntax
          }
      } else {
          // If the response is OK (status 2xx), it should be JSON
          const data = await response.json();
          setSuccessMessage(data.message);
          // Optionally clear the form fields on successful registration
          setFirstName("");
          setLastName("");
          setEmail("");
          setPassword("");
          setIsChecked(false);
          setCsrfToken(null); // Invalidate token after use (optional, depends on backend)
      }
      // --- End Improved Error Handling ---

    } catch (error: any) { // Use 'any' or a more specific error type if preferred
      console.error('Registration failed:', error);
      setErrorMessage('An unexpected error occurred during registration.');
    }
    setIsLoading(false); // Corrected syntax
  };

  return (
    <div className="w-full flex flex-col flex-1 items-center justify-center">
      <div className="w-full max-w-md sm:pt-10 mx-auto mb-5">
        <Link
          href="/"
          className="inline-flex items-center text-sm text-slate-600 transition-colors hover:text-black"
        >
          <Left />
          <span className="ml-2">Back to dashboard</span>
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
              Sign Up for Taste Tailor
            </h1>
            <p className="text-sm text-gray-500 text-center">
              Enter your email and password to sign up!
            </p>
          </div>
          {/* Display CSRF fetch error if any */}
          {csrfError && <p className="text-md text-center mb-8 text-red-700">{csrfError}</p>}
          {/* Display registration error */}
          {errorMessage && <p className="text-md text-center mb-8 text-red-700">{errorMessage}</p>} {/* Corrected syntax */}
          {/* Display success message */}
          {successMessage && <p className="text-md text-center mb-8 text-green-500">{successMessage}</p>} {/* Corrected syntax */}

          <div>
            {/* Disable form or show loading state while fetching CSRF token */}
            {csrfToken === null ? (
                <p className="text-center text-gray-500">Refresh the page to load sign up form...</p>
            ) : (
            <form onSubmit={handleSubmit}>
              <div className="space-y-5">
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                  {/* */}
                  <div className="sm:col-span-1">
                    <Label htmlFor="fname">
                      First Name<span className="text-gray-500">*</span>
                    </Label>
                    <Input
                      type="text"
                      id="fname"
                      name="firstName"
                      disabled={isLoading}
                      placeholder="Enter your first name"
                      onChange={(e) => setFirstName(e.target.value)}
                    />
                  </div>
                  {/* */}
                  <div className="sm:col-span-1">
                    <Label htmlFor="lname">
                      Last Name<span className="text-gray-500">*</span>
                    </Label>
                    <Input
                      type="text"
                      id="lname"
                      name="lastName"
                      disabled={isLoading}
                      placeholder="Enter your last name"
                      onChange={(e) => setLastName(e.target.value)}
                    />
                  </div>
                </div>
                {/* */}
                <div>
                  <Label htmlFor="email">
                    Email<span className="text-gray-500">*</span>
                  </Label>
                  <Input
                    type="email"
                    id="email"
                    name="email"
                    disabled={isLoading}
                    placeholder="Enter your email"
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                {/* */}
                <div>
                  <Label htmlFor="password">
                    Password<span className="text-gray-500">*</span>
                  </Label>
                  <div className="relative">
                    <Input
                      id="password"
                      name="password"
                      placeholder="Enter your password"
                      disabled={isLoading}
                      onChange={(e) => setPassword(e.target.value)}
                      type={showPassword ? "text" : "password"}
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

                {/* */}
                {/* --- This checkbox controls the 'isChecked' state --- */}
                <div className="flex items-center gap-3">
                  <Checkbox
                    id="termsCheckbox"
                    className="w-5 h-5 bg-black checked:bg-green-500"
                    checked={isChecked}
                    onChange={setIsChecked} // This updates the isChecked state
                  />
                  <Label htmlFor="termsCheckbox" className="inline-block font-normal text-gray-500 cursor-pointer">
                    By creating an account means you agree to the{" "}
                    <span className="text-gray-800">
                      Terms and Conditions,
                    </span>{" "}
                    and our{" "}
                    <span className="text-gray-800">
                      Privacy Policy
                    </span>
                  </Label>
                </div>

                {/* */}
                {/* --- This button's disabled state depends on isChecked and csrfToken --- */}
                <div>
                  <button
                    type="submit" // Correctly set to type="submit" to trigger form onSubmit
                    className="w-full text-white py-3 px-7 bg-black rounded-lg cursor-pointer transition-colors hover:bg-green-700 hover:text-black"
                    disabled={isLoading || !isChecked || !csrfToken} // Button is disabled if !isChecked is true
                  >
                    {isLoading ? 'Signing Up...' : 'Sign Up'}
                  </button>
                </div>
              </div>
            </form>
            )} {/* End conditional rendering based on csrfToken */}

            {/* --- This div contains the "Or" separator (moved outside the form) --- */}
            <div className="relative py-3 sm:py-5">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-200"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="p-2 text-gray-400 bg-white sm:px-5 sm:py-2">
                      Or
                    </span>
                  </div>
                </div>


            <div className="flex items-center justify-center mt-5">
              <p className="text-sm font-normal text-center text-gray-700 sm:text-start">
                Already have an account ?
                <Link
                  href="/signin"
                  className="text-green-400 hover:text-green-600 mx-1"
                >
                  Sign In
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}