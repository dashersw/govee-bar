const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
  fetchDevices: () => ipcRenderer.invoke('fetch-devices'),
  fetchDeviceState: (device) => ipcRenderer.invoke('fetch-device-state', device),
  toggleDevicePower: (device, state) => ipcRenderer.invoke('toggle-device-power', device, state),
  setDeviceBrightness: (device, brightness) => ipcRenderer.invoke('set-device-brightness', device, brightness)
})

