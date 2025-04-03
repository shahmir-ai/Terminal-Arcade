/**
 * Real Pac-Man Level - First-person Pac-Man maze experience
 * Dynamically loaded when the player enters through Corridor Door 6.
 */

// --- Maze Constants ---
const CELL_SIZE = 4; // Size of each cell in the grid (width/depth)
const WALL_HEIGHT = 3; // Height of the maze walls

// --- Maze Layout ---
// W = Wall, '.' = Path
const mazeLayout = [
//0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0
  "WWWWWWWWWWWWWWWWWWWWW",// 0
  "W.........W.........W",// 1
  "W.WW.WW.WWW.WWWWW.W.W",// 2
  "W.WW.WW.W...WW....W.W",// 3
  "W.WW.WW.W.WWWW.WWWW.W",// 4
  "W...................W",// 5
  "W.WWWWW.W.WWWWW.W.W.W",// 6
  "W.WWWWW.W.WWWWW.W.W.W",// 7
  "W.....W.W.W.....W...W",// 8
  "WWWWW.W.WWW.W.WWWWW.W",// 9
  "W.....W.WWW.....W.W.W",// 10
  "W.WWWWW.WWW.WWWWW.W.W",// 11
  "W.W.........W.....W.W",// 12
  "W.W.WWWWWWW.WWWWW.W.W",// 13
  "W.W.W.......W.....W.W",// 14
  "W.W.W.WWWWWWW.WWWWW.W",// 15
  "W.W.W.......W.W.....W",// 16
  "W.W.WWWWWWW.W.W.WWWWW",// 17
  "W...................W",// 18
  "WWWWWWWWWWWWWWWWWWWWW",// 19
];

class RealPacmanLevel {
    /**
     * Constructor for the Real Pac-Man level
     * @param {ArcadeApp} app - Reference to the main app for shared resources
     */
    constructor(app) {
        console.log("Constructing RealPacmanLevel...");
        // Store references to the main app and its components
        this.app = app;
        this.scene = app.scene;
        this.camera = app.camera;
        this.renderer = app.renderer;
        this.listener = app.listener;
        this.sounds = app.sounds;

        // Level-specific properties
        this.mazeObjects = [];
        this.mazeLights = [];

        // Player properties (copied from corridor.js, adjust groundLevel)
        this.moveSpeed = app.moveSpeed * 0.7; // Slower walking speed for maze (adjust 0.7 as needed)
        this.jumpHeight = app.jumpHeight;
        this.jumpVelocity = 0;
        this.gravity = app.gravity;
        this.isJumping = false;
        this.groundLevel = 1.5; // Specific ground level for maze
        this.keyStates = app.keyStates; // Share keyStates with app

        // Camera rotation properties (copied from corridor.js)
        this.verticalRotation = 0; // Current vertical rotation
        this.maxVerticalRotation = Math.PI / 9; // Limit how far up (30 degrees)
        this.minVerticalRotation = -Math.PI / 9; // Limit how far down (-30 degrees)

         // Footstep sound properties (copied from corridor.js)
        this.lastFootstepTime = 0;
        this.footstepInterval = 450;

        // Pellet tracking
        this.pellets = []; // Array to hold pellet meshes
        this.totalPellets = 0;
        this.collectedPellets = 0;
        this.pelletMaterial = null;
        this.pelletGeometry = null;

        // Mini-map properties
        this.minimapCanvas = null;
        this.minimapCtx = null;
        this.minimapScale = 1;
        this.minimapNeedsStaticRedraw = true;
        this.levelComplete = false; // Flag to prevent multiple win triggers

        // GHOST PROPERTIES - NEW
        this.ghosts = []; // Array to hold ghost objects
        this.ghostUpdateInterval = 16; // Update ghost movement every 16ms
        this.lastGhostUpdate = 0;
        this.isDead = false; // Flag to track if player has been caught by a ghost

        // Bind methods
        this.handleMovement = this.handleMovement.bind(this);
        this.checkCollision = this.checkCollision.bind(this);
        this.update = this.update.bind(this);
        this.createPellets = this.createPellets.bind(this);
        this.checkPelletCollision = this.checkPelletCollision.bind(this);
        this.initMinimap = this.initMinimap.bind(this);
        this.drawStaticMinimap = this.drawStaticMinimap.bind(this);
        this.updateDynamicMinimap = this.updateDynamicMinimap.bind(this);
        this.spawnGhosts = this.spawnGhosts.bind(this); // NEW
        this.updateGhosts = this.updateGhosts.bind(this); // NEW
        this.checkGhostCollision = this.checkGhostCollision.bind(this); // NEW
    }

    /**
     * Initialize the Real Pac-Man level
     */
    init() {
        console.log('Initializing Real Pac-Man level...');

        // Clear the scene (should be handled by LevelManager, but good practice)
        // this.clearScene(); // Let LevelManager handle clearing

        // Set up the scene appearance
        this.scene.background = new THREE.Color(0x000000); // Pitch black background
        this.scene.fog = null; // Remove corridor fog, or add maze-specific fog later

        // Calculate maze dimensions for centering
        const mazeRows = mazeLayout.length;
        const mazeCols = mazeLayout[0].length;
        const mazeTotalWidth = mazeCols * CELL_SIZE;
        const mazeTotalDepth = mazeRows * CELL_SIZE;

        // Reset camera position and rotation for maze start
        // Place player in a specific path cell (e.g., row 1, col 1)
        const startCol = 1;
        const startRow = 1;
        const startX = (startCol - mazeCols / 2 + 0.5) * CELL_SIZE;
        const startZ = (startRow - mazeRows / 2 + 0.5) * CELL_SIZE;
        this.camera.position.set(startX, this.groundLevel, startZ);
        this.camera.rotation.set(0, 0, 0); // Reset rotation explicitly
        this.verticalRotation = 0; // Reset vertical look angle
        this.camera.lookAt(startX, this.groundLevel, startZ + CELL_SIZE); // Look in the opposite direction

        // Create the maze environment
        this.createMazeGeometry();
        this.setupLighting();
        this.createPellets();

        // Spawn the ghosts - NEW
        this.spawnGhosts();

        // Initialize and show the mini-map
        this.initMinimap();

        // Reset game state
        this.isDead = false;
        this.levelComplete = false;

        // Event listeners for keydown/keyup are handled globally by ArcadeApp

        // Ensure controls are enabled
        if (this.app) {
            this.app.enableControls();
        }

        console.log('Real Pac-Man level initialized');
        return this;
    }

