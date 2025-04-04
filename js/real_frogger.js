/**
 * Real Frogger Level
 * A first-person 3D implementation of the classic Frogger game.
 * Dynamically loaded when the player enters through Corridor Door 9.
 */

class RealFroggerLevel {
    /**
     * Constructor for the Frogger level
     * @param {ArcadeApp} app - Reference to the main app for shared resources
     */
    constructor(app) {
        console.log("Constructing RealFroggerLevel...");
        // Store references to the main app and its components
        this.app = app;
        this.scene = app.scene;
        this.camera = app.camera;
        this.renderer = app.renderer;
        this.listener = app.listener;
        this.sounds = app.sounds;

        // Define room dimensions as instance properties to avoid global scope conflicts
        this.ROOM_WIDTH = 30;  // Width of the entire room (X-axis)
        this.ROOM_LENGTH = 50; // Length of the entire room (Z-axis) - REDUCED from 60 to 50
        this.ROOM_HEIGHT = 8;  // Height of the room
        this.WALL_THICKNESS = 0.5;

        // Game zone dimensions
        this.START_ZONE_DEPTH = 10;   // Depth of the starting area
        this.ROAD_ZONE_DEPTH = 15;    // Depth of the road area (3 lanes, 5 units each)
        this.WATER_ZONE_DEPTH = 20;   // Depth of the water area - INCREASED from 15 to 20
        this.GOAL_ZONE_DEPTH = 5;     // Depth of the goal area - DECREASED from 10 to 5

        // Level-specific properties
        this.roomObjects = []; // For walls, floor, ceiling
        this.roomLights = [];  // For lights
        this.zoneObjects = []; // For game zone objects

        // Player properties (copied, adjust groundLevel)
        this.moveSpeed = app.moveSpeed; // Use standard speed for now
        this.jumpHeight = app.jumpHeight;
        this.jumpVelocity = 0;
        this.gravity = app.gravity;
        this.isJumping = false;
        this.groundLevel = 1.5; // Player height in this room
        this.keyStates = app.keyStates; // Share keyStates with app

        // Frogger-specific properties
        this.currentZone = 'start'; // The zone the player is currently in
        this.inWaterZone = false;   // Flag for detecting if player is in water zone
        this.hasWon = false;        // Flag for winning the game

        // Camera rotation properties (copied)
        this.verticalRotation = 0;
        this.maxVerticalRotation = Math.PI / 9;
        this.minVerticalRotation = -Math.PI / 9;

        // Footstep sound properties (copied)
        this.lastFootstepTime = 0;
        this.footstepInterval = 450;

        // Bind methods
        this.init = this.init.bind(this);
        this.update = this.update.bind(this);
        this.handleMovement = this.handleMovement.bind(this);
        this.checkCollision = this.checkCollision.bind(this);
        this.createFroggerRoom = this.createFroggerRoom.bind(this);
        this.setupLighting = this.setupLighting.bind(this);
        this.unload = this.unload.bind(this);
        this.getCurrentZone = this.getCurrentZone.bind(this);
        this.createZones = this.createZones.bind(this);

        // Add vehicle properties
        this.vehicles = {
            lane1: [], // Cars moving left to right (medium speed)
            lane2: [], // Buses moving right to left (medium speed)
            lane3: []  // Cars moving left to right (fast speed)
        };
        
        this.vehicleSpeeds = {
            lane1: 0.12,  // Medium speed
            lane2: 0.12,  // Medium speed
            lane3: 0.2    // Fast speed
        };
        
        this.spawnTimers = {
            lane1: 0,
            lane2: 0,
            lane3: 0
        };
        
        this.spawnIntervals = {
            lane1: 3000, // Milliseconds between spawns
            lane2: 4500, // Longer interval for buses
            lane3: 2500  // Shorter interval for fast cars
        };
        
        this.lastSpawnTime = Date.now();
        
        // Bind additional methods
        this.createVehicles = this.createVehicles.bind(this);
        this.updateVehicles = this.updateVehicles.bind(this);
        this.spawnVehicle = this.spawnVehicle.bind(this);

        // Add game state properties
        this.isGameOver = false;
        this.transitionInProgress = false;
        
        // Bind additional methods
        this.checkVehicleCollisions = this.checkVehicleCollisions.bind(this);
        this.handleGameOver = this.handleGameOver.bind(this);

        // Add log properties similar to vehicles
        this.logs = {
            lane1: [], // Long logs, left to right, medium speed
            lane2: [], // Short logs, right to left, medium speed 
            lane3: [], // Long logs, right to left, high speed
            lane4: []  // Short logs, left to right, highest speed
        };
        
        // Reduce log speeds by 50%
        this.logSpeeds = {
            lane1: 0.01,  // Medium speed (reduced from 0.06)
            lane2: 0.02,  // Medium speed (reduced from 0.08)
            lane3: 0.03,  // High speed (reduced from 0.12)
            lane4: 0.06  // Highest speed (reduced from 0.15)
        };
        
        this.logSizes = {
            lane1: { length: 6, width: 2.5, height: 0.4 }, // Long logs - increased width from 1.5 to 2.5
            lane2: { length: 3, width: 2.5, height: 0.4 }, // Short logs - increased width from 1.5 to 2.5
            lane3: { length: 5, width: 2.5, height: 0.4 }, // Medium-long logs - increased width from 1.5 to 2.5
            lane4: { length: 2.5, width: 2.5, height: 0.4 } // Short logs - increased width from 1.5 to 2.5
        };
        
        this.logSpawnTimers = {
            lane1: 0,
            lane2: 0,
            lane3: 0,
            lane4: 0
        };
        
        // Reduce spawn intervals to make logs appear more frequently
        this.logSpawnIntervals = {
            lane1: 2000,  // Reduced from 8000 ms
            lane2: 3000,  // Reduced from 6000 ms
            lane3: 4000,  // Reduced from 9000 ms
            lane4: 2000   // Reduced from 5000 ms
        };
        
        this.lastLogSpawnTime = Date.now();
        
        // Add a flag to track if player is on a log
        this.playerOnLog = false;
        this.currentLog = null;
        
        // Bind additional log-related methods
        this.createLogs = this.createLogs.bind(this);
        this.updateLogs = this.updateLogs.bind(this);
        this.spawnLog = this.spawnLog.bind(this);
        this.checkLogCollisions = this.checkLogCollisions.bind(this);

    }

