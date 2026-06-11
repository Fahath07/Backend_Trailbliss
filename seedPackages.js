require('dotenv').config();
const mongoose = require('mongoose');
const Trip = require('./Models/TripModel');

const packages = [
  {
    title: 'Kerala Backwaters & Houseboat Escape',
    description: 'Drift through serene backwaters on a traditional houseboat, explore lush paddy fields, and unwind on Alleppey beach.',
    location: { city: 'Alleppey', state: 'Kerala', country: 'India', coordinates: { latitude: 9.4981, longitude: 76.3388 } },
    category: 'Leisure',
    duration: { days: 4, nights: 3 },
    pricing: {
      basePrice: 18999,
      discountPercent: 10,
      priceIncludes: ['Houseboat stay', 'All meals', 'AC bedroom', 'Boat cruise'],
      priceExcludes: ['Airfare', 'Personal expenses']
    },
    itinerary: [
      { day: 1, title: 'Arrival & Houseboat Check-in', activities: ['Airport pickup', 'Houseboat boarding', 'Sunset cruise'], meals: { breakfast: false, lunch: false, dinner: true }, accommodation: 'Houseboat' },
      { day: 2, title: 'Backwater Village Tour', activities: ['Village walk', 'Coir weaving demo', 'Canoe ride'], meals: { breakfast: true, lunch: true, dinner: true }, accommodation: 'Houseboat' },
      { day: 3, title: 'Alleppey Beach & Cooking Class', activities: ['Beach visit', 'Kerala cooking class', 'Sunset stroll'], meals: { breakfast: true, lunch: true, dinner: true }, accommodation: 'Resort' },
      { day: 4, title: 'Departure', activities: ['Checkout', 'Drop to airport'], meals: { breakfast: true, lunch: false, dinner: false }, accommodation: 'None' }
    ],
    images: {
      featured: 'https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?w=800&q=80',
      gallery: [
        'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&q=80',
        'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800&q=80',
        'https://images.unsplash.com/photo-1501854140801-50d01698950b?w=800&q=80'
      ]
    },
    highlights: ['Overnight houseboat stay', 'Authentic Kerala cuisine', 'Village life experience'],
    inclusions: ['Houseboat accommodation', 'All meals', 'Guide'],
    exclusions: ['Flights', 'Travel insurance'],
    difficulty: 'Easy',
    groupSize: { min: 2, max: 12 },
    tags: ['backwaters', 'houseboat', 'kerala', 'nature'],
    badge: 'Bestseller'
  },
  {
    title: 'Manali Snow & Adventure Trek',
    description: 'Experience thrilling snow activities, Rohtang Pass, Solang Valley, and the majestic Kullu-Manali landscapes.',
    location: { city: 'Manali', state: 'Himachal Pradesh', country: 'India', coordinates: { latitude: 32.2396, longitude: 77.1887 } },
    category: 'Adventure',
    duration: { days: 6, nights: 5 },
    pricing: {
      basePrice: 24999,
      discountPercent: 15,
      priceIncludes: ['Hotel stay', 'Breakfast & dinner', 'Rohtang permit', 'Snow activities'],
      priceExcludes: ['Airfare', 'Lunch', 'Personal gear']
    },
    itinerary: [
      { day: 1, title: 'Arrival in Manali', activities: ['Check-in', 'Mall Road stroll', 'Hadimba Temple visit'], meals: { breakfast: false, lunch: false, dinner: true }, accommodation: 'Hotel' },
      { day: 2, title: 'Solang Valley Adventure', activities: ['Zorbing', 'Paragliding', 'Skiing'], meals: { breakfast: true, lunch: false, dinner: true }, accommodation: 'Hotel' },
      { day: 3, title: 'Rohtang Pass Excursion', activities: ['Snow play', 'Photography', 'Yak ride'], meals: { breakfast: true, lunch: false, dinner: true }, accommodation: 'Hotel' },
      { day: 4, title: 'Kullu River Rafting', activities: ['White water rafting', 'Shawl factory visit'], meals: { breakfast: true, lunch: false, dinner: true }, accommodation: 'Hotel' },
      { day: 5, title: 'Old Manali & Cafe Hopping', activities: ['Village walk', 'Local cafes', 'Shopping'], meals: { breakfast: true, lunch: false, dinner: true }, accommodation: 'Hotel' },
      { day: 6, title: 'Departure', activities: ['Checkout', 'Transfer to Bhuntar airport'], meals: { breakfast: true, lunch: false, dinner: false }, accommodation: 'None' }
    ],
    images: {
      featured: 'https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?w=800&q=80',
      gallery: [
        'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80',
        'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&q=80',
        'https://images.unsplash.com/photo-1520962880247-cfaf541c8724?w=800&q=80'
      ]
    },
    highlights: ['Rohtang Pass snow', 'River rafting in Kullu', 'Paragliding at Solang'],
    inclusions: ['5-night hotel', 'Rohtang permit', 'Snow activity charges', 'Breakfast & dinner'],
    exclusions: ['Flights', 'Lunch', 'Personal equipment'],
    difficulty: 'Moderate',
    groupSize: { min: 4, max: 16 },
    tags: ['snow', 'trek', 'adventure', 'manali', 'himachal'],
    badge: 'Popular'
  },
  {
    title: 'Rajasthan Royal Heritage Tour',
    description: 'Explore the land of maharajas — majestic forts, golden deserts, vibrant bazaars, and royal palaces of Jaipur, Jodhpur & Jaisalmer.',
    location: { city: 'Jaipur', state: 'Rajasthan', country: 'India', coordinates: { latitude: 26.9124, longitude: 75.7873 } },
    category: 'Cultural',
    duration: { days: 7, nights: 6 },
    pricing: {
      basePrice: 32999,
      discountPercent: 12,
      priceIncludes: ['Heritage hotel stay', 'Breakfast', 'AC transport', 'Monument entries', 'Camel safari'],
      priceExcludes: ['Flights', 'Lunch & dinner', 'Personal shopping']
    },
    itinerary: [
      { day: 1, title: 'Arrive Jaipur – Pink City', activities: ['City Palace', 'Hawa Mahal', 'Jantar Mantar'], meals: { breakfast: false, lunch: false, dinner: true }, accommodation: 'Hotel' },
      { day: 2, title: 'Amber Fort & Local Markets', activities: ['Amber Fort elephant ride', 'Johari Bazaar', 'Block printing demo'], meals: { breakfast: true, lunch: false, dinner: false }, accommodation: 'Hotel' },
      { day: 3, title: 'Jaipur to Jodhpur', activities: ['Mehrangarh Fort', 'Jaswant Thada', 'Blue City walk'], meals: { breakfast: true, lunch: false, dinner: true }, accommodation: 'Hotel' },
      { day: 4, title: 'Jodhpur to Jaisalmer', activities: ['Desert drive', 'Sam Sand Dunes', 'Sunset camel safari'], meals: { breakfast: true, lunch: false, dinner: true }, accommodation: 'Resort' },
      { day: 5, title: 'Jaisalmer Fort & Desert Camp', activities: ['Golden Fort', 'Patwon ki Haveli', 'Overnight desert camp'], meals: { breakfast: true, lunch: false, dinner: true }, accommodation: 'Camping' },
      { day: 6, title: 'Desert Camp to Jaisalmer', activities: ['Sunrise over dunes', 'Folk music & dance'], meals: { breakfast: true, lunch: false, dinner: false }, accommodation: 'Hotel' },
      { day: 7, title: 'Departure', activities: ['Transfer to Jaisalmer airport'], meals: { breakfast: true, lunch: false, dinner: false }, accommodation: 'None' }
    ],
    images: {
      featured: 'https://images.unsplash.com/photo-1477587458883-47145ed31459?w=800&q=80',
      gallery: [
        'https://images.unsplash.com/photo-1524492412937-b28074a5d7da?w=800&q=80',
        'https://images.unsplash.com/photo-1598977247817-b0f7b62e2cad?w=800&q=80',
        'https://images.unsplash.com/photo-1587474260584-136574528ed5?w=800&q=80'
      ]
    },
    highlights: ['Amber Fort elephant ride', 'Camel safari on Sam Sand Dunes', 'Overnight desert camp', 'Mehrangarh Fort'],
    inclusions: ['6-night heritage hotel', 'Breakfast', 'AC cab', 'All monument entries', 'Camel safari'],
    exclusions: ['Flights', 'Lunch & dinner'],
    difficulty: 'Easy',
    groupSize: { min: 2, max: 20 },
    tags: ['rajasthan', 'heritage', 'desert', 'culture', 'fort'],
    badge: 'Premium'
  },
  {
    title: 'Andaman Island Paradise',
    description: 'Pristine white-sand beaches, crystal-clear waters, vibrant coral reefs, and thrilling water sports at the Andaman Islands.',
    location: { city: 'Port Blair', state: 'Andaman & Nicobar', country: 'India', coordinates: { latitude: 11.6234, longitude: 92.7265 } },
    category: 'Leisure',
    duration: { days: 5, nights: 4 },
    pricing: {
      basePrice: 28999,
      discountPercent: 8,
      priceIncludes: ['Beach resort stay', 'Breakfast & dinner', 'Scuba diving', 'Ferry transfers', 'Cellular Jail tour'],
      priceExcludes: ['Flights', 'Lunch', 'Extra water sports']
    },
    itinerary: [
      { day: 1, title: 'Arrive Port Blair', activities: ['Cellular Jail', 'Sound & Light show', 'Corbyn Cove Beach'], meals: { breakfast: false, lunch: false, dinner: true }, accommodation: 'Hotel' },
      { day: 2, title: 'Havelock Island – Radhanagar Beach', activities: ['Ferry to Havelock', 'Radhanagar Beach swim', 'Beach volleyball'], meals: { breakfast: true, lunch: false, dinner: true }, accommodation: 'Resort' },
      { day: 3, title: 'Scuba Diving & Snorkeling', activities: ['Beginner scuba diving', 'Elephant Beach snorkeling', 'Glass-bottom boat ride'], meals: { breakfast: true, lunch: false, dinner: true }, accommodation: 'Resort' },
      { day: 4, title: 'Neil Island Day Trip', activities: ['Natural Bridge', 'Bharatpur Beach', 'Laksmanpur sunset'], meals: { breakfast: true, lunch: false, dinner: true }, accommodation: 'Resort' },
      { day: 5, title: 'Departure', activities: ['Ferry back to Port Blair', 'Airport drop'], meals: { breakfast: true, lunch: false, dinner: false }, accommodation: 'None' }
    ],
    images: {
      featured: 'https://images.unsplash.com/photo-1559494007-9f5847c49d94?w=800&q=80',
      gallery: [
        'https://images.unsplash.com/photo-1520454974749-a795b5b1f0a5?w=800&q=80',
        'https://images.unsplash.com/photo-1544551763-77ef2d0cfc6c?w=800&q=80',
        'https://images.unsplash.com/photo-1490730141103-6cac27aaab94?w=800&q=80'
      ]
    },
    highlights: ['Radhanagar Beach — Asia\'s best beach', 'Scuba diving at Havelock', 'Cellular Jail historical tour'],
    inclusions: ['4-night beach resort', 'Breakfast & dinner', 'Scuba diving session', 'All ferry transfers'],
    exclusions: ['Flights to Port Blair', 'Lunch'],
    difficulty: 'Easy',
    groupSize: { min: 2, max: 15 },
    tags: ['andaman', 'beach', 'scuba', 'island', 'water sports'],
    badge: 'Popular'
  },
  {
    title: 'Coorg Coffee Plantation Retreat',
    description: 'Rejuvenate amidst lush coffee estates, misty hills, waterfalls, and rich Kodava culture in the Scotland of India.',
    location: { city: 'Coorg', state: 'Karnataka', country: 'India', coordinates: { latitude: 12.3375, longitude: 75.8069 } },
    category: 'Wellness',
    duration: { days: 3, nights: 2 },
    pricing: {
      basePrice: 12999,
      discountPercent: 5,
      priceIncludes: ['Plantation resort stay', 'All meals', 'Coffee estate tour', 'Waterfall trek'],
      priceExcludes: ['Travel to Coorg', 'Spa treatments']
    },
    itinerary: [
      { day: 1, title: 'Arrive & Coffee Estate Tour', activities: ['Plantation walk', 'Coffee tasting', 'Resort check-in'], meals: { breakfast: false, lunch: true, dinner: true }, accommodation: 'Resort' },
      { day: 2, title: 'Abbey Falls & Namdroling Monastery', activities: ['Abbey Falls trek', 'Golden Temple visit', 'Local market'], meals: { breakfast: true, lunch: true, dinner: true }, accommodation: 'Resort' },
      { day: 3, title: 'Raja\'s Seat & Departure', activities: ['Raja\'s Seat sunrise', 'Ayurvedic spa', 'Checkout'], meals: { breakfast: true, lunch: false, dinner: false }, accommodation: 'None' }
    ],
    images: {
      featured: 'https://images.unsplash.com/photo-1566438480900-0609be27a4be?w=800&q=80',
      gallery: [
        'https://images.unsplash.com/photo-1448375240586-882707db888b?w=800&q=80',
        'https://images.unsplash.com/photo-1518495973542-4542c06a5843?w=800&q=80',
        'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800&q=80'
      ]
    },
    highlights: ['Organic coffee plantation tour', 'Abbey Falls trek', 'Golden Temple Namdroling'],
    inclusions: ['2-night plantation resort', 'All meals', 'Coffee tour', 'Waterfall trek guide'],
    exclusions: ['Travel to Coorg', 'Spa'],
    difficulty: 'Easy',
    groupSize: { min: 2, max: 10 },
    tags: ['coorg', 'coffee', 'wellness', 'nature', 'hills'],
    badge: 'New'
  },
  {
    title: 'Leh Ladakh Bike Expedition',
    description: 'Conquer the world\'s highest motorable roads on this epic motorcycle journey through Leh, Nubra Valley, and Pangong Lake.',
    location: { city: 'Leh', state: 'Ladakh', country: 'India', coordinates: { latitude: 34.1526, longitude: 77.5771 } },
    category: 'Adventure',
    duration: { days: 9, nights: 8 },
    pricing: {
      basePrice: 44999,
      discountPercent: 0,
      priceIncludes: ['Royal Enfield rental', 'Hotel & camping stay', 'Breakfast & dinner', 'Permit fees', 'Mechanic support'],
      priceExcludes: ['Flights to Leh', 'Fuel', 'Lunch', 'Personal gear']
    },
    itinerary: [
      { day: 1, title: 'Arrive Leh – Acclimatization', activities: ['Rest', 'Leh Palace', 'Shanti Stupa'], meals: { breakfast: false, lunch: false, dinner: true }, accommodation: 'Hotel' },
      { day: 2, title: 'Leh Local Sightseeing', activities: ['Magnetic Hill', 'Gurudwara Pathar Sahib', 'Sangam point'], meals: { breakfast: true, lunch: false, dinner: true }, accommodation: 'Hotel' },
      { day: 3, title: 'Leh to Nubra Valley via Khardung La', activities: ['Khardung La pass (5,359m)', 'Double-hump camel ride', 'Diskit Monastery'], meals: { breakfast: true, lunch: false, dinner: true }, accommodation: 'Camping' },
      { day: 4, title: 'Nubra Valley to Pangong Lake', activities: ['Ride through Shyok valley', 'Pangong sunset'], meals: { breakfast: true, lunch: false, dinner: true }, accommodation: 'Camping' },
      { day: 5, title: 'Pangong Lake – Chang La Pass', activities: ['Sunrise at Pangong', 'Chang La Pass (5,360m)'], meals: { breakfast: true, lunch: false, dinner: true }, accommodation: 'Hotel' },
      { day: 6, title: 'Leh to Kargil', activities: ['Lamayuru Monastery', 'Moon Landscape', 'Mulbekh Chamba'], meals: { breakfast: true, lunch: false, dinner: true }, accommodation: 'Hotel' },
      { day: 7, title: 'Kargil – Drass – Srinagar', activities: ['Drass War Memorial', 'Tiger Hill viewpoint'], meals: { breakfast: true, lunch: false, dinner: true }, accommodation: 'Hotel' },
      { day: 8, title: 'Srinagar Dal Lake', activities: ['Shikara ride on Dal Lake', 'Mughal Gardens'], meals: { breakfast: true, lunch: false, dinner: true }, accommodation: 'Houseboat' },
      { day: 9, title: 'Departure from Srinagar', activities: ['Airport transfer'], meals: { breakfast: true, lunch: false, dinner: false }, accommodation: 'None' }
    ],
    images: {
      featured: 'https://images.unsplash.com/photo-1626016566461-6a5b8da6e9ae?w=800&q=80',
      gallery: [
        'https://images.unsplash.com/photo-1609766857232-8a4b8c1dd450?w=800&q=80',
        'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80',
        'https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=800&q=80'
      ]
    },
    highlights: ['Khardung La – world\'s highest motorable road', 'Pangong Lake at sunrise', 'Nubra Valley double-hump camel safari', 'Dal Lake Shikara ride'],
    inclusions: ['Royal Enfield bike', '8-night stay', 'Breakfast & dinner', 'All permits', 'Support vehicle'],
    exclusions: ['Flights', 'Fuel', 'Lunch', 'Riding gear'],
    difficulty: 'Challenging',
    groupSize: { min: 4, max: 12 },
    tags: ['ladakh', 'bike', 'adventure', 'himalaya', 'pangong'],
    badge: 'Premium'
  },
  {
    title: 'Goa Sun, Beach & Nightlife',
    description: 'Sun-kissed beaches, water sports, vibrant shacks, Portuguese heritage, and legendary Goan nightlife — the ultimate beach holiday.',
    location: { city: 'Goa', state: 'Goa', country: 'India', coordinates: { latitude: 15.2993, longitude: 74.124 } },
    category: 'Leisure',
    duration: { days: 4, nights: 3 },
    pricing: {
      basePrice: 14999,
      discountPercent: 10,
      priceIncludes: ['Beach hotel stay', 'Breakfast', 'Water sports package', 'North & South Goa tour'],
      priceExcludes: ['Flights', 'Lunch & dinner', 'Alcohol']
    },
    itinerary: [
      { day: 1, title: 'Arrive Goa – North Beaches', activities: ['Baga Beach', 'Calangute Market', 'Tito\'s Lane nightlife'], meals: { breakfast: false, lunch: false, dinner: false }, accommodation: 'Hotel' },
      { day: 2, title: 'Water Sports Extravaganza', activities: ['Parasailing', 'Jet skiing', 'Banana boat ride', 'Scuba diving'], meals: { breakfast: true, lunch: false, dinner: false }, accommodation: 'Hotel' },
      { day: 3, title: 'South Goa & Heritage', activities: ['Palolem Beach', 'Dudhsagar Falls', 'Old Goa churches'], meals: { breakfast: true, lunch: false, dinner: false }, accommodation: 'Hotel' },
      { day: 4, title: 'Departure', activities: ['Anjuna flea market', 'Airport transfer'], meals: { breakfast: true, lunch: false, dinner: false }, accommodation: 'None' }
    ],
    images: {
      featured: 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?w=800&q=80',
      gallery: [
        'https://images.unsplash.com/photo-1540202404-a2f29cf7de19?w=800&q=80',
        'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&q=80',
        'https://images.unsplash.com/photo-1548438294-1ad5d5f4f063?w=800&q=80'
      ]
    },
    highlights: ['Water sports at Baga Beach', 'Dudhsagar Waterfall visit', 'Palolem Beach sunset', 'Old Goa UNESCO heritage churches'],
    inclusions: ['3-night beach hotel', 'Breakfast', 'Water sports package', 'Cab transfers'],
    exclusions: ['Flights', 'Lunch & dinner'],
    difficulty: 'Easy',
    groupSize: { min: 2, max: 20 },
    tags: ['goa', 'beach', 'nightlife', 'water sports', 'leisure'],
    badge: 'Bestseller'
  },
  {
    title: 'Varanasi Spiritual & Cultural Journey',
    description: 'Witness the eternal city on the Ganges — Ganga Aarti, ghats, ancient temples, and the profound spirituality of Kashi.',
    location: { city: 'Varanasi', state: 'Uttar Pradesh', country: 'India', coordinates: { latitude: 25.3176, longitude: 82.9739 } },
    category: 'Cultural',
    duration: { days: 3, nights: 2 },
    pricing: {
      basePrice: 10999,
      discountPercent: 0,
      priceIncludes: ['Hotel stay', 'Breakfast', 'Ganga Aarti boat ride', 'Temple tour', 'Guide'],
      priceExcludes: ['Flights/train', 'Lunch & dinner', 'Personal offerings']
    },
    itinerary: [
      { day: 1, title: 'Arrive & Evening Ganga Aarti', activities: ['Dashaswamedh Ghat Aarti', 'Ghat walk', 'Street food trail'], meals: { breakfast: false, lunch: false, dinner: false }, accommodation: 'Hotel' },
      { day: 2, title: 'Sunrise Boat Ride & Temples', activities: ['Dawn boat ride on Ganges', 'Kashi Vishwanath Temple', 'Sarnath excursion'], meals: { breakfast: true, lunch: false, dinner: false }, accommodation: 'Hotel' },
      { day: 3, title: 'Silk Weaving & Departure', activities: ['Banarasi silk workshop', 'Local bazaar', 'Transfer'], meals: { breakfast: true, lunch: false, dinner: false }, accommodation: 'None' }
    ],
    images: {
      featured: 'https://images.unsplash.com/photo-1561361058-c24e31de4d4e?w=800&q=80',
      gallery: [
        'https://images.unsplash.com/photo-1600100397608-fd7408ec1598?w=800&q=80',
        'https://images.unsplash.com/photo-1545126530-7b0e4f0b6ca7?w=800&q=80',
        'https://images.unsplash.com/photo-1538427969769-ec2fdfa4e9d2?w=800&q=80'
      ]
    },
    highlights: ['Ganga Aarti at Dashaswamedh Ghat', 'Sunrise boat ride on the Ganges', 'Kashi Vishwanath darshan', 'Sarnath Buddhist site'],
    inclusions: ['2-night hotel', 'Breakfast', 'Boat ride', 'Guide', 'Temple tour'],
    exclusions: ['Train/flights', 'Lunch & dinner'],
    difficulty: 'Easy',
    groupSize: { min: 2, max: 20 },
    tags: ['varanasi', 'spiritual', 'ganga', 'culture', 'temple'],
    badge: 'Popular'
  }
];

async function seed() {
  await mongoose.connect(process.env.MONGODB_URL);
  console.log('Connected to MongoDB');

  const inserted = await Trip.insertMany(packages);
  console.log(`✅ Successfully inserted ${inserted.length} packages`);

  await mongoose.disconnect();
  console.log('Done.');
}

seed().catch(err => { console.error(err); process.exit(1); });