    /**
 * Replace the createMazeGeometry() function with this enhanced version
 * that adds LED strip lighting effects
 */
createMazeGeometry() {
    console.log('Creating maze geometry with LED lighting effects...');
    this.mazeObjects = []; // Clear previous objects
    this.lightStrips = []; // NEW - array to track light strips

    const mazeRows = mazeLayout.length;
    const mazeCols = mazeLayout[0].length;
    const mazeTotalWidth = mazeCols * CELL_SIZE;
    const mazeTotalDepth = mazeRows * CELL_SIZE;

    // --- Updated Materials ---
    // Darker, more futuristic wall color
    const wallMaterial = new THREE.MeshStandardMaterial({
        color: 0x101834, // Darker blue for walls
        roughness: 0.9,
        metalness: 0.2
    });
    
    // Darker floor
    const floorMaterial = new THREE.MeshStandardMaterial({
        color: 0x080c1a, // Very dark blue floor
        roughness: 0.9,
        metalness: 0.1
    });
    
    // Matching dark ceiling
    const ceilingMaterial = new THREE.MeshStandardMaterial({
        color: 0x080c1a, // Match floor color
        roughness: 0.9,
        metalness: 0.1
    });
    
    // NEW - Glowing material for light strips
    const stripMaterial = new THREE.MeshBasicMaterial({
        color: 0x00a7ff, // Bright blue
        emissive: 0x00a7ff,
        emissiveIntensity: 1.0,
        side: THREE.DoubleSide
    });

    // --- Floor ---
    const floorGeometry = new THREE.PlaneGeometry(mazeTotalWidth, mazeTotalDepth);
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = 0; // Floor at y=0
    this.scene.add(floor);

    // --- Ceiling ---
    const ceilingGeometry = new THREE.PlaneGeometry(mazeTotalWidth, mazeTotalDepth);
    const ceiling = new THREE.Mesh(ceilingGeometry, ceilingMaterial);
    ceiling.rotation.x = Math.PI / 2; // Rotate to face down
    ceiling.position.y = WALL_HEIGHT; // Position at the top of the walls
    this.scene.add(ceiling);

    // --- Walls ---
    const wallGeometry = new THREE.BoxGeometry(CELL_SIZE, WALL_HEIGHT, CELL_SIZE);

    for (let row = 0; row < mazeRows; row++) {
        for (let col = 0; col < mazeCols; col++) {
            if (mazeLayout[row][col] === 'W') {
                // Calculate position, centering the maze around (0, 0)
                const xPos = (col - mazeCols / 2 + 0.5) * CELL_SIZE;
                const yPos = WALL_HEIGHT / 2; // Center wall vertically
                const zPos = (row - mazeRows / 2 + 0.5) * CELL_SIZE;

                // Create the wall
                const wall = new THREE.Mesh(wallGeometry, wallMaterial);
                wall.position.set(xPos, yPos, zPos);
                this.scene.add(wall);
                this.mazeObjects.push(wall);
                
                // NEW - Add light strips to this wall cell
                this.addLightStripsToWall(xPos, yPos, zPos, stripMaterial);
            }
        }
    }

    console.log(`Maze geometry created with ${this.mazeObjects.length} wall segments.`);
}

/**
 * NEW - Add light strips to a wall
 * @param {number} x - Wall x position
 * @param {number} y - Wall y position
 * @param {number} z - Wall z position
 * @param {THREE.Material} stripMaterial - Material for the light strips
 */
addLightStripsToWall(x, y, z, stripMaterial) {
    const halfCell = CELL_SIZE / 2;
    const stripThickness = 0.1;
    const stripHeight = 0.05;
    
    // Create strips for the bottom edges of the wall
    const bottomStripGeometry = new THREE.BoxGeometry(CELL_SIZE + stripThickness, stripHeight, stripThickness);
    
    // Bottom front edge
    const bottomFrontStrip = new THREE.Mesh(bottomStripGeometry, stripMaterial);
    bottomFrontStrip.position.set(x, stripHeight/2, z + halfCell);
    this.scene.add(bottomFrontStrip);
    this.lightStrips.push(bottomFrontStrip);
    
    // Bottom back edge
    const bottomBackStrip = new THREE.Mesh(bottomStripGeometry, stripMaterial);
    bottomBackStrip.position.set(x, stripHeight/2, z - halfCell);
    this.scene.add(bottomBackStrip);
    this.lightStrips.push(bottomBackStrip);
    
    // Bottom left edge
    const bottomLeftStripGeometry = new THREE.BoxGeometry(stripThickness, stripHeight, CELL_SIZE);
    const bottomLeftStrip = new THREE.Mesh(bottomLeftStripGeometry, stripMaterial);
    bottomLeftStrip.position.set(x - halfCell, stripHeight/2, z);
    this.scene.add(bottomLeftStrip);
    this.lightStrips.push(bottomLeftStrip);
    
    // Bottom right edge
    const bottomRightStrip = new THREE.Mesh(bottomLeftStripGeometry, stripMaterial);
    bottomRightStrip.position.set(x + halfCell, stripHeight/2, z);
    this.scene.add(bottomRightStrip);
    this.lightStrips.push(bottomRightStrip);
    
    // Create strips for the top edges of the wall
    const topY = WALL_HEIGHT - stripHeight/2;
    
    // Top front edge
    const topFrontStrip = new THREE.Mesh(bottomStripGeometry, stripMaterial);
    topFrontStrip.position.set(x, topY, z + halfCell);
    this.scene.add(topFrontStrip);
    this.lightStrips.push(topFrontStrip);
    
    // Top back edge
    const topBackStrip = new THREE.Mesh(bottomStripGeometry, stripMaterial);
    topBackStrip.position.set(x, topY, z - halfCell);
    this.scene.add(topBackStrip);
    this.lightStrips.push(topBackStrip);
    
    // Top left edge
    const topLeftStripGeometry = new THREE.BoxGeometry(stripThickness, stripHeight, CELL_SIZE);
    const topLeftStrip = new THREE.Mesh(topLeftStripGeometry, stripMaterial);
    topLeftStrip.position.set(x - halfCell, topY, z);
    this.scene.add(topLeftStrip);
    this.lightStrips.push(topLeftStrip);
    
    // Top right edge
    const topRightStrip = new THREE.Mesh(topLeftStripGeometry, stripMaterial);
    topRightStrip.position.set(x + halfCell, topY, z);
    this.scene.add(topRightStrip);
    this.lightStrips.push(topRightStrip);
}



    /**
 * Makes a ghost model face its movement direction with smooth rotation
 * @param {Object} ghost - The ghost object to rotate
 * @param {THREE.Vector3} direction - Direction the ghost is moving
 */
rotateGhostToFaceDirection(ghost, direction) {
    if (direction.length() < 0.1) return; // Skip if barely moving
    
    // Calculate target rotation from direction
    const targetRotation = Math.atan2(direction.x, direction.z);
    
    // Get current rotation (or initialize if not set)
    if (ghost.currentRotation === undefined) {
        ghost.currentRotation = targetRotation;
    }
    
    // Smoothly rotate toward target direction
    const rotationSpeed = 0.1;
    
    // Calculate shortest rotation path
    let rotationDiff = targetRotation - ghost.currentRotation;
    
    // Handle crossing the -PI/PI boundary
    if (rotationDiff > Math.PI) rotationDiff -= Math.PI * 2;
    if (rotationDiff < -Math.PI) rotationDiff += Math.PI * 2;
    
    // Apply smooth rotation
    ghost.currentRotation += rotationDiff * rotationSpeed;
    
    // Apply rotation to the model
    ghost.mesh.rotation.y = ghost.currentRotation;
}




/**
 * Update the setupLighting() function to provide more brightness
 */
setupLighting() {
    console.log('Setting up futuristic lighting with improved brightness...');

    // Clear previous lights
    this.mazeLights.forEach(light => {
        if (light.parent) {
            light.parent.remove(light);
        }
    });
    this.mazeLights = [];

    // MUCH brighter ambient light - increased from 0.4 to 1.0
    const ambientLight = new THREE.AmbientLight(0x6b7c8c, 1.0);
    this.scene.add(ambientLight);
    this.mazeLights.push(ambientLight);

    // Add hemisphere light for better overall illumination
    const hemisphereLight = new THREE.HemisphereLight(0x8099cc, 0x334455, 1.0);
    this.scene.add(hemisphereLight);
    this.mazeLights.push(hemisphereLight);

    // Add some brighter point lights throughout the maze
    const addPointLight = (x, z, intensity = 1.5, distance = 20, color = 0x00a7ff) => {
        const light = new THREE.PointLight(color, intensity, distance);
        light.position.set(x, WALL_HEIGHT - 0.5, z);
        this.scene.add(light);
        this.mazeLights.push(light);
    };
    
    // Add lights at maze entrances and intersections - more lights with greater intensity
    const mazeRows = mazeLayout.length;
    const mazeCols = mazeLayout[0].length;
    
    // Center light
    addPointLight(0, 0, 1.8, 25);
    
    // Lights near player start - brighter
    addPointLight(-8, -8, 1.5, 20);
    addPointLight(8, 8, 1.5, 20);
    
    // Lights at key intersection points - brighter
    addPointLight(0, -15, 1.6, 22);
    addPointLight(0, 15, 1.6, 22);
    
    // Add more lights throughout the maze
    addPointLight(-10, 0, 1.4, 18);
    addPointLight(10, 0, 1.4, 18);
    addPointLight(0, -8, 1.4, 18);
    addPointLight(0, 8, 1.4, 18);

    console.log('Futuristic lighting set up with improved brightness.');
}


