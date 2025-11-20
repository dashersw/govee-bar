const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
  fetchDevices: () => ipcRenderer.invoke('fetch-devices'),
  fetchDeviceState: (device) => ipcRenderer.invoke('fetch-device-state', device),
  toggleDevicePower: (device, state) => ipcRenderer.invoke('toggle-device-power', device, state),
  setDeviceBrightness: (device, brightness) => ipcRenderer.invoke('set-device-brightness', device, brightness),
  getApiKey: () => ipcRenderer.invoke('get-api-key'),
  saveApiKey: (apiKey) => ipcRenderer.invoke('save-api-key', apiKey)
})