    /**
     * Initialize the Frogger level
     */
    init() {
        console.log('Initializing Real Frogger level...');

        // Set up the scene appearance
        this.scene.background = new THREE.Color(0x87CEEB); // Light blue sky
        this.scene.fog = new THREE.FogExp2(0x87CEEB, 0.01); // Light fog for depth

        // Reset camera position and rotation for room start
        this.camera.position.set(0, this.groundLevel, this.ROOM_LENGTH/2 - this.START_ZONE_DEPTH/2); // Start in the middle of the start zone
        this.camera.rotation.set(0, 0, 0); // Changed from Math.PI to 0 to face toward the game area instead of the back wall
        this.verticalRotation = 0; // Reset vertical look angle

        // Create the room environment
        this.createFroggerRoom();
        this.createZones();
        this.setupLighting();

        // Ensure controls are enabled
        if (this.app) {
            this.app.enableControls();
        }

        console.log('Real Frogger level initialized');
        
        // Display instructions
        if (this.app && typeof this.app.showInteractionFeedback === 'function') {
            this.app.showInteractionFeedback('Cross all zones to reach the goal!');
        }
        
        // Initialize logs
        this.createLogs();
        
        return this;
    }

    /**
     * Create the room geometry for the Frogger level
     */
    createFroggerRoom() {
        console.log('Creating Frogger room geometry...');
        this.roomObjects = []; // Clear previous objects

        // Create materials
        const wallMaterial = new THREE.MeshStandardMaterial({
            color: 0x555555, // Grey walls
            roughness: 0.8,
            metalness: 0.2
        });
        
        const ceilingMaterial = new THREE.MeshStandardMaterial({
            color: 0x444444, // Dark grey ceiling
            roughness: 0.9,
            metalness: 0.1
        });

        // Ceiling
        const ceilingGeometry = new THREE.PlaneGeometry(this.ROOM_WIDTH, this.ROOM_LENGTH);
        const ceiling = new THREE.Mesh(ceilingGeometry, ceilingMaterial);
        ceiling.rotation.x = Math.PI / 2;
        ceiling.position.y = this.ROOM_HEIGHT;
        ceiling.position.z = 0; // Center of room
        this.scene.add(ceiling);
        this.roomObjects.push(ceiling);

        // North Wall (back wall, -Z end)
        const northWallGeometry = new THREE.BoxGeometry(this.ROOM_WIDTH, this.ROOM_HEIGHT, this.WALL_THICKNESS);
        const northWall = new THREE.Mesh(northWallGeometry, wallMaterial);
        northWall.position.set(0, this.ROOM_HEIGHT/2, -this.ROOM_LENGTH/2);
        this.scene.add(northWall);
        this.roomObjects.push(northWall);

        // South Wall (front wall, +Z end)
        const southWallGeometry = new THREE.BoxGeometry(this.ROOM_WIDTH, this.ROOM_HEIGHT, this.WALL_THICKNESS);
        const southWall = new THREE.Mesh(southWallGeometry, wallMaterial);
        southWall.position.set(0, this.ROOM_HEIGHT/2, this.ROOM_LENGTH/2);
        this.scene.add(southWall);
        this.roomObjects.push(southWall);

        // East Wall (right wall, +X)
        const eastWallGeometry = new THREE.BoxGeometry(this.WALL_THICKNESS, this.ROOM_HEIGHT, this.ROOM_LENGTH);
        const eastWall = new THREE.Mesh(eastWallGeometry, wallMaterial);
        eastWall.position.set(this.ROOM_WIDTH/2, this.ROOM_HEIGHT/2, 0);
        this.scene.add(eastWall);
        this.roomObjects.push(eastWall);

        // West Wall (left wall, -X)
        const westWallGeometry = new THREE.BoxGeometry(this.WALL_THICKNESS, this.ROOM_HEIGHT, this.ROOM_LENGTH);
        const westWall = new THREE.Mesh(westWallGeometry, wallMaterial);
        westWall.position.set(-this.ROOM_WIDTH/2, this.ROOM_HEIGHT/2, 0);
        this.scene.add(westWall);
        this.roomObjects.push(westWall);

        console.log('Frogger room geometry created.');
    }