    /**
     * Update loop for the maze level (called by main app's animate loop)
     */
    update() { // Removed deltaTime - handleMovement doesn't need it here
        // Skip updates if the player is dead
        if (this.isDead) return;

        // Handle player movement for this level
        this.handleMovement();

        // Check for pellet collisions
        this.checkPelletCollision();
        
        // Update ghosts and check for ghost collisions - NEW
        const now = performance.now();
        if (now - this.lastGhostUpdate > this.ghostUpdateInterval) {
            this.updateGhosts(this.camera.position);
            this.checkGhostCollision();
            this.lastGhostUpdate = now;
        }

        // Update the mini-map
        this.updateDynamicMinimap();

        // Add any other maze-specific updates here (e.g., ghost movement later)
    }

    /**
     * Check for collisions with maze walls.
     * This function will be called by the main app's movement logic.
     * @param {THREE.Vector3} potentialPosition - The potential new position of the player camera.
     * @returns {THREE.Vector3} - The adjusted position after collision checks. If no collision, returns the original potentialPosition.
     */
    checkCollision(potentialPosition) {
        const adjustedPosition = potentialPosition.clone();
        const playerRadius = 0.5; // Player's approximate horizontal size
        // Use the defined WALL_HEIGHT, assuming player is slightly shorter
        const playerHeight = WALL_HEIGHT * 0.9;

        // Iterate through all wall objects for collision detection
        for (const wall of this.mazeObjects) {
            // Create bounding box for the current wall segment
            const wallBounds = new THREE.Box3().setFromObject(wall);

            // Check for intersection between player's potential bounding box and wall bounding box
            if (
                (adjustedPosition.x + playerRadius > wallBounds.min.x && adjustedPosition.x - playerRadius < wallBounds.max.x) && // X overlap
                (adjustedPosition.z + playerRadius > wallBounds.min.z && adjustedPosition.z - playerRadius < wallBounds.max.z) && // Z overlap
                (adjustedPosition.y < wallBounds.max.y && adjustedPosition.y + playerHeight > wallBounds.min.y) // Y overlap
            ) {
                // --- Collision Detected with this wall ---
                // Simple push-back adjustment: Find minimum overlap axis and push back.

                // Calculate overlaps on X and Z axes
                const overlapX1 = (adjustedPosition.x + playerRadius) - wallBounds.min.x;
                const overlapX2 = wallBounds.max.x - (adjustedPosition.x - playerRadius);
                const overlapZ1 = (adjustedPosition.z + playerRadius) - wallBounds.min.z;
                const overlapZ2 = wallBounds.max.z - (adjustedPosition.z - playerRadius);

                // Find minimum positive overlap (the axis of least penetration)
                const minOverlapX = Math.min(overlapX1, overlapX2);
                const minOverlapZ = Math.min(overlapZ1, overlapZ2);

                // Adjust position on the axis with the smallest overlap
                if (minOverlapX < minOverlapZ) {
                    // Adjust X position: Push out along X-axis
                    if (overlapX1 < overlapX2) { // Player entered from left side of wall
                        adjustedPosition.x = wallBounds.min.x - playerRadius;
                    } else { // Player entered from right side of wall
                        adjustedPosition.x = wallBounds.max.x + playerRadius;
                    }
                } else {
                    // Adjust Z position: Push out along Z-axis
                    if (overlapZ1 < overlapZ2) { // Player entered from front side of wall (min Z)
                        adjustedPosition.z = wallBounds.min.z - playerRadius;
                    } else { // Player entered from back side of wall (max Z)
                        adjustedPosition.z = wallBounds.max.z + playerRadius;
                    }
                }
                // Note: After adjusting for one wall, we might still collide with another.
                // A more robust system might re-check collisions after adjustment or use
                // more sophisticated methods like swept collision detection.
                // For now, we adjust based on the first detected collision in the loop.
            }
        }

        // Prevent falling through floor (ensure Y is at least groundLevel)
        // This might be redundant if gravity/jumping is handled correctly, but acts as a safety net.
        if (adjustedPosition.y < this.groundLevel) {
             adjustedPosition.y = this.groundLevel;
        }

        return adjustedPosition; // Return adjusted (or original if no collision) position
    }

/**
 * Improved collision detection and avoidance for ghosts
 * @param {THREE.Vector3} ghostPosition - Current position of the ghost
 * @param {number} ghostRadius - Radius of the ghost for collision
 * @param {THREE.Vector3} movement - Proposed movement vector
 * @returns {THREE.Vector3} - Adjusted position after collision checks
 */
checkGhostWallCollision(ghostPosition, ghostRadius, movement) {
    // Calculate the potential new position
    const potentialPosition = ghostPosition.clone().add(movement);
    
    // 1. Check for direct collision with walls at the potential position
    let wallCollision = false;
    let collisionWall = null;
    
    for (const wall of this.mazeObjects) {
        const wallBounds = new THREE.Box3().setFromObject(wall);
        
        // Add a small buffer to improve collision detection
        const buffer = 0.1;
        wallBounds.min.x -= buffer;
        wallBounds.min.z -= buffer;
        wallBounds.max.x += buffer;
        wallBounds.max.z += buffer;
        
        // Check if potential position would intersect with the wall
        if (
            (potentialPosition.x + ghostRadius > wallBounds.min.x && 
             potentialPosition.x - ghostRadius < wallBounds.max.x) && // X overlap
            (potentialPosition.z + ghostRadius > wallBounds.min.z && 
             potentialPosition.z - ghostRadius < wallBounds.max.z) // Z overlap
        ) {
            wallCollision = true;
            collisionWall = wall;
            break;
        }
    }
    
    if (!wallCollision) {
        // No collision, allow movement
        return potentialPosition;
    }
    
    // 2. If collision detected, attempt to slide along wall instead of stopping
    
    // Try sliding horizontally only
    const horizontalSlide = new THREE.Vector3(
        movement.x,
        0,
        0
    );
    
    let slidePosition = ghostPosition.clone().add(horizontalSlide);
    let horizontalCollision = false;
    
    // Check if horizontal movement causes collision
    for (const wall of this.mazeObjects) {
        const wallBounds = new THREE.Box3().setFromObject(wall);
        
        if (
            (slidePosition.x + ghostRadius > wallBounds.min.x && 
             slidePosition.x - ghostRadius < wallBounds.max.x) && 
            (slidePosition.z + ghostRadius > wallBounds.min.z && 
             slidePosition.z - ghostRadius < wallBounds.max.z)
        ) {
            horizontalCollision = true;
            break;
        }
    }
    
    // If horizontal sliding works, return that position
    if (!horizontalCollision) {
        return slidePosition;
    }
    
    // Try sliding vertically only
    const verticalSlide = new THREE.Vector3(
        0,
        0,
        movement.z
    );
    
    slidePosition = ghostPosition.clone().add(verticalSlide);
    let verticalCollision = false;
    
    // Check if vertical movement causes collision
    for (const wall of this.mazeObjects) {
        const wallBounds = new THREE.Box3().setFromObject(wall);
        
        if (
            (slidePosition.x + ghostRadius > wallBounds.min.x && 
             slidePosition.x - ghostRadius < wallBounds.max.x) && 
            (slidePosition.z + ghostRadius > wallBounds.min.z && 
             slidePosition.z - ghostRadius < wallBounds.max.z)
        ) {
            verticalCollision = true;
            break;
        }
    }
    
    // If vertical sliding works, return that position
    if (!verticalCollision) {
        return slidePosition;
    }
    
    // 3. If sliding doesn't work, try to "bounce" slightly away from the wall
    // This helps prevent getting stuck in corners
    
    // Find which wall we're closest to and bounce away from it
    if (collisionWall) {
        const wallBounds = new THREE.Box3().setFromObject(collisionWall);
        const wallCenter = new THREE.Vector3();
        wallBounds.getCenter(wallCenter);
        
        // Direction from wall to ghost
        const bounceDir = new THREE.Vector3()
            .subVectors(ghostPosition, wallCenter)
            .normalize();
        
        // Create a small bounce away from the wall
        const bouncePosition = ghostPosition.clone().add(
            bounceDir.multiplyScalar(0.2)
        );
        
        // If we're in a corner, this small bounce should help
        return bouncePosition;
    }
    
    // 4. Last resort - don't move
    return ghostPosition.clone();
}

/**
 * Keeps ghosts centered in the corridors to prevent wall sticking
 * @param {THREE.Vector3} ghostPosition - Current ghost position
 * @returns {boolean} - Whether the ghost was recentered
 */
recenterGhostInCorridor(ghostPosition) {
    // Get maze dimensions (assuming maze is centered at origin)
    const mazeRows = mazeLayout.length;
    const mazeCols = mazeLayout[0].length;
    
    // Convert 3D position to maze grid coordinates
    const gridCol = Math.round((ghostPosition.x / CELL_SIZE) + (mazeCols / 2) - 0.5);
    const gridRow = Math.round((ghostPosition.z / CELL_SIZE) + (mazeRows / 2) - 0.5);
    
    // Ensure grid coordinates are within bounds
    if (gridRow < 0 || gridRow >= mazeRows || gridCol < 0 || gridCol >= mazeCols) {
        return false;
    }
    
    // Check if current cell is a path
    if (mazeLayout[gridRow][gridCol] === '.') {
        // Calculate center of this cell
        const centerX = (gridCol - mazeCols / 2 + 0.5) * CELL_SIZE;
        const centerZ = (gridRow - mazeRows / 2 + 0.5) * CELL_SIZE;
        
        // Calculate distance from center
        const distFromCenter = Math.sqrt(
            Math.pow(ghostPosition.x - centerX, 2) + 
            Math.pow(ghostPosition.z - centerZ, 2)
        );
        
        // If ghost is too far from center (near a wall), pull it toward center
        if (distFromCenter > 1.0) {
            // Calculate direction to center
            const toCenterDir = new THREE.Vector3(
                centerX - ghostPosition.x,
                0,
                centerZ - ghostPosition.z
            ).normalize();
            
            // Move ghost slightly toward center
            ghostPosition.x += toCenterDir.x * 0.03;
            ghostPosition.z += toCenterDir.z * 0.03;
            
            return true;
        }
    }
    
    return false;
}


