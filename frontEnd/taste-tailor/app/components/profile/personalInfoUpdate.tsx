'use client'

import React, { useState, useEffect } from 'react'; // Import useEffect
import { setCookie, destroyCookie } from 'nookies'; // Import destroyCookie if needed for logout
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";

interface PersonalInfoUpdateProps {
  userFirstName: string;
  userLastName: string;
  userEmail: string;
  userID: string;
  userProfilePicture: string;
}

interface ProfilePictureChangeEvent extends React.ChangeEvent<HTMLInputElement> {
  target: HTMLInputElement & { files: FileList | null };
}

interface ProfilePictureResponse {
  message?: string;
  filename?: string; // Made filename optional as it might not be present on error
  error?: string; // Added potential error field
}

interface InfoUpdateResponse {
  message?: string;
  update?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  errors?: { [key: string]: string[] }; // Added potential errors field for validation
}

const PersonalInfoUpdate: React.FC<PersonalInfoUpdateProps> = ({ userFirstName, userLastName, userEmail, userID, userProfilePicture }) => {
    const [firstName, setFirstName] = useState(userFirstName);
    const [lastName, setLastName] = useState(userLastName);
    const [email, setEmail] = useState(userEmail);
    // Construct the initial profile picture URL, providing a fallback
    const [profilePicture, setProfilePicture] = useState(
        userProfilePicture ? `http://localhost:5000/uploads/profile_pictures/${userProfilePicture}` : '/images/assets/profile.jpg'
    );
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    // Use a state that can hold a string or an array of strings for error messages
    const [errorMessage, setErrorMessage] = useState<string | string[]>('');
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
                console.log("CSRF token fetched successfully for PersonalInfoUpdate.");

            } catch (error: any) {
                console.error('Error fetching CSRF token for PersonalInfoUpdate:', error);
                setCsrfError('Could not load update form. Please try again later.');
                setIsLoading(false); // Prevent form interaction if token fetch fails
            }
        };

        fetchCsrfToken();

        // Cleanup function for the object URL created for the profile picture preview
        return () => {
            if (profilePicture && profilePicture.startsWith('blob:')) {
                URL.revokeObjectURL(profilePicture);
            }
        };

    }, [profilePicture]); // Dependency array includes profilePicture to revoke old URLs


    const handleFileSelect = (e: ProfilePictureChangeEvent) => {
      const files = e.target.files;
      if (files && files.length > 0) {
          const file = files[0];
          setSelectedFile(file);
          // Revoke the previous object URL if it exists and is a blob URL
          if (profilePicture && profilePicture.startsWith('blob:')) {
              URL.revokeObjectURL(profilePicture);
          }
          // Create a new object URL for the selected file preview
          const newProfilePictureUrl = URL.createObjectURL(file);
          setProfilePicture(newProfilePictureUrl);
      } else {
        setSelectedFile(null);
         // Optionally revert to the original profile picture if file selection is cleared
         // setProfilePicture(userProfilePicture ? `http://localhost:5000/uploads/profile_pictures/${userProfilePicture}` : '/images/assets/profile.jpg');
      }
  };

  const handleInfoUpdate = async (e: React.FormEvent) => {
    e.preventDefault(); // Prevent default form submission
    setErrorMessage(''); // Clear error message (can be string or array)
    setSuccessMessage('');

    // --- Prevent submission if CSRF token is not loaded ---
    if (!csrfToken || csrfError) {
        setErrorMessage(csrfError || 'Update form not loaded. Cannot submit.');
        return;
    }
    // --- End Prevent submission ---

    setIsLoading(true);

    if (!userID) {
      setErrorMessage('User ID not available. Cannot update.');
      setIsLoading(false);
      return;
    }

    let infoUpdateSuccess = false;
    let pictureUploadSuccess = true; // Assume success if no file is selected

    // 1. Handle User Information Update
    // Only attempt info update if first name, last name, or email have changed
    const infoFieldsChanged = firstName !== userFirstName || lastName !== userLastName || email !== userEmail;

    if (infoFieldsChanged) {
        try {
          const infoResponse = await fetch('http://localhost:5000/taste_tailor_update_info', {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              // --- Include CSRF token in the X-CSRFToken header ---
              'X-CSRFToken': csrfToken, // Include the fetched CSRF token
            },
            // Include all fields that can be updated via this endpoint
            body: JSON.stringify({
                id: userID,
                firstName: firstName,
                lastName: lastName,
                email: email,
                // --- Optionally include CSRF token in the body if WTF_CSRF_CHECK_JSON = True ---
                // csrf_token: csrfToken, // Include if backend is configured to check JSON body
            }),
            credentials: 'include', // Include cookies
          });

          const infoData: InfoUpdateResponse = await infoResponse.json();

          if (infoResponse.ok) {
            infoUpdateSuccess = true;
            setSuccessMessage(infoData.message || 'Profile information updated successfully.');
            // Update cookies/state with potentially new info from backend
            // Use provided data or fallback to current state/props if backend doesn't return them
            setCookie(null, 'userMessage', infoData.update || `Welcome, ${infoData.firstName || firstName}`, { path: '/' });
            setCookie(null, 'userFirstName', infoData.firstName || firstName, { path: '/' });
            setCookie(null, 'userLastName', infoData.lastName || lastName, { path: '/' });
            setCookie(null, 'userEmail', infoData.email || email, { path: '/' });

            // Update component state if backend returns updated values
            if(infoData.firstName) setFirstName(infoData.firstName);
            if(infoData.lastName) setLastName(infoData.lastName);
            if(infoData.email) setEmail(infoData.email);

          } else {
            // Handle non-OK response for info update
             if (infoData.errors) {
                  // If backend returns validation errors (like email already exists)
                  const errorMessages = Object.values(infoData.errors).flat();
                  setErrorMessage(errorMessages); // Set error state to the array of messages
              } else {
                  // Handle other non-validation errors
                  setErrorMessage(infoData.message || 'Failed to update profile information.');
              }
            infoUpdateSuccess = false; // Ensure flag is false on error
          }
        } catch (error) {
          console.error('Profile info update failed:', error);
          setErrorMessage('An unexpected error occurred during information update.');
          infoUpdateSuccess = false; // Ensure flag is false on error
        }
    } else {
        // If no info fields changed, consider it a success for this part
        infoUpdateSuccess = true;
    }


    // 2. Handle Profile Picture Upload (only if a file was selected)
    if (selectedFile) {
        pictureUploadSuccess = false; // Reset to false, will set to true on successful upload
        try {
            const formData = new FormData();
            formData.append('profilePicture', selectedFile); // Use the selectedFile state
            formData.append('userID', userID);
            // --- Include CSRF token in the X-CSRFToken header for file upload ---
            // FormData requests don't typically include the token in the body JSON.
            // Sending it in the header is the standard approach here.
            // Ensure backend Flask-WTF config checks headers (which is default).
            // If configured WTF_CSRF_CHECK_JSON=True, it might still look in JSON body,
            // but for FormData, the header is more reliable.
            // Double-check Flask backend's CSRF configuration for file uploads if issues persist.
            const pictureResponse = await fetch('http://localhost:5000/taste_tailor_update_picture', {
                method: 'POST',
                body: formData,
                 headers: {
                    // 'Content-Type': 'multipart/form-data' is set automatically by browser for FormData
                    'X-CSRFToken': csrfToken, // Include the fetched CSRF token
                },
                credentials: 'include', // Include cookies
            });

            // --- Handle non-JSON response for picture upload errors ---
            const contentType = pictureResponse.headers.get("content-type");
            if (!pictureResponse.ok) {
                 if (contentType && contentType.indexOf("application/json") !== -1) {
                     const pictureData: ProfilePictureResponse = await pictureResponse.json();
                     // Handle JSON error response from backend
                     setErrorMessage(pictureData.message || pictureData.error || 'Failed to update profile picture.');
                 } else {
                     // Handle non-JSON error responses (like HTML CSRF error)
                     const errorText = await pictureResponse.text();
                     // Attempt to extract a friendly message from the HTML
                     const parser = new DOMParser();
                     const htmlDoc = parser.parseFromString(errorText, 'text/html');
                     const errorMessageElement = htmlDoc.querySelector('h1') || htmlDoc.querySelector('p');
                     const friendlyErrorMessage = errorMessageElement ? errorMessageElement.textContent : 'Unknown server error.';
                     setErrorMessage(`Picture upload failed: ${pictureResponse.status} ${pictureResponse.statusText}. Server message: ${friendlyErrorMessage}`);
                 }
                 pictureUploadSuccess = false; // Ensure flag is false on error
            } else {
                 // If response is OK (status 2xx), it should be JSON with success message
                 const pictureData: ProfilePictureResponse = await pictureResponse.json();
                 pictureUploadSuccess = true;
                 // Update the profile picture state with the new image URL
                 if (pictureData.filename) {
                     const newImageUrl = `http://localhost:5000/uploads/profile_pictures/${pictureData.filename}`;
                     setProfilePicture(newImageUrl); // Update the state with the permanent URL
                     setCookie(null, 'profilePictureFileName', pictureData.filename, { path: '/' });
                     // Append picture update success message if info update was also successful
                     if (infoUpdateSuccess) {
                         setSuccessMessage(prev => prev + ' and profile picture!');
                     } else {
                         setSuccessMessage('Profile Picture Updated!');
                     }
                 } else {
                     setErrorMessage('Picture upload successful, but filename not returned.');
                 }
            }
        } catch (error) {
            console.error('Profile picture upload failed:', error);
            setErrorMessage('An unexpected error occurred during picture upload.');
            pictureUploadSuccess = false; // Ensure flag is false on error
        }
    }

    // Final check and message update if both succeeded or only one was attempted/succeeded
    if (infoFieldsChanged && selectedFile) {
        // Both attempted
        if (infoUpdateSuccess && pictureUploadSuccess) {
            // Success messages are set within the individual blocks
        } else {
            // If either failed, error message is already set
            // Might want to refine the combined error message here if needed
        }
    } else if (infoFieldsChanged && !selectedFile) {
        // Only info update attempted
        // Messages are set within the info update block
    } else if (!infoFieldsChanged && selectedFile) {
        // Only picture update attempted
        // Messages are set within the picture upload block
    } else {
        // No changes were made (handled by backend returning 200 with no fields updated)
        setSuccessMessage('No changes detected.');
    }


    setIsLoading(false); // Reset loading state
    setSelectedFile(null); // Clear selected file after attempt
  };

    return (
    <>
        {/* Main Content Area - Modified to include profile details */}
        <div className="flex-1 p-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-6">Personal info</h1>
          {/* Profile Section based on the second image */}
          {/* --- Display Error Messages (handle string or array) --- */}
          {errorMessage && (
              <div className="text-md text-center mb-8 text-red-700">
                  {Array.isArray(errorMessage) ? (
                      // If errorMessage is an array, map over it to display each error
                      <ul>
                          {errorMessage.map((msg, index) => (
                              <li key={index}>{msg}</li>
                          ))}
                      </ul>
                  ) : (
                      // If errorMessage is a string, display it directly
                      <p>{errorMessage}</p>
                  )}
              </div>
          )}
          {/* --- End Display Error Messages --- */}

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
                {/* Profile Image */}
                <div className="mb-6 md:mb-0 md:mr-6 relative">
                  <img
                    src={profilePicture}
                    alt="Profile Picture"
                    className="w-42 h-36 rounded-full object-cover border-4 border-gray-400"
                    // Fallback for broken image
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.onerror = null; // prevents infinite loop
                      target.src = "/images/assets/profile.jpg"; // Fallback placeholder
                    }}
                  />
                  <div className="flex justify-center mt-8">
                    <Label htmlFor="profilePictureInput"> {/* Added htmlFor */}
                      <Input
                         type="file"
                         id="profilePictureInput" // Added id
                         className="hidden"
                         onChange={handleFileSelect}
                         accept="image/*" // Accept only image files
                      >
                      </Input>
                      <span
                        className="bg-pink-500 text-white py-4 px-8 border rounded-lg cursor-pointer hover:bg-red-500 focus:outline-none focus:ring-2 focus:ring-pink-700 focus:ring-opacity-50 transition duration-300"
                      >Change</span>
                    </Label>
                  </div>
                </div>

                {/* Input Fields */}
                <div className="w-full">
                  {/* Name Input */}
                  <div className="flex-1">
                    <Label htmlFor="fname">
                      First Name <span className="text-gray-500">*</span>{" "}
                    </Label>
                    <Input
                      type="text"
                      id="fname"
                      name="firstName" // Added name
                      disabled={isLoading}
                      defaultValue={firstName} // Use defaultValue for initial render
                      onChange={(e) => setFirstName(e.target.value)}
                    />
                    <Label htmlFor="lname" className="mt-2">
                      Last Name <span className="text-gray-500">*</span>{" "}
                    </Label>
                    <Input
                      type="text"
                      id="lname"
                      name="lastName" // Added name
                      disabled={isLoading}
                      defaultValue={lastName} // Use defaultValue for initial render
                      onChange={(e) => setLastName(e.target.value)}
                    />
                  </div>
                  {/* Email Input */}
                  <Label htmlFor="email" className="mt-2">
                    Email <span className="text-gray-500">*</span>{" "}
                  </Label>
                  <Input
                    type="email"
                    id="email"
                    name="email" // Added name
                    disabled={isLoading}
                    defaultValue={email} // Use defaultValue for initial render
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>
              <div className="flex justify-center">
                <button
                  className="w-sm ml-2 bg-green-600 text-white py-3 rounded-md hover:bg-green-800 focus:outline-none focus:ring-2 focus:ring-green-700 focus:ring-opacity-50 transition duration-300 disabled:opacity-50"
                  onClick={handleInfoUpdate}
                  disabled={isLoading || !csrfToken} // Disable while loading or token is missing
                >
                  Confirm
                </button>
              </div>
           </>
           )} {/* End conditional rendering */}
        </div>
    </>
    );
}

export default PersonalInfoUpdate;