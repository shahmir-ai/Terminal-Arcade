/**
 * Real Space Invaders Level - Enhanced Visual Effects
 * A 3D first-person Space Invaders experience with improved aesthetics
 * Dynamically loaded when the player enters through Corridor Door 7.
 */

// Define constants for the room dimensions (can be adjusted)
const ROOM_WIDTH = 20;   // Keep original width
const ROOM_DEPTH = 30;   // Make room 1.5x deeper
// Removed global WALL_HEIGHT declaration to avoid conflict. Using literal '8' below.

class RealSpaceInvadersLevel {
    /**
     * Constructor for the Space Invaders level
     * @param {ArcadeApp} app - Reference to the main app for shared resources
     */
    constructor(app) {
        console.log("Constructing RealSpaceInvadersLevel...");
        // Store references to the main app and its components
        this.app = app;
        this.scene = app.scene;
        this.camera = app.camera;
        this.renderer = app.renderer;
        this.listener = app.listener;
        this.sounds = app.sounds;

        // Level-specific properties
        this.roomObjects = []; // For walls, floor, ceiling
        this.roomLights = [];  // For lights
        this.starfield = null; // For starfield particles
        this.nebulae = [];     // For background nebulae

        // Player properties (copied, adjust groundLevel)
        this.moveSpeed = app.moveSpeed; // Use standard speed for now
        this.jumpHeight = app.jumpHeight;
        this.jumpVelocity = 0;
        this.gravity = app.gravity;
        this.isJumping = false;
        this.groundLevel = 1.5; // Player height in this room
        this.keyStates = app.keyStates; // Share keyStates with app

        // Camera rotation properties (copied)
        this.verticalRotation = 0;
        this.maxVerticalRotation = Math.PI / 9;
        this.minVerticalRotation = -Math.PI / 9;

        // Footstep sound properties (copied)
        this.lastFootstepTime = 0;
        this.footstepInterval = 450;

        // Enemy grid properties
        this.enemies = [];
        this.enemySpeed = 0.3;            // Speed of enemy movement
        this.enemyDirection = 1;           // 1 = right, -1 = left
        this.lastEnemyUpdate = 0;          // Track time for movement updates
        this.enemyUpdateInterval = 1000;    // Update enemy movement every 1000ms
        this.forwardStep = 0.5;            // Distance enemies move forward when reaching edge
        this.enemyRows = 5;                // Number of rows in enemy grid
        this.enemyCols = 11;               // Number of columns in enemy grid
        this.enemySpacing = 1.5;           // Spacing between enemies
        this.enemyColors = [
            0x00FF88,                     // Teal-Green for first 3 rows
            0xFF5500                      // Orange-Red for last 2 rows
        ];
        
        // Bullet properties
        this.playerBullets = [];           // Array to store player bullets
        this.enemyBullets = [];            // Array to store enemy bullets
        this.playerBulletSpeed = 0.5;      // Speed of player bullets
        this.enemyBulletSpeed = 0.3;       // Initial speed of enemy bullets
        this.playerShootCooldown = 500;    // Cooldown between player shots (ms)
        this.lastPlayerShot = 0;           // Timestamp of last player shot
        this.enemyShootInterval = 2000;    // Initial interval between enemy shots (ms)
        this.lastEnemyShot = 0;            // Timestamp of last enemy shot
        this.initialEnemyCount = 0;        // Will store initial enemy count for difficulty scaling
        this.minEnemyShootInterval = 500;  // Minimum interval between enemy shots (fastest)
        
        // Player weapon properties
        this.playerLaserColor = 0x00FFFF;  // Bright cyan for player lasers
        this.enemyLaserColor = 0xFF3300;   // Orange-red for enemy lasers
        this.laserWidth = 0.04;           // Width of laser beams
        this.laserGlowIntensity = 0.8;    // Intensity of laser glow

        // Bunker properties
        this.bunkers = [];               // Array to store bunker segments
        this.bunkerCount = 3;            // Number of bunkers to create
        this.bunkerWidth = 2.5;          // Width of each bunker
        this.bunkerHeight = 1.2;         // Height of each bunker 
        this.bunkerDepth = 0.5;          // Depth of each bunker
        this.bunkerSpacing = 5;          // Space between bunkers
        this.bunkerZ = 5;                // Distance from player (Z position)
        this.bunkerY = 1.2;              // Height position (raised to be hit by bullets)

        // Visual effect properties
        this.glow = null;                 // Bloom effect for lasers and enemies
        this.lastLightFlicker = 0;        // For light flickering effect
        this.lightFlickerInterval = 100;  // Milliseconds between light flickers

        // Game state flags
        this.isGameOver = false; // Added flag
        this.levelComplete = false; // Added flag

        // Bind methods
        this.init = this.init.bind(this);
        this.update = this.update.bind(this);
        this.handleMovement = this.handleMovement.bind(this);
        this.checkCollision = this.checkCollision.bind(this);
        this.createSpaceEnvironment = this.createSpaceEnvironment.bind(this);
        this.setupEnhancedLighting = this.setupEnhancedLighting.bind(this);
        this.unload = this.unload.bind(this);
        this.spawnEnemyGrid = this.spawnEnemyGrid.bind(this);
        this.updateEnemyMovement = this.updateEnemyMovement.bind(this);
        this.playerShoot = this.playerShoot.bind(this);
        this.enemyShoot = this.enemyShoot.bind(this);
        this.updateBullets = this.updateBullets.bind(this);
        this.getFrontmostEnemies = this.getFrontmostEnemies.bind(this);
        this.createBunkers = this.createBunkers.bind(this);
        this.createStarfield = this.createStarfield.bind(this);
        this.createSpaceNebulae = this.createSpaceNebulae.bind(this);
        this.updateLightFlicker = this.updateLightFlicker.bind(this);
    }

    /**
     * Initialize the Space Invaders level
     */
    init() {
        console.log('Initializing Real Space Invaders level...');

        // Set up the scene appearance
        this.scene.background = new THREE.Color(0x000011); // Very dark blue background
        this.scene.fog = new THREE.FogExp2(0x000011, 0.015); // Exponential fog for depth

        // Reset camera position and rotation for room start
        this.camera.position.set(0, this.groundLevel, 14); // Start in center
        this.camera.rotation.set(0, 0, 0); // Reset rotation
        this.verticalRotation = 0; // Reset vertical look angle
        this.camera.lookAt(0, this.groundLevel, -1); // Look towards negative Z

        // Create the space environment
        this.createSpaceEnvironment();
        this.setupEnhancedLighting();
        
        // Create starfield and nebulae
        this.createStarfield();
        this.createSpaceNebulae();

        // Create enemy grid
        this.spawnEnemyGrid();
        
        // Store initial enemy count for difficulty scaling
        this.initialEnemyCount = this.enemies.length;

        // Create bunkers for player protection
        this.createBunkers();
        
        // Ensure controls are enabled
        if (this.app) {
            this.app.enableControls();
        }
    // Display instructions after a short delay
    setTimeout(() => this.displayInstructions(), 1000);

        console.log('Real Space Invaders level initialized');
        return this;
    }