    /**
     * Creates and places pellet objects in the maze based on the layout.
     */
    createPellets() {
        console.log('Creating pellets...');
        this.pellets = []; // Clear existing pellets if any
        this.totalPellets = 0;
        this.collectedPellets = 0;

        // Define pellet appearance (small, glowing sphere)
        // Define pellet appearance (larger, translucent white sphere with border)
        this.pelletGeometry = new THREE.SphereGeometry(0.45, 16, 8); // Increased radius to 0.3
        this.pelletMaterial = new THREE.MeshBasicMaterial({
            color: 0xFFFFFF,       // White color
            transparent: true,     // Enable transparency
            opacity: 0.6           // Set desired translucency (adjust as needed)
        });
        const borderMaterial = new THREE.LineBasicMaterial({
            color: 0x000000, // Black border
            linewidth: 1     // Line width (may not be consistent across systems)
        });

        const mazeRows = mazeLayout.length;
        const mazeCols = mazeLayout[0].length;

        for (let row = 0; row < mazeRows; row++) {
            for (let col = 0; col < mazeCols; col++) {
                // Place pellet in path cells ('.')
                if (mazeLayout[row][col] === '.') {
                    // Create the main translucent pellet mesh
                    const pellet = new THREE.Mesh(this.pelletGeometry, this.pelletMaterial);

                    // Calculate position, centering the maze and placing slightly above floor
                    const xPos = (col - mazeCols / 2 + 0.5) * CELL_SIZE;
                    const yPos = this.groundLevel * 0.5; // Place halfway between floor and player height? Adjust as needed.
                    const zPos = (row - mazeRows / 2 + 0.5) * CELL_SIZE;

                    pellet.position.set(xPos, yPos, zPos);
                    pellet.userData = { isPellet: true, collected: false }; // Mark as pellet

                    // Create the black border
                    const edges = new THREE.EdgesGeometry(this.pelletGeometry);
                    const border = new THREE.LineSegments(edges, borderMaterial);
                    // No need to set border position explicitly if it's a child

                    // Add the border as a child of the pellet
                    pellet.add(border);

                    // Add the pellet (which now contains the border) to the scene
                    this.scene.add(pellet);
                    this.pellets.push(pellet);
                    this.totalPellets++;
                }
            }
        }
        console.log(`Created ${this.totalPellets} pellets.`);
    }

