import React from 'react';

const Input = React.forwardRef(({ type = 'text', className, ...props }, ref) => {
  const baseStyles = "relative block w-full appearance-none rounded-md border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-500 focus:z-10 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm";
  
  return (
    <input
      type={type}
      className={`${baseStyles} ${className}`}
      ref={ref}
      {...props}
    />
  );
});

export default Input;