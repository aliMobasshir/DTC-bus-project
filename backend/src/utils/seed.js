/**
 * DTC MVP Seed Script
 * Run: npm run seed
 * Seeds: 8 depots, 25 buses, 20 drivers, 15 routes, 1 admin user
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Bus = require('../models/Bus');
const Driver = require('../models/Driver');
const Route = require('../models/Route');
const { Depot, User, Schedule, Incident } = require('../models/index');
const { hashPassword } = require('../middleware/auth');

const DELHI_DEPOTS = [
  { depotId: 'D01', name: 'Kashmere Gate Depot',  location: 'Kashmere Gate, Delhi',  lat: 28.6676, lng: 77.2284, capacity: 120, incharge: 'Ram Prasad' },
  { depotId: 'D09', name: 'Rohini Depot',          location: 'Rohini Sector 5',        lat: 28.7357, lng: 77.0835, capacity: 100, incharge: 'Suresh Kumar' },
  { depotId: 'D12', name: 'Dwarka Depot',          location: 'Dwarka Sector 10',       lat: 28.5823, lng: 77.0423, capacity: 90,  incharge: 'Mohan Lal' },
  { depotId: 'D18', name: 'Sarai Kale Khan Depot', location: 'Sarai Kale Khan',        lat: 28.5896, lng: 77.2549, capacity: 80,  incharge: 'Anil Sharma' },
  { depotId: 'D24', name: 'Vasant Vihar Depot',    location: 'Vasant Vihar',           lat: 28.5621, lng: 77.1577, capacity: 75,  incharge: 'Priya Singh' },
  { depotId: 'D31', name: 'Shahdara Depot',        location: 'Shahdara',               lat: 28.6742, lng: 77.2893, capacity: 85,  incharge: 'Deepak Verma' },
  { depotId: 'D36', name: 'Narela Depot',          location: 'Narela Industrial Area', lat: 28.8524, lng: 77.0915, capacity: 70,  incharge: 'Vikram Yadav' },
  { depotId: 'D37', name: 'Noida Link Depot',      location: 'Noida Sector 18',        lat: 28.5706, lng: 77.3219, capacity: 60,  incharge: 'Rajesh Gupta' },
];

// Real DTC routes with actual stop coordinates
const ROUTE_TEMPLATES = [
  {
    routeNo: '423', name: 'Kashmere Gate - Lajpat Nagar',
    startStop: 'Kashmere Gate ISBT', endStop: 'Lajpat Nagar Metro',
    depotIdx: 0, totalDistance: 14.2, avgDuration: 65, frequency: 15, priority: 5, dailyPassengers: 4200,
    stops: [
      { name: 'Kashmere Gate ISBT', lat: 28.6676, lng: 77.2284, sequence: 1, estimatedMinutes: 0 },
      { name: 'Delhi Gate',          lat: 28.6440, lng: 77.2406, sequence: 2, estimatedMinutes: 12 },
      { name: 'Turkman Gate',        lat: 28.6388, lng: 77.2239, sequence: 3, estimatedMinutes: 20 },
      { name: 'Connaught Place',     lat: 28.6315, lng: 77.2167, sequence: 4, estimatedMinutes: 30 },
      { name: 'Mandi House',         lat: 28.6255, lng: 77.2351, sequence: 5, estimatedMinutes: 40 },
      { name: 'INA Colony',          lat: 28.5786, lng: 77.2079, sequence: 6, estimatedMinutes: 52 },
      { name: 'Lajpat Nagar Metro',  lat: 28.5695, lng: 77.2437, sequence: 7, estimatedMinutes: 65 },
    ]
  },
  {
    routeNo: '181', name: 'Anand Vihar - Dwarka Sector 21',
    startStop: 'Anand Vihar ISBT', endStop: 'Dwarka Sector 21',
    depotIdx: 2, totalDistance: 28.7, avgDuration: 95, frequency: 20, priority: 4, dailyPassengers: 3800,
    stops: [
      { name: 'Anand Vihar ISBT',    lat: 28.6462, lng: 77.3157, sequence: 1, estimatedMinutes: 0 },
      { name: 'Kaushambi',           lat: 28.6439, lng: 77.3020, sequence: 2, estimatedMinutes: 10 },
      { name: 'Nirman Vihar',        lat: 28.6469, lng: 77.2831, sequence: 3, estimatedMinutes: 22 },
      { name: 'Preet Vihar',         lat: 28.6426, lng: 77.2960, sequence: 4, estimatedMinutes: 30 },
      { name: 'Laxmi Nagar',         lat: 28.6342, lng: 77.2763, sequence: 5, estimatedMinutes: 40 },
      { name: 'Connaught Place',     lat: 28.6315, lng: 77.2167, sequence: 6, estimatedMinutes: 55 },
      { name: 'Dhaula Kuan',         lat: 28.5957, lng: 77.1618, sequence: 7, estimatedMinutes: 70 },
      { name: 'Dwarka Mor',          lat: 28.6129, lng: 77.0590, sequence: 8, estimatedMinutes: 82 },
      { name: 'Dwarka Sector 21',    lat: 28.5530, lng: 77.0587, sequence: 9, estimatedMinutes: 95 },
    ]
  },
  {
    routeNo: '56', name: 'Rohini - Connaught Place',
    startStop: 'Rohini Sector 3', endStop: 'Connaught Place',
    depotIdx: 1, totalDistance: 18.5, avgDuration: 60, frequency: 12, priority: 5, dailyPassengers: 5100,
    stops: [
      { name: 'Rohini Sector 3',     lat: 28.7340, lng: 77.0800, sequence: 1, estimatedMinutes: 0 },
      { name: 'Rohini West Metro',   lat: 28.7226, lng: 77.0620, sequence: 2, estimatedMinutes: 8 },
      { name: 'Pitampura',           lat: 28.7040, lng: 77.1268, sequence: 3, estimatedMinutes: 18 },
      { name: 'Netaji Subhash Place', lat: 28.6944, lng: 77.1382, sequence: 4, estimatedMinutes: 28 },
      { name: 'Azadpur',             lat: 28.7094, lng: 77.1782, sequence: 5, estimatedMinutes: 36 },
      { name: 'Model Town',          lat: 28.7064, lng: 77.1920, sequence: 6, estimatedMinutes: 44 },
      { name: 'GTB Nagar',           lat: 28.6993, lng: 77.2063, sequence: 7, estimatedMinutes: 50 },
      { name: 'Connaught Place',     lat: 28.6315, lng: 77.2167, sequence: 8, estimatedMinutes: 60 },
    ]
  },
  {
    routeNo: '302', name: 'Sarai Kale Khan - Vasant Vihar',
    startStop: 'Sarai Kale Khan ISBT', endStop: 'Vasant Vihar',
    depotIdx: 3, totalDistance: 16.8, avgDuration: 70, frequency: 18, priority: 3, dailyPassengers: 2900,
    stops: [
      { name: 'Sarai Kale Khan ISBT', lat: 28.5896, lng: 77.2549, sequence: 1, estimatedMinutes: 0 },
      { name: 'Ashram',              lat: 28.5718, lng: 77.2568, sequence: 2, estimatedMinutes: 10 },
      { name: 'AIIMS',               lat: 28.5678, lng: 77.2094, sequence: 3, estimatedMinutes: 22 },
      { name: 'Green Park',          lat: 28.5607, lng: 77.2060, sequence: 4, estimatedMinutes: 32 },
      { name: 'IIT Delhi',           lat: 28.5459, lng: 77.1927, sequence: 5, estimatedMinutes: 42 },
      { name: 'Vasant Vihar',        lat: 28.5621, lng: 77.1577, sequence: 6, estimatedMinutes: 70 },
    ]
  },
  {
    routeNo: '505', name: 'Dwarka Sector 21 - AIIMS',
    startStop: 'Dwarka Sector 21', endStop: 'AIIMS',
    depotIdx: 2, totalDistance: 22.3, avgDuration: 80, frequency: 15, priority: 4, dailyPassengers: 3400,
    stops: [
      { name: 'Dwarka Sector 21',    lat: 28.5530, lng: 77.0587, sequence: 1, estimatedMinutes: 0 },
      { name: 'Dwarka Sector 14',    lat: 28.5840, lng: 77.0554, sequence: 2, estimatedMinutes: 12 },
      { name: 'Dwarka Mor',          lat: 28.6129, lng: 77.0590, sequence: 3, estimatedMinutes: 22 },
      { name: 'Uttam Nagar',         lat: 28.6230, lng: 77.0553, sequence: 4, estimatedMinutes: 32 },
      { name: 'Janakpuri',           lat: 28.6298, lng: 77.0827, sequence: 5, estimatedMinutes: 44 },
      { name: 'Tilak Nagar',         lat: 28.6341, lng: 77.1036, sequence: 6, estimatedMinutes: 55 },
      { name: 'Dhaula Kuan',         lat: 28.5957, lng: 77.1618, sequence: 7, estimatedMinutes: 65 },
      { name: 'AIIMS',               lat: 28.5678, lng: 77.2094, sequence: 8, estimatedMinutes: 80 },
    ]
  },
  {
    routeNo: '764', name: 'Shahdara - AIIMS',
    startStop: 'Shahdara Bus Terminal', endStop: 'AIIMS',
    depotIdx: 5, totalDistance: 20.1, avgDuration: 75, frequency: 20, priority: 3, dailyPassengers: 2600,
    stops: [
      { name: 'Shahdara Bus Terminal', lat: 28.6742, lng: 77.2893, sequence: 1, estimatedMinutes: 0 },
      { name: 'Geeta Colony',         lat: 28.6573, lng: 77.2812, sequence: 2, estimatedMinutes: 12 },
      { name: 'ITO',                  lat: 28.6283, lng: 77.2485, sequence: 3, estimatedMinutes: 25 },
      { name: 'Mandi House',          lat: 28.6255, lng: 77.2351, sequence: 4, estimatedMinutes: 35 },
      { name: 'Connaught Place',      lat: 28.6315, lng: 77.2167, sequence: 5, estimatedMinutes: 45 },
      { name: 'AIIMS',                lat: 28.5678, lng: 77.2094, sequence: 6, estimatedMinutes: 75 },
    ]
  },
  {
    routeNo: '113', name: 'Narela - ISBT Kashmere Gate',
    startStop: 'Narela', endStop: 'Kashmere Gate ISBT',
    depotIdx: 6, totalDistance: 32.0, avgDuration: 105, frequency: 25, priority: 2, dailyPassengers: 1800,
    stops: [
      { name: 'Narela',               lat: 28.8524, lng: 77.0915, sequence: 1, estimatedMinutes: 0 },
      { name: 'Bawana',               lat: 28.8088, lng: 77.0445, sequence: 2, estimatedMinutes: 20 },
      { name: 'Badli',                lat: 28.7552, lng: 77.1380, sequence: 3, estimatedMinutes: 45 },
      { name: 'Azadpur',              lat: 28.7094, lng: 77.1782, sequence: 4, estimatedMinutes: 65 },
      { name: 'GTB Nagar',            lat: 28.6993, lng: 77.2063, sequence: 5, estimatedMinutes: 80 },
      { name: 'Kashmere Gate ISBT',   lat: 28.6676, lng: 77.2284, sequence: 6, estimatedMinutes: 105 },
    ]
  },
  {
    routeNo: '620', name: 'Noida Sector 18 - Connaught Place',
    startStop: 'Noida Sector 18', endStop: 'Connaught Place',
    depotIdx: 7, totalDistance: 19.5, avgDuration: 65, frequency: 15, priority: 4, dailyPassengers: 3200,
    stops: [
      { name: 'Noida Sector 18',      lat: 28.5706, lng: 77.3219, sequence: 1, estimatedMinutes: 0 },
      { name: 'Noida City Centre',    lat: 28.5776, lng: 77.3192, sequence: 2, estimatedMinutes: 8 },
      { name: 'Akshardham',           lat: 28.6127, lng: 77.2773, sequence: 3, estimatedMinutes: 20 },
      { name: 'Pragati Maidan',       lat: 28.6195, lng: 77.2490, sequence: 4, estimatedMinutes: 32 },
      { name: 'ITO',                  lat: 28.6283, lng: 77.2485, sequence: 5, estimatedMinutes: 42 },
      { name: 'Connaught Place',      lat: 28.6315, lng: 77.2167, sequence: 6, estimatedMinutes: 65 },
    ]
  },
];

const DRIVER_NAMES = [
  'Ramesh Sharma', 'Anil Kumar', 'Suresh Verma', 'Pradeep Singh', 'Vinod Yadav',
  'Mahesh Gupta', 'Dinesh Tiwari', 'Rajesh Dubey', 'Santosh Mishra', 'Umesh Pandey',
  'Vikram Chauhan', 'Deepak Rawat', 'Harish Negi', 'Pawan Rana', 'Sanjay Bisht',
  'Mohan Joshi', 'Kishan Gopal', 'Naresh Pal', 'Ravi Shankar', 'Ajay Tripathi',
];

async function seed() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB connected');

    // Clear existing data
    await Promise.all([
      Bus.deleteMany(), Driver.deleteMany(), Route.deleteMany(),
      Depot.deleteMany(), User.deleteMany(), Schedule.deleteMany(), Incident.deleteMany()
    ]);
    console.log('🗑  Cleared existing data');

    // Seed Depots
    const depots = await Depot.insertMany(DELHI_DEPOTS);
    console.log(`✅ Seeded ${depots.length} depots`);

    // Seed Routes
    const routeDocs = ROUTE_TEMPLATES.map(rt => ({
      ...rt,
      depot: depots[rt.depotIdx]._id,
      operatingHours: { start: '05:30', end: '23:00' }
    }));
    const routes = await Route.insertMany(routeDocs.map(r => {
      const { depotIdx, ...rest } = r; return rest;
    }));
    console.log(`✅ Seeded ${routes.length} routes`);

    // Seed Buses (3 per depot)
    const busDocs = [];
    depots.forEach((depot, di) => {
      for (let b = 0; b < 3; b++) {
        const busNum = String(di * 3 + b + 1).padStart(4, '0');
        busDocs.push({
          busId: `B${busNum}`,
          registrationNo: `DL1PC${(2000 + di * 3 + b)}`,
          type: (di + b) % 3 === 0 ? 'EV' : 'CNG',
          capacity: 65,
          depot: depot._id,
          status: 'idle',
          odometer: Math.floor(Math.random() * 8000),
          ac: (di + b) % 4 === 0,
          manufacturedYear: 2019 + (b % 4)
        });
      }
    });
    const buses = await Bus.insertMany(busDocs);
    console.log(`✅ Seeded ${buses.length} buses`);

    // Seed Drivers (2-3 per depot)
    const driverDocs = [];
    let driverIdx = 0;
    depots.forEach((depot, di) => {
      const count = di < 4 ? 3 : 2;
      for (let d = 0; d < count; d++) {
        const shifts = ['morning', 'afternoon', 'night'];
        const shift = shifts[d % 3];
        const shiftTimes = { morning: ['06:00','14:00'], afternoon: ['14:00','22:00'], night: ['22:00','06:00'] };
        driverDocs.push({
          driverId: `DR${String(driverIdx + 1).padStart(3, '0')}`,
          name: DRIVER_NAMES[driverIdx % DRIVER_NAMES.length],
          phone: `98${String(10000000 + driverIdx).slice(1)}`,
          licenseNo: `DL${String(2010 + driverIdx).padStart(6, '0')}`,
          licenseExpiry: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000 * (1 + driverIdx % 3)),
          depot: depot._id,
          status: 'available',
          shiftType: shift,
          shiftStart: shiftTimes[shift][0],
          shiftEnd: shiftTimes[shift][1],
          totalTrips: Math.floor(Math.random() * 500) + 50,
          rating: (3.5 + Math.random() * 1.5).toFixed(1)
        });
        driverIdx++;
      }
    });
    const drivers = await Driver.insertMany(driverDocs);
    console.log(`✅ Seeded ${drivers.length} drivers`);

    // Seed Admin User
    const adminPassword = await hashPassword('admin123');
    await User.create({
      name: 'DTC Admin', email: 'admin@dtc.delhi.gov.in',
      password: adminPassword, role: 'admin'
    });
    await User.create({
      name: 'Control Room Operator', email: 'operator@dtc.delhi.gov.in',
      password: await hashPassword('operator123'), role: 'operator'
    });
    console.log('✅ Seeded admin users');

    // Seed a sample incident
    await Incident.create({
      bus: buses[0]._id,
      driver: drivers[0]._id,
      route: routes[0]._id,
      type: 'breakdown',
      severity: 'high',
      description: 'Engine overheating reported near Lajpat Nagar flyover',
      location: { lat: 28.5695, lng: 77.2437, address: 'Near Lajpat Nagar Metro Station' },
      status: 'in-progress',
      affectedStops: ['Lajpat Nagar Metro', 'INA Colony']
    });
    console.log('✅ Seeded sample incident');

    console.log('\n🎉 Seed complete!');
    console.log('─────────────────────────────');
    console.log('Admin login:    admin@dtc.delhi.gov.in / admin123');
    console.log('Operator login: operator@dtc.delhi.gov.in / operator123');
    console.log('─────────────────────────────');
    console.log('Next step: npm run dev');

    process.exit(0);
  } catch (e) {
    console.error('Seed failed:', e);
    process.exit(1);
  }
}

seed();