    /**
     * Create the distinct game zones (start, road, water, goal)
     */
    createZones() {
        console.log('Creating Frogger game zones...');
        
        // Create materials for each zone
        const startZoneMaterial = new THREE.MeshStandardMaterial({
            color: 0x7CFC00, // Lawn green
            roughness: 0.9,
            metalness: 0.0
        });
        
        const roadZoneMaterial = new THREE.MeshStandardMaterial({
            color: 0x333333, // Dark grey for asphalt
            roughness: 0.7,
            metalness: 0.3
        });
        
        const waterZoneMaterial = new THREE.MeshStandardMaterial({
            color: 0x1E90FF, // Dodger blue
            roughness: 0.3,
            metalness: 0.5,
            transparent: true,
            opacity: 0.8
        });
        
        const goalZoneMaterial = new THREE.MeshStandardMaterial({
            color: 0x00FF00, // Bright green
            roughness: 0.9,
            metalness: 0.0,
            emissive: 0x003300, // Subtle glow
            emissiveIntensity: 0.2
        });
        
        // Calculate the center points for each zone
        const halfLength = this.ROOM_LENGTH / 2;
        
        // Z positions for zone starts (from south/positive Z to north/negative Z)
        const startZoneZ = halfLength - this.START_ZONE_DEPTH/2;
        const roadZoneZ = halfLength - this.START_ZONE_DEPTH - this.ROAD_ZONE_DEPTH/2;
        const waterZoneZ = halfLength - this.START_ZONE_DEPTH - this.ROAD_ZONE_DEPTH - this.WATER_ZONE_DEPTH/2;
        const goalZoneZ = halfLength - this.START_ZONE_DEPTH - this.ROAD_ZONE_DEPTH - this.WATER_ZONE_DEPTH - this.GOAL_ZONE_DEPTH/2;
        
        // Create the four zones as floor planes
        // 1. Start Zone (first safe zone)
        const startZoneGeometry = new THREE.PlaneGeometry(this.ROOM_WIDTH, this.START_ZONE_DEPTH);
        const startZone = new THREE.Mesh(startZoneGeometry, startZoneMaterial);
        startZone.rotation.x = -Math.PI / 2; // Make it horizontal
        startZone.position.set(0, 0, startZoneZ);
        startZone.userData = { zone: 'start', isSafe: true };
        this.scene.add(startZone);
        this.zoneObjects.push(startZone);
        
        // 2. Road Zone (with 3 distinct lanes)
        // Create the base road
        const roadZoneGeometry = new THREE.PlaneGeometry(this.ROOM_WIDTH, this.ROAD_ZONE_DEPTH);
        const roadZone = new THREE.Mesh(roadZoneGeometry, roadZoneMaterial);
        roadZone.rotation.x = -Math.PI / 2;
        roadZone.position.set(0, 0, roadZoneZ);
        roadZone.userData = { zone: 'road', isSafe: true }; // Will be false when cars are added
        this.scene.add(roadZone);
        this.zoneObjects.push(roadZone);
        
        // Calculate lane positions and widths
        const laneWidth = this.ROAD_ZONE_DEPTH / 3;
        const lane1Z = roadZoneZ - laneWidth;   // Top lane
        const lane2Z = roadZoneZ;               // Middle lane
        const lane3Z = roadZoneZ + laneWidth;   // Bottom lane
        
        // Create road markings for more realistic traffic pattern
        // 1. Double yellow lines to separate lanes
        
        // Yellow line between lane 1 and lane 2
        const yellowLine1Geometry = new THREE.PlaneGeometry(this.ROOM_WIDTH, 0.15);
        const yellowMaterial = new THREE.MeshBasicMaterial({ color: 0xFFFF00 });
        const yellowLine1a = new THREE.Mesh(yellowLine1Geometry, yellowMaterial);
        yellowLine1a.rotation.x = -Math.PI / 2;
        yellowLine1a.position.set(0, 0.02, roadZoneZ - laneWidth/2 - 0.1); // Between lanes 1 & 2
        this.scene.add(yellowLine1a);
        this.zoneObjects.push(yellowLine1a);
        
        const yellowLine1b = new THREE.Mesh(yellowLine1Geometry, yellowMaterial);
        yellowLine1b.rotation.x = -Math.PI / 2;
        yellowLine1b.position.set(0, 0.02, roadZoneZ - laneWidth/2 + 0.1); // Between lanes 1 & 2
        this.scene.add(yellowLine1b);
        this.zoneObjects.push(yellowLine1b);
        
        // Yellow line between lane 2 and lane 3
        const yellowLine2a = new THREE.Mesh(yellowLine1Geometry, yellowMaterial);
        yellowLine2a.rotation.x = -Math.PI / 2;
        yellowLine2a.position.set(0, 0.02, roadZoneZ + laneWidth/2 - 0.1); // Between lanes 2 & 3
        this.scene.add(yellowLine2a);
        this.zoneObjects.push(yellowLine2a);
        
        const yellowLine2b = new THREE.Mesh(yellowLine1Geometry, yellowMaterial);
        yellowLine2b.rotation.x = -Math.PI / 2;
        yellowLine2b.position.set(0, 0.02, roadZoneZ + laneWidth/2 + 0.1); // Between lanes 2 & 3
        this.scene.add(yellowLine2b);
        this.zoneObjects.push(yellowLine2b);
        
        // 2. Dashed white lines in the CENTER of each lane
        const createDashedLine = (zPosition) => {
            const dashLength = 1;
            const gapLength = 2;
            const totalDashes = Math.floor(this.ROOM_WIDTH / (dashLength + gapLength));
            const startX = -this.ROOM_WIDTH/2 + dashLength/2;
            
            for (let j = 0; j < totalDashes; j++) {
                const dashX = startX + j * (dashLength + gapLength);
                
                // Create each dash as a separate geometry
                const dashGeometry = new THREE.PlaneGeometry(dashLength, 0.1);
                const dashMaterial = new THREE.MeshBasicMaterial({ color: 0xFFFFFF });
                const dash = new THREE.Mesh(dashGeometry, dashMaterial);
                dash.rotation.x = -Math.PI / 2;
                dash.position.set(dashX, 0.01, zPosition); // Slightly above road
                this.scene.add(dash);
                this.zoneObjects.push(dash);
            }
        };
        
        // Create dashed white lines in the center of each lane
        createDashedLine(lane1Z);  // Center of lane 1
        createDashedLine(lane2Z);  // Center of lane 2
        createDashedLine(lane3Z);  // Center of lane 3
        
        // 3. Water Zone (blue with a slight wave effect)
        const waterZoneGeometry = new THREE.PlaneGeometry(this.ROOM_WIDTH, this.WATER_ZONE_DEPTH, 32, 32);
        const waterZone = new THREE.Mesh(waterZoneGeometry, waterZoneMaterial);
        waterZone.rotation.x = -Math.PI / 2;
        waterZone.position.set(0, 0, waterZoneZ);
        waterZone.userData = { zone: 'water', isSafe: false }; // Can't walk on water directly
        
        // Add subtle wave animation to the water vertices (will be animated in update)
        const waterPositions = waterZone.geometry.attributes.position;
        this.waterWaveTime = 0;
        this.waterVertices = [];
        
        for (let i = 0; i < waterPositions.count; i++) {
            const x = waterPositions.getX(i);
            const y = waterPositions.getY(i);
            const z = waterPositions.getZ(i);
            this.waterVertices.push({ x, y, z, originalZ: z });
        }
        
        this.scene.add(waterZone);
        this.zoneObjects.push(waterZone);
        this.waterZone = waterZone; // Save reference for animation
        
        // 4. Goal Zone (safe ending area)
        const goalZoneGeometry = new THREE.PlaneGeometry(this.ROOM_WIDTH, this.GOAL_ZONE_DEPTH);
        const goalZone = new THREE.Mesh(goalZoneGeometry, goalZoneMaterial);
        goalZone.rotation.x = -Math.PI / 2;
        goalZone.position.set(0, 0, goalZoneZ);
        goalZone.userData = { zone: 'goal', isSafe: true };
        this.scene.add(goalZone);
        this.zoneObjects.push(goalZone);
        
        // Removed the gold marker cubes from the goal zone as they're unnecessary
        // since reaching the green zone already triggers the win condition
        
        // Initialize vehicles after all zones are created
        this.createVehicles();
        
        console.log('Frogger game zones created.');
    }

