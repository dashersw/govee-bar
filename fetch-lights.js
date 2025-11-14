#!/usr/bin/env node

const { createApiClient } = require('./lib/api-client')

const API_KEY = process.env.GOVEE_API_KEY || process.argv[2]

if (!API_KEY) {
  console.error('Error: API key required')
  console.error('Usage: node fetch-lights.js <api-key>')
  console.error('   or: GOVEE_API_KEY=<api-key> node fetch-lights.js')
  process.exit(1)
}

const apiClient = createApiClient(API_KEY)

async function main() {
  try {
    console.log('Fetching devices...\n')
    const devices = await apiClient.fetchDevices()

    if (devices.length === 0) {
      console.log('No devices found.')
      return
    }

    console.log(`Found ${devices.length} device(s)\n`)

    // Filter for lights (optional - you can remove this to show all devices)
    const lights = devices.filter(device =>
      device.capabilities?.some(
        cap => cap.type === 'devices.capabilities.color_setting' || cap.type === 'devices.capabilities.range'
      )
    )

    console.log(`Fetching states for ${lights.length} light device(s)...\n`)

    for (const device of lights) {
      try {
        console.log(`Device: ${device.deviceName || device.device} (${device.sku})`)
        console.log(`  Device ID: ${device.device}`)

        const state = await apiClient.fetchDeviceState({ device })

        if (state.capabilities) {
          console.log('  State:')
          state.capabilities.forEach(cap => {
            if (cap.state?.value !== undefined) {
              const value = typeof cap.state.value === 'object' ? JSON.stringify(cap.state.value) : cap.state.value
              console.log(`    ${cap.instance}: ${value}`)
            }
          })
        }

        console.log('')
      } catch (error) {
        console.error(`  Error fetching state: ${error.message}\n`)
      }
    }
  } catch (error) {
    console.error('Error:', error.message)
    process.exit(1)
  }
}

main()
