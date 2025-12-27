// Import the RootLayoutWrapper component. This component likely provides
// context, providers, or other wrappers needed around the main content.
import RootLayoutWrapper from "@/components/layout/RootLayoutWrapper";

// Import the Roboto font from the next/font/google module.
// This allows optimizing the font loading for performance.
import { Roboto } from 'next/font/google';

// Import global CSS styles. These styles are applied application-wide.
import './globals.css';

// Configure the Roboto font.
// - subsets: Specifies which subsets of the font to load (e.g., "latin" for standard English characters).
// - weight: Specifies the font weights to include (e.g., 400 for regular, 500 for medium, 700 for bold).
// - variable: Assigns a CSS variable name to the font, making it easy to reference in CSS.
const roboto = Roboto({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-roboto",
});

// Define the RootLayout functional component.
// This component serves as the top-level layout for the entire application.
// It receives 'children' as a prop, which represents the content of the current page.
export default function RootLayout({
  children, // The content of the current page (e.g., the page component rendered by Next.js).
}: Readonly<{ // Type definition for the props. 'Readonly' ensures the prop object isn't modified.
  children: React.ReactNode; // 'children' is expected to be a React node (any renderable content).
}>) {
  // The component returns the basic HTML structure for the page.
  return (
    // The root HTML element. Setting the 'lang' attribute is important for accessibility.
    <html lang="en">
      {/* The body element. The font class is applied here to use the configured Roboto font. */}
      <body className={roboto.className}>
        {/* The main content area of the page.
            - max-w-screen: Sets the maximum width to the screen width (ensuring it doesn't overflow).
            - p-4: Adds padding of 4 units around the main content.
            (These are likely Tailwind CSS classes based on the previous code). */}
        <main className="max-w-screen p-4">
          {/* Render the RootLayoutWrapper component.
              It wraps the page content and likely provides shared context or structure. */}
          <RootLayoutWrapper>
            {/* Render the children prop, which is the actual page content. */}
            {children}
          </RootLayoutWrapper>
        </main>
      </body>
    </html>
  );
}