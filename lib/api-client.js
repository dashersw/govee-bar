const axios = require('axios')

const API_BASE_URL = 'https://openapi.api.govee.com'

function createApiClient(apiKey) {
  const apiClient = axios.create({
    baseURL: `${API_BASE_URL}/router/api/v1`,
    headers: {
      'Content-Type': 'application/json',
      'Govee-API-Key': apiKey
    }
  })

  // Add request interceptor to inject requestId
  apiClient.interceptors.request.use(config => {
    // Only add requestId for POST requests with a body
    if (config.method === 'post' && config.data) {
      if (!config.data.requestId) {
        config.data.requestId = `req-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`
      }
    }
    return config
  })

  // Attach API methods to the client instance
  apiClient.fetchDevices = async function () {
    const response = await this.get('/user/devices')

    if (response.data.code !== 200) {
      throw new Error(`API error: ${response.data.message || 'Unknown error'}`)
    }

    return response.data.data || []
  }

  apiClient.fetchDeviceState = async function ({ device }) {
    const response = await this.post('/device/state', {
      payload: {
        sku: device.sku,
        device: device.device
      }
    })

    if (response.data.code !== 200) {
      throw new Error(`API error: ${response.data.message || 'Unknown error'}`)
    }

    return response.data.payload || {}
  }

  apiClient.controlDevice = async function ({ device, capabilityType, instance, value }) {
    const requestBody = {
      payload: {
        sku: device.sku,
        device: device.device,
        capability: {
          type: capabilityType,
          instance,
          value
        }
      }
    }

    try {
      const response = await this.post('/device/control', requestBody)

      if (response.data.code !== 200) {
        throw new Error(`API error: ${response.data.message || 'Unknown error'} (code: ${response.data.code})`)
      }

      return response.data
    } catch (error) {
      if (error.response) {
        throw new Error(
          `API error: ${error.response.data?.message || error.message} (code: ${
            error.response.status || error.response.data?.code
          })`
        )
      }
      throw error
    }
  }

  apiClient.toggleDevicePower = async function ({ device, state }) {
    return this.controlDevice({
      device,
      capabilityType: 'devices.capabilities.on_off',
      instance: 'powerSwitch',
      value: state ? 1 : 0
    })
  }

  return apiClient
}

module.exports = {
  createApiClient
}
