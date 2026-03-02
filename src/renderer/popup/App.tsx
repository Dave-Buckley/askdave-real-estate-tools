import { useState, useEffect } from 'react'
import ActionBar from './components/ActionBar'

interface PhoneData {
  e164: string
  display: string
}

function App(): React.JSX.Element {
  const [phoneNumber, setPhoneNumber] = useState<PhoneData | null>(null)

  useEffect(() => {
    // Subscribe to popup:show events from main process
    window.popupAPI.onShow((e164, displayNumber) => {
      setPhoneNumber({ e164, display: displayNumber })
    })
  }, [])

  if (!phoneNumber) {
    // Transparent window — nothing to show
    return <div />
  }

  return (
    <div className="p-1">
      <ActionBar
        e164={phoneNumber.e164}
        displayNumber={phoneNumber.display}
      />
    </div>
  )
}

export default App
