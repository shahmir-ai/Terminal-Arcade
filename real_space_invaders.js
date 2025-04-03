/**
 * Real Space Invaders Level - Placeholder
 * A simple room serving as a placeholder for the real Space Invaders level.
 * Dynamically loaded when the player enters through Corridor Door 7.
 */

// Define constants for the room dimensions (can be adjusted)
const ROOM_WIDTH = 20;   // Keep original width
const ROOM_DEPTH = 30;   // Make room 1.5x deeper
// Removed global WALL_HEIGHT declaration to avoid conflict. Using literal '8' below.

class RealSpaceInvadersLevel {
    /**
     * Constructor for the placeholder level
     * @param {ArcadeApp} app - Reference to the main app for shared resources
     */
    constructor(app) {
        console.log("Constructing RealSpaceInvadersLevel (Placeholder)...");
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
    this.enemyUpdateInterval = 1000;    // Update enemy movement every 100ms
    this.forwardStep = 0.5;            // Distance enemies move forward when reaching edge
    this.enemyRows = 5;                // Number of rows in enemy grid
    this.enemyCols = 11;               // Number of columns in enemy grid
    this.enemySpacing = 1.5;           // Spacing between enemies
    this.enemyColors = [
        0x00FF00,                     // Green for first 3 rows
        0xFF0000                      // Red for last 2 rows
    ];


        // Bind methods
        this.init = this.init.bind(this);
        this.update = this.update.bind(this);
        this.handleMovement = this.handleMovement.bind(this);
        this.checkCollision = this.checkCollision.bind(this);
        this.createPlaceholderRoom = this.createPlaceholderRoom.bind(this);
        this.setupPlaceholderLighting = this.setupPlaceholderLighting.bind(this);
        this.unload = this.unload.bind(this);
        this.spawnEnemyGrid = this.spawnEnemyGrid.bind(this);
        this.updateEnemyMovement = this.updateEnemyMovement.bind(this);
    

        
    }

