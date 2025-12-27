import SignUpForm from "@/components/auth/SignUpForm"; // Import the SignUpForm component, which contains the sign-up form UI and logic.
import { Metadata } from "next"; // Import the Metadata type from Next.js for defining page metadata.

// Define static metadata for the page. This is used by Next.js for SEO purposes.
export const metadata: Metadata = {
  title: "Taste Tailor - Sign Up Page", // Sets the title tag of the HTML page.
  description: "This is Sign Up Page for Taste Tailor App", // Sets the meta description tag of the HTML page.
  // other metadata // Placeholder for additional metadata properties if needed.
};

// This is the default export function for the sign-up page.
// In Next.js App Router, a default export function in a file within the 'app' directory
// becomes the page component for that route segment.
export default function SignUp() {
  // The page component simply renders the SignUpForm component.
  // All the sign-up functionality and presentation are handled within SignUpForm.
  return <SignUpForm />;
}