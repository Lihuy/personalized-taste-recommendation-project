'use client';

import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';

// Define the type for the restaurant data
export interface Restaurant {
  id: number;
  name: string;
  cuisine: string;
  rating: number;
  reviews: string | number;
  deliveryFee: string;
  imageUrl: string;
  priceLevel: number;
  description: string;
  actualPrice: number;
  tastes: string[]; // Added tastes property
  recommended: string[]; // Added recommended property
}

// Define the type for the address data
interface Address {
    id: number | string; // Added id property
    name: string;
    street: string;
    suburb: string;
    state: string;
    postcode: string;
    country: string;
}

// Define the shape of the context data
interface RestaurantContextType {
  allRestaurants: Restaurant[];
  filteredRestaurants: Restaurant[];
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  // Add other filter/sort states and setters here if you lift them up later
  selectedCuisine: string | null;
  setSelectedCuisine: (cuisine: string | null) => void;
  selectedFee: string | null;
  setSelectedFee: (fee: string | null) => void;
  selectedRating: string | null;
  setSelectedRating: (rating: string | null) => void;
  selectedPrice: string | null;
  setSelectedPrice: (price: string | null) => void;
  selectedSort: string | null;
  setSelectedSort: (sort: string | null) => void;
  // Added selectedAddress state and setter to context
  selectedAddress: Address | null;
  setSelectedAddress: (address: Address | null) => void;
}

// Create the context with default values
const RestaurantContext = createContext<RestaurantContextType | undefined>(undefined);