    /**
     * Create vehicles for the road lanes
     */
    createVehicles() {
        console.log('Creating vehicles for the road lanes...');
        
        // Car material - red
        this.carMaterial = new THREE.MeshStandardMaterial({
            color: 0xFF0000,
            roughness: 0.5,
            metalness: 0.7
        });
        
        // Bus material - blue
        this.busMaterial = new THREE.MeshStandardMaterial({
            color: 0x0000FF,
            roughness: 0.5,
            metalness: 0.7
        });
        
        // Fast car material - yellow
        this.fastCarMaterial = new THREE.MeshStandardMaterial({
            color: 0xFFFF00,
            roughness: 0.5,
            metalness: 0.7
        });
        
        // Start the initial spawn timers
        this.spawnTimers.lane1 = Math.random() * 1000; // Random initial delay
        this.spawnTimers.lane2 = Math.random() * 2000;
        this.spawnTimers.lane3 = Math.random() * 1500;
        
        console.log('Vehicle system initialized');
    }
    
    /**
     * Spawn a vehicle in the specified lane
     * @param {string} lane - The lane identifier ('lane1', 'lane2', 'lane3')
     */
    spawnVehicle(lane) {
        // Calculate the road zone position
        const halfLength = this.ROOM_LENGTH / 2;
        const roadZoneZ = halfLength - this.START_ZONE_DEPTH - this.ROAD_ZONE_DEPTH/2;
        const laneWidth = this.ROAD_ZONE_DEPTH / 3;
        
        // Calculate z position based on lane
        let zPos;
        let direction;
        let material;
        let size;
        
        if (lane === 'lane1') {
            // Lane 1: Top lane - Cars going left to right
            zPos = roadZoneZ - laneWidth; // First lane from the top
            direction = 1; // Moving right (positive X)
            material = this.carMaterial;
            size = { length: 2, width: 1, height: 0.8 }; // Car size
        } 
        else if (lane === 'lane2') {
            // Lane 2: Middle lane - Buses going right to left
            zPos = roadZoneZ; // Middle lane
            direction = -1; // Moving left (negative X)
            material = this.busMaterial;
            size = { length: 4, width: 1.2, height: 1.2 }; // Bus size (longer)
        }
        else if (lane === 'lane3') {
            // Lane 3: Bottom lane - Fast cars going left to right
            zPos = roadZoneZ + laneWidth; // Third lane from the top
            direction = 1; // Moving right (positive X)
            material = this.fastCarMaterial;
            size = { length: 2, width: 1, height: 0.8 }; // Same car size
        }
        
        // Create vehicle geometry
        const vehicleGeometry = new THREE.BoxGeometry(
            size.length,  // Length (along X axis)
            size.height,  // Height (along Y axis)
            size.width    // Width (along Z axis)
        );
        
        const vehicle = new THREE.Mesh(vehicleGeometry, material);
        
        // Position the vehicle outside the room on the appropriate side
        const xStart = direction > 0 ? -this.ROOM_WIDTH/2 - size.length/2 : this.ROOM_WIDTH/2 + size.length/2;
        vehicle.position.set(xStart, size.height/2, zPos);
        
        // Store direction and lane info in the vehicle object
        vehicle.userData = {
            direction: direction,
            lane: lane,
            speed: this.vehicleSpeeds[lane]
        };
        
        // Add to the scene and to the appropriate lane array
        this.scene.add(vehicle);
        this.vehicles[lane].push(vehicle);
    }
    
    /**
     * Update vehicle positions and spawn new ones
     */
    updateVehicles() {
        const currentTime = Date.now();
        const deltaTime = currentTime - this.lastSpawnTime;
        this.lastSpawnTime = currentTime;
        
        // Update spawn timers and spawn new vehicles if needed
        for (const lane in this.spawnTimers) {
            this.spawnTimers[lane] -= deltaTime;
            
            if (this.spawnTimers[lane] <= 0) {
                this.spawnVehicle(lane);
                this.spawnTimers[lane] = this.spawnIntervals[lane] * (0.8 + Math.random() * 0.4); // Add some randomness
            }
        }
        
        // Update positions of all existing vehicles
        for (const lane in this.vehicles) {
            const vehiclesToRemove = [];
            
            this.vehicles[lane].forEach((vehicle, index) => {
                // Move the vehicle
                const moveDistance = vehicle.userData.speed;
                vehicle.position.x += vehicle.userData.direction * moveDistance;
                
                // Check if the vehicle has gone off-screen and should be removed
                if ((vehicle.userData.direction > 0 && vehicle.position.x > this.ROOM_WIDTH/2 + vehicle.geometry.parameters.width/2) ||
                    (vehicle.userData.direction < 0 && vehicle.position.x < -this.ROOM_WIDTH/2 - vehicle.geometry.parameters.width/2)) {
                    vehiclesToRemove.push(index);
                    this.scene.remove(vehicle);
                    vehicle.geometry.dispose();
                    vehicle.material.dispose();
                }
            });
            
            // Remove vehicles that have gone off-screen
            for (let i = vehiclesToRemove.length - 1; i >= 0; i--) {
                this.vehicles[lane].splice(vehiclesToRemove[i], 1);
            }
        }
    }

