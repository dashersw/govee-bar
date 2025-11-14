const { app, BrowserWindow, ipcMain, screen, Tray, nativeImage } = require('electron')
const path = require('path')
const { createApiClient } = require('../lib/api-client')

const API_KEY = process.env.GOVEE_API_KEY

if (!API_KEY) {
  console.error('Error: GOVEE_API_KEY environment variable is required')
  app.quit()
}

const apiClient = createApiClient(API_KEY)

let mainWindow = null
let tray = null

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

  mainWindow = new BrowserWindow({
    width: windowWidth,
    height: windowHeight,
    x,
    y,
    frame: false,
    transparent: true,
    backgroundColor: '#00000000',
    vibrancy: 'hud',
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

app.whenReady().then(() => {
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
ipcMain.handle('fetch-devices', async () => {
  try {
    const devices = await apiClient.fetchDevices()
    // Filter for lights (devices with on_off capability)
    const lights = devices.filter(device =>
      device.capabilities?.some(cap => cap.type === 'devices.capabilities.on_off')
    )
    return { success: true, data: lights }
  } catch (error) {
    return { success: false, error: error.message }
  }
})

ipcMain.handle('fetch-device-state', async (event, device) => {
  try {
    const state = await apiClient.fetchDeviceState({ device })
    return { success: true, data: state }
  } catch (error) {
    return { success: false, error: error.message }
  }
})

ipcMain.handle('toggle-device-power', async (event, device, state) => {
  try {
    await apiClient.toggleDevicePower({ device, state })
    return { success: true }
  } catch (error) {
    return { success: false, error: error.message }
  }
})

ipcMain.handle('set-device-brightness', async (event, device, brightness) => {
  try {
    await apiClient.setDeviceBrightness({ device, brightness })
    return { success: true }
  } catch (error) {
    return { success: false, error: error.message }
  }
})