    /**
     * Create a starfield of particles for deep space effect
     */
    createStarfield() {
        console.log('Creating starfield...');
        
        // Create geometry for starfield
        const starCount = 2000;
        const starGeometry = new THREE.BufferGeometry();
        const starPositions = new Float32Array(starCount * 3);
        const starSizes = new Float32Array(starCount);
        
        // Generate random positions for stars, keeping them outside the playable area
        for (let i = 0; i < starCount; i++) {
            // Calculate positions in a sphere around the room
            const theta = Math.random() * Math.PI * 2; // Horizontal angle
            const phi = Math.acos(Math.random() * 2 - 1); // Vertical angle
            const radius = 40 + Math.random() * 60; // Distance from center
            
            starPositions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
            starPositions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
            starPositions[i * 3 + 2] = radius * Math.cos(phi);
            
            // Random star sizes
            starSizes[i] = Math.random() * 2 + 0.5;
        }
        
        // Add attributes to geometry
        starGeometry.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
        starGeometry.setAttribute('size', new THREE.BufferAttribute(starSizes, 1));
        
        // Create star material with vertex shader to control star appearance
        const starMaterial = new THREE.ShaderMaterial({
            uniforms: {
                pointTexture: { value: new THREE.TextureLoader().load('assets/textures/star.png') }
            },
            vertexShader: `
                attribute float size;
                varying vec3 vColor;
                void main() {
                    vColor = vec3(1.0, 1.0, 1.0); // White stars
                    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
                    gl_PointSize = size * (300.0 / -mvPosition.z);
                    gl_Position = projectionMatrix * mvPosition;
                }
            `,
            fragmentShader: `
                uniform sampler2D pointTexture;
                varying vec3 vColor;
                void main() {
                    gl_FragColor = vec4(vColor, 1.0) * texture2D(pointTexture, gl_PointCoord);
                }
            `,
            blending: THREE.AdditiveBlending,
            depthTest: true,
            transparent: true
        });
        
        // Create the starfield
        this.starfield = new THREE.Points(starGeometry, starMaterial);
        this.scene.add(this.starfield);
        
        console.log('Starfield created');
    }

    /**
     * Create distant nebulae for space atmosphere
     */
    createSpaceNebulae() {
        console.log('Creating space nebulae...');
        
        // Nebula colors
        const nebulaColors = [
            0x3311FF, // Blue
            0xFF1133, // Red
            0x22FF88  // Green
        ];
        
        // Create distant nebula planes
        for (let i = 0; i < 4; i++) {
            // Create a large plane for each nebula
            const size = 80 + Math.random() * 50;
            const nebulaGeometry = new THREE.PlaneGeometry(size, size);
            
            // Use a custom shader material for the nebula glow
            const nebulaMaterial = new THREE.ShaderMaterial({
                uniforms: {
                    color: { value: new THREE.Color(nebulaColors[i % nebulaColors.length]) },
                    time: { value: 0.0 }
                },
                vertexShader: `
                    varying vec2 vUv;
                    void main() {
                        vUv = uv;
                        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                    }
                `,
                fragmentShader: `
                    uniform vec3 color;
                    uniform float time;
                    varying vec2 vUv;
                    
                    float noise(vec2 p) {
                        return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
                    }
                    
                    void main() {
                        // Create a soft, cloudy look
                        vec2 pos = vUv * 2.0 - 1.0;
                        float dist = 1.0 - length(pos);
                        float noise1 = noise(vUv + time * 0.01);
                        float noise2 = noise(vUv * 2.0 - time * 0.02);
                        float alpha = smoothstep(0.0, 0.7, dist) * 0.3 * (noise1 * 0.6 + noise2 * 0.4);
                        gl_FragColor = vec4(color, alpha);
                    }
                `,
                transparent: true,
                blending: THREE.AdditiveBlending,
                side: THREE.DoubleSide,
                depthWrite: false
            });
            
            const nebula = new THREE.Mesh(nebulaGeometry, nebulaMaterial);
            
            // Position nebulae far away in different directions
            const distance = 100;
            const angle = (i / 4) * Math.PI * 2;
            nebula.position.set(
                Math.sin(angle) * distance,
                (Math.random() - 0.5) * 40,
                Math.cos(angle) * distance
            );
            
            // Rotate to face the center
            nebula.lookAt(0, 0, 0);
            
            this.scene.add(nebula);
            this.nebulae.push(nebula);
        }
        
        console.log('Space nebulae created');
    }

  /**
 * Spawns a grid of enemy objects in a Space Invaders formation
 * Properly positioned in horizontal rows approaching the player
 */
  spawnEnemyGrid() {
    console.log('Spawning enemy grid with GLB models...');
    this.enemies = []; // Clear existing enemies
    
    // Load 3D models for enemies
    const loader = new THREE.GLTFLoader();
    const alienModels = [null, null]; // Will store loaded models
    let modelsLoaded = 0;
    
    // Function to create enemy grid once models are loaded
    const createEnemiesWithModels = () => {
        console.log('Both models loaded, creating enemy grid');
        
        // Calculate grid dimensions for centering
        const gridWidth = (this.enemyCols - 1) * this.enemySpacing;
        const gridStartX = -gridWidth / 2;
        
        // Height above ground for all enemies
        const enemyHeight = this.groundLevel + 0; // Floating 0 unit above player eye level
        
        // Starting Z position (furthest from player)
        const gridStartZ = -(ROOM_DEPTH / 2) + 0.5; // Just 0.5 units from back wall
        
        // Spawn enemies row by row (rows are at different Z positions)
        for (let row = 0; row < this.enemyRows; row++) {
            for (let col = 0; col < this.enemyCols; col++) {
                // Determine model index (first 3 rows use first model, last 2 use second)
                const modelIndex = row < 3 ? 0 : 1;
                
                // Calculate score based on row (rows further from player = higher score)
                const scoreValue = (this.enemyRows - row) * 10;
                
                // Calculate position:
                const xPos = gridStartX + (col * this.enemySpacing);
                const yPos = enemyHeight;
                const zPos = gridStartZ + (row * this.enemySpacing); // Each row is closer to player
                
                // Clone the model
                const enemyModel = alienModels[modelIndex].scene.clone();
                
                // Scale the model appropriately (adjust these values as needed)
                enemyModel.scale.set(0.2, 0.2, 0.2);
                
                // Position the model
                enemyModel.position.set(xPos, yPos, zPos);
                
                // Add subtle animation variation to enemy rotation
                enemyModel.userData = {
                    rotationSpeed: 0.01 + Math.random() * 0.01,
                    rotationAxis: new THREE.Vector3(
                        Math.random() - 0.5,
                        Math.random() - 0.5,
                        Math.random() - 0.5
                    ).normalize()
                };
                
                this.scene.add(enemyModel);
                
                // Store enemy data
                this.enemies.push({
                    mesh: enemyModel,
                    alive: true,
                    scoreValue: scoreValue,
                    originalColor: this.enemyColors[modelIndex],
                    row: row,
                    col: col
                });
                
                console.log(`Created enemy at row ${row}, column ${col}, position: x=${xPos}, y=${yPos}, z=${zPos}`);
            }
        }
        
        console.log(`Spawned ${this.enemies.length} enemies in ${this.enemyRows}×${this.enemyCols} grid`);
        
        // Store initial enemy count for difficulty scaling
        this.initialEnemyCount = this.enemies.length;
    };
    
    // Load the first alien model
    loader.load('assets/models/alien1.glb', (gltf) => {
        console.log('Loaded alien1.glb model');
        alienModels[0] = gltf;
        
    // Subtle glow while preserving original colors

    gltf.scene.traverse((child) => {

        if (child.isMesh && child.material) {

            // Use the model's own color for emission

            child.material.emissive = child.material.color.clone().multiplyScalar(0.3);

            child.material.emissiveIntensity = 0.4;

        }

    });



        modelsLoaded++;
        if (modelsLoaded === 2) createEnemiesWithModels();
    }, 
    // onProgress callback
    (xhr) => {
        console.log(`Loading alien1.glb: ${(xhr.loaded / xhr.total * 100).toFixed(0)}%`);
    },
    // onError callback
    (error) => {
        console.error('Error loading alien1.glb:', error);
    });
    
    // Load the second alien model
    loader.load('assets/models/alien2.glb', (gltf) => {
        console.log('Loaded alien2.glb model');
        alienModels[1] = gltf;
        
    // Subtle glow while preserving original colors

    gltf.scene.traverse((child) => {

        if (child.isMesh && child.material) {

            // Use the model's own color for emission

            child.material.emissive = child.material.color.clone().multiplyScalar(0.3);

            child.material.emissiveIntensity = 0.4;

        }

    });



        modelsLoaded++;

        if (modelsLoaded === 2) createEnemiesWithModels();
    },
    // onProgress callback
    (xhr) => {
        console.log(`Loading alien2.glb: ${(xhr.loaded / xhr.total * 100).toFixed(0)}%`);
    },
    // onError callback
    (error) => {
        console.error('Error loading alien2.glb:', error);
    });
}