    /**
     * Create logs for the water lanes
     */
    createLogs() {
        console.log('Creating logs for the water lanes...');
        
        // Create materials for the logs with different colors for each lane
        this.logMaterials = {
            lane1: new THREE.MeshStandardMaterial({
                color: 0x8B4513, // Brown
                roughness: 0.7,
                metalness: 0.3
            }),
            lane2: new THREE.MeshStandardMaterial({
                color: 0x966F33, // Lighter brown
                roughness: 0.7,
                metalness: 0.3
            }),
            lane3: new THREE.MeshStandardMaterial({
                color: 0x7F5217, // Darker brown
                roughness: 0.7,
                metalness: 0.3
            }),
            lane4: new THREE.MeshStandardMaterial({
                color: 0xA0522D, // Sienna
                roughness: 0.7,
                metalness: 0.3
            })
        };
        
        // Start the initial spawn timers with random offsets to prevent all logs spawning at once
        this.logSpawnTimers.lane1 = Math.random() * 3000;
        this.logSpawnTimers.lane2 = Math.random() * 3000;
        this.logSpawnTimers.lane3 = Math.random() * 3000;
        this.logSpawnTimers.lane4 = Math.random() * 3000;
        
        console.log('Log system initialized');
    }
    
    /**
     * Spawn a log in the specified lane
     * @param {string} lane - The lane identifier ('lane1', 'lane2', 'lane3', 'lane4')
     */
    spawnLog(lane) {
        // Calculate the water zone position
        const halfLength = this.ROOM_LENGTH / 2;
        const waterZoneStart = halfLength - this.START_ZONE_DEPTH - this.ROAD_ZONE_DEPTH;
        const waterZoneZ = waterZoneStart - this.WATER_ZONE_DEPTH/2;
        const laneWidth = this.WATER_ZONE_DEPTH / 4;
        
        // Calculate z position based on lane
        let zPos;
        let direction;
        let size = this.logSizes[lane];
        
        if (lane === 'lane1') {
            // Lane 1: Top lane - Long logs left to right
            zPos = waterZoneZ - 1.5 * laneWidth; // First lane from the top
            direction = 1; // Moving right (positive X)
        } 
        else if (lane === 'lane2') {
            // Lane 2: Second lane - Short logs right to left
            zPos = waterZoneZ - 0.5 * laneWidth; // Second lane from the top
            direction = -1; // Moving left (negative X)
        }
        else if (lane === 'lane3') {
            // Lane 3: Third lane - Long logs right to left
            zPos = waterZoneZ + 0.5 * laneWidth; // Third lane from the top
            direction = -1; // Moving left (negative X)
        }
        else if (lane === 'lane4') {
            // Lane 4: Bottom lane - Short logs left to right
            zPos = waterZoneZ + 1.5 * laneWidth; // Fourth lane from the top
            direction = 1; // Moving right (positive X)
        }
        
        // Create log geometry
        const logGeometry = new THREE.BoxGeometry(
            size.length, // Length
            size.height, // Height
            size.width   // Width
        );
        
        const log = new THREE.Mesh(logGeometry, this.logMaterials[lane]);
        
        // Position the log outside the room on the appropriate side
        const xStart = direction > 0 ? -this.ROOM_WIDTH/2 - size.length/2 : this.ROOM_WIDTH/2 + size.length/2;
        log.position.set(xStart, size.height/2, zPos);
        
        // Store direction and lane info in the log object
        log.userData = {
            direction: direction,
            lane: lane,
            speed: this.logSpeeds[lane],
            isLog: true
        };
        
        // Add to the scene and to the appropriate lane array
        this.scene.add(log);
        this.logs[lane].push(log);
    }
    
    /**
     * Update log positions and spawn new ones
     */
    updateLogs() {
        const currentTime = Date.now();
        const deltaTime = currentTime - this.lastLogSpawnTime;
        this.lastLogSpawnTime = currentTime;
        
        // Update spawn timers and spawn new logs if needed
        for (const lane in this.logSpawnTimers) {
            this.logSpawnTimers[lane] -= deltaTime;
            
            if (this.logSpawnTimers[lane] <= 0) {
                this.spawnLog(lane);
                this.logSpawnTimers[lane] = this.logSpawnIntervals[lane] * (0.8 + Math.random() * 0.4); // Add some randomness
            }
        }
        
        // Update positions of all existing logs
        for (const lane in this.logs) {
            const logsToRemove = [];
            
            this.logs[lane].forEach((log, index) => {
                // Move the log
                const moveDistance = log.userData.speed;
                log.position.x += log.userData.direction * moveDistance;
                
                // Check if the log has gone off-screen and should be removed
                if ((log.userData.direction > 0 && log.position.x > this.ROOM_WIDTH/2 + log.geometry.parameters.width/2) ||
                    (log.userData.direction < 0 && log.position.x < -this.ROOM_WIDTH/2 - log.geometry.parameters.width/2)) {
                    logsToRemove.push(index);
                    this.scene.remove(log);
                    log.geometry.dispose();
                    log.material.dispose();
                }
            });
            
            // Remove logs that have gone off-screen
            for (let i = logsToRemove.length - 1; i >= 0; i--) {
                this.logs[lane].splice(logsToRemove[i], 1);
            }
        }
        
        // If player is on a log, move them with the log
        if (this.playerOnLog && this.currentLog) {
            const log = this.currentLog;
            const moveDistance = log.userData.speed * log.userData.direction;
            this.camera.position.x += moveDistance;
            
            // Make sure player doesn't go outside room boundaries
            if (this.camera.position.x > this.ROOM_WIDTH/2 - 0.5) {
                this.camera.position.x = this.ROOM_WIDTH/2 - 0.5;
            } else if (this.camera.position.x < -this.ROOM_WIDTH/2 + 0.5) {
                this.camera.position.x = -this.ROOM_WIDTH/2 + 0.5;
            }
        }
    }
    
