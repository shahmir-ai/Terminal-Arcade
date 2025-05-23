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
            lane1: 0.15,  // Medium speed
            lane2: 0.16,  // Medium speed
            lane3: 0.22    // Fast speed
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
            lane1: 0.06,  // Medium speed (reduced from 0.06)
            lane2: 0.02,  // Medium speed (reduced from 0.08)
            lane3: 0.03,  // High speed (reduced from 0.12)
            lane4: 0.04  // Highest speed (reduced from 0.15)
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
            lane2: 4000,  // Reduced from 6000 ms
            lane3: 4000,  // Reduced from 9000 ms
            lane4: 4000   // Reduced from 5000 ms
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

        // Add model storage
        this.models = {};
        
        // Decorative elements
        this.decorations = [];
        
        // Bind additional methods
        this.loadModels = this.loadModels.bind(this);
        this.createDecorations = this.createDecorations.bind(this);
    }

    /**
     * Initialize the Frogger level
     */
    init() {
        console.log('Initializing Real Frogger level...');

        // Load 3D models first
        return this.loadModels().then(() => {



// Set up the scene appearance
this.scene.background = new THREE.Color(0x87CEEB); // Light blue sky
this.scene.fog = new THREE.FogExp2(0xFFFFFF, 0.015); // White fog

// Create the sky with clouds
this.createSkyWithClouds();



            // Reset camera position and rotation for room start
            this.camera.position.set(0, this.groundLevel, this.ROOM_LENGTH/2 - this.START_ZONE_DEPTH/2); // Start in the middle of the start zone
            this.camera.rotation.set(0, 0, 0); // Changed from Math.PI to 0 to face toward the game area instead of the back wall
            this.verticalRotation = 0; // Reset vertical look angle

            // Create the room environment
            this.createFroggerRoom();
            this.createFogWalls(); // Add this line

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
            
            // Create decorative elements
            this.createDecorations();
            
            return this;
        });
    }
    
    /**
     * Load 3D models for vehicles
     */
    loadModels() {
        console.log('Loading vehicle models...');
        
        // Create a promise that resolves when all models are loaded
        return new Promise((resolve, reject) => {
            // Check if GLTFLoader is available
            if (!THREE.GLTFLoader) {
                console.warn('THREE.GLTFLoader not found. Using fallback geometries.');
                resolve();
                return;
            }
            
            const modelLoader = new THREE.GLTFLoader();
            let modelsToLoad = 2; // car.glb and bus.glb
            let modelsLoaded = 0;
            
            // Function to handle model loading completion
            const onModelLoaded = () => {
                modelsLoaded++;
                if (modelsLoaded === modelsToLoad) {
                    console.log('All vehicle models loaded successfully');
                    resolve();
                }
            };
            
            // Load car model
            modelLoader.load(
                'assets/models/car.glb',
                (gltf) => {
                    console.log('Car model loaded');
                    this.models.car = gltf;
                    onModelLoaded();
                },
                undefined,
                (error) => {
                    console.error('Error loading car model:', error);
                    onModelLoaded(); // Continue even if model fails to load
                }
            );
            
            // Load bus model
            modelLoader.load(
                'assets/models/bus.glb',
                (gltf) => {
                    console.log('Bus model loaded');
                    this.models.bus = gltf;
                    onModelLoaded();
                },
                undefined,
                (error) => {
                    console.error('Error loading bus model:', error);
                    onModelLoaded(); // Continue even if model fails to load
                }
            );
        });
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
 * Create fog walls around the perimeter of the level
 */
createFogWalls() {
    console.log('Creating fog walls...');
    
    // Create a semi-transparent white material for fog effect
    const fogMaterial = new THREE.MeshBasicMaterial({
        color: 0xFFFFFF,
        transparent: true,
        opacity: 0.8,
        side: THREE.DoubleSide
    });
    
    // Create a gradient texture for the fog
    const gradientCanvas = document.createElement('canvas');
    gradientCanvas.width = 256;
    gradientCanvas.height = 256;
    const ctx = gradientCanvas.getContext('2d');
    const gradient = ctx.createLinearGradient(0, 0, 0, 256);
    gradient.addColorStop(0, 'rgba(255, 255, 255, 0.95)');
    gradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.8)');
    gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 256, 256);
    
    const gradientTexture = new THREE.CanvasTexture(gradientCanvas);
    const fogGradientMaterial = new THREE.MeshBasicMaterial({
        map: gradientTexture,
        transparent: true,
        side: THREE.DoubleSide
    });
    
    // Dimensions for the fog walls
    const wallHeight = this.ROOM_HEIGHT * 1.2; // Slightly taller than room
    const wallDepth = 2;
    
    // North Fog Wall (far end)
    const northFogGeometry = new THREE.PlaneGeometry(this.ROOM_WIDTH + 10, wallHeight);
    const northFogWall = new THREE.Mesh(northFogGeometry, fogMaterial);
    northFogWall.position.set(0, wallHeight/2, -this.ROOM_LENGTH/2 + 1);
    northFogWall.rotation.y = Math.PI;
    this.scene.add(northFogWall);
    this.roomObjects.push(northFogWall);
    
    // South Fog Wall (near end)
    const southFogGeometry = new THREE.PlaneGeometry(this.ROOM_WIDTH + 10, wallHeight);
    const southFogWall = new THREE.Mesh(southFogGeometry, fogMaterial);
    southFogWall.position.set(0, wallHeight/2, this.ROOM_LENGTH/2 - 1);
    this.scene.add(southFogWall);
    this.roomObjects.push(southFogWall);
    
    // East Fog Wall (right)
    const eastFogGeometry = new THREE.PlaneGeometry(this.ROOM_LENGTH + 10, wallHeight);
    const eastFogWall = new THREE.Mesh(eastFogGeometry, fogMaterial);
    eastFogWall.position.set(this.ROOM_WIDTH/2 - 1, wallHeight/2, 0);
    eastFogWall.rotation.y = -Math.PI/2;
    this.scene.add(eastFogWall);
    this.roomObjects.push(eastFogWall);
    
    // West Fog Wall (left)
    const westFogGeometry = new THREE.PlaneGeometry(this.ROOM_LENGTH + 10, wallHeight);
    const westFogWall = new THREE.Mesh(westFogGeometry, fogMaterial);
    westFogWall.position.set(-this.ROOM_WIDTH/2 + 1, wallHeight/2, 0);
    westFogWall.rotation.y = Math.PI/2;
    this.scene.add(westFogWall);
    this.roomObjects.push(westFogWall);
    
    // Add additional fog particles for atmospheric effect
    this.createFogParticles();
    
    console.log('Fog walls created.');
}