    /**
     * Updates enemy grid movement using classic Space Invaders pattern
     */
    updateEnemyMovement() {
        if (this.enemies.length === 0) return;
        
        const now = performance.now();
        if (now - this.lastEnemyUpdate < this.enemyUpdateInterval) return;
        this.lastEnemyUpdate = now;
        
        // Find left and right edges of enemy group
        let leftEdge = Infinity;
        let rightEdge = -Infinity;
        
        for (const enemy of this.enemies) {
            if (enemy.alive) {
                leftEdge = Math.min(leftEdge, enemy.mesh.position.x);
                rightEdge = Math.max(rightEdge, enemy.mesh.position.x);
                
                // Apply rotation animation to give enemies more life
                if (enemy.mesh.userData) {
                    enemy.mesh.rotateOnAxis(enemy.mesh.userData.rotationAxis, enemy.mesh.userData.rotationSpeed);
                }
            }
        }
        
        // Calculate bounds of the playable area (adjust as needed)
        const boundaryX = ROOM_WIDTH / 2 - 2; // 2 units from side wall
        
        // Check if reached edge
        let reachedEdge = false;
        if ((rightEdge >= boundaryX && this.enemyDirection > 0) || 
            (leftEdge <= -boundaryX && this.enemyDirection < 0)) {
            reachedEdge = true;
        }
        
        // Move enemies
        for (const enemy of this.enemies) {
            if (!enemy.alive) continue;
            
            if (reachedEdge) {
                // Move forward and reverse direction
                enemy.mesh.position.z += this.forwardStep;
            } else {
                // Move sideways
                enemy.mesh.position.x += this.enemyDirection * this.enemySpeed;
            }
        }
        
        // If reached edge, reverse direction for next update
        if (reachedEdge) {
            this.enemyDirection *= -1;
        }
    }

    /**
     * Player shoots a laser from current position in looking direction
     */
    playerShoot() {
        const now = performance.now();
        if (now - this.lastPlayerShot < this.playerShootCooldown) return;
        this.lastPlayerShot = now;
        
        // Get camera direction (forward vector)
        const direction = new THREE.Vector3(0, 0, -1).applyQuaternion(this.camera.quaternion);
        direction.normalize();
        
        // Create laser beam geometry (thin cylinder)
        const laserGeometry = new THREE.CylinderGeometry(this.laserWidth, this.laserWidth, 1.0, 8);
        
        // Rotate cylinder to align with direction
        laserGeometry.rotateX(Math.PI / 2);
        
        // Create laser material with glow effect
        const laserMaterial = new THREE.MeshStandardMaterial({
            color: this.playerLaserColor,
            emissive: this.playerLaserColor,
            emissiveIntensity: this.laserGlowIntensity,
            transparent: true,
            opacity: 0.7
        });
        
        const laser = new THREE.Mesh(laserGeometry, laserMaterial);
        
        // Position laser slightly in front of camera
        laser.position.copy(this.camera.position);
        laser.position.add(direction.multiplyScalar(1.0)); // Start 1 unit in front
        
        // Adjust laser orientation to match shooting direction
        laser.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction);
        
        this.scene.add(laser);
        
        // Store laser with its travel direction
        this.playerBullets.push({
            mesh: laser,
            direction: direction.clone(),
            speed: this.playerBulletSpeed,
            isLaser: true
        });
        
        // Play shoot sound with higher pitch for laser effect
        if (this.app && typeof this.app.playSound === 'function') {
            // Attempt to play a laser sound if available, fall back to generic shoot
            if (this.app.sounds['laser']) {
                this.app.playSound('laser', 0.5);
            } else {
                this.app.playSound('shoot', 0.5);
            }
        }
        
        console.log('Player fired a laser');
    }
    


/**
 * Get the frontmost enemies in each column
 * @returns {Array} Array of enemy objects that are at the front of their columns
 */
getFrontmostEnemies() {
    const frontEnemies = [];
    const columnFrontIndices = {};
    
    // Debug
    console.log(`Getting frontmost enemies from ${this.enemies.length} total enemies`);
    
    // Find the frontmost (highest Z) enemy in each column
    for (let i = 0; i < this.enemies.length; i++) {
        const enemy = this.enemies[i];
        if (!enemy.alive) continue;
        
        console.log(`Checking enemy at column ${enemy.col}, row ${enemy.row}, alive: ${enemy.alive}`);
        
        if (!columnFrontIndices.hasOwnProperty(enemy.col) || 
            this.enemies[columnFrontIndices[enemy.col]].mesh.position.z < enemy.mesh.position.z) {
            columnFrontIndices[enemy.col] = i;
        }
    }
    
    // Collect the frontmost enemies
    for (const index in columnFrontIndices) {
        frontEnemies.push(this.enemies[columnFrontIndices[index]]);
    }
    
    console.log(`Found ${frontEnemies.length} frontmost enemies`);
    return frontEnemies;
}




/**
 * Enemy shooting function - fires laser bullets
 */
