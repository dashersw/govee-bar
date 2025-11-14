const axios = require('axios')
const mqtt = require('mqtt')
const fs = require('fs')
const path = require('path')

const API_BASE_URL = 'https://openapi.api.govee.com'
const AWS_IOT_HOST = 'aqm3wd1qlc3dy-ats.iot.us-east-1.amazonaws.com'
const AWS_IOT_PORT = 8883
const GOVEE_UNDOC_API_BASE = 'https://app2.govee.com'

function createApiClient(apiKey, options = {}) {
  const {
    email = null,
    password = null,
    useCertificates = true,
    certsPath = './certs'
  } = options

  // Standard API client for official Govee API
  const apiClient = axios.create({
    baseURL: `${API_BASE_URL}/router/api/v1`,
    headers: {
      'Content-Type': 'application/json',
      'Govee-API-Key': apiKey
    }
  })

  // Store API key and credentials
  apiClient._apiKey = apiKey
  apiClient._email = email
  apiClient._password = password
  apiClient._certsPath = certsPath
  apiClient._useCertificates = useCertificates
  apiClient._awsIotCredentials = null

  // Add request interceptor to inject requestId
  apiClient.interceptors.request.use(config => {
    if (config.method === 'post' && config.data) {
      if (!config.data.requestId) {
        config.data.requestId = `req-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`
      }
    }
    return config
  })

  // ============= Official API Methods =============

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

  // ============= AWS IoT Methods =============

  apiClient.generateClientId = function () {
    return Array.from({ length: 32 }, () =>
      Math.floor(Math.random() * 16).toString(16)
    ).join('')
  }

  apiClient.loginToGoveeUndocumented = async function () {
    if (!this._email || !this._password) {
      throw new Error('Email and password required for AWS IoT connection')
    }

    const clientId = this.generateClientId()

    try {
      const response = await axios.post(
        `${GOVEE_UNDOC_API_BASE}/account/rest/account/v1/login`,
        {
          email: this._email,
          password: this._password,
          client: clientId
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'Govee/6.8.2 (iPhone; iOS 16.0; Scale/3.00)'
          }
        }
      )

      if (response.data.status !== 200) {
        throw new Error(`Login failed: ${response.data.message}`)
      }

      const client = response.data.client || {}

      this._awsIotCredentials = {
        clientId: client.client || clientId,
        accountTopic: client.topic || `GA/${client.client || clientId}`,
        jwtToken: client.token || '',
        refreshToken: client.refreshToken || client.token || '', // Fallback to token if refreshToken is empty
        tokenExpiry: Date.now() + ((client.tokenExpireCycle || 57600) * 1000)
      }

      console.log('✓ AWS IoT credentials obtained')
      console.log('  Account Topic:', this._awsIotCredentials.accountTopic)

      return this._awsIotCredentials
    } catch (error) {
      if (error.response) {
        throw new Error(
          `Login failed: ${error.response.data?.message || error.message} (status: ${error.response.status})`
        )
      }
      throw error
    }
  }

  apiClient.getAwsIotDevices = async function () {
    if (!this._awsIotCredentials) {
      await this.loginToGoveeUndocumented()
    }

    try {
      // Try POST request instead of GET (Govee API may require POST)
      const response = await axios.post(
        `${GOVEE_UNDOC_API_BASE}/device/rest/devices/v1/list`,
        {}, // Empty body for POST
        {
          headers: {
            'Authorization': `Bearer ${this._awsIotCredentials.jwtToken}`,
            'Content-Type': 'application/json',
            'User-Agent': 'Govee/6.8.2 (iPhone; iOS 16.0; Scale/3.00)'
          }
        }
      )

      if (response.data.status !== 200) {
        throw new Error(`Failed to get devices: ${response.data.message}`)
      }

      const devices = response.data.devices || []

      // Parse deviceSettings for each device
      return devices.map(device => {
        try {
          if (device.deviceExt?.deviceSettings) {
            device.deviceExt.deviceSettings = typeof device.deviceExt.deviceSettings === 'string'
              ? JSON.parse(device.deviceExt.deviceSettings)
              : device.deviceExt.deviceSettings
          }
        } catch (e) {
          console.warn(`Failed to parse deviceSettings for ${device.device}:`, e.message)
        }
        return device
      })
    } catch (error) {
      if (error.response) {
        throw new Error(
          `Failed to get devices: ${error.response.data?.message || error.message} (status: ${error.response.status})`
        )
      }
      throw error
    }
  }

  apiClient.createMqttClient = function (type = 'simple') {
    if (type === 'simple') {
      // Simple MQTT connection using API key (for mqtt.openapi.govee.com)
      const connectUrl = `mqtts://mqtt.openapi.govee.com:8883`
      const options = {
        username: this._apiKey,
        password: this._apiKey,
        rejectUnauthorized: false
      }

      const client = mqtt.connect(connectUrl, options)
      return client
    } else if (type === 'aws-iot') {
      // AWS IoT connection with certificates
      return this.createAwsIotMqttClient()
    } else {
      throw new Error('Invalid MQTT client type. Use "simple" or "aws-iot"')
    }
  }

  apiClient.createAwsIotMqttClient = async function () {
    // Ensure we have credentials
    if (!this._awsIotCredentials) {
      await this.loginToGoveeUndocumented()
    }

    const credentials = this._awsIotCredentials

    let mqttOptions = {
      host: AWS_IOT_HOST,
      port: AWS_IOT_PORT,
      protocol: 'mqtts',
      clientId: credentials.clientId,
      keepalive: 60,
      clean: true
    }

    // Check if certificates exist and use them
    const certFiles = {
      ca: path.join(this._certsPath, 'AmazonRootCA1.pem'),
      cert: path.join(this._certsPath, 'testiot.cert.pem'),
      key: path.join(this._certsPath, 'testiot.cert.pkey')
    }

    const certsExist = Object.values(certFiles).every(file => {
      try {
        return fs.existsSync(file)
      } catch {
        return false
      }
    })

    if (this._useCertificates && certsExist) {
      try {
        mqttOptions = {
          ...mqttOptions,
          ca: fs.readFileSync(certFiles.ca),
          cert: fs.readFileSync(certFiles.cert),
          key: fs.readFileSync(certFiles.key),
          rejectUnauthorized: true
        }

        console.log('✓ Using certificate-based authentication')
      } catch (error) {
        console.warn('⚠ Failed to load certificates:', error.message)
        throw new Error(`Certificate files exist but cannot be loaded: ${error.message}`)
      }
    } else {
      if (this._useCertificates && !certsExist) {
        console.error('✗ Certificate files not found at:', this._certsPath)
        console.error('  Please download certificates:')
        console.error('  mkdir -p certs')
        console.error('  curl -o certs/AmazonRootCA1.pem https://www.amazontrust.com/repository/AmazonRootCA1.pem')
        console.error('  curl -o certs/testiot.cert.pem https://raw.githubusercontent.com/constructorfleet/homebridge-ultimate-govee/master/assets/testiot.cert.pem')
        console.error('  curl -o certs/testiot.cert.pkey https://raw.githubusercontent.com/constructorfleet/homebridge-ultimate-govee/master/assets/testiot.cert.pkey')
        throw new Error('Certificate files required but not found. Set useCertificates: false to skip certificates.')
      }

      mqttOptions.rejectUnauthorized = false
      console.log('⚠ Using insecure connection (certificates disabled)')
    }

    const client = mqtt.connect(mqttOptions)

    // Enhanced event handlers
    client.on('connect', () => {
      console.log('✓ Connected to AWS IoT MQTT')

      // Subscribe to account topic
      client.subscribe(credentials.accountTopic, (err) => {
        if (!err) {
          console.log(`✓ Subscribed to account topic: ${credentials.accountTopic}`)
        } else {
          console.error('✗ Subscribe error:', err.message)
        }
      })
    })

    client.on('error', (error) => {
      console.error('✗ MQTT Error:', error.message)
    })

    client.on('close', () => {
      console.log('⊗ MQTT Connection closed')
    })

    client.on('reconnect', () => {
      console.log('⟳ Reconnecting to MQTT...')
    })

    // Store credentials with client for later use
    client._goveeCredentials = credentials
    client._goveeApiClient = this

    return client
  }

  // ============= AWS IoT Helper Methods =============

  apiClient.subscribeToDevice = function (mqttClient, device) {
    const deviceTopic = device.deviceExt?.deviceSettings?.topic

    if (!deviceTopic) {
      console.warn(`⚠ Device ${device.deviceName || device.device} has no MQTT topic`)
      return false
    }

    mqttClient.subscribe(deviceTopic, (err) => {
      if (!err) {
        console.log(`✓ Subscribed to device: ${device.deviceName || device.device}`)
      } else {
        console.error(`✗ Failed to subscribe to device ${device.device}:`, err.message)
      }
    })

    return true
  }

  apiClient.requestDeviceStatus = function (mqttClient, device) {
    const deviceTopic = device.deviceExt?.deviceSettings?.topic

    if (!deviceTopic) {
      throw new Error('Device has no MQTT topic')
    }

    const message = {
      msg: {
        cmd: 'status',
        cmdVersion: 2,
        type: 0,
        transaction: `u_${Date.now()}`
      }
    }

    mqttClient.publish(deviceTopic, JSON.stringify(message), (err) => {
      if (err) {
        console.error('✗ Failed to request status:', err.message)
      } else {
        console.log(`✓ Status requested for: ${device.deviceName || device.device}`)
      }
    })
  }

  apiClient.sendDeviceCommand = function (mqttClient, device, command) {
    const deviceTopic = device.deviceExt?.deviceSettings?.topic

    if (!deviceTopic) {
      throw new Error('Device has no MQTT topic')
    }

    const message = {
      msg: {
        cmd: command.cmd,
        data: command.data,
        transaction: `u_${Date.now()}`,
        type: 1
      }
    }

    mqttClient.publish(deviceTopic, JSON.stringify(message), (err) => {
      if (err) {
        console.error('✗ Failed to send command:', err.message)
      } else {
        console.log(`✓ Command sent (${command.cmd}) to: ${device.deviceName || device.device}`)
      }
    })
  }

  // Convenience methods for common commands
  apiClient.turnDeviceOn = function (mqttClient, device) {
    return this.sendDeviceCommand(mqttClient, device, {
      cmd: 'turn',
      data: { value: 1 }
    })
  }

  apiClient.turnDeviceOff = function (mqttClient, device) {
    return this.sendDeviceCommand(mqttClient, device, {
      cmd: 'turn',
      data: { value: 0 }
    })
  }

  apiClient.setDeviceBrightness = function (mqttClient, device, brightness) {
    return this.sendDeviceCommand(mqttClient, device, {
      cmd: 'brightness',
      data: { value: Math.max(0, Math.min(100, brightness)) }
    })
  }

  apiClient.setDeviceColor = function (mqttClient, device, r, g, b) {
    return this.sendDeviceCommand(mqttClient, device, {
      cmd: 'colorwc',
      data: {
        color: { r, g, b }
      }
    })
  }

  apiClient.setDeviceColorTemp = function (mqttClient, device, kelvin) {
    return this.sendDeviceCommand(mqttClient, device, {
      cmd: 'colorTem',
      data: {
        colorTemInKelvin: Math.max(2000, Math.min(9000, kelvin))
      }
    })
  }

  return apiClient
}

module.exports = {
  createApiClient
}
