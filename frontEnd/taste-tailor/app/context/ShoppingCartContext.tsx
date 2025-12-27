'use client';

import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { parseCookies, setCookie, destroyCookie } from 'nookies'; // Import nookies
import { Restaurant } from '@/context/RestaurantContext'; // Import the Restaurant type

// Define the structure of an item in the shopping cart
export interface CartItem {
  id: number; // Unique ID for the item (can be food item ID)
  name: string; // Name of the food item
  price: number; // Actual price of the food item
  quantity: number; // Quantity of this item in the cart
  imageUrl?: string; // Optional image URL
  specialInstructions?: string; // Special instructions for this item
  selectedTastes: string[]; // Array to store selected tastes
  selectedRecommended: string[]; // Array to store selected recommended items
  // Add other relevant item details as needed
}

// Define the shape of the shopping cart context data
interface ShoppingCartContextType {
  cartItems: CartItem[]; // Array of items in the cart
  // Updated addItemToCart to accept selectedTastes and selectedRecommended
  addItemToCart: (item: Restaurant, quantity: number, specialInstructions: string, selectedTastes: string[], selectedRecommended: string[]) => void; // Function to add an item
  removeItemFromCart: (itemId: number) => void; // Function to remove an item by its ID
  updateItemQuantity: (itemId: number, quantity: number) => void; // Function to update item quantity
  clearCart: () => void; // Function to clear the entire cart (and cookie)
  getCartTotal: () => number; // Function to calculate the total price of items in the cart
  getCartItemCount: () => number; // Function to get the total number of items (sum of quantities)
}

// Create the context with default values
const ShoppingCartContext = createContext<ShoppingCartContextType | undefined>(undefined);

// Cookie name for storing cart data
const CART_COOKIE_NAME = 'taste_tailor_cart';

// Provider component for the shopping cart context
export const ShoppingCartProvider = ({ children }: { children: ReactNode }) => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  // State to track if the initial load from cookie is complete
  const [isInitialLoadComplete, setIsInitialLoadComplete] = useState(false);

  // Effect to load cart data from cookie on initial mount
  useEffect(() => {
    const cookies = parseCookies();
    const isLoggedIn = cookies['isLoggedIn'] === 'true';
    const savedCart = cookies[CART_COOKIE_NAME];

    if (isLoggedIn && savedCart) {
      try {
        const parsedCartItems: CartItem[] = JSON.parse(savedCart);
        setCartItems(parsedCartItems);
      } catch (e) {
        console.error("Failed to parse cart data from cookie:", e);
        // Clear invalid cookie data
        destroyCookie(null, CART_COOKIE_NAME, { path: '/' });
      }
    }
    setIsInitialLoadComplete(true); // Mark initial load as complete
  }, []); // Empty dependency array ensures this runs only once on mount

  // Effect to save cart data to cookie whenever cartItems changes, but only if logged in
  useEffect(() => {
    // Only save/clear cookie after initial load is complete to avoid overwriting on mount
    if (!isInitialLoadComplete) {
      return;
    }

    const cookies = parseCookies();
    const isLoggedIn = cookies['isLoggedIn'] === 'true';

    if (isLoggedIn && cartItems.length > 0) {
      // Save cart items to cookie (stringify the array)
      setCookie(null, CART_COOKIE_NAME, JSON.stringify(cartItems), { path: '/' });
    } else {
      // If not logged in or cart is empty, remove the cart cookie
      destroyCookie(null, CART_COOKIE_NAME, { path: '/' });
    }
  }, [cartItems, isInitialLoadComplete]); // Depend on cartItems and isInitialLoadComplete

  // Function to add an item to the cart
  const addItemToCart = (item: Restaurant, quantity: number, specialInstructions: string, selectedTastes: string[], selectedRecommended: string[]) => {
    setCartItems(prevItems => {
      // Check if the item (with same instructions/options) already exists in the cart
      // For simplicity, we'll treat items with different instructions or selections as separate entries.
      const existingItemIndex = prevItems.findIndex(
        cartItem =>
          cartItem.id === item.id &&
          cartItem.specialInstructions === specialInstructions &&
          JSON.stringify(cartItem.selectedTastes) === JSON.stringify(selectedTastes) && // Compare arrays by stringifying
          JSON.stringify(cartItem.selectedRecommended) === JSON.stringify(selectedRecommended) // Compare arrays by stringifying
      );

      if (existingItemIndex > -1) {
        // If item exists with the same selections, update the quantity
        const updatedItems = [...prevItems];
        updatedItems[existingItemIndex].quantity += quantity;
        return updatedItems;
      } else {
        // If item does not exist or has different selections, add it as a new entry
        const newItem: CartItem = {
          id: Date.now() + Math.random(), // Use a more unique ID for each cart item instance
          name: item.name,
          price: item.actualPrice, // Use the actualPrice from the Restaurant object
          quantity: quantity,
          imageUrl: item.imageUrl,
          specialInstructions: specialInstructions,
          selectedTastes: selectedTastes, // Store the selected tastes
          selectedRecommended: selectedRecommended, // Store the selected recommended items
        };
        return [...prevItems, newItem];
      }
    });
  };

  // Function to remove an item from the cart by its ID
  const removeItemFromCart = (itemId: number) => {
    setCartItems(prevItems => prevItems.filter(item => item.id !== itemId));
  };

  // Function to update item quantity
  const updateItemQuantity = (itemId: number, quantity: number) => {
    setCartItems(prevItems => {
      const updatedItems = prevItems.map(item =>
        item.id === itemId ? { ...item, quantity: Math.max(0, quantity) } : item // Ensure quantity is at least 0
      );
      // Remove item if quantity becomes 0
      return updatedItems.filter(item => item.quantity > 0);
    });
  };

  // Function to clear the entire cart (and cookie)
  const clearCart = () => {
    setCartItems([]);
    destroyCookie(null, CART_COOKIE_NAME, { path: '/' }); // Clear the cart cookie
  };

  // Function to calculate the total price of items in the cart
  const getCartTotal = () => {
    return cartItems.reduce((total, item) => total + item.price * item.quantity, 0);
  };

  // Function to get the total number of items (sum of quantities)
  const getCartItemCount = () => {
    return cartItems.reduce((total, item) => total + item.quantity, 0);
  };


  return (
    <ShoppingCartContext.Provider value={{
      cartItems,
      addItemToCart,
      removeItemFromCart,
      updateItemQuantity,
      clearCart,
      getCartTotal,
      getCartItemCount,
    }}>
      {children}
    </ShoppingCartContext.Provider>
  );
};

// Custom hook to use the ShoppingCartContext
export const useShoppingCart = () => {
  const context = useContext(ShoppingCartContext);
  if (context === undefined) {
    throw new Error('useShoppingCart must be used within a ShoppingCartProvider');
  }
  return context;
};