enemyShoot() {
    const now = performance.now();
    
    // Calculate dynamic shoot interval based on enemy count
    const aliveEnemies = this.enemies.filter(enemy => enemy.alive).length;
    console.log(`Alive enemies: ${aliveEnemies}/${this.initialEnemyCount}`);
    
    // If no enemies left, don't shoot
    if (aliveEnemies === 0) return;
    
    const difficultyRatio = 1 - (aliveEnemies / this.initialEnemyCount);
    const currentEnemyShootInterval = Math.max(
        this.minEnemyShootInterval,
        this.enemyShootInterval - (difficultyRatio * (this.enemyShootInterval - this.minEnemyShootInterval))
    );
    
    if (now - this.lastEnemyShot < currentEnemyShootInterval) {
        // Not time to shoot yet
        return;
    }
    
    console.log(`Attempting enemy shot at ${now}, interval: ${currentEnemyShootInterval}ms`);
    this.lastEnemyShot = now;
    
    // Get frontmost enemies
    const frontEnemies = this.getFrontmostEnemies();
    if (frontEnemies.length === 0) {
        console.log("No frontmost enemies found to shoot");
        return;
    }
    
    // Randomly select one of the frontmost enemies to shoot
    const shooterIndex = Math.floor(Math.random() * frontEnemies.length);
    const shooter = frontEnemies[shooterIndex];
    console.log(`Selected shooter from column ${shooter.col}, row ${shooter.row}`);
    
    // Create laser bullet geometry
    const laserGeometry = new THREE.CylinderGeometry(this.laserWidth * 0.8, this.laserWidth * 0.8, 0.7, 8);
    laserGeometry.rotateX(Math.PI / 2);
    
    // Create laser material
    const laserMaterial = new THREE.MeshStandardMaterial({
        color: this.enemyLaserColor,
        emissive: this.enemyLaserColor,
        emissiveIntensity: this.laserGlowIntensity,
        transparent: true,
        opacity: 0.7
    });
    
    const laser = new THREE.Mesh(laserGeometry, laserMaterial);
    
    // Get the shooter position
    const shooterPosition = new THREE.Vector3();
    if (shooter.mesh.type === "Scene" || shooter.mesh.isGroup) {
        // For GLB models, get position
        shooterPosition.copy(shooter.mesh.position);
        console.log(`Shooter is a GLB model at position: `, shooterPosition);
    } else {
        // For simple meshes
        shooterPosition.copy(shooter.mesh.position);
        console.log(`Shooter is a regular mesh at position: `, shooterPosition);
    }
    
    // Position laser at enemy with slight offset toward player
    laser.position.copy(shooterPosition);
    laser.position.z += 0.5; // Move slightly toward player
    
    // Direction is fixed - straight down the Z-axis (towards player side of room)
    const direction = new THREE.Vector3(0, 0, 1);
    direction.normalize();
    
    // Set laser orientation
    laser.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction);
    
    this.scene.add(laser);
    
    // Store bullet with its travel direction
    this.enemyBullets.push({
        mesh: laser,
        direction: direction,
        speed: this.enemyBulletSpeed,
        isLaser: true
    });
    
    console.log(`Enemy at column ${shooter.col} fired a laser`);
}
    

/**
 * Display game instructions text
 */
displayInstructions() {
    // Create a container for the text
    const instructionsContainer = document.createElement('div');
    instructionsContainer.id = 'space-invaders-instructions';
    instructionsContainer.style.position = 'fixed';
    instructionsContainer.style.top = '30%';
    instructionsContainer.style.left = '0';
    instructionsContainer.style.width = '100%';
    instructionsContainer.style.textAlign = 'center';
    instructionsContainer.style.color = '#00FFFF'; // Cyan text to match your laser color
    instructionsContainer.style.fontFamily = "'Press Start 2P', monospace"; // Retro font
    instructionsContainer.style.fontSize = '24px';
    instructionsContainer.style.textShadow = '0 0 10px #00FFFF'; // Cyan glow
    instructionsContainer.style.zIndex = '1000';
    instructionsContainer.style.pointerEvents = 'none'; // Prevent interaction
    instructionsContainer.style.opacity = '0';
    instructionsContainer.style.transition = 'opacity 1s ease-in-out';
    
    // Add the message
    instructionsContainer.innerHTML = 'Press SPACE to shoot.<br>Don\'t die.';
    
    // Add to document
    document.body.appendChild(instructionsContainer);
    
    // Fade in
    setTimeout(() => {
        instructionsContainer.style.opacity = '1';
        
        // Fade out after 5 seconds
        setTimeout(() => {
            instructionsContainer.style.opacity = '0';
            
            // Remove from DOM after fade out
            setTimeout(() => {
                if (instructionsContainer.parentNode) {
                    instructionsContainer.parentNode.removeChild(instructionsContainer);
                }
            }, 1000);
        }, 5000);
    }, 500);
}

    
    /**
 * Update all bullets (move them and check for collisions)
 */
