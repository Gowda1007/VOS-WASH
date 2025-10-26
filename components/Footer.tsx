
import React from 'react';

const SocialLink: React.FC<{ href: string; children: React.ReactNode; bgColor: string }> = ({ href, children, bgColor }) => (
    <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-md transition-transform transform hover:scale-110 ${bgColor}`}
    >
        {children}
    </a>
);


export const Footer: React.FC = () => {
    return (
        <footer className="mt-8 pt-6 border-t-2 border-gray-200 text-center">
            <div className="mb-4">
                <p className="font-bold text-gray-700 text-lg mb-2">Our Premium Services</p>
                <p className="text-sm text-gray-600 leading-relaxed px-4">
                    Rubbing Polish | Detailing | Fiber Shine Wash | Interior Cleaning | PPF & Ceramic | Overall Body Wash | Headlight Bright Wash
                </p>
            </div>
            <div className="mt-6">
                 <p className="font-bold text-gray-700 text-lg mb-3">Follow Us</p>
                 <div className="flex justify-center items-center gap-4">
                    <SocialLink href="https://www.facebook.com" bgColor="bg-blue-600">F</SocialLink>
                    <SocialLink href="https://www.instagram.com" bgColor="bg-pink-500">I</SocialLink>
                    <SocialLink href="https://www.youtube.com" bgColor="bg-red-600">Y</SocialLink>
                    <SocialLink href="https://www.twitter.com" bgColor="bg-sky-500">T</SocialLink>
                 </div>
            </div>
        </footer>
    );
};
