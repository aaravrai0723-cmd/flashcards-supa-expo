# Flashcards Mobile App

A modern flashcards mobile application built with Expo Router and React Native, featuring AI-powered content generation, media processing, and comprehensive quiz functionality.

## 🚀 Quick Start

### Prerequisites
- **Node.js** 18+
- **Expo CLI**: `npm install -g @expo/cli`
- **iOS Simulator** (for iOS development)
- **Android Studio** (for Android development)

### Installation & Setup

1. **Install Dependencies**
   ```bash
   cd apps/mobile
   npm install
   ```

2. **Environment Configuration**
   Create `.env.local` in the project root:
   ```env
   EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   EXPO_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
   EXPO_PUBLIC_DEBUG=true
   ```

3. **Start Development Server**
   ```bash
   npm start
   ```

4. **Run on Platform**
   - Press `i` for iOS simulator
   - Press `a` for Android emulator
   - Press `w` for web browser
   - Scan QR code with Expo Go app

## 📱 App Walkthrough

### **Authentication Flow**
1. **Sign In Screen** (`/(auth)/sign-in.tsx`)
   - Email magic link authentication
   - OAuth providers (Google, Apple)
   - Automatic redirect to main app after sign-in

### **Main Navigation** (`/(tabs)/`)
- **Home Dashboard** (`index.tsx`)
  - Quick actions: Create Deck, Upload Media, Quick Quiz
  - Recent decks display
  - Job processing status
  - Real-time updates

- **Decks Management** (`decks.tsx`)
  - List user's flashcard decks
  - Deck details: title, visibility, card count
  - Create new deck functionality
  - Deck actions: view, share, edit

- **Media Upload** (`create.tsx`)
  - Upload images, videos, PDFs
  - File type validation and processing
  - Real-time job status tracking
  - AI-powered content generation