    /**
     * Checks for collision between the player and pellets.
     */
    checkPelletCollision() {
        const playerPosition = this.camera.position;
        const collectionRadius = 0.6; // How close player needs to be to collect

        for (let i = this.pellets.length - 1; i >= 0; i--) {
            const pellet = this.pellets[i];

            // Skip already collected pellets (though we remove them, this is safer)
            if (pellet.userData.collected) continue;

            // Calculate horizontal distance squared (more efficient)
            const dx = playerPosition.x - pellet.position.x;
            const dz = playerPosition.z - pellet.position.z;
            const distanceSq = dx * dx + dz * dz; // Squared horizontal distance

            // Compare squared distance with squared radius
            if (distanceSq < collectionRadius * collectionRadius) {
                // Collision detected! Collect the pellet.
                pellet.userData.collected = true;
                this.scene.remove(pellet); // Remove from scene
                this.pellets.splice(i, 1); // Remove from active pellets array
                this.collectedPellets++;

                // Play collection sound (optional)
                if (this.app && typeof this.app.playSound === 'function') {
                    // Need a pellet sound - using 'interaction' for now
                    this.app.playSound('interaction');
                }

                console.log(`Pellet collected! (${this.collectedPellets}/${this.totalPellets})`);

                // Check for win condition
                if (!this.levelComplete && this.collectedPellets >= this.totalPellets) {
                    this.levelComplete = true; // Prevent multiple triggers
                    console.log("All pellets collected! YOU WIN!");

                    // Optional: Show win message
                    if (this.app && typeof this.app.showInteractionFeedback === 'function') {
                         this.app.showInteractionFeedback("You survived... for now.");
                    }

                

// Transition back to corridor after a short delay with win result
setTimeout(() => {
    if (this.app && typeof this.app.transitionToLevel === 'function') {
        this.app.transitionToLevel('corridor', {
            isRespawn: true,
            gameResult: {
                result: 'win',
                game: 'real_pacman',
                doorId: 'corridor-door-6' // This matches the door ID in corridor.js
            }
        });
    }
}, 2000); // 2-second delay

                }
            }
        }
    }
/**
 * Initializes the mini-map canvas and context.
 */
initMinimap() {
    this.minimapCanvas = document.getElementById('minimap-canvas');
    if (!this.minimapCanvas) {
        console.error("Minimap canvas not found!");
        return;
    }
    this.minimapCtx = this.minimapCanvas.getContext('2d');
    if (!this.minimapCtx) {
        console.error("Could not get 2D context for minimap!");
        this.minimapCanvas = null; // Nullify if context fails
        return;
    }

    // Set canvas internal resolution to match CSS size for sharp drawing
    // Get dimensions from CSS (ensure CSS is loaded and applied first)
    const style = window.getComputedStyle(this.minimapCanvas);
    const cssWidth = parseInt(style.width, 10);
    const cssHeight = parseInt(style.height, 10);
    this.minimapCanvas.width = cssWidth;
    this.minimapCanvas.height = cssHeight;


    // Make canvas visible
    this.minimapCanvas.style.display = 'block';
    this.minimapNeedsStaticRedraw = true; // Ensure static map is drawn initially

    // Calculate scale based on maze layout and NEW canvas dimensions
    const mazeRows = mazeLayout.length;
    const mazeCols = mazeLayout[0].length;
    const scaleX = this.minimapCanvas.width / mazeCols;
    const scaleY = this.minimapCanvas.height / mazeRows;
    this.minimapScale = Math.min(scaleX, scaleY); // Use smallest scale to fit

    console.log(`Minimap initialized. Canvas: ${this.minimapCanvas.width}x${this.minimapCanvas.height}, Scale: ${this.minimapScale}`);

    // Initial draw of static elements
    this.drawStaticMinimap();
}

/**
 * Draws the static maze walls onto the mini-map canvas.
 */
drawStaticMinimap() {
    if (!this.minimapCtx || !this.minimapCanvas) return;

    console.log("Drawing static minimap...");
    const ctx = this.minimapCtx;
    const scale = this.minimapScale;
    const mazeRows = mazeLayout.length;
    const mazeCols = mazeLayout[0].length;

    // Clear the entire canvas first
    ctx.clearRect(0, 0, this.minimapCanvas.width, this.minimapCanvas.height);

    // Draw background (optional, if CSS background isn't enough)
    // ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    // ctx.fillRect(0, 0, this.minimapCanvas.width, this.minimapCanvas.height);

    // Draw walls
    ctx.fillStyle = '#5555FF'; // Wall color on map (adjust as needed)
    for (let row = 0; row < mazeRows; row++) {
        for (let col = 0; col < mazeCols; col++) {
            if (mazeLayout[row][col] === 'W') {
                ctx.fillRect(col * scale, row * scale, scale, scale);
            }
        }
    }
    this.minimapNeedsStaticRedraw = false; // Mark as drawn
    console.log("Static minimap drawn.");
}

/**
 * Updates the dynamic elements (player, pellets, ghosts) on the mini-map.
 */
updateDynamicMinimap() {
    if (!this.minimapCtx || !this.minimapCanvas) return;

    const ctx = this.minimapCtx;
    const scale = this.minimapScale;
    const mazeRows = mazeLayout.length;
    const mazeCols = mazeLayout[0].length;

    // If static map needs redraw (e.g., first frame), do it first
    if (this.minimapNeedsStaticRedraw) {
        this.drawStaticMinimap();
    } else {
        // Optimization: Instead of clearing and redrawing walls,
        // clear only the areas where dynamic elements were last frame.
        // For simplicity now, we redraw the static map each time dynamic elements update.
        // A more performant approach would use layering or selective clearing.
         this.drawStaticMinimap(); // Redraw static map to clear old dynamic elements
    }


    // --- Draw Pellets ---
    ctx.fillStyle = '#FFFF88'; // Pellet color
    const pelletRadius = Math.max(1, scale * 0.15); // Pellet size on map
    for (const pellet of this.pellets) {
         // Convert pellet 3D position to maze grid coordinates
         const pelletCol = Math.floor((pellet.position.x / CELL_SIZE) + (mazeCols / 2));
         const pelletRow = Math.floor((pellet.position.z / CELL_SIZE) + (mazeRows / 2));

         // Convert grid coordinates to canvas coordinates (center of the cell)
         const canvasX = (pelletCol + 0.5) * scale;
         const canvasY = (pelletRow + 0.5) * scale;

         // Draw pellet
         ctx.beginPath();
         ctx.arc(canvasX, canvasY, pelletRadius, 0, Math.PI * 2);
         ctx.fill();
    }

    // --- NEW: Draw Ghosts ---
    for (const ghost of this.ghosts) {
        // Set each ghost's unique color for the minimap
        ctx.fillStyle = ghost.color;
        
        // Convert ghost position to maze grid coordinates
        const ghostCol = (ghost.mesh.position.x / CELL_SIZE) + (mazeCols / 2);
        const ghostRow = (ghost.mesh.position.z / CELL_SIZE) + (mazeRows / 2);
        
        // Convert to canvas coordinates
        const ghostX = ghostCol * scale;
        const ghostY = ghostRow * scale;
        
        // Draw ghost marker (larger than pellets, smaller than player)
        const ghostRadius = pelletRadius * 2;
        ctx.beginPath();
        ctx.arc(ghostX, ghostY, ghostRadius, 0, Math.PI * 2);
        ctx.fill();
    }

    // --- Draw Player ---
    // Convert player 3D position to maze grid coordinates
    const playerCol = (this.camera.position.x / CELL_SIZE) + (mazeCols / 2);
    const playerRow = (this.camera.position.z / CELL_SIZE) + (mazeRows / 2);

    // Convert grid coordinates to canvas coordinates
    const playerCanvasX = playerCol * scale;
    const playerCanvasY = playerRow * scale;

    // No need for orientation for a circle marker
    // const euler = new THREE.Euler().setFromQuaternion(this.camera.quaternion, 'YXZ');
    // const playerAngle = -euler.y;

    // Draw player marker (yellow circle, slightly larger than pellets)
    const basePelletRadius = Math.max(1, scale * 0.15); // Use the same base calculation as pellets
    const playerRadius = basePelletRadius * 3; // Make player circle larger
    ctx.fillStyle = '#FFFF00'; // Player color (yellow)
    ctx.beginPath();
    ctx.arc(playerCanvasX, playerCanvasY, playerRadius, 0, Math.PI * 2);
    ctx.fill();
}


/** Copy of handleMovement from corridor.js **/

    /** Copy of handleMovement from corridor.js **/
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

