'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Star, FileText } from 'lucide-react'; // Using Star icon for rating, FileText for no orders icon
import { parseCookies } from 'nookies'; // To check login status
import ReviewOverlay from './ReviewOverlay'; // Import the ReviewOverlay component

// Define the type for a past order item (should match backend serialization)
interface PastOrderItem {
    id: number;
    item_name: string;
    item_image_url?: string;
    quantity: number;
    price_per_item: number;
    total_item_price: number;
    delivered_date: string; // Will be an ISO string from backend
    taste_selection: string[]; // Assuming backend sends as list after json.loads
    recommended_selection: string[]; // Assuming backend sends as list
    rating: number;
    order_total_price: number; // Total price of the entire order
    delivery_address: any; // Address object/dict
    review_comment?: string; // Include review comment from backend
}

const PastOrder: React.FC = () => {
    const [pastOrders, setPastOrders] = useState<PastOrderItem[]>([]);
    const [isLoading, setIsLoading] = useState(true); // Loading for fetching orders
    const [error, setError] = useState<string | null>(null);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [isClientLoggedIn, setIsClientLoggedIn] = useState(false);
    const [isLoginCheckComplete, setIsLoginCheckComplete] = useState(false);

    // State to control the ReviewOverlay visibility
    const [isReviewOverlayOpen, setIsReviewOverlayOpen] = useState(false);
    // State to store the order item currently being reviewed
    const [selectedOrderItemForReview, setSelectedOrderItemForReview] = useState<PastOrderItem | null>(null);

    // --- State for CSRF Token ---
    const [csrfToken, setCsrfToken] = useState<string | null>(null);
    const [csrfError, setCsrfError] = useState<string | null>(null); // Error fetching CSRF token
    const [isTokenLoading, setIsTokenLoading] = useState(true); // Loading state for token fetch
    // --- End State for CSRF Token ---

    // State for loading during review submission
    const [isSubmittingReview, setIsSubmittingReview] = useState(false);
    const router = useRouter();

    // Check login status on mount
    useEffect(() => {
        const cookies = parseCookies();
        const loggedInCookie = cookies['isLoggedIn'];
        setIsLoggedIn(cookies['isLoggedIn'] === 'true');

        if (loggedInCookie === 'true') {
            setIsClientLoggedIn(true);
        } else {
            setIsClientLoggedIn(false);
            // Redirect to home page if not logged in
            router.push('/');
        }
        setIsLoginCheckComplete(true);
    }, []);

    // --- Fetch CSRF token on component mount ---
    useEffect(() => {
        const fetchCsrfToken = async () => {
            // Only attempt to fetch if the user is logged in
            if (!isLoggedIn) {
                 setIsTokenLoading(false); // Not logged in, so token loading is done
                 return;
            }

            setIsTokenLoading(true); // Start token loading
            setCsrfError(null); // Clear previous token errors

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
            } catch (error: any) {
                setCsrfError('Could not load review form. Please try again later.');
            } finally {
                setIsTokenLoading(false); // Set token loading to false regardless of success/failure
            }
        };

        // Fetch CSRF token if the user is logged in
        if (isLoggedIn) {
             fetchCsrfToken();
        }

    }, [isLoggedIn]); // Re-fetch if login status changes


    // Fetch past orders when the component mounts and user is logged in
    useEffect(() => {
        const fetchPastOrders = async () => {
            if (!isLoggedIn) {
                setIsLoading(false);
                // Optionally set an error or message if not logged in
                // setError("Please log in to view your past orders.");
                return;
            }

            setIsLoading(true);
            setError(null);

            try {
                const response = await fetch('http://localhost:5000/get_past_orders', {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        // Browser will send necessary cookies for authentication via credentials: 'include'
                        // No CSRF token needed in headers/body for GET request
                    },
                    credentials: 'include', // Ensure session cookie is sent for @login_required
                });

                 // Check if the response is a redirect (status 3xx)
                if (response.redirected) {
                    // router.push('/auth/login'); // Example: Redirect to frontend login page
                     setIsLoading(false); // Stop loading state
                     setPastOrders([]); // Ensure pastOrders is an empty array
                     return; // Stop further processing
                }


                if (response.ok) {
                    const data = await response.json(); // Get the raw data

                    if (Array.isArray(data)) {
                        setPastOrders(data as PastOrderItem[]); // Set state only if it's an array
                    } else {
                        // If data is not an array, it's an unexpected format
                        console.error("Received data is not an array:", data);
                        setError("Received unexpected data format for past orders.");
                        setPastOrders([]); // Ensure state is an empty array in case of bad data
                    }

                } else {
                    // Handle errors from the backend (non-redirect, non-2xx status)
                    // Attempt to parse JSON error response
                    const contentType = response.headers.get("content-type");
                    if (contentType && contentType.indexOf("application/json") !== -1) {
                        const errorData = await response.json();
                        setError(`Failed to fetch past orders: ${errorData.error || errorData.message || response.statusText}`);
                        console.error("Failed to fetch past orders:", response.status, errorData);
                    } else {
                         // Handle non-JSON error responses (like HTML)
                         const errorText = await response.text();
                         console.error("Failed to fetch past orders with non-JSON response:", response.status, errorText);
                         setError(`Failed to fetch past orders: ${response.status} ${response.statusText}`);
                    }
                    setPastOrders([]); // Ensure state is an empty array on fetch error
                }
            } catch (err) {
                setError("An error occurred while fetching past orders.");
                console.error("Error fetching past orders:", err);
                setPastOrders([]); // Ensure state is an empty array on network error
            } finally {
                setIsLoading(false);
            }
        };

        // Only fetch past orders if the user is logged in
        if (isLoggedIn) {
            fetchPastOrders();
        }

    }, [isLoggedIn]); // Refetch if login status changes


    // --- Review Overlay Handlers ---
    const openReviewOverlay = (item: PastOrderItem) => {
        // Only open if CSRF token is available and not already submitting a review
        if (!csrfToken || csrfError || isSubmittingReview) {
            alert(csrfError || "Review form not loaded or already submitting. Please try again.");
            return;
        }
        setSelectedOrderItemForReview(item);
        setIsReviewOverlayOpen(true);
    };

    const closeReviewOverlay = () => {
        // Only allow closing if not currently submitting
        if (!isSubmittingReview) {
            setIsReviewOverlayOpen(false);
            setSelectedOrderItemForReview(null); // Clear the selected item when closing
        }
    };

    const handleSubmitReview = async (orderItemId: number, rating: number, comment: string) => {
        // This function will be called by the ReviewOverlay when the user clicks Submit
        console.log(`Submitting review for item ${orderItemId}: Rating ${rating}, Comment "${comment}"`);

        // Prevent submission if already submitting or token is missing
        if (isSubmittingReview || !csrfToken) {
            console.warn("Review submission in progress or CSRF token missing.");
            return;
        }

        setIsSubmittingReview(true); // Set submitting loading state

        // --- Backend API Call to Submit Review ---
        try {
            const response = await fetch('http://localhost:5000/submit_review', {
                method: 'POST', // Or 'PUT' - backend uses POST in the PDF
                headers: {
                    'Content-Type': 'application/json',
                    // --- Include CSRF token in the X-CSRFToken header ---
                    'X-CSRFToken': csrfToken, // Include the fetched CSRF token
                },
                body: JSON.stringify({
                    order_item_id: orderItemId,
                    rating: rating,
                    review_comment: comment,
                    // --- Optionally include CSRF token in the body if WTF_CSRF_CHECK_JSON = True ---
                    // csrf_token: csrfToken, // Include if backend is configured to check JSON body
                }),
                credentials: 'include', // Ensure session cookie is sent for authentication and CSRF validation
            });

            // Check if the response is a redirect (status 3xx)
            if (response.redirected) {
                 // router.push('/auth/login'); // Example: Redirect to frontend login page
                 setIsSubmittingReview(false);
                 closeReviewOverlay();
                 return; // Stop further processing
            }

            // --- Handle JSON response if no redirect occurred ---
            const contentType = response.headers.get("content-type");
            if (!response.ok) { // Check for non-2xx status codes
                 if (contentType && contentType.indexOf("application/json") !== -1) {
                      const errorData = await response.json();
                      // Handle JSON error response from backend
                      alert(`Failed to submit review: ${errorData.error || errorData.message || response.statusText}`);
                 } else {
                      // Handle non-JSON error responses (like HTML CSRF error)
                      const errorText = await response.text();
                      // Attempt to extract a friendly message from the HTML
                      const parser = new DOMParser();
                      const htmlDoc = parser.parseFromString(errorText, 'text/html');
                      const errorMessageElement = htmlDoc.querySelector('h1') || htmlDoc.querySelector('p');
                      const friendlyErrorMessage = errorMessageElement ? errorMessageElement.textContent : 'Unknown server error.';
                      alert(`Failed to submit review: ${response.status} ${response.statusText}. Server message: ${friendlyErrorMessage}`);
                 }
                // Optionally revert the optimistic UI update if the backend failed
            } else {
                // If response is OK (status 2xx), it should be JSON with success message
                // Update the rating and comment in the local state after successful backend update
                setPastOrders(prevOrders =>
                    prevOrders.map(order =>
                        order.id === orderItemId ? { ...order, rating: rating, review_comment: comment } : order // Update both rating and comment
                    )
                );
                closeReviewOverlay(); // Close the overlay on success
                 // Optionally clear CSRF token state to force a re-fetch if needed for subsequent actions
                 // setCsrfToken(null);
            }
            // --- End Handle JSON response ---

        } catch (err) {
            alert("An error occurred while submitting your review. Please try again.");
             // Optionally revert the optimistic UI update if the backend failed
        } finally {
            setIsSubmittingReview(false); // Always reset submitting loading state
        }
    };


    // Helper to format date
    const formatDate = (dateString: string): string => {
        try {
            const options: Intl.DateTimeFormatOptions = { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric', hour: 'numeric', minute: 'numeric' };
            return new Date(dateString).toLocaleDateString(undefined, options);
        } catch (e) {
            return dateString; // Return original string if formatting fails
        }
    };

    if (!isLoginCheckComplete) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-100">
                <p className="text-gray-700 text-lg">Checking login status...</p>
            </div>
        );
    }

    if (!isClientLoggedIn) {
        return null;
    }

    // if (!isLoggedIn) {
    //     return (
    //         <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
    //             <div className="bg-white rounded-lg shadow-xl p-8 text-center">
    //                 <h2 className="text-2xl font-bold text-gray-800 mb-4">Access Denied</h2>
    //                 <p className="text-gray-600">Please log in to view your past orders.</p>
    //                 {/* Optionally add a link to the login page */}
    //                 {/* <Link href="/auth/login" className="mt-4 inline-block px-6 py-3 bg-blue-600 text-white rounded-full font-semibold hover:bg-blue-700">Go to Login</Link> */}
    //             </div>
    //         </div>
    //     );
    // }

    // Conditional rendering while loading orders or fetching CSRF token
    if (isLoading || isTokenLoading) {
        return (
             <div className="flex items-center justify-center min-h-screen bg-gray-100">
                 <p className="text-gray-700 text-lg">Loading past orders...</p> {/* Simple loading indicator */}
             </div>
        );
    }

    // Display error if fetching orders failed or CSRF token failed
    if (error || csrfError) {
        return (
             <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
                 <div className="bg-white rounded-lg shadow-xl p-8 text-center">
                    <h2 className="text-2xl font-bold text-red-600 mb-4">Error</h2>
                    <p className="text-gray-600">{error || csrfError}</p> {/* Display either error */}
                 </div>
             </div>
        );
    }


    // If not loading, no error, not logged in (handled above), and no past orders, display the "No orders yet" message
    if (pastOrders.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
                 <div className="bg-white rounded-lg shadow-xl p-8 text-center flex flex-col items-center">
                     {/* Icon similar to the image */}
                     <FileText size={80} className="text-blue-400 mb-6" />

                     {/* Message */}
                     <h2 className="text-2xl font-bold text-gray-800 mb-2">
                         No orders yet
                     </h2>

                     {/* Sub-message */}
                     <p className="text-gray-600 text-lg">
                         You'll be able to see your order history here.
                     </p>
                 </div>
             </div>
        );
    }


    return (
        <div className="container mx-auto p-4">
            <h1 className="text-2xl font-bold text-gray-800 mb-6 text-center">Past Orders</h1>
            <div className="max-w-2xl mx-auto space-y-6"> {/* Center and limit width */}
                {pastOrders.map(order => (
                    <div key={order.id} className="bg-white rounded-lg shadow-md p-4 flex items-start space-x-4">
                        {/* Item Image */}
                        <div className="flex-shrink-0">
                            <Image
                                src={order.item_image_url || '/images/assets/placeholder.jpg'} // Use item image or placeholder
                                alt={order.item_name}
                                width={80} // Adjust size as needed
                                height={80} // Adjust size as needed
                                objectFit="cover"
                                className="rounded-md"
                                onError={(e) => { const target = e.target as HTMLImageElement; target.onerror = null; target.src='/images/assets/placeholder.jpg'; }} // Fallback on error
                            />
                        </div>

                        {/* Order Details */}
                        <div className="flex-grow">
                            <h3 className="font-semibold text-gray-800 text-lg mb-1">{order.item_name}</h3>
                            <p className="text-sm text-gray-600 mb-1">Delivered on {formatDate(order.delivered_date)}</p>
                            {/* Display Order # if you add it to the backend and model */}
                            {/* <p className="text-sm text-gray-600 mb-2">Order #{order.order_id}</p> */}

                            {/* Item Quantity and Price */}
                            <p className="text-gray-700 mb-2">{order.quantity} x {order.item_name} - ${order.total_item_price.toFixed(2)}</p>

                            {/* Taste Selection */}
                            {order.taste_selection && order.taste_selection.length > 0 && (
                                 <p className="text-sm text-gray-600 mb-2">Taste: {order.taste_selection.join(', ')}</p>
                            )}
                            {order.recommended_selection && order.recommended_selection.length > 0 && (
                                 <p className="text-sm text-gray-600 mb-2">Recommended: {order.recommended_selection.join(', ')}</p>
                            )}


                            {/* Conditional Display: Button or Star Rating */}
                            {order.rating === 0 ? (
                                 // Display "Leave a review" button if rating is 0, disable if token is missing or submitting
                                 <button
                                     onClick={() => openReviewOverlay(order)} // Open overlay on click
                                     className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-full text-sm font-semibold hover:bg-blue-700 transition-colors duration-200 shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                                     disabled={!csrfToken || isSubmittingReview} // Disable if token is missing or submitting
                                 >
                                     {/* Change text while submitting, only for the selected item */}
                                     {isSubmittingReview && selectedOrderItemForReview?.id === order.id ? 'Submitting...' : 'Leave a review'}
                                 </button>
                            ) : (
                                 // Display static star rating and comment if rating is > 0
                                 <>
                                    <div className="flex items-center mt-3">
                                        <span className="text-sm text-gray-600 mr-2">Your rating:</span>
                                        {[1, 2, 3, 4, 5].map((starValue) => (
                                            <Star
                                                key={starValue}
                                                size={20}
                                                className={`transition-colors duration-200 ${
                                                    starValue <= order.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'
                                                }`}
                                            />
                                        ))}
                                    </div>
                                     {/* Display existing comment if any */}
                                    {order.review_comment && order.review_comment.trim() !== '' && (
                                         <p className="text-sm text-gray-600 mt-2 italic">"{order.review_comment}"</p>
                                    )}
                                 </>
                            )}

                             {/* Select items to reorder button (Placeholder) */}
                             {/* <button className="mt-4 ml-2 px-4 py-2 bg-pink-600 text-white rounded-full text-sm font-semibold hover:bg-pink-700 transition-colors duration-200">
                                 Select items to reorder
                             </button> */}
                        </div>
                    </div>
                ))}
            </div>

            {/* Render the ReviewOverlay */}
            {/* Pass the isSubmittingReview state as the isSubmitting prop */}
            <ReviewOverlay
                isOpen={isReviewOverlayOpen}
                onClose={closeReviewOverlay}
                orderItem={selectedOrderItemForReview}
                onSubmitReview={handleSubmitReview}
                isSubmitting={isSubmittingReview} // Pass submitting state to overlay
            />
        </div>
    );
};

export default PastOrder;