- **Quiz System** (`quiz.tsx`)
  - Select deck for quiz
  - Multiple question types: MCQ, True/False, Short Answer, Hotspot
  - Progress tracking and results
  - Performance analytics

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Mobile App (Expo Router)                 │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │   Screens   │  │ Components  │  │   Services  │         │
│  │             │  │             │  │             │         │
│  │ • Auth      │  │ • UI Kit    │  │ • Supabase  │         │
│  │ • Tabs      │  │ • Forms     │  │ • Storage   │         │
│  │ • Modals    │  │ • Media     │  │ • AI        │         │
│  │ • Quiz      │  │ • Charts    │  │ • Realtime  │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
└─────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────┐
│                  Supabase Backend                           │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │  Database   │  │   Storage   │  │  Functions  │         │
│  │             │  │             │  │             │         │
│  │ • Users     │  │ • Media     │  │ • Ingest    │         │
│  │ • Decks     │  │ • Derived   │  │ • Process   │         │
│  │ • Cards     │  │ • Ingest    │  │ • AI        │         │
│  │ • Quizzes   │  │             │  │             │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
└─────────────────────────────────────────────────────────────┘
```

## 📁 Project Structure

```
apps/mobile/
├── app/                     # Expo Router pages
│   ├── (auth)/             # Authentication screens
│   │   ├── _layout.tsx     # Auth layout
│   │   └── sign-in.tsx     # Sign in screen
│   ├── (tabs)/             # Tab navigation
│   │   ├── _layout.tsx     # Tab layout
│   │   ├── index.tsx      # Home dashboard
│   │   ├── decks.tsx      # Deck management
│   │   ├── create.tsx     # Media upload
│   │   └── quiz.tsx        # Quiz system
│   └── _layout.tsx         # Root layout
├── components/             # Reusable UI components
│   └── ui/                 # Base UI components
│       ├── Button.tsx      # Button component
│       ├── Input.tsx       # Input component
│       ├── Card.tsx        # Card component
│       └── Tag.tsx         # Tag component
├── hooks/                  # Custom React hooks
│   ├── useSupabase.ts     # Supabase client
│   ├── useAuth.ts         # Authentication
│   └── useRealtimeJobs.ts # Real-time job updates
├── utils/                  # Utility functions
│   ├── cn.ts              # Class name utility
│   └── media.ts           # Media handling
├── state/                  # State management
│   └── useAppStore.ts     # Zustand store
├── App.tsx                 # Main app component
├── global.css             # NativeWind styles
├── tailwind.config.js     # Tailwind configuration
├── babel.config.js        # Babel configuration
├── metro.config.js        # Metro configuration
├── app.config.js          # Expo configuration
└── package.json           # Dependencies
```

## 🎨 Key Features

### **Authentication & User Management**
- **Magic Link Authentication**: Secure email-based sign-in
- **OAuth Integration**: Google and Apple sign-in
- **Session Management**: Automatic token refresh
- **User Profile**: Basic user information display

### **Deck Management**
- **Deck Creation**: Create new flashcard decks
- **Deck Listing**: View all user decks with metadata
- **Deck Actions**: Edit, share, and delete decks
- **Visibility Control**: Public/private deck settings
- **Subject Tagging**: Organize decks by subjects

### **Smart Media Upload**
- **Multi-format Support**: Images, videos, PDFs
- **File Validation**: Type and size checking
- **Storage Integration**: Supabase storage upload
- **Job Queue**: Background processing with real-time updates
- **AI Processing**: Automatic content extraction

### **Interactive Quiz System**
- **Multiple Question Types**:
  - Multiple Choice Questions (MCQ)
  - True/False questions
  - Short answer questions
  - Hotspot questions (tap to answer)
- **Progress Tracking**: Real-time quiz progress
- **Results Analytics**: Performance metrics and insights
- **Adaptive Difficulty**: Smart question selection

### **Real-time Features**
- **Job Status Updates**: Live processing status
- **Deck Synchronization**: Real-time deck updates
- **Progress Tracking**: Live quiz progress
- **Notification System**: User feedback and alerts

## 🛠️ Development

### **Available Scripts**
```bash
# Development
npm start                 # Start Expo dev server
npm run ios              # Run on iOS simulator
npm run android          # Run on Android emulator
npm run web              # Run in web browser

# Building
npm run build:ios        # Build for iOS
npm run build:android    # Build for Android

# Code Quality
npm run lint             # Run ESLint
npm run typecheck        # Run TypeScript checks
```

### **Development Workflow**

1. **Start Development Server**
   ```bash
   npm start
   ```

2. **Choose Platform**
   - Press `i` for iOS simulator
   - Press `a` for Android emulator
   - Press `w` for web browser
   - Scan QR code with Expo Go app

3. **Hot Reloading**
   - Changes automatically reload
   - Fast refresh for React components
   - Metro bundler for JavaScript

### **Debugging**
```bash
# Enable debug mode
EXPO_PUBLIC_DEBUG=true npm start

# Clear cache
npx expo start --clear
```

## 🔧 Configuration

### **Environment Variables**
```env
# Required
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_anon_key

