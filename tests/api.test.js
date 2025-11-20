const { test, describe, before } = require('node:test')
const assert = require('node:assert')
const { createApiClient } = require('../lib/api-client')

const API_KEY = process.env.GOVEE_API_KEY

if (!API_KEY) {
  test(
    'Govee API End-to-End Tests (requires GOVEE_API_KEY)',
    { skip: 'Set GOVEE_API_KEY to run integration tests' },
    () => {}
  )
} else {
  describe('Govee API End-to-End Tests', () => {
    let apiClient

    before(() => {
      if (!API_KEY) {
        throw new Error('GOVEE_API_KEY environment variable is required for tests')
      }
      apiClient = createApiClient(API_KEY)
    })

    test.skip('should fetch all devices', async () => {
      const devices = await apiClient.fetchDevices()

      assert(Array.isArray(devices), 'Devices should be an array')
      assert(devices.length > 0, 'Should have at least one device')

      // Validate device structure
      const device = devices[0]
      assert(device.sku, 'Device should have a sku')
      assert(device.device, 'Device should have a device ID')
      assert(Array.isArray(device.capabilities), 'Device should have capabilities array')
    })

    test.skip('should fetch device state for a valid device', async () => {
      // First, get all devices
      const devices = await apiClient.fetchDevices()
      assert(devices.length > 0, 'Should have at least one device to test')

      const testDevice = devices[0]
      const state = await apiClient.fetchDeviceState({ device: testDevice })

      // Validate state structure
      assert(state, 'State should exist')
      assert(Array.isArray(state.capabilities), 'State should have capabilities array')

      // Check for online capability (should always be present)
      const onlineCap = state.capabilities.find(cap => cap.instance === 'online')
      assert(onlineCap !== undefined, 'State should have online capability')
      assert(typeof onlineCap.state.value === 'boolean', 'Online value should be boolean')
    })

    test.skip('should fetch state for multiple devices', async () => {
      const devices = await apiClient.fetchDevices()
      assert(devices.length > 0, 'Should have at least one device')

      // Test first 3 devices (or all if less than 3)
      const devicesToTest = devices.slice(0, Math.min(3, devices.length))

      for (const device of devicesToTest) {
        const state = await apiClient.fetchDeviceState({ device })
        assert(state, `State should exist for device ${device.device}`)
        assert(Array.isArray(state.capabilities), `Capabilities should be an array for device ${device.device}`)
      }
    })

    test.skip('should handle invalid device gracefully', async () => {
      try {
        await apiClient.fetchDeviceState({ device: { sku: 'INVALID_SKU', device: 'INVALID:DEVICE:ID' } })
        assert.fail('Should have thrown an error for invalid device')
      } catch (error) {
        assert(error instanceof Error, 'Should throw an Error')
        assert(error.message.includes('API error'), 'Error message should mention API error')
      }
    })

    test.skip('should have requestId in POST requests', async () => {
      const devices = await apiClient.fetchDevices()
      assert(devices.length > 0, 'Should have at least one device')

      // This test verifies the interceptor is working
      // The requestId should be automatically injected
      const testDevice = devices[0]
      const state = await apiClient.fetchDeviceState({ device: testDevice })

      // If we got here without error, the requestId was properly injected
      assert(state, 'State should exist')
    })

    test.skip('should toggle a light on and off', async () => {
      // Find a light device (one with on_off capability)
      const devices = await apiClient.fetchDevices()
      const lightDevice = devices.find(device =>
        device.capabilities?.some(cap => cap.type === 'devices.capabilities.on_off')
      )

      assert(lightDevice, 'Should have at least one light device with on_off capability')

      // Get initial state
      const initialState = await apiClient.fetchDeviceState({ device: lightDevice })
      const onlineCap = initialState.capabilities.find(cap => cap.instance === 'online')
      const isOnline = onlineCap?.state?.value === true

      if (!isOnline) {
        return // Skip the test if device is offline
      }

      const powerCap = initialState.capabilities.find(cap => cap.instance === 'powerSwitch')
      assert(powerCap !== undefined, 'Device should have powerSwitch capability')

      const initialPowerState = powerCap.state.value
      // Handle empty string, 0, or 1 values
      const initialIsOn = initialPowerState === 1 || initialPowerState === '1'

      // Toggle to opposite state
      const targetState = !initialIsOn
      await apiClient.toggleDevicePower({ device: lightDevice, state: targetState })

      // Wait a bit for the state to update (API might need a moment)
      // Retry checking state up to 5 times with delays
      let newState
      let newPowerCap
      let newPowerState
      let newIsOn
      let retries = 5
      let stateUpdated = false

      while (retries > 0 && !stateUpdated) {
        await new Promise(resolve => setTimeout(resolve, 1500))
        newState = await apiClient.fetchDeviceState({ device: lightDevice })
        newPowerCap = newState.capabilities.find(cap => cap.instance === 'powerSwitch')
        assert(newPowerCap !== undefined, 'Device should still have powerSwitch capability after toggle')
        newPowerState = newPowerCap.state.value
        newIsOn = newPowerState === 1 || newPowerState === '1'
        stateUpdated = newIsOn === targetState
        retries--
      }

      assert.strictEqual(
        newIsOn,
        targetState,
        `Device should be ${
          targetState ? 'on' : 'off'
        } after toggle. Expected: ${targetState}, Got: ${newIsOn} (value: ${newPowerState})`
      )

      // Toggle back to original state
      await apiClient.toggleDevicePower({ device: lightDevice, state: initialIsOn })

      // Wait a bit for the state to update
      // Retry checking state up to 5 times with delays
      let finalState
      let finalPowerCap
      let finalPowerState
      let finalIsOn
      retries = 5
      stateUpdated = false

      while (retries > 0 && !stateUpdated) {
        await new Promise(resolve => setTimeout(resolve, 1500))
        finalState = await apiClient.fetchDeviceState({ device: lightDevice })
        finalPowerCap = finalState.capabilities.find(cap => cap.instance === 'powerSwitch')
        assert(finalPowerCap !== undefined, 'Device should still have powerSwitch capability after second toggle')
        finalPowerState = finalPowerCap.state.value
        finalIsOn = finalPowerState === 1 || finalPowerState === '1'
        stateUpdated = finalIsOn === initialIsOn
        retries--
      }

      assert.strictEqual(
        finalIsOn,
        initialIsOn,
        `Device should be back to original state. Expected: ${initialIsOn}, Got: ${finalIsOn} (value: ${finalPowerState})`
      )
    })

    test('should set RGB color for a light device', async () => {
      // Find a light device with colorRgb capability
      const devices = await apiClient.fetchDevices()
      const colorDevice = devices.find(device =>
        device.capabilities?.some(
          cap => cap.type === 'devices.capabilities.color_setting' && cap.instance === 'colorRgb'
        )
      )

      assert(colorDevice, 'Should have at least one light device with colorRgb capability')

      // Get initial state
      const initialState = await apiClient.fetchDeviceState({ device: colorDevice })
      const onlineCap = initialState.capabilities.find(cap => cap.instance === 'online')
      const isOnline = onlineCap?.state?.value === true

      if (!isOnline) {
        return // Skip the test if device is offline
      }

      const colorCap = initialState.capabilities.find(cap => cap.instance === 'colorRgb')
      assert(colorCap !== undefined, 'Device should have colorRgb capability')

      const initialColorRgb = colorCap.state.value
      assert(typeof initialColorRgb === 'number', 'Initial color should be a number')
      assert(initialColorRgb >= 0 && initialColorRgb <= 16777215, 'Initial color should be in valid range')

      // Generate a random color that's different from the initial color
      let targetColorRgb
      do {
        targetColorRgb = Math.floor(Math.random() * 16777216) // 0 to 16777215
      } while (targetColorRgb === initialColorRgb)

      await apiClient.setDeviceColorRgb({ device: colorDevice, rgb: targetColorRgb })

      // Wait a bit for the state to update (API might need a moment)
      // Retry checking state up to 5 times with delays
      let newState
      let newColorCap
      let newColorRgb
      let retries = 5
      let stateUpdated = false

      while (retries > 0 && !stateUpdated) {
        await new Promise(resolve => setTimeout(resolve, 1500))
        newState = await apiClient.fetchDeviceState({ device: colorDevice })
        newColorCap = newState.capabilities.find(cap => cap.instance === 'colorRgb')
        assert(newColorCap !== undefined, 'Device should still have colorRgb capability after setting color')
        newColorRgb = newColorCap.state.value
        // Allow some tolerance for color matching (devices might round values)
        stateUpdated = Math.abs(newColorRgb - targetColorRgb) < 1000
        retries--
      }

      assert(
        stateUpdated,
        `Device color should be set to ${targetColorRgb} (random color). Got: ${newColorRgb} after ${
          5 - retries
        } retries. Initial was: ${initialColorRgb}`
      )

      // Restore original color
      await apiClient.setDeviceColorRgb({ device: colorDevice, rgb: initialColorRgb })

      // Wait a bit for the state to update
      // Retry checking state up to 5 times with delays
      let finalState
      let finalColorCap
      let finalColorRgb
      retries = 5
      stateUpdated = false

      while (retries > 0 && !stateUpdated) {
        await new Promise(resolve => setTimeout(resolve, 1500))
        finalState = await apiClient.fetchDeviceState({ device: colorDevice })
        finalColorCap = finalState.capabilities.find(cap => cap.instance === 'colorRgb')
        assert(finalColorCap !== undefined, 'Device should still have colorRgb capability after restoring color')
        finalColorRgb = finalColorCap.state.value
        // Allow some tolerance for color matching
        stateUpdated = Math.abs(finalColorRgb - initialColorRgb) < 1000
        retries--
      }

      assert(
        stateUpdated,
        `Device color should be restored to ${initialColorRgb}. Got: ${finalColorRgb} after ${5 - retries} retries`
      )
    })

    test('should set color temperature for a light device', async () => {
      // Find a light device with colorTemperatureK capability
      const devices = await apiClient.fetchDevices()
      const tempDevice = devices.find(device =>
        device.capabilities?.some(
          cap => cap.type === 'devices.capabilities.color_setting' && cap.instance === 'colorTemperatureK'
        )
      )

      assert(tempDevice, 'Should have at least one light device with colorTemperatureK capability')

      // Get initial state
      const initialState = await apiClient.fetchDeviceState({ device: tempDevice })
      const onlineCap = initialState.capabilities.find(cap => cap.instance === 'online')
      const isOnline = onlineCap?.state?.value === true

      if (!isOnline) {
        return // Skip the test if device is offline
      }

      const tempCap = initialState.capabilities.find(cap => cap.instance === 'colorTemperatureK')
      assert(tempCap !== undefined, 'Device should have colorTemperatureK capability')

      const initialTemperatureK = tempCap.state.value
      assert(typeof initialTemperatureK === 'number', 'Initial temperature should be a number')
      assert(
        initialTemperatureK >= 2000 && initialTemperatureK <= 9000,
        'Initial temperature should be in valid range (2000-9000K)'
      )

      // Generate a random temperature that's different from the initial temperature
      let targetTemperatureK
      do {
        targetTemperatureK = Math.floor(Math.random() * (9000 - 2000 + 1)) + 2000 // 2000 to 9000
      } while (targetTemperatureK === initialTemperatureK)

      await apiClient.setDeviceColorTemperatureK({ device: tempDevice, temperatureK: targetTemperatureK })

      // Wait a bit for the state to update (API might need a moment)
      // Retry checking state up to 5 times with delays
      let newState
      let newTempCap
      let newTemperatureK
      let retries = 5
      let stateUpdated = false

      while (retries > 0 && !stateUpdated) {
        await new Promise(resolve => setTimeout(resolve, 1500))
        newState = await apiClient.fetchDeviceState({ device: tempDevice })
        newTempCap = newState.capabilities.find(cap => cap.instance === 'colorTemperatureK')
        assert(
          newTempCap !== undefined,
          'Device should still have colorTemperatureK capability after setting temperature'
        )
        newTemperatureK = newTempCap.state.value
        // Allow some tolerance for temperature matching (devices might round values)
        stateUpdated = Math.abs(newTemperatureK - targetTemperatureK) < 100
        retries--
      }

      assert(
        stateUpdated,
        `Device temperature should be set to ${targetTemperatureK}K. Got: ${newTemperatureK}K after ${
          5 - retries
        } retries. Initial was: ${initialTemperatureK}K`
      )

      // Restore original temperature
      await apiClient.setDeviceColorTemperatureK({ device: tempDevice, temperatureK: initialTemperatureK })

      // Wait a bit for the state to update
      // Retry checking state up to 5 times with delays
      let finalState
      let finalTempCap
      let finalTemperatureK
      retries = 5
      stateUpdated = false

      while (retries > 0 && !stateUpdated) {
        await new Promise(resolve => setTimeout(resolve, 1500))
        finalState = await apiClient.fetchDeviceState({ device: tempDevice })
        finalTempCap = finalState.capabilities.find(cap => cap.instance === 'colorTemperatureK')
        assert(
          finalTempCap !== undefined,
          'Device should still have colorTemperatureK capability after restoring temperature'
        )
        finalTemperatureK = finalTempCap.state.value
        // Allow some tolerance for temperature matching
        stateUpdated = Math.abs(finalTemperatureK - initialTemperatureK) < 100
        retries--
      }

      assert(
        stateUpdated,
        `Device temperature should be restored to ${initialTemperatureK}K. Got: ${finalTemperatureK}K after ${
          5 - retries
        } retries`
      )
    })

    test('should receive device state changes via MQTT', async () => {
      // Find a light device (one with on_off capability)
      const devices = await apiClient.fetchDevices()
      const lightDevice = devices.find(device =>
        device.capabilities?.some(cap => cap.type === 'devices.capabilities.on_off')
      )

      assert(lightDevice, 'Should have at least one light device with on_off capability')

      // Get initial state
      const initialState = await apiClient.fetchDeviceState({ device: lightDevice })
      const onlineCap = initialState.capabilities.find(cap => cap.instance === 'online')
      const isOnline = onlineCap?.state?.value === true

      if (!isOnline) {
        return // Skip the test if device is offline
      }

      const powerCap = initialState.capabilities.find(cap => cap.instance === 'powerSwitch')
      assert(powerCap !== undefined, 'Device should have powerSwitch capability')

      const initialPowerState = powerCap.state.value
      const initialIsOn = initialPowerState === 1 || initialPowerState === '1'

      // Create MQTT client and set up listener
      const mqttClient = apiClient.createMqttClient()
      let mqttMessageReceived = false
      let receivedDeviceState = null
      let mqttConnected = false

      await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          mqttClient.end()
          if (!mqttMessageReceived) {
            reject(new Error('MQTT message not received within timeout'))
          }
        }, 30000) // 30 second timeout

        mqttClient.on('connect', () => {
          mqttConnected = true
          // Subscribe to topic using GA/{API_KEY} format
          const topic = `GA/${API_KEY}`
          mqttClient.subscribe(topic, err => {
            if (err) {
              clearTimeout(timeout)
              mqttClient.end()
              reject(new Error(`Failed to subscribe to MQTT topic: ${err.message}`))
              return
            }

            // Wait a moment for subscription to be ready, then toggle the device
            setTimeout(async () => {
              const targetState = !initialIsOn
              try {
                await apiClient.toggleDevicePower({ device: lightDevice, state: targetState })
              } catch (err) {
                clearTimeout(timeout)
                mqttClient.end()
                reject(new Error(`Failed to toggle device: ${err.message}`))
              }
            }, 2000)
          })
        })

        mqttClient.on('message', (topic, message) => {
          try {
            const messageStr = message.toString()
            const data = JSON.parse(messageStr)

            // Check if this message is for our device (device ID might be formatted differently)
            const messageDeviceId = data.device
            const ourDeviceId = lightDevice.device
            const matches =
              messageDeviceId === ourDeviceId ||
              messageDeviceId === ourDeviceId.replace(/:/g, '') ||
              ourDeviceId === messageDeviceId.replace(/:/g, '')

            if (matches && data.capabilities) {
              // Look for powerSwitch capability update
              let powerCapUpdate = null

              // Try to find powerSwitch capability with state.value
              for (const cap of data.capabilities) {
                if (cap.instance === 'powerSwitch') {
                  // Check different state formats
                  if (cap.state) {
                    // Handle both state.value (single value) and state (array) formats
                    if (cap.state.value !== undefined && !Array.isArray(cap.state.value)) {
                      powerCapUpdate = cap
                      break
                    } else if (Array.isArray(cap.state) && cap.state.length > 0) {
                      // Handle array format: state: [{ name: "...", value: ... }]
                      const stateValue = cap.state[0].value
                      if (stateValue !== undefined) {
                        powerCapUpdate = { ...cap, state: { value: stateValue } }
                        break
                      }
                    }
                  }
                }
              }

              if (powerCapUpdate && powerCapUpdate.state.value !== undefined) {
                mqttMessageReceived = true
                receivedDeviceState = powerCapUpdate.state.value
                clearTimeout(timeout)
                mqttClient.end()

                // Verify the state matches what we set
                const receivedIsOn = receivedDeviceState === 1 || receivedDeviceState === '1'
                assert.strictEqual(
                  receivedIsOn,
                  !initialIsOn,
                  `MQTT should report device is ${
                    !initialIsOn ? 'on' : 'off'
                  }. Got: ${receivedIsOn} (value: ${receivedDeviceState})`
                )

                // Toggle back to original state
                apiClient
                  .toggleDevicePower({ device: lightDevice, state: initialIsOn })
                  .then(() => {
                    resolve()
                  })
                  .catch(err => {
                    reject(new Error(`Failed to restore device state: ${err.message}`))
                  })
                return
              }
            }
          } catch (err) {
            // Ignore parse errors, might be other message types
          }
        })

        mqttClient.on('error', err => {
          console.log('MQTT error details:', err)
          clearTimeout(timeout)
          mqttClient.end()
          reject(new Error(`MQTT error: ${err.message}`))
        })

        mqttClient.on('close', () => {
          console.log('MQTT connection closed')
        })

        mqttClient.on('offline', () => {
          console.log('MQTT client went offline')
        })

        // If connection fails
        setTimeout(() => {
          if (!mqttConnected) {
            clearTimeout(timeout)
            mqttClient.end()
            reject(new Error('MQTT connection timeout'))
          }
        }, 10000)
      })
    })
  })
}