/**
 * Create a sky dome with clouds
 */
createSkyWithClouds() {
    console.log('Creating sky with clouds...');
    
    // Remove any existing sky
    if (this.skyDome) {
        this.scene.remove(this.skyDome);
        if (this.skyDome.geometry) this.skyDome.geometry.dispose();
        if (this.skyDome.material) this.skyDome.material.dispose();
    }
    
    // Create a large dome for the sky
    const skyRadius = Math.max(this.ROOM_WIDTH, this.ROOM_LENGTH) * 1.2;
    const skyGeometry = new THREE.SphereGeometry(skyRadius, 32, 32, 0, Math.PI * 2, 0, Math.PI / 2);
    
    // Create canvas for sky with gradient and clouds
    const skyTexture = this.createSkyTexture();
    
    // Create sky material with the texture
    const skyMaterial = new THREE.MeshBasicMaterial({
        map: skyTexture,
        side: THREE.BackSide, // Show on the inside of the dome
        fog: false // Sky shouldn't be affected by fog
    });
    
    // Create the sky dome and position it
    this.skyDome = new THREE.Mesh(skyGeometry, skyMaterial);
    this.skyDome.position.y = 0;
    this.skyDome.rotation.y = Math.PI / 2; // Rotate so the clouds align with the level
    this.scene.add(this.skyDome);
    
    // Add 3D cloud objects for additional depth
    this.createCloudObjects();
    
    console.log('Sky with clouds created');
}

/**
 * Create a sky texture with gradient and clouds
 */
