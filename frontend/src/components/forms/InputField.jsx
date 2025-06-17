// frontend/src/components/forms/InputField.jsx
import React from 'react';
import Label from './Label';
import Input from './Input';

const InputField = ({ id, label, type = 'text', ...props }) => {
  return (
    <div>
      <Label htmlFor={id} className="block text-sm font-medium leading-6 text-gray-900">
        {label}
      </Label>
      <div className="mt-2">
        <Input id={id} type={type} {...props} />
      </div>
    </div>
  );
};

export default InputField;