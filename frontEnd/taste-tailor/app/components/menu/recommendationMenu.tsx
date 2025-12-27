'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { Star, FileText } from 'lucide-react'; // Using Star icon for rating, FileText for no orders icon
import { parseCookies } from 'nookies'; // To check login status
import { useRouter } from 'next/navigation'; // Import useRouter
import { tasteDescriptions } from '@/context/RestaurantContext'; // Import tasteDescriptions

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

const RecommendationMenu: React.FC = () => {
    const router = useRouter(); // Get the router instance

    const [pastOrders, setPastOrders] = useState<PastOrderItem[]>([]);
    const [sortedRecommendedOrders, setSortedRecommendedOrders] = useState<PastOrderItem[]>([]);
    const [isLoading, setIsLoading] = useState(true); // Loading for fetching orders
    const [error, setError] = useState<string | null>(null);

    // State to track if the user is logged in on the client
    const [isClientLoggedIn, setIsClientLoggedIn] = useState(false);
    // State to track if the login check has been performed
    const [isLoginCheckComplete, setIsLoginCheckComplete] = useState(false);


    // --- Check login status on component mount ---
    useEffect(() => {
        const cookies = parseCookies();
        const loggedInCookie = cookies['isLoggedIn'];

        if (loggedInCookie === 'true') {
            setIsClientLoggedIn(true);
        } else {
            setIsClientLoggedIn(false);
            // Redirect to home page if not logged in
            router.push('/');
        }
        setIsLoginCheckComplete(true); // Mark check as complete
    }, [router]); // Dependency array includes router


    // Fetch past orders when the component mounts and user is logged in
    useEffect(() => {
        const fetchPastOrders = async () => {
            // Only fetch if the login check is complete AND the user is logged in
            if (!isLoginCheckComplete || !isClientLoggedIn) {
                 // If check is complete and not logged in, the redirect has happened.
                 // If check is not complete, this effect will re-run after it is.
                setIsLoading(false); // Stop loading if not logged in or check incomplete
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
                    console.warn("Fetch past orders request redirected. User likely not authenticated on backend.");
                    // The browser will follow the redirect to the login page.
                    // We should still stop loading and clear data.
                     setIsLoading(false); // Stop loading state
                     setPastOrders([]); // Ensure pastOrders is an empty array
                     // The login check effect will handle the frontend redirect if needed.
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

        // Fetch past orders if login check is complete AND user is logged in
        if (isLoginCheckComplete && isClientLoggedIn) {
            fetchPastOrders();
        }

    }, [isLoginCheckComplete, isClientLoggedIn]); // Refetch when login status or check completion changes


    // --- Sorting Logic ---
    useEffect(() => {
        if (pastOrders.length === 0) {
            setSortedRecommendedOrders([]);
            return;
        }

        // 1. Create a map of unique tastes and the highest rating associated with each taste
        const tasteHighestRating: { [taste: string]: number } = {};
        pastOrders.forEach(order => {
            if (order.taste_selection && order.taste_selection.length > 0) {
                order.taste_selection.forEach(taste => {
                    // Only consider ratings 3 or above for determining the "highly-rated" taste group priority
                    if (order.rating >= 3) {
                        if (!tasteHighestRating[taste] || order.rating > tasteHighestRating[taste]) {
                            tasteHighestRating[taste] = order.rating;
                        }
                    } else {
                         // If the taste exists but only on items rated below 3, initialize with 0 if not already set by a higher rating
                         if (tasteHighestRating[taste] === undefined) {
                             tasteHighestRating[taste] = 0;
                         }
                    }
                });
            }
        });

        // 2. Sort unique tastes based on their highest associated rating (descending)
        // Tastes from items rated 3+ will come first, sorted by their max rating.
        // Tastes only found on items rated below 3 or unrated will come after, sorted by their max rating (which will be 0).
        const sortedTastesByRating = Object.keys(tasteHighestRating).sort((a, b) => {
            return tasteHighestRating[b] - tasteHighestRating[a];
        });

        // 3. Assign a primary sorting key to each order based on the highest-rated taste it contains
        // If an order has multiple tastes, its position will be determined by the highest-rated taste among them.
        // If an order has no tastes, it will be handled separately with a lower priority key.
        const ordersWithSortingKey = pastOrders.map(order => {
            let primaryTasteSortKey = Infinity; // Higher value means lower priority (place at the end)
            let hasTasteWithRating3Plus = false;

            if (order.taste_selection && order.taste_selection.length > 0) {
                order.taste_selection.forEach(taste => {
                    const tasteIndex = sortedTastesByRating.indexOf(taste);
                    if (tasteIndex !== -1) {
                        // Use the index of the taste in the sorted list as the primary sort key
                        // Lower index means the taste is associated with a higher max rating, thus higher priority
                        if (tasteIndex < primaryTasteSortKey) {
                            primaryTasteSortKey = tasteIndex;
                        }
                        if (tasteHighestRating[taste] >= 3) {
                             hasTasteWithRating3Plus = true;
                        }
                    }
                });
            } else {
                 // Assign a key that places items without taste after all taste-grouped items
                 primaryTasteSortKey = sortedTastesByRating.length; // Place after all taste groups
            }

            return { ...order, primaryTasteSortKey, hasTasteWithRating3Plus };
        });

        // 4. Sort the orders using the primary taste sort key, then rating, then date
        const finalSortedOrders = [...ordersWithSortingKey].sort((a, b) => {
            // Primary sort: by the index of the highest-rated taste they contain (lower index is higher priority)
            // Items without taste will be grouped at the end due to their higher primaryTasteSortKey.
            if (a.primaryTasteSortKey !== b.primaryTasteSortKey) {
                return a.primaryTasteSortKey - b.primaryTasteSortKey;
            }

            // Secondary sort (within the same taste group priority):
            // Prioritize items with rating 3 or above within the same taste group priority
            if (a.hasTasteWithRating3Plus && !b.hasTasteWithRating3Plus) return -1;
            if (!a.hasTasteWithRating3Plus && b.hasTasteWithRating3Plus) return 1;


            // Tertiary sort (if taste group priority and 3+ rating status are the same):
            // Sort by rating descending (5, 4, 3, 2, 1, 0)
            if (b.rating !== a.rating) {
                return b.rating - a.rating;
            }

            // Quaternary sort (if all above are equal):
            // Sort by delivered date descending (latest orders first)
            const dateA = new Date(a.delivered_date).getTime();
            const dateB = new Date(b.delivered_date).getTime();
            return dateB - dateA;
        });

        // Remove the temporary sorting keys before setting state
        const cleanedSortedOrders = finalSortedOrders.map(order => {
            const { primaryTasteSortKey, hasTasteWithRating3Plus, ...rest } = order;
            return rest;
        });


        setSortedRecommendedOrders(cleanedSortedOrders);

    }, [pastOrders]); // Re-sort whenever pastOrders changes


    // Helper to format date
    const formatDate = (dateString: string): string => {
        try {
            const options: Intl.DateTimeFormatOptions = { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric', hour: 'numeric', minute: 'numeric' };
            return new Date(dateString).toLocaleDateString(undefined, options);
        } catch (e) {
            console.error("Error formatting date:", dateString, e);
            return dateString; // Return original string if formatting fails
        }
    };

     // Helper to get taste descriptions for a given item
    const getTasteDescriptions = (item: PastOrderItem): string[] => {
        // Display taste descriptions for items with rating 3 or above AND have taste selections
        if (item.rating >= 3 && item.taste_selection && item.taste_selection.length > 0) {
            return item.taste_selection
                .map(taste => tasteDescriptions[taste as keyof typeof tasteDescriptions])
                .filter(description => description !== undefined); // Filter out undefined descriptions
        }
        return []; // Return empty array if rating is below 3 or no tastes
    };


    // --- Conditional rendering based on login status and check completion ---
    // If login check is not complete, render nothing or a loading indicator
    if (!isLoginCheckComplete) {
        return (
             <div className="flex items-center justify-center min-h-screen bg-gray-100">
                 <p className="text-gray-700 text-lg">Checking login status...</p>
             </div>
        );
    }

    // If login check is complete but user is not logged in, the redirect has already happened in useEffect.
    // We can render null here as the user is being navigated away.
    if (!isClientLoggedIn) {
        return null;
    }

    // If login check is complete AND user is logged in, render the main content
    // Display loading state for fetching orders *after* login check
    if (isLoading) {
        return (
             <div className="flex items-center justify-center min-h-screen bg-gray-100">
                 <p className="text-gray-700 text-lg">Loading recommendations...</p> {/* Simple loading indicator */}
             </div>
        );
    }


    // Display error if fetching orders failed
    if (error) {
        return (
             <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
                 <div className="bg-white rounded-lg shadow-xl p-8 text-center">
                    <h2 className="text-2xl font-bold text-red-600 mb-4">Error</h2>
                    <p className="text-gray-600">{error}</p>
                 </div>
             </div>
        );
    }

    // If not loading, no error, logged in, and no past orders, display the "No orders yet" message
    if (pastOrders.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
                 <div className="bg-white rounded-lg shadow-xl p-8 text-center flex flex-col items-center">
                     {/* Icon similar to the image */}
                     <FileText size={80} className="text-blue-400 mb-6" />

                     {/* Message */}
                     <h2 className="text-2xl font-bold text-gray-800 mb-2">
                         No recommendations yet
                     </h2>

                     {/* Sub-message */}
                     <p className="text-gray-600 text-lg">
                         Place some orders to see your personalized recommendations here.
                     </p>
                 </div>
             </div>
        );
    }


    return (
        <div className="container mx-auto p-4">
            <h1 className="text-2xl font-bold text-gray-800 mb-6 text-center">Recommended for You</h1>
            <div className="max-w-2xl mx-auto space-y-6"> {/* Center and limit width */}
                {sortedRecommendedOrders.map(order => (
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
                            <p className="text-sm text-gray-600 mb-1">Ordered on {formatDate(order.delivered_date)}</p>

                            {/* Item Quantity and Price (Optional for Recommendation?) */}
                            {/* <p className="text-gray-700 mb-2">{order.quantity} x {order.item_name} - ${order.total_item_price.toFixed(2)}</p> */}

                            {/* Display Taste Values */}
                            {order.taste_selection && order.taste_selection.length > 0 && (
                                 <p className="text-sm text-gray-600 mb-2">Tastes: {order.taste_selection.join(', ')}</p>
                            )}
                            {order.recommended_selection && order.recommended_selection.length > 0 && (
                                 <p className="text-sm text-gray-600 mb-2">Recommended: {order.recommended_selection.join(', ')}</p>
                            )}

                            {/* Static Star Rating (if rated) */}
                            {order.rating > 0 && (
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
                            )}

                            {/* Display Taste Descriptions for items with rating >= 3 */}
                            {order.rating >= 3 && getTasteDescriptions(order).length > 0 && (
                                <div className="mt-3">
                                    <span className="text-sm font-semibold text-gray-700">Taste Insights:</span>
                                    <ul className="list-disc list-inside text-sm text-gray-600">
                                        {getTasteDescriptions(order).map((description, index) => (
                                            <li key={index}>{description}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                             {/* Add to Cart / Reorder Button (Placeholder) */}
                             {/* <button className="mt-4 px-4 py-2 bg-green-600 text-white rounded-full text-sm font-semibold hover:bg-green-700 transition-colors duration-200">
                                 Add to Cart
                             </button> */}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default RecommendationMenu;