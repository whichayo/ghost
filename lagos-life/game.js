/* Lagos Life — a small life-simulation game set in Lagos, Nigeria.
   Plain browser JavaScript, no dependencies. All state lives in `S` and is
   saved to localStorage when available. */
(() => {
    'use strict';

    // ---------------------------------------------------------------------
    // Constants & helpers
    // ---------------------------------------------------------------------
    const W = 720;
    const H = 440;
    const SAVE_KEY = 'lagoslife.save.v1';
    const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const SPEEDS = [0, 2, 6, 20]; // game minutes per real second
    const FF_RATE = 45; // fast-forward rate for sleep, work and travel

    const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
    const rand = (a, b) => a + Math.random() * (b - a);
    const pick = arr => arr[Math.floor(Math.random() * arr.length)];
    const esc = s => String(s).replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', '\'': '&#39;'}[c]));
    const naira = n => (n < 0 ? '−' : '') + '₦' + Math.abs(Math.round(n)).toLocaleString('en-NG');
    const pad = n => String(n).padStart(2, '0');
    const clock = m => `${pad(Math.floor(m / 60) % 24)}:${pad(Math.floor(m % 60))}`;
    const hoursLabel = mins => (mins >= 60 ? `${Math.floor(mins / 60)}h ${pad(Math.round(mins % 60))}m` : `${Math.round(mins)}m`);

    // ---------------------------------------------------------------------
    // Game data
    // ---------------------------------------------------------------------
    const NEEDS = [
        {id: 'hunger', label: 'Hunger', decay: 6.5},
        {id: 'energy', label: 'Energy', decay: 4.2},
        {id: 'hygiene', label: 'Hygiene', decay: 3.8},
        {id: 'fun', label: 'Fun', decay: 3.8},
        {id: 'social', label: 'Social', decay: 3.2},
        {id: 'comfort', label: 'Comfort', decay: 4}
    ];

    const SKILLS = {coding: 'Coding', business: 'Business', charisma: 'Charisma', cooking: 'Cooking', fitness: 'Fitness'};

    const SKIN = ['#3f2618', '#5a3825', '#7b4a2e', '#8d5b3a', '#a86f45'];
    const OUTFIT = ['#d6623f', '#45a86d', '#2f6fd0', '#8e44ad', '#f5c11a', '#e04f8a'];

    const HOMES = {
        yaba: {name: 'Self-contain, Yaba', short: 'Yaba', pin: [226, 100], rent: 35000, comfort: 0, outage: 0.1,
            wall: '#c9b79c', floor: '#8c6b4f', tile: '#7e5f45', bath: '#9fb4b8'},
        surulere: {name: '2-bedroom flat, Surulere', short: 'Surulere', pin: [98, 142], rent: 75000, comfort: 1, outage: 0.075,
            wall: '#b9c7b0', floor: '#9a7656', tile: '#8a6a4c', bath: '#a9c3c0'},
        lekki: {name: 'Serviced apartment, Lekki Phase 1', short: 'Lekki', pin: [298, 226], rent: 190000, comfort: 2, outage: 0.03,
            wall: '#d8d3c8', floor: '#b9a68e', tile: '#ad9a82', bath: '#c8d8dc'},
        banana: {name: 'Duplex, Banana Island', short: 'Banana Island', pin: [268, 194], rent: 480000, comfort: 3, outage: 0.006,
            wall: '#e8e2d4', floor: '#cdbfa8', tile: '#c2b39b', bath: '#d6e4e6'}
    };

    const ISLAND = new Set(['island', 'ikoyi', 'vi', 'lekki']);

    const LOCS = {
        hub: {name: 'Yaba Tech Hub', area: 'yaba', pin: [204, 114], open: [8, 22], scene: 'office', blurb: 'Coworking desks, meetups and light that never goes off.', cool: true},
        station: {name: 'Herbert Macaulay Filling Station', area: 'yaba', pin: [238, 128], open: [0, 24], scene: 'station', blurb: 'Fuel for your generator.'},
        set: {name: 'Surulere Film Set', area: 'surulere', pin: [112, 120], open: [8, 22], scene: 'set', blurb: 'Nollywood is shooting here today. And every day.'},
        buka: {name: 'Mama Nkechi\'s Buka', area: 'surulere', pin: [140, 146], open: [7, 21], scene: 'buka', blurb: 'Amala, ewedu and the best gist in Surulere.'},
        suya: {name: 'Allen Avenue Suya Spot', area: 'ikeja', pin: [186, 36], open: [17, 26], scene: 'suya', blurb: 'Opens at 5pm. Mallam sells out by midnight.'},
        mall: {name: 'Ikeja City Mall', area: 'ikeja', pin: [236, 52], open: [9, 22], scene: 'mall', blurb: 'Supermarket, cinema and serious air conditioning.', cool: true},
        market: {name: 'Balogun Market', area: 'island', pin: [148, 214], open: [7, 19], days: [0, 1, 2, 3, 4, 5], scene: 'market', blurb: 'Everything is available. Everything is negotiable.'},
        freedom: {name: 'Freedom Park', area: 'island', pin: [176, 232], open: [10, 24], scene: 'park', blurb: 'Live music on Friday, Saturday and Sunday nights.'},
        owambe: {name: 'Ikoyi Event Centre', area: 'ikoyi', pin: [244, 202], open: [12, 23], days: [5], scene: 'party', blurb: 'Saturday owambe. Aso-ebi strongly advised.'},
        bank: {name: 'Victoria Island Bank Tower', area: 'vi', pin: [214, 240], open: [7, 20], days: [0, 1, 2, 3, 4], scene: 'bank', blurb: 'Glass, marble and very serious meetings.', cool: true},
        gym: {name: 'Lekki Fitness Club', area: 'lekki', pin: [318, 210], open: [5, 22], scene: 'gym', blurb: 'Day pass ₦4,000.', cool: true},
        beach: {name: 'Elegushi Beach', area: 'lekki', pin: [352, 244], open: [8, 20], scene: 'beach', blurb: 'Waves, horses, loud speakers.'}
    };

    const MODES = {
        danfo: {name: 'Danfo', speed: 1, traffic: 1, rates: {comfort: -10, fun: -5}, note: 'Cheap. Conductor no get change.',
            cost: d => Math.max(300, 200 + Math.round(d * 4 / 50) * 50)},
        brt: {name: 'BRT bus', speed: 1.15, traffic: 0.45, rates: {comfort: -4}, note: 'Has its own lane. Usually.',
            cost: () => 700},
        ride: {name: 'Ride-hailing', speed: 1.5, traffic: 0.85, rates: {comfort: 2}, note: 'AC on. Surge pricing at rush hour.',
            cost: (d, rush) => Math.round((1500 + d * 45) * (rush ? 1.5 : 1) / 100) * 100}
    };

    const CAREERS = {
        tech: {name: 'Tech', loc: 'hub', days: [0, 1, 2, 3, 4], start: 9, end: 17, skill: 'coding',
            blurb: 'Write code in Yaba. Pay grows fast once your Coding is up.',
            levels: [['Intern', 3500, 0], ['Junior Developer', 7000, 2], ['Developer', 13000, 4], ['Senior Developer', 24000, 6], ['Engineering Manager', 40000, 8], ['CTO', 75000, 10]]},
        bank: {name: 'Banking', loc: 'bank', days: [0, 1, 2, 3, 4], start: 8, end: 18, skill: 'business',
            blurb: 'Long hours in VI. Steady pay that rewards Business skill.',
            levels: [['Teller', 4000, 0], ['Customer Service Officer', 7000, 2], ['Relationship Manager', 12500, 4], ['Branch Manager', 22000, 6], ['Regional Director', 38000, 8], ['Managing Director', 70000, 10]]},
        nolly: {name: 'Nollywood', loc: 'set', days: [1, 2, 3, 4, 5], start: 10, end: 19, skill: 'charisma',
            blurb: 'Act in Surulere, Tuesday to Saturday. Charisma makes stars.',
            levels: [['Extra', 2500, 0], ['Bit-part Actor', 5000, 2], ['Supporting Actor', 10000, 4], ['Lead Actor', 20000, 6], ['Nollywood Star', 42000, 8], ['Producer', 80000, 10]]},
        trade: {name: 'Trading', loc: 'market', days: [0, 1, 2, 3, 4, 5], start: 8, end: 18, skill: 'business',
            blurb: 'Sell at Balogun, Monday to Saturday. Income swings day to day.',
            levels: [['Hawker', 3000, 0], ['Stall Owner', 6000, 2], ['Shop Owner', 11000, 4], ['Wholesaler', 21000, 6], ['Importer', 38000, 8], ['Balogun Big Boss', 72000, 10]]}
    };

    const ALL_DAYS = [0, 1, 2, 3, 4, 5, 6];
    const NPCS = {
        tunde: {name: 'Tunde', role: 'Backend developer', skin: '#5a3825', outfit: '#2f6fd0', likes: 'coding',
            where: [{loc: 'hub', days: [0, 1, 2, 3, 4], from: 9, to: 19}, {loc: 'suya', days: ALL_DAYS, from: 19, to: 23}]},
        chiamaka: {name: 'Chiamaka', role: 'Investment banker', skin: '#8d5b3a', outfit: '#8e44ad', likes: 'business',
            where: [{loc: 'bank', days: [0, 1, 2, 3, 4], from: 8, to: 18}, {loc: 'beach', days: [5, 6], from: 12, to: 18}, {loc: 'freedom', days: [4], from: 19, to: 24}]},
        aisha: {name: 'Aisha', role: 'Nollywood actress', skin: '#a86f45', outfit: '#e04f8a', likes: 'charisma',
            where: [{loc: 'set', days: [1, 2, 3, 4], from: 10, to: 19}, {loc: 'owambe', days: [5], from: 13, to: 22}, {loc: 'mall', days: [6], from: 12, to: 20}]},
        femi: {name: 'Femi', role: 'Danfo driver', skin: '#3f2618', outfit: '#f5c11a', likes: 'fitness',
            where: [{loc: 'buka', days: ALL_DAYS, from: 11, to: 16}, {loc: 'freedom', days: [4, 5, 6], from: 18, to: 24}, {loc: 'station', days: ALL_DAYS, from: 6, to: 9}]},
        nkechi: {name: 'Mama Nkechi', role: 'Owns the buka', skin: '#7b4a2e', outfit: '#d6623f', likes: 'cooking',
            where: [{loc: 'buka', days: [0, 1, 2, 3, 4, 5], from: 7, to: 21}]},
        kola: {name: 'Kola', role: 'Gym instructor', skin: '#5a3825', outfit: '#45a86d', likes: 'fitness',
            where: [{loc: 'gym', days: ALL_DAYS, from: 6, to: 13}, {loc: 'beach', days: [6], from: 14, to: 19}]},
        bisola: {name: 'Aunty Bisola', role: 'Owambe queen, fabric seller', skin: '#8d5b3a', outfit: '#f5c11a', likes: 'business',
            where: [{loc: 'market', days: [0, 1, 2, 3, 4], from: 9, to: 17}, {loc: 'owambe', days: [5], from: 12, to: 23}]},
        emeka: {name: 'Emeka', role: 'Phone accessories trader', skin: '#7b4a2e', outfit: '#2f6fd0', likes: 'business',
            where: [{loc: 'market', days: [0, 1, 2, 3, 4, 5], from: 8, to: 18}, {loc: 'suya', days: [4, 5], from: 20, to: 25}, {loc: 'mall', days: [6], from: 13, to: 19}]}
    };

    // Home layout. Rooms: bedroom (top-left), bathroom (bottom-left), open-plan
    // living + kitchen (right), yard outside the front door (far right).
    const OBJ = {
        bed: {x: 36, y: 36, w: 100, h: 150, spot: [158, 110], label: 'Bed', acts: ['sleep', 'nap']},
        wardrobe: {x: 160, y: 26, w: 58, h: 24, deco: true},
        mirror: {x: 232, y: 26, w: 40, h: 10, spot: [252, 70], label: 'Mirror', acts: ['speech'], buy: 'mirror'},
        weights: {x: 180, y: 178, w: 70, h: 30, spot: [215, 158], label: 'Dumbbells', acts: ['workout'], buy: 'weights'},
        sink: {x: 40, y: 246, w: 50, h: 24, deco: true},
        toilet: {x: 142, y: 246, w: 38, h: 44, deco: true},
        bucket: {x: 36, y: 344, w: 58, h: 58, spot: [118, 368], label: 'Bucket & shower', acts: ['bath']},
        art: {x: 336, y: 24, w: 48, h: 10, deco: true, buy: 'art'},
        books: {x: 300, y: 64, w: 26, h: 84, spot: [348, 104], label: 'Bookshelf', acts: ['read'], buy: 'books'},
        tv: {x: 404, y: 26, w: 130, h: 14, spot: [468, 170], label: 'TV', acts: ['nolly', 'football']},
        ac: {x: 548, y: 24, w: 78, h: 14, spot: [586, 70], label: 'Air conditioner', acts: ['acToggle'], buy: 'ac'},
        sofa: {x: 394, y: 150, w: 150, h: 50, spot: [468, 170], label: 'Sofa', acts: ['relax', 'nolly', 'football']},
        fan: {x: 600, y: 210, w: 24, h: 24, deco: true},
        desk: {x: 590, y: 92, w: 40, h: 92, spot: [566, 138], label: 'Desk & laptop', acts: ['code', 'freelance'], buy: 'laptop'},
        stove: {x: 230, y: 384, w: 64, h: 30, spot: [262, 360], label: 'Gas cooker', acts: ['cook', 'snack']},
        fridge: {x: 304, y: 372, w: 44, h: 44, spot: [326, 352], label: 'Fridge', acts: ['leftovers', 'checkFridge']},
        freezer: {x: 358, y: 380, w: 60, h: 34, spot: [388, 358], label: 'Chest freezer', acts: ['leftovers', 'checkFridge'], buy: 'freezer'},
        table: {x: 470, y: 316, w: 84, h: 52, deco: true},
        door: {x: 634, y: 298, w: 12, h: 54, spot: [612, 325], label: 'Front door', acts: ['goOut']},
        gen: {x: 662, y: 378, w: 50, h: 34, spot: [686, 356], label: 'Generator', acts: ['genToggle', 'jerrycan']},
        solar: {x: 660, y: 40, w: 52, h: 70, deco: true, buy: 'solar'}
    };

    const SHOP = [
        {id: 'art', name: 'Ankara wall art', price: 25000, desc: 'A little colour. Comfort drains slower.'},
        {id: 'mirror', name: 'Standing mirror', price: 30000, desc: 'Practise speeches to build Charisma.'},
        {id: 'books', name: 'Bookshelf & business books', price: 45000, desc: 'Read to build Business.'},
        {id: 'weights', name: 'Dumbbell set', price: 65000, desc: 'Work out at home to build Fitness.'},
        {id: 'bed_ortho', name: 'Orthopaedic mattress', price: 220000, desc: 'Sleep restores energy 40% faster.'},
        {id: 'freezer', name: 'Chest freezer', price: 260000, desc: 'Stores 14 meals and keeps food through short outages.'},
        {id: 'laptop', name: 'Laptop & desk', price: 380000, desc: 'Practise coding and take freelance gigs.'},
        {id: 'ac', name: 'Split air conditioner', price: 480000, desc: 'Comfort climbs while it runs. Uses power.'},
        {id: 'tv_big', name: '55" smart TV', price: 520000, desc: 'TV is 50% more fun.'},
        {id: 'solar', name: 'Solar panels & inverter', price: 1600000, desc: 'Your house never loses power again.'}
    ];

    // Actions. rates are need changes per game hour; decay multiplies normal
    // need decay while the action runs; skill is skill gain per hour.
    const ACT = {
        // --- Home ---
        sleep: {label: 'Sleep', dur: 600, ff: true, bubble: 'Zzz', pose: 'lie',
            rates: () => ({energy: S.owned.bed_ortho ? 17.5 : 12.5, comfort: homePowered() ? 3 : 0}),
            decay: {hunger: 0.45, fun: 0, social: 0, hygiene: 0.5, comfort: 0.5},
            until: () => S.needs.energy >= 99.5},
        nap: {label: 'Take a nap', dur: 90, ff: true, bubble: 'Zzz', pose: 'lie', rates: () => ({energy: 14}), decay: {fun: 0.3, social: 0.3}},
        speech: {label: 'Practise a speech', dur: 60, bubble: 'Ladies and gentlemen…', skill: {charisma: 0.4}, rates: () => ({fun: -2})},
        workout: {label: 'Lift weights', dur: 60, bubble: 'Push!', skill: {fitness: 0.45}, rates: () => ({energy: -10, hygiene: -14, fun: 4})},
        bath: {label: 'Take a bucket bath', dur: 25, bubble: 'Splash', rates: () => ({hygiene: 230, comfort: 20}), until: () => S.needs.hygiene >= 99.5},
        read: {label: 'Read a business book', dur: 90, bubble: 'Reading', skill: {business: 0.38}, rates: () => ({fun: 3, comfort: 5})},
        nolly: {label: 'Watch Nollywood', dur: 90, bubble: 'Ehn ehn!', needsPower: true,
            rates: () => ({fun: S.owned.tv_big ? 45 : 30, comfort: 6})},
        football: {label: 'Watch Premier League', dur: 105, bubble: 'GOAL!', needsPower: true,
            req: () => (dow() >= 5 && hour() >= 12 && hour() < 21 ? null : 'Matches on Sat & Sun, 12:00–21:00'),
            rates: () => ({fun: S.owned.tv_big ? 55 : 40, social: 8})},
        relax: {label: 'Relax on the sofa', dur: 60, bubble: 'Chilling', rates: () => ({comfort: 30, fun: 6, energy: 3})},
        code: {label: 'Practise coding', dur: 120, bubble: 'Debugging', needsPower: true, skill: {coding: 0.45}, rates: () => ({fun: -3, energy: -3})},
        freelance: {label: 'Do a freelance gig', dur: 180, bubble: 'Client dey call', needsPower: true,
            req: () => (S.skills.coding >= 2 ? null : 'Needs Coding 2'),
            skill: {coding: 0.15}, rates: () => ({fun: -6, energy: -5}),
            end: (done) => { const pay = Math.round(2500 * (1 + S.skills.coding) * done / 100) * 100; earn(pay, 'Freelance client paid'); }},
        cook: {label: 'Cook jollof rice', dur: 75, bubble: 'Stirring', skill: {cooking: 0.4},
            req: () => (S.food.groceries > 0 ? null : 'No foodstuff. Buy some at the market or mall'),
            start: () => { S.food.groceries--; },
            end: (done) => {
                if (done < 100) return;
                const servings = 2 + (S.skills.cooking >= 5 ? 1 : 0);
                S.food.leftovers = Math.min(fridgeCap(), S.food.leftovers + servings);
                addNeed('hunger', 45 + S.skills.cooking * 3);
                if (S.skills.cooking >= 4) buff('sweet', 'Sweet jollof', 8, 360);
                log(`You cooked jollof and ate. ${servings} plates went into the fridge.`, 'good');
            }},
        snack: {label: 'Eat bread & akara', cost: 1200, dur: 15, bubble: 'Chewing', end: () => addNeed('hunger', 22)},
        leftovers: {label: 'Eat leftover jollof', dur: 20, bubble: 'Mmm',
            req: () => (S.food.leftovers > 0 ? null : 'No leftovers'),
            end: (done) => { if (done < 100) return; S.food.leftovers--; addNeed('hunger', 42); }},
        checkFridge: {label: 'Check what\'s inside', dur: 2, instant: true,
            end: () => log(`Fridge: ${S.food.leftovers}/${fridgeCap()} plates of food. Kitchen: ${S.food.groceries} bags of foodstuff.`)},
        acToggle: {label: () => (S.acOn ? 'Turn AC off' : 'Turn AC on'), dur: 2, instant: true,
            end: () => { S.acOn = !S.acOn; log(S.acOn ? 'AC on. Cold air, finally.' : 'AC off.'); }},
        genToggle: {label: () => (S.genOn ? 'Switch generator off' : 'Start the generator'), dur: 3, instant: true,
            req: () => (!S.genOn && S.fuel <= 0 ? 'No fuel in the tank' : null),
            end: () => {
                S.genOn = !S.genOn;
                log(S.genOn ? (S.power.on ? 'Generator running, even though there\'s light. Your neighbours are confused.' : 'Generator on. Light is back, sort of.') : 'Generator off. Peace and quiet.');
            }},
        jerrycan: {label: 'Buy 10L from the jerrycan seller', dur: 10, cost: () => Math.round(13000 * fuelMult()),
            req: () => (S.fuel >= 15 ? 'Tank is nearly full' : null),
            end: (done) => { if (done >= 100) { S.fuel = Math.min(20, S.fuel + 10); log('You bought 10 litres of fuel at a premium. The seller is smiling.'); } }},
        goOut: {label: 'Go out', dur: 1, instant: true, end: () => openMap()},

        // --- Phone (anywhere) ---
        scroll: {label: 'Scroll social media', dur: 30, phone: true, bubble: 'Lol', rates: () => ({fun: 26, social: 10})},
        order: {label: 'Order food delivery', cost: 7500, dur: 50, phone: true, homeOnly: true, bubble: 'Rider don reach?',
            end: (done) => { if (done >= 100) { addNeed('hunger', 55); log('The rider finally found your street. Food don land.', 'good'); } }},

        // --- Locations ---
        meetup: {label: 'Attend the tech meetup', dur: 120, loc: 'hub', bubble: 'Networking',
            req: () => ((dow() === 1 || dow() === 3) && hour() >= 18 && hour() < 21 ? null : 'Tue & Thu, 18:00–21:00'),
            skill: {coding: 0.25, charisma: 0.15}, rates: () => ({social: 26, fun: 10}),
            end: (done) => { if (done >= 100) { addNeed('hunger', 20); log('Free pizza at the meetup. Nobody touched the salad.'); } }},
        cowork: {label: 'Buy a day pass and code', cost: 3500, dur: 180, loc: 'hub', bubble: 'Shipping', skill: {coding: 0.5}, rates: () => ({fun: -2, comfort: 4})},
        watchShoot: {label: 'Watch the shoot', dur: 60, loc: 'set', bubble: 'Action!', skill: {charisma: 0.1}, rates: () => ({fun: 24})},
        groceriesMarket: {label: 'Buy foodstuff · 4 bags', cost: 7000, dur: 30, loc: 'market', bubble: 'How much?',
            req: () => (S.food.groceries >= 10 ? 'Your kitchen is full' : null),
            end: (done) => { if (done >= 100) { S.food.groceries = Math.min(12, S.food.groceries + 4); log('Rice, tomatoes, pepper and onions sorted.'); } }},
        haggle: {label: 'Haggle with traders', dur: 45, loc: 'market', bubble: 'Last price?', skill: {charisma: 0.3, business: 0.25}, rates: () => ({fun: 6, energy: -4})},
        asoebi: {label: 'Buy aso-ebi fabric', cost: 15000, dur: 20, loc: 'market', bubble: 'This colour?',
            req: () => (S.asoebi ? 'You already have aso-ebi' : null),
            end: (done) => { if (done >= 100) { S.asoebi = true; log('You bought aso-ebi for Saturday\'s owambe. Gele go loud.', 'good'); } }},
        amala: {label: 'Eat amala & ewedu', cost: 2500, dur: 40, loc: 'buka', bubble: 'Mama, add meat', rates: () => ({social: 18}),
            end: (done) => { if (done >= 100) addNeed('hunger', 55); }},
        suyaEat: {label: 'Buy suya & a cold drink', cost: 4500, dur: 30, loc: 'suya', bubble: 'Extra yaji',
            end: (done) => { if (done >= 100) { addNeed('hunger', 35); addNeed('fun', 15); buff('suya', 'Suya don enter', 8, 240); } }},
        groceriesMall: {label: 'Supermarket run · 4 bags', cost: 9500, dur: 35, loc: 'mall', bubble: 'Shopping',
            req: () => (S.food.groceries >= 10 ? 'Your kitchen is full' : null),
            end: (done) => { if (done >= 100) { S.food.groceries = Math.min(12, S.food.groceries + 4); log('Supermarket run done. Pricier than Balogun, but air-conditioned.'); } }},
        cinema: {label: 'Watch a movie', cost: 6000, dur: 120, loc: 'mall', bubble: 'Popcorn', rates: () => ({fun: 40, comfort: 12})},
        fuel: {label: 'Buy 10L of fuel', cost: () => Math.round(10000 * fuelMult()), loc: 'station', bubble: 'Queue',
            dur: () => (S.flags.scarcity >= S.day ? 120 : 20),
            req: () => (S.fuel >= 15 ? 'Generator tank is nearly full' : null),
            end: (done) => { if (done >= 100) { S.fuel = Math.min(20, S.fuel + 10); log('10 litres in the jerrycan. Your generator will thank you.'); } }},
        beachChill: {label: 'Rent a chair by the water', cost: 3000, dur: 120, loc: 'beach', bubble: 'Vibes', rates: () => ({fun: 24, comfort: 14, social: 10})},
        swim: {label: 'Swim (careful o)', dur: 60, loc: 'beach', bubble: 'Splash', skill: {fitness: 0.3}, rates: () => ({fun: 30, energy: -10, hygiene: -12})},
        gymWorkout: {label: 'Work out', cost: 4000, dur: 75, loc: 'gym', bubble: 'One more!', skill: {fitness: 0.55}, rates: () => ({energy: -13, hygiene: -22, fun: 5})},
        liveMusic: {label: 'Live highlife night', cost: 3000, dur: 120, loc: 'freedom', bubble: 'Dancing',
            req: () => (dow() >= 4 && hour() >= 18 ? null : 'Fri–Sun from 18:00'), rates: () => ({fun: 40, social: 20})},
        chillPark: {label: 'Hang out under the trees', dur: 60, loc: 'freedom', bubble: 'Chilling', rates: () => ({fun: 12, comfort: 10, social: 10})},
        dance: {label: 'Dance', dur: 60, loc: 'owambe', bubble: 'Shaku shaku', skill: {fitness: 0.2}, rates: () => ({fun: 50, social: 15, energy: -10})},
        partyJollof: {label: 'Eat party jollof', dur: 30, loc: 'owambe', bubble: 'Smoky!',
            req: () => (S.partyFoodDay === S.day ? 'You already ate. Don\'t be greedy' : null),
            end: (done) => { if (done >= 100) { S.partyFoodDay = S.day; addNeed('hunger', 60); addNeed('fun', 5); log('Party jollof. Smoky bottom-pot goodness.', 'good'); } }},
        spray: {label: 'Spray money', cost: 10000, dur: 10, loc: 'owambe', bubble: 'Spraying ₦',
            end: (done) => {
                if (done < 100) return;
                S.stats.sprayed++;
                addNeed('fun', 25); addNeed('social', 20); gainSkill('charisma', 0.5);
                buff('spray', 'Big spender energy', 12, 360);
                log('You sprayed crisp naira notes on the celebrants. The DJ shouted your name.', 'good');
            }},
        work: {label: 'Work', ff: true, bubble: 'Working', dur: () => Math.max(30, CAREERS[S.career.id].end * 60 - S.minute),
            rates: () => ({energy: -1.5, fun: -0.5, social: 4}), decay: {comfort: 0.6, hunger: 0.8},
            req: workReq, start: workStart, tick: workTick, end: workEnd},
        passout: {label: 'Passed out', dur: 180, ff: true, bubble: 'Zzz', pose: 'lie', rates: () => ({energy: 12}), decay: {fun: 0.3, social: 0.3}}
    };

    const LOC_ACTS = {
        hub: ['work', 'meetup', 'cowork'],
        station: ['fuel'],
        set: ['work', 'watchShoot'],
        buka: ['amala'],
        suya: ['suyaEat'],
        mall: ['groceriesMall', 'cinema'],
        market: ['work', 'groceriesMarket', 'haggle', 'asoebi'],
        freedom: ['liveMusic', 'chillPark'],
        owambe: ['dance', 'partyJollof', 'spray'],
        bank: ['work'],
        gym: ['gymWorkout'],
        beach: ['beachChill', 'swim']
    };

    const SOCIAL = {
        greet: {label: 'Greet', dur: 5},
        gist: {label: 'Gist', dur: 30},
        joke: {label: 'Crack a joke', dur: 10},
        interest: {label: 'Talk about what they like', dur: 20},
        flirt: {label: 'Flirt', dur: 15},
        askOut: {label: 'Ask them out', dur: 10},
        borrow: {label: 'Borrow ₦20,000', dur: 10}
    };

    const GOALS = [
        {id: 'pay', label: 'Collect your first pay', reward: 5000, test: () => S.stats.earned > 0},
        {id: 'padi', label: 'Make 3 padis', reward: 10000, test: () => Object.values(S.rel).filter(r => r.f >= 20).length >= 3},
        {id: 'skill5', label: 'Reach level 5 in any skill', reward: 20000, test: () => Object.values(S.skills).some(v => v >= 5)},
        {id: 'laptop', label: 'Buy a laptop', reward: 0, test: () => !!S.owned.laptop},
        {id: 'spray', label: 'Spray money at an owambe', reward: 0, test: () => S.stats.sprayed > 0},
        {id: 'promo', label: 'Get promoted twice', reward: 50000, test: () => S.stats.promotions >= 2},
        {id: 'boo', label: 'Find a boo', reward: 0, test: () => !!S.dating},
        {id: 'solar', label: 'Go solar and forget NEPA', reward: 0, test: () => !!S.owned.solar},
        {id: 'lekki', label: 'Move to Lekki or Banana Island', reward: 0, test: () => S.home === 'lekki' || S.home === 'banana'},
        {id: 'rich', label: 'Have ₦5,000,000 in your account', reward: 0, test: () => S.money >= 5e6},
        {id: 'top', label: 'Reach the top of your career', reward: 0, test: () => !!S.career && S.career.level === CAREERS[S.career.id].levels.length - 1}
    ];

    const EVENTS = {
        cousin: {title: 'Family voice note', when: () => S.money >= 15000,
            text: () => 'Your cousin Dayo in Ibadan needs ₦15,000 for his WAEC registration. He sent three voice notes.',
            choices: [
                {label: 'Send ₦15,000', run: () => { S.money -= 15000; buff('family', 'Helped family', 10, 1440); log('You sent Dayo the money. Your mum called to pray for you.', 'good'); }},
                {label: 'Leave him on read', run: () => { buff('guilty', 'Left Dayo on read', -6, 720); log('You left Dayo on read. The family WhatsApp group has gone quiet.', 'bad'); }}
            ]},
        areaBoys: {title: 'Area boys', when: () => S.loc !== 'home' && !S.travel,
            text: () => '"Oga, how far? Wetin you carry for the boys?" Three area boys block your path.',
            choices: [
                {label: 'Give them ₦1,000', run: () => { S.money -= 1000; log('You paid ₦1,000 in "settlement". They wished you a blessed day.'); }},
                {label: 'Talk your way out', run: () => {
                    if (Math.random() < 0.3 + S.skills.charisma * 0.07) { gainSkill('charisma', 0.2); log('You talked them into laughing and walked off without paying.', 'good'); } else { S.money -= 2000; buff('area', 'Shaken by area boys', -8, 240); log('Your talk didn\'t land. You paid ₦2,000 instead.', 'bad'); }
                }}
            ]},
        rain: {title: 'Heavy rain', when: () => S.flags.flood < S.day,
            text: () => 'The sky opened. Lekki and VI are flooded and traffic is crawling. Every trip takes longer today.',
            choices: [{label: 'Okay', run: () => { S.flags.flood = S.day; }}]},
        scarcity: {title: 'Fuel scarcity', when: () => S.flags.scarcity < S.day,
            text: () => 'Petrol stations have long queues and the price has jumped. It should ease in two days.',
            choices: [{label: 'Okay', run: () => { S.flags.scarcity = S.day + 2; }}]},
        nepaBill: {title: 'Electricity bill', when: () => S.loc === 'home' && S.money >= 8000,
            text: () => 'The estate collector is at your door with an ₦8,000 electricity bill. You had about four hours of light this week.',
            choices: [
                {label: 'Pay ₦8,000', run: () => { S.money -= 8000; log('You paid for the light you didn\'t get.'); }},
                {label: 'Argue', run: () => {
                    if (Math.random() < 0.35 + S.skills.charisma * 0.06) { log('You argued well. The collector halved it to ₦4,000.', 'good'); S.money -= 4000; } else { S.money -= 8000; buff('bill', 'Lost the NEPA argument', -6, 360); log('You lost the argument and still paid ₦8,000.', 'bad'); }
                }}
            ]},
        jollofWar: {title: 'Jollof war', when: () => true,
            text: () => 'Ghanaians on X are claiming their jollof is better. Again.',
            choices: [
                {label: 'Defend Naija jollof', run: () => { addNeed('fun', 15); addNeed('social', 8); log('You posted a 12-tweet thread. It went mildly viral.', 'good'); }},
                {label: 'Stay out of it', run: () => log('You muted the word "jollof" for 24 hours.')}
            ]},
        found: {title: 'Lucky find', when: () => true,
            text: () => 'You found ₦2,000 in the pocket of your old jeans.',
            choices: [{label: 'Nice', run: () => { S.money += 2000; buff('lucky', 'Found money', 5, 240); }}]},
        owambeInvite: {title: 'Owambe invitation', when: () => dow() === 4 && !S.asoebi && S.money >= 15000,
            text: () => 'Aunty Bisola is celebrating her 60th at the Ikoyi Event Centre this Saturday. The aso-ebi is ₦15,000.',
            choices: [
                {label: 'Buy aso-ebi', run: () => { S.money -= 15000; S.asoebi = true; log('Aso-ebi secured. Saturday, Ikoyi Event Centre.', 'good'); }},
                {label: 'Maybe next time', run: () => log('You\'ll go in your regular clothes and endure the looks.')}
            ]}
    };

    // ---------------------------------------------------------------------
    // State
    // ---------------------------------------------------------------------
    let S = null;
    let modalOpen = false;
    let savedSpeed = 1;

    function newState(o) {
        return {
            v: 1,
            sim: {name: o.name, skin: o.skin, outfit: o.outfit},
            day: 1, minute: 7 * 60,
            money: 150000,
            needs: {hunger: 70, energy: 82, hygiene: 66, fun: 60, social: 55, comfort: 62},
            skills: {coding: 0, business: 0, charisma: 0, cooking: 0, fitness: 0},
            career: o.career ? {id: o.career, level: 0, perf: 40, attended: 0, warnings: 0} : null,
            home: 'yaba',
            owned: {},
            power: {on: true, until: 0},
            genOn: false, fuel: 6, acOn: false,
            food: {groceries: 3, leftovers: 1, darkHours: 0},
            loc: 'home',
            pos: {x: 158, y: 110},
            path: [], act: null, travel: null,
            rel: {}, dating: null,
            buffs: [],
            rentDue: 7, owing: 0,
            asoebi: false, partyFoodDay: 0,
            goals: {},
            stats: {earned: 0, promotions: 0, sprayed: 0},
            flags: {flood: 0, scarcity: 0, lastEvent: 0},
            idle: 0, freeWill: true, speed: 1,
            log: []
        };
    }

    const T = () => (S.day - 1) * 1440 + S.minute;
    const hour = () => Math.floor(S.minute / 60);
    const dow = () => (S.day - 1) % 7;
    const home = () => HOMES[S.home];
    const fridgeCap = () => (S.owned.freezer ? 14 : 6);
    const fuelMult = () => (S.flags.scarcity >= S.day ? 1.6 : 1);
    const genPower = () => S.genOn && S.fuel > 0;
    const homePowered = () => !!S.owned.solar || S.power.on || genPower();
    const atHome = () => S.loc === 'home' && !S.travel;

    function log(text, tone) {
        S.log.unshift({t: `${DAYS[dow()]} ${clock(S.minute)}`, text, tone: tone || ''});
        S.log.length = Math.min(S.log.length, 40);
        dirty.feed = true;
    }

    function addNeed(id, v) { S.needs[id] = clamp(S.needs[id] + v, 0, 100); }

    function gainSkill(id, amt) {
        const before = Math.floor(S.skills[id]);
        S.skills[id] = clamp(S.skills[id] + amt / (1 + before * 0.12), 0, 10);
        const after = Math.floor(S.skills[id]);
        if (after > before) {
            log(`${SKILLS[id]} skill is now level ${after}.`, 'good');
            buff('skill', 'Learnt something', 6, 240);
        }
    }

    function buff(id, label, val, mins) {
        S.buffs = S.buffs.filter(b => b.id !== id);
        S.buffs.push({id, label, val, until: T() + mins});
        dirty.side = true;
    }

    function earn(amount, why) {
        S.money += amount;
        S.stats.earned += amount;
        log(`${why}: +${naira(amount)}`, 'good');
    }

    function moodScore() {
        const vals = NEEDS.map(n => S.needs[n.id]);
        const low = vals.filter(v => v < 15).length;
        const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
        const b = S.buffs.reduce((a, x) => a + x.val, 0);
        return clamp((avg - 50) * 2 + b - low * 10, -100, 100);
    }
    function moodInfo(m) {
        if (m < -45) return {label: 'E don do me', sub: 'Miserable', color: '#e5513f'};
        if (m < -10) return {label: 'Managing', sub: 'Tense', color: '#f08a3c'};
        if (m < 25) return {label: 'I dey kampe', sub: 'Fine', color: '#f5c11a'};
        if (m < 60) return {label: 'Body dey sweet me', sub: 'Happy', color: '#8fd16a'};
        return {label: 'Enjoyment!', sub: 'Thriving', color: '#45a86d'};
    }

    function relOf(id) {
        if (!S.rel[id]) S.rel[id] = {f: 0, r: 0, met: false, greet: 0, borrow: -99};
        return S.rel[id];
    }
    function relLabel(r) {
        if (r.f < 0) return 'Not on good terms';
        if (r.f < 20) return 'Acquaintance';
        if (r.f < 50) return 'Padi';
        if (r.f < 80) return 'Close padi';
        return 'Bestie';
    }

    function isOpen(loc, m = S.minute, d = dow()) {
        const L = LOCS[loc];
        const h = m / 60;
        const [a, b] = L.open;
        if (b > 24) {
            // open past midnight; the early hours count as the previous day
            if (h >= a) return !L.days || L.days.includes(d);
            if (h < b - 24) return !L.days || L.days.includes((d + 6) % 7);
            return false;
        }
        return h >= a && h < b && (!L.days || L.days.includes(d));
    }
    function openLabel(loc) {
        const L = LOCS[loc];
        const [a, b] = L.open;
        const hrs = a === 0 && b === 24 ? '24 hours' : `${pad(a)}:00–${pad(b % 24)}:00`;
        const days = L.days ? (L.days.length === 1 ? DAYS[L.days[0]] : `${DAYS[L.days[0]]}–${DAYS[L.days[L.days.length - 1]]}`) : 'Daily';
        return `${days}, ${hrs}`;
    }

    function npcsAt(loc) {
        const h = S.minute / 60;
        const d = dow();
        return Object.keys(NPCS).filter(id => NPCS[id].where.some(w => {
            if (w.loc !== loc) return false;
            if (w.to > 24 && h < w.to - 24) return w.days.includes((d + 6) % 7);
            return w.days.includes(d) && h >= w.from && h < w.to;
        }));
    }

    // ---------------------------------------------------------------------
    // Careers
    // ---------------------------------------------------------------------
    function isWorkday() {
        return !!S.career && CAREERS[S.career.id].days.includes(dow());
    }
    function workReq() {
        if (!S.career) return 'You need a job first';
        const C = CAREERS[S.career.id];
        if (S.loc !== C.loc) return `Your job is at ${LOCS[C.loc].name}`;
        if (!C.days.includes(dow())) return 'Not a workday';
        if (S.career.attended === S.day) return 'You already worked today';
        if (S.minute < (C.start - 1) * 60) return `Shift starts at ${pad(C.start)}:00`;
        if (S.minute >= C.end * 60 - 30) return 'Too late for today\'s shift';
        return null;
    }
    function workStart(a) {
        const C = CAREERS[S.career.id];
        S.career.attended = S.day;
        a.data.workedMins = 0;
        const late = S.minute - (C.start * 60 + 15);
        if (late > 0) {
            const pen = Math.round(late / 60 * 6 + 3);
            S.career.perf = clamp(S.career.perf - pen, 0, 100);
            log(`You arrived ${hoursLabel(late)} late. Your oga noticed.`, 'bad');
        }
    }
    function workTick(a, mins) {
        if (S.minute < CAREERS[S.career.id].start * 60) return; // waiting for shift to start
        a.data.workedMins += mins;
        const m = moodScore();
        const skillBonus = S.skills[CAREERS[S.career.id].skill] * 0.15;
        S.career.perf = clamp(S.career.perf + (mins / 60) * (1.6 + m / 40 + skillBonus), 0, 100);
    }
    function workEnd(done, a) {
        const C = CAREERS[S.career.id];
        const L = C.levels[S.career.level];
        const hrs = (a.data.workedMins || 0) / 60;
        let pay = L[1] * hrs;
        if (S.career.id === 'trade') pay *= rand(0.55, 1.6) * (1 + S.skills.business * 0.04);
        pay = Math.round(pay / 100) * 100;
        if (pay > 0) earn(pay, `${L[0]} pay`);
        if (done < 100) {
            S.career.perf = clamp(S.career.perf - 8, 0, 100);
            log('You left work early. Your oga will remember.', 'bad');
        }
        checkPromotion();
    }
    function checkPromotion() {
        const c = S.career;
        const C = CAREERS[c.id];
        if (c.perf < 100 || c.level >= C.levels.length - 1) return;
        const next = C.levels[c.level + 1];
        if (S.skills[C.skill] < next[2]) {
            if (!c.hinted || c.hinted !== c.level) {
                c.hinted = c.level;
                log(`Your oga says you need ${SKILLS[C.skill]} ${next[2]} to become ${next[0]}.`);
            }
            return;
        }
        c.level++;
        c.perf = 35;
        c.warnings = 0;
        S.stats.promotions++;
        buff('promo', 'Got promoted!', 20, 1440);
        log(`Promotion! You are now ${next[0]} on ${naira(next[1])}/hour.`, 'good');
    }
    function missedWorkCheck() {
        if (!isWorkday()) return;
        const C = CAREERS[S.career.id];
        if (S.minute === C.end * 60 && S.career.attended !== S.day) {
            S.career.perf = clamp(S.career.perf - 15, 0, 100);
            log(`You missed work at ${LOCS[C.loc].name} today.`, 'bad');
            if (S.career.perf <= 0) {
                S.career.warnings++;
                if (S.career.warnings >= 2) {
                    log(`You've been sacked from your ${C.name} job. Use your phone to find another.`, 'bad');
                    buff('sacked', 'Lost my job', -20, 2880);
                    S.career = null;
                } else {
                    log('Final warning from your oga. Miss again and you\'re out.', 'bad');
                }
            }
        }
    }

    // ---------------------------------------------------------------------
    // Actions engine
    // ---------------------------------------------------------------------
    const val = (v, ...args) => (typeof v === 'function' ? v(...args) : v);
    function actLabel(id) { return val(ACT[id].label); }

    function actBlocked(id, obj) {
        const A = ACT[id];
        if (S.travel) return 'You\'re on the road';
        if (A.homeOnly && !atHome()) return 'Only at home';
        if (A.loc && S.loc !== A.loc) return 'Not here';
        if (A.loc && !isOpen(A.loc)) return 'Closed now';
        if (obj && S.loc !== 'home') return 'Not here';
        if (A.needsPower && !homePowered()) return 'No light. NEPA took it';
        const r = A.req ? A.req() : null;
        if (r) return r;
        const cost = val(A.cost) || 0;
        if (cost > S.money) return `Costs ${naira(cost)}`;
        return null;
    }

    function startAct(id, obj, target) {
        const blocked = actBlocked(id, obj);
        if (blocked) { log(`Can't ${actLabel(id).toLowerCase()}: ${blocked}.`); return false; }
        cancelAct(true);
        const A = ACT[id];
        const cost = val(A.cost) || 0;
        const a = {id, obj, target, total: val(A.dur), left: val(A.dur), cost, phase: 'walk', data: {}};
        if (obj && S.loc === 'home') {
            S.path = routeTo(OBJ[obj].spot);
        } else {
            S.path = [];
        }
        S.act = a;
        S.idle = 0;
        if (!S.path.length) beginAct();
        dirty.now = true;
        return true;
    }

    function beginAct() {
        const a = S.act;
        const A = ACT[a.id];
        a.phase = 'do';
        if (a.cost) {
            if (S.money < a.cost) { log(`You don't have ${naira(a.cost)}.`, 'bad'); S.act = null; return; }
            S.money -= a.cost;
        }
        if (A.start) A.start(a);
        if (A.instant) finishAct(100);
    }

    function finishAct(done) {
        const a = S.act;
        if (!a) return;
        S.act = null;
        const A = a.id === 'social' ? SOCIAL_ACT : ACT[a.id];
        if (A.end) A.end(done, a);
        dirty.now = dirty.side = true;
    }

    function cancelAct(silent) {
        const a = S.act;
        if (!a) return;
        if (a.phase === 'do' && a.id !== 'social') {
            const pct = 100 * (1 - a.left / a.total);
            finishAct(pct);
        } else {
            S.act = null;
        }
        S.path = [];
        if (!silent) dirty.now = true;
    }

    function tickAct(mins) {
        const a = S.act;
        if (!a || a.phase !== 'do') return;
        const A = a.id === 'social' ? SOCIAL_ACT : ACT[a.id];
        if (A.needsPower && !homePowered()) {
            log(`NEPA took light in the middle of "${actLabel(a.id)}".`, 'bad');
            finishAct(100 * (1 - a.left / a.total));
            return;
        }
        const rates = A.rates ? A.rates(a) : {};
        for (const k in rates) addNeed(k, rates[k] * mins / 60);
        if (A.skill) for (const k in A.skill) gainSkill(k, A.skill[k] * mins / 60);
        if (A.tick) A.tick(a, mins);
        a.left -= mins;
        if (a.left <= 0 || (A.until && A.until())) finishAct(100);
    }

    // social actions run through the same engine
    const SOCIAL_ACT = {
        rates: a => (a.data.kind === 'gist' ? {social: 45, fun: 8} : {social: 25}),
        skill: null,
        end: (done, a) => resolveSocial(a.data.kind, a.data.npc, done)
    };

    function startSocial(kind, npc) {
        const r = relOf(npc);
        const blocked = socialBlocked(kind, npc, r);
        if (blocked) { log(blocked); return; }
        cancelAct(true);
        S.path = [];
        S.act = {id: 'social', total: SOCIAL[kind].dur, left: SOCIAL[kind].dur, phase: 'do', data: {kind, npc}};
        S.idle = 0;
        dirty.now = true;
    }

    function socialBlocked(kind, npc, r) {
        if (kind === 'flirt' && r.f < 30) return 'Not close enough to flirt yet (Padi level 30 needed).';
        if (kind === 'flirt' && S.dating && S.dating !== npc) return 'You\'re already dating someone. Lagos is small.';
        if (kind === 'askOut' && (r.r < 50 || S.dating)) return 'The romance isn\'t there yet.';
        if (kind === 'borrow' && r.f < 60) return 'You\'re not close enough to borrow money.';
        if (kind === 'borrow' && S.day - r.borrow < 7) return 'You borrowed recently. Give it a week.';
        return null;
    }

    function resolveSocial(kind, npc, done) {
        if (done < 100) return;
        const N = NPCS[npc];
        const r = relOf(npc);
        const ch = S.skills.charisma;
        r.met = true;
        const f0 = r.f;
        switch (kind) {
        case 'greet':
            if (r.greet !== S.day) { r.f += 3; r.greet = S.day; }
            log(`You greeted ${N.name}. "${pick(['How body?', 'Long time!', 'You dey fine o', 'Ah, see who dey come!'])}"`);
            break;
        case 'gist':
            r.f += 3 + ch * 0.5;
            gainSkill('charisma', 0.12);
            log(`You and ${N.name} gisted about ${pick(['the price of tomatoes', 'Lagos traffic', 'the latest Nollywood drama', 'whose wedding is next', 'Super Eagles', 'NEPA'])}.`);
            break;
        case 'joke':
            if (Math.random() < 0.35 + ch * 0.06) {
                r.f += 7; addNeed('fun', 10);
                log(`${N.name} laughed so hard they had to sit down.`, 'good');
            } else {
                r.f -= 4;
                log(`Your joke landed like an estimated electricity bill. ${N.name} just stared.`, 'bad');
            }
            break;
        case 'interest': {
            const sk = S.skills[N.likes] || 0;
            if (sk >= 2) { r.f += 5 + sk * 0.5; log(`You and ${N.name} went deep on ${SKILLS[N.likes].toLowerCase()}. Instant connection.`, 'good'); } else { r.f += 1; log(`You tried to talk ${SKILLS[N.likes].toLowerCase()} with ${N.name}. You were out of your depth.`); }
            break;
        }
        case 'flirt':
            if (Math.random() < 0.3 + ch * 0.06 + r.f / 250) {
                r.r += 12; addNeed('fun', 10);
                log(`${N.name} blushed. Something dey sup.`, 'good');
            } else {
                r.f -= 3; r.r -= 2;
                log(`${N.name}: "Abeg, face front."`, 'bad');
            }
            break;
        case 'askOut':
            if (Math.random() < 0.45 + r.r / 200 + ch * 0.03) {
                S.dating = npc; r.r += 15;
                buff('love', 'In love', 18, 2880);
                log(`${N.name} said yes! You're officially dating.`, 'good');
            } else {
                r.r -= 10;
                buff('rejected', 'Got turned down', -12, 720);
                log(`${N.name} said they need time to think. Ouch.`, 'bad');
            }
            break;
        case 'borrow':
            r.borrow = S.day; r.f -= 8; S.money += 20000;
            log(`${N.name} sent you ₦20,000. "Make you no forget me o."`);
            break;
        }
        r.f = clamp(r.f, -50, 100);
        r.r = clamp(r.r, 0, 100);
        if (f0 < 20 && r.f >= 20) log(`${N.name} is now your padi.`, 'good');
        dirty.side = true;
    }

    // ---------------------------------------------------------------------
    // Movement inside the home
    // ---------------------------------------------------------------------
    function roomOf(x, y) {
        if (x > 646) return 'yard';
        if (x < 290 && y < 230) return 'bed';
        if (x < 200 && y >= 230) return 'bath';
        return 'main';
    }
    const DOORS = {
        bed: {inner: [266, 196], outer: [322, 190]},
        bath: {inner: [176, 326], outer: [228, 326]},
        yard: {inner: [668, 326], outer: [618, 326]}
    };
    function routeTo(spot) {
        const from = roomOf(S.pos.x, S.pos.y);
        const to = roomOf(spot[0], spot[1]);
        const pts = [];
        if (from !== to) {
            if (from !== 'main') pts.push(DOORS[from].inner, DOORS[from].outer);
            if (to !== 'main') pts.push(DOORS[to].outer, DOORS[to].inner);
        }
        pts.push(spot);
        return pts.map(p => ({x: p[0], y: p[1]}));
    }

    function moveSim(dtReal) {
        if (!S.path.length) return;
        const speed = 190 * Math.min(2.2, Math.max(1, S.speed)) * dtReal;
        let budget = speed;
        while (budget > 0 && S.path.length) {
            const p = S.path[0];
            const dx = p.x - S.pos.x;
            const dy = p.y - S.pos.y;
            const d = Math.hypot(dx, dy);
            if (d <= budget) {
                S.pos.x = p.x; S.pos.y = p.y; budget -= d; S.path.shift();
            } else {
                S.pos.x += dx / d * budget; S.pos.y += dy / d * budget; budget = 0;
                facing = dx < 0 ? -1 : 1;
            }
        }
        if (!S.path.length && S.act && S.act.phase === 'walk') beginAct();
    }

    // ---------------------------------------------------------------------
    // Travel
    // ---------------------------------------------------------------------
    function areaOf(loc) { return loc === 'home' ? (S.home === 'banana' ? 'ikoyi' : S.home) : LOCS[loc].area; }
    function pinOf(loc) { return loc === 'home' ? home().pin : LOCS[loc].pin; }
    function isRush() {
        const h = hour();
        if (dow() >= 6) return false;
        if (dow() === 5) return h >= 11 && h < 16;
        return (h >= 6 && h < 10) || (h >= 16 && h < 21);
    }
    function tripInfo(to, modeId) {
        const from = S.loc;
        const [x1, y1] = pinOf(from);
        const [x2, y2] = pinOf(to);
        const d = Math.hypot(x2 - x1, y2 - y1);
        const M = MODES[modeId];
        const crossing = ISLAND.has(areaOf(from)) !== ISLAND.has(areaOf(to));
        const rush = isRush();
        let mins = 10 + d * 0.42 + (crossing ? 12 : 0);
        let factor = 1 + M.traffic * (rush ? 1.3 : 0.2) + (crossing && rush ? M.traffic * 0.4 : 0);
        if (S.flags.flood === S.day) factor *= 1.5;
        mins = Math.round(mins / M.speed * factor);
        return {mins, cost: M.cost(d, rush), heavy: rush && M.traffic > 0.6, crossing};
    }
    function startTravel(to, modeId) {
        const info = tripInfo(to, modeId);
        if (S.money < info.cost) { log(`You need ${naira(info.cost)} for that trip.`, 'bad'); return; }
        cancelAct(true);
        S.money -= info.cost;
        S.travel = {from: S.loc, to, mode: modeId, total: info.mins, left: info.mins, heavy: info.heavy, crossing: info.crossing};
        S.loc = 'road';
        S.path = [];
        closeModal();
        log(`${MODES[modeId].name} to ${to === 'home' ? 'home' : LOCS[to].name}. About ${hoursLabel(info.mins)}${info.heavy ? ', and there\'s go-slow' : ''}.`);
        dirty.now = dirty.head = true;
    }
    function tickTravel(mins) {
        const t = S.travel;
        const rates = MODES[t.mode].rates;
        for (const k in rates) addNeed(k, rates[k] * mins / 60);
        t.left -= mins;
        if (t.left <= 0) arrive();
    }
    function arrive() {
        const t = S.travel;
        S.travel = null;
        S.loc = t.to;
        if (t.heavy && t.total > 70) buff('goslow', 'Stuck in go-slow', -10, 180);
        if (t.to === 'home') {
            S.pos = {x: 612, y: 325};
            log('You\'re home.');
        } else {
            const L = LOCS[t.to];
            log(`You arrived at ${L.name}.${isOpen(t.to) ? '' : ' It\'s closed right now.'}`);
            if (t.to === 'owambe' && isOpen('owambe') && !S.asoebi) buff('outfit', 'Wrong outfit at owambe', -6, 300);
            npcsAt(t.to).forEach(id => { relOf(id).met = true; });
        }
        dirty.now = dirty.head = dirty.side = true;
    }

    // ---------------------------------------------------------------------
    // Simulation step (one game minute)
    // ---------------------------------------------------------------------
    function needDecay(id) {
        const N = NEEDS.find(n => n.id === id);
        let d = N.decay;
        if (id === 'comfort') {
            if (atHome()) {
                const powered = homePowered();
                const h = hour();
                const hot = h >= 10 && h < 18;
                if (powered && S.owned.ac && S.acOn) d = -5;
                else if (powered) d = 2.6;
                else d = hot ? 8 : 6;
                d -= home().comfort * 0.6 + (S.owned.art ? 0.5 : 0);
                if (genPower()) d += 1; // the noise
            } else if (S.loc !== 'road' && LOCS[S.loc] && LOCS[S.loc].cool) {
                d = 1.5;
            }
        }
        if (id === 'energy' && S.skills.fitness > 0) d *= 1 - S.skills.fitness * 0.025;
        const a = S.act;
        if (a && a.phase === 'do') {
            const A = a.id === 'social' ? null : ACT[a.id];
            if (A && A.decay && A.decay[id] !== undefined) d *= A.decay[id];
        }
        return d;
    }

    function stepMinute() {
        S.minute++;
        if (S.minute >= 1440) {
            S.minute = 0;
            S.day++;
            newDay();
        }
        // needs
        for (const n of NEEDS) {
            const d = needDecay(n.id);
            if (d > 0 || n.id === 'comfort') addNeed(n.id, -d / 60);
        }
        // travel or action
        if (S.travel) tickTravel(1);
        else tickAct(1);

        // generator fuel
        if (genPower() && !S.owned.solar) {
            const burn = 1.1 + (S.acOn && S.owned.ac ? 1.2 : 0);
            S.fuel = Math.max(0, S.fuel - burn / 60);
            if (S.fuel <= 0) { S.genOn = false; log('Generator coughed and died. Out of fuel.', 'bad'); }
        }
        // power restores
        if (!S.power.on && T() >= S.power.until) {
            S.power.on = true;
            if (S.genOn) { S.genOn = false; }
            if (atHome() && !S.owned.solar) log('UP NEPA! Light is back.', 'good');
            dirty.head = true;
        }
        if (S.minute % 60 === 0) hourly();
        if (S.career) missedWorkCheck();

        // exhaustion
        if (S.needs.energy <= 0 && !(S.act && ['sleep', 'nap', 'passout'].includes(S.act.id)) && !S.travel) {
            log('You were so tired you slept off right where you stood.', 'bad');
            cancelAct(true);
            S.path = [];
            S.act = {id: 'passout', total: 180, left: 180, phase: 'do', data: {}};
            buff('passout', 'Slept off in public', -8, 300);
        }

        // free will at home
        if (atHome() && !S.act && !S.path.length) {
            S.idle++;
            if (S.freeWill && S.idle >= 45) freeWill();
        } else {
            S.idle = 0;
        }
    }

    function hourly() {
        const t = T();
        S.buffs = S.buffs.filter(b => b.until > t);
        if (S.needs.hunger < 8) buff('starving', 'Starving', -20, 61);
        if (S.needs.hygiene < 10) buff('smelly', 'People are moving away from you', -10, 61);

        // power outages
        if (S.power.on && Math.random() < home().outage) {
            S.power.on = false;
            S.power.until = t + Math.round(rand(60, 420));
            if (atHome() && !S.owned.solar) log(pick(['NEPA took light.', 'Light don go. The whole street groaned at once.', 'Power cut. Somewhere a generator coughed to life.']), 'bad');
            dirty.head = true;
        }
        // food spoils after a long outage without the generator
        if (!homePowered()) {
            S.food.darkHours++;
            const limit = S.owned.freezer ? 14 : 8;
            if (S.food.darkHours >= limit && S.food.leftovers > 0) {
                log(`No light for ${S.food.darkHours} hours. ${S.food.leftovers} plates of food in the fridge have spoiled.`, 'bad');
                S.food.leftovers = 0;
            }
        } else {
            S.food.darkHours = 0;
        }

        // rent
        if (S.day >= S.rentDue && hour() === 9) payRent();

        // goals
        for (const g of GOALS) {
            if (!S.goals[g.id] && g.test()) {
                S.goals[g.id] = S.day;
                if (g.reward) S.money += g.reward;
                buff('goal', 'Achieved a goal', 10, 480);
                log(`Goal reached: ${g.label}${g.reward ? ` (+${naira(g.reward)})` : ''}.`, 'good');
            }
        }

        // random events: at most one every 10 hours, not while asleep
        const asleep = S.act && ['sleep', 'nap', 'passout'].includes(S.act.id);
        if (!asleep && !modalOpen && hour() >= 8 && hour() <= 22 && t - S.flags.lastEvent > 600 && Math.random() < 0.06) {
            const pool = Object.keys(EVENTS).filter(k => EVENTS[k].when());
            if (pool.length) { S.flags.lastEvent = t; showEvent(pick(pool)); }
        }
        if (S.money < -300000) gameOver();
        save();
        dirty.side = dirty.head = true;
    }

    function newDay() {
        if (dow() === 6 && S.asoebi && S.day > 1) {
            // aso-ebi is for one party only
            S.asoebi = false;
        }
        log(`${DAYS[dow()]}, day ${S.day}.`);
    }

    function payRent() {
        const rent = home().rent;
        S.rentDue += 7;
        if (S.money >= rent) {
            S.money -= rent;
            log(`Weekly rent of ${naira(rent)} paid to your landlord.`);
        } else {
            S.owing += rent;
            buff('owing', 'Owing the landlord', -15, 1440 * 7);
            log(`You couldn't pay rent. You now owe ${naira(S.owing)}. Landlord is "monitoring the situation".`, 'bad');
            if (S.owing >= rent * 3) evict();
        }
    }
    function evict() {
        if (S.home !== 'yaba') {
            log(`Evicted! You've moved back to a self-contain in Yaba. Your debt of ${naira(S.owing)} was written off in exchange for your caution fee.`, 'bad');
            S.home = 'yaba';
            S.owing = 0;
            S.pos = {x: 612, y: 325};
        } else {
            gameOver();
        }
    }

    function freeWill() {
        S.idle = 0;
        const n = S.needs;
        const order = NEEDS.map(x => x.id).filter(id => n[id] < 45).sort((a, b) => n[a] - n[b]);
        for (const id of order) {
            let opts = [];
            if (id === 'hunger') opts = [['leftovers', 'fridge'], ['cook', 'stove'], ['snack', 'stove']];
            if (id === 'energy') opts = hour() >= 21 || hour() < 6 || n.energy < 20 ? [['sleep', 'bed']] : [['nap', 'bed']];
            if (id === 'hygiene') opts = [['bath', 'bucket']];
            if (id === 'fun') opts = [['nolly', 'tv'], ['scroll', null], ['relax', 'sofa']];
            if (id === 'social') opts = [['scroll', null]];
            if (id === 'comfort') opts = [['relax', 'sofa']];
            for (const [a, o] of opts) {
                if (!actBlocked(a, o)) { startAct(a, o); return; }
            }
        }
    }

    // ---------------------------------------------------------------------
    // Saving
    // ---------------------------------------------------------------------
    function save() {
        try { localStorage.setItem(SAVE_KEY, JSON.stringify(S)); } catch (e) { /* storage unavailable */ }
    }
    function loadSave() {
        try {
            const raw = localStorage.getItem(SAVE_KEY);
            if (!raw) return null;
            const s = JSON.parse(raw);
            return s && s.v === 1 ? s : null;
        } catch (e) { return null; }
    }
    function clearSave() { try { localStorage.removeItem(SAVE_KEY); } catch (e) { /* ignore */ } }

    // ---------------------------------------------------------------------
    // DOM
    // ---------------------------------------------------------------------
    const app = document.getElementById('app');
    app.innerHTML = `
    <header class="topbar">
      <div class="brand">Lagos Life<small>Eko o ni baje</small></div>
      <div class="hud">
        <span class="chip" id="clock"></span>
        <span class="chip" id="power"></span>
        <span class="chip" id="money"></span>
        <span class="speed" role="group" aria-label="Game speed">
          <button type="button" data-speed="0" title="Pause (space)">❚❚</button>
          <button type="button" data-speed="1" title="Normal (1)">▶</button>
          <button type="button" data-speed="2" title="Fast (2)">▶▶</button>
          <button type="button" data-speed="3" title="Faster (3)">▶▶▶</button>
        </span>
      </div>
    </header>
    <main class="layout">
      <section class="stage" aria-label="Game">
        <div class="stage-head">
          <div class="place"><h2 id="place-name"></h2><p id="place-sub"></p></div>
          <div class="tools" id="tools"></div>
        </div>
        <div class="canvas-wrap">
          <canvas id="view" width="720" height="440" aria-label="Game view. Click objects and people to interact."></canvas>
          <div class="menu" id="menu" hidden></div>
        </div>
        <div class="now" id="now"></div>
      </section>
      <aside class="side" aria-label="Your life">
        <div class="tabs" role="tablist" id="tabs">
          <button type="button" role="tab" data-tab="needs" aria-selected="true">Needs</button>
          <button type="button" role="tab" data-tab="career" aria-selected="false">Work</button>
          <button type="button" role="tab" data-tab="skills" aria-selected="false">Skills</button>
          <button type="button" role="tab" data-tab="people" aria-selected="false">People</button>
          <button type="button" role="tab" data-tab="goals" aria-selected="false">Goals</button>
        </div>
        <div class="tab-body" id="tab-body"></div>
      </aside>
    </main>
    <section class="feed" aria-label="What's happening">
      <p class="section-label">Gist</p>
      <ol id="feed"></ol>
    </section>
    <div class="scrim" id="scrim" hidden><div class="modal" id="modal" role="dialog" aria-modal="true"></div></div>`;

    const $ = id => document.getElementById(id);
    const canvas = $('view');
    const ctx = canvas.getContext('2d');
    const menu = $('menu');
    const dirty = {head: true, side: true, now: true, feed: true};
    let tab = 'needs';
    let facing = 1;
    let hover = null;
    let hits = []; // clickable regions in the current scene

    function setupCanvas() {
        const dpr = Math.min(2, window.devicePixelRatio || 1);
        canvas.width = W * dpr;
        canvas.height = H * dpr;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    setupCanvas();

    // ---- top bar ----
    function renderHead() {
        $('clock').textContent = `${DAYS[dow()]} · Day ${S.day} · ${clock(S.minute)}`;
        const p = $('power');
        if (S.owned.solar) { p.textContent = 'Solar · always on'; p.className = 'chip power-on'; } else if (S.power.on) { p.textContent = 'Light dey'; p.className = 'chip power-on'; } else if (genPower()) { p.textContent = `Gen · ${S.fuel.toFixed(1)}L`; p.className = 'chip power-gen'; } else { p.textContent = 'NEPA took light'; p.className = 'chip power-off'; }
        $('money').textContent = naira(S.money);
        document.querySelectorAll('[data-speed]').forEach(b => b.setAttribute('aria-pressed', String(+b.dataset.speed === S.speed)));

        const nm = $('place-name');
        const sub = $('place-sub');
        const tools = [];
        if (S.travel) {
            nm.textContent = `On the way to ${S.travel.to === 'home' ? 'home' : LOCS[S.travel.to].name}`;
            sub.textContent = `${MODES[S.travel.mode].name} · about ${hoursLabel(Math.max(0, S.travel.left))} left`;
        } else if (S.loc === 'home') {
            nm.textContent = 'Home';
            sub.textContent = `${home().name} · rent ${naira(home().rent)}/week${S.owing ? ` · owing ${naira(S.owing)}` : ''}`;
            tools.push('<button class="btn primary" data-tool="map">Go out</button>', '<button class="btn" data-tool="phone">Phone</button>', '<button class="btn" data-tool="buy">Buy</button>', '<button class="btn" data-tool="housing">Housing</button>');
        } else {
            const L = LOCS[S.loc];
            nm.textContent = L.name;
            sub.textContent = `${isOpen(S.loc) ? 'Open' : 'Closed'} · ${openLabel(S.loc)} · ${L.blurb}`;
            tools.push('<button class="btn primary" data-tool="map">Go somewhere</button>', '<button class="btn" data-tool="phone">Phone</button>');
        }
        const html = tools.join('');
        const t = $('tools');
        if (t.dataset.html !== html) { t.innerHTML = html; t.dataset.html = html; }
    }

    // ---- "now" strip ----
    function renderNow() {
        const el = $('now');
        let html = '';
        if (S.travel) {
            const pct = 100 * (1 - S.travel.left / S.travel.total);
            html = `<div class="now-row"><span class="now-label">${esc(MODES[S.travel.mode].name)} ride${S.travel.heavy ? ' · go-slow' : ''}</span><div class="progress"><i style="width:${pct.toFixed(1)}%"></i></div></div>`;
        } else if (S.act) {
            const label = S.act.id === 'social' ? `${SOCIAL[S.act.data.kind].label} with ${NPCS[S.act.data.npc].name}` : actLabel(S.act.id);
            const pct = S.act.phase === 'do' ? 100 * (1 - S.act.left / S.act.total) : 0;
            html = `<div class="now-row"><span class="now-label">${esc(label)}</span><div class="progress"><i style="width:${clamp(pct, 0, 100).toFixed(1)}%"></i></div><button class="btn ghost" data-cancel>Stop</button></div>`;
        } else if (S.loc === 'home') {
            html = `<div class="now-row"><span class="now-hint">Click anything in the house to use it. ${esc(S.sim.name)} will look after themselves if you leave them idle.</span></div>`;
        }
        if (!S.travel && S.loc !== 'home') {
            const ids = (LOC_ACTS[S.loc] || []).filter(id => id !== 'work' || (S.career && CAREERS[S.career.id].loc === S.loc));
            const btns = ids.map(id => {
                const b = actBlocked(id);
                const cost = val(ACT[id].cost);
                const meta = [cost ? naira(cost) : '', id === 'work' ? workMeta() : hoursLabel(val(ACT[id].dur)), b && b !== 'Not here' ? b : ''].filter(Boolean).join(' · ');
                return `<button class="act-btn" data-act="${id}" ${b ? 'disabled' : ''}>${esc(actLabel(id))}<small>${esc(meta)}</small></button>`;
            }).join('');
            const people = npcsAt(S.loc).length ? '<span class="now-hint">Click someone to talk to them.</span>' : '<span class="now-hint">Nobody you know is here right now.</span>';
            html += `<div class="loc-actions">${btns}</div><div class="now-row">${people}</div>`;
        }
        if (el.dataset.html !== html) { el.innerHTML = html; el.dataset.html = html; }
    }
    function workMeta() {
        const C = CAREERS[S.career.id];
        return `${pad(C.start)}:00–${pad(C.end)}:00`;
    }

    // ---- side tabs ----
    function barColor(v) { return v > 60 ? 'var(--palm)' : v > 30 ? 'var(--danfo)' : 'var(--laterite)'; }
    function renderSide() {
        let html = '';
        if (tab === 'needs') {
            const m = moodScore();
            const mi = moodInfo(m);
            html += `<div class="mood"><span class="mood-dot" style="background:${mi.color}"></span><div><b>${esc(S.sim.name)}: ${mi.label}</b><span>${mi.sub} · mood ${Math.round(m)}</span></div></div>`;
            html += '<div class="bars">' + NEEDS.map(n => {
                const v = S.needs[n.id];
                return `<div class="bar"><span>${n.label}</span><span class="track"><i style="width:${v.toFixed(1)}%;background:${barColor(v)}"></i></span><span class="val">${Math.round(v)}</span></div>`;
            }).join('') + '</div>';
            const buffs = S.buffs.filter(b => b.until > T());
            html += '<p class="section-label">How they feel</p>';
            html += buffs.length ? `<div class="buffs">${buffs.map(b => `<span class="buff ${b.val >= 0 ? 'up' : 'down'}">${esc(b.label)} ${b.val > 0 ? '+' : ''}${b.val}</span>`).join('')}</div>` : '<p class="empty">Nothing in particular.</p>';
            html += `<dl class="kv"><dt>Foodstuff</dt><dd>${S.food.groceries} bags</dd><dt>Cooked food</dt><dd>${S.food.leftovers}/${fridgeCap()} plates</dd><dt>Generator fuel</dt><dd>${S.owned.solar ? 'Not needed' : S.fuel.toFixed(1) + 'L'}</dd><dt>Next rent</dt><dd>${DAYS[(S.rentDue - 1) % 7]} (day ${S.rentDue})</dd></dl>`;
            html += `<button class="btn ghost" data-freewill>${S.freeWill ? 'Free will on' : 'Free will off'}</button>`;
        } else if (tab === 'career') {
            if (!S.career) {
                html = '<p class="empty">You don\'t have a job. Use your phone to find one.</p><button class="btn primary" data-tool="jobs">Find a job</button>';
            } else {
                const C = CAREERS[S.career.id];
                const L = C.levels[S.career.level];
                const next = C.levels[S.career.level + 1];
                html += `<div><p class="section-label">${esc(C.name)}</p><h3 style="margin:2px 0 0;font-family:var(--display);font-weight:400;font-size:18px">${esc(L[0])}</h3></div>`;
                html += `<dl class="kv"><dt>Pay</dt><dd>${naira(L[1])}/hour</dd><dt>Where</dt><dd>${esc(LOCS[C.loc].name)}</dd><dt>Hours</dt><dd>${C.days.map(d => DAYS[d][0]).join(' ')} · ${pad(C.start)}–${pad(C.end)}</dd><dt>Today</dt><dd>${!C.days.includes(dow()) ? 'Day off' : S.career.attended === S.day ? 'Worked' : 'Not yet'}</dd></dl>`;
                html += `<div class="bars"><div class="bar"><span>Performance</span><span class="track"><i style="width:${S.career.perf}%;background:${barColor(S.career.perf)}"></i></span><span class="val">${Math.round(S.career.perf)}</span></div></div>`;
                html += next ? `<p class="empty">Next: ${esc(next[0])} at ${naira(next[1])}/hour. Needs performance 100 and ${SKILLS[C.skill]} ${next[2]} (you have ${S.skills[C.skill].toFixed(1)}). Good mood at work raises performance faster.</p>` : '<p class="empty">You\'re at the top. Enjoy it.</p>';
                html += '<button class="btn ghost" data-tool="jobs">Change jobs</button>';
            }
        } else if (tab === 'skills') {
            html += '<div class="bars">' + Object.keys(SKILLS).map(k => {
                const v = S.skills[k];
                return `<div class="bar"><span>${SKILLS[k]}</span><span class="track"><i style="width:${v * 10}%;background:var(--sky)"></i></span><span class="val">${v.toFixed(1)}</span></div>`;
            }).join('') + '</div>';
            html += '<p class="empty">Coding: laptop or the tech hub. Business: books, haggling. Charisma: mirror, gist, meetups. Cooking: the gas cooker. Fitness: dumbbells, the gym, swimming.</p>';
        } else if (tab === 'people') {
            const known = Object.keys(NPCS).filter(id => S.rel[id] && S.rel[id].met);
            html += known.length ? '<div class="people">' + known.map(id => {
                const N = NPCS[id];
                const r = S.rel[id];
                const love = S.dating === id ? ' · Dating ♥' : r.r >= 30 ? ' · Crush' : '';
                return `<div class="person"><span class="avatar" style="background:${N.skin};border-color:${N.outfit}"></span><div><b>${esc(N.name)}</b> <small>${esc(N.role)} · ${relLabel(r)} (${Math.round(r.f)})${love}</small></div></div>`;
            }).join('') + '</div>' : '<p class="empty">You haven\'t met anyone yet. Go out. Lagos is full of people.</p>';
            html += '<p class="empty">Call friends you\'ve met from your phone.</p>';
        } else if (tab === 'goals') {
            html += GOALS.map(g => `<div class="goal ${S.goals[g.id] ? 'done' : ''}"><span class="tick">${S.goals[g.id] ? '✓' : ''}</span><span>${esc(g.label)}${g.reward ? ` <small class="price">+${naira(g.reward)}</small>` : ''}</span></div>`).join('');
            html += '<button class="btn ghost" data-restart>Start a new life</button>';
        }
        $('tab-body').innerHTML = html;
        document.querySelectorAll('#tabs [data-tab]').forEach(b => b.setAttribute('aria-selected', String(b.dataset.tab === tab)));
    }

    function renderFeed() {
        $('feed').innerHTML = S.log.slice(0, 7).map(l => `<li class="${l.tone}"><time>${esc(l.t)}</time><span>${esc(l.text)}</span></li>`).join('');
    }

    // ---- menus ----
    function showMenu(x, y, title, items) {
        menu.innerHTML = `<h3>${esc(title)}</h3>` + items.map((it, i) => `<button type="button" data-mi="${i}" ${it.blocked ? 'disabled' : ''}>${esc(it.label)}${it.meta || it.blocked ? `<small>${esc([it.meta, it.blocked].filter(Boolean).join(' · '))}</small>` : ''}</button>`).join('');
        menu.hidden = false;
        const wrap = canvas.parentElement.getBoundingClientRect();
        const mw = menu.offsetWidth;
        const mh = menu.offsetHeight;
        menu.style.left = `${clamp(x, 8, wrap.width - mw - 8)}px`;
        menu.style.top = `${clamp(y, 8, Math.max(8, wrap.height - mh - 8))}px`;
        menu.onclick = e => {
            const b = e.target.closest('[data-mi]');
            if (!b || b.disabled) return;
            hideMenu();
            items[+b.dataset.mi].run();
        };
        const first = menu.querySelector('button:not(:disabled)');
        if (first) first.focus({preventScroll: true});
    }
    function hideMenu() { menu.hidden = true; }

    function objMenu(id, x, y) {
        const o = OBJ[id];
        const items = o.acts.map(a => {
            const A = ACT[a];
            const cost = val(A.cost);
            return {label: actLabel(a), meta: [cost ? naira(cost) : '', A.instant ? '' : hoursLabel(val(A.dur))].filter(Boolean).join(' · '), blocked: actBlocked(a, id), run: () => startAct(a, id)};
        });
        let title = o.label;
        if (id === 'gen') title = `Generator · ${S.fuel.toFixed(1)}L · ${S.genOn ? 'running' : 'off'}`;
        if (id === 'tv' || id === 'sofa') title = id === 'tv' ? 'TV' : 'Sofa';
        showMenu(x, y, title, items);
    }

    function npcMenu(id, x, y) {
        const N = NPCS[id];
        const r = relOf(id);
        r.met = true;
        const items = Object.keys(SOCIAL).filter(k => {
            if (k === 'askOut') return r.r >= 50 && !S.dating;
            if (k === 'flirt') return !S.dating || S.dating === id;
            return true;
        }).map(k => ({label: k === 'interest' ? `Talk about ${SKILLS[N.likes].toLowerCase()}` : SOCIAL[k].label, meta: hoursLabel(SOCIAL[k].dur), blocked: socialBlocked(k, id, r), run: () => startSocial(k, id)}));
        showMenu(x, y, `${N.name} · ${relLabel(r)}`, items);
        dirty.side = true;
    }

    function phoneMenu(anchor) {
        const items = [
            {label: 'Scroll social media', meta: '30m', blocked: actBlocked('scroll'), run: () => startAct('scroll')},
            {label: 'Order food delivery', meta: `${naira(7500)} · 50m`, blocked: actBlocked('order'), run: () => startAct('order')}
        ];
        Object.keys(NPCS).filter(id => S.rel[id] && S.rel[id].f >= 15).forEach(id => {
            items.push({label: `Call ${NPCS[id].name}`, meta: '30m', blocked: S.travel ? 'You\'re on the road' : null, run: () => startCall(id)});
        });
        items.push({label: S.career ? 'Look for a new job' : 'Look for a job', run: () => openJobs()});
        const r = anchor.getBoundingClientRect();
        const w = canvas.parentElement.getBoundingClientRect();
        showMenu(r.left - w.left, 8, 'Phone', items);
    }

    function startCall(id) {
        cancelAct(true);
        S.path = [];
        S.act = {id: 'social', total: 30, left: 30, phase: 'do', data: {kind: 'gist', npc: id}};
        log(`You called ${NPCS[id].name}.`);
        dirty.now = true;
    }

    // ---- modals ----
    function openModal(html, onClick, opts = {}) {
        const m = $('modal');
        m.innerHTML = html;
        $('scrim').hidden = false;
        modalOpen = true;
        if (opts.pause !== false) { savedSpeed = S ? S.speed : 1; if (S) S.speed = 0; }
        m.onclick = onClick;
        const f = m.querySelector('input, .btn.primary, button');
        if (f) f.focus({preventScroll: true});
        dirty.head = true;
    }
    function closeModal() {
        $('scrim').hidden = true;
        modalOpen = false;
        if (S && S.speed === 0) S.speed = savedSpeed || 1;
        dirty.head = true;
    }

    function openCreate(existing) {
        const st = {name: '', skin: SKIN[2], outfit: OUTFIT[0], career: 'tech'};
        const draw = () => `
      <h2>Lagos Life</h2>
      <p class="lede">You've just moved into a self-contain in Yaba with ${naira(150000)}, a tired generator and big dreams. Find work, make padis, survive NEPA and go-slow, and climb from Yaba to Banana Island.</p>
      ${existing ? '<div class="modal-actions" style="justify-content:flex-start"><button class="btn primary" data-continue>Continue your life</button></div><p class="section-label">Or start a new one</p>' : ''}
      <div class="field"><label for="sim-name">Your name</label><input id="sim-name" maxlength="18" placeholder="e.g. Ayo" value="${esc(st.name)}"></div>
      <div class="field"><span class="label">Skin tone</span><div class="swatches">${SKIN.map(c => `<button type="button" class="swatch" data-skin="${c}" aria-label="Skin tone" aria-pressed="${c === st.skin}" style="background:${c}"></button>`).join('')}</div></div>
      <div class="field"><span class="label">Ankara print</span><div class="swatches">${OUTFIT.map(c => `<button type="button" class="swatch" data-outfit="${c}" aria-label="Outfit colour" aria-pressed="${c === st.outfit}" style="background:${c}"></button>`).join('')}</div></div>
      <div class="field"><span class="label">Your first job</span><div class="options">${Object.keys(CAREERS).map(k => `<button type="button" class="option" data-career="${k}" aria-pressed="${k === st.career}"><b>${CAREERS[k].name} · ${CAREERS[k].levels[0][0]}</b><small>${CAREERS[k].blurb}</small></button>`).join('')}</div></div>
      <div class="modal-actions"><button class="btn primary" data-start>Start life</button></div>`;
        const rerender = () => {
            const name = $('sim-name') ? $('sim-name').value : st.name;
            st.name = name;
            $('modal').innerHTML = draw();
            const inp = $('sim-name');
            inp.addEventListener('input', () => { st.name = inp.value; });
        };
        openModal(draw(), e => {
            const t = e.target.closest('button');
            if (!t) return;
            if (t.dataset.skin) { st.skin = t.dataset.skin; rerender(); }
            if (t.dataset.outfit) { st.outfit = t.dataset.outfit; rerender(); }
            if (t.dataset.career) { st.career = t.dataset.career; rerender(); }
            if (t.hasAttribute('data-continue')) { closeModal(); }
            if (t.hasAttribute('data-start')) {
                const name = ($('sim-name').value || '').trim() || 'Ayo';
                S = newState({name, skin: st.skin, outfit: st.outfit, career: st.career});
                const C = CAREERS[st.career];
                log(`Welcome to Lagos, ${name}. You start as ${C.levels[0][0]} at ${LOCS[C.loc].name}, ${C.days.map(d => DAYS[d]).join('/')} from ${pad(C.start)}:00. Don't be late.`, 'good');
                log('Tip: click the front door or "Go out" to travel. Rush hour traffic is real.');
                savedSpeed = 1;
                closeModal();
                save();
                Object.keys(dirty).forEach(k => { dirty[k] = true; });
            }
        }, {pause: !!existing});
        const inp = $('sim-name');
        if (inp) inp.addEventListener('input', () => { st.name = inp.value; });
    }

    let mapSel = null;
    function openMap() {
        hideMenu();
        if (S.travel) return;
        const dests = ['home', ...Object.keys(LOCS)].filter(k => k !== S.loc);
        if (!mapSel || !dests.includes(mapSel)) mapSel = S.career && dests.includes(CAREERS[S.career.id].loc) ? CAREERS[S.career.id].loc : dests[0];
        openModal(mapHtml(dests), e => {
            const t = e.target.closest('[data-dest], [data-go], [data-close]');
            if (!t) return;
            if (t.dataset.dest) { mapSel = t.dataset.dest; $('modal').innerHTML = mapHtml(dests); }
            if (t.dataset.go) startTravel(mapSel, t.dataset.go);
            if (t.hasAttribute('data-close')) closeModal();
        });
    }
    function destName(k) { return k === 'home' ? `Home (${home().short})` : LOCS[k].name; }
    function mapHtml(dests) {
        const pins = dests.map(k => {
            const [x, y] = pinOf(k);
            const open = k === 'home' || isOpen(k);
            const col = k === 'home' ? '#f5c11a' : open ? '#d6623f' : '#888';
            const short = k === 'home' ? 'Home' : LOCS[k].name.replace(/^(The |Mama Nkechi's )/, '').split(' ').slice(0, 2).join(' ');
            return `<g class="pin ${k === mapSel ? 'sel' : ''} ${open ? '' : 'closed'}" data-dest="${k}" role="button" tabindex="0" aria-label="${esc(destName(k))}"><circle cx="${x}" cy="${y}" r="${k === 'home' ? 7 : 5.5}" fill="${col}"></circle><text x="${x + 8}" y="${y + 3}">${esc(short)}</text></g>`;
        }).join('');
        const here = pinOf(S.loc);
        const svg = `<svg viewBox="0 0 400 280" role="img" aria-label="Map of Lagos">
        <rect width="400" height="280" fill="#3d7f8f"></rect>
        <path d="M0,0 L400,0 L400,158 C340,164 280,158 228,166 C186,172 150,164 104,176 C64,184 30,172 0,176 Z" fill="#c9b98f"></path>
        <path d="M108,196 C150,186 212,184 262,188 C312,190 360,194 400,196 L400,250 C300,256 200,254 108,248 Z" fill="#d5c69e"></path>
        <rect y="252" width="400" height="28" fill="#2b5f86"></rect>
        <path d="M0,262 Q20,258 40,262 T80,262 T120,262 T160,262 T200,262 T240,262 T280,262 T320,262 T360,262 T400,262" stroke="#7fb2d0" fill="none" stroke-width="1"></path>
        <line x1="196" y1="150" x2="168" y2="204" stroke="#6b5a3a" stroke-width="3" stroke-dasharray="1 0"></line>
        <text x="74" y="186" font-size="7" fill="#e6f1f2" font-style="italic">Lagos Lagoon</text>
        <text x="132" y="182" font-size="6.5" fill="#3a2f1c" transform="rotate(-62 186 176)">Third Mainland Bridge</text>
        <text x="300" y="272" font-size="7.5" fill="#cfe3ef" font-style="italic">Atlantic Ocean</text>
        <text x="16" y="20" font-size="9" font-weight="700" fill="#5c4a2a" letter-spacing="1.5">MAINLAND</text>
        <text x="300" y="210" font-size="9" font-weight="700" fill="#5c4a2a" letter-spacing="1.5">ISLAND</text>
        <circle cx="${here[0]}" cy="${here[1]}" r="10" fill="none" stroke="#17140f" stroke-width="1.5" stroke-dasharray="3 2"></circle>
        ${pins}
      </svg>`;
        const k = mapSel;
        const open = k === 'home' || isOpen(k);
        const people = k === 'home' ? [] : npcsAt(k).filter(id => S.rel[id] && S.rel[id].met).map(id => NPCS[id].name);
        const modes = Object.keys(MODES).map(m => {
            const info = tripInfo(k, m);
            const can = S.money >= info.cost;
            return `<button type="button" class="option" data-go="${m}" ${can ? '' : 'disabled'}><b>${MODES[m].name} · ${naira(info.cost)}</b><small>About ${hoursLabel(info.mins)}${info.heavy ? ' · heavy traffic' : ''} · ${esc(MODES[m].note)}</small></button>`;
        }).join('');
        const list = dests.map(d => `<button type="button" class="option" data-dest="${d}" aria-pressed="${d === k}"><b>${esc(destName(d))}</b><small>${d === 'home' ? 'Your place' : `${isOpen(d) ? 'Open' : 'Closed'} · ${openLabel(d)}`}</small></button>`).join('');
        return `<h2>Where to?</h2>
      <p class="lede">It's ${DAYS[dow()]} ${clock(S.minute)}${isRush() ? ': rush hour, so expect go-slow on the roads' : ''}${S.flags.flood === S.day ? '. Roads are flooded today' : ''}.</p>
      <div class="map-wrap">
        <div class="map">${svg}</div>
        <div class="trip">
          <p class="section-label">${esc(destName(k))}</p>
          <p class="empty">${k === 'home' ? esc(home().name) : `${esc(LOCS[k].blurb)} ${open ? 'Open now.' : `Closed now. ${openLabel(k)}.`}`}${people.length ? ` ${people.join(', ')} ${people.length > 1 ? 'are' : 'is'} there.` : ''}</p>
          <div class="modes">${modes}</div>
        </div>
      </div>
      <p class="section-label">All places</p>
      <div class="options">${list}</div>
      <div class="modal-actions"><button class="btn" data-close>Stay here</button></div>`;
    }

    function openBuy() {
        const draw = () => `<h2>Buy for your home</h2>
      <p class="lede">Delivered today. Balance: ${naira(S.money)}.</p>
      <div class="options">${SHOP.map(it => {
        const owned = !!S.owned[it.id];
        return `<button type="button" class="option" data-buy="${it.id}" ${owned || S.money < it.price ? 'disabled' : ''}><b>${esc(it.name)}</b><small>${esc(it.desc)}</small><span class="price">${owned ? 'Owned' : naira(it.price)}</span></button>`;
    }).join('')}</div>
      <div class="modal-actions"><button class="btn" data-close>Done</button></div>`;
        openModal(draw(), e => {
            const t = e.target.closest('button');
            if (!t) return;
            if (t.dataset.buy) {
                const it = SHOP.find(x => x.id === t.dataset.buy);
                if (S.money >= it.price && !S.owned[it.id]) {
                    S.money -= it.price;
                    S.owned[it.id] = 1;
                    if (it.id === 'solar') { S.genOn = false; }
                    log(`${it.name} delivered and installed.`, 'good');
                    $('modal').innerHTML = draw();
                }
            }
            if (t.hasAttribute('data-close')) closeModal();
        });
    }

    function openHousing() {
        const draw = () => `<h2>Housing</h2>
      <p class="lede">Moving costs four weeks' rent upfront (agent fee, agreement and caution). Better areas get far fewer power cuts.</p>
      ${S.owing ? `<div class="modal-actions" style="justify-content:flex-start"><button class="btn primary" data-pay ${S.money >= S.owing ? '' : 'disabled'}>Pay ${naira(S.owing)} owed</button></div>` : ''}
      <div class="options">${Object.keys(HOMES).map(k => {
        const Hh = HOMES[k];
        const cost = Hh.rent * 4;
        const cur = S.home === k;
        const rel = ['Frequent', 'Regular', 'Rare', 'Almost never'][Hh.comfort];
        return `<button type="button" class="option" data-move="${k}" ${cur || S.owing || S.money < cost ? 'disabled' : ''}><b>${esc(Hh.name)}</b><small>${naira(Hh.rent)}/week · power cuts: ${rel} · comfort +${Hh.comfort}</small><span class="price">${cur ? 'You live here' : `Move in: ${naira(cost)}`}</span></button>`;
    }).join('')}</div>
      <div class="modal-actions"><button class="btn" data-close>Close</button></div>`;
        openModal(draw(), e => {
            const t = e.target.closest('button');
            if (!t) return;
            if (t.dataset.move) {
                const k = t.dataset.move;
                const cost = HOMES[k].rent * 4;
                if (S.money >= cost && !S.owing) {
                    S.money -= cost;
                    S.home = k;
                    S.rentDue = S.day + 7;
                    S.power.on = true;
                    buff('moved', 'New house!', 15, 2880);
                    log(`You moved into a ${HOMES[k].name}. Your furniture came along on a rickety truck.`, 'good');
                    closeModal();
                }
            }
            if (t.hasAttribute('data-pay') && S.money >= S.owing) {
                S.money -= S.owing;
                log(`You cleared ${naira(S.owing)} of rent arrears. Landlord is smiling again.`, 'good');
                S.owing = 0;
                S.buffs = S.buffs.filter(b => b.id !== 'owing');
                $('modal').innerHTML = draw();
            }
            if (t.hasAttribute('data-close')) closeModal();
        });
    }

    function openJobs() {
        hideMenu();
        const html = `<h2>Find a job</h2>
      <p class="lede">${S.career ? 'Switching jobs starts you at entry level in the new field.' : 'Pick something. Rent no dey wait.'}</p>
      <div class="options">${Object.keys(CAREERS).map(k => {
        const C = CAREERS[k];
        const cur = S.career && S.career.id === k;
        return `<button type="button" class="option" data-job="${k}" ${cur ? 'disabled' : ''}><b>${C.name} · ${C.levels[0][0]}</b><small>${C.blurb} ${C.days.map(d => DAYS[d][0]).join(' ')}, ${pad(C.start)}–${pad(C.end)} at ${LOCS[C.loc].name}.</small><span class="price">${cur ? 'Current job' : `${naira(C.levels[0][1])}/hour`}</span></button>`;
    }).join('')}</div>
      <div class="modal-actions"><button class="btn" data-close>Close</button></div>`;
        openModal(html, e => {
            const t = e.target.closest('button');
            if (!t) return;
            if (t.dataset.job) {
                const C = CAREERS[t.dataset.job];
                S.career = {id: t.dataset.job, level: 0, perf: 40, attended: 0, warnings: 0};
                log(`New job! You're now ${C.levels[0][0]} at ${LOCS[C.loc].name}.`, 'good');
                closeModal();
                dirty.side = true;
            }
            if (t.hasAttribute('data-close')) closeModal();
        });
    }

    function showEvent(id) {
        const E = EVENTS[id];
        const html = `<h2>${esc(E.title)}</h2><p>${esc(E.text())}</p><div class="modal-actions">${E.choices.map((c, i) => `<button class="btn ${i === 0 ? 'primary' : ''}" data-choice="${i}">${esc(c.label)}</button>`).join('')}</div>`;
        openModal(html, e => {
            const t = e.target.closest('[data-choice]');
            if (!t) return;
            E.choices[+t.dataset.choice].run();
            closeModal();
            dirty.side = dirty.head = true;
        });
    }

    function gameOver() {
        if (modalOpen) closeModal();
        openModal(`<h2>Your load is outside</h2>
      <p>Your debts passed ${naira(300000)} and the landlord packed your things onto the street. You're heading back to your family house in Ibadan to regroup.</p>
      <p class="lede">You lasted ${S.day} days in Lagos and earned ${naira(S.stats.earned)}.</p>
      <div class="modal-actions"><button class="btn primary" data-restart>Try Lagos again</button></div>`, e => {
            if (e.target.closest('[data-restart]')) { clearSave(); closeModal(); openCreate(false); }
        });
    }

    // ---------------------------------------------------------------------
    // Input
    // ---------------------------------------------------------------------
    function toLogical(e) {
        const r = canvas.getBoundingClientRect();
        return {x: (e.clientX - r.left) * W / r.width, y: (e.clientY - r.top) * H / r.height, px: e.clientX - r.left, py: e.clientY - r.top};
    }
    function hitAt(x, y) {
        for (let i = hits.length - 1; i >= 0; i--) {
            const h = hits[i];
            if (x >= h.x && x <= h.x + h.w && y >= h.y && y <= h.y + h.h) return h;
        }
        return null;
    }
    canvas.addEventListener('click', e => {
        if (!S || modalOpen) return;
        const p = toLogical(e);
        const h = hitAt(p.x, p.y);
        if (!h) { hideMenu(); return; }
        if (h.kind === 'obj') {
            if (h.id === 'door') { openMap(); return; }
            objMenu(h.id, p.px, p.py);
        } else if (h.kind === 'npc') {
            npcMenu(h.id, p.px, p.py);
        }
    });
    canvas.addEventListener('mousemove', e => {
        const p = toLogical(e);
        const h = hitAt(p.x, p.y);
        hover = h ? h.id : null;
        canvas.style.cursor = h ? 'pointer' : 'default';
    });
    canvas.addEventListener('mouseleave', () => { hover = null; });

    document.addEventListener('click', e => {
        if (!S) return;
        const t = e.target.closest('button');
        if (!menu.hidden && !menu.contains(e.target) && e.target !== canvas) hideMenu();
        if (!t) return;
        if (t.dataset.speed !== undefined) { S.speed = +t.dataset.speed; if (modalOpen) savedSpeed = S.speed || savedSpeed; dirty.head = true; }
        if (t.dataset.tab) { tab = t.dataset.tab; dirty.side = true; }
        if (t.dataset.tool === 'map') openMap();
        if (t.dataset.tool === 'buy') openBuy();
        if (t.dataset.tool === 'housing') openHousing();
        if (t.dataset.tool === 'jobs') openJobs();
        if (t.dataset.tool === 'phone') { e.stopPropagation(); phoneMenu(t); }
        if (t.dataset.act) startAct(t.dataset.act);
        if (t.hasAttribute('data-cancel')) { cancelAct(); dirty.now = true; }
        if (t.hasAttribute('data-freewill')) { S.freeWill = !S.freeWill; dirty.side = true; }
        if (t.hasAttribute('data-restart') && !modalOpen) openCreate(false);
    });
    document.addEventListener('keydown', e => {
        if (!S || e.target.matches('input')) return;
        if (e.key === 'Escape') { hideMenu(); if (modalOpen && !$('modal').querySelector('[data-start],[data-restart],[data-choice]')) closeModal(); }
        if (modalOpen) return;
        if (e.key === ' ') { e.preventDefault(); S.speed = S.speed ? 0 : 1; dirty.head = true; }
        if (['1', '2', '3'].includes(e.key)) { S.speed = +e.key; dirty.head = true; }
    });
    document.addEventListener('visibilitychange', () => { if (S && document.hidden) save(); });

    // ---------------------------------------------------------------------
    // Drawing
    // ---------------------------------------------------------------------
    function rr(x, y, w, h, r, fill, stroke) {
        ctx.beginPath();
        ctx.roundRect(x, y, w, h, r);
        if (fill) { ctx.fillStyle = fill; ctx.fill(); }
        if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = 2; ctx.stroke(); }
    }
    function text(s, x, y, size, color, align = 'left', weight = 700, font = 'Atkinson Hyperlegible, system-ui, sans-serif') {
        ctx.font = `${weight} ${size}px ${font}`;
        ctx.fillStyle = color;
        ctx.textAlign = align;
        ctx.textBaseline = 'middle';
        ctx.fillText(s, x, y);
    }
    function daylight() {
        const h = S.minute / 60;
        if (h >= 7 && h < 18) return 1;
        if (h >= 6 && h < 7) return h - 6;
        if (h >= 18 && h < 19.5) return 1 - (h - 18) / 1.5;
        return 0;
    }
    function skyColor() {
        const d = daylight();
        const h = S.minute / 60;
        if (d >= 1) return '#8fc6e8';
        if (d <= 0) return '#0d1d33';
        return h < 12 ? '#e8a96a' : '#d9765a';
    }

    function drawPerson(x, y, skin, outfit, o = {}) {
        const t = performance.now() / 1000;
        ctx.save();
        ctx.translate(x, y);
        if (o.pose === 'lie') {
            ctx.rotate(-Math.PI / 2);
        }
        const bob = o.walking ? Math.abs(Math.sin(t * 10)) * 2 : 0;
        // shadow
        if (o.pose !== 'lie') {
            ctx.fillStyle = 'rgba(0,0,0,.25)';
            ctx.beginPath(); ctx.ellipse(0, 12, 12, 4, 0, 0, Math.PI * 2); ctx.fill();
        }
        // legs
        ctx.fillStyle = '#2a2a33';
        ctx.fillRect(-6, 4 - bob, 5, 9);
        ctx.fillRect(1, 4 - bob, 5, 9);
        // body (ankara print)
        rr(-9, -14 - bob, 18, 20, 6, outfit);
        ctx.fillStyle = 'rgba(255,255,255,.35)';
        for (let i = 0; i < 3; i++) for (let j = 0; j < 2; j++) {
            ctx.beginPath(); ctx.arc(-4 + j * 8, -9 - bob + i * 6, 1.6, 0, Math.PI * 2); ctx.fill();
        }
        // head
        ctx.fillStyle = skin;
        ctx.beginPath(); ctx.arc(0, -22 - bob, 8, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#17120e';
        ctx.beginPath(); ctx.arc(0, -25 - bob, 7.5, Math.PI, 0); ctx.fill();
        ctx.fillStyle = '#17120e';
        ctx.fillRect((o.facing || 1) * 3 - 1, -22 - bob, 2, 2);
        ctx.restore();
        if (o.ring) {
            ctx.strokeStyle = o.ring; ctx.lineWidth = 3;
            ctx.beginPath(); ctx.ellipse(x, y + 12, 15, 5, 0, 0, Math.PI * 2); ctx.stroke();
        }
        if (o.name) {
            text(o.name, x, y + 24, 11, '#fff', 'center');
        }
        if (o.bubble) bubble(x, y - (o.pose === 'lie' ? 26 : 44), o.bubble);
    }
    function bubble(x, y, s) {
        ctx.font = '700 12px Atkinson Hyperlegible, system-ui, sans-serif';
        const w = ctx.measureText(s).width + 16;
        const bx = clamp(x - w / 2, 4, W - w - 4);
        rr(bx, y - 12, w, 22, 11, '#fffaf0');
        ctx.fillStyle = '#fffaf0';
        ctx.beginPath(); ctx.moveTo(x - 5, y + 9); ctx.lineTo(x + 5, y + 9); ctx.lineTo(x, y + 15); ctx.fill();
        text(s, bx + w / 2, y - 1, 12, '#17140f', 'center');
    }

    function simBubble() {
        const a = S.act;
        if (!a || a.phase !== 'do') return null;
        if (a.id === 'social') return a.data.kind === 'gist' ? 'Gisting…' : '…';
        return ACT[a.id].bubble || null;
    }

    function drawHome() {
        const Hm = home();
        hits = [];
        // yard / compound
        ctx.fillStyle = '#7d8a5a';
        ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = '#a58a62';
        ctx.fillRect(646, 0, 74, H);
        // floors
        ctx.fillStyle = Hm.floor;
        ctx.fillRect(20, 20, 270, 210); // bedroom
        ctx.fillStyle = Hm.bath;
        ctx.fillRect(20, 230, 180, 190);
        ctx.strokeStyle = 'rgba(0,0,0,.08)'; ctx.lineWidth = 1;
        for (let x = 20; x < 200; x += 22) { ctx.beginPath(); ctx.moveTo(x, 230); ctx.lineTo(x, 420); ctx.stroke(); }
        for (let y = 230; y < 420; y += 22) { ctx.beginPath(); ctx.moveTo(20, y); ctx.lineTo(200, y); ctx.stroke(); }
        ctx.fillStyle = Hm.tile;
        ctx.fillRect(290, 20, 356, 250);
        ctx.fillRect(200, 230, 90, 190);
        ctx.fillRect(290, 270, 356, 150);
        ctx.fillStyle = 'rgba(255,255,255,.06)';
        for (let x = 200; x < 646; x += 40) for (let y = 20; y < 420; y += 40) if (((x + y) / 40) % 2 === 0 && roomOf(x + 5, y + 5) === 'main') ctx.fillRect(x, y, 40, 40);
        // kitchen floor
        ctx.fillStyle = 'rgba(255,255,255,.07)';
        ctx.fillRect(200, 330, 446, 90);
        // rug
        rr(390, 70, 160, 70, 6, 'rgba(214,98,63,.55)');
        ctx.strokeStyle = 'rgba(245,193,26,.7)'; ctx.lineWidth = 2;
        ctx.strokeRect(398, 78, 144, 54);

        // walls
        ctx.strokeStyle = Hm.wall; ctx.lineWidth = 8; ctx.lineCap = 'square';
        const wall = (x1, y1, x2, y2) => { ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke(); };
        wall(20, 20, 646, 20); wall(20, 20, 20, 420); wall(20, 420, 646, 420);
        wall(646, 20, 646, 296); wall(646, 354, 646, 420);
        wall(290, 20, 290, 168); wall(290, 222, 290, 230);
        wall(20, 230, 290, 230);
        wall(200, 230, 200, 300); wall(200, 352, 200, 420);
        // windows (sky)
        const sky = skyColor();
        [[60, 20], [450, 20], [20, 120]].forEach(([x, y], i) => {
            ctx.fillStyle = sky;
            if (i < 2) ctx.fillRect(x, y - 3, 60, 6); else ctx.fillRect(x - 3, y, 6, 50);
        });

        // objects
        const ids = Object.keys(OBJ);
        for (const id of ids) {
            const o = OBJ[id];
            if (o.buy && !S.owned[o.buy]) continue;
            drawObj(id, o);
            if (!o.deco) hits.push({kind: 'obj', id, x: o.x - 4, y: o.y - 4, w: o.w + 8, h: o.h + 8});
        }
        // sim
        const a = S.act;
        const lie = a && a.phase === 'do' && ACT[a.id] && ACT[a.id].pose === 'lie';
        const pos = lie && a.obj === 'bed' ? {x: 86, y: 118} : S.pos;
        drawPerson(pos.x, pos.y, S.sim.skin, S.sim.outfit, {pose: lie ? 'lie' : null, walking: S.path.length > 0, facing, ring: moodInfo(moodScore()).color, bubble: simBubble()});

        // lighting
        const d = daylight();
        const powered = homePowered();
        const dark = (1 - d) * (powered ? 0.25 : 0.72);
        const dayDim = !powered && d > 0 ? 0.12 : 0;
        const alpha = Math.max(dark, dayDim);
        if (alpha > 0.01) {
            if (!powered && d < 0.6) {
                const g = ctx.createRadialGradient(pos.x, pos.y - 10, 20, pos.x, pos.y - 10, 190);
                g.addColorStop(0, 'rgba(10,16,28,0)');
                g.addColorStop(1, `rgba(10,16,28,${alpha})`);
                ctx.fillStyle = g;
            } else {
                ctx.fillStyle = powered ? `rgba(40,24,6,${alpha})` : `rgba(10,16,28,${alpha})`;
            }
            ctx.fillRect(0, 0, W, H);
        }
        if (!powered) {
            rr(250, 196, 220, 30, 15, 'rgba(23,20,15,.85)');
            text('NEPA took light', 360, 211, 14, '#ffb39f', 'center', 400, 'Bungee, sans-serif');
        }
        // hover label
        if (hover && OBJ[hover]) {
            const o = OBJ[hover];
            const label = o.label;
            ctx.font = '700 12px Atkinson Hyperlegible, system-ui, sans-serif';
            const w = ctx.measureText(label).width + 14;
            const lx = clamp(o.x + o.w / 2 - w / 2, 4, W - w - 4);
            const ly = o.y > 30 ? o.y - 22 : o.y + o.h + 6;
            rr(lx, ly, w, 18, 6, '#f5c11a');
            text(label, lx + w / 2, ly + 9, 12, '#17140f', 'center');
        }
    }

    function drawObj(id, o) {
        const {x, y, w, h} = o;
        const pw = homePowered();
        switch (id) {
        case 'bed':
            rr(x, y, w, h, 8, '#5b3b2a');
            rr(x + 6, y + 6, w - 12, h - 12, 6, S.owned.bed_ortho ? '#eef2f5' : '#e7dcc6');
            rr(x + 12, y + 10, w - 24, 28, 8, '#ffffff');
            ctx.fillStyle = S.owned.bed_ortho ? '#2f6fd0' : '#d6623f';
            ctx.fillRect(x + 6, y + 54, w - 12, h - 60);
            ctx.fillStyle = 'rgba(245,193,26,.6)';
            for (let i = 0; i < 4; i++) ctx.fillRect(x + 6, y + 64 + i * 20, w - 12, 4);
            break;
        case 'wardrobe': rr(x, y, w, h, 3, '#6b4a33'); ctx.fillStyle = '#3d2a1d'; ctx.fillRect(x + w / 2 - 1, y + 3, 2, h - 6); break;
        case 'mirror': rr(x, y, w, h, 3, '#bfe1ea', '#8c6a40'); break;
        case 'weights':
            rr(x, y, w, h, 4, '#3a3a40');
            ctx.fillStyle = '#9aa0a6';
            [[x + 10, y + 8], [x + 40, y + 8]].forEach(([a, b]) => { ctx.fillRect(a, b + 6, 20, 3); ctx.fillRect(a - 2, b, 5, 15); ctx.fillRect(a + 17, b, 5, 15); });
            break;
        case 'sink': rr(x, y, w, h, 6, '#f2f4f5', '#c4cbd0'); ctx.fillStyle = '#c4cbd0'; ctx.beginPath(); ctx.ellipse(x + w / 2, y + h / 2, 14, 7, 0, 0, Math.PI * 2); ctx.fill(); break;
        case 'toilet': rr(x + 4, y, w - 8, 12, 3, '#f2f4f5'); ctx.fillStyle = '#f2f4f5'; ctx.beginPath(); ctx.ellipse(x + w / 2, y + 28, 15, 15, 0, 0, Math.PI * 2); ctx.fill(); ctx.strokeStyle = '#c4cbd0'; ctx.lineWidth = 2; ctx.stroke(); break;
        case 'bucket':
            rr(x - 10, y - 10, w + 20, h + 20, 4, 'rgba(255,255,255,.25)');
            ctx.fillStyle = '#2f6fd0'; ctx.beginPath(); ctx.arc(x + w / 2, y + h / 2, 20, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = '#7fb2d0'; ctx.beginPath(); ctx.arc(x + w / 2, y + h / 2, 15, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = '#d6623f'; ctx.beginPath(); ctx.arc(x + w - 2, y + 4, 7, 0, Math.PI * 2); ctx.fill();
            break;
        case 'art':
            ['#d6623f', '#f5c11a', '#45a86d', '#2f6fd0'].forEach((c, i) => { ctx.fillStyle = c; ctx.fillRect(x + i * 12, y, 12, h); });
            break;
        case 'books':
            rr(x, y, w, h, 3, '#6b4a33');
            for (let i = 0; i < 5; i++) { ctx.fillStyle = ['#d6623f', '#2f6fd0', '#f5c11a', '#45a86d', '#8e44ad'][i]; ctx.fillRect(x + 4, y + 6 + i * 15, w - 8, 10); }
            break;
        case 'tv': {
            rr(x, y, w, h, 3, '#111');
            const on = pw && S.act && ['nolly', 'football'].includes(S.act.id) && S.act.phase === 'do';
            ctx.fillStyle = on ? (S.act.id === 'football' ? '#3fa36a' : '#e8a96a') : '#22262c';
            ctx.fillRect(x + 4, y + 3, w - 8, h - 6);
            if (S.owned.tv_big) { ctx.fillStyle = '#f5c11a'; ctx.fillRect(x + w - 10, y + h - 4, 4, 2); }
            break;
        }
        case 'ac': rr(x, y, w, h, 4, '#f4f6f8', '#c4cbd0'); ctx.fillStyle = S.acOn && pw ? '#45a86d' : '#aaa'; ctx.fillRect(x + w - 10, y + 5, 4, 4); break;
        case 'sofa':
            rr(x, y + 18, w, h - 18, 8, '#3d6b5e');
            rr(x, y, w, 22, 8, '#2f5a4e');
            rr(x - 6, y + 4, 16, h - 4, 6, '#2f5a4e');
            rr(x + w - 10, y + 4, 16, h - 4, 6, '#2f5a4e');
            ctx.fillStyle = '#f5c11a'; ctx.fillRect(x + 22, y + 22, 18, 14);
            ctx.fillStyle = '#d6623f'; ctx.fillRect(x + w - 40, y + 22, 18, 14);
            break;
        case 'fan': {
            ctx.fillStyle = '#ddd'; ctx.beginPath(); ctx.arc(x + 12, y + 12, 12, 0, Math.PI * 2); ctx.fill();
            const spin = pw ? performance.now() / 60 : 0.4;
            ctx.strokeStyle = '#777'; ctx.lineWidth = 3;
            for (let i = 0; i < 3; i++) { const ang = spin + i * 2.09; ctx.beginPath(); ctx.moveTo(x + 12, y + 12); ctx.lineTo(x + 12 + Math.cos(ang) * 10, y + 12 + Math.sin(ang) * 10); ctx.stroke(); }
            break;
        }
        case 'desk':
            rr(x, y, w, h, 4, '#7a5536');
            rr(x + 6, y + 26, w - 12, 38, 3, '#2a2d33');
            ctx.fillStyle = pw && S.act && ['code', 'freelance'].includes(S.act.id) ? '#6fd1ff' : '#3b4048';
            ctx.fillRect(x + 9, y + 29, w - 18, 20);
            break;
        case 'stove':
            rr(x, y, w, h, 4, '#d9dcde', '#9aa0a6');
            for (let i = 0; i < 2; i++) { ctx.fillStyle = S.act && S.act.id === 'cook' && S.act.phase === 'do' ? '#3b8fd0' : '#555'; ctx.beginPath(); ctx.arc(x + 18 + i * 28, y + h / 2, 9, 0, Math.PI * 2); ctx.fill(); }
            ctx.fillStyle = '#c0392b'; ctx.fillRect(x + w + 4, y + 6, 10, 22); // gas cylinder
            break;
        case 'fridge': rr(x, y, w, h, 4, '#eef0f2', '#b8c0c6'); ctx.fillStyle = pw ? '#45a86d' : '#d6623f'; ctx.fillRect(x + w - 9, y + 5, 4, 4); break;
        case 'freezer': rr(x, y, w, h, 4, '#f4f6f8', '#b8c0c6'); ctx.fillStyle = '#9aa0a6'; ctx.fillRect(x + 8, y + h / 2 - 2, w - 16, 3); break;
        case 'table':
            rr(x, y, w, h, 6, '#8a5f3e');
            ctx.fillStyle = '#5b3b2a';
            [[x - 12, y + 10], [x + w + 2, y + 10], [x - 12, y + 30], [x + w + 2, y + 30]].forEach(([a, b]) => ctx.fillRect(a, b, 10, 12));
            ctx.fillStyle = '#d6623f'; ctx.beginPath(); ctx.arc(x + w / 2, y + h / 2, 9, 0, Math.PI * 2); ctx.fill();
            break;
        case 'door': ctx.fillStyle = '#6b4a33'; ctx.fillRect(x, y, w, h); ctx.fillStyle = '#f5c11a'; ctx.fillRect(x + 2, y + h / 2, 3, 4); break;
        case 'gen': {
            const run = genPower();
            const jig = run ? Math.sin(performance.now() / 30) : 0;
            rr(x + jig, y, w, h, 4, '#c0392b', '#7a2017');
            ctx.fillStyle = '#222'; ctx.fillRect(x + 6 + jig, y + 6, 18, 12);
            if (run) { ctx.fillStyle = 'rgba(80,80,80,.35)'; ctx.beginPath(); ctx.arc(x + w + 6, y - 6 - (performance.now() / 40) % 14, 6, 0, Math.PI * 2); ctx.fill(); }
            text(`${S.fuel.toFixed(0)}L`, x + w / 2 + 8, y + h / 2 + 4, 10, '#fff', 'center');
            break;
        }
        case 'solar':
            ctx.fillStyle = '#1d3557';
            for (let i = 0; i < 2; i++) for (let j = 0; j < 3; j++) ctx.fillRect(x + i * 27, y + j * 24, 25, 22);
            ctx.strokeStyle = '#7fb2d0'; ctx.lineWidth = 1;
            for (let i = 0; i < 2; i++) for (let j = 0; j < 3; j++) ctx.strokeRect(x + i * 27 + 0.5, y + j * 24 + 0.5, 24, 21);
            break;
        }
    }

    // ---- location scenes ----
    const NPC_SLOTS = [[430, 300], [530, 250], [610, 330], [350, 230]];
    function drawLocation() {
        hits = [];
        const L = LOCS[S.loc];
        const d = daylight();
        drawScene(L.scene, d);
        // NPCs
        const here = npcsAt(S.loc);
        here.forEach((id, i) => {
            const [x, y] = NPC_SLOTS[i % NPC_SLOTS.length];
            const N = NPCS[id];
            const talking = S.act && S.act.id === 'social' && S.act.data.npc === id;
            drawPerson(x, y, N.skin, N.outfit, {name: N.name, facing: -1, bubble: talking ? (Math.floor(performance.now() / 1200) % 2 ? 'Ehen!' : 'For real?') : null});
            hits.push({kind: 'npc', id, x: x - 18, y: y - 36, w: 36, h: 64});
        });
        // player
        const a = S.act;
        const lie = a && a.phase === 'do' && ACT[a.id] && ACT[a.id].pose === 'lie';
        drawPerson(200, 330, S.sim.skin, S.sim.outfit, {name: S.sim.name, pose: lie ? 'lie' : null, facing: 1, ring: moodInfo(moodScore()).color, bubble: simBubble()});
        // night tint
        if (d < 1 && L.scene !== 'suya') {
            ctx.fillStyle = `rgba(8,14,30,${(1 - d) * 0.45})`;
            ctx.fillRect(0, 0, W, H);
        }
        if (!isOpen(S.loc)) {
            rr(240, 24, 240, 34, 17, 'rgba(23,20,15,.85)');
            text('CLOSED', 360, 41, 16, '#ffb39f', 'center', 400, 'Bungee, sans-serif');
        }
    }

    function drawScene(scene, d) {
        const t = performance.now() / 1000;
        const sky = skyColor();
        const ground = (c) => { ctx.fillStyle = c; ctx.fillRect(0, 200, W, H - 200); };
        ctx.fillStyle = sky; ctx.fillRect(0, 0, W, 200);
        const skyline = (c) => {
            ctx.fillStyle = c;
            [[0, 120, 60], [70, 90, 50], [130, 140, 40], [180, 70, 46], [236, 110, 60], [306, 60, 40], [356, 100, 70], [436, 80, 40], [486, 130, 60], [556, 50, 44], [610, 100, 60], [680, 120, 40]].forEach(([x, y, w]) => ctx.fillRect(x, y, w, 200 - y));
            ctx.fillStyle = d < 0.5 ? 'rgba(255,214,120,.7)' : 'rgba(255,255,255,.25)';
            for (let x = 4; x < W; x += 16) for (let y = 80; y < 196; y += 18) if (((x * 7 + y * 3) % 5) < 2) ctx.fillRect(x, y, 5, 6);
        };
        switch (scene) {
        case 'office':
        case 'bank':
            skyline(scene === 'bank' ? '#2c4a6b' : '#4a4f5a');
            ground(scene === 'bank' ? '#e6e1d6' : '#56606b');
            ctx.fillStyle = scene === 'bank' ? 'rgba(0,0,0,.05)' : 'rgba(255,255,255,.06)';
            for (let x = 0; x < W; x += 60) ctx.fillRect(x, 200, 30, H - 200);
            for (let i = 0; i < 4; i++) {
                const x = 270 + (i % 2) * 180;
                const y = 220 + Math.floor(i / 2) * 100;
                rr(x, y, 120, 40, 4, scene === 'bank' ? '#3c2a1e' : '#e8e2d4');
                rr(x + 40, y - 18, 40, 22, 2, '#222');
                ctx.fillStyle = '#6fd1ff'; ctx.fillRect(x + 43, y - 15, 34, 15);
            }
            if (scene === 'office') { rr(20, 210, 150, 30, 6, '#f5c11a'); text('YABA TECH HUB', 95, 225, 14, '#17140f', 'center', 400, 'Bungee, sans-serif'); }
            else { rr(20, 210, 160, 30, 6, '#123'); text('VI BANK TOWER', 100, 225, 13, '#f5c11a', 'center', 400, 'Bungee, sans-serif'); }
            break;
        case 'set':
            skyline('#6b5a4a');
            ground('#8a7a5a');
            rr(300, 230, 180, 90, 6, '#c9b79c');
            ctx.fillStyle = '#2a2a2a'; ctx.fillRect(520, 260, 30, 50); ctx.fillRect(530, 230, 50, 30);
            ctx.fillStyle = '#f5f0c0';
            [[260, 210], [600, 210]].forEach(([x, y]) => { ctx.fillRect(x, y, 6, 90); ctx.beginPath(); ctx.arc(x + 3, y, 16, 0, Math.PI * 2); ctx.fill(); });
            rr(40, 220, 120, 70, 6, '#17140f'); ctx.fillStyle = '#fff'; for (let i = 0; i < 6; i++) ctx.fillRect(40 + i * 20, 220, 10, 14);
            text('SCENE 47 · TAKE 9', 100, 262, 11, '#fff', 'center');
            break;
        case 'buka':
            ctx.fillStyle = '#b7a37a'; ctx.fillRect(0, 60, W, 140);
            ground('#9a7b52');
            rr(180, 24, 360, 50, 6, '#2f6fd0'); text('MAMA NKECHI BUKA', 360, 49, 22, '#f5c11a', 'center', 400, 'Bungee, sans-serif');
            for (let i = 0; i < 4; i++) { ctx.fillStyle = '#3a3a3a'; ctx.beginPath(); ctx.arc(120 + i * 70, 150, 26, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = ['#d6623f', '#45a86d', '#e8c37a', '#8a4a2a'][i]; ctx.beginPath(); ctx.arc(120 + i * 70, 146, 20, 0, Math.PI * 2); ctx.fill(); }
            for (let i = 0; i < 3; i++) rr(300 + i * 130, 360, 110, 20, 3, '#6b4a33');
            rr(520, 120, 70, 60, 6, '#2f6fd0'); text('COOLER', 555, 150, 10, '#fff', 'center');
            break;
        case 'suya': {
            ctx.fillStyle = '#0d1d33'; ctx.fillRect(0, 0, W, 200);
            ground('#3a3026');
            rr(260, 210, 200, 60, 6, '#2a2a2a');
            const glow = ctx.createRadialGradient(360, 230, 10, 360, 230, 160);
            glow.addColorStop(0, 'rgba(255,140,40,.7)'); glow.addColorStop(1, 'rgba(255,140,40,0)');
            ctx.fillStyle = glow; ctx.fillRect(160, 80, 400, 300);
            ctx.fillStyle = '#ff7a2a'; for (let i = 0; i < 9; i++) ctx.fillRect(272 + i * 20, 228, 12, 22);
            for (let i = 0; i < 5; i++) { ctx.fillStyle = `rgba(200,200,200,${0.25 - i * 0.04})`; ctx.beginPath(); ctx.arc(360 + Math.sin(t + i) * 20, 190 - i * 28 - (t * 20 % 28), 18 + i * 4, 0, Math.PI * 2); ctx.fill(); }
            for (let i = 0; i < 6; i++) { ctx.fillStyle = '#ffd36a'; ctx.beginPath(); ctx.arc(60 + i * 120, 40, 5, 0, Math.PI * 2); ctx.fill(); }
            text('MALLAM SUYA', 360, 300, 16, '#f5c11a', 'center', 400, 'Bungee, sans-serif');
            break;
        }
        case 'mall':
            ctx.fillStyle = '#d8d3c8'; ctx.fillRect(0, 0, W, 200);
            ground('#efe9dc');
            [['SUPERMARKET', '#d6623f'], ['CINEMA', '#2f6fd0'], ['PHONES', '#45a86d'], ['FASHION', '#8e44ad']].forEach(([n, c], i) => {
                rr(20 + i * 175, 60, 160, 130, 6, '#fff', '#c9c2b4');
                rr(20 + i * 175, 60, 160, 28, 6, c);
                text(n, 100 + i * 175, 74, 12, '#fff', 'center', 400, 'Bungee, sans-serif');
            });
            break;
        case 'station':
            skyline('#5a5f66');
            ground('#5d5d5d');
            rr(160, 150, 420, 24, 4, '#d6623f');
            text(S.flags.scarcity >= S.day ? 'NO FUEL TODAY? · QUEUE HERE' : 'FUEL AVAILABLE', 370, 162, 13, '#fff', 'center', 400, 'Bungee, sans-serif');
            for (let i = 0; i < 3; i++) { rr(220 + i * 130, 220, 40, 70, 4, '#f4f6f8', '#999'); ctx.fillStyle = '#17140f'; ctx.fillRect(226 + i * 130, 230, 28, 14); }
            if (S.flags.scarcity >= S.day) for (let i = 0; i < 6; i++) rr(-20 + i * 110, 390, 90, 36, 8, ['#c0392b', '#2f6fd0', '#888', '#f5c11a', '#45a86d', '#eee'][i]);
            break;
        case 'market':
            ctx.fillStyle = '#b8a27a'; ctx.fillRect(0, 100, W, 100);
            ground('#a08660');
            for (let i = 0; i < 7; i++) {
                const x = 30 + i * 100;
                ctx.fillStyle = ['#d6623f', '#f5c11a', '#2f6fd0', '#45a86d', '#e04f8a', '#f5c11a', '#d6623f'][i];
                ctx.beginPath(); ctx.moveTo(x - 10, 150); ctx.lineTo(x + 45, 110); ctx.lineTo(x + 100, 150); ctx.fill();
                rr(x, 150, 80, 50, 2, '#6b4a33');
                for (let j = 0; j < 4; j++) { ctx.fillStyle = ['#c0392b', '#e8c37a', '#45a86d', '#8e44ad'][(i + j) % 4]; ctx.beginPath(); ctx.arc(x + 12 + j * 18, 165, 7, 0, Math.PI * 2); ctx.fill(); }
            }
            text('BALOGUN', 360, 40, 26, '#17140f', 'center', 400, 'Bungee, sans-serif');
            break;
        case 'park':
            ground('#5f8a4a');
            for (let i = 0; i < 6; i++) { ctx.fillStyle = '#3d6b3a'; ctx.beginPath(); ctx.arc(60 + i * 125, 170, 40, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#5b3b2a'; ctx.fillRect(55 + i * 125, 200, 10, 30); }
            rr(260, 230, 200, 60, 6, '#3a2f26');
            text('FREEDOM PARK', 360, 260, 16, '#f5c11a', 'center', 400, 'Bungee, sans-serif');
            if (d < 1) for (let i = 0; i < 12; i++) { ctx.fillStyle = ['#f5c11a', '#d6623f', '#45a86d'][i % 3]; ctx.beginPath(); ctx.arc(40 + i * 60, 30 + Math.sin(i) * 6, 4, 0, Math.PI * 2); ctx.fill(); }
            break;
        case 'party':
            ctx.fillStyle = '#efe7d6'; ctx.fillRect(0, 0, W, 200);
            ground('#d8cbb0');
            for (let i = 0; i < 12; i++) { ctx.fillStyle = i % 2 ? '#f5c11a' : '#e04f8a'; ctx.beginPath(); ctx.moveTo(i * 60, 0); ctx.lineTo(i * 60 + 60, 0); ctx.lineTo(i * 60 + 30, 30); ctx.fill(); }
            for (let i = 0; i < 4; i++) { ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(110 + i * 170, 380, 40, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#f5c11a'; ctx.beginPath(); ctx.arc(110 + i * 170, 380, 32, 0, Math.PI * 2); ctx.fill(); }
            rr(560, 90, 60, 110, 6, '#17140f'); rr(630, 90, 60, 110, 6, '#17140f');
            ctx.fillStyle = '#444'; [[590, 130], [660, 130], [590, 170], [660, 170]].forEach(([x, y]) => { ctx.beginPath(); ctx.arc(x, y, 16 + Math.sin(t * 12) * 1.5, 0, Math.PI * 2); ctx.fill(); });
            text('AUNTY BISOLA @ 60', 260, 120, 22, '#e04f8a', 'center', 400, 'Bungee, sans-serif');
            break;
        case 'gym':
            ctx.fillStyle = '#3a3f47'; ctx.fillRect(0, 0, W, 200);
            ground('#2a2d33');
            for (let i = 0; i < 4; i++) rr(260 + i * 110, 230, 90, 30, 4, '#45a86d');
            for (let i = 0; i < 6; i++) { ctx.fillStyle = '#9aa0a6'; ctx.fillRect(40 + i * 110, 120, 70, 6); ctx.fillRect(36 + i * 110, 106, 10, 34); ctx.fillRect(104 + i * 110, 106, 10, 34); }
            text('NO PAIN NO GAIN', 360, 60, 22, '#f5c11a', 'center', 400, 'Bungee, sans-serif');
            break;
        case 'beach': {
            ctx.fillStyle = '#2b5f86'; ctx.fillRect(0, 130, W, 90);
            for (let i = 0; i < 4; i++) {
                ctx.strokeStyle = 'rgba(255,255,255,.6)'; ctx.lineWidth = 2; ctx.beginPath();
                for (let x = 0; x <= W; x += 10) ctx.lineTo(x, 150 + i * 18 + Math.sin(x / 30 + t * 2 + i) * 4);
                ctx.stroke();
            }
            ctx.fillStyle = '#e6cf98'; ctx.fillRect(0, 215, W, H - 215);
            for (let i = 0; i < 3; i++) { const x = 80 + i * 260; ctx.fillStyle = '#5b3b2a'; ctx.fillRect(x, 120, 8, 120); ctx.fillStyle = '#2f8a4a'; for (let k = 0; k < 5; k++) { ctx.beginPath(); ctx.ellipse(x + 4, 120, 40, 10, k * 0.7, 0, Math.PI * 2); ctx.fill(); } }
            ['#d6623f', '#f5c11a', '#2f6fd0'].forEach((c, i) => { ctx.fillStyle = c; ctx.beginPath(); ctx.arc(350 + i * 120, 260, 34, Math.PI, 0); ctx.fill(); ctx.fillStyle = '#eee'; ctx.fillRect(348 + i * 120, 260, 4, 40); });
            // a horse, because Elegushi
            ctx.fillStyle = '#7a4e2d';
            rr(560, 360, 70, 30, 12, '#7a4e2d'); ctx.fillRect(570, 388, 6, 24); ctx.fillRect(616, 388, 6, 24); rr(620, 336, 22, 34, 8, '#7a4e2d');
            break;
        }
        }
    }

    function drawRoad() {
        hits = [];
        const t = performance.now() / 1000;
        const tr = S.travel;
        ctx.fillStyle = skyColor(); ctx.fillRect(0, 0, W, 200);
        const d = daylight();
        // skyline
        ctx.fillStyle = tr.crossing ? '#2b5f86' : '#4a4f5a';
        if (tr.crossing) ctx.fillRect(0, 160, W, 60);
        else [[0, 120, 60], [70, 90, 50], [130, 140, 40], [180, 70, 46], [236, 110, 60], [306, 60, 40], [356, 100, 70], [436, 80, 40], [486, 130, 60], [556, 50, 44], [610, 100, 60], [680, 120, 40]].forEach(([x, y, w]) => ctx.fillRect(x, y, w, 200 - y));
        // road
        ctx.fillStyle = '#3a3a3e'; ctx.fillRect(0, 220, W, 170);
        ctx.fillStyle = '#d8d3c8'; ctx.fillRect(0, 214, W, 6); ctx.fillRect(0, 390, W, 6);
        ctx.fillStyle = '#f5c11a';
        const speed = tr.heavy ? 20 : 160;
        for (let x = -((t * speed) % 80); x < W; x += 80) ctx.fillRect(x, 302, 40, 5);
        // other cars
        const cars = tr.heavy ? 9 : 4;
        for (let i = 0; i < cars; i++) {
            const x = ((i * 157 - t * (tr.heavy ? 6 : 60)) % (W + 120) + W + 120) % (W + 120) - 60;
            rr(x, i % 2 ? 236 : 330, 64, 30, 8, ['#c0392b', '#eee', '#2f6fd0', '#555', '#45a86d'][i % 5]);
        }
        // our vehicle
        const vx = 300 + Math.sin(t * (tr.heavy ? 0.5 : 2)) * 6;
        if (tr.mode === 'danfo') {
            rr(vx, 250, 150, 64, 10, '#f5c11a');
            ctx.fillStyle = '#17140f'; ctx.fillRect(vx, 290, 150, 5); ctx.fillRect(vx, 300, 150, 3);
            ctx.fillStyle = '#9ad0ef'; for (let i = 0; i < 4; i++) ctx.fillRect(vx + 10 + i * 34, 258, 26, 18);
            text('OYINGBO! CMS! ENTER WITH YOUR CHANGE', vx + 75, 240, 10, d < 0.5 ? '#fff' : '#17140f', 'center');
        } else if (tr.mode === 'brt') {
            rr(vx - 30, 244, 210, 70, 10, '#2f6fd0');
            ctx.fillStyle = '#9ad0ef'; for (let i = 0; i < 5; i++) ctx.fillRect(vx - 20 + i * 38, 254, 30, 20);
            text('BRT', vx + 75, 296, 14, '#fff', 'center', 400, 'Bungee, sans-serif');
        } else {
            rr(vx + 20, 262, 110, 46, 12, '#e8e2d4');
            ctx.fillStyle = '#9ad0ef'; ctx.fillRect(vx + 40, 268, 70, 16);
        }
        ctx.fillStyle = '#111';
        [[vx + 30, 316], [vx + 120, 316]].forEach(([x, y]) => { ctx.beginPath(); ctx.arc(x, y, 10, 0, Math.PI * 2); ctx.fill(); });
        if (tr.heavy) {
            rr(220, 30, 280, 40, 20, 'rgba(23,20,15,.85)');
            text(tr.crossing ? 'GO-SLOW ON THIRD MAINLAND' : 'GO-SLOW', 360, 50, 16, '#ffb39f', 'center', 400, 'Bungee, sans-serif');
        }
        if (d < 1) { ctx.fillStyle = `rgba(8,14,30,${(1 - d) * 0.4})`; ctx.fillRect(0, 0, W, H); }
    }

    function draw() {
        ctx.clearRect(0, 0, W, H);
        if (!S) {
            ctx.fillStyle = '#0f3840'; ctx.fillRect(0, 0, W, H);
            return;
        }
        if (S.travel) drawRoad();
        else if (S.loc === 'home') drawHome();
        else drawLocation();
        if (S.speed === 0 && !modalOpen) {
            rr(W - 92, 10, 82, 26, 13, 'rgba(23,20,15,.85)');
            text('PAUSED', W - 51, 23, 12, '#f5c11a', 'center', 400, 'Bungee, sans-serif');
        }
    }

    // ---------------------------------------------------------------------
    // Main loop
    // ---------------------------------------------------------------------
    let last = performance.now();
    let acc = 0;
    let uiTimer = 0;
    let pressing = false;
    document.addEventListener('pointerdown', () => { pressing = true; });
    document.addEventListener('pointerup', () => { setTimeout(() => { pressing = false; }, 0); });
    document.addEventListener('pointercancel', () => { pressing = false; });
    function frame(now) {
        const dt = Math.min(0.1, (now - last) / 1000);
        last = now;
        if (S && !modalOpen) {
            if (S.speed > 0) {
                moveSim(dt);
                let rate = SPEEDS[S.speed];
                const ff = S.travel || (S.act && S.act.phase === 'do' && (S.act.id === 'social' ? false : ACT[S.act.id].ff));
                if (ff) rate = Math.max(rate, FF_RATE);
                acc += dt * rate;
                let steps = 0;
                while (acc >= 1 && steps < 200) { stepMinute(); acc -= 1; steps++; if (modalOpen) { acc = 0; break; } }
            }
        }
        uiTimer += dt;
        if (S && uiTimer > 0.2 && !pressing) {
            uiTimer = 0;
            renderHead();
            renderNow();
            if (dirty.side || tab === 'needs' || tab === 'career') { renderSide(); dirty.side = false; }
            if (dirty.feed) { renderFeed(); dirty.feed = false; }
        }
        draw();
        requestAnimationFrame(frame);
    }

    // ---------------------------------------------------------------------
    // Boot
    // ---------------------------------------------------------------------
    function start(hotData) {
        const saved = (hotData && hotData.S && hotData.S.v === 1) ? hotData.S : loadSave();
        if (saved) {
            S = saved;
            savedSpeed = S.speed || 1;
            openCreate(true);
        } else {
            openCreate(false);
        }
        requestAnimationFrame(frame);
    }
    if (window.claude && window.claude.hot) window.claude.hot.snapshot(() => ({S}));
    if (window.claude && window.claude.hot && window.claude.hot.ready) window.claude.hot.ready(start);
    else start(window.claude && window.claude.hot && window.claude.hot.data);
})();
