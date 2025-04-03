/**
 * Real Pong Level - Placeholder
 * A simple room serving as a placeholder for the real Pong level.
 * Dynamically loaded when the player enters through Corridor Door 2.
 */

// Define constants for the room dimensions (can be adjusted)
const ROOM_SIZE = 20;
// Using literal '8' for wall height below to avoid global scope conflicts.

class RealPongLevel {
    /**
     * Constructor for the placeholder level
     * @param {ArcadeApp} app - Reference to the main app for shared resources
     */
    constructor(app) {
        console.log("Constructing RealPongLevel (Placeholder)...");
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

        // Bind methods
        this.init = this.init.bind(this);
        this.update = this.update.bind(this);
        this.handleMovement = this.handleMovement.bind(this);
        this.checkCollision = this.checkCollision.bind(this);
        this.createPlaceholderRoom = this.createPlaceholderRoom.bind(this);
        this.setupPlaceholderLighting = this.setupPlaceholderLighting.bind(this);
        this.unload = this.unload.bind(this);
    }

    /**
     * Initialize the placeholder level
     */
    init() {
        console.log('Initializing Real Pong level (Placeholder)...');

        // Set up the scene appearance
        this.scene.background = new THREE.Color(0x000000); // Black background
        this.scene.fog = null; // No fog in this simple room

        // Reset camera position and rotation for room start
        this.camera.position.set(0, this.groundLevel, 0); // Start in center
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

        console.log('Real Pong level (Placeholder) initialized');
        return this;
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
        const floorGeometry = new THREE.PlaneGeometry(ROOM_SIZE, ROOM_SIZE);
        const floor = new THREE.Mesh(floorGeometry, floorMaterial);
        floor.rotation.x = -Math.PI / 2;
        floor.position.y = 0; // Floor at y=0
        this.scene.add(floor);
        this.roomObjects.push(floor); // Add for collision checks if needed (though unlikely for floor)

        // Ceiling
        const ceilingGeometry = new THREE.PlaneGeometry(ROOM_SIZE, ROOM_SIZE);
        const ceiling = new THREE.Mesh(ceilingGeometry, ceilingMaterial);
        ceiling.rotation.x = Math.PI / 2;
        ceiling.position.y = 8; // Use literal value
        this.scene.add(ceiling);
        // No need to add ceiling to roomObjects for collision

        // Walls
        const wallGeometryPlane = new THREE.PlaneGeometry(ROOM_SIZE, 8); // Use literal value

        // North Wall (z = -ROOM_SIZE / 2)
        const northWall = new THREE.Mesh(wallGeometryPlane, wallMaterial);
        northWall.position.set(0, 8 / 2, -ROOM_SIZE / 2); // Use literal value
        this.scene.add(northWall);
        this.roomObjects.push(northWall);

        // South Wall (z = ROOM_SIZE / 2)
        const southWall = new THREE.Mesh(wallGeometryPlane, wallMaterial);
        southWall.position.set(0, 8 / 2, ROOM_SIZE / 2); // Use literal value
        southWall.rotation.y = Math.PI; // Rotate to face inward
        this.scene.add(southWall);
        this.roomObjects.push(southWall);

        // East Wall (x = ROOM_SIZE / 2)
        const eastWall = new THREE.Mesh(wallGeometryPlane, wallMaterial);
        eastWall.position.set(ROOM_SIZE / 2, 8 / 2, 0); // Use literal value
        eastWall.rotation.y = -Math.PI / 2; // Rotate to face inward
        this.scene.add(eastWall);
        this.roomObjects.push(eastWall);

        // West Wall (x = -ROOM_SIZE / 2)
        const westWall = new THREE.Mesh(wallGeometryPlane, wallMaterial);
        westWall.position.set(-ROOM_SIZE / 2, 8 / 2, 0); // Use literal value
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

        // No other updates needed for this simple placeholder
    }

    /**
     * Handle player movement and camera rotation based on key states.
     * Copied from real_space_invaders.js
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
     * Copied from real_space_invaders.js
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
        console.log('Unloading Real Pong level (Placeholder)...');

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

        console.log('Real Pong level (Placeholder) unloaded.');
    }
}

// Make the class available globally or ensure the LevelManager can access it
// If using dynamic script loading, the LevelManager might access it via window['RealPongLevel']