    /**
     * Initialize the placeholder level
     */
    init() {
        console.log('Initializing Real Space Invaders level (Placeholder)...');

        // Set up the scene appearance
        this.scene.background = new THREE.Color(0x000000); // Black background
        this.scene.fog = null; // No fog in this simple room

        // Reset camera position and rotation for room start
        this.camera.position.set(0, this.groundLevel, 7); // Start in center
        this.camera.rotation.set(0, 0, 0); // Reset rotation
        this.verticalRotation = 0; // Reset vertical look angle
        this.camera.lookAt(0, this.groundLevel, -1); // Look towards negative Z

        // Create the room environment
        this.createPlaceholderRoom();
        this.setupPlaceholderLighting();

        // Ensure controls are enabled
        if (this.app) {
            this.app.enableControls();
        }

            // Create enemy grid
    this.spawnEnemyGrid();



        console.log('Real Space Invaders level (Placeholder) initialized');
        return this;
    }



/**
 * Spawns a grid of enemy objects in a Space Invaders formation
 * Properly positioned in horizontal rows approaching the player
 */
spawnEnemyGrid() {
    console.log('Spawning enemy grid...');
    this.enemies = []; // Clear existing enemies
    
    // Common materials and geometry for enemies
    const enemyGeometry = new THREE.SphereGeometry(0.4, 12, 12);
    const enemyMaterials = [
        new THREE.MeshStandardMaterial({
            color: this.enemyColors[0],
            emissive: this.enemyColors[0],
            emissiveIntensity: 0.3,
            roughness: 0.4,
            metalness: 0.5
        }),
        new THREE.MeshStandardMaterial({
            color: this.enemyColors[1],
            emissive: this.enemyColors[1],
            emissiveIntensity: 0.3,
            roughness: 0.4,
            metalness: 0.5
        })
    ];
    
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
            // Determine material index (first 3 rows use first color, last 2 use second)
            const materialIndex = row < 3 ? 0 : 1;
            
            // Calculate score based on row (rows further from player = higher score)
            const scoreValue = (this.enemyRows - row) * 10;
            
            // Calculate position:
            // X: Spread horizontally (left to right)
            // Y: All at same height
            // Z: Different rows at different distances from player
            const xPos = gridStartX + (col * this.enemySpacing);
            const yPos = enemyHeight;
            const zPos = gridStartZ + (row * this.enemySpacing); // Each row is closer to player
            
            // Create enemy mesh
            const enemy = new THREE.Mesh(enemyGeometry, enemyMaterials[materialIndex]);
            enemy.position.set(xPos, yPos, zPos);
            this.scene.add(enemy);
            
            // Store enemy data
            this.enemies.push({
                mesh: enemy,
                alive: true,
                scoreValue: scoreValue,
                originalColor: this.enemyColors[materialIndex],
                row: row,
                col: col
            });
        }
    }
    
    console.log(`Spawned ${this.enemies.length} enemies in ${this.enemyRows}×${this.enemyCols} grid`);
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
     * Create the simple placeholder room geometry
     */
    createPlaceholderRoom() {
        console.log('Creating placeholder room geometry...');
        this.roomObjects = []; // Clear previous objects

        const floorMaterial = new THREE.MeshStandardMaterial({
            color: 0x333333, // Dark grey floor
            roughness: 0.9,
            metalness: 0.1
        });
        const wallMaterial = new THREE.MeshStandardMaterial({
            color: 0x555555, // Lighter grey walls
            roughness: 0.8,
            metalness: 0.2
        });
        const ceilingMaterial = new THREE.MeshStandardMaterial({
            color: 0x444444, // Medium grey ceiling
            roughness: 0.9,
            metalness: 0.1
        });

        // Floor
        const floorGeometry = new THREE.PlaneGeometry(ROOM_WIDTH, ROOM_DEPTH);
        const floor = new THREE.Mesh(floorGeometry, floorMaterial);
        floor.rotation.x = -Math.PI / 2;
        floor.position.y = 0; // Floor at y=0
        this.scene.add(floor);
        this.roomObjects.push(floor); // Add for collision checks if needed (though unlikely for floor)

        // Ceiling
        const ceilingGeometry = new THREE.PlaneGeometry(ROOM_WIDTH, ROOM_DEPTH);
        const ceiling = new THREE.Mesh(ceilingGeometry, ceilingMaterial);
        ceiling.rotation.x = Math.PI / 2;
        ceiling.position.y = 8; // Use literal value
        this.scene.add(ceiling);
        // No need to add ceiling to roomObjects for collision

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

        console.log('Placeholder room geometry created.');
    }

    /**
     * Set up basic lighting for the placeholder room
     */
    setupPlaceholderLighting() {
        console.log('Setting up placeholder lighting...');
        this.roomLights = []; // Clear previous lights

        // Basic ambient light
        const ambientLight = new THREE.AmbientLight(0x404040, 0.6); // Slightly brighter ambient
        this.scene.add(ambientLight);
        this.roomLights.push(ambientLight);

        // Soft overhead light
        const hemisphereLight = new THREE.HemisphereLight(0xaaaaaa, 0x444444, 0.8);
        hemisphereLight.position.set(0, 8, 0); // Use literal value
        this.scene.add(hemisphereLight);
        this.roomLights.push(hemisphereLight);

        // Optional: A single point light for some directionality
        // const pointLight = new THREE.PointLight(0xffffff, 0.5, 50);
        // pointLight.position.set(0, 8 * 0.8, 0); // Use literal value (in comment)
        // this.scene.add(pointLight);
        // this.roomLights.push(pointLight);

        console.log('Placeholder lighting set up.');
    }

    /**
     * Update loop for the placeholder level
     */
    update() {
        // Handle player movement for this level
        this.handleMovement();

            // Update enemy movement
    this.updateEnemyMovement();


        // No other updates needed for this simple placeholder
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
            console.log('Escape key pressed in placeholder room');
            // Potentially transition back or show a pause menu
        }
    }


    /**
     * Check for collisions with room walls.
     * Copied from real_pacman.js and adapted for roomObjects.
     * @param {THREE.Vector3} potentialPosition - The potential new position of the player camera.
     * @returns {THREE.Vector3} - The adjusted position after collision checks.
     */
    checkCollision(potentialPosition) {
        const adjustedPosition = potentialPosition.clone();
        const playerRadius = 0.5; // Player's approximate horizontal size
        const playerHeight = 8 * 0.9; // Player slightly shorter than wall (Use literal value)

        // Iterate through wall objects for collision detection
        // Note: We use roomObjects which includes walls. Floor/Ceiling collision is handled by gravity/jump logic.
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
                // --- Collision Detected ---
                // Simple push-back adjustment

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

        // Prevent falling through floor (redundant safety net)
        if (adjustedPosition.y < this.groundLevel) {
             adjustedPosition.y = this.groundLevel;
        }

        return adjustedPosition; // Return adjusted position
    }


    /**
     * Clean up resources when unloading the level
     */
    unload() {
        console.log('Unloading Real Space Invaders level (Placeholder)...');

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


        console.log('Real Space Invaders level (Placeholder) unloaded.');
    }
}

// Make the class available globally or ensure the LevelManager can access it
// If using dynamic script loading, the LevelManager might access it via window['RealSpaceInvadersLevel']