import React from 'react';

export interface ButtonProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
  className?: string;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  disabled = false,
  type = 'button',
  onClick,
  className = '',
}) => {
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={`
        btn-base
        ${variant === 'primary' ? 'btn-primary' : 'btn-secondary'}
        ${size === 'sm' ? 'btn-sm' : size === 'lg' ? 'btn-lg' : 'btn-md'}
        ${disabled ? 'btn-disabled' : ''}
        ${className}
      `}
    >
      {children}
    </button>
  );
};

export default Button;
