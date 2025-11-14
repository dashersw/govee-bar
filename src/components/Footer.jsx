import { Group, Button, Text } from '@mantine/core'

export function Footer({ onRefresh }) {
  return (
    <div className="app-footer">
      <Group justify="space-between" wrap="nowrap">
        <Button
          variant="subtle"
          color="gray"
          size="xs"
          leftSection={<span className="material-symbols-outlined" style={{ fontSize: '16px' }}>refresh</span>}
          onClick={onRefresh}
          styles={{ root: { color: 'rgba(255, 255, 255, 0.6)' } }}
        >
          Refresh
        </Button>
        <Text
          size="xs"
          c="blue"
          style={{ cursor: 'pointer', textDecoration: 'underline' }}
          onClick={() => {
            // Handle open full app
            console.log('Open full app')
          }}
        >
          Open Full App
        </Text>
      </Group>
    </div>
  )
}

