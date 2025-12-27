import Link from "next/link"; // Import the Link component from Next.js for client-side navigation.

// Functional component for the Main Section, likely containing introductory text and a footer.
export default function MainSection() {
    return (
        // Main container div for the section with custom and utility classes for styling (width, margin, border radius).
        <div className="w-full my-section-element rounded-xl">
            {/* Container for the "About Taste Tailor" content */}
            <div className="flex flex-col items-center justify-center gap-4 p-6">
                {/* Heading for the section */}
                <h2 className="text-gray-800 text-md xl:max-2xl:text-4xl md:max-xl:text-2xl sm:max-md:text-xl font-bold italic">About Taste Tailor</h2>
                {/* Subheading */}
                <h3 className="uppercase text-amber-50 text-sm xl:max-2xl:text-3xl md:max-xl:text-xl sm:max-md:text-lg">Our Story</h3>
                {/* Paragraph describing the application */}
                <p className="text-white text-center text-sm xl:max-2xl:text-2xl md:max-xl:text-lg sm:max-md:text-md">
                    Taste Tailor is a web application designed to personalize your food-ordering journey. We offer tailored restaurant and meal suggestions based on your tastes and history, providing an intuitive and efficient way to discover your next favorite meal.
                </p>
            </div>
            {/* Footer section */}
            <footer className="flex items-center justify-between">
                {/* Copyright text */}
                <p className="my-copyright-element text-xs xl:max-2xl:text-lg md:max-xl:text-md sm:max-md:text-sm ml-16 mb-4">
                    &copy; 2025 Taste Tailor. All rights reserved.
                </p>
                {/* Container for footer links */}
                <div className="text-white flex items-center justify-center gap-8 mr-16 mb-4">
                    {/* Link to Terms of Service (href is currently empty) */}
                    <Link className="text-end" href = {""}>Terms of Service</Link>
                    {/* Link to Privacy Policy (href is currently empty) */}
                    <Link className="text-end" href = {""}>Privacy</Link>
                </div>
            </footer>
        </div>
    );
}