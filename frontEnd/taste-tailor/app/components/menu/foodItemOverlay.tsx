'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { X } from 'lucide-react';
import { Restaurant } from '@/context/RestaurantContext'; // Import the Restaurant type
import { useShoppingCart } from '@/context/ShoppingCartContext'; // Import the Shopping Cart hook

// Define the props for the FoodItemOverlay component
interface FoodItemOverlayProps {
  isOpen: boolean; // Controls the visibility of the overlay
  onClose: () => void; // Function to call when the overlay should close
  item: Restaurant | null; // The food item data to display, or null if no item is selected
}

const FoodItemOverlay: React.FC<FoodItemOverlayProps> = ({ isOpen, onClose, item }) => {
  // State for the quantity of the item to add to the cart
  const [quantity, setQuantity] = useState(1);
  // State for special instructions
  const [specialInstructions, setSpecialInstructions] = useState('');
  // State for selected tastes
  const [selectedTastes, setSelectedTastes] = useState<string[]>([]);
  // State for selected recommended items
  const [selectedRecommended, setSelectedRecommended] = useState<string[]>([]);

  // Consume the shopping cart context
  const { addItemToCart } = useShoppingCart();

  // Reset quantity, special instructions, and selections when the item changes or overlay opens
  useEffect(() => {
    if (isOpen && item) {
      setQuantity(1);
      setSpecialInstructions('');
      setSelectedTastes([]); // Reset selected tastes
      setSelectedRecommended([]); // Reset selected recommended
    }
  }, [isOpen, item]);


  // If no item is provided or the overlay is not open, render nothing
  if (!isOpen || !item) {
    return null;
  }

  // Helper function to display price level as dollar signs
  const displayPriceLevel = (level: number): string => {
    return '$'.repeat(level);
  };

  // Handle quantity changes
  const handleQuantityChange = (amount: number) => {
    setQuantity(prevQuantity => Math.max(1, prevQuantity + amount)); // Ensure quantity is at least 1
  };

  // Handle toggling selection of a taste
  const handleTasteSelect = (taste: string) => {
    setSelectedTastes(prevSelected =>
      prevSelected.includes(taste)
        ? prevSelected.filter(t => t !== taste) // Deselect if already selected
        : [...prevSelected, taste] // Select if not selected
    );
  };

  // Handle toggling selection of a recommended item
  const handleRecommendedSelect = (rec: string) => {
    setSelectedRecommended(prevSelected =>
      prevSelected.includes(rec)
        ? prevSelected.filter(r => r !== rec) // Deselect if already selected
        : [...prevSelected, rec] // Select if not selected
    );
  };


  // Handle adding the item to the cart
  const handleAddToCart = () => {
    if (item) {
      // Call the addItemToCart function from the context, passing selections
      addItemToCart(item, quantity, specialInstructions, selectedTastes, selectedRecommended);
      console.log(`Added ${quantity} of ${item.name} to cart with instructions: "${specialInstructions}", tastes: [${selectedTastes.join(', ')}], recommended: [${selectedRecommended.join(', ')}]`);
      onClose(); // Close the overlay after adding to cart
    }
  };

  return (
    <>
      {/* Backdrop Overlay */}
      {/* This creates a semi-transparent background that covers the rest of the page */}
      <div
        className={`fixed inset-0 bg-black z-40 transition-opacity duration-300 ${
          isOpen ? 'opacity-50 visible' : 'opacity-0 invisible'
        }`}
        onClick={onClose} // Close the overlay when clicking the backdrop
      ></div>

      {/* Food Item Detail Panel - Centered Modal Style */}
      <div
        className={`fixed inset-0 flex items-center justify-center z-50 p-4`} // Centering classes
      >
        {/* Modal Content Wrapper - Added background, rounded corners, shadow, and max-width */}
        <div
          className={`bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto transform transition-all duration-300 ease-in-out
            ${isOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}
          `}
          // Prevent clicks inside the modal from closing the overlay
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close Button */}
          <button
            onClick={onClose}
            aria-label="Close item details"
            className="absolute top-4 right-4 z-10 p-2 bg-white rounded-full shadow-md cursor-pointer transition-colors hover:bg-gray-100 duration-200"
          >
            <X size={24} className="text-gray-700" />
          </button>

          {/* Item Image */}
          <div className="relative w-full h-48 md:h-64">
             <Image
              src={item.imageUrl || '/images/assets/placeholder.jpg'} // Use item's image or placeholder
              alt={item.name}
              layout="fill" // Use layout="fill" for responsive images
              objectFit="cover" // Cover the container while maintaining aspect ratio
              className="rounded-t-lg" // Apply rounded corners to the top of the image
              onError={(e) => { const target = e.target as HTMLImageElement; target.onerror = null; target.src='/images/assets/placeholder.jpg'; }} // Fallback on error
            />
          </div>


          {/* Item Details Content */}
          <div className="p-6">
            {/* Name and Price */}
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-2xl font-bold text-gray-800">{item.name}</h2>
              {/* Display actual price and price level */}
              <div className="text-xl font-semibold text-green-600">
                  ${item.actualPrice.toFixed(2)} {/* Display actual price */}
              </div>
            </div>

            {/* Description */}
            <p className="text-gray-700 mb-6">{item.description}</p>

            {/* Choice of Tastes */}
            {item.tastes && item.tastes.length > 0 && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-3 text-gray-800">Choice of Tastes</h3>
                <div className="flex flex-wrap gap-2">
                  {item.tastes.map((taste, index) => (
                    <button
                      key={index}
                      className={`px-4 py-2 rounded-full text-sm font-medium transition-colors duration-200 ${
                        selectedTastes.includes(taste)
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                      onClick={() => handleTasteSelect(taste)}
                    >
                      {taste}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Recommended Together */}
             {item.recommended && item.recommended.length > 0 && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-3 text-gray-800">Recommended Together</h3>
                <div className="flex flex-wrap gap-2">
                  {item.recommended.map((rec, index) => (
                    <button
                       key={index}
                       className={`px-4 py-2 rounded-full text-sm font-medium transition-colors duration-200 ${
                         selectedRecommended.includes(rec)
                           ? 'bg-blue-500 text-white'
                           : 'bg-blue-100 text-blue-800 hover:bg-blue-200'
                       }`}
                       onClick={() => handleRecommendedSelect(rec)}
                    >
                      {rec}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Special Instructions */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-3 text-gray-800">Special Instructions</h3>
              <textarea
                className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-700"
                rows={3}
                placeholder="e.g., No onions, extra sauce, etc."
                value={specialInstructions}
                onChange={(e) => setSpecialInstructions(e.target.value)}
              ></textarea>
            </div>

            {/* Quantity and Add to Cart Button */}
            <div className="flex items-center justify-between mt-8">
              {/* Quantity Controls */}
              <div className="flex items-center border border-gray-300 rounded-full overflow-hidden">
                <button
                  onClick={() => handleQuantityChange(-1)}
                  className="px-4 py-2 bg-gray-200 text-gray-700 cursor-pointer transition-colors hover:bg-gray-300 duration-200"
                  aria-label="Decrease quantity"
                >
                  -
                </button>
                <span className="px-6 py-2 text-lg font-semibold text-gray-800">{quantity}</span>
                <button
                  onClick={() => handleQuantityChange(1)}
                  className="px-4 py-2 bg-gray-200 text-gray-700 cursor-pointer transition-colors hover:bg-gray-300 duration-200"
                  aria-label="Increase quantity"
                >
                  +
                </button>
              </div>

              {/* Add to Cart Button */}
              <button
                onClick={handleAddToCart}
                className="px-8 py-3 bg-green-600 text-white rounded-full font-bold text-lg cursor-pointer transition-colors hover:bg-green-700 duration-200 shadow-md"
              >
                Add to Cart
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default FoodItemOverlay;