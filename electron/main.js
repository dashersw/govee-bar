const { app, BrowserWindow, ipcMain, screen, Tray, nativeImage, nativeTheme, globalShortcut } = require('electron')
const path = require('path')
const { createApiClient } = require('../lib/api-client')
const keytar = require('keytar')

// Import electron-liquid-glass for enhanced translucent effects (macOS only)
let liquidGlass = null
if (process.platform === 'darwin') {
  try {
    liquidGlass = require('electron-liquid-glass')
  } catch (error) {
    // electron-liquid-glass not available
  }
}

// Service name for keytar (used to identify the app in system credential storage)
const KEYTAR_SERVICE = 'govee-bar'
const KEYTAR_ACCOUNT = 'api-key'

// Get API key from system credential storage
async function getApiKey() {
  try {
    return await keytar.getPassword(KEYTAR_SERVICE, KEYTAR_ACCOUNT)
  } catch (error) {
    console.error('Error retrieving API key from keytar:', error)
    return null
  }
}

// Initialize API client - always create one, even if API key is missing
// The interceptor will handle missing API key errors
let apiClient = null

function createClient(apiKey) {
  // Always create a client, even with null/empty API key
  // The interceptor will handle missing API key errors
  return createApiClient(apiKey || '')
}

async function initializeApiClient() {
  const apiKey = await getApiKey()
  // Always create a client instance - interceptor handles missing API key
  apiClient = createClient(apiKey)
}

async function validateApiKeyInput(apiKeyInput) {
  const trimmedApiKey = apiKeyInput?.trim()

  if (!trimmedApiKey) {
    throw new Error('API key cannot be empty')
  }

  const client = createClient(trimmedApiKey)

  try {
    const response = await client.fetchDevices()
    // Check if response indicates success (status 200 or valid data)
    if (!response || (Array.isArray(response) && response.length === 0 && trimmedApiKey.length < 10)) {
      throw new Error('Invalid API key')
    }
  } catch (error) {
    // Check if it's an authentication/authorization error
    if (
      error.response?.status === 401 ||
      error.response?.status === 403 ||
      error.message?.includes('401') ||
      error.message?.includes('403')
    ) {
      throw new Error('Invalid API key')
    }
    throw new Error(`Invalid API key: ${error.message}`)
  }

  return { trimmedApiKey, client }
}

let mainWindow = null
let tray = null
// Track devices that don't exist to avoid unnecessary requests
const nonExistentDevices = new Set()
// Track rate limit status
let rateLimitedUntil = null

function broadcastThemeToRenderer(theme) {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.executeJavaScript(`
      document.documentElement.setAttribute('data-theme', '${theme}');
    `)
    mainWindow.webContents.send('theme-changed', theme)
  }
}

const handleNativeThemeUpdated = () => {
  const newTheme = nativeTheme.shouldUseDarkColors ? 'dark' : 'light'
  broadcastThemeToRenderer(newTheme)
}

// Create orange square icon
function createTrayIcon() {
  const size = 22 // macOS menu bar icon size
  const canvas = Buffer.alloc(size * size * 4)
  const orange = { r: 255, g: 165, b: 0 } // Orange color

  for (let i = 0; i < size * size; i++) {
    const offset = i * 4
    canvas[offset] = orange.r // R
    canvas[offset + 1] = orange.g // G
    canvas[offset + 2] = orange.b // B
    canvas[offset + 3] = 255 // A
  }

  return nativeImage.createFromBuffer(canvas, { width: size, height: size })
}

function positionWindowUnderTray() {
  if (!tray) {
    // Fallback: position at top-right if tray not available
    const { width } = screen.getPrimaryDisplay().workAreaSize
    const windowWidth = 360
    return {
      x: width - windowWidth - 20,
      y: 30,
      width: windowWidth,
      height: 600
    }
  }

  const trayBounds = tray.getBounds()
  const windowWidth = 360
  const windowHeight = 600

  // On macOS, tray icons are in the menu bar at the top
  // Position window centered horizontally under the tray icon
  // Menu bar height is typically 22-24px, so we position just below it
  const x = Math.round(trayBounds.x + trayBounds.width / 2 - windowWidth / 2)
  const y = Math.round(trayBounds.y + trayBounds.height + 4) // Small spacing below menu bar

  // Ensure window doesn't go off screen
  const display = screen.getDisplayNearestPoint({ x: trayBounds.x, y: trayBounds.y })
  const displayBounds = display.workArea

  const finalX = Math.max(displayBounds.x, Math.min(x, displayBounds.x + displayBounds.width - windowWidth))
  const finalY = Math.max(displayBounds.y, y)

  return { x: finalX, y: finalY, width: windowWidth, height: windowHeight }
}

