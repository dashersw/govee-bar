# govee-bar

A beautiful menu bar application for managing your Govee smart lights and devices on macOS and Windows. Control your lights, organize them by rooms, and create scenes—all from a convenient menu bar interface.

## Features

- **Device Management**: Power on/off, adjust brightness, and control color settings for all your Govee devices
- **Room Organization**: Organize devices into custom rooms with intuitive drag-and-drop
- **Color Control**: Full RGB color picker and color temperature (Kelvin) adjustment
- **Scenes**: Quick access to preset lighting scenes (Morning, Movie, Focus, Night)
- **Secure Storage**: API keys stored securely using system credential storage (Keychain on macOS, Credential Manager on Windows)
- **Theme Support**: Dark and light themes that adapt to your system preferences
- **Real-time Updates**: Live device state synchronization with your Govee account

## Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- A Govee Developer API key ([Get one here](https://developer.govee.com/))

## Installation

### 1. Clone the Repository

```bash
git clone https://github.com/dashersw/govee-bar.git
cd govee-bar
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Get Your API Key

1. Visit the [Govee Developer Platform](https://developer.govee.com/)
2. Sign in or create an account
3. Navigate to the dashboard and create a new API key
4. Copy your API key (you'll need it in the next step)

### 4. Run the Application

```bash
npm run electron:dev
```

### 5. Configure Your API Key

1. When the app launches, click the settings icon (⚙️) in the header
2. Enter your Govee API key in the settings modal
3. Click "Save" to store your API key securely
4. The app will automatically reload and start fetching your devices

**Note**: Your API key is stored securely in your system's credential storage:

- **macOS**: Keychain
- **Windows**: Credential Manager

## Usage

### Managing Devices

- **Toggle Power**: Click the power switch next to any device to turn it on or off
- **Adjust Brightness**: Use the brightness slider to control light intensity (0-100%)
- **Change Color**: Click the color circle to open the color picker and select any RGB color
- **Color Temperature**: Adjust the color temperature slider for warm to cool white light

### Organizing Rooms

- **Create Rooms**: Add custom rooms to organize your devices
- **Assign Devices**: Drag devices between rooms or assign them to rooms using the device menu
- **Room Icons**: Choose from a variety of room icons (living room, bedroom, kitchen, etc.)

### Scenes

Access quick lighting presets from the Scenes section:

- **Morning**: Bright, energizing light
- **Movie**: Dimmed, ambient lighting
- **Focus**: Optimized for productivity
- **Night**: Warm, relaxing light

## Development

### Available Scripts

- `npm run dev` - Start the Vite development server
- `npm run electron:dev` - Run Electron app in development mode
- `npm run build` - Build the application for production
- `npm run preview` - Preview the production build
- `npm run electron` - Run Electron app (requires built assets)
- `npm test` - Run API tests

## Building for Production

To build a distributable application:

```bash
npm run build
npm run electron
```

The built application will be available in the `dist` directory.

## Troubleshooting

### Devices Not Loading

- Verify your API key is correct in Settings
- Check your internet connection
- Ensure your Govee devices are online and connected to your account
- Review the browser console (View > Toggle Developer Tools) for error messages

### API Key Issues

- If you're having trouble saving your API key, ensure you have proper permissions for system credential storage
- On macOS, you may need to grant Keychain access permissions
- Try removing and re-adding your API key in Settings

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the ISC License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Built with [Electron](https://www.electronjs.org/)
- UI components powered by [Mantine](https://mantine.dev/)
- Uses the [Govee Developer API](https://developer.govee.com/)

## Support

For issues, questions, or feature requests, please open an issue on [GitHub](https://github.com/dashersw/govee-bar/issues).
