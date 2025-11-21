const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
  fetchDevices: () => ipcRenderer.invoke('fetch-devices'),
  fetchDeviceState: device => ipcRenderer.invoke('fetch-device-state', device),
  toggleDevicePower: (device, state) => ipcRenderer.invoke('toggle-device-power', device, state),
  setDeviceBrightness: (device, brightness) => ipcRenderer.invoke('set-device-brightness', device, brightness),
  setDeviceColorRgb: (device, rgb) => ipcRenderer.invoke('set-device-color-rgb', device, rgb),
  setDeviceColorTemperatureK: (device, temperatureK) =>
    ipcRenderer.invoke('set-device-color-temperature-k', device, temperatureK),
  getApiKey: () => ipcRenderer.invoke('get-api-key'),
  saveApiKey: apiKey => ipcRenderer.invoke('save-api-key', apiKey),
  getTheme: () => ipcRenderer.invoke('get-theme'),
  onThemeChange: callback => {
    if (typeof callback !== 'function') {
      return () => {}
    }

    const listener = (_event, theme) => callback(theme)
    ipcRenderer.on('theme-changed', listener)
    return () => ipcRenderer.removeListener('theme-changed', listener)
  }
})
