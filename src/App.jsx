import { useState, useEffect } from 'react'
import { MantineProvider, createTheme, Alert } from '@mantine/core'
import '@mantine/core/styles.css'
import { useLights } from './hooks/useLights'
import { Header } from './components/Header'
import { Scenes } from './components/Scenes'
import { Rooms } from './components/Rooms'
import { Footer } from './components/Footer'
import { Settings } from './components/Settings'
import './styles/app.css'

const theme = createTheme({
  colorScheme: 'dark',
  primaryColor: 'blue',
  defaultRadius: 'md'
})

function App() {
  const [settingsOpened, setSettingsOpened] = useState(false)
  const [hasApiKey, setHasApiKey] = useState(true)
  const [debugMode, setDebugMode] = useState(false)
  const { devices, loading, error, toggleDevicePower, setDeviceBrightness, setDeviceColorRgb, setDeviceColorTemperatureK, getDevicePowerState, getDeviceBrightness, getDeviceColorRgb, getDeviceColorTemperatureK, refreshAllStates } = useLights()
  
  const onlineCount = devices.filter(d => getDevicePowerState(d) === true).length
  const totalCount = devices.length

  const handleDebugModeChange = async (enabled) => {
    setDebugMode(enabled)
    document.documentElement.setAttribute('data-debug-mode', enabled.toString())
    if (window.electronAPI?.setDebugMode) {
      await window.electronAPI.setDebugMode(enabled)
    }
  }

  useEffect(() => {
    // Check if API key exists
    window.electronAPI.getApiKey().then(key => {
      setHasApiKey(!!key)
    }).catch(() => {
      setHasApiKey(false)
    })
  }, [])

  useEffect(() => {
    // Set initial theme
    window.electronAPI.getTheme().then(theme => {
      document.documentElement.setAttribute('data-theme', theme)
    }).catch(() => {
      // Default to dark if theme can't be retrieved
      document.documentElement.setAttribute('data-theme', 'dark')
    })

    // Set initial debug mode state
    document.documentElement.setAttribute('data-debug-mode', 'false')

    // Listen for theme changes
    const unsubscribe = window.electronAPI.onThemeChange((theme) => {
      document.documentElement.setAttribute('data-theme', theme)
    })

    return () => {
      if (unsubscribe) {
        unsubscribe()
      }
    }
  }, [])

  return (
    <MantineProvider theme={theme}>
      <div className="app-container">
        <Header 
          onlineCount={onlineCount} 
          totalCount={totalCount} 
          onSettingsClick={() => setSettingsOpened(true)}
          debugMode={debugMode}
          onDebugModeChange={handleDebugModeChange}
        />
        <div className="app-content">
          {!hasApiKey && (
            <Alert 
              color="orange" 
              title="API Key Required"
              styles={{ 
                root: { 
                  margin: '16px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  borderColor: 'rgba(255, 255, 255, 0.1)'
                },
                title: { color: 'white' },
                message: { color: 'rgba(255, 255, 255, 0.6)' }
              }}
            >
              Please enter your API key in settings. Devices cannot be loaded without an API key.
            </Alert>
          )}
          <div className="content-wrapper">
            <Scenes />
            <Rooms
              devices={devices}
              getDevicePowerState={getDevicePowerState}
              getDeviceBrightness={getDeviceBrightness}
              getDeviceColorRgb={getDeviceColorRgb}
              getDeviceColorTemperatureK={getDeviceColorTemperatureK}
              toggleDevicePower={toggleDevicePower}
              setDeviceBrightness={setDeviceBrightness}
              setDeviceColorRgb={setDeviceColorRgb}
              setDeviceColorTemperatureK={setDeviceColorTemperatureK}
              loading={loading}
              error={error}
            />
          </div>
        </div>
        <Footer onRefresh={refreshAllStates} />
        <Settings 
          opened={settingsOpened} 
          onClose={() => setSettingsOpened(false)}
        />
      </div>
    </MantineProvider>
  )
}

export default App