// Sample data for all restaurants (Moved here from restaurantMenu.tsx and page.tsx)
const initialRestaurants: Restaurant[] = [
  {
    id: 1,
    name: 'Pork Cartilage Noodle Soup',
    cuisine: 'Chinese',
    rating: 5,
    reviews: '1000+',
    deliveryFee: '$2 Delivery Fee',
    imageUrl: '/images/assets/lanzhou_noodle.jpg',
    priceLevel: 2,
    description:
      'Savor the authentic blend of tender pork cartilage and hearty noodles in this classic Chinese soup.',
    actualPrice: 15, // priceLevel 2 -> $15
    tastes: ['Savory', 'Umami', 'Mild Spicy'],
    recommended: ['Dim Sum', 'Peking Duck', 'Chow Mein'],
  },
  {
    id: 2,
    name: 'Signature Wagyu Rice Signature Teriyaki Sauce',
    cuisine: 'Japanese',
    rating: 4.9,
    reviews: '1000+',
    deliveryFee: '$1 Delivery Fee',
    imageUrl: '/images/assets/omi_wagyu.jpg',
    priceLevel: 3,
    description:
      'Indulge in premium Japanese flavors with tender Wagyu rice paired with a rich, authentic teriyaki sauce.',
    actualPrice: 100, // priceLevel 3 -> $20
    tastes: ['Umami', 'Savory', 'Slightly Sweet'],
    recommended: ['Sushi Platter', 'Tempura', 'Miso Soup'],
  },
  {
    id: 3,
    name: 'Stone Pot Beef Bibimbap',
    cuisine: 'Korean',
    rating: 4.6,
    reviews: '500',
    deliveryFee: '$2.5 Delivery Fee',
    imageUrl: '/images/assets/surasang_bibimbap.jpeg',
    priceLevel: 2,
    description:
      'Experience the sizzling flavor and vibrant colors of this traditional Korean stone pot bibimbap.',
    actualPrice: 20,
    tastes: ['Spicy', 'Garlicky', 'Savory'],
    recommended: ['Korean BBQ', 'Kimchi Stew', 'Bibim Naengmyeon'],
  },
  {
    id: 4,
    name: 'Veggie Chilli Fries',
    cuisine: 'Mexican',
    rating: 4.2,
    reviews: '749',
    deliveryFee: '$2.99 Delivery Fee',
    imageUrl: '/images/assets/veggie_fries.jpg',
    priceLevel: 1,
    description:
      'Crunch into our zesty Mexican-inspired veggie chilli fries, a perfect blend of spice and crunch.',
    actualPrice: 5,
    tastes: ['Spicy', 'Zesty', 'Smoky'],
    recommended: ['Taco Salad', 'Quesadillas', 'Guacamole'],
  },
  {
    id: 5,
    name: 'Coffee Latte',
    cuisine: 'Coffee',
    rating: 5,
    reviews: '1000',
    deliveryFee: '$0.99 Delivery Fee',
    imageUrl: '/images/assets/coffee_latte.jpg',
    priceLevel: 1,
    description:
      'Enjoy a smooth and creamy coffee latte, crafted to perfection with a rich coffee aroma.',
    actualPrice: 8,
    tastes: ['Bitter', 'Smooth', 'Nutty'],
    recommended: ['Espresso', 'Cappuccino', 'Mocha'],
  },
  {
    id: 6,
    name: 'Signature Mango Milk Flower',
    cuisine: 'Bubble Tea',
    rating: 4.7,
    reviews: '500',
    deliveryFee: '$1.99 Delivery Fee',
    imageUrl: '/images/assets/mango_milk.jpg',
    priceLevel: 1,
    description:
      'Taste the tropical charm in our Signature Mango Milk Flower bubble tea, a refreshing burst of flavor.',
    actualPrice: 7.5,
    tastes: ['Sweet', 'Fruity', 'Creamy'],
    recommended: [
      'Taro Bubble Tea',
      'Brown Sugar Boba',
      'Matcha Latte Bubble Tea',
    ],
  },
  {
    id: 7,
    name: 'Floraison de Myrtilles',
    cuisine: 'Dessert',
    rating: 4.8,
    reviews: '1000',
    deliveryFee: '$2.99 Delivery Fee',
    imageUrl: '/images/assets/cake.png',
    priceLevel: 3,
    description:
      'Indulge in this exquisite dessert featuring the delicate essence of blueberries in a refined presentation.',
    actualPrice: 120,
    tastes: ['Sweet', 'Rich', 'Decadent'],
    recommended: ['Chocolate Lava Cake', 'Creme Brulee', 'Macarons'],
  },
  {
    id: 8,
    name: 'Mighty Melbourne',
    cuisine: 'Burger',
    rating: 4.4,
    reviews: '946',
    deliveryFee: '$1.5 Delivery Fee',
    imageUrl: '/images/assets/burger.png',
    priceLevel: 2,
    description:
      'Sink your teeth into the Mighty Melbourne burger, a towering delight loaded with flavor and freshness.',
    actualPrice: 12,
    tastes: ['Juicy', 'Savory', 'Smoky'],
    recommended: ['Cheeseburger', 'Fries', 'Onion Rings'],
  },
  {
    id: 9,
    name: 'Habanero Hot & Crispy™ Variety Feast',
    cuisine: 'Fast Food',
    rating: 3.8,
    reviews: '428',
    deliveryFee: '$1.5 Delivery Fee',
    imageUrl: '/images/assets/fast_food.png',
    priceLevel: 2,
    description:
      'Experience a burst of bold flavors with our Habanero Hot & Crispy™ feast, a fast food favorite packed with heat.',
    actualPrice: 30,
    tastes: ['Crispy', 'Spicy', 'Tangy'],
    recommended: ['Loaded Nachos', 'Chicken Wings', 'Fries'],
  },
  {
    id: 10,
    name: 'Pizza by the Slice',
    cuisine: 'Pizza',
    rating: 4.5,
    reviews: '1000',
    deliveryFee: '$3 Delivery Fee',
    imageUrl: '/images/assets/pizza.jpg',
    priceLevel: 2,
    description:
      'Delight in the fiery kick of our Habanero Hot & Crispy™ pizza, merging bold spices with melty cheese.',
    actualPrice: 25,
    tastes: ['Cheesy', 'Spicy', 'Crispy'],
    recommended: ['Pepperoni Pizza', 'Margherita Pizza', 'BBQ Chicken Pizza'],
  },
  {
    id: 11,
    name: 'Miso Falalalafel',
    cuisine: 'Salad',
    rating: 4.9,
    reviews: '500',
    deliveryFee: '$2 Delivery Fee',
    imageUrl: '/images/assets/salad.png',
    priceLevel: 2,
    description:
      'Relish a fresh twist on traditional falafel with a miso infusion, combining crisp greens and bold flavors.',
    actualPrice: 35,
    tastes: ['Fresh', 'Crisp', 'Tangy'],
    recommended: ['Caesar Salad', 'Greek Salad', 'Quinoa Salad'],
  },
  {
    id: 12,
    name: 'Pad Thai Chicken Noodles',
    cuisine: 'Thai',
    rating: 4.9,
    reviews: '825',
    deliveryFee: '$0.5 Delivery Fee',
    imageUrl: '/images/assets/pad_thai.jpg',
    priceLevel: 2,
    description:
      'Enjoy the perfect balance of sweet, sour, and savory flavors in our traditional Pad Thai Chicken Noodles.',
    actualPrice: 20,
    tastes: ['Spicy', 'Tangy', 'Herbal'],
    recommended: ['Green Curry', 'Tom Yum Soup', 'Mango Sticky Rice'],
  },
];

