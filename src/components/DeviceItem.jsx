import { Switch, Group, Text, Slider } from '@mantine/core'
import { useState, useEffect, useRef } from 'react'

export function DeviceItem({ device, isOn, brightness, onToggle, onBrightnessChange, loading }) {
  const [toggling, setToggling] = useState(false)
  const [localBrightness, setLocalBrightness] = useState(brightness || 75)
  const [changingBrightness, setChangingBrightness] = useState(false)
  const debounceTimerRef = useRef(null)
  const lastBrightnessRef = useRef(brightness || 75)

  // Update local brightness when prop changes, but not while we're changing it
  useEffect(() => {
    if (!changingBrightness && brightness !== null && brightness !== undefined) {
      setLocalBrightness(brightness)
      lastBrightnessRef.current = brightness
    }
  }, [brightness, changingBrightness])

  const handleToggle = async (checked) => {
    if (toggling) return
    setToggling(true)
    try {
      await onToggle(device, checked)
    } catch (error) {
      console.error('Toggle failed:', error)
      // Error handling is done in the hook (reverts optimistic update)
    } finally {
      setToggling(false)
    }
  }

  const handleBrightnessChange = (value) => {
    // Update local state immediately for responsive UI
    setLocalBrightness(value)
    
    // Clear any existing debounce timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }
    
    // Set a new debounce timer
    debounceTimerRef.current = setTimeout(() => {
      handleBrightnessChangeDebounced(value)
    }, 300) // 300ms debounce delay
  }

  const handleBrightnessChangeDebounced = async (value) => {
    // Only call API if value actually changed
    if (value === lastBrightnessRef.current) return
    if (changingBrightness) return
    
    setChangingBrightness(true)
    lastBrightnessRef.current = value
    try {
      await onBrightnessChange(device, value)
    } catch (error) {
      console.error('Brightness change failed:', error)
      // Revert to previous brightness on error
      if (brightness !== null && brightness !== undefined) {
        setLocalBrightness(brightness)
        lastBrightnessRef.current = brightness
      }
    } finally {
      setChangingBrightness(false)
    }
  }

  const handleBrightnessChangeEnd = async (value) => {
    // Clear any pending debounce timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
      debounceTimerRef.current = null
    }
    
    // Immediately call the debounced handler
    await handleBrightnessChangeDebounced(value)
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
    }
  }, [])

  const getDeviceIcon = () => {
    // You can customize icons based on device name or type
    if (device.deviceName?.toLowerCase().includes('strip') || device.deviceName?.toLowerCase().includes('led')) {
      return 'highlight'
    }
    return 'lightbulb'
  }

  return (
    <div className="device-card">
      <div className="device-card-header">
        <Group gap={12}>
          <span className={`material-symbols-outlined device-icon ${isOn ? 'icon-on' : 'icon-off'}`} style={{ fontSize: '24px' }}>
            {getDeviceIcon()}
          </span>
          <div>
            <Text size="sm" fw={600} c="white">
              {device.deviceName || device.device}
            </Text>
            <Text size="xs" c={isOn ? 'blue' : 'dimmed'}>
              {isOn ? `On • ${localBrightness}%` : 'Off'}
            </Text>
          </div>
        </Group>
        <label className="switch-wrapper">
          <input
            type="checkbox"
            checked={isOn === true}
            onChange={(e) => handleToggle(e.target.checked)}
            disabled={isOn === null || toggling || loading}
            className="switch-input"
          />
          <div className={`switch-track ${isOn ? 'switch-on' : ''}`}>
            <div className="switch-thumb"></div>
          </div>
        </label>
      </div>
      {isOn && (
        <div className="device-brightness">
          <span className="material-symbols-outlined brightness-icon">brightness_medium</span>
          <Slider
            value={localBrightness}
            onChange={handleBrightnessChange}
            onChangeEnd={handleBrightnessChangeEnd}
            min={1}
            max={100}
            disabled={changingBrightness || loading}
            className="brightness-slider"
            label={null}
            styles={{
              track: { 
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                height: '4px'
              },
              thumb: { 
                backgroundColor: '#197fe6', 
                border: 'none',
                width: '14px',
                height: '14px'
              },
              bar: {
                backgroundColor: '#197fe6'
              }
            }}
          />
        </div>
      )}
    </div>
  )
}