    /**
     * Check if player is standing on a log
     */
    checkLogCollisions() {
        this.playerOnLog = false;
        this.currentLog = null;
        
        // Only check for logs if player is in water zone
        if (!this.inWaterZone) {
            return;
        }
        
        // Get player position
        const playerPosition = this.camera.position.clone();
        const playerRadius = 0.5; // Player's collision radius
        
        // Check each lane for log collisions
        for (const lane in this.logs) {
            for (const log of this.logs[lane]) {
                // Get log dimensions
                const logLength = log.geometry.parameters.width; // X dimension
                const logWidth = log.geometry.parameters.depth;  // Z dimension
                
                // Calculate distance between player and log center
                const dx = Math.abs(playerPosition.x - log.position.x);
                const dz = Math.abs(playerPosition.z - log.position.z);
                
                // Check if player is on this log
                const halfLength = logLength / 2;
                const halfWidth = logWidth / 2;
                
                if (dx < halfLength && dz < halfWidth) {
                    // Player is on this log
                    this.playerOnLog = true;
                    this.currentLog = log;
                    return;
                }
            }
        }
    }

    /**
     * Set up basic lighting for the Frogger room
     */
    setupLighting() {
        console.log('Setting up Frogger room lighting...');
        this.roomLights = []; // Clear previous lights

        // Main ambient light
        const ambientLight = new THREE.AmbientLight(0xCCCCCC, 0.7);
        this.scene.add(ambientLight);
        this.roomLights.push(ambientLight);

        // Directional light (sunlight)
        const sunLight = new THREE.DirectionalLight(0xFFFFFF, 0.8);
        sunLight.position.set(50, 100, 50);
        sunLight.castShadow = true;
        this.scene.add(sunLight);
        this.roomLights.push(sunLight);

        // Add a spotlight over the goal zone for emphasis
        const spotLight = new THREE.SpotLight(0xFFFFFF, 1);
        spotLight.position.set(0, this.ROOM_HEIGHT-1, -this.ROOM_LENGTH/2 + this.GOAL_ZONE_DEPTH/2);
        spotLight.angle = Math.PI / 6;
        spotLight.penumbra = 0.3;
        spotLight.decay = 1;
        spotLight.distance = this.GOAL_ZONE_DEPTH * 2;
        this.scene.add(spotLight);
        this.roomLights.push(spotLight);

        console.log('Frogger room lighting set up.');
    }

    /**
     * Determine which zone the player is currently in based on position
     * @param {THREE.Vector3} position - The player's position
     * @returns {string} - Name of the current zone ('start', 'road', 'water', 'goal')
     */
    getCurrentZone(position) {
        const halfLength = this.ROOM_LENGTH / 2;
        const z = position.z;
        
        if (z >= halfLength - this.START_ZONE_DEPTH) {
            return 'start';
        } else if (z >= halfLength - this.START_ZONE_DEPTH - this.ROAD_ZONE_DEPTH) {
            return 'road';
        } else if (z >= halfLength - this.START_ZONE_DEPTH - this.ROAD_ZONE_DEPTH - this.WATER_ZONE_DEPTH) {
            return 'water';
        } else {
            return 'goal';
        }
    }

    /**
     * Update loop for the Frogger level
     */
    update() {
        // Skip updates if game is over or transition is in progress
        if (this.isGameOver || this.transitionInProgress) {
            return;
        }
        
        // Handle player movement for this level
        this.handleMovement();
        
        // Update vehicle positions and spawn new ones
        this.updateVehicles();
        
        // Update log positions and spawn new ones
        this.updateLogs();
        
        // Check for collisions with vehicles
        this.checkVehicleCollisions();
        
        // Check if player is on a log
        this.checkLogCollisions();
        
        // Water zone management with grace period
        if (this.inWaterZone) {
            if (!this.playerOnLog && !this.isJumping) {
                // Player is in water and not on a log or jumping
                this.timeInWater += this.app.deltaTime || 16; // Default to 16ms if deltaTime not available
                
                // Drown if grace period exceeded
                    this.handleGameOver("SLEEP WITH THE FISHES!");
                
            }
        } else {
            // Player is out of the water zone
            this.timeInWater = 0;
        }
        
        // Animate water waves
        if (this.waterZone && this.waterVertices) {
            this.waterWaveTime += 0.03;
            const waterPositions = this.waterZone.geometry.attributes.position;
            
            for (let i = 0; i < this.waterVertices.length; i++) {
                const vertex = this.waterVertices[i];
                // Create a subtle wave effect using sine waves
                const waveFactor = Math.sin(vertex.x * 0.5 + this.waterWaveTime) * 0.1;
                waterPositions.setZ(i, vertex.originalZ + waveFactor);
            }
            
            waterPositions.needsUpdate = true;
        }
        
        // Check if player has reached the goal zone
        const currentZone = this.getCurrentZone(this.camera.position);
        
        if (currentZone === 'goal' && !this.hasWon) {
            this.hasWon = true;
            console.log('Player has reached the goal!');
            
            // Display win message
            if (this.app && typeof this.app.showInteractionFeedback === 'function') {
                this.app.showInteractionFeedback('YOU WIN!');
            }
            
            // Play win sound if available
            if (this.app && typeof this.app.playSound === 'function') {
                // Using interaction sound as a placeholder
                this.app.playSound('interaction');
            }
            
            // Transition back to corridor with win result after a delay
            setTimeout(() => {
                if (this.app) {
                    this.app.transitionToLevel('corridor', {
                        isRespawn: true,
                        gameResult: {
                            result: 'win',
                            game: 'real_frogger',
                            doorId: 'corridor-door-9' // This matches the door ID in corridor.js
                        }
                    });
                }
            }, 2000); // 2 second delay
        }
        
        // Check if player is in water (will be deadly when no logs are available and grace period expires)
        this.inWaterZone = this.getCurrentZone(this.camera.position) === 'water';
    }
    
