import { Group, Text, ActionIcon } from '@mantine/core'

export function Header({ onlineCount, totalCount, onSettingsClick }) {
  return (
    <div className="app-header">
      <Group justify="space-between" wrap="nowrap" style={{ width: '100%' }}>
        <Group gap={8}>
          <div className="logo-circle">
            <span className="logo-text">G</span>
          </div>
          <Text size="sm" fw={700} style={{ color: 'var(--text-color)' }}>
            Govee Bar
          </Text>
        </Group>
        <Group gap={16} style={{ flexShrink: 0 }}>
          <ActionIcon
            variant="subtle"
            color="gray"
            size="lg"
            onClick={onSettingsClick}
            style={{
              color: 'var(--text-secondary)',
              background: 'transparent',
              WebkitAppRegion: 'no-drag'
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>
              settings
            </span>
          </ActionIcon>
        </Group>
      </Group>
    </div>
  )
}
