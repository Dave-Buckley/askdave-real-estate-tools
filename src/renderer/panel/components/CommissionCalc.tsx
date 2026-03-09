import { useEffect } from 'react'

interface CommissionCalcProps {
  onClear: (clearFn: () => void) => void
}

export default function CommissionCalc({ onClear }: CommissionCalcProps): React.JSX.Element {
  useEffect(() => {
    onClear(() => {})
  }, [onClear])

  return (
    <div className="flex items-center justify-center h-40">
      <p className="text-[13px] text-[#5a5a60]">Commission calculator loading...</p>
    </div>
  )
}
