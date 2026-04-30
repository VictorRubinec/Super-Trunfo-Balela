import { ButtonHTMLAttributes, ReactNode } from 'react'
import './ui.css'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'solid' | 'outline' | 'icon'
  size?: 'sm' | 'md' | 'lg'
  children: ReactNode
}

export function Button({ variant = 'solid', size = 'md', children, className = '', ...props }: ButtonProps) {
  const variantClass = `btn-${variant}`
  const sizeClass = `btn-size-${size}`

  return (
    <button className={`btn ${variantClass} ${sizeClass} ${className}`} {...props}>
      {children}
    </button>
  )
}
