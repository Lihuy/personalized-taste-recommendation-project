'use client';

import React from 'react';
import { X } from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation'; // Import useRouter
import { useShoppingCart, CartItem } from '@/context/ShoppingCartContext'; // Import the Shopping Cart hook and CartItem type

interface ShoppingCartOverlayProps {
  isOpen: boolean; // Prop to control visibility
  onClose: () => void; // Prop for the close button
}

const ShoppingCartOverlay: React.FC<ShoppingCartOverlayProps> = ({ isOpen, onClose }) => {
  // Consume the shopping cart context
  const { cartItems, updateItemQuantity, removeItemFromCart, getCartTotal } = useShoppingCart();
  // Get the router instance
  const router = useRouter();

  // Handle quantity change for an item in the cart
  const handleCartItemQuantityChange = (itemId: number, amount: number) => {
    const item = cartItems.find(item => item.id === itemId);
    if (item) {
      updateItemQuantity(itemId, item.quantity + amount);
    }
  };

  // Handle removing an item from the cart
  const handleRemoveItem = (itemId: number) => {
    removeItemFromCart(itemId);
  };

  // Handle clicking the "Go to checkout" button
  const handleGoToCheckout = () => {
    onClose(); // Close the cart overlay
    router.push('/layout/checkout'); // Navigate to the checkout page
  };


  return (
    <>
      {/* Backdrop Overlay */}
      {/* This creates a semi-transparent background that covers the rest of the page */}
      <div
        className={`fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity duration-300 ${
          isOpen ? 'opacity-50 visible' : 'opacity-0 invisible'
        }`}
        onClick={onClose} // Close the overlay when clicking the backdrop
      ></div>

      {/* Shopping Cart Panel */}
      <div
        className={`fixed top-0 right-0 h-full w-full md:w-96 bg-white shadow-xl transform transition-transform duration-300 ease-in-out z-50 flex flex-col
        ${isOpen ? 'translate-x-0' : 'translate-x-full'}
        `}  // Added flex-col for layout
      >
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold">Your Cart ({cartItems.length})</h2> {/* Display number of unique items */}
          <button onClick={onClose} aria-label="Close shopping cart">
            <X size={24} className="text-gray-500 hover:text-gray-700" />
          </button>
        </div>

        {/* Cart Items or Empty Cart Message */}
        {cartItems.length === 0 ? (
          // Empty Cart Content
          <div className="flex flex-col items-center justify-center h-full p-6 text-center">
            <Image
              src="/images/assets/empty.png" // Replace with empty cart image path
              alt="Empty Shopping Cart"
              width={150}
              height={150}
              className="mb-6"
            />
            <h3 className="text-xl font-semibold mb-2">Add items to start a cart</h3>
            <p className="text-gray-600 mb-6">
              Once you add items from a restaurant or store, your cart will appear here.
            </p>
          </div>
        ) : (
          // Cart Items List
          <div className="flex-grow overflow-y-auto p-4"> {/* Added flex-grow and overflow */}
            {cartItems.map(item => (
              // Use a more unique key if possible, perhaps a combination of item ID and selections
              // For simplicity, using item.id for now, but be aware this might cause issues if the same item with different options is added.
              <div key={item.id} className="flex items-start border-b border-gray-200 py-4 last:border-b-0">
                {/* Item Image */}
                <div className="flex-shrink-0 mr-4">
                  <Image
                    src={item.imageUrl || '/images/assets/placeholder.jpg'} // Use item's image or placeholder
                    alt={item.name}
                    width={64} // Adjust size as needed
                    height={64} // Adjust size as needed
                    objectFit="cover"
                    className="rounded-md"
                    onError={(e) => { const target = e.target as HTMLImageElement; target.onerror = null; target.src='/images/assets/placeholder.jpg'; }} // Fallback on error
                  />
                </div>

                {/* Item Details */}
                <div className="flex-grow">
                  <h3 className="font-semibold text-gray-800">{item.name}</h3>
                  {/* Display selected tastes if available */}
                  {item.selectedTastes && item.selectedTastes.length > 0 && (
                      <p className="text-sm text-gray-600 mt-1">
                          <span className="font-medium">Tastes:</span> {item.selectedTastes.join(', ')}
                      </p>
                  )}
                   {/* Display selected recommended if available */}
                  {item.selectedRecommended && item.selectedRecommended.length > 0 && (
                      <p className="text-sm text-gray-600 mt-1">
                           <span className="font-medium">Recommended:</span> {item.selectedRecommended.join(', ')}
                      </p>
                  )}
                  {item.specialInstructions && item.specialInstructions.trim() !== '' && ( // Only display if instructions are not empty
                    <p className="text-sm text-gray-600 mt-1">
                      <span className="font-medium">Instructions:</span> {item.specialInstructions}
                    </p>
                  )}
                  <div className="flex items-center justify-between mt-2">
                     <span className="font-semibold text-gray-800">${(item.price * item.quantity).toFixed(2)}</span> {/* Total price for this item */}
                     {/* Quantity Controls */}
                    <div className="flex items-center border border-gray-300 rounded-full overflow-hidden">
                      <button
                        onClick={() => handleCartItemQuantityChange(item.id, -1)}
                        className="px-3 py-1 bg-gray-200 text-gray-700 hover:bg-gray-300 transition-colors duration-200 text-sm"
                        aria-label="Decrease quantity"
                      >
                        -
                      </button>
                      <span className="px-4 py-1 text-sm font-semibold text-gray-800">{item.quantity}</span>
                      <button
                        onClick={() => handleCartItemQuantityChange(item.id, 1)}
                        className="px-3 py-1 bg-gray-200 text-gray-700 hover:bg-gray-300 transition-colors duration-200 text-sm"
                        aria-label="Increase quantity"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>

                {/* Remove Button (Optional - can be an X icon) */}
                 <button
                    onClick={() => handleRemoveItem(item.id)}
                    className="flex-shrink-0 ml-4 p-1 text-gray-400 hover:text-red-500 transition-colors duration-200"
                    aria-label="Remove item"
                 >
                    <X size={16} />
                 </button>
              </div>
            ))}
          </div>
        )}

        {/* Footer with Total and Checkout Button */}
        {cartItems.length > 0 && (
          <div className="p-4 border-t border-gray-200">
            <div className="flex justify-between items-center mb-4">
              <span className="text-lg font-semibold">Total:</span>
              <span className="text-lg font-bold text-green-600">${getCartTotal().toFixed(2)}</span>
            </div>
            <button
              onClick={handleGoToCheckout} // Call the new handler
              className="w-full px-6 py-3 bg-green-600 text-white rounded-full font-semibold text-center hover:bg-green-700 transition-colors duration-200 shadow-md"
            >
              Go to checkout
            </button>
          </div>
        )}

      </div>
    </>
  );
};

export default ShoppingCartOverlay;