function createWindow() {
  const { x, y, width: windowWidth, height: windowHeight } = positionWindowUnderTray()

  // Determine vibrancy based on system theme
  const isDarkMode = nativeTheme.shouldUseDarkColors
  const vibrancyType = isDarkMode ? 'popover' : 'light'

  const browserWindowOptions = {
    width: windowWidth,
    height: windowHeight,
    x,
    y,
    frame: false,
    transparent: true,
    backgroundColor: '#00000000',
    visualEffectState: 'active',
    hasShadow: true,
    alwaysOnTop: true,
    skipTaskbar: !!tray, // Only skip taskbar if tray exists
    resizable: false,
    titleBarOverlay: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      backgroundThrottling: false
    }
  }

  if (!liquidGlass) {
    browserWindowOptions.vibrancy = vibrancyType
  }

  mainWindow = new BrowserWindow(browserWindowOptions)

  // Ensure traffic lights are completely removed
  mainWindow.setMenuBarVisibility(false)

  // Set initial theme attribute and apply translucency effects after load
  mainWindow.webContents.once('did-finish-load', () => {
    const currentTheme = nativeTheme.shouldUseDarkColors ? 'dark' : 'light'
    mainWindow.webContents.executeJavaScript(`
      document.documentElement.setAttribute('data-theme', '${currentTheme}');
    `)
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('theme-changed', currentTheme)
    }

    // Apply liquid glass effect after content loads (macOS only)
    // Using electron-liquid-glass for enhanced translucent effects
    if (liquidGlass && process.platform === 'darwin') {
      try {
        liquidGlass.addView(mainWindow.getNativeWindowHandle(), {
          cornerRadius: 12, // Match border-radius
          tintColor: '#0000006f'
        })
      } catch (error) {
        // Fallback to native vibrancy
        mainWindow.setVibrancy(vibrancyType)
      }
    } else if (!liquidGlass) {
      mainWindow.setVibrancy(vibrancyType)
    }
  })

  // Ensure window is positioned correctly after creation
  mainWindow.once('ready-to-show', () => {
    const { x: newX, y: newY } = positionWindowUnderTray()
    mainWindow.setPosition(newX, newY)
  })

  // Load the app
  const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged
  if (isDev) {
    mainWindow.loadURL('http://localhost:5173')

    // Reload on Vite HMR
    mainWindow.webContents.on('did-fail-load', () => {
      setTimeout(() => {
        mainWindow.loadURL('http://localhost:5173')
      }, 1000)
    })
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'))
  }

  mainWindow.on('closed', () => {
    mainWindow = null
  })

  // Hide window when it loses focus (common for menu bar apps)
  mainWindow.on('blur', () => {
    mainWindow.hide()
  })
}