updateBullets() {
    // Update player bullets
    for (let i = this.playerBullets.length - 1; i >= 0; i--) {
        const bullet = this.playerBullets[i];
        
        // Move bullet
        bullet.mesh.position.add(
            bullet.direction.clone().multiplyScalar(bullet.speed)
        );
        
        // For laser bullets, extend their length as they travel
        if (bullet.isLaser) {
            // Scale the laser cylinder slightly each frame to create stretching effect
            bullet.mesh.scale.y *= 1.05;
            bullet.mesh.updateMatrix();
        }
        
        // Check for collision with enemies
        let bulletHit = false;
        for (let j = 0; j < this.enemies.length; j++) {
            const enemy = this.enemies[j];
            if (!enemy.alive) continue;
            
            // Get enemy position, handling GLB models properly
            const enemyPosition = new THREE.Vector3();
            if (enemy.mesh.type === "Scene" || enemy.mesh.isGroup) {
                // For GLB models or groups, use the position directly
                enemyPosition.copy(enemy.mesh.position);
            } else {
                // For simple meshes, use their position directly
                enemyPosition.copy(enemy.mesh.position);
            }
            
            // Simple distance-based collision with adjusted radius for models
            const distance = bullet.mesh.position.distanceTo(enemyPosition);
            if (distance < 1.2) { // Increased radius for GLB models
                // Create explosion effect
                this.createExplosion(enemyPosition.clone(), 0.8, 0xFF5500); // Generic explosion color
                
                // Enemy hit!
                enemy.alive = false;
                enemy.mesh.visible = false;
                
                console.log(`Enemy destroyed! Row: ${enemy.row}, Column: ${enemy.col}`);

                // --- WIN CONDITION CHECK ---
                const remainingEnemies = this.enemies.filter(e => e.alive).length;
                console.log(`Remaining enemies: ${remainingEnemies}`);
                if (remainingEnemies === 0 && !this.levelComplete && !this.isGameOver) {
                    this.levelComplete = true;
                    console.log("Level Complete: All Enemies Defeated!");
                    if (this.app) {
                        this.app.disableControls();
                        this.app.showInteractionFeedback('YOU WIN!', false);
                        this.app.playSound('levelWin', 0.7);
                        setTimeout(() => {
                            if (this.app) {
                                this.app.transitionToLevel('corridor', {
                                    isRespawn: true,
                                    gameResult: {
                                        result: 'win',
                                        game: 'real_space_invaders',
                                        doorId: 'corridor-door-7'
                                    }
                                });
                            }
                        }, 2500);
                    }
                }
                
                // Remove bullet
                this.scene.remove(bullet.mesh);
                bullet.mesh.geometry.dispose();
                bullet.mesh.material.dispose();
                this.playerBullets.splice(i, 1);
                bulletHit = true;
                break;
            }
        }
        
        // Skip further checks if bullet already hit an enemy
        if (bulletHit) continue;
        
        // Check for collision with bunkers
        for (let j = 0; j < this.bunkers.length; j++) {
            const bunker = this.bunkers[j];
            
            // Check if any active slices remain
            if (bunker.slices.every(slice => !slice.active)) continue;
            
            // Check if bullet is within bunker bounds
            if (this.isBulletHittingBunker(bullet.mesh.position, bunker)) {
                // Find active slices
                const activeSlices = bunker.slices.filter(slice => slice.active);
                
                if (activeSlices.length > 0) {
                    // Create small hit effect
                    this.createExplosion(bullet.mesh.position.clone(), 0.3, 0x00FF00);
                    
                    // Randomly select a slice to destroy only on every 3rd hit
                    if (bunker.hitCount % 3 === 0) {
                        const randomIndex = Math.floor(Math.random() * activeSlices.length);
                        const targetSlice = activeSlices[randomIndex];
                        
                        // Deactivate the slice
                        targetSlice.active = false;
                        targetSlice.mesh.visible = false;
                    }
                    
                    // Increment hit count for this bunker
                    bunker.hitCount++;
                    
                    console.log(`Bunker hit! Slice removed. Bunker has taken ${bunker.hitCount} hits.`);
                }
                
                // Remove bullet
                this.scene.remove(bullet.mesh);
                bullet.mesh.geometry.dispose();
                bullet.mesh.material.dispose();
                this.playerBullets.splice(i, 1);
                bulletHit = true;
                break;
            }
        }
        
        // Skip further checks if bullet hit a bunker
        if (bulletHit) continue;
        
        // Check if bullet is out of bounds
        if (
            bullet.mesh.position.x < -ROOM_WIDTH/2 ||
            bullet.mesh.position.x > ROOM_WIDTH/2 ||
            bullet.mesh.position.y < 0 ||
            bullet.mesh.position.y > 8 ||
            bullet.mesh.position.z < -ROOM_DEPTH/2 ||
            bullet.mesh.position.z > ROOM_DEPTH/2
        ) {
            // Remove bullet
            this.scene.remove(bullet.mesh);
            bullet.mesh.geometry.dispose();
            bullet.mesh.material.dispose();
            this.playerBullets.splice(i, 1);
        }
    }
    
    // Update enemy bullets
    for (let i = this.enemyBullets.length - 1; i >= 0; i--) {
        const bullet = this.enemyBullets[i];
        
        // Move bullet
        bullet.mesh.position.add(
            bullet.direction.clone().multiplyScalar(bullet.speed)
        );
        
        // For laser bullets, extend their length as they travel
        if (bullet.isLaser) {
            // Scale the laser cylinder slightly each frame to create stretching effect
            bullet.mesh.scale.y *= 1.05;
            bullet.mesh.updateMatrix();
        }
        
        // Check for collision with player
        const distanceToPlayer = bullet.mesh.position.distanceTo(this.camera.position);
        if (distanceToPlayer < 0.7) { // Player hitbox
            // Player hit!
            this.createExplosion(this.camera.position.clone(), 1.0, 0xFF0000);

            // --- LOSE CONDITION ---
            if (!this.isGameOver && !this.levelComplete) { // Prevent triggering multiple times
                this.isGameOver = true;
                console.log("Game Over: Player Hit!");
                if (this.app) {
                    this.app.disableControls();
                    this.app.showInteractionFeedback('YOU GOT HIT', true);
                    this.app.playSound('gameOver', 0.7);
                    setTimeout(() => {
                        if (this.app) {
                            this.app.transitionToLevel('corridor', {
                                isRespawn: true,
                                gameResult: {
                                    result: 'loss',
                                    game: 'real_space_invaders',
                                    doorId: 'corridor-door-7'
                                }
                            });
                        }
                    }, 2000);
                }
            }

            // Remove bullet
            this.scene.remove(bullet.mesh);
            bullet.mesh.geometry.dispose();
            bullet.mesh.material.dispose();
            this.enemyBullets.splice(i, 1);
            continue;
        }
        
        // Check for collision with bunkers
        let bulletHit = false;
        for (let j = 0; j < this.bunkers.length; j++) {
            const bunker = this.bunkers[j];
            
            // Check if any active slices remain
            if (bunker.slices.every(slice => !slice.active)) continue;
            
            // Check if bullet is within bunker bounds
            if (this.isBulletHittingBunker(bullet.mesh.position, bunker)) {
                // Create small hit effect
                this.createExplosion(bullet.mesh.position.clone(), 0.3, 0x00FF00);
            
                // Find active slices
                const activeSlices = bunker.slices.filter(slice => slice.active);
                
                if (activeSlices.length > 0) {
                    // Increment hit count FIRST
                    if (bunker.hitCount === undefined) bunker.hitCount = 0; // Safety init just in case
                    bunker.hitCount++;
                    console.log(`Enemy bullet hit bunker! Hit count: ${bunker.hitCount}`);

                    // Remove slice only on every 3rd hit
                    if (bunker.hitCount % 3 === 0) {
                        console.log(`   Hit count is multiple of 3. Removing slice.`);
                        const randomIndex = Math.floor(Math.random() * activeSlices.length);
                        const targetSlice = activeSlices[randomIndex];

                        // Deactivate the slice
                        targetSlice.active = false;
                        targetSlice.mesh.visible = false;
                    } else {
                        console.log(`   Hit count is NOT multiple of 3. No slice removed.`);
                    }
                }
                
                // Remove bullet
                this.scene.remove(bullet.mesh);
                bullet.mesh.geometry.dispose();
                bullet.mesh.material.dispose();
                this.enemyBullets.splice(i, 1);
                bulletHit = true;
                break;
            }
        }
        
        // Skip further checks if bullet hit a bunker
        if (bulletHit) continue;
        
        // Check if bullet is out of bounds
        if (
            bullet.mesh.position.x < -ROOM_WIDTH/2 ||
            bullet.mesh.position.x > ROOM_WIDTH/2 ||
            bullet.mesh.position.y < 0 ||
            bullet.mesh.position.y > 8 ||
            bullet.mesh.position.z < -ROOM_DEPTH/2 ||
            bullet.mesh.position.z > ROOM_DEPTH/2
        ) {
            // Remove bullet
            this.scene.remove(bullet.mesh);
            bullet.mesh.geometry.dispose();
            bullet.mesh.material.dispose();
            this.enemyBullets.splice(i, 1);
        }
    }
}

    /**
     * Creates a particle explosion effect at the given position
     * @param {THREE.Vector3} position - Position for the explosion
     * @param {number} size - Size of the explosion
     * @param {number} color - Color of the explosion
     */
    createExplosion(position, size, color) {
        // Particle count based on explosion size
        const particleCount = Math.floor(size * 50);
        
        // Create particle geometry
        const particleGeometry = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);
        
        // Random starting positions within a small radius
        for (let i = 0; i < particleCount; i++) {
            const offset = new THREE.Vector3(
                (Math.random() - 0.5) * 0.2,
                (Math.random() - 0.5) * 0.2,
                (Math.random() - 0.5) * 0.2
            );
            
            positions[i * 3] = position.x + offset.x;
            positions[i * 3 + 1] = position.y + offset.y;
            positions[i * 3 + 2] = position.z + offset.z;
        }
        
        particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        
        // Create particle material with glow
        const particleMaterial = new THREE.PointsMaterial({
            color: color,
            size: 0.1,
            blending: THREE.AdditiveBlending,
            transparent: true,
            opacity: 0.8
        });
        
        // Create particle system
        const particles = new THREE.Points(particleGeometry, particleMaterial);
        this.scene.add(particles);
        
        // Store velocities for each particle
        const velocities = [];
        for (let i = 0; i < particleCount; i++) {
            velocities.push(new THREE.Vector3(
                (Math.random() - 0.5) * 0.1,
                (Math.random() - 0.5) * 0.1,
                (Math.random() - 0.5) * 0.1
            ));
        }
        
        // Animation duration
        const duration = 1000; // milliseconds
        const startTime = performance.now();
        
        // Animation function
        const animateParticles = () => {
            const now = performance.now();
            const elapsed = now - startTime;
            const progress = elapsed / duration;
            
            if (progress >= 1.0) {
                // Remove particles when animation completes
                this.scene.remove(particles);
                particleGeometry.dispose();
                particleMaterial.dispose();
                return;
            }
            
            // Update particle positions
            const positions = particleGeometry.attributes.position.array;
            
            for (let i = 0; i < particleCount; i++) {
                positions[i * 3] += velocities[i].x;
                positions[i * 3 + 1] += velocities[i].y;
                positions[i * 3 + 2] += velocities[i].z;
            }
            
            particleGeometry.attributes.position.needsUpdate = true;
            
            // Fade out particles over time
            particleMaterial.opacity = 0.8 * (1 - progress);
            
            // Continue animation
            requestAnimationFrame(animateParticles);
        };
        
        // Start animation
        animateParticles();
    }

    /**
     * Create the space environment (floor, walls, etc.)
     */
    createSpaceEnvironment() {
        console.log('Creating space environment...');
        this.roomObjects = []; // Clear previous objects

        // Dark floor with grid pattern for sci-fi look
        const floorGridTexture = this.createGridTexture(64, 64, 0x00FFFF, 0x000033);
        const floorMaterial = new THREE.MeshStandardMaterial({
            color: 0x000022, // Very dark blue base
            roughness: 0.7,
            metalness: 0.3,
            map: floorGridTexture,
            emissive: 0x000033,
            emissiveIntensity: 0.2
        });
        
        // Walls with tech pattern
        const wallGridTexture = this.createGridTexture(32, 32, 0x3333AA, 0x000011);
        const wallMaterial = new THREE.MeshStandardMaterial({
            color: 0x000033, // Dark blue
            roughness: 0.8,
            metalness: 0.2,
            map: wallGridTexture,
            emissive: 0x000055,
            emissiveIntensity: 0.1
        });
        
        // Ceiling with subtle glow pattern
        const ceilingGridTexture = this.createGridTexture(48, 48, 0x2222AA, 0x000022);
        const ceilingMaterial = new THREE.MeshStandardMaterial({
            color: 0x000044, // Slightly lighter dark blue
            roughness: 0.9,
            metalness: 0.1,
            map: ceilingGridTexture,
            emissive: 0x000066,
            emissiveIntensity: 0.1
        });

        // Floor
        const floorGeometry = new THREE.PlaneGeometry(ROOM_WIDTH, ROOM_DEPTH);
        const floor = new THREE.Mesh(floorGeometry, floorMaterial);
        floor.rotation.x = -Math.PI / 2;
        floor.position.y = 0; // Floor at y=0
        this.scene.add(floor);
        this.roomObjects.push(floor);

        // Ceiling
        const ceilingGeometry = new THREE.PlaneGeometry(ROOM_WIDTH, ROOM_DEPTH);
        const ceiling = new THREE.Mesh(ceilingGeometry, ceilingMaterial);
        ceiling.rotation.x = Math.PI / 2;
        ceiling.position.y = 8; // Use literal value
        this.scene.add(ceiling);

        // Walls
        // For front and back walls (north/south)
        const frontBackWallGeometry = new THREE.PlaneGeometry(ROOM_WIDTH, 8); 

        // North Wall (back wall)
        const northWall = new THREE.Mesh(frontBackWallGeometry, wallMaterial);
        northWall.position.set(0, 8 / 2, -ROOM_DEPTH / 2); 
        this.scene.add(northWall);
        this.roomObjects.push(northWall);

        // South Wall (front wall)
        const southWall = new THREE.Mesh(frontBackWallGeometry, wallMaterial);
        southWall.position.set(0, 8 / 2, ROOM_DEPTH / 2); 
        southWall.rotation.y = Math.PI; // Rotate to face inward
        this.scene.add(southWall);
        this.roomObjects.push(southWall);

        // For side walls (east/west) - need different dimensions
        const sideWallGeometry = new THREE.PlaneGeometry(ROOM_DEPTH, 8);

        // East Wall (right side)
        const eastWall = new THREE.Mesh(sideWallGeometry, wallMaterial);
        eastWall.position.set(ROOM_WIDTH / 2, 8 / 2, 0); 
        eastWall.rotation.y = -Math.PI / 2; // Rotate to face inward
        this.scene.add(eastWall);
        this.roomObjects.push(eastWall);

        // West Wall (left side)
        const westWall = new THREE.Mesh(sideWallGeometry, wallMaterial);
        westWall.position.set(-ROOM_WIDTH / 2, 8 / 2, 0); 
        westWall.rotation.y = Math.PI / 2; // Rotate to face inward
        this.scene.add(westWall);
        this.roomObjects.push(westWall);

        console.log('Space environment created.');
    }

    /**
     * Create a procedural grid texture for sci-fi surfaces
     */
    createGridTexture(width, height, lineColor, backgroundColor) {
        // Create a canvas for the texture
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        
        // Fill background
        ctx.fillStyle = `#${backgroundColor.toString(16).padStart(6, '0')}`;
        ctx.fillRect(0, 0, width, height);
        
        // Draw grid lines
        ctx.strokeStyle = `#${lineColor.toString(16).padStart(6, '0')}`;
        ctx.lineWidth = 1;
        
        // Horizontal lines
        for (let y = 0; y <= height; y += Math.floor(height / 8)) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(width, y);
            ctx.stroke();
        }
        
        // Vertical lines
        for (let x = 0; x <= width; x += Math.floor(width / 8)) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, height);
            ctx.stroke();
        }
        
        // Create Three.js texture from canvas
        const texture = new THREE.CanvasTexture(canvas);
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        texture.repeat.set(Math.ceil(ROOM_WIDTH / 4), Math.ceil(ROOM_DEPTH / 4));
        
        return texture;
    }

    /**
     * Set up enhanced lighting for space theme
     */
    setupEnhancedLighting() {
        console.log('Setting up enhanced space lighting...');
        this.roomLights = []; // Clear previous lights

        // Dim ambient light for space feeling
        const ambientLight = new THREE.AmbientLight(0x112244, 0.3); 
        this.scene.add(ambientLight);
        this.roomLights.push(ambientLight);

        // Blue-tinted hemisphere light from above
        const hemisphereLight = new THREE.HemisphereLight(0x4477FF, 0x112233, 0.4);
        hemisphereLight.position.set(0, 8, 0); 
        this.scene.add(hemisphereLight);
        this.roomLights.push(hemisphereLight);

        // Add spotlight behind player to illuminate the scene
        const playerBacklight = new THREE.SpotLight(0xAACCFF, 0.7, 50, Math.PI / 4, 0.5);
        playerBacklight.position.set(0, 6, 16); // Behind player
        playerBacklight.target.position.set(0, 0, 0); // Point toward center
        this.scene.add(playerBacklight);
        this.scene.add(playerBacklight.target);
        this.roomLights.push(playerBacklight);

        // Add subtle red point light at back of room for atmosphere
        const backRedLight = new THREE.PointLight(0xFF3333, 0.5, 25);
        backRedLight.position.set(0, 4, -ROOM_DEPTH / 2 + 2); // Near back wall
        this.scene.add(backRedLight);
        this.roomLights.push(backRedLight);
        
        // Add subtle blue point lights at sides for tech feeling
        const leftBlueLight = new THREE.PointLight(0x3333FF, 0.4, 15);
        leftBlueLight.position.set(-ROOM_WIDTH / 2 + 2, 5, -ROOM_DEPTH / 4);
        this.scene.add(leftBlueLight);
        this.roomLights.push(leftBlueLight);
        
        const rightBlueLight = new THREE.PointLight(0x3333FF, 0.4, 15);
        rightBlueLight.position.set(ROOM_WIDTH / 2 - 2, 5, -ROOM_DEPTH / 4);
        this.scene.add(rightBlueLight);
        this.roomLights.push(rightBlueLight);

        console.log('Enhanced space lighting set up.');
    }

    /**
     * Updates light flickering effect for atmosphere
     */
    updateLightFlicker() {
        const now = performance.now();
        if (now - this.lastLightFlicker < this.lightFlickerInterval) return;
        this.lastLightFlicker = now;
        
        // Slightly adjust intensity of space lights for subtle flicker effect
        this.roomLights.forEach(light => {
            if (light instanceof THREE.PointLight || light instanceof THREE.SpotLight) {
                // Store original intensity if not already stored
                if (light.userData.originalIntensity === undefined) {
                    light.userData.originalIntensity = light.intensity;
                }
                
                // Random flicker between 90% and 110% of original intensity
                const flickerFactor = 0.9 + Math.random() * 0.2;
                light.intensity = light.userData.originalIntensity * flickerFactor;
            }
        });
        
        // Also update nebulae materials for subtle animation
        this.nebulae.forEach(nebula => {
            if (nebula.material && nebula.material.uniforms && nebula.material.uniforms.time) {
                nebula.material.uniforms.time.value = now * 0.001; // Update time uniform for shader animation
            }
        });
    }

    /**
     * Creates bunkers that protect the player from enemy fire
     * Each bunker is divided into 4 vertical slices that can be individually destroyed
     * Enhanced with better materials and subtle glow
     */
    createBunkers() {
        console.log('Creating defensive bunkers...');
        this.bunkers = [];
        
        // Material for bunkers (green with subtle glow)
        const bunkerMaterial = new THREE.MeshStandardMaterial({
            color: 0x11FF44,
            emissive: 0x11AA33,
            emissiveIntensity: 0.5,
            roughness: 0.5,
            metalness: 0.7
        });
        
        // Calculate total width of all bunkers for positioning
        const totalBunkersWidth = (this.bunkerCount * this.bunkerWidth) + 
                                  ((this.bunkerCount - 1) * this.bunkerSpacing);
        const startX = -totalBunkersWidth / 2 + (this.bunkerWidth / 2);
        
        // Create each bunker
        for (let b = 0; b < this.bunkerCount; b++) {
            const bunkerX = startX + (b * (this.bunkerWidth + this.bunkerSpacing));
            
            // Create a parent object to hold all slices
            const bunkerParent = new THREE.Object3D();
            bunkerParent.position.set(bunkerX, this.bunkerY, this.bunkerZ);
            this.scene.add(bunkerParent);
            
            // Create 4 vertical slices for each bunker
            const sliceWidth = this.bunkerWidth / 4;
            const sliceOffsets = [
                -this.bunkerWidth/2 + sliceWidth/2,
                -this.bunkerWidth/2 + sliceWidth*1.5,
                -this.bunkerWidth/2 + sliceWidth*2.5,
                -this.bunkerWidth/2 + sliceWidth*3.5
            ];
            
            const bunkerSlices = [];
            
            // Create each slice
            for (let s = 0; s < 4; s++) {
                // Use beveled box for better look
                const sliceGeometry = new THREE.BoxGeometry(
                    sliceWidth - 0.02, // Slightly smaller to avoid z-fighting
                    this.bunkerHeight,
                    this.bunkerDepth
                );
                
                // Create unique material for each slice with slight color variation
                const sliceMaterial = bunkerMaterial.clone();
                // Adjust color slightly for visual variation
                sliceMaterial.color.offsetHSL(0, 0, (Math.random() - 0.5) * 0.1);
                
                const slice = new THREE.Mesh(sliceGeometry, sliceMaterial);
                slice.position.set(sliceOffsets[s], 0, 0); // Position relative to parent
                
                bunkerParent.add(slice);
                
                // Store slice reference
                bunkerSlices.push({
                    mesh: slice,
                    active: true
                });
            }
            
            // Store bunker data
            this.bunkers.push({
                parent: bunkerParent,
                slices: bunkerSlices,
                position: new THREE.Vector3(bunkerX, this.bunkerY, this.bunkerZ),
                size: new THREE.Vector3(this.bunkerWidth, this.bunkerHeight, this.bunkerDepth),
                hitCount: 0 // Initialize hit count
            });
        }
        
        console.log(`Created ${this.bunkerCount} bunkers with 4 slices each`);
    }

    /**
     * Helper method to check if a point is within a bunker's bounds
     */
    isBulletHittingBunker(bulletPosition, bunker) {
        return (
            bulletPosition.x >= bunker.position.x - bunker.size.x/2 &&
            bulletPosition.x <= bunker.position.x + bunker.size.x/2 &&
            bulletPosition.y >= bunker.position.y - bunker.size.y/2 &&
            bulletPosition.y <= bunker.position.y + bunker.size.y/2 &&
            bulletPosition.z >= bunker.position.z - bunker.size.z/2 &&
            bulletPosition.z <= bunker.position.z + bunker.size.z/2
        );
    }

    /**
     * Handle player movement and camera rotation based on key states.
     * Copied from real_pacman.js (which was based on corridor.js)
     */
    handleMovement() {
        // Don't process movement if controls are disabled by the app
        if (this.app && this.app.controlsDisabled) {
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

        // --- Shooting instead of Jumping with Space ---
        if (this.keyStates['Space']) {
            this.playerShoot();
        }

        // --- Keep jump physics for movement purposes, but don't trigger jump from Space ---
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
    }

    /**
     * Check for collisions with room walls.
     * @param {THREE.Vector3} potentialPosition - The potential new position of the player camera.
     * @returns {THREE.Vector3} - The adjusted position after collision checks.
     */
    checkCollision(potentialPosition) {
        const adjustedPosition = potentialPosition.clone();
        const playerRadius = 0.5; // Player's approximate horizontal size
        const playerHeight = 8 * 0.9; // Player slightly shorter than wall (Use literal value)

        // Iterate through wall objects for collision detection
        for (const wall of this.roomObjects) {
            // Skip if it's the floor (or ceiling if added)
            if (wall.geometry instanceof THREE.PlaneGeometry && wall.rotation.x !== 0) continue;

            // Create bounding box for the current wall segment
            // For planes, Box3 might not be perfect, but works for axis-aligned walls
            const wallBounds = new THREE.Box3().setFromObject(wall);

            // Check for intersection
            if (
                (adjustedPosition.x + playerRadius > wallBounds.min.x && adjustedPosition.x - playerRadius < wallBounds.max.x) && // X overlap
                (adjustedPosition.z + playerRadius > wallBounds.min.z && adjustedPosition.z - playerRadius < wallBounds.max.z) && // Z overlap
                (adjustedPosition.y < wallBounds.max.y && adjustedPosition.y + playerHeight > wallBounds.min.y) // Y overlap (check player height against wall height)
            ) {
                // Calculate overlaps
                const overlapX1 = (adjustedPosition.x + playerRadius) - wallBounds.min.x;
                const overlapX2 = wallBounds.max.x - (adjustedPosition.x - playerRadius);
                const overlapZ1 = (adjustedPosition.z + playerRadius) - wallBounds.min.z;
                const overlapZ2 = wallBounds.max.z - (adjustedPosition.z - playerRadius);

                // Find minimum positive overlap
                const minOverlapX = Math.min(overlapX1, overlapX2);
                const minOverlapZ = Math.min(overlapZ1, overlapZ2);

// Adjust position on the axis with the smallest overlap
if (minOverlapX < minOverlapZ) {
    // Adjust X
    if (overlapX1 < overlapX2) {
        adjustedPosition.x = wallBounds.min.x - playerRadius;
    } else {
        adjustedPosition.x = wallBounds.max.x + playerRadius;
    }
} else {
    // Adjust Z
    if (overlapZ1 < overlapZ2) {
        adjustedPosition.z = wallBounds.min.z - playerRadius;
    } else {
        adjustedPosition.z = wallBounds.max.z + playerRadius;
    }
}
}
}

// --- Add Z-Boundary Check ---
const barrierZ = this.bunkerZ + this.bunkerDepth / 2; // Calculate barrier position
if (adjustedPosition.z < barrierZ) {
adjustedPosition.z = barrierZ; // Stop player from moving past the barrier
}
// --- End Z-Boundary Check ---

// Prevent falling through floor (redundant safety net)
if (adjustedPosition.y < this.groundLevel) {
adjustedPosition.y = this.groundLevel;
}

return adjustedPosition;
}

/**
* Update loop for the level
*/
update() {
// Stop updates if game is over or level complete
if (this.isGameOver || this.levelComplete) return;

// Handle player movement for this level
this.handleMovement();

// Update enemy movement
this.updateEnemyMovement();

// Update bullets and collision detection
this.updateBullets();

// Enemy shooting
this.enemyShoot();

// Update light flickering
this.updateLightFlicker();

// Rotate starfield slowly for ambient effect
if (this.starfield) {
this.starfield.rotation.y += 0.0001;
}
}

/**
* Clean up resources when unloading the level
*/
unload() {
console.log('Unloading Real Space Invaders level...');

// Remove objects from scene and dispose geometry/material
this.roomObjects.forEach(object => {
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

// Remove lights
this.roomLights.forEach(light => {
if (light.parent) {
light.parent.remove(light);
}
});
this.roomLights = [];

// Clean up enemies
this.enemies.forEach(enemy => {
if (enemy.mesh.parent) {
enemy.mesh.parent.remove(enemy.mesh);
}
if (enemy.mesh.geometry) enemy.mesh.geometry.dispose();
if (enemy.mesh.material) {
if (Array.isArray(enemy.mesh.material)) {
    enemy.mesh.material.forEach(material => {
        material.dispose();
    });
} else {
    enemy.mesh.material.dispose();
}
}
});
this.enemies = [];

// Clean up bullets
this.playerBullets.forEach(bullet => {
if (bullet.mesh.parent) {
bullet.mesh.parent.remove(bullet.mesh);
}
if (bullet.mesh.geometry) bullet.mesh.geometry.dispose();
if (bullet.mesh.material) bullet.mesh.material.dispose();
});
this.playerBullets = [];

this.enemyBullets.forEach(bullet => {
if (bullet.mesh.parent) {
bullet.mesh.parent.remove(bullet.mesh);
}
if (bullet.mesh.geometry) bullet.mesh.geometry.dispose();
if (bullet.mesh.material) bullet.mesh.material.dispose();
});
this.enemyBullets = [];

// Clean up bunkers
this.bunkers.forEach(bunker => {
// Remove all slices
bunker.slices.forEach(slice => {
if (slice.mesh.parent) {
    slice.mesh.parent.remove(slice.mesh);
}
if (slice.mesh.geometry) slice.mesh.geometry.dispose();
if (slice.mesh.material) slice.mesh.material.dispose();
});

// Remove parent object
if (bunker.parent.parent) {
bunker.parent.parent.remove(bunker.parent);
}
});
this.bunkers = [];

// Clean up starfield
if (this.starfield) {
if (this.starfield.parent) {
this.starfield.parent.remove(this.starfield);
}
if (this.starfield.geometry) this.starfield.geometry.dispose();
if (this.starfield.material) this.starfield.material.dispose();
this.starfield = null;
}

// Clean up nebulae
this.nebulae.forEach(nebula => {
if (nebula.parent) {
nebula.parent.remove(nebula);
}
if (nebula.geometry) nebula.geometry.dispose();
if (nebula.material) nebula.material.dispose();
});
this.nebulae = [];

console.log('Real Space Invaders level unloaded.');
}
}

// Make the class available globally or ensure the LevelManager can access it
// If using dynamic script loading, the LevelManager might access it via window['RealSpaceInvadersLevel']