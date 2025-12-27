import ProfileUpdatePage from "@/components/profile/profileUpdate";
import { Metadata } from "next";

// Define metadata for the page, used for SEO purposes by Next.js
export const metadata: Metadata = {
  title: "Taste Tailor - Profile Update Section", // Sets the title of the page
  description: "This is Profile Update Section of Taste Tailor App", // Sets the description of the page
};

// This is the default export for the profile update page.
// In Next.js, files in the `app` directory that export a default function
// become routes. This function renders the main content of the page.
export default function profileUpdate() {
  // Render the ProfileUpdatePage component
  return <ProfileUpdatePage />;
}