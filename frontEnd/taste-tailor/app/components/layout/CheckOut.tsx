'use client';

import React, { useState, useEffect } from 'react'; // Import useEffect
import { useRouter } from 'next/navigation';
import { useShoppingCart } from '@/context/ShoppingCartContext';
import { useRestaurant } from '@/context/RestaurantContext';
import { parseCookies } from 'nookies';

const CheckOut: React.FC = () => {
  const { cartItems, getCartTotal, clearCart } = useShoppingCart();
  const { selectedAddress } = useRestaurant();
  const router = useRouter();

  // --- State for CSRF Token ---
  const [csrfToken, setCsrfToken] = useState<string | null>(null);
  const [csrfError, setCsrfError] = useState<string | null>(null);
  // --- End State for CSRF Token ---

  // --- State for Loading (separate for token fetch vs order placement) ---
  const [isTokenLoading, setIsTokenLoading] = useState(true); // Loading state for token fetch
  const [isPlacingOrder, setIsPlacingOrder] = useState(false); // Loading state for order placement
  // --- End State for Loading ---
  // State to track if the user is logged in on the client
  const [isClientLoggedIn, setIsClientLoggedIn] = useState(false);
  // State to track if the login check has been performed
  const [isLoginCheckComplete, setIsLoginCheckComplete] = useState(false);

  // --- Fetch CSRF token on component mount ---
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
    setIsLoginCheckComplete(true)

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

      } catch (error: any) {
        setCsrfError('Could not load checkout form. Please try again later.');
      } finally {
          setIsTokenLoading(false); // Set token loading to false regardless of success/failure
      }
    };

    fetchCsrfToken();
  }, []); // Empty dependency array ensures this runs only once on mount
  // --- End Fetch CSRF token ---


  const deliveryFee = 1.49;
  const vatRate = 0.10;
  const vatAmount = getCartTotal() * vatRate;
  const totalWithFees = getCartTotal() + deliveryFee + vatAmount;

  const restaurantName = cartItems.length > 0 ? "Your Order" : "No items in cart";

  const getUserIdFromCookie = (): string | null => {
      const cookies = parseCookies();
      return cookies['userID'] || null;
  };

  const handlePlaceOrder = async () => {
    // Prevent placing order if cart is empty, no address selected, token is missing, or already placing order
    if (cartItems.length === 0 || !selectedAddress || !csrfToken || isPlacingOrder) {
        if (!csrfToken) {
             alert("Checkout form not fully loaded. Please try again.");
        } else if (cartItems.length === 0 || !selectedAddress) {
             alert("Please add items to your cart and select a delivery address to place an order.");
        }
        return;
    }

    setIsPlacingOrder(true); // Set placing order loading state

    const userId = getUserIdFromCookie();
    if (!userId) {
        console.error("Frontend: User ID cookie not found. User may not be logged in.");
        // The backend will handle the actual authentication check.
        // We proceed with the fetch, relying on backend @login_required.
    }

    const orderData = {
        cartItems: cartItems.map(item => ({
            name: item.name,
            price: item.price,
            quantity: item.quantity,
            imageUrl: item.imageUrl,
            specialInstructions: item.specialInstructions,
            selectedTastes: item.selectedTastes,
            selectedRecommended: item.selectedRecommended,
        })),
        deliveryAddress: selectedAddress,
        orderTotal: totalWithFees,
        paymentMethod: "Cash on Delivery",
    };

    try {
        const response = await fetch('http://localhost:5000/place_order', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                // --- Include CSRF token in the X-CSRFToken header ---
                'X-CSRFToken': csrfToken, // Include the fetched CSRF token
            },
            body: JSON.stringify(orderData),
            credentials: 'include', // Include cookies
        });

        if (response.redirected) {
             // The browser will follow the redirect to the login page.
             // Might want to handle this on the frontend, e.g., redirect to login page.
             // router.push('/auth/login'); // Example: Redirect to frontend login page
             // For now, we'll let the browser handle the redirect.
             setIsPlacingOrder(false); // Stop loading state
             return;
        }

        // --- Handle JSON response if no redirect occurred ---
        const contentType = response.headers.get("content-type");
        if (!response.ok) { // Check for non-2xx status codes
             if (contentType && contentType.indexOf("application/json") !== -1) {
                  const errorData = await response.json();
                  // Handle JSON error response from backend
                  alert(`Failed to place order: ${errorData.error || errorData.message || response.statusText}`);
             } else {
                  // Handle non-JSON error responses (like HTML CSRF error)
                  const errorText = await response.text();
                  // Attempt to extract a friendly message from the HTML
                  const parser = new DOMParser();
                  const htmlDoc = parser.parseFromString(errorText, 'text/html');
                  const errorMessageElement = htmlDoc.querySelector('h1') || htmlDoc.querySelector('p');
                  const friendlyErrorMessage = errorMessageElement ? errorMessageElement.textContent : 'Unknown server error.';
                  alert(`Failed to place order: ${response.status} ${response.statusText}. Server message: ${friendlyErrorMessage}`);
             }
        } else {
            // If response is OK (status 2xx), it should be JSON with success message
            console.log("Order placed successfully!");
            // Optional: Parse success message from backend if needed
            // const result = await response.json();
            // console.log(result.message);

            // Clear the cart data and cookie using the context function AFTER successful API call
            clearCart();

            // Route to the order completed page
            router.push('/layout/completed');
        }
        // --- End Handle JSON response ---

    } catch (error) {
        alert("An error occurred while placing your order. Please try again.");
    } finally {
        setIsPlacingOrder(false); // Always reset placing order loading state
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

  return (
    <div className="container mx-auto p-4 grid grid-cols-1 md:grid-cols-2 gap-8">
      {/* Left Column: Delivery Details and Payment */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-6">Delivery Details</h2>

        {/* --- Conditional rendering while fetching CSRF token --- */}
        {isTokenLoading ? (
            <p className="text-center text-gray-500">Loading checkout details...</p>
        ) : csrfError ? (
             <p className="text-center text-red-700">{csrfError}</p>
        ) : (
        // --- Content is displayed once token is loaded ---
        <>
            {/* Delivery Address */}
            <div className="mb-6 pb-6 border-b border-gray-200">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-lg font-semibold text-gray-700">Delivery address</h3>
                {/* Add a Change button here if needed */}
                {/* <button className="text-blue-600 hover:underline text-sm">Change</button> */}
              </div>
              {selectedAddress ? (
                <div className="text-gray-700">
                  <p className="font-medium">{selectedAddress.name || 'Selected Location'}</p>
                  <p>{selectedAddress.street}</p>
                  <p>{`${selectedAddress.suburb}, ${selectedAddress.state} ${selectedAddress.postcode}`}</p>
                  <p>{selectedAddress.country}</p>
                </div>
              ) : (
                <p className="text-gray-500">No delivery address selected.</p>
              )}
               {/* Placeholder for Note to rider */}
               <div className="mt-4">
                   <h4 className="text-md font-semibold text-gray-700 mb-2">Note to rider</h4>
                   <textarea
                    className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-700 text-sm"
                    rows={2}
                    placeholder="e.g., building, landmark"
                    // Would add state management for this textarea if want to save the note
                   ></textarea>
               </div>
            </div>

            {/* Contactless Delivery (Placeholder) */}
             <div className="flex items-center justify-between mb-6 pb-6 border-b border-gray-200">
                <span className="text-lg font-semibold text-gray-700">Contactless delivery</span>
                 {/* Placeholder for a toggle switch */}
                <div className="w-10 h-5 bg-gray-300 rounded-full peer dark:bg-gray-700 peer-focus:ring-4 peer-focus:ring-green-300 dark:peer-focus:ring-green-800 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-gray-600 peer-checked:bg-green-600"></div>
             </div>


            {/* Delivery Options (Placeholder) */}
             <div className="mb-6 pb-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-700 mb-3">Delivery options</h3>
                 {/* Placeholder for delivery options */}
                <div className="flex flex-col space-y-3">
                     <label className="inline-flex items-center">
                        <input type="radio" className="form-radio text-green-600" name="deliveryOption" value="standard" defaultChecked />
                        <span className="ml-2 text-gray-700">Standard 35-65 mins</span>
                     </label>
                     <label className="inline-flex items-center">
                        <input type="radio" className="form-radio text-green-600" name="deliveryOption" value="priority" />
                        <span className="ml-2 text-gray-700">Priority 30-45 mins <span className="text-sm text-gray-500">+ ${0.49.toFixed(2)}</span></span>
                     </label>
                </div>
             </div>


            {/* Payment */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-700 mb-3">Payment</h3>
              {/* Cash on Delivery Option */}
              <div className="border border-gray-300 rounded-md p-4 flex items-center space-x-3">
                 <input type="radio" className="form-radio text-green-600" name="paymentMethod" value="cash" defaultChecked />
                 <div className="flex flex-col">
                     <span className="font-medium text-gray-800">Cash on Delivery</span>
                     <span className="text-sm text-gray-600">Simply pay the driver, when he delivers the food to your doorstep.</span>
                 </div>
              </div>
            </div>

            {/* Apply a voucher (Placeholder) */}
             <div className="flex items-center text-blue-600 hover:underline cursor-pointer mb-6">
                 {/* Placeholder for voucher icon */}
                 <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
                </svg>
                 <span>Apply a voucher</span>
             </div>
        </>
        )} {/* End conditional rendering */}
      </div>

      {/* Right Column: Order Summary */}
      <div className="bg-white rounded-lg shadow-md p-6 h-fit sticky top-4">
        <h2 className="text-xl font-bold text-gray-800 mb-6">{restaurantName}</h2>

        {/* Order Items List */}
        <div className="space-y-4 mb-6 pb-6 border-b border-gray-200">
          {cartItems.length > 0 ? (
            cartItems.map(item => (
              <div key={item.id} className="flex justify-between items-start text-gray-700 text-sm">
                <div className="flex-grow mr-4">
                  <p className="font-medium">{item.quantity} x {item.name}</p>
                   {item.selectedTastes && item.selectedTastes.length > 0 && (
                       <p className="text-xs text-gray-500">Tastes: {item.selectedTastes.join(', ')}</p>
                   )}
                    {item.selectedRecommended && item.selectedRecommended.length > 0 && (
                       <p className="text-xs text-gray-500">Recommended: {item.selectedRecommended.join(', ')}</p>
                   )}
                   {item.specialInstructions && item.specialInstructions.trim() !== '' && (
                       <p className="text-xs text-gray-500">Instructions: {item.specialInstructions}</p>
                   )}
                </div>
                <span className="font-semibold">${(item.price * item.quantity).toFixed(2)}</span>
              </div>
            ))
          ) : (
            <p className="text-gray-500 text-center">Your cart is empty.</p>
          )}
        </div>

        {/* Price Breakdown */}
        <div className="space-y-2 text-gray-700 mb-6 pb-6 border-b border-gray-200">
            <div className="flex justify-between">
                <span>Subtotal</span>
                <span>${getCartTotal().toFixed(2)}</span>
            </div>
             <div className="flex justify-between">
                <span>Standard delivery</span>
                <span>${deliveryFee.toFixed(2)}</span>
            </div>
             <div className="flex justify-between">
                <span>VAT</span>
                <span>${vatAmount.toFixed(2)}</span>
            </div>
        </div>


        {/* Total */}
        <div className="flex justify-between items-center text-xl font-bold text-gray-800 mb-6">
          <span>Total</span>
          <span>${totalWithFees.toFixed(2)}</span>
        </div>

        {/* Place Order Button */}
        <button
          onClick={handlePlaceOrder}
          className="w-full px-6 py-3 bg-pink-600 text-white rounded-full font-semibold text-center hover:bg-pink-700 transition-colors duration-200 shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
          // Disable button if cart is empty, no address selected, token is missing, or already placing order
          disabled={cartItems.length === 0 || !selectedAddress || !csrfToken || isPlacingOrder}
        >
          {isPlacingOrder ? 'Placing Order...' : 'Place order'} {/* Change button text while placing order */}
        </button>
      </div>
    </div>
  );
};

export default CheckOut;