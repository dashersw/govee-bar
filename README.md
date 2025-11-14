# govee-bar
A menu bar app for managing Govee lights and devices

## Setup

### Getting API Key

1. Go to [Govee Developer Platform](https://developer.govee.com/)
2. Sign in or create an account
3. Create a new API key from the dashboard
4. Copy your API key

### Setting Environment Variables

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Open `.env` file and replace `your_api_key_here` with your actual API key:
   ```
   GOVEE_API_KEY=your_actual_api_key_here
   ```

### Installing Dependencies

```bash
npm install
```

### Running the Application

```bash
npm run electron:dev
```