        // Apply movement speed (using fixed speed like original corridor)
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
                    // console.log('Playing footstep sound in maze using app.playSound'); // Debug
                }
                this.lastFootstepTime = now;
            }
        }

        // --- IMPROVED ROTATION HANDLING (Copied from corridor.js) ---
        const euler = new THREE.Euler().setFromQuaternion(this.camera.quaternion, 'YXZ');
        let yaw = euler.y;   // Horizontal rotation (left/right)
        let pitch = euler.x; // Vertical rotation (up/down)

        // Handle horizontal rotation (left/right arrows)
        const rotationSpeed = 0.040; // Increased rotation speed
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
            // Auto-return pitch to neutral when no up/down keys are pressed
            if (Math.abs(pitch) < lookReturnSpeed) {
                pitch = 0; // Snap to zero if very close
            } else if (pitch > 0) {
                pitch -= lookReturnSpeed;
            } else {
                pitch += lookReturnSpeed;
            }
        }

        // Always force roll to zero to prevent tilting
        const roll = 0;

        // Apply the updated rotation
        euler.set(pitch, yaw, roll, 'YXZ');
        this.camera.quaternion.setFromEuler(euler);

        // --- Jump Disabled for this level ---
        // if (this.keyStates['Space'] && !this.isJumping) {
        //     // Start jump if we're on the ground
        //      // Use this level's groundLevel
        //     if (Math.abs(this.camera.position.y - this.groundLevel) < 0.1) {
        //         this.isJumping = true;
        //         this.jumpVelocity = 0.2; // Initial upward velocity
        //
        //         if (this.app && typeof this.app.playSound === 'function') {
        //             this.app.playSound('jump');
        //         }
        //         // console.log('Jump initiated in maze'); // Debug
        //     }
        // }

        // --- Jump Physics Disabled ---
        // if (this.isJumping) {
        //     // Apply jump velocity
        //     this.camera.position.y += this.jumpVelocity;
        //
        //     // Apply gravity
        //     this.jumpVelocity -= this.gravity;
        //
        //     // Check if we've landed
        //     if (this.camera.position.y <= this.groundLevel) {
        //         this.camera.position.y = this.groundLevel;
        //         this.isJumping = false;
        //         this.jumpVelocity = 0;
        //     }
        // }
        // Ensure player stays on ground level if not jumping (safety net)
        if (!this.isJumping) {
             this.camera.position.y = this.groundLevel;
        }

        // Handle Escape key (optional - can add pause menu later)
        if (this.keyStates['Escape']) {
            console.log('Escape key pressed in maze');
        }
    }
    /** End of copied handleMovement **/



/**
 * Replace the spawnGhosts() function with this version that loads an external model
 */
spawnGhosts() {
    console.log('Spawning ghosts with 3D model...');
    this.ghosts = []; // Clear existing ghosts
    
    // Get maze dimensions for positioning
    const mazeRows = mazeLayout.length;
    const mazeCols = mazeLayout[0].length;
    
    // Find all valid path cells by scanning the layout
    const validSpawnCells = [];
    for (let row = 0; row < mazeRows; row++) {
        for (let col = 0; col < mazeCols; col++) {
            if (mazeLayout[row][col] === '.') {
                // Don't spawn too close to player start position (row 1, col 1)
                const distFromPlayer = Math.sqrt(Math.pow(row - 1, 2) + Math.pow(col - 1, 2));
                if (distFromPlayer > 8) { // Minimum distance from player
                    validSpawnCells.push({ row, col });
                }
            }
        }
    }
    
    // If not enough valid cells found, use fallback positions that are guaranteed safe
    if (validSpawnCells.length < 6) {
        console.warn("Not enough safe spawn cells found, using fallback positions");
        // Add more fallback positions for 6 ghosts
        validSpawnCells.push({ row: 18, col: 10 });
        validSpawnCells.push({ row: 18, col: 1 });
        validSpawnCells.push({ row: 12, col: 12 });
        validSpawnCells.push({ row: 16, col: 10 });
        validSpawnCells.push({ row: 8, col: 8 });
        validSpawnCells.push({ row: 14, col: 16 });
    }
    
    // Shuffle the array to get random positions
    for (let i = validSpawnCells.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [validSpawnCells[i], validSpawnCells[j]] = [validSpawnCells[j], validSpawnCells[i]];
    }
    
    // Define ghost colors
    const ghostColors = [
        0xFF0000, // Red
        0x00FFFF, // Cyan
        0xFFB8FF, // Pink
        0xFFB852, // Orange
        0x00FF00, // Green
        0x800080  // Purple
    ];
    
    // Load the ghost model
    const loader = new THREE.GLTFLoader();
    loader.load(
        'assets/models/ghost.glb',
        (gltf) => {
            // Model loaded successfully
            console.log('Ghost model loaded successfully');
            
            // Original model 
            const originalGhost = gltf.scene;
            
            // Scale the model if needed
            const modelScale = 0.25; // Adjust scale as needed
            originalGhost.scale.set(modelScale, modelScale, modelScale);
            
            // Create 6 ghosts
            for (let i = 0; i < 6; i++) {
                const spawnCell = validSpawnCells[i];
                
                // Convert maze coordinates to 3D space coordinates (centered in cell)
                const xPos = (spawnCell.col - mazeCols / 2 + 0.5) * CELL_SIZE;
                const zPos = (spawnCell.row - mazeRows / 2 + 0.5) * CELL_SIZE;
                
                // Clone the model for this ghost
                const ghostModel = originalGhost.clone();
                
               
                
                // Position the ghost model
                ghostModel.position.set(xPos, this.groundLevel - 0.3, zPos);
                this.scene.add(ghostModel);
                
                // Create ghost object with state machine properties
                const ghost = {
                    mesh: ghostModel, // Use the model instead of a sphere
                    speed: (0.04 + (i * 0.005)) * 2.1, // 1.6x faster
                    radius: 0.5, // Collision radius
                    color: `#${ghostColors[i].toString(16).padStart(6, '0')}`, // Hex color for minimap
                    state: 'patrol', // Starting state: patrol, chase, search
                    stateTimer: 0, // Timer for state transitions
                    memory: {
                        lastKnownPlayerPos: new THREE.Vector3(),
                        memoryDuration: 3000, // How long to remember player position (ms)
                        lastSeenTime: 0 // When player was last seen
                    },
                    pathfinding: {
                        targetPos: new THREE.Vector3(), // Current target position
                        lastMoveTime: 0,
                        nextDecisionTime: 0,
                        currentDirection: new THREE.Vector3(0, 0, 0)
                    }
                };
                
                // Set initial patrol target
                this.setRandomPatrolTarget(ghost);
                
                // Add ghost to the array
                this.ghosts.push(ghost);
            }
            
            console.log(`Spawned ${this.ghosts.length} ghosts in the maze with custom 3D model`);
        },
        // onProgress callback
        (xhr) => {
            console.log(`Ghost model ${(xhr.loaded / xhr.total * 100).toFixed(0)}% loaded`);
        },
        // onError callback
        (error) => {
            console.error('Error loading ghost model:', error);
            // Fallback to sphere ghosts if model fails to load
            this.spawnSphereGhosts(validSpawnCells, ghostColors, mazeRows, mazeCols);
        }
    );
}

/**
 * Fallback method to spawn simple sphere ghosts if the model fails to load
 */
