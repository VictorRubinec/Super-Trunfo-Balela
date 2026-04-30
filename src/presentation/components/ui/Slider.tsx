import { InputHTMLAttributes } from 'react'
import './ui.css'

interface SliderProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'value' | 'onChange'> {
  label: string
  value: number
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  min?: number
  max?: number
  step?: number
  displayValue?: string
}

export function Slider({ label, value, onChange, min = 1, max = 10, step = 1, displayValue, ...props }: SliderProps) {
  const percentage = ((value - min) / (max - min)) * 100

  return (
    <div className="slider-group">
      <div className="slider-header">
        <label className="slider-label">{label}</label>
        <span className="slider-value">{displayValue ?? value}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={onChange}
        className="slider-input"
        style={{
          background: `linear-gradient(to right, var(--purple-primary) 0%, var(--purple-primary) ${percentage}%, var(--border-color) ${percentage}%, var(--border-color) 100%)`,
        } as React.CSSProperties}
        {...props}
      />
    </div>
  )
}
