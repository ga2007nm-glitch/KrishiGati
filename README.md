# KrishiGati

KrishiGati is a smart agricultural procurement platform for Smart India Hackathon 2026. It helps farmers find nearby procurement centers, predict waiting time, book digital slots, track weighing and DBT payment, and receive SMS notifications.

## Features

- Farmer and procurement staff login modes
- Aadhaar/PAN farmer registration and procurement employee ID access
- GPS-based nearest mandi discovery
- India-wide mandi catalog with country, state, and city filters
- Leaflet map with 2 km geofence visualization
- Predictive mandi recommendation using distance, capacity, queue pressure, and quantity
- Crop rate board for grains, pulses, oilseeds, vegetables, and fruits
- Dynamic MSP payout estimate
- Slot booking and fair daily booking limits
- Live Socket.io queue board for procurement staff
- Shop-measured net weight and DBT payment ledger
- SMS/IVR fallback demos
- Optional real SMS delivery through Twilio
- Offline booking queue with reconnect synchronization
- Multilingual login labels and voice controls

## Stack

- React + Vite + TypeScript
- Tailwind CSS and custom responsive CSS
- Leaflet and React Leaflet
- Framer Motion
- Express and Socket.io
- Prisma ORM
- MongoDB replica set for local development

## Requirements

- Node.js 20 or newer
- MongoDB 8 or newer
- PowerShell on Windows

## Configuration

The project uses a local MongoDB replica instance on port `27018` because Prisma requires replica-set mode for MongoDB writes.

The project `.env` should contain:

```env
DATABASE_URL="mongodb://127.0.0.1:27018/krishigati?replicaSet=rs0"
VITE_API_URL="http://localhost:5000"
```

For real SMS delivery, add Twilio values. Without them, the app returns a clearly labeled simulated SMS response:

```env
TWILIO_ACCOUNT_SID="your_account_sid"
TWILIO_AUTH_TOKEN="your_auth_token"
TWILIO_FROM_NUMBER="+1XXXXXXXXXX"
```

Never commit `.env` or real credentials.

## First-Time Setup

Install dependencies:

```powershell
npm install
```

Start the local MongoDB replica instance if it is not already running:

```powershell
New-Item -ItemType Directory -Force .mongodb-data
Start-Process -FilePath 'C:\Program Files\MongoDB\Server\8.3\bin\mongod.exe' -ArgumentList '--dbpath', '.mongodb-data', '--port', '27018', '--bind_ip', '127.0.0.1', '--replSet', 'rs0', '--logpath', '.mongodb-data\mongod.log' -WindowStyle Hidden
```

Initialize the replica set once:

```powershell
npm run mongodb:init-replica
```

Create collections and indexes:

```powershell
npm run prisma:push
```

Seed the demo farmer and nationwide mandi catalog:

```powershell
npm run prisma:seed
```

## Run the App

Start the frontend and backend together:

```powershell
npm run dev
```

Open the application:

- Frontend: http://localhost:5173
- Backend health: http://localhost:5000/api/health

To stop the development servers, press `Ctrl+C` in the running terminal.

## Demo Login

The first screen provides two role tabs.

### Farmer

Requires:

- Full name
- 10-digit mobile number
- 12-digit Aadhaar number
- PAN number

### Procurement Staff

Requires:

- Full name
- 10-digit mobile number
- Procurement employee ID

If the app opens directly to an existing dashboard, click **Switch account** to return to the role selection screen.

## Main Demo Flow

1. Register as a farmer.
2. Allow browser location access, or choose India, state, and city manually.
3. Enter crop quantity in the predictive route panel.
4. Select a recommended mandi or browse the filtered centers.
5. Book a slot and receive a digital token.
6. View crop MSP and estimated payout.
7. Procurement staff can monitor the live queue.
8. Update weighing and payout through the backend APIs.
9. The farmer receipt updates with measured net weight, DBT amount, transaction reference, and SMS status.

## Important API Routes

```text
GET  /api/health
GET  /api/crops/prices
GET  /api/mandis/nearest?lat=...&lng=...
GET  /api/mandis/all?state=...&city=...
GET  /api/mandis/recommend?lat=...&lng=...&quantityKg=...
POST /api/farmers/register
POST /api/tokens/book
POST /api/tokens/:tokenId/activate
GET  /api/tokens/:tokenId
POST /api/procurement/grade
POST /api/procurement/weigh
POST /api/procurement/payout
POST /api/low-tech/sms
POST /api/low-tech/ivr
```

## Validation Commands

```powershell
npx prisma validate --schema=prisma.schema
npm run prisma:generate
npm run build
node --check backend/server.js
```

## Data Location

For the local replica instance, MongoDB data is stored in:

```text
.mongodb-data/
```

The database name is `krishigati`. MongoDB Compass can connect with:

```text
mongodb://127.0.0.1:27018/?replicaSet=rs0
```

Collections include `User`, `MandiCenter`, `Token`, `CropGrade`, and `PayoutTransaction`.