    /**
     * Check if player has collided with any vehicles
     */
    checkVehicleCollisions() {
        // Skip collision check if game is already over
        if (this.isGameOver) {
            return;
        }
        
        // Get player position and create a bounding sphere for collision detection
        const playerPosition = this.camera.position.clone();
        const playerRadius = 0.5; // Player's collision radius
        
        // Check each lane for vehicle collisions
        for (const lane in this.vehicles) {
            for (const vehicle of this.vehicles[lane]) {
                // Get vehicle dimensions for more accurate collision detection
                const vehicleLength = vehicle.geometry.parameters.width; // X-axis dimension
                const vehicleWidth = vehicle.geometry.parameters.depth;  // Z-axis dimension
                
                // Calculate distance between player and vehicle
                const dx = Math.abs(playerPosition.x - vehicle.position.x);
                const dz = Math.abs(playerPosition.z - vehicle.position.z);
                
                // Allow a small buffer inside the vehicle bounds (0.9 factor)
                const halfLength = (vehicleLength * 0.9) / 2;
                const halfWidth = (vehicleWidth * 0.9) / 2;
                
                // If player is inside the vehicle bounding box, trigger collision
                if (dx < halfLength + playerRadius && dz < halfWidth + playerRadius) {
                    console.log(`Collision detected with vehicle in ${lane}!`);
                    this.handleGameOver("ROADKILL!");
                    return; // Exit after first collision
                }
            }
        }
    }
    
    /**
     * Handle game over scenario
     * @param {string} message - The game over message to display
     */
    handleGameOver(message) {
        // Set game over flag
        this.isGameOver = true;
        
        // Show game over message
        if (this.app && typeof this.app.showInteractionFeedback === 'function') {
            this.app.showInteractionFeedback(message, true); // true indicates this is a game over message
        }
        
        // Play death sound if available
        if (this.app && typeof this.app.playSound === 'function') {
            this.app.playSound('gameOver');
        }
        
        // Start transition back to corridor after a delay
        setTimeout(() => {
            this.transitionBackToCorridor();
        }, 2000); // 2 second delay before transition
    }
    /**
 * Transition back to the corridor level
 */
async transitionBackToCorridor() {
    // Prevent multiple transitions
    if (this.transitionInProgress) {
        return;
    }
    
    this.transitionInProgress = true;
    
    // Use app's transition method if available
    if (this.app && typeof this.app.transitionToLevel === 'function') {
        await this.app.transitionToLevel('corridor', {
            isRespawn: true,
            gameResult: {
                result: 'loss',
                game: 'real_frogger',
                doorId: 'corridor-door-9' // This matches the door ID in corridor.js
            }
        });
    } else {
        console.error('Cannot transition: app.transitionToLevel is not available');
    }
    
    this.transitionInProgress = false;
}

    /**
     * Handle player movement and camera rotation based on key states.
     */
    handleMovement() {
        // Don't process movement if controls are disabled or game is over
        if ((this.app && this.app.controlsDisabled) || this.isGameOver) {
            return;
        }

        // Get the camera's forward and right vectors
        const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(this.camera.quaternion);
        forward.y = 0; // Keep movement horizontal
        forward.normalize();

        const right = new THREE.Vector3(1, 0, 0).applyQuaternion(this.camera.quaternion);
        right.y = 0; // Keep movement horizontal
        right.normalize();

        // Calculate movement direction based on key states
        const moveDirection = new THREE.Vector3(0, 0, 0);

        // WASD keys for movement
        if (this.keyStates['KeyW']) {
            moveDirection.add(forward);
        }
        if (this.keyStates['KeyS']) {
            moveDirection.sub(forward);
        }
        if (this.keyStates['KeyA']) {
            moveDirection.sub(right);
        }
        if (this.keyStates['KeyD']) {
            moveDirection.add(right);
        }

        // Normalize movement direction if moving diagonally
        if (moveDirection.length() > 0) {
            moveDirection.normalize();
        }

        // Apply movement speed
        moveDirection.multiplyScalar(this.moveSpeed);

        // Calculate new position
        const newPosition = this.camera.position.clone().add(moveDirection);

        // Check for collisions using this level's collision logic
        const adjustedPosition = this.checkCollision(newPosition);

        // Update camera position
        this.camera.position.copy(adjustedPosition);

        // Play footstep sounds if we're moving and not jumping
        if (moveDirection.length() > 0 && !this.isJumping) {
            const now = performance.now();
            if (now - this.lastFootstepTime > this.footstepInterval) {
                 if (this.app && typeof this.app.playSound === 'function') {
                    this.app.playSound('footstep');
                }
                this.lastFootstepTime = now;
            }
        }

        // --- Rotation Handling ---
        const euler = new THREE.Euler().setFromQuaternion(this.camera.quaternion, 'YXZ');
        let yaw = euler.y;   // Horizontal rotation (left/right)
        let pitch = euler.x; // Vertical rotation (up/down)

        // Handle horizontal rotation (left/right arrows)
        const rotationSpeed = 0.040;
        if (this.keyStates['ArrowLeft']) {
            yaw += rotationSpeed;
        }
        if (this.keyStates['ArrowRight']) {
            yaw -= rotationSpeed;
        }

        // Handle vertical rotation (up/down arrows)
        const lookSpeed = 0.02;
        const maxLookUp = Math.PI / 9;    // ~30 degrees up
        const maxLookDown = Math.PI / 9;  // ~30 degrees down
        const lookReturnSpeed = 0.02;     // Auto-return speed

        if (this.keyStates['ArrowUp']) {
            pitch = Math.min(pitch + lookSpeed, maxLookDown); // Corrected: positive pitch looks down
        } else if (this.keyStates['ArrowDown']) {
            pitch = Math.max(pitch - lookSpeed, -maxLookUp); // Corrected: negative pitch looks up
        } else if (pitch !== 0) {
            // Auto-return pitch to neutral
            if (Math.abs(pitch) < lookReturnSpeed) {
                pitch = 0;
            } else if (pitch > 0) {
                pitch -= lookReturnSpeed;
            } else {
                pitch += lookReturnSpeed;
            }
        }

        // Always force roll to zero
        const roll = 0;

        // Apply the updated rotation
        euler.set(pitch, yaw, roll, 'YXZ');
        this.camera.quaternion.setFromEuler(euler);

        // --- Jump Handling ---
        if (this.keyStates['Space'] && !this.isJumping) {
            // Start jump if we're on the ground
            if (Math.abs(this.camera.position.y - this.groundLevel) < 0.1) {
                this.isJumping = true;
                this.jumpVelocity = 0.2; // Initial upward velocity

                if (this.app && typeof this.app.playSound === 'function') {
                    this.app.playSound('jump');
                }
            }
        }

        // --- Jump Physics ---
        if (this.isJumping) {
            // Apply jump velocity
            this.camera.position.y += this.jumpVelocity;

            // Apply gravity
            this.jumpVelocity -= this.gravity;

            // Check if we've landed
            if (this.camera.position.y <= this.groundLevel) {
                this.camera.position.y = this.groundLevel;
                this.isJumping = false;
                this.jumpVelocity = 0;
            }
        }
        // Ensure player stays on ground level if not jumping (safety net)
        if (!this.isJumping) {
             this.camera.position.y = this.groundLevel;
        }

        // Handle Escape key (optional)
        if (this.keyStates['Escape']) {
            console.log('Escape key pressed in Frogger room');
            // Potentially transition back or show a pause menu
        }
    }

