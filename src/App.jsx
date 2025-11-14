import { MantineProvider, createTheme } from '@mantine/core'
import '@mantine/core/styles.css'
import { useLights } from './hooks/useLights'
import { Header } from './components/Header'
import { Scenes } from './components/Scenes'
import { Rooms } from './components/Rooms'
import { Footer } from './components/Footer'
import './styles/app.css'

const theme = createTheme({
  colorScheme: 'dark',
  primaryColor: 'blue',
  defaultRadius: 'md'
})

function App() {
  const { devices, loading, error, toggleDevicePower, setDeviceBrightness, getDevicePowerState, getDeviceBrightness, refreshAllStates } = useLights()
  
  const onlineCount = devices.filter(d => getDevicePowerState(d) === true).length
  const totalCount = devices.length

  return (
    <MantineProvider theme={theme}>
      <div className="app-container">
        <Header onlineCount={onlineCount} totalCount={totalCount} />
        <div className="app-content">
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
      </div>
    </MantineProvider>
  )
}

export default App
