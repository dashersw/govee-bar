const { test, describe } = require('node:test')
const assert = require('node:assert')
const { createApiClient } = require('../lib/api-client')

describe('createApiClient', () => {
  test('configures axios client with defaults and stores API key', () => {
    const axiosStub = buildAxiosStub()
    const mqttStub = buildMqttStub()

    const apiClient = createApiClient('test-key', { axiosLib: axiosStub, mqttLib: mqttStub })

    const config = axiosStub.getCreateConfig()
    assert.strictEqual(config.baseURL, 'https://openapi.api.govee.com/router/api/v1')
    assert.deepStrictEqual(config.headers, {
      'Content-Type': 'application/json',
      'Govee-API-Key': 'test-key'
    })
    assert.strictEqual(apiClient._apiKey, 'test-key')
  })

  test('injects requestId for POST requests before sending', async () => {
    const axiosStub = buildAxiosStub()
    const mqttStub = buildMqttStub()

    axiosStub.onPost('/device/state', async request => {
      assert.ok(request.data.requestId.startsWith('req-'))
      assert.deepStrictEqual(request.data.payload, { sku: 'sku', device: 'dev' })
      return {
        data: {
          code: 200,
          payload: { capabilities: [] }
        }
      }
    })

    const apiClient = createApiClient('test-key', { axiosLib: axiosStub, mqttLib: mqttStub })

    const payload = await apiClient.fetchDeviceState({ device: { sku: 'sku', device: 'dev' } })
    assert.deepStrictEqual(payload, { capabilities: [] })
  })

  test('fetchDevices returns API payload and throws on non-200 codes', async () => {
    const axiosStub = buildAxiosStub()
    const mqttStub = buildMqttStub()

    axiosStub.onGet('/user/devices', async () => ({
      data: {
        code: 200,
        data: [{ device: 'dev-1' }]
      }
    }))

    const apiClient = createApiClient('test-key', { axiosLib: axiosStub, mqttLib: mqttStub })
    const devices = await apiClient.fetchDevices()
    assert.deepStrictEqual(devices, [{ device: 'dev-1' }])

    axiosStub.onGet('/user/devices', async () => ({
      data: {
        code: 500,
        message: 'boom'
      }
    }))

    await assert.rejects(
      () => apiClient.fetchDevices(),
      /API error: boom/
    )
  })

  test('controlDevice propagates API errors with response metadata', async () => {
    const axiosStub = buildAxiosStub()
    const mqttStub = buildMqttStub()

    axiosStub.onPost('/device/control', async () => {
      throw createAxiosError('Request failed', {
        status: 403,
        data: { message: 'denied', code: 40301 }
      })
    })

    const apiClient = createApiClient('test-key', { axiosLib: axiosStub, mqttLib: mqttStub })

    await assert.rejects(
      () =>
        apiClient.controlDevice({
          device: { sku: 'sku', device: 'dev' },
          capabilityType: 'devices.capabilities.on_off',
          instance: 'powerSwitch',
          value: 1
        }),
      /API error: denied \(code: 403\)/
    )
  })

  test('toggleDevicePower and setDeviceBrightness send normalized payloads', async () => {
    const axiosStub = buildAxiosStub()
    const mqttStub = buildMqttStub()

    axiosStub.onPost('/device/control', async request => {
      return {
        data: {
          code: 200,
          data: request.data
        }
      }
    })

    const apiClient = createApiClient('test-key', { axiosLib: axiosStub, mqttLib: mqttStub })
    const device = { sku: 'sku', device: 'dev' }

    await apiClient.toggleDevicePower({ device, state: true })
    await apiClient.toggleDevicePower({ device, state: false })
    await apiClient.setDeviceBrightness({ device, brightness: 0 })
    await apiClient.setDeviceBrightness({ device, brightness: 42.4 })
    await apiClient.setDeviceBrightness({ device, brightness: 150 })

    const controlCalls = axiosStub.recordedRequests.filter(req => req.url === '/device/control')
    assert.strictEqual(controlCalls.length, 5)

    assert.strictEqual(controlCalls[0].data.payload.capability.value, 1)
    assert.strictEqual(controlCalls[1].data.payload.capability.value, 0)
    assert.strictEqual(controlCalls[2].data.payload.capability.value, 1)
    assert.strictEqual(controlCalls[3].data.payload.capability.value, 42)
    assert.strictEqual(controlCalls[4].data.payload.capability.value, 100)
  })

  test('createMqttClient uses API key credentials', () => {
    const axiosStub = buildAxiosStub()
    const mqttStub = buildMqttStub()

    const apiClient = createApiClient('test-key', { axiosLib: axiosStub, mqttLib: mqttStub })
    apiClient.createMqttClient()

    assert.strictEqual(mqttStub.connectCalls.length, 1)
    const [{ url, options }] = mqttStub.connectCalls
    assert.strictEqual(url, 'mqtts://aqm3wd1qlc3dy-ats.iot.us-east-1.amazonaws.com:8883')
    assert.deepStrictEqual(options, {
      username: 'test-key',
      password: 'test-key',
      rejectUnauthorized: false
    })
  })
})

function buildAxiosStub() {
  const requestInterceptors = []
  const getHandlers = new Map()
  const postHandlers = new Map()
  const recordedRequests = []
  let lastCreateConfig = null

  const client = {
    interceptors: {
      request: {
        use(handler) {
          requestInterceptors.push(handler)
        }
      }
    },
    async get(url, config = {}) {
      const request = runInterceptors({ method: 'get', url, ...config }, requestInterceptors)
      const handler = getHandlers.get(url)
      if (!handler) {
        throw new Error(`No GET handler registered for ${url}`)
      }
      recordedRequests.push({ method: 'get', url, data: request.data })
      return handler(request)
    },
    async post(url, data = {}, config = {}) {
      const request = runInterceptors({ method: 'post', url, data, ...config }, requestInterceptors)
      const handler = postHandlers.get(url)
      if (!handler) {
        throw new Error(`No POST handler registered for ${url}`)
      }
      recordedRequests.push({ method: 'post', url, data: request.data })
      return handler(request)
    }
  }

  return {
    create(config = {}) {
      lastCreateConfig = config
      return client
    },
    onGet(url, handler) {
      getHandlers.set(url, handler)
    },
    onPost(url, handler) {
      postHandlers.set(url, handler)
    },
    getCreateConfig() {
      return lastCreateConfig || {}
    },
    recordedRequests
  }
}

function buildMqttStub() {
  const connectCalls = []
  return {
    connect(url, options) {
      connectCalls.push({ url, options })
      return { url, options }
    },
    get connectCalls() {
      return connectCalls
    }
  }
}

function runInterceptors(request, interceptors) {
  let current = request
  for (const interceptor of interceptors) {
    const maybeNewConfig = interceptor(current)
    if (maybeNewConfig) {
      current = maybeNewConfig
    }
  }
  return current
}

function createAxiosError(message, { status, data }) {
  const error = new Error(message)
  error.response = {
    status,
    data
  }
  return error
}

