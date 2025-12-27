import SignInForm from "@/components/auth/SignInForm"; // Import the SignInForm component, which contains the actual sign-in form UI and logic.
import { Metadata } from "next"; // Import the Metadata type from Next.js for defining page metadata.

// Define static metadata for the page. This is used by Next.js for SEO purposes.
export const metadata: Metadata = {
  title: "Taste Tailor - Signin Page", // Sets the title tag of the HTML page.
  description: "This is Sign in Page for Taste Tailor App", // Sets the meta description tag of the HTML page.
};

// This is the default export function for the login page.
// In Next.js App Router, a default export function in a file within the 'app' directory
// becomes the page component for that route segment.
export default function LogIn() {
  // The page component simply renders the SignInForm component.
  // All the sign-in functionality and presentation are handled within SignInForm.
  return <SignInForm />;
}