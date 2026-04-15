# Velora SafeRoute

**Smart Urban Mobility - Choose the Safest Practical Route in Seconds**

Velora SafeRoute is a premium AI-powered web app that helps urban commuters select the safest route by combining real-time traffic, weather, and location-risk data with intelligent safety scoring.

## Features

### Core Features (MVP)
- **Smart Route Search**: Fetch multiple route alternatives using Google Maps Routes API
- **Safety Intelligence**: Score routes using a transparent 5-factor formula:
  - 35% Congestion severity
  - 25% Zone risk index
  - 15% Time-of-day risk
  - 15% Weather severity
  - 10% Route complexity
- **AI Explanations**: Gemini generates natural language explanations for route recommendations
- **Premium Dashboard**: Split-screen layout with search sidebar and interactive map
- **Voice Input**: Speak your origin and destination using Web Speech API
- **Route History**: Save searches to Firestore for future reference

### Premium Features
- **AR Walking Mode**: Live View-style directional guidance overlay (teaser)
- **Personalization**: Save frequent routes and preferences
- **Real-time Weather**: OpenWeatherMap integration for weather severity
- **Zone Risk Scoring**: Area-based safety hotspot data

## Tech Stack

### Frontend
- **Next.js 16** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS 4** - Utility-first styling
- **Framer Motion** - Smooth animations
- **Google Maps JavaScript API** - Map display and routing

### Backend & Data
- **Firebase** - Authentication and hosting
- **Firestore** - Real-time database for route history and hotspots
- **Google Maps Routes API** - Route computation and traffic data
- **Gemini API** - AI-powered explanations
- **OpenWeatherMap API** - Real-time weather data

### Design
- **Playfair Display** - Premium serif font for headings
- **Inter** - Clean sans-serif for body text
- **Glass-morphism** - Modern frosted glass UI elements
- **Gold accent** (#D4AF37) - Premium color scheme

## Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn
- API keys for:
  - Google Maps (Routes API + JavaScript API)
  - Gemini API
  - OpenWeatherMap API
  - Firebase project

### Installation

1. Clone the repository:
```bash
git clone <repo-url>
cd velora-saferoute
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables in `.env.local`:
```env
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_key_here
NEXT_PUBLIC_GEMINI_API_KEY=your_key_here
NEXT_PUBLIC_OPENWEATHER_API_KEY=your_key_here
NEXT_PUBLIC_FIREBASE_API_KEY=your_key_here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

4. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

## Project Structure

```
src/
├── app/
│   ├── layout.tsx          # Root layout with metadata
│   ├── page.tsx            # Home page
│   └── globals.css         # Global styles and theme
├── components/
│   ├── layout/
│   │   ├── DashboardContainer.tsx  # Main split-screen layout
│   │   ├── Sidebar.tsx             # Search and results panel
│   │   └── MapLayer.tsx            # Map display
│   └── ui/
│       ├── RouteCard.tsx           # Route result card
│       ├── SafetyGauge.tsx         # Circular safety score display
│       ├── VoiceInput.tsx          # Microphone input component
│       ├── ARTeaser.tsx            # AR walking mode preview
│       └── Icons.tsx               # SVG icon components
└── lib/
    ├── safety-engine.ts            # Safety scoring algorithm
    ├── ai-provider.ts              # Gemini API integration
    ├── routes-service.ts           # Google Maps Routes API
    ├── weather-service.ts          # OpenWeatherMap integration
    ├── zone-risk-service.ts        # Area risk evaluation
    ├── firebase.ts                 # Firebase configuration
    └── firestore-schema.ts         # Data model documentation
```

## Safety Scoring Formula

The safety score (0-100) is calculated as:

```
Safety Score = 
  (100 - congestion) × 0.35 +
  (100 - zone_risk) × 0.25 +
  time_of_day_score × 0.15 +
  (100 - weather_severity) × 0.15 +
  (100 - complexity) × 0.10
```

**Risk Levels:**
- **Low**: Score ≥ 85
- **Medium**: Score 60-84
- **High**: Score < 60

## Demo Flow

1. User enters origin and destination (or uses voice input)
2. App fetches 2-3 route alternatives from Google Maps
3. System evaluates weather, zone risk, and time-of-day factors
4. Routes are scored and ranked by safety
5. Gemini generates a natural explanation for the top route
6. User sees recommended route with safety score, ETA, and risk level
7. Alternate routes are displayed for comparison
8. Search is saved to Firestore for history

## API Integration

### Google Maps Routes API
- Fetches route alternatives with traffic data
- Provides distance, duration, and polyline encoding
- Returns traffic-aware routing

### Gemini API
- Generates natural language explanations
- Converts metrics into human-readable insights
- Keeps explanations under 25 words for clarity

### OpenWeatherMap API
- Provides real-time weather conditions
- Calculates weather severity (0-100)
- Includes visibility and precipitation data

### Firestore
- Stores route search history
- Maintains area hotspot data
- Supports user preferences (optional)

## Customization

### Styling
Edit `src/app/globals.css` to customize:
- Color scheme (accent, background, foreground)
- Font families (serif, sans-serif)
- Glass-morphism effects

### Safety Formula
Adjust weights in `src/lib/safety-engine.ts`:
```typescript
const congestionScore = (100 - congestionLevel) * 0.35; // Change 0.35
```

### Mock Data
For development without API keys, services return mock data automatically.

## Performance

- Route results appear in < 3 seconds (demo conditions)
- Voice input processes in real-time
- Map renders smoothly with CSS animations
- Optimized for mobile and desktop

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile browsers (iOS Safari, Chrome Mobile)

## Future Enhancements

- User authentication and personalization
- Saved favorite routes
- Route sharing
- Real-time incident alerts
- AR walking navigation
- Multi-modal routing (transit, bike, walk)
- Accessibility improvements

## License

Proprietary - Velora SafeRoute

## Support

For issues or questions, contact the development team.

---

**Built for the Hackathon** - Velora SafeRoute demonstrates how AI and real-time data can make urban mobility safer and smarter.