app.whenReady().then(async () => {
  // Hide dock icon immediately for menu bar app feel
  if (process.platform === 'darwin') {
    app.dock.hide()
  }

  // Initialize API client
  await initializeApiClient()

  // Setup theme change listener
  nativeTheme.on('updated', handleNativeThemeUpdated)

  // Create tray icon first
  const icon = createTrayIcon()
  tray = new Tray(icon)
  tray.setIgnoreDoubleClickEvents(true)

  tray.setToolTip('Govee Bar')

  // Register global shortcut to toggle window (Command+Option+Shift+G)
  globalShortcut.register('Command+Option+Shift+G', () => {
    if (mainWindow) {
      if (mainWindow.isVisible()) {
        mainWindow.hide()
      } else {
        const { x, y } = positionWindowUnderTray()
        mainWindow.setPosition(x, y, false)
        mainWindow.show()
        mainWindow.focus()
      }
    } else {
      createWindow()
    }
  })

  // Wait a moment for tray to be positioned, then create window
  // On macOS, we may need to wait a bit longer for the tray to be fully initialized
  setTimeout(() => {
    createWindow()
  }, 500)

  tray.on('click', () => {
    if (mainWindow) {
      if (mainWindow.isVisible()) {
        mainWindow.hide()
      } else {
        // Reposition window under tray icon before showing
        const { x, y } = positionWindowUnderTray()
        mainWindow.setPosition(x, y, false)
        mainWindow.show()
        mainWindow.focus()
      }
    } else {
      createWindow()
    }
  })

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('will-quit', () => {
  // Unregister all shortcuts
  globalShortcut.unregisterAll()
})

app.on('window-all-closed', () => {
  // On macOS, keep app running even when all windows are closed
  // The tray icon allows users to reopen the window
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('before-quit', () => {
  if (tray) {
    tray.destroy()
  }
})

// IPC Handlers
ipcMain.handle('get-api-key', async () => {
  return await getApiKey()
})

ipcMain.handle('save-api-key', async (event, apiKeyInput) => {
  try {
    const { trimmedApiKey, client } = await validateApiKeyInput(apiKeyInput)

    // Store API key securely in system credential storage
    await keytar.setPassword(KEYTAR_SERVICE, KEYTAR_ACCOUNT, trimmedApiKey)
    apiClient = client

    return { success: true }
  } catch (error) {
    console.error('Error setting API key:', error)
    return { success: false, error: error.message || 'An error occurred while saving the API key' }
  }
})

ipcMain.handle('get-theme', () => {
  return nativeTheme.shouldUseDarkColors ? 'dark' : 'light'
})

ipcMain.handle('fetch-devices', async () => {
  try {
    const devices = await apiClient.fetchDevices()
    // Filter for lights (devices with on_off capability)
    const lights = devices.filter(device =>
      device.capabilities?.some(cap => cap.type === 'devices.capabilities.on_off')
    )
    return { success: true, data: lights }
  } catch (error) {
    console.error('Error in fetch-devices handler:', error)
    return { success: false, error: error.message }
  }
})

ipcMain.handle('fetch-device-state', async (event, device) => {
  try {
    // Skip devices that we know don't exist
    const deviceKey = `${device.sku}:${device.device}`
    if (nonExistentDevices.has(deviceKey)) {
      return { success: false, error: 'Device does not exist', skip: true }
    }

    // Skip requests if we're rate limited
    if (rateLimitedUntil && Date.now() < rateLimitedUntil) {
      return { success: false, error: 'Rate limited', skip: true }
    }

    const state = await apiClient.fetchDeviceState({ device })
    return { success: true, data: state }
  } catch (error) {
    // Check if it's a 429 rate limit error (HTTP status or API code)
    if (error.response?.status === 429 || error.response?.data?.code === 429 || error.message?.includes('429')) {
      // Set rate limit for 60 seconds
      rateLimitedUntil = Date.now() + 60000
      console.warn('Rate limited, skipping requests for 60 seconds')
      return { success: false, error: 'Rate limited', skip: true }
    }

    // Check if device doesn't exist (400 error with "devices not exist")
    const errorMessage = error.message || ''
    const errorData = error.response?.data || {}
    if (
      error.response?.status === 400 ||
      error.response?.data?.code === 400 ||
      errorMessage.includes('devices not exist') ||
      errorData.msg === 'devices not exist'
    ) {
      const deviceKey = `${device.sku}:${device.device}`
      nonExistentDevices.add(deviceKey)
      console.warn(`Device ${deviceKey} does not exist, skipping future requests`)
      return { success: false, error: 'Device does not exist', skip: true }
    }

    console.error('Error in fetch-device-state handler:', error)
    return { success: false, error: error.message }
  }
})

ipcMain.handle('toggle-device-power', async (event, device, state) => {
  try {
    await apiClient.toggleDevicePower({ device, state })
    return { success: true }
  } catch (error) {
    console.error('Error in toggle-device-power handler:', error)
    return { success: false, error: error.message }
  }
})

ipcMain.handle('set-device-brightness', async (event, device, brightness) => {
  try {
    await apiClient.setDeviceBrightness({ device, brightness })
    return { success: true }
  } catch (error) {
    console.error('Error in set-device-brightness handler:', error)
    return { success: false, error: error.message }
  }
})

ipcMain.handle('set-device-color-rgb', async (event, device, rgb) => {
  try {
    await apiClient.setDeviceColorRgb({ device, rgb })
    return { success: true }
  } catch (error) {
    console.error('Error in set-device-color-rgb handler:', error)
    return { success: false, error: error.message }
  }
})

ipcMain.handle('set-device-color-temperature-k', async (event, device, temperatureK) => {
  try {
    await apiClient.setDeviceColorTemperatureK({ device, temperatureK })
    return { success: true }
  } catch (error) {
    console.error('Error in set-device-color-temperature-k handler:', error)
    return { success: false, error: error.message }
  }
})
