import { useEffect } from 'react'

interface RoiCalcProps {
  onClear: (clearFn: () => void) => void
}

export default function RoiCalc({ onClear }: RoiCalcProps): React.JSX.Element {
  useEffect(() => {
    onClear(() => {})
  }, [onClear])

  return (
    <div className="flex items-center justify-center h-40">
      <p className="text-[13px] text-[#5a5a60]">ROI/Yield calculator loading...</p>
    </div>
  )
}
