import { useState, useEffect, useCallback, useRef } from 'react'

export function useLights() {
  const [devices, setDevices] = useState([])
  const [deviceStates, setDeviceStates] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  // Track when brightness was last set to prevent auto-refresh from overwriting
  const brightnessUpdateTimes = useRef({})
  // Track when power was last toggled to prevent auto-refresh from overwriting
  const powerUpdateTimes = useRef({})

  const fetchDevices = useCallback(async () => {
    try {
      const result = await window.electronAPI.fetchDevices()
      if (result.success) {
        setDevices(result.data)
        setError(null)
        return result.data
      } else {
        setError(result.error)
        return []
      }
    } catch (err) {
      setError(err.message)
      return []
    }
  }, [])

  const fetchDeviceState = useCallback(async (device, skipProtectionChecks = false) => {
    try {
      const result = await window.electronAPI.fetchDeviceState(device)
      if (result.success) {
        setDeviceStates(prev => {
          const currentState = prev[device.device]
          const newState = result.data
          
          if (!skipProtectionChecks && currentState) {
            let updatedCapabilities = newState.capabilities || []
            let needsUpdate = false
          
            // If brightness was recently updated, preserve it instead of overwriting
            if (brightnessUpdateTimes.current[device.device]) {
              const timeSinceUpdate = Date.now() - brightnessUpdateTimes.current[device.device]
              // Don't overwrite brightness if it was set within the last 3 seconds
              if (timeSinceUpdate < 3000) {
                const currentBrightness = currentState.capabilities?.find(cap => cap.instance === 'brightness')
                const newBrightness = newState.capabilities?.find(cap => cap.instance === 'brightness')
                
                if (currentBrightness && newBrightness) {
                  updatedCapabilities = updatedCapabilities.map(cap => {
                    if (cap.instance === 'brightness') {
                      needsUpdate = true
                      return {
                        ...cap,
                        state: {
                          ...cap.state,
                          value: currentBrightness.state.value
                        }
                      }
                    }
                    return cap
                  })
                }
              }
            }
            
            // If power was recently toggled, preserve it instead of overwriting
            if (powerUpdateTimes.current[device.device]) {
              const timeSinceUpdate = Date.now() - powerUpdateTimes.current[device.device]
              // Don't overwrite power if it was toggled within the last 3 seconds
              if (timeSinceUpdate < 3000) {
                const currentPower = currentState.capabilities?.find(cap => cap.instance === 'powerSwitch')
                const newPower = newState.capabilities?.find(cap => cap.instance === 'powerSwitch')
                
                if (currentPower && newPower) {
                  updatedCapabilities = updatedCapabilities.map(cap => {
                    if (cap.instance === 'powerSwitch') {
                      needsUpdate = true
                      return {
                        ...cap,
                        state: {
                          ...cap.state,
                          value: currentPower.state.value
                        }
                      }
                    }
                    return cap
                  })
                }
              }
            }
            
            if (needsUpdate) {
              return {
                ...prev,
                [device.device]: {
                  ...newState,
                  capabilities: updatedCapabilities
                }
              }
            }
          }
          
          return {
            ...prev,
            [device.device]: newState
          }
        })
        return result.data
      } else {
        throw new Error(result.error)
      }
    } catch (err) {
      console.error(`Error fetching state for ${device.device}:`, err)
      throw err
    }
  }, [])

  const toggleDevicePower = useCallback(
    async (device, newState) => {
      // Store the previous state for rollback
      const previousState = deviceStates[device.device]
      
      // Record the time when power is being toggled
      powerUpdateTimes.current[device.device] = Date.now()
      
      // Optimistically update the local state immediately
      setDeviceStates(prev => {
        const currentState = prev[device.device]
        if (!currentState || !currentState.capabilities) return prev
        
        const updatedCapabilities = currentState.capabilities.map(cap => {
          if (cap.instance === 'powerSwitch') {
            return {
              ...cap,
              state: {
                ...cap.state,
                value: newState ? 1 : 0
              }
            }
          }
          return cap
        })
        
        return {
          ...prev,
          [device.device]: {
            ...currentState,
            capabilities: updatedCapabilities
          }
        }
      })
      
      try {
        const result = await window.electronAPI.toggleDevicePower(device, newState)
        if (result.success) {
          return true
        } else {
          // Revert on failure
          delete powerUpdateTimes.current[device.device]
          if (previousState) {
            setDeviceStates(prev => ({
              ...prev,
              [device.device]: previousState
            }))
          }
          throw new Error(result.error)
        }
      } catch (err) {
        // Revert on error
        delete powerUpdateTimes.current[device.device]
        if (previousState) {
          setDeviceStates(prev => ({
            ...prev,
            [device.device]: previousState
          }))
        }
        console.error(`Error toggling device ${device.device}:`, err)
        throw err
      }
    },
    [deviceStates, fetchDeviceState]
  )

  const refreshAllStates = useCallback(async () => {
    if (devices.length === 0) return

    for (const device of devices) {
      try {
        await fetchDeviceState(device)
      } catch (err) {
        // Continue with other devices even if one fails
        console.error(`Failed to refresh state for ${device.device}:`, err)
      }
    }
  }, [devices, fetchDeviceState])

  // Initial load
  useEffect(() => {
    const loadDevices = async () => {
      setLoading(true)
      const loadedDevices = await fetchDevices()
      if (loadedDevices.length > 0) {
        // Fetch states for all devices
        for (const device of loadedDevices) {
          try {
            await fetchDeviceState(device)
          } catch (err) {
            console.error(`Failed to load state for ${device.device}:`, err)
          }
        }
      }
      setLoading(false)
    }
    loadDevices()
  }, [fetchDevices, fetchDeviceState])

  // Auto-refresh every 5 seconds
  useEffect(() => {
    if (devices.length === 0) return

    const interval = setInterval(() => {
      refreshAllStates()
    }, 5000)

    return () => clearInterval(interval)
  }, [devices, refreshAllStates])

  const getDevicePowerState = useCallback(
    device => {
      const state = deviceStates[device.device]
      if (!state || !state.capabilities) return null

      const powerCap = state.capabilities.find(cap => cap.instance === 'powerSwitch')
      if (!powerCap || powerCap.state?.value === undefined) return null

      const value = powerCap.state.value
      return value === 1 || value === '1' || value === true
    },
    [deviceStates]
  )

  const getDeviceBrightness = useCallback(
    device => {
      const state = deviceStates[device.device]
      if (!state || !state.capabilities) return null

      const brightnessCap = state.capabilities.find(cap => cap.instance === 'brightness')
      if (!brightnessCap || brightnessCap.state?.value === undefined) return null

      return brightnessCap.state.value
    },
    [deviceStates]
  )

  const setDeviceBrightness = useCallback(
    async (device, brightness) => {
      try {
        // Record the time when brightness is being set
        brightnessUpdateTimes.current[device.device] = Date.now()
        
        const result = await window.electronAPI.setDeviceBrightness(device, brightness)
        if (result.success) {
          // Optimistically update the local state immediately
          setDeviceStates(prev => {
            const currentState = prev[device.device]
            if (!currentState || !currentState.capabilities) return prev
            
            const updatedCapabilities = currentState.capabilities.map(cap => {
              if (cap.instance === 'brightness') {
                return {
                  ...cap,
                  state: {
                    ...cap.state,
                    value: brightness
                  }
                }
              }
              return cap
            })
            
            return {
              ...prev,
              [device.device]: {
                ...currentState,
                capabilities: updatedCapabilities
              }
            }
          })
          
          return true
        } else {
          delete brightnessUpdateTimes.current[device.device]
          throw new Error(result.error)
        }
      } catch (err) {
        delete brightnessUpdateTimes.current[device.device]
        console.error(`Error setting brightness for device ${device.device}:`, err)
        throw err
      }
    },
    [fetchDeviceState]
  )

  return {
    devices,
    deviceStates,
    loading,
    error,
    toggleDevicePower,
    setDeviceBrightness,
    refreshAllStates,
    getDevicePowerState,
    getDeviceBrightness
  }
}
