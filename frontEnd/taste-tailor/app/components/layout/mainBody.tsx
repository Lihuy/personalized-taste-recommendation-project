import Image from 'next/image';

export default function MainBody() {
    return (
        <div className="w-full overflow-hidden flex items-center justify-center p-4">
            <Image 
                src="/images/assets/main_background.png"
                alt="Logo"
                width="600"
                height="400"
                className="w-screen object-cover rounded-lg"
            />
            <div className="absolute z-10">
                {/* <div className="flex items-center justify-center gap-8 p-4">
                    <Image
                        src="/images/logo/logo.png"
                        alt="Logo"
                        width="80"
                        height="80"
                        className="rounded-lg"
                    />
                    <p className="my-secondary-element text-4xl font-bold italic">Taste Tailor</p>
                </div> */}  
                <p className="text-white text-md xl:max-2xl:text-4xl md:max-xl:text-2xl sm:max-md:text-xl font-semibold p-2 ml-16 italic">Personalized Recommendation</p>
                <p className="text-white text-md xl:max-2xl:text-4xl md:max-xl:text-2xl sm:max-md:text-xl font-semibold p-2 ml-16 italic">with "<span className="my-secondary-element text-center text-4xl font-semibold p-2 italic">Taste Tailor</span>"</p>
                <p className="text-white text-sm xl:max-2xl:text-2xl md:max-xl:text-xl sm:max-md:text-md p-2 ml-16">Want a personalized food-ordering experience? <br/> Our mission is to transform the process of ordering food by <br/> curating restaurant menus and meal suggestions based on <br/> individual user preferences, historical ratings, and past order data.</p>
            </div>  
        </div>
    );
}