spawnSphereGhosts(validSpawnCells, ghostColors, mazeRows, mazeCols) {
    console.log('Falling back to sphere ghosts');
    
    // Create 6 ghosts at random valid positions with different colors
    for (let i = 0; i < 6; i++) {
        const spawnCell = validSpawnCells[i];
        
        // Convert maze coordinates to 3D space coordinates (centered in cell)
        const xPos = (spawnCell.col - mazeCols / 2 + 0.5) * CELL_SIZE;
        const zPos = (spawnCell.row - mazeRows / 2 + 0.5) * CELL_SIZE;
        
        // Create ghost geometry
        const ghostGeometry = new THREE.SphereGeometry(0.7, 16, 16);
        
        // Create ghost material with specified color
        const ghostMaterial = new THREE.MeshStandardMaterial({
            color: ghostColors[i],
            emissive: ghostColors[i],
            emissiveIntensity: 0.3,
            roughness: 0.4,
            metalness: 0.5
        });
        
        // Create ghost mesh
        const ghostMesh = new THREE.Mesh(ghostGeometry, ghostMaterial);
        ghostMesh.position.set(xPos, this.groundLevel - 0.3, zPos);
        this.scene.add(ghostMesh);
        
        // Create ghost object with state machine properties
        const ghost = {
            mesh: ghostMesh,
            speed: (0.04 + (i * 0.005)) * 1.6, // 1.6x faster
            radius: 0.5, // Collision radius
            color: `#${ghostColors[i].toString(16).padStart(6, '0')}`, // Hex color for minimap
            state: 'patrol', // Starting state: patrol, chase, search
            stateTimer: 0, // Timer for state transitions
            memory: {
                lastKnownPlayerPos: new THREE.Vector3(),
                memoryDuration: 3000, // How long to remember player position (ms)
                lastSeenTime: 0 // When player was last seen
            },
            pathfinding: {
                targetPos: new THREE.Vector3(), // Current target position
                lastMoveTime: 0,
                nextDecisionTime: 0,
                currentDirection: new THREE.Vector3(0, 0, 0)
            }
        };
        
        // Set initial patrol target
        this.setRandomPatrolTarget(ghost);
        
        // Add ghost to the array
        this.ghosts.push(ghost);
    }
    
    console.log(`Spawned ${this.ghosts.length} sphere ghosts in the maze`);
}





/**
 * Helper function to set a random valid target position for a ghost's patrol
 * @param {Object} ghost - The ghost object to set a target for
 */
setRandomPatrolTarget(ghost) {
    // Find a random path cell to target
    const mazeRows = mazeLayout.length;
    const mazeCols = mazeLayout[0].length;
    
    // Try up to 10 times to find a valid target
    for (let attempts = 0; attempts < 10; attempts++) {
        // Pick a random position in the maze
        const targetRow = Math.floor(Math.random() * (mazeRows - 2)) + 1; // Avoid outer walls
        const targetCol = Math.floor(Math.random() * (mazeCols - 2)) + 1; // Avoid outer walls
        
        // Check if it's a path cell
        if (mazeLayout[targetRow][targetCol] === '.') {
            // Convert to 3D coordinates
            const targetX = (targetCol - mazeCols / 2 + 0.5) * CELL_SIZE;
            const targetZ = (targetRow - mazeRows / 2 + 0.5) * CELL_SIZE;
            
            // Set the target position
            ghost.pathfinding.targetPos.set(targetX, ghost.mesh.position.y, targetZ);
            
            // Set timer for this patrol target (random duration between 5-10 seconds)
            ghost.stateTimer = performance.now() + 5000 + Math.random() * 5000;
            return;
        }
    }
    
    // Fallback if no valid cell found (should rarely happen)
    ghost.pathfinding.targetPos.set(
        ghost.mesh.position.x + (Math.random() * 10 - 5),
        ghost.mesh.position.y,
        ghost.mesh.position.z + (Math.random() * 10 - 5)
    );
    ghost.stateTimer = performance.now() + 3000;
}




/**
 * Update ghost positions and behaviors based on their state
 * @param {THREE.Vector3} playerPosition - Current position of the player
 */
