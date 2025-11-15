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
  const { devices, loading, error, toggleDevicePower, setDeviceBrightness, getDevicePowerState, getDeviceBrightness, refreshAllStates } = useLights()
  
  const onlineCount = devices.filter(d => getDevicePowerState(d) === true).length
  const totalCount = devices.length

  useEffect(() => {
    // Check if API key exists
    window.electronAPI.getApiKey().then(key => {
      setHasApiKey(!!key)
    }).catch(() => {
      setHasApiKey(false)
    })
  }, [])

  return (
    <MantineProvider theme={theme}>
      <div className="app-container">
        <Header 
          onlineCount={onlineCount} 
          totalCount={totalCount} 
          onSettingsClick={() => setSettingsOpened(true)}
        />
        <div className="app-content">
          {!hasApiKey && (
            <Alert 
              color="orange" 
              title="API Key Required"
              styles={{ 
                root: { 
                  margin: '16px',
                  background: 'var(--bg-subtle)',
                  borderColor: 'var(--border-subtle)'
                },
                title: { color: 'var(--text-color)' },
                message: { color: 'var(--text-secondary)' }
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
              toggleDevicePower={toggleDevicePower}
              setDeviceBrightness={setDeviceBrightness}
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
