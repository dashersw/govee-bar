const axios = require('axios')
const mqtt = require('mqtt')

const API_BASE_URL = 'https://openapi.api.govee.com'
const MQTT_HOST = 'aqm3wd1qlc3dy-ats.iot.us-east-1.amazonaws.com'
const MQTT_PORT = 8883

function createApiClient(apiKey) {
  const apiClient = axios.create({
    baseURL: `${API_BASE_URL}/router/api/v1`,
    headers: {
      'Content-Type': 'application/json',
      'Govee-API-Key': apiKey
    }
  })

  // Store API key for MQTT client creation
  apiClient._apiKey = apiKey

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

  apiClient.setDeviceBrightness = async function ({ device, brightness }) {
    // Brightness should be between 1-100 according to API docs
    const brightnessValue = Math.max(1, Math.min(100, Math.round(brightness)))
    return this.controlDevice({
      device,
      capabilityType: 'devices.capabilities.range',
      instance: 'brightness',
      value: brightnessValue
    })
  }

  apiClient.createMqttClient = function () {
    const connectUrl = `mqtts://${MQTT_HOST}:${MQTT_PORT}`
    const options = {
      username: this._apiKey,
      password: this._apiKey,
      rejectUnauthorized: false // AWS IoT Core may use self-signed certificates
    }

    const client = mqtt.connect(connectUrl, options)

    return client
  }

  return apiClient
}

module.exports = {
  createApiClient
}