updateGhosts(playerPosition) {
    if (this.isDead || this.levelComplete) return; // Skip updates if game is over
    
    const now = performance.now();
    
    // Update each ghost
    for (const ghost of this.ghosts) {
        // Store current position for collision comparison
        const currentPosition = ghost.mesh.position.clone();
        
        // --- STATE MACHINE LOGIC ---
        // Calculate distance to player (used in multiple states)
        const distanceToPlayer = currentPosition.distanceTo(playerPosition);
        const detectionRange = 10; // How far a ghost can "see" the player
        
        // STATE TRANSITIONS
        switch (ghost.state) {
            case 'patrol':
                // Check if player is within detection range
                if (distanceToPlayer < detectionRange) {
                    // Switch to chase state
                    ghost.state = 'chase';
                    console.log("Ghost spotted player - chase mode activated");
                }
                // Check if it's time to pick a new patrol target
                else if (now > ghost.stateTimer) {
                    this.setRandomPatrolTarget(ghost);
                }
                break;
                
            case 'chase':
                // If player moves out of range, switch to search state
                if (distanceToPlayer > detectionRange) {
                    ghost.state = 'search';
                    // Remember player's last position
                    ghost.memory.lastKnownPlayerPos.copy(playerPosition);
                    ghost.memory.lastSeenTime = now;
                    console.log("Ghost lost player - searching last known position");
                }
                break;
                
            case 'search':
                // If player is spotted again, go back to chase
                if (distanceToPlayer < detectionRange) {
                    ghost.state = 'chase';
                    console.log("Ghost found player again - resuming chase");
                }
                // If memory duration expired, go back to patrol
                else if (now - ghost.memory.lastSeenTime > ghost.memory.memoryDuration) {
                    ghost.state = 'patrol';
                    this.setRandomPatrolTarget(ghost);
                    console.log("Ghost gave up search - returning to patrol");
                }
                break;
        }
        
        // --- MOVEMENT BASED ON STATE ---
        let targetPosition;
        let targetDirection = new THREE.Vector3();
        
        // Determine movement target based on state
        switch (ghost.state) {
            case 'patrol':
                // Move toward the patrol target
                targetPosition = ghost.pathfinding.targetPos;
                break;
                
            case 'chase':
                // Move directly toward player
                targetPosition = playerPosition;
                break;
                
            case 'search':
                // Move toward last known player position
                targetPosition = ghost.memory.lastKnownPlayerPos;
                break;
        }
        
        // Calculate direction vector toward target
        targetDirection.subVectors(targetPosition, currentPosition).normalize();
        
        // Add a small random variation to movement to avoid getting stuck
        if (ghost.state === 'patrol') {
            // More randomness in patrol state
            targetDirection.x += (Math.random() * 0.4 - 0.2);
            targetDirection.z += (Math.random() * 0.4 - 0.2);
            targetDirection.normalize();
        } else if (ghost.state === 'search') {
            // Slight randomness in search state
            targetDirection.x += (Math.random() * 0.2 - 0.1);
            targetDirection.z += (Math.random() * 0.2 - 0.1);
            targetDirection.normalize();
        }
        
        // Calculate movement for this frame
        const movement = targetDirection.clone().multiplyScalar(ghost.speed);
        
        // Ensure ghost stays at the right height
        movement.y = 0;
        
// Try to recenter ghost in corridor to avoid wall sticking
this.recenterGhostInCorridor(ghost.mesh.position);

        
        // Check for wall collisions and get the adjusted position
        const newPosition = this.checkGhostWallCollision(
            ghost.mesh.position,
            ghost.radius,
            movement
        );
        
        // If movement was blocked by a wall (position didn't change)
        if (newPosition.equals(currentPosition)) {
            // Choose a random perpendicular direction
            // This helps ghosts navigate around corners better than pure random
            
            // Find perpendicular directions (right and left of current direction)
            const rightTurn = new THREE.Vector3(-targetDirection.z, 0, targetDirection.x);
            const leftTurn = new THREE.Vector3(targetDirection.z, 0, -targetDirection.x);
            
            // Try right turn first
            let newMovement = rightTurn.clone().multiplyScalar(ghost.speed);
            let rightPosition = this.checkGhostWallCollision(
                currentPosition,
                ghost.radius,
                newMovement
            );
            
            // If right turn blocked, try left turn
            if (rightPosition.equals(currentPosition)) {
                newMovement = leftTurn.clone().multiplyScalar(ghost.speed);
                let leftPosition = this.checkGhostWallCollision(
                    currentPosition,
                    ghost.radius,
                    newMovement
                );
                
                // If left turn also blocked, pick a random direction
                if (leftPosition.equals(currentPosition)) {
                    const randomAngle = Math.random() * Math.PI * 2;
                    const randomDirection = new THREE.Vector3(
                        Math.sin(randomAngle),
                        0,
                        Math.cos(randomAngle)
                    );
                    newMovement = randomDirection.clone().multiplyScalar(ghost.speed);
                    
                    // Update the ghost's direction
                    ghost.pathfinding.currentDirection.copy(randomDirection);
                } else {
                    // Left turn works, use that
                    ghost.pathfinding.currentDirection.copy(leftTurn);
                    ghost.mesh.position.copy(leftPosition);
                }
            } else {
                // Right turn works, use that
                ghost.pathfinding.currentDirection.copy(rightTurn);
                ghost.mesh.position.copy(rightPosition);
            }
        } else {
            // Movement was successful, update ghost position
            ghost.mesh.position.copy(newPosition);
            ghost.pathfinding.currentDirection.copy(targetDirection);
        }
        
        // Ensure ghost maintains the correct Y position
        ghost.mesh.position.y = this.groundLevel - 0.3;

// Make ghost face movement direction - directly rotate to face forward
const direction = ghost.pathfinding.currentDirection;
if (direction.length() > 0.1) { // Only rotate if meaningfully moving
    // Calculate target rotation from direction (add PI to face forward)
    const targetRotation = Math.atan2(direction.x, direction.z) + Math.PI;
    
    // Initialize rotation if needed
    if (ghost.currentRotation === undefined) {
        ghost.currentRotation = targetRotation;
    }
    
    // Calculate rotation difference with shortest path
    let rotationDiff = targetRotation - ghost.currentRotation;
    if (rotationDiff > Math.PI) rotationDiff -= Math.PI * 2;
    if (rotationDiff < -Math.PI) rotationDiff += Math.PI * 2;
    
    // Apply smooth rotation
    ghost.currentRotation += rotationDiff * 0.1;
    ghost.mesh.rotation.y = ghost.currentRotation;
}
        
        // Handle arrival at patrol target
        if (ghost.state === 'patrol') {
            const distToTarget = ghost.mesh.position.distanceTo(ghost.pathfinding.targetPos);
            if (distToTarget < 1.0) {
                // Reached patrol target, pick a new one
                this.setRandomPatrolTarget(ghost);
            }
        }
        
        // Handle arrival at last known position during search
        if (ghost.state === 'search') {
            const distToLastKnown = ghost.mesh.position.distanceTo(ghost.memory.lastKnownPlayerPos);
            if (distToLastKnown < 1.0) {
                // Reached last known position and player not found
                // Start patrolling from this point
                ghost.state = 'patrol';
                this.setRandomPatrolTarget(ghost);
            }
        }
    }
}

    /**
     * NEW: Check if a ghost has caught the player
     */
    checkGhostCollision() {
        if (this.isDead || this.levelComplete) return; // Skip if game is already over
        
        const playerPosition = this.camera.position;
        const collisionRadius = 1.2; // How close ghosts need to be to catch player
        
        for (const ghost of this.ghosts) {
            // Calculate horizontal distance squared (ignoring Y)
            const dx = playerPosition.x - ghost.mesh.position.x;
            const dz = playerPosition.z - ghost.mesh.position.z;
            const distanceSq = dx * dx + dz * dz;
            
            // Compare squared distance with squared radius (more efficient)
            if (distanceSq < collisionRadius * collisionRadius) {
                // COLLISION! Player caught by ghost
                console.log("Player caught by ghost!");
                this.isDead = true;
                
// Hide minimap immediately
if (this.minimapCanvas) {
    this.minimapCanvas.style.display = 'none';
}


                // Play death sound (if available)
                if (this.app && typeof this.app.playSound === 'function') {
                    this.app.playSound('gameOver');
                }
                
                // Show death message
                if (this.app && typeof this.app.showInteractionFeedback === 'function') {
                    this.app.showInteractionFeedback("BOO!", true);
                }
                
             // Return to corridor after a short delay with loss result
setTimeout(() => {
    if (this.app && typeof this.app.transitionToLevel === 'function') {
        this.app.transitionToLevel('corridor', {
            isRespawn: true,
            gameResult: {
                result: 'loss',
                game: 'real_pacman',
                doorId: 'corridor-door-6' // This matches the door ID in corridor.js
            }
        });
    }
}, 2000); // 2-second delay

                
                break; // Exit the loop once caught
            }
        }
    }

    /**
     * Clean up when unloading the level
     */
    unload() {
        console.log('Unloading Real Pac-Man level...');

        // Hide minimap canvas
        if (this.minimapCanvas) {
            this.minimapCanvas.style.display = 'none';
        }
        this.minimapCanvas = null; // Clear references
        this.minimapCtx = null;

        // NEW: Clean up ghosts
        this.ghosts.forEach(ghost => {
            if (ghost.mesh.parent) {
                ghost.mesh.parent.remove(ghost.mesh);
            }
            if (ghost.mesh.geometry) ghost.mesh.geometry.dispose();
            if (ghost.mesh.material) ghost.mesh.material.dispose();
        });
        this.ghosts = []; // Clear array

        // Dispose pellet geometry and material
        if (this.pelletGeometry) this.pelletGeometry.dispose();
        if (this.pelletMaterial) this.pelletMaterial.dispose();
        this.pellets = []; // Clear array

        // Event listeners for keys are managed by the main app

        // Remove maze objects from the scene
        this.mazeObjects.forEach(obj => {
            if (obj.parent) {
                obj.parent.remove(obj);
            }
            // Dispose geometry and material
            if (obj.geometry) obj.geometry.dispose();
            if (obj.material) {
                 if (Array.isArray(obj.material)) {
                    obj.material.forEach(m => {
                        if (m.map) m.map.dispose();
                        m.dispose();
                    });
                } else {
                    if (obj.material.map) obj.material.map.dispose();
                    obj.material.dispose();
                }
            }
        });
        this.mazeObjects = []; // Clear the array

        // Remove lights
        this.mazeLights.forEach(light => {
            if (light.parent) {
                light.parent.remove(light);
            }
            // Dispose if necessary (lights usually don't need explicit disposal)
        });
        this.mazeLights = [];

        // Reset fog if it was changed
        // this.scene.fog = null; // Or restore previous fog setting if needed

// Clean up light strip objects
if (this.lightStrips) {
    this.lightStrips.forEach(strip => {
        if (strip.parent) {
            strip.parent.remove(strip);
        }
        if (strip.geometry) strip.geometry.dispose();
        if (strip.material) strip.material.dispose();
    });
    this.lightStrips = [];
}


        console.log('Real Pac-Man level unloaded.');
    }
}