    /**
     * Check for collisions with room walls and water zones
     * @param {THREE.Vector3} potentialPosition - The potential new position of the player camera.
     * @returns {THREE.Vector3} - The adjusted position after collision checks.
     */
    checkCollision(potentialPosition) {
        const adjustedPosition = potentialPosition.clone();
        const playerRadius = 0.5; // Player's approximate horizontal size

        // Room boundaries (with small buffer)
        const maxX = this.ROOM_WIDTH/2 - playerRadius - 0.1;
        const minX = -this.ROOM_WIDTH/2 + playerRadius + 0.1;
        const maxZ = this.ROOM_LENGTH/2 - playerRadius - 0.1;
        const minZ = -this.ROOM_LENGTH/2 + playerRadius + 0.1;

        // Basic boundary checks
        if (adjustedPosition.x > maxX) adjustedPosition.x = maxX;
        if (adjustedPosition.x < minX) adjustedPosition.x = minX;
        if (adjustedPosition.z > maxZ) adjustedPosition.z = maxZ;
        if (adjustedPosition.z < minZ) adjustedPosition.z = minZ;
        
        // If game is over, prevent any movement
        if (this.isGameOver) {
            return this.camera.position.clone();
        }
        
        // Check which zone the player is in
        const currentZone = this.getCurrentZone(adjustedPosition);
        
        // If player is in water zone and there are no logs (not yet implemented)
        // they can't move into the water
        if (currentZone === 'water') {
            // This will prevent walking on water until logs/rafts are implemented
            // For now, we'll let the player through for testing, but in future:
            // const prevZone = this.getCurrentZone(this.camera.position);
            // if (prevZone !== 'water') {
            //     // Player is trying to enter water from another zone - block them
            //     if (prevZone === 'road') {
            //         // Coming from road (positive Z), so block at water boundary
            //         const waterBoundary = this.ROOM_LENGTH/2 - this.START_ZONE_DEPTH - this.ROAD_ZONE_DEPTH;
            //         adjustedPosition.z = waterBoundary + playerRadius;
            //     } else if (prevZone === 'goal') {
            //         // Coming from goal (negative Z), so block at water boundary
            //         const waterBoundary = this.ROOM_LENGTH/2 - this.START_ZONE_DEPTH - this.ROAD_ZONE_DEPTH - this.WATER_ZONE_DEPTH;
            //         adjustedPosition.z = waterBoundary - playerRadius;
            //     }
            // }
        }

        return adjustedPosition;
    }

    /**
     * Clean up resources when unloading the level
     */
    unload() {
        console.log('Unloading Real Frogger level...');

        // Remove objects from scene and dispose geometry/material
        [...this.roomObjects, ...this.zoneObjects].forEach(object => {
            if (object.parent) {
                object.parent.remove(object);
            }
            if (object.geometry) object.geometry.dispose();
            if (object.material) {
                if (Array.isArray(object.material)) {
                    object.material.forEach(material => {
                        if (material.map) material.map.dispose();
                        material.dispose();
                    });
                } else {
                    if (object.material.map) object.material.map.dispose();
                    object.material.dispose();
                }
            }
        });
        this.roomObjects = [];
        this.zoneObjects = [];

        // Remove lights
        this.roomLights.forEach(light => {
            if (light.parent) {
                light.parent.remove(light);
            }
        });
        this.roomLights = [];

        console.log('Real Frogger level unloaded.');
    }
}

// Make the class available globally to fix the "RealFroggerLevel is not defined" error
window.RealFroggerLevel = RealFroggerLevel;