import type React from "react";

interface ButtonProps{
    children: React.ReactNode;
    onClick?: (()=>void)|undefined;
    disabled?: boolean;
    className?: string;
    type?: "button" | "submit";
}

export default function Button({children, disabled, onClick, className = "", type = "button"}: ButtonProps){
    const baseStyles = "px-4 py-2 rounded-md font-medium transition duration-200";
    return(
        <button type={type} onClick={onClick} className={`${baseStyles} ${className}`}>
            {children}
        </button>
    );
}