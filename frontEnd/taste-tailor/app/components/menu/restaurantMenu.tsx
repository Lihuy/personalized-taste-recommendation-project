'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation'; // Import useRouter
import { parseCookies } from 'nookies'; // Import parseCookies

import { ChevronDown, Star, X, Circle, CircleDot } from 'lucide-react';

import { useRestaurant } from '@/context/RestaurantContext'; // Import the custom hook

import FoodItemOverlay from '@/components/menu/foodItemOverlay'; // Import the new overlay component

// Reusable component for a single restaurant card
// Moved interface outside to be accessible by both components if needed elsewhere
interface Restaurant {
    id: number;
    name: string;
    cuisine: string;
    rating: number;
    reviews: string | number;
    deliveryFee: string;
    imageUrl: string;
    priceLevel: number; // Added price level (1-4)
    description: string; // Added description
    actualPrice: number; // Added actualPrice
    tastes: string[]; // Added tastes property
    recommended: string[]; // Added recommended property
}

const RestaurantCard = ({ restaurant, onClick }: { restaurant: Restaurant, onClick: (item: Restaurant) => void }) => {
    // Helper function to display price level as dollar signs
    const displayPriceLevel = (level: number): string => {
        return '$'.repeat(level);
    };

    return (
        // Add onClick handler to the card div
        <div
            className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300 cursor-pointer"
            onClick={() => onClick(restaurant)} // Call the onClick function passed from parent
        >
            {/* Restaurant Image */}
            <img
                src={restaurant.imageUrl || '/images/assets/placeholder.jpg'} // Placeholder with text fallback
                alt={restaurant.name}
                className="w-full h-40 object-cover"
                onError={(e) => { const target = e.target as HTMLImageElement; target.onerror = null; target.src = '/images/assets/placeholder.jpg'; }} // Fallback on error
            />

            {/* Restaurant Info */}
            <div className="p-4">
                <h3 className="text-lg font-semibold mb-1">{restaurant.name}</h3>
                <p className="text-sm text-gray-600 mb-2">{restaurant.cuisine}</p>

                <div className="flex items-center text-sm text-gray-700 mb-2">
                    {/* Star Icon using lucide-react */}
                    <Star className="w-4 h-4 text-yellow-500 mr-1" fill="currentColor" />
                    {restaurant.rating} ({restaurant.reviews})
                </div>

                <p className="text-sm text-gray-700">{restaurant.deliveryFee}</p>
                <p className="text-sm text-gray-700">{displayPriceLevel(restaurant.priceLevel)} </p> {/* Display price level */}
            </div>
        </div>
    );
};

// Updated props to accept the list of restaurants and the full list for other filters
interface RestaurantMenuProps {
    restaurants: Restaurant[]; // The list of restaurants to display (already filtered by search from context)
    allRestaurants: Restaurant[]; // The full list for applying other filters (from context)
}

