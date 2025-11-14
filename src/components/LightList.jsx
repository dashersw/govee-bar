import { Stack, Text, Loader, Center } from '@mantine/core'
import { LightItem } from './LightItem'

export function LightList({ devices, getDevicePowerState, toggleDevicePower, loading, error }) {
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
        <Text size="sm" c="dimmed">No lights found</Text>
      </Center>
    )
  }

  return (
    <Stack gap={0} style={{ padding: '8px 0' }}>
      {devices.map((device) => {
        const isOn = getDevicePowerState(device)
        return (
          <LightItem
            key={device.device}
            device={device}
            isOn={isOn}
            onToggle={toggleDevicePower}
            loading={loading}
          />
        )
      })}
    </Stack>
  )
}