createSkyTexture() {
    // Create a canvas for the sky texture
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d');
    
    // Create a gradient for the sky background
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#1E90FF'); // Deep sky blue at the top
    gradient.addColorStop(0.5, '#87CEEB'); // Sky blue in the middle
    gradient.addColorStop(1, '#E0F7FF'); // Light cyan at the horizon
    
    // Fill the background with the gradient
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw some clouds
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    
    // Function to draw a fluffy cloud
    const drawCloud = (x, y, size) => {
        const numCircles = 5 + Math.floor(Math.random() * 3);
        const baseRadius = size * (0.2 + Math.random() * 0.1);
        
        // Draw the main part of the cloud
        for (let i = 0; i < numCircles; i++) {
            const offsetX = (Math.random() - 0.5) * size;
            const offsetY = (Math.random() - 0.5) * size * 0.5;
            const radius = baseRadius * (0.7 + Math.random() * 0.6);
            
            ctx.beginPath();
            ctx.arc(x + offsetX, y + offsetY, radius, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Draw the bottom of the cloud
        ctx.beginPath();
        ctx.ellipse(x, y + baseRadius * 0.5, size * 0.7, baseRadius * 0.8, 0, 0, Math.PI * 2);
        ctx.fill();
    };
    
    // Draw various clouds of different sizes
    for (let i = 0; i < 15; i++) {
        const x = Math.random() * canvas.width;
        const y = (0.2 + Math.random() * 0.4) * canvas.height; // Keep clouds in the middle to upper part
        const size = 50 + Math.random() * 100;
        
        // Draw with slight transparency for variety
        ctx.globalAlpha = 0.7 + Math.random() * 0.3;
        drawCloud(x, y, size);
    }
    
    // Reset alpha
    ctx.globalAlpha = 1.0;
    
    // Create and return a THREE.js texture from the canvas
    const texture = new THREE.CanvasTexture(canvas);
    return texture;
}

/**
 * Create 3D cloud objects for additional depth
 */
createCloudObjects() {
    // Store cloud objects for animation and cleanup
    this.cloudObjects = [];
    
    // Cloud material
    const cloudMaterial = new THREE.MeshBasicMaterial({
        color: 0xFFFFFF,
        transparent: true,
        opacity: 0.8,
        side: THREE.DoubleSide
    });
    
    // Create several cloud objects
    const numClouds = 10;
    const roomSize = Math.max(this.ROOM_WIDTH, this.ROOM_LENGTH);
    
    for (let i = 0; i < numClouds; i++) {
        // Create a group to hold the cloud parts
        const cloudGroup = new THREE.Group();
        
        // Randomize position above and around the room
        const x = (Math.random() - 0.5) * this.ROOM_WIDTH * 2;
        const y = this.ROOM_HEIGHT + 10 + Math.random() * 20;
        const z = (Math.random() - 0.5) * this.ROOM_LENGTH * 2;
        
        cloudGroup.position.set(x, y, z);
        
        // Randomize cloud scale
        const scale = 5 + Math.random() * 10;
        cloudGroup.scale.set(scale, scale * 0.6, scale);
        
        // Randomize rotation
        cloudGroup.rotation.y = Math.random() * Math.PI * 2;
        
        // Add several sphere geometries to create a fluffy cloud
        const numPuffs = 5 + Math.floor(Math.random() * 5);
        for (let j = 0; j < numPuffs; j++) {
            const puffSize = 1 + Math.random() * 0.5;
            const puffGeometry = new THREE.SphereGeometry(puffSize, 8, 8);
            const puff = new THREE.Mesh(puffGeometry, cloudMaterial);
            
            // Position each puff relative to the cloud group center
            const puffX = (Math.random() - 0.5) * 2;
            const puffY = (Math.random() - 0.5) * 1;
            const puffZ = (Math.random() - 0.5) * 2;
            puff.position.set(puffX, puffY, puffZ);
            
            // Add to cloud group
            cloudGroup.add(puff);
        }
        
        // Add the cloud group to the scene
        this.scene.add(cloudGroup);
        
        // Store reference for animation
        this.cloudObjects.push({
            cloud: cloudGroup,
            speed: 0.005 + Math.random() * 0.01,
            direction: new THREE.Vector3(
                (Math.random() - 0.5) * 0.1,
                0,
                (Math.random() - 0.5) * 0.1
            ).normalize()
        });
    }
}

/**
 * Update cloud positions for gentle movement
 */
updateClouds() {
    if (!this.cloudObjects) return;
    
    const roomSize = Math.max(this.ROOM_WIDTH, this.ROOM_LENGTH) * 1.5;
    
    this.cloudObjects.forEach(cloudObj => {
        const cloud = cloudObj.cloud;
        const speed = cloudObj.speed;
        const direction = cloudObj.direction;
        
        // Move the cloud in its direction
        cloud.position.x += direction.x * speed;
        cloud.position.z += direction.z * speed;
        
        // Rotate slightly for gentle swaying
        cloud.rotation.y += 0.0005;
        
        // Check if cloud is too far from the room
        if (cloud.position.x > roomSize || cloud.position.x < -roomSize ||
            cloud.position.z > roomSize || cloud.position.z < -roomSize) {
            // Reset to opposite side to create infinite clouds
            if (Math.abs(cloud.position.x) > Math.abs(cloud.position.z)) {
                cloud.position.x = -Math.sign(cloud.position.x) * roomSize;
            } else {
                cloud.position.z = -Math.sign(cloud.position.z) * roomSize;
            }
        }
    });
}

/**
 * Create particle system for fog effect
 */
createFogParticles() {
    // Create particulate fog for more atmosphere
    const particleCount = 300;
    const particles = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    
    // Create particle material
    const particleMaterial = new THREE.PointsMaterial({
        color: 0xFFFFFF,
        size: 0.8,
        transparent: true,
        opacity: 0.5,
        map: this.createFogParticleTexture(),
        blending: THREE.AdditiveBlending,
        depthWrite: false
    });
    
    // Position particles around the play area perimeter
    for (let i = 0; i < particleCount; i++) {
        const index = i * 3;
        
        // Determine if this will be a side wall or end wall particle
        const isSideWall = Math.random() > 0.5;
        
        if (isSideWall) {
            // Position along side walls (east or west)
            const side = Math.random() > 0.5 ? 1 : -1;
            positions[index] = side * (this.ROOM_WIDTH/2 - Math.random() * 2); // X (near walls)
            positions[index+1] = Math.random() * this.ROOM_HEIGHT; // Y
            positions[index+2] = (Math.random() * 2 - 1) * this.ROOM_LENGTH/2; // Z
        } else {
            // Position along end walls (north or south)
            const side = Math.random() > 0.5 ? 1 : -1;
            positions[index] = (Math.random() * 2 - 1) * this.ROOM_WIDTH/2; // X
            positions[index+1] = Math.random() * this.ROOM_HEIGHT; // Y
            positions[index+2] = side * (this.ROOM_LENGTH/2 - Math.random() * 2); // Z (near walls)
        }
    }
    
    particles.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    
    // Create particle system and add to scene
    this.fogParticleSystem = new THREE.Points(particles, particleMaterial);
    this.scene.add(this.fogParticleSystem);
    this.roomObjects.push(this.fogParticleSystem);
    
    // Initialize particle velocities for animation
    this.fogParticleVelocities = [];
    for (let i = 0; i < particleCount; i++) {
        this.fogParticleVelocities.push({
            x: (Math.random() - 0.5) * 0.01, 
            y: (Math.random() - 0.5) * 0.005,
            z: (Math.random() - 0.5) * 0.01
        });
    }
}

/**
 * Create a circular gradient texture for fog particles
 */
createFogParticleTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 32;
    canvas.height = 32;
    
    const context = canvas.getContext('2d');
    const gradient = context.createRadialGradient(
        canvas.width / 2, canvas.height / 2, 0,
        canvas.width / 2, canvas.height / 2, canvas.width / 2
    );
    
    gradient.addColorStop(0, 'rgba(255,255,255,1)');
    gradient.addColorStop(0.5, 'rgba(240,240,240,0.5)');
    gradient.addColorStop(1, 'rgba(220,220,220,0)');
    
    context.fillStyle = gradient;
    context.fillRect(0, 0, canvas.width, canvas.height);
    
    const texture = new THREE.CanvasTexture(canvas);
    return texture;
}





/**
 * Create a normal map texture for water
 */
createWaterNormalMap() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    
    const context = canvas.getContext('2d');
    context.fillStyle = '#8888FF';
    context.fillRect(0, 0, canvas.width, canvas.height);
    
    // Create wavy pattern for normal map
    for (let y = 0; y < canvas.height; y++) {
        for (let x = 0; x < canvas.width; x++) {
            const value1 = Math.sin(x * 0.01) * Math.cos(y * 0.01) * 127 + 127;
            const value2 = Math.sin(x * 0.02 + 0.5) * Math.cos(y * 0.02) * 32 + 127;
            const value3 = Math.sin(x * 0.04 + 1.0) * Math.cos(y * 0.04 + 0.5) * 16 + 127;
            
            const value = (value1 + value2 + value3) / 3;
            
            context.fillStyle = `rgb(${value}, ${value}, 255)`;
            context.fillRect(x, y, 1, 1);
        }
    }
    
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(4, 4);
    
    return texture;
}



    /**
     * Create the distinct game zones (start, road, water, goal)
     */
    createZones() {
        console.log('Creating Frogger game zones...');
        
        // Create materials for each zone
        const startZoneMaterial = new THREE.MeshStandardMaterial({
            color: 0x7CFC00, // Lawn green as base color
            roughness: 1,
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
        const startZoneGeometry = new THREE.PlaneGeometry(this.ROOM_WIDTH, this.START_ZONE_DEPTH, 32, 32);
        const startZone = new THREE.Mesh(startZoneGeometry, startZoneMaterial);
        startZone.rotation.x = -Math.PI / 2; // Make it horizontal
        startZone.position.set(0, 0, startZoneZ);
        startZone.userData = { zone: 'start', isSafe: true };
        
        // Add subtle height variations to make the terrain more interesting
        const startPositions = startZone.geometry.attributes.position;
        for (let i = 0; i < startPositions.count; i++) {
            // Skip vertices at the edges to maintain flat boundaries
            const x = startPositions.getX(i);
            const y = startPositions.getY(i);
            
            if (Math.abs(x) < this.ROOM_WIDTH/2 - 1 && Math.abs(y) < this.START_ZONE_DEPTH/2 - 1) {
                // Random height variation
                const noise = Math.sin(x * 0.5) * Math.cos(y * 0.5) * 0.05 + 
                            Math.random() * 0.05;
                startPositions.setZ(i, noise);
            }
        }
        startPositions.needsUpdate = true;
        
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
        
        const yellowMaterial = new THREE.MeshBasicMaterial({ color: 0xFFFF00 });
        
        // Yellow line between lane 1 and lane 2
        const yellowLine1Geometry = new THREE.PlaneGeometry(this.ROOM_WIDTH, 0.15);
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
        
        // Create roadside barriers/curbs
        const curbMaterial = new THREE.MeshStandardMaterial({
            color: 0x999999,
            roughness: 0.8,
            metalness: 0.2
        });
        
        // Top road curb (between road and water)
        const topCurbGeometry = new THREE.BoxGeometry(this.ROOM_WIDTH, 0.3, 0.5);
        const topCurb = new THREE.Mesh(topCurbGeometry, curbMaterial);
        topCurb.position.set(0, 0.15, roadZoneZ - this.ROAD_ZONE_DEPTH/2 - 0.25);
        this.scene.add(topCurb);
        this.zoneObjects.push(topCurb);
        
        // Bottom road curb (between road and start zone)
        const bottomCurbGeometry = new THREE.BoxGeometry(this.ROOM_WIDTH, 0.3, 0.5);
        const bottomCurb = new THREE.Mesh(bottomCurbGeometry, curbMaterial);
        bottomCurb.position.set(0, 0.15, roadZoneZ + this.ROAD_ZONE_DEPTH/2 + 0.25);
        this.scene.add(bottomCurb);
        this.zoneObjects.push(bottomCurb);
        
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
        
        

// 3. Water Zone with enhanced water effect
const waterZoneGeometry = new THREE.PlaneGeometry(this.ROOM_WIDTH, this.WATER_ZONE_DEPTH, 64, 64);
const waterNormalMap = this.createWaterNormalMap();
const waterMaterial = new THREE.MeshPhysicalMaterial({
    color: 0x0066CC,  // Deeper blue
    roughness: 1,   // More reflective
    metalness: 0,   // Less metallic
    transparent: true,
    opacity: 0.85,
    side: THREE.DoubleSide,
    normalMap: waterNormalMap,
    normalScale: new THREE.Vector2(0.8, 0.8),
    envMapIntensity: 0.8,
    clearcoat: 1.0,
    clearcoatRoughness: 0.1,
});

const waterZone = new THREE.Mesh(waterZoneGeometry, waterMaterial);
waterZone.rotation.x = -Math.PI / 2;
waterZone.position.set(0, 0.1, waterZoneZ); // Slight elevation to avoid z-fighting
waterZone.userData = { zone: 'water', isSafe: false };

// Enhanced water animation properties
const waterPositions = waterZone.geometry.attributes.position;
this.waterWaveTime = 0;
this.waterVertices = [];
this.waterFrequencies = [];
this.waterPhases = [];

for (let i = 0; i < waterPositions.count; i++) {
    const x = waterPositions.getX(i);
    const y = waterPositions.getY(i);
    const z = waterPositions.getZ(i);
    
    // Randomize wave frequencies and phases for more natural look
    this.waterVertices.push({ x, y, z, originalZ: z });
    this.waterFrequencies.push(0.05 + Math.random() * 0.04);
    this.waterPhases.push(Math.random() * Math.PI * 2);
}

// Surface water reflections
const waterSurface = new THREE.Mesh(
    new THREE.PlaneGeometry(this.ROOM_WIDTH * 0.98, this.WATER_ZONE_DEPTH * 0.98),
    new THREE.MeshBasicMaterial({
        color: 0x77BBFF,
        transparent: true,
        opacity: 0.3,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide
    })
);
waterSurface.rotation.x = -Math.PI / 2;
waterSurface.position.set(0, 0.15, waterZoneZ); // Slightly above water
this.scene.add(waterSurface);
this.zoneObjects.push(waterSurface);

this.scene.add(waterZone);
this.zoneObjects.push(waterZone);
this.waterZone = waterZone;


        
        // Create riverbank edges (for a more natural transition)
        const riverBankMaterial = new THREE.MeshStandardMaterial({
            color: 0x8B4513, // Brown
            roughness: 1.0,
            metalness: 0.0
        });
        
        // Top riverbank
        const topBankGeometry = new THREE.BoxGeometry(this.ROOM_WIDTH, 0.2, 0.8);
        const topBank = new THREE.Mesh(topBankGeometry, riverBankMaterial);
        topBank.position.set(0, 0.1, waterZoneZ - this.WATER_ZONE_DEPTH/2 - 0.4);
        this.scene.add(topBank);
        this.zoneObjects.push(topBank);
        
        // Bottom riverbank
        const bottomBankGeometry = new THREE.BoxGeometry(this.ROOM_WIDTH, 0.2, 0.8);
        const bottomBank = new THREE.Mesh(bottomBankGeometry, riverBankMaterial);
        bottomBank.position.set(0, 0.1, waterZoneZ + this.WATER_ZONE_DEPTH/2 + 0.4);
        this.scene.add(bottomBank);
        this.zoneObjects.push(bottomBank);
        
        // 4. Goal Zone (safe ending area) with enhanced terrain
        const goalZoneGeometry = new THREE.PlaneGeometry(this.ROOM_WIDTH, this.GOAL_ZONE_DEPTH, 32, 32);
        const goalZone = new THREE.Mesh(goalZoneGeometry, goalZoneMaterial);
        goalZone.rotation.x = -Math.PI / 2;
        goalZone.position.set(0, 0, goalZoneZ);
        goalZone.userData = { zone: 'goal', isSafe: true };
        
        // Add subtle height variations to make the terrain more interesting
        const goalPositions = goalZone.geometry.attributes.position;
        for (let i = 0; i < goalPositions.count; i++) {
            // Skip vertices at the edges to maintain flat boundaries
            const x = goalPositions.getX(i);
            const y = goalPositions.getY(i);
            
            if (Math.abs(x) < this.ROOM_WIDTH/2 - 1 && Math.abs(y) < this.GOAL_ZONE_DEPTH/2 - 1) {
                // Random height variation
                const noise = Math.sin(x * 0.3) * Math.cos(y * 0.3) * 0.08 + 
                             Math.random() * 0.04;
                goalPositions.setZ(i, noise);
            }
        }
        goalPositions.needsUpdate = true;
        
        this.scene.add(goalZone);
        this.zoneObjects.push(goalZone);
        
        // Initialize vehicles after all zones are created
        this.createVehicles();
        
        console.log('Frogger game zones created with enhanced visuals.');
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
        this.spawnTimers.lane1 = Math.random() * 100; // Random initial delay
        this.spawnTimers.lane2 = Math.random() * 200;
        this.spawnTimers.lane3 = Math.random() * 150;
        
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
        let modelType;
        
        if (lane === 'lane1') {
            // Lane 1: Top lane - Cars going left to right
            zPos = roadZoneZ - laneWidth; // First lane from the top
            direction = 1; // Moving right (positive X)
            material = this.carMaterial;
            size = { length: 2, width: 1, height: 0.8 }; // Car size
            modelType = 'car';
        } 
        else if (lane === 'lane2') {
            // Lane 2: Middle lane - Buses going right to left
            zPos = roadZoneZ; // Middle lane
            direction = -1; // Moving left (negative X)
            material = this.busMaterial;
            size = { length: 4, width: 1.2, height: 1.2 }; // Bus size (longer)
            modelType = 'bus';
        }
        else if (lane === 'lane3') {
            // Lane 3: Bottom lane - Fast cars going left to right
            zPos = roadZoneZ + laneWidth; // Third lane from the top
            direction = 1; // Moving right (positive X)
            material = this.fastCarMaterial;
            size = { length: 2, width: 1, height: 0.8 }; // Same car size
            modelType = 'car';
        }
        
        let vehicle;
        
        // Try to use loaded models if available
        if (this.models[modelType] && this.models[modelType].scene) {
            // Clone the model to create a new instance
            vehicle = this.models[modelType].scene.clone();
            
            // Apply appropriate scale based on model type
            // Change just the bus scale (second value) to make it smaller
            const scale = modelType === 'car' ? 1 : 0.5; // Make bus smaller (was 1.0)
            vehicle.scale.set(scale, scale, scale);
            
            // We no longer need to apply color to the model - using original textures
            
            // Store collision size for detection (use original size for collision)
            vehicle.userData = {
                collisionSize: size
            };
        } else {
            // Fallback to box geometry if model not available
            console.log(`Using fallback geometry for ${modelType} in ${lane}`);
            const vehicleGeometry = new THREE.BoxGeometry(
                size.length,
                size.height,
                size.width
            );
            
            vehicle = new THREE.Mesh(vehicleGeometry, material);
            
            // For box geometry, collision size is the geometry size
            vehicle.userData = {
                collisionSize: size
            };
        }
        
        // Position the vehicle outside the room on the appropriate side
        const xStart = direction > 0 ? -this.ROOM_WIDTH/2 - size.length/2 : this.ROOM_WIDTH/2 + size.length/2;
        
        // Set different height adjustments for cars and buses
        const heightAdjustment = modelType === 'car' ? -0.35 : -0.63; // Cars higher (-0.3), buses lower (-0.7)
        vehicle.position.set(xStart, size.height/2 + heightAdjustment, zPos);

        // Correct the rotation to make models face along the X-axis instead of Z-axis
        // First rotate 90 degrees to align with X-axis, then add 180 degrees if moving left
        if (direction > 0) {
            // Rotate 90° to face right (positive X)
            vehicle.rotation.y = -Math.PI / 2 + Math.PI; // or simply Math.PI/2
        } else {
            // Rotate 270° to face left (negative X)
            vehicle.rotation.y = Math.PI / 2 + Math.PI; // or simply 3*Math.PI/2
        }
        
        // Store direction, lane info, and speed in userData
        vehicle.userData.direction = direction;
        vehicle.userData.lane = lane;
        vehicle.userData.speed = this.vehicleSpeeds[lane];
        
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
                // For models, use the collision size from userData
                const size = vehicle.userData.collisionSize;
                if ((vehicle.userData.direction > 0 && vehicle.position.x > this.ROOM_WIDTH/2 + size.length/2) ||
                    (vehicle.userData.direction < 0 && vehicle.position.x < -this.ROOM_WIDTH/2 - size.length/2)) {
                    vehiclesToRemove.push(index);
                    this.scene.remove(vehicle);
                    // Clean up resources
                    if (vehicle.geometry) vehicle.geometry.dispose();
                    if (vehicle.material) {
                        if (Array.isArray(vehicle.material)) {
                            vehicle.material.forEach(m => m.dispose());
                        } else {
                            vehicle.material.dispose();
                        }
                    }
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
        
// Create materials for the logs with wood textures
this.logMaterials = {
    lane1: this.createWoodMaterial(0x8B4513, 0.7), // Brown
    lane2: this.createWoodMaterial(0x966F33, 0.8), // Lighter brown
    lane3: this.createWoodMaterial(0x7F5217, 0.6), // Darker brown
    lane4: this.createWoodMaterial(0xA0522D, 0.7)  // Sienna
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

        // Main ambient light - brighten for better visibility
        const ambientLight = new THREE.AmbientLight(0xCCCCCC, 0.8);
        this.scene.add(ambientLight);
        this.roomLights.push(ambientLight);

        // Directional light (sunlight) - more natural positioning
        const sunLight = new THREE.DirectionalLight(0xFFEECC, 1.0); // Warmer color
        sunLight.position.set(-30, 100, 20);
        sunLight.castShadow = true;
        
        // Improve shadow quality if supported
        if (sunLight.shadow) {
            sunLight.shadow.mapSize.width = 2048;
            sunLight.shadow.mapSize.height = 2048;
            sunLight.shadow.camera.near = 0.5;
            sunLight.shadow.camera.far = 500;
            sunLight.shadow.bias = -0.0001;
        }
        
        this.scene.add(sunLight);
        this.roomLights.push(sunLight);

        // Add a spotlight over the goal zone for emphasis
        const spotLight = new THREE.SpotLight(0xFFFFFF, 1.5); // Increased intensity
        spotLight.position.set(0, this.ROOM_HEIGHT-1, -this.ROOM_LENGTH/2 + this.GOAL_ZONE_DEPTH/2);
        spotLight.angle = Math.PI / 6;
        spotLight.penumbra = 0.3;
        spotLight.decay = 1;
        spotLight.distance = this.GOAL_ZONE_DEPTH * 2;
        
        // Add slight golden color for goal emphasis
        spotLight.color.setHSL(0.1, 0.5, 0.9);
        
        this.scene.add(spotLight);
        this.roomLights.push(spotLight);
        
        // Add point lights along the water for reflections
        const waterCenterZ = this.ROOM_LENGTH/2 - this.START_ZONE_DEPTH - this.ROAD_ZONE_DEPTH - this.WATER_ZONE_DEPTH/2;
        
        // Left water light
        const waterLight1 = new THREE.PointLight(0x6688FF, 0.5, 15);
        waterLight1.position.set(-this.ROOM_WIDTH/4, 2, waterCenterZ);
        this.scene.add(waterLight1);
        this.roomLights.push(waterLight1);
        
        // Right water light
        const waterLight2 = new THREE.PointLight(0x6688FF, 0.5, 15);
        waterLight2.position.set(this.ROOM_WIDTH/4, 2, waterCenterZ);
        this.scene.add(waterLight2);
        this.roomLights.push(waterLight2);

        console.log('Frogger room lighting set up with enhanced effects.');
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
                this.handleGameOver("SLEEP WITH THE FISHES!");
            }
        } else {
            // Player is out of the water zone
            this.timeInWater = 0;
        }
        
// Enhance water animation
if (this.waterZone && this.waterVertices) {
    this.waterWaveTime += 0.03;
    const waterPositions = this.waterZone.geometry.attributes.position;
    
    for (let i = 0; i < this.waterVertices.length; i++) {
        const vertex = this.waterVertices[i];
        // Create a more complex wave effect using multiple sine waves
        const wave1 = Math.sin(vertex.x * 0.3 + this.waterWaveTime) * 0.08;
        const wave2 = Math.cos(vertex.y * 0.2 + this.waterWaveTime * 0.8) * 0.06;
        const wave3 = Math.sin((vertex.x + vertex.y) * 0.1 + this.waterWaveTime * 1.2) * 0.04;
        
        waterPositions.setZ(i, vertex.originalZ + wave1 + wave2 + wave3);
    }
    
    waterPositions.needsUpdate = true;
    
    // Animate normal map by shifting it
    if (this.waterZone.material.normalMap) {
        this.waterZone.material.normalMap.offset.x = Math.sin(this.waterWaveTime * 0.05) * 0.1;
        this.waterZone.material.normalMap.offset.y = Math.cos(this.waterWaveTime * 0.05) * 0.1;
    }
    
    // Move fog particles for atmospheric effect
    if (this.fogParticleSystem) {
        const positions = this.fogParticleSystem.geometry.attributes.position;
        
        for (let i = 0; i < this.fogParticleVelocities.length; i++) {
            const index = i * 3;
            const velocity = this.fogParticleVelocities[i];
            
            // Update position based on velocity
            positions.array[index] += velocity.x;
            positions.array[index+1] += velocity.y;
            positions.array[index+2] += velocity.z;
            
            // Check boundaries and bounce or wrap particles
            if (Math.abs(positions.array[index]) > this.ROOM_WIDTH/2 + 3) {
                velocity.x *= -1;
            }
            if (positions.array[index+1] < 0 || positions.array[index+1] > this.ROOM_HEIGHT) {
                velocity.y *= -1;
            }
            if (Math.abs(positions.array[index+2]) > this.ROOM_LENGTH/2 + 3) {
                velocity.z *= -1;
            }
        }
        
        positions.needsUpdate = true;
    }
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
    // Update cloud positions
this.updateClouds();

    
    
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
                // Get vehicle dimensions from userData (works with models and fallback geometry)
                const collisionSize = vehicle.userData.collisionSize;
                
                // Calculate distance between player and vehicle
                const dx = Math.abs(playerPosition.x - vehicle.position.x);
                const dz = Math.abs(playerPosition.z - vehicle.position.z);
                
                // Allow a small buffer inside the vehicle bounds (0.9 factor)
                const halfLength = (collisionSize.length * 0.9) / 2;
                const halfWidth = (collisionSize.width * 0.9) / 2;
                
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
 * Create a wood material with grain texture
 * @param {number} baseColor - The base color for the wood
 * @param {number} roughnessFactor - How rough the wood appears (0-1)
 * @returns {THREE.MeshStandardMaterial} Material with wood grain appearance
 */
createWoodMaterial(baseColor, roughnessFactor) {
    // Create wood grain texture
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    
    // Extract RGB components from the color
    const r = (baseColor >> 16) & 255;
    const g = (baseColor >> 8) & 255;
    const b = baseColor & 255;
    
    // Create base color
    ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Create wood grain pattern
    for (let y = 0; y < canvas.height; y++) {
        // Create wavy grain patterns
        const grainWidth = 1 + Math.random() * 2;
        
        for (let x = 0; x < canvas.width; x += grainWidth) {
            // Vary darkness of grain based on noise
            const noise = Math.sin(y * 0.1) * 10 + Math.sin(y * 0.05) * 20;
            const lineX = x + noise;
            
            // Occasional darker grain lines
            if (Math.random() > 0.97) {
                const darkenFactor = 0.7 + Math.random() * 0.2;
                const grainColor = `rgba(${r*darkenFactor}, ${g*darkenFactor}, ${b*darkenFactor}, 0.8)`;
                ctx.fillStyle = grainColor;
                ctx.fillRect(lineX, 0, grainWidth * (0.5 + Math.random()), canvas.height);
            }
            
            // Add some knots/whorls occasionally
            if (Math.random() > 0.995) {
                const knotX = lineX + Math.random() * 20;
                const knotY = Math.random() * canvas.height;
                const knotRadius = 5 + Math.random() * 15;
                
                const knotGradient = ctx.createRadialGradient(
                    knotX, knotY, 0,
                    knotX, knotY, knotRadius
                );
                
                knotGradient.addColorStop(0, `rgba(${r*0.5}, ${g*0.5}, ${b*0.5}, 0.9)`);
                knotGradient.addColorStop(0.7, `rgba(${r*0.7}, ${g*0.7}, ${b*0.7}, 0.7)`);
                knotGradient.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);
                
                ctx.fillStyle = knotGradient;
                ctx.beginPath();
                ctx.arc(knotX, knotY, knotRadius, 0, Math.PI * 2);
                ctx.fill();
            }
        }
    }
    
    // Create wood texture and bump map from the canvas
    const woodTexture = new THREE.CanvasTexture(canvas);
    woodTexture.wrapS = THREE.RepeatWrapping;
    woodTexture.wrapT = THREE.RepeatWrapping;
    
    // Create material with the wood texture
    const material = new THREE.MeshStandardMaterial({
        map: woodTexture,
        roughness: roughnessFactor,
        metalness: 0.1,
        bumpMap: woodTexture,
        bumpScale: 0.05,
    });
    
    return material;
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
     * Create decorative elements for the environment
     */
    createDecorations() {
        console.log('Adding decorative elements to the scene...');
        
        // Calculate zone positions for placing decorations
        const halfLength = this.ROOM_LENGTH / 2;
        const startZoneZ = halfLength - this.START_ZONE_DEPTH/2;
        const goalZoneZ = -halfLength + this.GOAL_ZONE_DEPTH/2;
        
        // Create trees around the start zone
        this.createTrees(startZoneZ, 5);
        
        // Create trees around the goal zone
        this.createTrees(goalZoneZ, 7);
        
        // Create grass tufts on start and goal zones
        this.createGrassTufts(startZoneZ);
        this.createGrassTufts(goalZoneZ);
        
        console.log('Decorative elements added successfully');
    }
    
    /**
     * Create tree objects around a specific zone
     * @param {number} zCenter - The z-coordinate center of the zone
     * @param {number} count - Number of trees to create
     */
    createTrees(zCenter, count) {
        // Materials for trees
        const trunkMaterial = new THREE.MeshStandardMaterial({
            color: 0x8B4513, // Brown
            roughness: 0.9,
            metalness: 0.1
        });
        
        const foliageMaterial = new THREE.MeshStandardMaterial({
            color: 0x228B22, // Forest green
            roughness: 0.8,
            metalness: 0.0
        });
        
        // Create the specified number of trees
        for (let i = 0; i < count; i++) {
            // Randomize position along x-axis, staying within room bounds
            const xPos = (Math.random() - 0.5) * (this.ROOM_WIDTH - 4);
            
            // Randomize position along z-axis around the center, but not on the path
            const zOffset = (Math.random() - 0.5) * 6;
            const zPos = zCenter + zOffset;
            
            // Randomize tree size
            const trunkHeight = 2 + Math.random() * 1.5;
            const trunkRadius = 0.2 + Math.random() * 0.1;
            const foliageRadius = 1 + Math.random() * 0.5;
            
            // Create trunk
            const trunkGeometry = new THREE.CylinderGeometry(trunkRadius, trunkRadius * 1.2, trunkHeight, 8);
            const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
            trunk.position.set(xPos, trunkHeight/2, zPos);
            this.scene.add(trunk);
            this.decorations.push(trunk);
            
            // Create foliage (cone for pine trees, sphere for deciduous)
            let foliageGeometry;
            if (Math.random() > 0.5) {
                // Pine tree
                foliageGeometry = new THREE.ConeGeometry(foliageRadius, foliageRadius * 2, 8);
                const foliage = new THREE.Mesh(foliageGeometry, foliageMaterial);
                foliage.position.set(xPos, trunkHeight + foliageRadius, zPos);
                this.scene.add(foliage);
                this.decorations.push(foliage);
            } else {
                // Deciduous tree (spheres stacked on trunk)
                const foliageLayers = 2 + Math.floor(Math.random() * 2);
                for (let j = 0; j < foliageLayers; j++) {
                    const layerRadius = foliageRadius * (1 - j * 0.15);
                    foliageGeometry = new THREE.SphereGeometry(layerRadius, 8, 8);
                    const foliageLayer = new THREE.Mesh(foliageGeometry, foliageMaterial);
                    foliageLayer.position.set(
                        xPos + (Math.random() - 0.5) * 0.2, 
                        trunkHeight + layerRadius * 0.8 + j * layerRadius * 0.5, 
                        zPos + (Math.random() - 0.5) * 0.2
                    );
                    this.scene.add(foliageLayer);
                    this.decorations.push(foliageLayer);
                }
            }
        }
    }
    
    /**
     * Create grass tufts in a specified zone
     * @param {number} zCenter - The z-coordinate center of the zone
     */
    createGrassTufts(zCenter) {
        const grassMaterial = new THREE.MeshStandardMaterial({
            color: 0x7CFC00, // Lawn green
            roughness: 1.0,
            metalness: 0.0,
            side: THREE.DoubleSide
        });
        
        const tuftCount = 40;
        const zoneWidth = 10; // Approximate zone width to place grass in
        
        for (let i = 0; i < tuftCount; i++) {
            // Randomize position
            const xPos = (Math.random() - 0.5) * this.ROOM_WIDTH * 0.9;
            const zPos = zCenter + (Math.random() - 0.5) * zoneWidth;
            
            // Create grass tuft as crossed planes
            const tuftHeight = 0.3 + Math.random() * 0.3;
            const tuftWidth = 0.1 + Math.random() * 0.1;
            
            const tuftGeometry = new THREE.PlaneGeometry(tuftWidth, tuftHeight);
            
            // Create crossed planes for grass tuft
            const tuft1 = new THREE.Mesh(tuftGeometry, grassMaterial);
            tuft1.position.set(xPos, tuftHeight/2, zPos);
            this.scene.add(tuft1);
            this.decorations.push(tuft1);
            
            const tuft2 = new THREE.Mesh(tuftGeometry, grassMaterial);
            tuft2.position.set(xPos, tuftHeight/2, zPos);
            tuft2.rotation.y = Math.PI/2; // Rotate 90 degrees to cross with first plane
            this.scene.add(tuft2);
            this.decorations.push(tuft2);
        }
    }

    /**
     * Clean up resources when unloading the level
     */
    unload() {
        console.log('Unloading Real Frogger level...');

        // Remove objects from scene and dispose geometry/material
        [...this.roomObjects, ...this.zoneObjects, ...this.decorations].forEach(object => {
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
        this.decorations = [];

        // Remove vehicles
        for (const lane in this.vehicles) {
            this.vehicles[lane].forEach(vehicle => {
                this.scene.remove(vehicle);
            });
            this.vehicles[lane] = [];
        }
        
        // Remove logs
        for (const lane in this.logs) {
            this.logs[lane].forEach(log => {
                this.scene.remove(log);
            });
            this.logs[lane] = [];
        }

        // Clean up models
        this.models = {};

        // Dispose textures
        for (const key in this.textures) {
            if (this.textures[key]) {
                this.textures[key].dispose();
            }
        }
        this.textures = {};

        // Remove lights
        this.roomLights.forEach(light => {
            if (light.parent) {
                light.parent.remove(light);
            }
        });
        this.roomLights = [];


        // Clean up sky dome
if (this.skyDome) {
    this.scene.remove(this.skyDome);
    if (this.skyDome.geometry) this.skyDome.geometry.dispose();
    if (this.skyDome.material && this.skyDome.material.map) this.skyDome.material.map.dispose();
    if (this.skyDome.material) this.skyDome.material.dispose();
}

// Clean up cloud objects
if (this.cloudObjects) {
    this.cloudObjects.forEach(cloudObj => {
        const cloud = cloudObj.cloud;
        this.scene.remove(cloud);
        
        // Dispose of all child geometries and materials
        cloud.traverse(child => {
            if (child.geometry) child.geometry.dispose();
            if (child.material) {
                if (Array.isArray(child.material)) {
                    child.material.forEach(material => material.dispose());
                } else {
                    child.material.dispose();
                }
            }
        });
    });
    this.cloudObjects = [];
}


        console.log('Real Frogger level unloaded.');
    
    
    
    
    }
}

// Make the class available globally to fix the "RealFroggerLevel is not defined" error
window.RealFroggerLevel = RealFroggerLevel;