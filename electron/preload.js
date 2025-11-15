const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
  fetchDevices: () => ipcRenderer.invoke('fetch-devices'),
  fetchDeviceState: (device) => ipcRenderer.invoke('fetch-device-state', device),
  toggleDevicePower: (device, state) => ipcRenderer.invoke('toggle-device-power', device, state),
  setDeviceBrightness: (device, brightness) => ipcRenderer.invoke('set-device-brightness', device, brightness),
  getTheme: () => ipcRenderer.invoke('get-theme'),
  onThemeChange: (callback) => {
    if (typeof callback !== 'function') {
      return () => {}
    }

    const listener = (_event, theme) => callback(theme)
    ipcRenderer.on('theme-changed', listener)
    return () => ipcRenderer.removeListener('theme-changed', listener)
  },
  getApiKey: () => ipcRenderer.invoke('get-api-key'),
  setApiKey: (apiKey) => ipcRenderer.invoke('set-api-key', apiKey)
})

