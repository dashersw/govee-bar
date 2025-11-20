import { useEffect } from 'react'
import { Modal, TextInput, Button, Text, Group, Alert, ActionIcon } from '@mantine/core'
import '@mantine/core/styles.css'
import { useApiKey } from '../hooks/useApiKey'

export function Settings({ opened, onClose }) {
  const {
    apiKey,
    setApiKey,
    originalApiKey,
    showApiKey,
    status,
    loadApiKey,
    saveApiKey,
    toggleVisibility,
    reset,
    maskApiKey
  } = useApiKey()

  useEffect(() => {
    if (opened) {
      loadApiKey()
    } else {
      reset()
    }
  }, [opened, loadApiKey, reset])

  useEffect(() => {
    if (status.state === 'success') {
      const timer = setTimeout(() => {
        onClose()
        // Reload window to apply new API key
        window.location.reload()
      }, 1000)
      return () => clearTimeout(timer)
    }
  }, [status.state, onClose])

  const handleSave = async () => {
    await saveApiKey()
  }

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title="Settings"
      size="md"
      centered
      closeOnClickOutside={true}
      closeOnEscape={true}
      withCloseButton={true}
      overlayProps={{
        backgroundOpacity: 0.6,
        blur: 6
      }}
      styles={{
        root: {
          zIndex: 10000
        },
        overlay: {
          backgroundColor: 'rgba(0, 0, 0, 0.6)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 1
        },
        content: {
          background: 'var(--bg-color)',
          border: '1px solid var(--border-color)',
          borderRadius: '12px',
          boxShadow: '0 4px 16px var(--shadow-color)'
        },
        header: {
          background: 'var(--bg-color)',
          borderBottom: '1px solid var(--border-subtle)',
          padding: '16px'
        },
        body: {
          background: 'var(--bg-color)',
          padding: '16px'
        },
        title: {
          color: 'var(--text-color)',
          fontWeight: 600
        },
        close: {
          color: 'var(--text-secondary)'
        }
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div>
          <Text size="sm" fw={600} style={{ color: 'var(--text-color)', marginBottom: '8px' }}>
            Govee API Key
          </Text>
          <Text size="xs" style={{ color: 'var(--text-secondary)', marginBottom: '12px' }}>
            Get your API key from the{' '}
            <a
              href="https://developer.govee.com/"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: 'var(--primary-color)', textDecoration: 'underline' }}
            >
              Govee Developer Platform
            </a>
            .
          </Text>
          <TextInput
            placeholder="Enter your API key"
            value={apiKey}
            onChange={e => setApiKey(e.target.value)}
            type={showApiKey && !apiKey.includes('*') ? 'text' : 'password'}
            rightSection={
              <ActionIcon variant="subtle" onClick={toggleVisibility} style={{ color: 'var(--text-secondary)' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>
                  {showApiKey && !apiKey.includes('*') ? 'visibility_off' : 'visibility'}
                </span>
              </ActionIcon>
            }
            description={
              apiKey && apiKey.includes('*') && originalApiKey
                ? 'Current API key is shown. Delete it and enter a new key to update.'
                : ''
            }
            styles={{
              input: {
                background: 'var(--bg-subtle)',
                borderColor: 'var(--border-subtle)',
                color: 'var(--text-color)',
                paddingRight: '40px'
              },
              label: { color: 'var(--text-color)' },
              description: { color: 'var(--text-secondary)', fontSize: '12px', marginTop: '4px' }
            }}
          />
        </div>

        {status.state === 'error' && status.message && (
          <Alert
            color="red"
            styles={{ root: { background: 'var(--bg-subtle)' }, message: { color: 'var(--text-color)' } }}
          >
            {status.message}
          </Alert>
        )}

        {status.state === 'success' && (
          <Alert
            color="green"
            styles={{ root: { background: 'var(--bg-subtle)' }, message: { color: 'var(--text-color)' } }}
          >
            API key saved successfully!
          </Alert>
        )}

        <Group justify="flex-end" mt="md">
          <Button
            variant="subtle"
            onClick={onClose}
            styles={{
              root: {
                color: 'var(--text-secondary)',
                background: 'transparent',
                border: 'none'
              },
              rootHover: {
                background: 'var(--bg-subtle)',
                color: 'var(--text-color)'
              }
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            loading={status.state === 'loading'}
            styles={{
              root: {
                background: 'var(--primary-color)',
                color: 'white',
                border: 'none'
              },
              rootHover: {
                background: 'var(--primary-color)',
                opacity: 0.9
              }
            }}
          >
            Save
          </Button>
        </Group>
      </div>
    </Modal>
  )
}
