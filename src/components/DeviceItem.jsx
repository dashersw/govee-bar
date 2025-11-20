import { Switch, Group, Text, Slider } from '@mantine/core'
import { useState, useEffect, useRef } from 'react'
import { ColorPicker } from './ColorPicker'
import { rgbIntToHex } from '../utils/colorUtils'

export function DeviceItem({ device, isOn, brightness, onToggle, onBrightnessChange, getDeviceColorRgb, setDeviceColorRgb, getDeviceColorTemperatureK, setDeviceColorTemperatureK, loading }) {
  const [toggling, setToggling] = useState(false)
  const [localBrightness, setLocalBrightness] = useState(brightness || 75)
  const [changingBrightness, setChangingBrightness] = useState(false)
  const [colorPickerOpened, setColorPickerOpened] = useState(false)
  const [changingColor, setChangingColor] = useState(false)
  const debounceTimerRef = useRef(null)
  const lastBrightnessRef = useRef(brightness || 75)

  // Check if device has colorRgb capability
  const hasColorCapability = device.capabilities?.some(
    cap => cap.type === 'devices.capabilities.color_setting' && cap.instance === 'colorRgb'
  )

  // Check if device has colorTemperatureK capability
  const hasTemperatureCapability = device.capabilities?.some(
    cap => cap.type === 'devices.capabilities.color_setting' && cap.instance === 'colorTemperatureK'
  )

  // Get current color
  const currentColorRgb = hasColorCapability && getDeviceColorRgb ? getDeviceColorRgb(device) : null

  // Get current temperature
  const currentColorTemperatureK = hasTemperatureCapability && getDeviceColorTemperatureK ? getDeviceColorTemperatureK(device) : null

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

  const handleColorChange = async (device, rgbInt) => {
    if (!setDeviceColorRgb) return
    setChangingColor(true)
    try {
      await setDeviceColorRgb(device, rgbInt)
      // Don't close color picker - allow user to continue adjusting
    } catch (error) {
      console.error('Color change failed:', error)
    } finally {
      setChangingColor(false)
    }
  }

  const handleTemperatureChange = async (device, temperatureK) => {
    if (!setDeviceColorTemperatureK) return
    try {
      await setDeviceColorTemperatureK(device, temperatureK)
    } catch (error) {
      console.error('Temperature change failed:', error)
    }
  }

  const getDeviceIcon = () => {
    // You can customize icons based on device name or type
    if (device.deviceName?.toLowerCase().includes('strip') || device.deviceName?.toLowerCase().includes('led')) {
      return 'highlight'
    }
    return 'lightbulb'
  }

  // Get color preview hex or default gray
  const colorPreviewHex = currentColorRgb !== null && currentColorRgb !== undefined 
    ? rgbIntToHex(currentColorRgb) 
    : '#808080'

  return (
    <div className="device-card">
      <div className="device-card-header">
        <Group gap={12}>
          <span className={`material-symbols-outlined device-icon ${isOn ? 'icon-on' : 'icon-off'}`} style={{ fontSize: '24px' }}>
            {getDeviceIcon()}
          </span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <Group gap={8} align="center">
              <Text size="sm" fw={600} style={{ color: 'var(--text-color)' }}>
                {device.deviceName || device.device}
              </Text>
              {(hasColorCapability || hasTemperatureCapability) && isOn && (
                <button
                  onClick={() => setColorPickerOpened(!colorPickerOpened)}
                  style={{
                    width: '20px',
                    height: '20px',
                    borderRadius: '50%',
                    backgroundColor: colorPreviewHex,
                    border: colorPickerOpened ? '2px solid var(--primary-color)' : '2px solid rgba(255, 255, 255, 0.2)',
                    cursor: 'pointer',
                    flexShrink: 0,
                    padding: 0,
                    transition: 'transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'scale(1.1)'
                    e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.3)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'scale(1)'
                    e.currentTarget.style.boxShadow = 'none'
                  }}
                  title={colorPickerOpened ? 'Close color picker' : 'Change color'}
                />
              )}
            </Group>
            <Text size="xs" style={{ color: isOn ? 'var(--primary-color)' : 'var(--text-secondary)' }}>
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
                backgroundColor: 'var(--bg-hover)',
                height: '4px'
              },
              thumb: { 
                backgroundColor: 'var(--primary-color)', 
                border: 'none',
                width: '14px',
                height: '14px'
              },
              bar: {
                backgroundColor: 'var(--primary-color)'
              }
            }}
          />
        </div>
      )}
      {(hasColorCapability || hasTemperatureCapability) && isOn && (
        <ColorPicker
          opened={colorPickerOpened}
          device={device}
          currentColorRgb={currentColorRgb}
          currentColorTemperatureK={currentColorTemperatureK}
          onColorChange={handleColorChange}
          onTemperatureChange={handleTemperatureChange}
          onClose={() => setColorPickerOpened(false)}
          loading={changingColor || loading}
        />
      )}
    </div>
  )
}

