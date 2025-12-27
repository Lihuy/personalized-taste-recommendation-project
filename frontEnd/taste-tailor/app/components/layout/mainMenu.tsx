import Image from 'next/image'; // Import the Next.js Image component for optimized image handling.
import React from 'react'; // Import the React library.

// Define an array of food categories with their names and corresponding image paths.
const foodCategories = [
    { name: 'Pizza', image: '/images/logo/pizza.png' },
    { name: 'Burger', image: '/images/logo/hamburger.png' },
    { name: 'Salad', image: '/images/logo/salad.png' },
    { name: 'Mexican', image: '/images/logo/mexican.png' },
    { name: 'Fast Food', image: '/images/logo/fast_food.png' },
    { name: 'Thai', image: '/images/logo/thai.png' },
    { name: 'Chinese', image: '/images/logo/chinese.png' },
    { name: 'Korean', image: '/images/logo/korean.png' },
    { name: 'Japanese', image: '/images/logo/japanese.png' },
    { name: 'Coffee', image: '/images/logo/coffee.png' },
    { name: 'Bubble Tea', image: '/images/logo/bubble_tea.png' },
];

// Define the interface for the component's props.
interface MainMenuProps {
    show: boolean; // Boolean prop to control the visibility of introductory text.
    // Add a prop for the function to call when a cuisine is selected.
    onCuisineSelect: (cuisine: string | null) => void;
    // Add a prop to indicate the currently selected cuisine for styling.
    selectedCuisine: string | null;
}

// MainMenu functional component receives show, onCuisineSelect, and selectedCuisine as props.
export default function MainMenu({ show, onCuisineSelect, selectedCuisine }: MainMenuProps) {
    return (
        <>
            {/* Conditionally render introductory text based on the 'show' prop */}
            {show ? (
            <>
                <h1 className='text-4xl font-semibold p-4'>Explore our menu</h1>
                <p className='text-xl text-gray-600 p-4'>Make a selection from a diverse range of menu featuring both local and international cuisines. <br/> Our aims is to to make online food ordering more satisfying and aligned with your individual tastes.</p>
            </>
            ): <></> /* Render nothing if 'show' is false */ }

            {/* Horizontal scrolling container for cuisine category buttons */}
            <div className="overflow-x-auto py-2 px-4 bg-white border-t border-gray-200">
                <div className="flex space-x-4 whitespace-nowrap">
                    {/* Button to show all restaurants */}
                    <div key="all-cuisines" className="flex flex-col items-center justify-center gap-4 p-1">
                         <button
                            onClick={() => onCuisineSelect(null)} // Call the handler with null to indicate 'All Cuisines'
                            // Apply dynamic styling based on whether 'All Cuisines' is currently selected
                            className={`px-4 py-2 rounded-full text-sm font-medium cursor-pointer transition-colors duration-300
                                ${selectedCuisine === null ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}
                            `}
                         >
                            {/* Image for 'All Cuisines' */}
                            <Image
                                src="/images/logo/all_menu.png"
                                alt="All Cuisines"
                                width='70' // Set image width
                                height='70' // Set image height
                                className="object-cover rounded-full" // Apply styling to the image
                            />
                         </button>
                         {/* Text label for 'All Cuisines' button */}
                         <p className="text-sm xl:max-2xl:text-lg md:max-xl:text-md text-gray-800">All Cuisines</p>
                    </div>

                    {/* Map over the foodCategories array to render a button for each category */}
                    {foodCategories.map((category) => ( // category.name is used as a unique key
                        <div key={category.name} className="flex flex-col items-center justify-center gap-4 p-1">
                            <button
                                onClick={() => onCuisineSelect(category.name)} // Call the handler with the selected category's name
                                // Apply dynamic styling based on whether this category is currently selected
                                className={`px-4 py-2 rounded-full text-sm font-medium cursor-pointer transition-colors duration-300
                                    ${selectedCuisine === category.name ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}
                                `}
                            >
                                {/* Image for the category */}
                                <Image
                                    src={category.image} // Source image path
                                    alt={category.name} // Alt text for accessibility
                                    width='70' // Set image width
                                    height='70' // Set image height
                                    className="object-cover rounded-full" // Apply styling to the image
                                />
                            </button>
                            {/* Text label for the category button */}
                            <p className="text-sm xl:max-2xl:text-lg md:max-xl:text-md text-gray-800">{category.name}</p> {/* Display category name */}
                        </div>
                    ))}
                </div>
            </div>
        </>
    );
}