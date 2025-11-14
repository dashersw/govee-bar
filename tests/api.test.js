const { test, describe, before } = require('node:test')
const assert = require('node:assert')
const { createApiClient } = require('../lib/api-client')

const API_KEY = process.env.GOVEE_API_KEY

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
