import { Switch, Group, Text } from '@mantine/core'
import { useState } from 'react'

export function LightItem({ device, isOn, onToggle, loading }) {
  const [toggling, setToggling] = useState(false)

  const handleToggle = async (checked) => {
    if (toggling) return
    setToggling(true)
    try {
      await onToggle(device, checked)
    } catch (error) {
      console.error('Toggle failed:', error)
    } finally {
      setToggling(false)
    }
  }

  return (
    <Group justify="space-between" wrap="nowrap" style={{ padding: '12px 16px' }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <Text size="sm" fw={500} c="white" truncate>
          {device.deviceName || device.device}
        </Text>
        <Text size="xs" c="dimmed" style={{ opacity: 0.7 }}>
          {isOn === null ? 'Unknown' : isOn ? 'On' : 'Off'}
        </Text>
      </div>
      <Switch
        checked={isOn === true}
        onChange={(event) => {
          const checked = event.currentTarget?.checked ?? !isOn
          handleToggle(checked)
        }}
        disabled={isOn === null || toggling || loading}
        size="md"
        color="blue"
      />
    </Group>
  )
}

