require('dotenv').config()

const { app, BrowserWindow, ipcMain, screen, Tray, nativeImage, nativeTheme } = require('electron')
const path = require('path')
const { createApiClient } = require('../lib/api-client')

// Initialize electron-store for settings (using dynamic import for ES Module)
let store = null
let Store = null

async function initializeStore() {
  if (!Store) {
    const StoreModule = await import('electron-store')
    Store = StoreModule.default
    store = new Store({
      name: 'govee-bar-settings',
      defaults: {
        apiKey: null
      }
    })
  }
  return store
}

// Import electron-liquid-glass for enhanced translucent effects (macOS only)
let liquidGlass = null
if (process.platform === 'darwin') {
  try {
    liquidGlass = require('electron-liquid-glass')
    console.log('✓ electron-liquid-glass loaded successfully')
  } catch (error) {
    console.warn('✗ electron-liquid-glass not available:', error.message)
  }
} else {
  console.log('ℹ electron-liquid-glass skipped (not macOS)')
}

// Get API key from store or fallback to .env
async function getApiKey() {
  if (!store) {
    await initializeStore()
  }
  const storedApiKey = store ? store.get('apiKey') : null
  return storedApiKey || process.env.GOVEE_API_KEY || null
}

// Initialize API client
let apiClient = null

function createClient(apiKey) {
  if (!apiKey) {
    throw new Error('API key is required')
  }

  const client = createApiClient(apiKey)
  if (!client || typeof client.fetchDevices !== 'function') {
    throw new Error('Failed to create API client')
  }

  return client
}

async function initializeApiClient(apiKeyOverride = null) {
  const apiKey = apiKeyOverride ?? (await getApiKey())
  if (!apiKey) {
    console.warn('⚠ No API key found. Please set it in settings.')
    apiClient = null
    return false
  }

  try {
    apiClient = createClient(apiKey)
    console.log('✓ API client initialized successfully')
    return true
  } catch (error) {
    console.error('Error creating API client:', error.message)
    apiClient = null
    return false
  }
}

async function validateApiKeyInput(apiKeyInput) {
  const trimmedApiKey = apiKeyInput?.trim()

  if (!trimmedApiKey) {
    throw new Error('API key cannot be empty')
  }

  const client = createClient(trimmedApiKey)

  try {
    await client.fetchDevices()
    console.log('✓ API key validated successfully')
  } catch (error) {
    throw new Error(`Invalid API key: ${error.message}`)
  }

  return { trimmedApiKey, client }
}

let mainWindow = null
let tray = null

function broadcastThemeToRenderer(theme) {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.executeJavaScript(`
      document.documentElement.setAttribute('data-theme', '${theme}');
    `)
    mainWindow.webContents.send('theme-changed', theme)
  }
  console.log('Theme changed to:', theme)
}

const handleNativeThemeUpdated = () => {
  const newTheme = nativeTheme.shouldUseDarkColors ? 'dark' : 'light'
  broadcastThemeToRenderer(newTheme)
}

nativeTheme.on('updated', handleNativeThemeUpdated)

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
  const vibrancyType = isDarkMode ? 'ultra-dark' : 'light'

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
    skipTaskbar: true,
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
      console.log('Applying liquid glass effect...')
      try {
        const glassId = liquidGlass.addView(mainWindow.getNativeWindowHandle(), {
          cornerRadius: 12, // Match border-radius
          tintColor: isDarkMode ? [0, 0, 0, 0.3] : [255, 255, 255, 0.2] // Theme-based tint
        })
        console.log('✓ Liquid glass effect applied successfully, glassId:', glassId)
      } catch (error) {
        console.error('✗ Failed to apply liquid glass effect:', error.message)
        // Fallback to native vibrancy
        mainWindow.setVibrancy(vibrancyType)
        console.log('✓ Fallback to native vibrancy:', vibrancyType)
      }
    } else if (!liquidGlass) {
      console.log('⚠ Liquid glass not available - using native vibrancy:', vibrancyType)
      mainWindow.setVibrancy(vibrancyType)
    }
  })

  // Ensure traffic lights are completely removed
  mainWindow.setMenuBarVisibility(false)

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
  // Initialize store first
  await initializeStore()
  
  // Initialize API client
  await initializeApiClient()

  // Create tray icon first
  const icon = createTrayIcon()
  tray = new Tray(icon)

  tray.setToolTip('Govee Bar')

  // Wait a moment for tray to be positioned, then create window
  setTimeout(() => {
    createWindow()
  }, 100)

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

ipcMain.handle('set-api-key', async (event, apiKeyInput) => {
  try {
    const { trimmedApiKey, client } = await validateApiKeyInput(apiKeyInput)

    if (!store) {
      await initializeStore()
    }

    store.set('apiKey', trimmedApiKey)
    apiClient = client

    return { success: true }
  } catch (error) {
    console.error('Error setting API key:', error)
    return { success: false, error: error.message || 'An error occurred while saving the API key' }
  }
})

ipcMain.handle('fetch-devices', async () => {
  try {
    if (!apiClient || typeof apiClient.fetchDevices !== 'function') {
      throw new Error('API key not set. Please enter your API key in settings.')
    }
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
    if (!apiClient || typeof apiClient.fetchDeviceState !== 'function') {
      throw new Error('API key not set. Please enter your API key in settings.')
    }
    const state = await apiClient.fetchDeviceState({ device })
    return { success: true, data: state }
  } catch (error) {
    console.error('Error in fetch-device-state handler:', error)
    return { success: false, error: error.message }
  }
})

ipcMain.handle('toggle-device-power', async (event, device, state) => {
  try {
    if (!apiClient || typeof apiClient.toggleDevicePower !== 'function') {
      throw new Error('API key not set. Please enter your API key in settings.')
    }
    await apiClient.toggleDevicePower({ device, state })
    return { success: true }
  } catch (error) {
    console.error('Error in toggle-device-power handler:', error)
    return { success: false, error: error.message }
  }
})

ipcMain.handle('set-device-brightness', async (event, device, brightness) => {
  try {
    if (!apiClient || typeof apiClient.setDeviceBrightness !== 'function') {
      throw new Error('API key not set. Please enter your API key in settings.')
    }
    await apiClient.setDeviceBrightness({ device, brightness })
    return { success: true }
  } catch (error) {
    console.error('Error in set-device-brightness handler:', error)
    return { success: false, error: error.message }
  }
})

ipcMain.handle('get-theme', () => {
  return nativeTheme.shouldUseDarkColors ? 'dark' : 'light'
})
