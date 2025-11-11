# NavGreen

NavGreen is a web app designed to help drivers reduce their carbon footprint by choosing the most fuel-efficient routes. The app compares your usual driving route with a greener alternative and awards points based on the CO₂ emissions saved, fostering sustainable driving habits through gamification and community leaderboards.

---

## Features

- **Route Comparison:** Compare your normal fastest route with an eco-friendly optimized route side-by-side.
- **CO₂ Emission Calculator:** Calculates emissions saved based on distance and vehicle type.
- **Points & Leaderboards:** Earn points for CO₂ saved and see your rank on the leaderboard.
- **User Dashboard:** Track your total impact, recent trips, and ranking.
- **Responsive UI:** Built with React Native (Expo Go) and Tailwind CSS for fast, modern user experience.
- **Scalable Backend:** Serverless backend using Firebase Functions and Firestore with secure Firebase Authentication.

---

## Getting Started

### Prerequisites

- Node.js (version 18 or higher recommended)
- Firebase account with Firestore and Functions enabled
- Mapbox account for API keys

### Installation

1. Clone the repository

git clone https://github.com/Armaan-Dip-Singh-Maan/HackTheChange
cd navgreen

text

2. Install dependencies

npm install

text

3. Create a `.env` file in the root and add your environment variables

NEXT_PUBLIC_MAPBOX_API_KEY=your_mapbox_api_key
FIREBASE_API_KEY=your_firebase_api_key
FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain
FIREBASE_PROJECT_ID=your_firebase_project_id
FIREBASE_STORAGE_BUCKET=your_firebase_storage_bucket
FIREBASE_MESSAGING_SENDER_ID=your_firebase_messaging_sender_id
FIREBASE_APP_ID=your_firebase_app_id

text

### Running Locally

npm run start

text

Open [http://localhost:19006](http://localhost:19006) in your browser or use Expo Go on your mobile device.

---

## Deployment

The frontend is deployed on Vercel (if using web) and the backend uses Firebase Functions. For production deployment:

- Push your code to GitHub
- Connect the repo to your chosen hosting (Vercel for web, Expo for mobile)
- Deploy Firebase functions with:

firebase deploy --only functions,firestore

text

---

## Project Structure

/app - React Native Expo app
/backend - Firebase Functions backend and Firestore rules
/components - Reusable UI components (maps, forms, leaderboard)
/utils - Helper logic (CO2 calculator, Mapbox API wrapper)

text

---

## Team

- Eknor Singh - Full-stack developer  
- Luqman Ajani - Frontend developer  
- Yasir - Product developer & Full-stack developer 
- Armaan - AI/ML intern & freelancer  

---

## Future Improvements

- Real-time GPS tracking for automatic route logging  
- Personalized AI route recommendations  
- Native mobile apps for iOS and Android  
- Deeper gamification with community challenges  
- Integration with ride-sharing and city transit systems  

---

## License

This project is licensed under the MIT License.
This README now reflects NavGreen and your specific tech stack (React Native, Expo Go, Firebase Auth). Would you like me to assist with other project docs or deployment guides?
