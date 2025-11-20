# govee-bar
A menu bar app for managing Govee lights and devices

## Setup

### Getting API Key

1. Go to [Govee Developer Platform](https://developer.govee.com/)
2. Sign in or create an account
3. Create a new API key from the dashboard
4. Copy your API key

### Installing Dependencies

```bash
npm install
```

### Running the Application

```bash
npm run electron:dev
```

### Setting API Key

1. When you first launch the app, click the settings icon (⚙️) in the header
2. Enter your API key in the settings modal
3. Click "Save" to store your API key securely
4. The app will automatically reload and start fetching your devices

Your API key is stored securely in your system's credential storage (Keychain on macOS, Credential Manager on Windows).