export const tasteDescriptions = {
  'Savory': 'Highlights delightful savory notes.',
  'Umami': 'Packed with rich umami flavour.',
  'Mild Spicy': 'Offers a pleasant, mild kick.',
  'Slightly Sweet': 'Features a subtle sweetness.',
  'Spicy': 'Delivers a bold, spicy heat.',
  'Garlicky': 'Infused with aromatic garlic.',
  'Zesty': 'Brightened with a zesty flavour.',
  'Smoky': 'Carries a distinct smoky taste.',
  'Bitter': 'Showcases a sophisticated bitterness.',
  'Smooth': 'Boasts a wonderfully smooth texture/flavour.',
  'Nutty': 'Complemented by nutty undertones.',
  'Sweet': 'Satisfies with a sweet profile.',
  'Fruity': 'Enhanced with fruity notes.',
  'Creamy': 'Indulgent and creamy.',
  'Rich': 'Offers a deeply rich taste.',
  'Decadent': 'A truly decadent experience.',
  'Juicy': 'Remarkably juicy.',
  'Crispy': 'Perfectly crispy texture.',
  'Tangy': 'Features a delightful tang.',
  'Cheesy': 'Packed with cheesy goodness.',
  'Fresh': 'Highlights fresh ingredients.',
  'Herbal': 'Infused with fragrant herbs.',
};

// Helper functions for filtering/sorting (Moved from restaurantMenu.tsx)
const parseDeliveryFee = (feeString: string): number => {
  const match = feeString.match(/\$(\d+(\.\d+)?)/);
  return match ? parseFloat(match[1]) : Infinity;
};

const parseRating = (ratingString: string): number => {
  const match = ratingString.match(/(\d+(\.\d+)?)\+?/);
   return match ? parseFloat(match[1]) : 0;
};


// Provider component
export const RestaurantProvider = ({ children }: { children: ReactNode }) => {
  const [allRestaurants, setAllRestaurants] = useState<Restaurant[]>(initialRestaurants); // State for all restaurants
  const [searchTerm, setSearchTerm] = useState(''); // State for search term
  const [selectedCuisine, setSelectedCuisine] = useState<string | null>(null); // State for cuisine filter
  const [selectedFee, setSelectedFee] = useState<string | null>(null); // State for fee filter
  const [selectedRating, setSelectedRating] = useState<string | null>(null); // State for rating filter
  const [selectedPrice, setSelectedPrice] = useState<string | null>(null); // State for price filter
  const [selectedSort, setSelectedSort] = useState<string | null>(null); // State for sort option
   // Added state for selected address
  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);


  // Effect to apply all filters and sorting whenever relevant state changes
  const filteredRestaurants = React.useMemo(() => {
    let currentRestaurants = allRestaurants;

    // Apply Search Filter
    if (searchTerm) {
      currentRestaurants = currentRestaurants.filter(restaurant =>
        restaurant.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply Cuisine Filter
    if (selectedCuisine !== null) {
      currentRestaurants = currentRestaurants.filter(restaurant => restaurant.cuisine === selectedCuisine);
    }

    // Apply Delivery Fee Filter
    if (selectedFee !== null) {
      const maxFee = selectedFee === '$5+' ? Infinity : parseDeliveryFee(selectedFee);
      currentRestaurants = currentRestaurants.filter(restaurant => parseDeliveryFee(restaurant.deliveryFee) <= maxFee);
    }

    // Apply Rating Filter
    if (selectedRating !== null) {
      const minRating = parseRating(selectedRating);
      currentRestaurants = currentRestaurants.filter(restaurant => restaurant.rating >= minRating);
    }

    // Apply Price Filter
    if (selectedPrice !== null) {
       const selectedPriceLevel = selectedPrice.length;
       currentRestaurants = currentRestaurants.filter(restaurant => restaurant.priceLevel === selectedPriceLevel);
    }

    // Apply Sorting
    if (selectedSort) { // Only sort if a sort option is selected
      switch (selectedSort) {
        case 'Delivery Fee':
          currentRestaurants = [...currentRestaurants].sort((a, b) => parseDeliveryFee(a.deliveryFee) - parseDeliveryFee(b.deliveryFee));
          break;
        case 'Rating':
          currentRestaurants = [...currentRestaurants].sort((a, b) => b.rating - a.rating);
          break;
        case 'Price':
            currentRestaurants = [...currentRestaurants].sort((a, b) => a.priceLevel - b.priceLevel);
            break;
        default:
          break;
      }
    }

    return currentRestaurants;
  }, [allRestaurants, searchTerm, selectedCuisine, selectedFee, selectedRating, selectedPrice, selectedSort]); // Dependencies for useMemo


  return (
    <RestaurantContext.Provider value={{
      allRestaurants,
      filteredRestaurants,
      searchTerm,
      setSearchTerm,
      selectedCuisine,
      setSelectedCuisine,
      selectedFee,
      setSelectedFee,
      selectedRating,
      setSelectedRating,
      selectedPrice,
      setSelectedPrice,
      selectedSort,
      setSelectedSort,
      selectedAddress, // Provide selectedAddress
      setSelectedAddress, // Provide setSelectedAddress
    }}>
      {children}
    </RestaurantContext.Provider>
  );
};

// Custom hook to use the RestaurantContext
export const useRestaurant = () => {
  const context = useContext(RestaurantContext);
  if (context === undefined) {
    throw new Error('useRestaurant must be used within a RestaurantProvider');
  }
  return context;
};