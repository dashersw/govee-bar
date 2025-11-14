import { Text, Loader, Center } from '@mantine/core'
import { RoomSection } from './RoomSection'

export function Rooms({ devices, getDevicePowerState, getDeviceBrightness, toggleDevicePower, setDeviceBrightness, loading, error }) {
  if (loading && devices.length === 0) {
    return (
      <Center style={{ padding: '40px' }}>
        <Loader size="md" color="blue" />
      </Center>
    )
  }

  if (error) {
    return (
      <Center style={{ padding: '40px' }}>
        <Text size="sm" c="red">{error}</Text>
      </Center>
    )
  }

  if (devices.length === 0) {
    return (
      <Center style={{ padding: '40px' }}>
        <Text size="sm" c="dimmed">No devices found</Text>
      </Center>
    )
  }

  // Group devices by room (for now, we'll use a simple grouping)
  // In a real app, you'd have room information from the API
  const rooms = {
    'Living Room': devices.slice(0, Math.ceil(devices.length / 2)),
    'Bedroom': devices.slice(Math.ceil(devices.length / 2))
  }

  return (
    <div className="rooms-section">
      <h3 className="section-title">Rooms</h3>
      <div className="rooms-list">
        {Object.entries(rooms).map(([roomName, roomDevices]) => (
          <RoomSection
            key={roomName}
            roomName={roomName}
            devices={roomDevices}
            getDevicePowerState={getDevicePowerState}
            getDeviceBrightness={getDeviceBrightness}
            toggleDevicePower={toggleDevicePower}
            setDeviceBrightness={setDeviceBrightness}
            loading={loading}
          />
        ))}
      </div>
    </div>
  )
}