# Optional
EXPO_PUBLIC_DEBUG=true
EXPO_PUBLIC_API_URL=https://your-project.supabase.co/functions/v1
```

### **NativeWind Setup**
- **Tailwind CSS**: Utility-first styling
- **Dark Mode**: Automatic theme switching
- **Responsive Design**: Mobile-first approach
- **Custom Components**: Reusable UI components

### **TypeScript Configuration**
- **Path Mapping**: Clean import paths
- **Strict Mode**: Enhanced type safety
- **Expo Integration**: Optimized for Expo Router

## 📱 Platform Support

### **iOS**
- **Native Navigation**: iOS-style navigation patterns
- **Haptic Feedback**: Touch feedback for interactions
- **App Store**: Optimized for App Store submission
- **TestFlight**: Beta testing support

### **Android**
- **Material Design**: Android design guidelines
- **Back Button**: Proper back button handling
- **Google Play**: Optimized for Play Store
- **Internal Testing**: Beta distribution

### **Web**
- **Responsive Design**: Desktop and tablet support
- **PWA Features**: Progressive Web App capabilities
- **Keyboard Navigation**: Full keyboard support
- **SEO Optimization**: Search engine friendly

## 🧪 Testing

### **Testing Strategy**
- **Unit Tests**: Component and utility testing
- **Integration Tests**: Screen and flow testing
- **E2E Tests**: Full user journey testing
- **Accessibility Tests**: Screen reader and navigation testing

### **Testing Tools**
- **Jest**: Unit testing framework
- **React Native Testing Library**: Component testing
- **Detox**: E2E testing
- **MSW**: API mocking

## 📦 Dependencies

### **Core Dependencies**
- **Expo Router**: File-based routing
- **React Native**: Mobile framework
- **TypeScript**: Type safety
- **NativeWind**: Tailwind CSS for React Native
- **Zustand**: State management

### **UI Dependencies**
- **React Native Reanimated**: Animations
- **React Native Gesture Handler**: Gestures
- **React Native Vector Icons**: Icons
- **React Native Safe Area Context**: Safe area handling

### **Backend Integration**
- **Supabase**: Backend as a Service
- **Expo Document Picker**: File selection
- **Expo Image Picker**: Image selection
- **Expo Web Browser**: OAuth handling

## 🚀 Building & Deployment

### **Development Build**
```bash
# Create development build
npx expo build:ios --type development
npx expo build:android --type development
```

### **Production Build**
```bash
# Create production build
npx expo build:ios --type production
npx expo build:android --type production
```

### **App Store Deployment**
```bash
# iOS App Store
npx expo upload:ios

# Google Play Store
npx expo upload:android
```

## 🔒 Security & Privacy

### **Data Protection**
- **Encrypted Storage**: Secure local data storage
- **API Security**: Secure API communication
- **Authentication**: Secure user authentication
- **Data Privacy**: GDPR compliance

### **Accessibility**
- **Screen Reader**: VoiceOver and TalkBack support
- **Alt Text**: Image descriptions for accessibility
- **Captions**: Video caption support
- **Navigation**: Keyboard and voice navigation

## 📊 Performance

### **Optimization Strategies**
- **Image Optimization**: Automatic image compression
- **Lazy Loading**: Progressive content loading
- **Memory Management**: Efficient memory usage
- **Bundle Optimization**: Minimal bundle size

### **Monitoring**
- **Crash Reporting**: Error tracking and reporting
- **Performance Monitoring**: App performance metrics
- **User Analytics**: Usage analytics and insights
- **Error Tracking**: Comprehensive error logging

## 🤝 Contributing

### **Development Setup**
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request

### **Code Standards**
- **TypeScript**: Strict type checking
- **ESLint**: Code quality enforcement
- **Prettier**: Code formatting
- **Conventional Commits**: Standardized commit messages

## 📚 Resources

- [Expo Router Documentation](https://docs.expo.dev/router/introduction/)
- [React Native Documentation](https://reactnative.dev/)
- [Supabase Documentation](https://supabase.com/docs)
- [NativeWind Documentation](https://www.nativewind.dev/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

## 🆘 Troubleshooting

### **Common Issues**

1. **Metro bundler issues**: Clear cache with `npx expo start --clear`
2. **iOS build failures**: Check Xcode and iOS simulator setup
3. **Android build failures**: Verify Android Studio and SDK setup
4. **Dependency conflicts**: Use `npm ls` to check for conflicts
5. **NativeWind issues**: Check babel and metro configuration

### **Getting Help**
- Check the [Expo troubleshooting guide](https://docs.expo.dev/troubleshooting/)
- Review GitHub issues
- Join the Expo Discord community
- Check the React Native documentation

---

**Built with ❤️ using Expo Router, React Native, and TypeScript**