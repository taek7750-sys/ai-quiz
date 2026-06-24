import { useEffect, useRef, useState } from 'react'

interface TimerProps {
  totalSeconds: number
  onExpire: () => void
  running: boolean
}

export function Timer({ totalSeconds, onExpire, running }: TimerProps) {
  const [remaining, setRemaining] = useState(totalSeconds)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const calledRef = useRef(false)

  useEffect(() => {
    setRemaining(totalSeconds)
    calledRef.current = false
  }, [totalSeconds])

  useEffect(() => {
    if (!running) {
      if (intervalRef.current) clearInterval(intervalRef.current)
      return
    }
    intervalRef.current = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(intervalRef.current!)
          if (!calledRef.current) {
            calledRef.current = true
            setTimeout(onExpire, 500)
          }
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [running, onExpire])

  const ratio = remaining / totalSeconds
  const radius = 36
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference * (1 - ratio)

  const colorClass = ratio > 0.5 ? '#22C55E' : ratio > 0.1 ? '#EAB308' : '#EF4444'
  const isUrgent = ratio < 0.1 && remaining > 0

  return (
    <div className={`relative flex items-center justify-center w-24 h-24 ${isUrgent ? 'shake' : ''}`}>
      <svg className="absolute w-full h-full -rotate-90" viewBox="0 0 88 88">
        <circle
          cx="44" cy="44" r={radius}
          fill="none"
          stroke="#334155"
          strokeWidth="6"
        />
        <circle
          cx="44" cy="44" r={radius}
          fill="none"
          stroke={colorClass}
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          style={{ transition: 'stroke-dashoffset 0.9s linear, stroke 0.3s ease' }}
          className={isUrgent ? 'pulse-ring' : ''}
        />
      </svg>
      <div className="relative z-10 text-center">
        <span className="text-2xl font-bold" style={{ color: colorClass }}>
          {remaining}
        </span>
        <div className="text-xs text-slate-400">초</div>
      </div>
    </div>
  )
}
