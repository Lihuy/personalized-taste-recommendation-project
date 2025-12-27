'use client'; // This page component needs to be a client component to consume context

import React from 'react';
import RestaurantMenu from "@/components/menu/restaurantMenu";
import { useRestaurant } from '@/context/RestaurantContext'; // Import the custom hook

export default function MainMenuPage() { // Renamed the component to avoid conflict with imported MainMenu
  // Consume the context to get the filtered restaurants and the full list
  // filteredRestaurants will automatically update when the searchTerm (from MainHeader) or other filters (from RestaurantMenu) change in the context.
  const { filteredRestaurants, allRestaurants } = useRestaurant();

  return (
    // Pass the filtered list and the full list from context to RestaurantMenu
    // RestaurantMenu will now display the list that has been filtered by the search term
    // and further filtered/sorted by the dropdowns within RestaurantMenu itself.
    <RestaurantMenu restaurants={filteredRestaurants} allRestaurants={allRestaurants} />
  );
}