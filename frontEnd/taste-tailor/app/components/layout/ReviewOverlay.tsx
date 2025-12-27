'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { Star, X, ChevronLeft } from 'lucide-react'; // Using Star, X, and ChevronLeft icons

// Define the type for the order item data expected by the overlay
interface OrderItemForReview {
    id: number;
    item_name: string;
    item_image_url?: string;
    // Add other relevant fields like restaurant name if available in data
    restaurant_name?: string;
    rating: number; // Current rating
    // Add comment field if backend supports fetching it
    // review_comment?: string;
}

interface ReviewOverlayProps {
    isOpen: boolean;
    onClose: () => void;
    orderItem: OrderItemForReview | null; // The item being reviewed
    onSubmitReview: (orderItemId: number, rating: number, comment: string) => Promise<void>; // Callback for submission (now async)
    // --- Add the isSubmitting prop here ---
    isSubmitting: boolean; // Prop to indicate if the review is currently being submitted
    // --- End Add isSubmitting prop ---
}

// --- Accept the isSubmitting prop in the component function signature ---
const ReviewOverlay: React.FC<ReviewOverlayProps> = ({ isOpen, onClose, orderItem, onSubmitReview, isSubmitting }) => {
    // State for the rating selected in the overlay
    const [selectedRating, setSelectedRating] = useState(0);
    // State for the review comment
    const [reviewComment, setReviewComment] = useState('');

    // Update local state when orderItem prop changes (e.g., when opening for a new item)
    useEffect(() => {
        if (orderItem) {
            setSelectedRating(orderItem.rating); // Initialize with existing rating
            // If backend fetches comments, initialize reviewComment here too
            // setReviewComment(orderItem.review_comment || '');
             setReviewComment(''); // For now, start with a blank comment
        } else {
             // Reset state when overlay is closed or no item is selected
             setSelectedRating(0);
             setReviewComment('');
        }
    }, [orderItem]); // Re-run effect when orderItem changes


    // Handle star click
    const handleStarClick = (starValue: number) => {
        // Only allow changing rating if not currently submitting
        if (!isSubmitting) {
             setSelectedRating(starValue);
        }
    };

    // Handle comment input change
    const handleCommentChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
        // Only allow changing comment if not currently submitting
        if (!isSubmitting) {
            setReviewComment(event.target.value);
        }
    };

    // Handle submission
    const handleSubmit = async () => {
        // --- Use the passed isSubmitting prop ---
        if (!orderItem || isSubmitting) return; // Prevent submission if no item or already submitting

        // --- The parent component (PastOrder.tsx) manages the isSubmitting state ---
        // setIsSubmitting(true); // Remove this line

        try {
             // Call the onSubmitReview callback provided by the parent (PastOrder.tsx)
             // The parent will set its isSubmittingReview state to true before calling this.
            await onSubmitReview(orderItem.id, selectedRating, reviewComment);
            // The parent component will handle closing the overlay on success
        } catch (error) {
            console.error("Error in ReviewOverlay submission:", error);
            // Error handling is primarily in the parent's onSubmitReview
        } finally {
             // --- The parent component manages the isSubmitting state ---
        }
    };

    // Handle cancel
    const handleCancel = () => {
        // Only allow canceling if not currently submitting
        if (!isSubmitting) {
            onClose(); // Close the overlay
        }
    };

    // Render nothing if the overlay is not open or no item is selected
    if (!isOpen || !orderItem) {
        return null;
    }

    return (
        // Overlay background
        <div className="fixed inset-0 bg-gray-200/50 flex items-center justify-center z-50 transition-opacity duration-300">
            {/* Modal content */}
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-sm sm:max-w-md md:max-w-lg relative transform transition-transform duration-300 scale-100">
                {/* Close button (optional, can use back arrow instead) */}
                {/* <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-gray-700">
                    <X size={24} />
                </button> */}

                {/* Header */}
                <div className="flex items-center mb-6">
                    {/* Back arrow */}
                    {/* Disable back arrow if submitting */}
                    <button onClick={onClose} className={`text-gray-600 hover:text-gray-800 mr-4 ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`} disabled={isSubmitting}>
                        <ChevronLeft size={24} />
                    </button>
                    <h2 className="text-xl font-bold text-gray-800 flex-grow text-center">Leave a Review</h2>
                    {/* Empty div to balance the flex layout */}
                    <div className="w-6"></div>
                </div>

                {/* Item Details */}
                <div className="flex flex-col items-center text-center mb-6">
                     <Image
                        src={orderItem.item_image_url || '/images/assets/placeholder.jpg'} // Use item image or placeholder
                        alt={orderItem.item_name}
                        width={100} // Adjust size as needed
                        height={100} // Adjust size as needed
                        objectFit="cover"
                        className="rounded-md mb-3"
                        onError={(e) => { const target = e.target as HTMLImageElement; target.onerror = null; target.src='/images/assets/placeholder.jpg'; }} // Fallback on error
                    />
                    <h3 className="font-semibold text-gray-800 text-lg">{orderItem.item_name}</h3>
                    {/* Display restaurant name if available */}
                    {orderItem.restaurant_name && (
                        <p className="text-sm text-gray-600">({orderItem.restaurant_name})</p>
                    )}
                     <p className="text-gray-700 mt-4">We'd love to know what you think of your dish.</p>
                </div>

                {/* Interactive Star Rating */}
                <div className="flex items-center justify-center mb-6">
                    {[1, 2, 3, 4, 5].map((starValue) => (
                        <Star
                            key={starValue}
                            size={30} // Larger stars
                            className={`cursor-pointer transition-colors duration-200 mx-1 ${
                                starValue <= selectedRating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'
                            } ${isSubmitting ? 'cursor-not-allowed' : ''}`} // Add disabled cursor style
                            onClick={() => handleStarClick(starValue)}
                        />
                    ))}
                </div>

                {/* Comment Section */}
                <div className="mb-6">
                     <p className="text-gray-700 mb-2 text-center">Leave us your comment!</p>
                    <textarea
                        className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-700 text-sm disabled:opacity-50 disabled:cursor-not-allowed" // Add disabled styles
                        rows={4}
                        placeholder="Write Review..."
                        value={reviewComment}
                        onChange={handleCommentChange}
                        disabled={isSubmitting} // Disable textarea while submitting
                    ></textarea>
                </div>

                {/* Buttons */}
                <div className="flex justify-center space-x-4">
                    <button
                        onClick={handleCancel}
                        className="px-6 py-2 border border-gray-300 rounded-full text-gray-700 font-semibold hover:bg-gray-100 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed" // Add disabled styles
                        disabled={isSubmitting} // Disable cancel button while submitting
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        className={`px-6 py-2 rounded-full text-white font-semibold transition-colors duration-200 ${
                            selectedRating === 0 || isSubmitting ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'
                        } disabled:opacity-50 disabled:cursor-not-allowed`} // Add disabled styles
                        disabled={selectedRating === 0 || isSubmitting} // Disable if no rating or submitting
                    >
                        {isSubmitting ? 'Submitting...' : 'Submit'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ReviewOverlay;