export default function RestaurantMenu({ restaurants, allRestaurants }: RestaurantMenuProps) {
    const router = useRouter(); // Get the router instance

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
    }, []); // Dependency array includes router


    // Consume context for other filter/sort states and setters
    const {
        selectedCuisine, setSelectedCuisine,
        selectedFee, setSelectedFee,
        selectedRating, setSelectedRating,
        selectedPrice, setSelectedPrice,
        selectedSort, setSelectedSort
    } = useRestaurant();

    // State to control the visibility of the FoodItemOverlay
    const [isFoodItemOverlayOpen, setIsFoodItemOverlayOpen] = useState(false);

    // State to store the data of the selected food item
    const [selectedFoodItem, setSelectedFoodItem] = useState<Restaurant | null>(null);

    // State for Delivery Fee dropdown, pending selection, and applied filter
    const [isDeliveryFeeDropdownOpen, setIsDeliveryFeeDropdownOpen] = useState(false);
    const [pendingFee, setPendingFee] = useState<string | null>(selectedFee); // Initialize with context value
    const deliveryFeeButtonRef = useRef<HTMLButtonElement>(null);
    const deliveryFeeDropdownPanelRef = useRef<HTMLDivElement>(null);
    const [deliveryFeeDropdownPosition, setDeliveryFeeDropdownPosition] = useState({ top: 0, left: 0 });

    // State for Rating dropdown, pending selection, and applied filter
    const [isRatingDropdownOpen, setIsRatingDropdownOpen] = useState(false);
    const [pendingRating, setPendingRating] = useState<string | null>(selectedRating); // Initialize with context value
    const ratingButtonRef = useRef<HTMLButtonElement>(null);
    const ratingDropdownPanelRef = useRef<HTMLDivElement>(null);
    const [ratingDropdownPosition, setRatingDropdownPosition] = useState({ top: 0, left: 0 });

    // State for Price dropdown, pending selection, and applied filter
    const [isPriceDropdownOpen, setIsPriceDropdownOpen] = useState(false);
    const [pendingPrice, setPendingPrice] = useState<string | null>(selectedPrice); // Initialize with context value
    const priceButtonRef = useRef<HTMLButtonElement>(null);
    const priceDropdownPanelRef = useRef<HTMLDivElement>(null);
    const [priceDropdownPosition, setPriceDropdownPosition] = useState({ top: 0, left: 0 });

    // State for Sort dropdown, pending selection, and applied option
    const [isSortDropdownOpen, setIsSortDropdownOpen] = useState(false);
    const [pendingSort, setPendingSort] = useState<string | null>(selectedSort); // Initialize with context value
    const sortButtonRef = useRef<HTMLButtonElement>(null);
    const sortDropdownPanelRef = useRef<HTMLDivElement>(null);
    const [sortDropdownPosition, setSortDropdownPosition] = useState({ top: 0, left: 0 });

    // Sample data for filters (replace with actual data)
    const filters = [
        'Delivery Fee', 'Rating', 'Price', 'Sort',
    ];

    //--- Helper function to parse delivery fee string to number
    const parseDeliveryFee = (feeString: string): number => {
        const match = feeString.match(/\$(\d+(\.\d+)?)/);
        return match ? parseFloat(match[1]) : Infinity; // Return Infinity for cases like '$5+' or parsing errors
    };

    //--- Helper function to parse rating string to number
    const parseRating = (ratingString: string): number => {
        const match = ratingString.match(/(\d+(\.\d+)?)\+?/); // Match numbers like 3, 3.5, 4, 4.5, 5 and optional '+'
        return match ? parseFloat(match[1]) : 0; // Return 0 for parsing errors
    };

    // Filter and sort the provided restaurants based on selected filters and sort option
    const filteredAndSortedRestaurants = useMemo(() => {
        // Start with the list provided by the parent (already filtered by search from context)
        let currentRestaurants = restaurants;

        // Apply Cuisine Filter (still handled here for now)
        if (selectedCuisine !== null) {
            // We need to filter the "original" list by cuisine to ensure correct results
            // regardless of the initial search filter. Then apply other filters.
            // A more robust solution would lift cuisine filtering to the context provider.
            const cuisineFiltered = allRestaurants.filter(restaurant => restaurant.cuisine === selectedCuisine);
            // Now apply the other filters to this cuisine-filtered list
            currentRestaurants = cuisineFiltered;
        }

        // 2. Apply Delivery Fee Filter (based on selectedFee)
        if (selectedFee !== null) {
            const maxFee = selectedFee === '$5+' ? Infinity : parseDeliveryFee(selectedFee);
            currentRestaurants = currentRestaurants.filter(restaurant =>
                parseDeliveryFee(restaurant.deliveryFee) <= maxFee
            );
        }

        // 3. Apply Rating Filter (based on selectedRating)
        if (selectedRating !== null) {
            const minRating = parseRating(selectedRating);
            currentRestaurants = currentRestaurants.filter(restaurant => restaurant.rating >= minRating);
        }

        // 4. Apply Price Filter (based on selectedPrice)
        if (selectedPrice !== null) {
            // Convert price string ('$', '$$') to price level (1, 2)
            const selectedPriceLevel = selectedPrice.length;
            currentRestaurants = currentRestaurants.filter(restaurant => restaurant.priceLevel === selectedPriceLevel);
        }

        // 5. Apply Sorting (based on selectedSort)
        if (selectedSort) { // Only sort if a sort option is selected
            switch (selectedSort) {
                case 'Delivery Fee':
                    // Sort by delivery fee ascending
                    currentRestaurants = [...currentRestaurants].sort((a, b) => parseDeliveryFee(a.deliveryFee) - parseDeliveryFee(b.deliveryFee));
                    break;
                case 'Rating':
                    // Sort by rating descending
                    currentRestaurants = [...currentRestaurants].sort((a, b) => b.rating - a.rating);
                    break;
                case 'Price':
                    // Sort by price level ascending
                    currentRestaurants = [...currentRestaurants].sort((a, b) => a.priceLevel - b.priceLevel);
                    break;
                default:
                    break;
            }
        }
        return currentRestaurants;
    }, [restaurants, allRestaurants, selectedCuisine, selectedFee, selectedRating, selectedPrice, selectedSort]); // Dependencies for useMemo

    // Effect to handle clicks outside any open dropdown
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            // Helper function to check if click is outside a dropdown
            const isClickOutside = (isOpen: boolean, panelRef: React.RefObject<HTMLDivElement | null>, buttonRef: React.RefObject<HTMLButtonElement | null>) => {
                return isOpen && panelRef.current && !(event.target instanceof Node && panelRef.current.contains(event.target)) &&
                       buttonRef.current && !(event.target instanceof Node && buttonRef.current.contains(event.target));
            };

            if (isClickOutside(isDeliveryFeeDropdownOpen, deliveryFeeDropdownPanelRef, deliveryFeeButtonRef)) {
                closeDeliveryFeeDropdown();
            }
            if (isClickOutside(isRatingDropdownOpen, ratingDropdownPanelRef, ratingButtonRef)) {
                closeRatingDropdown();
            }
            if (isClickOutside(isPriceDropdownOpen, priceDropdownPanelRef, priceButtonRef)) {
                closePriceDropdown();
            }
            if (isClickOutside(isSortDropdownOpen, sortDropdownPanelRef, sortButtonRef)) {
                closeSortDropdown();
            }
        };

        // Add event listener when any dropdown is open
        if (isDeliveryFeeDropdownOpen || isRatingDropdownOpen || isPriceDropdownOpen || isSortDropdownOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        // Clean up the event listener when the component unmounts or all dropdowns close
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };

    }, [isDeliveryFeeDropdownOpen, isRatingDropdownOpen, isPriceDropdownOpen, isSortDropdownOpen]); // Re-run effect when any state changes

    //--- Delivery Fee Dropdown Functions
    const toggleDeliveryFeeDropdown = () => {
        // Close other dropdowns if open
        if (isRatingDropdownOpen) closeRatingDropdown();
        if (isPriceDropdownOpen) closePriceDropdown();
        if (isSortDropdownOpen) closeSortDropdown();

        if (!isDeliveryFeeDropdownOpen) {
            setPendingFee(selectedFee); // Initialize pending with current applied filter
            setIsDeliveryFeeDropdownOpen(true);
            if (deliveryFeeButtonRef.current) {
                const rect = deliveryFeeButtonRef.current.getBoundingClientRect();
                // Position below the button, aligned left
                setDeliveryFeeDropdownPosition({ top: rect.bottom + 8, left: rect.left });
            }
        } else {
            setIsDeliveryFeeDropdownOpen(false);
        }
    };

    const closeDeliveryFeeDropdown = () => {
        setIsDeliveryFeeDropdownOpen(false);
    };

    const handleFeeSelect = (fee: string | null): void => {
        setPendingFee(fee); // Update pending state
        // console.log("Pending fee:", fee); // Optional: for debugging
    };

    const handleFeeReset = () => {
        setPendingFee(null); // Reset pending state
        setSelectedFee(null); // Reset applied state in context
        // console.log("Fee filters reset"); // Optional: for debugging
        closeDeliveryFeeDropdown(); // Close dropdown after reset
    };

    const handleFeeApply = () => {
        setSelectedFee(pendingFee); // Apply the pending filter to context
        // console.log("Fee filters applied with selected fee:", pendingFee); // Optional: for debugging
        // The filtering is handled by the useMemo hook reacting to selectedFee state change
        closeDeliveryFeeDropdown(); // Close dropdown on apply
    };

    //--- Rating Dropdown Functions
    const toggleRatingDropdown = () => {
        // Close other dropdowns if open
        if (isDeliveryFeeDropdownOpen) closeDeliveryFeeDropdown();
        if (isPriceDropdownOpen) closePriceDropdown();
        if (isSortDropdownOpen) closeSortDropdown();

        // When opening, set pending state to the current applied state
        if (!isRatingDropdownOpen) {
            setPendingRating(selectedRating); // Initialize pending with current applied filter
            setIsRatingDropdownOpen(true);
            if (ratingButtonRef.current) {
                const rect = ratingButtonRef.current.getBoundingClientRect();
                // Position below the button, aligned left
                setRatingDropdownPosition({ top: rect.bottom + 8, left: rect.left });
            }
        } else {
            setIsRatingDropdownOpen(false);
        }
    };

    const closeRatingDropdown = () => {
        setIsRatingDropdownOpen(false);
    };

    const handleRatingSelect = (rating: string | null): void => {
        setPendingRating(rating); // Update pending state
        // console.log("Pending rating:", rating); // Optional: for debugging
    };

    const handleRatingReset = () => {
        setPendingRating(null); // Reset pending state
        setSelectedRating(null); // Reset applied state in context
        // console.log("Rating filters reset"); // Optional: for debugging
        closeRatingDropdown(); // Close dropdown after reset
    };

    const handleRatingApply = () => {
        setSelectedRating(pendingRating); // Apply the pending filter to context
        // console.log("Rating filters applied with selected rating:", pendingRating); // Optional: for debugging
        // The filtering is handled by the useMemo hook reacting to selectedRating state change
        closeRatingDropdown(); // Close dropdown on apply
    };

    // --- Price Dropdown Functions ---
    const togglePriceDropdown = () => {
        // Close other dropdowns if open
        if (isDeliveryFeeDropdownOpen) closeDeliveryFeeDropdown();
        if (isRatingDropdownOpen) closeRatingDropdown();
        if (isSortDropdownOpen) closeSortDropdown();
        // When opening, set pending state to the current applied state
        if (!isPriceDropdownOpen) {
            setPendingPrice(selectedPrice); // Initialize pending with current applied filter
            setIsPriceDropdownOpen(true);
            if (priceButtonRef.current) {
                const rect = priceButtonRef.current.getBoundingClientRect();
                // Position below the button, aligned left
                setPriceDropdownPosition({ top: rect.bottom + 8, left: rect.left });
            }
        } else {
            setIsPriceDropdownOpen(false);
        }
    };

    const closePriceDropdown = () => {
        setIsPriceDropdownOpen(false);
    };

    const handlePriceSelect = (price: string): void => {
        setPendingPrice(price); // Update pending state
        // console.log("Pending price:", price); // Optional: for debugging
    };

    const handlePriceReset = () => {
        setPendingPrice(null); // Reset pending state
        setSelectedPrice(null); // Reset applied state in context
        // console.log("Price filters reset"); // Optional: for debugging
        closePriceDropdown(); // Close dropdown after reset
    };

    const handlePriceApply = () => {
        setSelectedPrice(pendingPrice); // Apply the pending filter to context
        // console.log("Price filters applied with selected price:", pendingPrice); // Optional: for debugging
        // The filtering is handled by the useMemo hook reacting to selectedPrice state change
        closePriceDropdown(); // Close dropdown on apply
    };

    // --- Sort Dropdown Functions ---
    const toggleSortDropdown = () => {
        // Close other dropdowns if open
        if (isDeliveryFeeDropdownOpen) closeDeliveryFeeDropdown();
        if (isRatingDropdownOpen) closeRatingDropdown();
        if (isPriceDropdownOpen) closePriceDropdown();
        // When opening, set pending state to the current applied state
        if (!isSortDropdownOpen) {
            setPendingSort(selectedSort); // Initialize pending with current applied sort
            setIsSortDropdownOpen(true);
            if (sortButtonRef.current) {
                const rect = sortButtonRef.current.getBoundingClientRect();
                // Position below the button, aligned left
                setSortDropdownPosition({ top: rect.bottom + 8, left: rect.left });
            }
        } else {
            setIsSortDropdownOpen(false);
        }
    };

    const closeSortDropdown = () => {
        setIsSortDropdownOpen(false);
    };

    const handleSortSelect = (sortOption: string | null): void => {
        setPendingSort(sortOption); // Update pending state
        // console.log("Pending sort option:", sortOption); // Optional: for debugging
    };

    const handleSortReset = () => {
        setPendingSort(null); // Reset pending state to null
        setSelectedSort(null); // Reset applied state to null in context
        // console.log("Sort filter reset"); // Optional: for debugging
        closeSortDropdown(); // Close dropdown after reset
    };

    const handleSortApply = () => {
        setSelectedSort(pendingSort); // Apply the pending sort option to context
        // console.log("Sort filter applied with selected option:", pendingSort); // Optional: for debugging
        // The sorting is handled by the useMemo hook reacting to selectedSort state change
        closeSortDropdown(); // Close dropdown on apply
    };

    // --- Food Item Overlay Functions ---
    const openFoodItemOverlay = (item: Restaurant) => {
        setSelectedFoodItem(item); // Set the selected item
        setIsFoodItemOverlayOpen(true); // Open the overlay
    };
    const closeFoodItemOverlay = () => {
        setIsFoodItemOverlayOpen(false); // Close the overlay
        setSelectedFoodItem(null); // Clear the selected item
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
    return (
        <div className="min-h-screen bg-gray-100 relative">
            {/* Filters Bar */}
            <div className="overflow-x-auto py-2 px-4 bg-white border-t border-gray-200">
                <div className="flex space-x-4 whitespace-nowrap">
                    {filters.map((filter, index) => {
                        // Render different buttons based on the filter name
                        if (filter === 'Delivery Fee') {
                            return (
                                <button
                                    key={index}
                                    onClick={toggleDeliveryFeeDropdown}
                                    className={`px-4 py-2 rounded-full border text-sm font-medium transition-colors duration-200 flex items-center relative ${selectedFee ? 'border-blue-500 text-blue-500 bg-blue-50' : 'border-gray-300 text-gray-700 hover:bg-gray-100'}`}
                                    aria-haspopup="true"
                                    aria-expanded={isDeliveryFeeDropdownOpen}
                                    ref={deliveryFeeButtonRef}
                                >
                                    {filter} {selectedFee && <X size={14} className="ml-1 text-blue-500" onClick={(e) => { e.stopPropagation(); handleFeeReset(); }} />} {/* Add reset icon if filter is active */}
                                    <ChevronDown size={16} className={`ml-1 transition-transform duration-200 ${isDeliveryFeeDropdownOpen ? 'rotate-180' : 'rotate-0'}`} />
                                </button>
                            );
                        } else if (filter === 'Rating') {
                            return (
                                <button
                                    key={index}
                                    onClick={toggleRatingDropdown}
                                    className={`px-4 py-2 rounded-full border text-sm font-medium transition-colors duration-200 flex items-center relative ${selectedRating ? 'border-blue-500 text-blue-500 bg-blue-50' : 'border-gray-300 text-gray-700 hover:bg-gray-100'}`}
                                    aria-haspopup="true"
                                    aria-expanded={isRatingDropdownOpen}
                                    ref={ratingButtonRef}
                                >
                                    {filter} {selectedRating && <X size={14} className="ml-1 text-blue-500" onClick={(e) => { e.stopPropagation(); handleRatingReset(); }} />} {/* Add reset icon if filter is active */}
                                    <ChevronDown size={16} className={`ml-1 transition-transform duration-200 ${isRatingDropdownOpen ? 'rotate-180' : 'rotate-0'}`} />
                                </button>
                            );
                        } else if (filter === 'Price') {
                            return (
                                <button
                                    key={index}
                                    onClick={togglePriceDropdown}
                                    className={`px-4 py-2 rounded-full border text-sm font-medium transition-colors duration-200 flex items-center relative ${selectedPrice ? 'border-blue-500 text-blue-500 bg-blue-50' : 'border-gray-300 text-gray-700 hover:bg-gray-100'}`}
                                    aria-haspopup="true"
                                    aria-expanded={isPriceDropdownOpen}
                                    ref={priceButtonRef}
                                >
                                    {filter} {selectedPrice && <X size={14} className="ml-1 text-blue-500" onClick={(e) => { e.stopPropagation(); handlePriceReset(); }} />} {/* Add reset icon if filter is active */}
                                    <ChevronDown size={16} className={`ml-1 transition-transform duration-200 ${isPriceDropdownOpen ? 'rotate-180' : 'rotate-0'}`} />
                                </button>
                            );
                        } else if (filter === 'Sort') {
                            // Sort button displays the selected sort option, or "Sort" if none selected
                            return (
                                <button
                                    key={index}
                                    onClick={toggleSortDropdown}
                                    className={`px-4 py-2 rounded-full border text-sm font-medium transition-colors duration-200 flex items-center relative ${selectedSort ? 'border-blue-500 text-blue-500 bg-blue-50' : 'border-gray-300 text-gray-700 hover:bg-gray-100'}`}
                                    aria-haspopup="true"
                                    aria-expanded={isSortDropdownOpen}
                                    ref={sortButtonRef}
                                >
                                    {selectedSort || 'Sort'} {/* Display the selected sort option or 'Sort' */}
                                    {selectedSort && <X size={14} className="ml-1 text-blue-500" onClick={(e) => { e.stopPropagation(); handleSortReset(); }} />} {/* Add reset icon if sort is active */}
                                    <ChevronDown size={16} className={`ml-1 transition-transform duration-200 ${isSortDropdownOpen ? 'rotate-180' : 'rotate-0'}`} />
                                </button>
                            );
                        }
                        else {
                            // Default button for any other filters (though we've covered all in filters array)
                            return (
                                <button
                                    key={index}
                                    className="px-4 py-2 rounded-full border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors duration-200 flex items-center"
                                >
                                    {filter} {/* No dropdown icon for default */}
                                </button>
                            );
                        }
                    })}
                </div>
            </div>
            {/* Delivery Fee Dropdown Panel */}
            {isDeliveryFeeDropdownOpen && (
                <div
                    ref={deliveryFeeDropdownPanelRef}
                    className="fixed z-50 w-64 bg-white rounded-lg shadow-xl p-4 border border-gray-200"
                    style={{ top: deliveryFeeDropdownPosition.top, left: deliveryFeeDropdownPosition.left }}
                >
                    {/* Dropdown Header */}
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold">Delivery Fee</h3>
                        <button onClick={closeDeliveryFeeDropdown} aria-label="Close dropdown">
                            <X size={20} className="text-gray-500 hover:text-gray-700" />
                        </button>
                    </div>
                    {/* Price Range Options (Clickable points) */}
                    <div className="mt-4 mb-6">
                        <p className="text-sm text-gray-700 mb-2">Select Max Fee:</p>
                        {/* Clickable price points - use pendingFee for highlighting */}
                        <div className="flex justify-between text-sm text-gray-600">
                            {['$1', '$3', '$5', '$5+'].map((feeOption) => (
                                <button
                                    key={feeOption}
                                    className={`px-3 py-1 rounded-full text-sm font-medium transition-colors duration-200 ${
                                        pendingFee === feeOption ? 'bg-blue-500 text-white' : 'hover:bg-gray-200'
                                    }`}
                                    onClick={() => handleFeeSelect(feeOption)}
                                >
                                    {feeOption}
                                </button>
                            ))}
                        </div>
                    </div>
                    {/* Action Buttons */}
                    <div className="flex justify-end space-x-3 mt-4"> {/* Added mt-4 for spacing */}
                        <button
                            onClick={handleFeeReset}
                            className="px-4 py-2 text-sm font-medium text-gray-700 rounded-md hover:bg-gray-100 transition-colors duration-200"
                        >
                            Reset
                        </button>
                        <button
                            onClick={handleFeeApply}
                            className="px-4 py-2 text-sm font-medium text-white bg-green-500 rounded-md hover:bg-green-600 transition-colors duration-200 shadow-md"
                        >
                            Apply
                        </button>
                    </div>
                </div>
            )}
            {/* Rating Dropdown Panel */}
            {isRatingDropdownOpen && (
                <div
                    ref={ratingDropdownPanelRef}
                    className="fixed z-50 w-64 bg-white rounded-lg shadow-xl p-4 border border-gray-200"
                    style={{ top: ratingDropdownPosition.top, left: ratingDropdownPosition.left }}
                >
                    {/* Dropdown Header */}
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold">Rating</h3>
                        <button onClick={closeRatingDropdown} aria-label="Close dropdown">
                            <X size={20} className="text-gray-500 hover:text-gray-700" />
                        </button>
                    </div>
                    {/* Rating Options (Clickable points) */}
                    <div className="mt-4 mb-6">
                        <p className="text-sm text-gray-700 mb-2">Select Minimum Rating:</p>
                        {/* Clickable rating points - use pendingRating for highlighting */}
                        <div className="flex justify-between text-sm text-gray-600">
                            {['3+', '3.5+', '4+', '4.5+', '5'].map((ratingOption) => (
                                <button
                                    key={ratingOption}
                                    className={`px-3 py-1 rounded-full text-sm font-medium transition-colors duration-200 ${
                                        pendingRating === ratingOption ? 'bg-blue-500 text-white' : 'hover:bg-gray-200'
                                    }`}
                                    onClick={() => handleRatingSelect(ratingOption)}
                                >
                                    {ratingOption}
                                </button>
                            ))}
                        </div>
                    </div>
                    {/* Action Buttons */}
                    <div className="flex justify-end space-x-3 mt-4"> {/* Added mt-4 for spacing */}
                        <button
                            onClick={handleRatingReset}
                            className="px-4 py-2 text-sm font-medium text-gray-700 rounded-md hover:bg-gray-100 transition-colors duration-200"
                        >
                            Reset
                        </button>
                        <button
                            onClick={handleRatingApply}
                            className="px-4 py-2 text-sm font-medium text-white bg-green-500 rounded-md hover:bg-green-600 transition-colors duration-200 shadow-md"
                        >
                            Apply
                        </button>
                    </div>
                </div>
            )}
            {/* Price Dropdown Panel */}
            {isPriceDropdownOpen && (
                <div
                    ref={priceDropdownPanelRef}
                    className="fixed z-50 w-68 bg-white rounded-lg shadow-xl p-4 border border-gray-200"
                    style={{ top: priceDropdownPosition.top, left: priceDropdownPosition.left }}
                >
                    {/* Dropdown Header */}
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold">Price</h3>
                        <button onClick={closePriceDropdown} aria-label="Close dropdown">
                            <X size={20} className="text-gray-500 hover:text-gray-700" />
                        </button>
                    </div>
                    {/* Price Options (Buttons) */}
                    <div className="flex space-x-2 mb-6">
                        {['$', '$$', '$$$', '$$$$'].map((priceOption) => (
                            <button
                                key={priceOption}
                                className={`px-4 py-2 rounded-full border text-sm font-medium transition-colors duration-200 whitespace-nowrap ${
                                    pendingPrice === priceOption ? 'bg-blue-500 text-white border-blue-500' : 'border-gray-300 text-gray-700 hover:bg-gray-100'
                                }`}
                                onClick={() => handlePriceSelect(priceOption)}
                            >
                                {priceOption}
                            </button>
                        ))}
                    </div>
                    {/* Action Buttons */}
                    <div className="flex justify-end space-x-3">
                        <button
                            onClick={handlePriceReset}
                            className="px-4 py-2 text-sm font-medium text-gray-700 rounded-md hover:bg-gray-100 transition-colors duration-200"
                        >
                            Reset
                        </button>
                        <button
                            onClick={handlePriceApply}
                            className="px-4 py-2 text-sm font-medium text-white bg-green-500 rounded-md hover:bg-green-600 transition-colors duration-200 shadow-md"
                        >
                            Apply
                        </button>
                    </div>
                </div>
            )}
            {/* Sort Dropdown Panel */}
            {isSortDropdownOpen && (
                <div
                    ref={sortDropdownPanelRef}
                    className="fixed z-50 w-64 bg-white rounded-lg shadow-xl p-4 border border-gray-200"
                    style={{ top: sortDropdownPosition.top, left: sortDropdownPosition.left }}
                >
                    {/* Dropdown Header */}
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold">Sort</h3>
                        <button onClick={closeSortDropdown} aria-label="Close dropdown">
                            <X size={20} className="text-gray-500 hover:text-gray-700" />
                        </button>
                    </div>
                    {/* Updated Sort Options (Radio Buttons) - use pendingSort for selection indicator */}
                    <div className="flex flex-col space-y-2">
                        {['Delivery Fee', 'Rating', 'Price'].map((sortOption) => (
                            <div
                                key={sortOption}
                                className="flex items-center cursor-pointer py-2 px-3 rounded-md hover:bg-gray-100 transition-colors duration-200"
                                onClick={() => handleSortSelect(sortOption)}
                            >
                                {pendingSort === sortOption ? (
                                    <CircleDot size={20} className="text-blue-500 mr-3" />
                                ) : (
                                    <Circle size={20} className="text-gray-400 mr-3" />
                                )}
                                <span className="text-sm text-gray-700">{sortOption}</span>
                            </div>
                        ))}
                    </div>
                    {/* Action Buttons */}
                    <div className="flex justify-end space-x-3 mt-4">
                        <button
                            onClick={handleSortReset}
                            className="px-4 py-2 text-sm font-medium text-gray-700 rounded-md hover:bg-gray-100 transition-colors duration-200"
                        >
                            Reset
                        </button>
                        <button
                            onClick={handleSortApply}
                            className="px-4 py-2 text-sm font-medium text-white bg-green-500 rounded-md hover:bg-green-600 transition-colors duration-200 shadow-md"
                        >
                            Apply
                        </button>
                    </div>
                </div>
            )}
            {/* Restaurant Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-4">
                {filteredAndSortedRestaurants.map((restaurant) => (
                    // Pass the openFoodItemOverlay function to the RestaurantCard
                    <RestaurantCard key={restaurant.id} restaurant={restaurant} onClick={openFoodItemOverlay} />
                ))}
            </div>
            {/* Render the FoodItemOverlay */}
            <FoodItemOverlay
                isOpen={isFoodItemOverlayOpen}
                onClose={closeFoodItemOverlay}
                item={selectedFoodItem} // Pass the selected item data
            />
        </div>
    );
}