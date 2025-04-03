/**
 * Real Snake Level - First-Person Apple Collection Game
 * A 3D first-person version where the player competes with an AI snake to collect apples.
 * Dynamically loaded when the player enters through the Snake door in the corridor.
 */

class RealSnakeLevel {
    /**
     * Constructor for the Real Snake level
     * @param {ArcadeApp} app - Reference to the main app for shared resources
     */
    constructor(app) {
        console.log("Constructing Real Snake level...");
        // Store references to the main app and its components
        this.app = app;
        this.scene = app.scene;
        this.camera = app.camera;
        this.renderer = app.renderer;
        this.listener = app.listener;
        this.sounds = app.sounds;

        // Define environment dimensions
        this.GROUND_SIZE = 50; // 50×50 units play area
        this.ROOM_HEIGHT = 15; // Height of the skybox/ceiling

        // Level-specific properties
        this.environmentObjects = []; // For ground, trees, etc.
        this.lights = [];  // For lighting

        // Player properties
        this.moveSpeed = app.moveSpeed; 
        this.jumpHeight = app.jumpHeight;
        this.jumpVelocity = 0;
        this.gravity = app.gravity;
        this.isJumping = false;
        this.groundLevel = 1.5; // Player height
        this.keyStates = app.keyStates; // Share keyStates with app
        this.playerAppleCount = 0; // Number of apples player has eaten
        this.playerRadius = 0.5; // Collision radius for player

        // Camera rotation properties (same as other games)
        this.verticalRotation = 0;
        this.maxVerticalRotation = Math.PI / 9;
        this.minVerticalRotation = -Math.PI / 9;

        // Footstep sound properties
        this.lastFootstepTime = 0;
        this.footstepInterval = 450;

        // Snake properties
        this.snake = null;
        this.snakeSpeed = 0.06; // Units per frame
        this.snakeSegments = []; // Will hold segments if we implement multi-segment snake
        this.snakeRadius = 1.0; // Collision radius for snake
        this.snakeLength = 3.0; // Initial length of snake
        this.snakeHeight = 0.8; // Height of snake off ground

        // Apple properties
        this.apple = null;
        this.appleRadius = 0.5;
        this.appleSpawnMargin = 5; // Margin from edges for apple spawning
        this.minAppleDistance = 10; // Minimum distance from snake when spawning

        // Game state
        this.isGameActive = true;
        this.isGameOver = false;
        this.applesNeededToWin = 5; // Number of apples needed to win

        // Bind methods
        this.init = this.init.bind(this);
        this.update = this.update.bind(this);
        this.handleMovement = this.handleMovement.bind(this);
        this.checkCollision = this.checkCollision.bind(this);
        this.createEnvironment = this.createEnvironment.bind(this);
        this.setupLighting = this.setupLighting.bind(this);
        this.createSnake = this.createSnake.bind(this);
        this.updateSnake = this.updateSnake.bind(this);
        this.spawnApple = this.spawnApple.bind(this);
        this.checkAppleCollision = this.checkAppleCollision.bind(this);
        this.checkPlayerSnakeCollision = this.checkPlayerSnakeCollision.bind(this);
        this.handleGameOver = this.handleGameOver.bind(this);
        this.unload = this.unload.bind(this);
    }

    /**
     * Initialize the Snake level
     */
    init() {
        console.log('Initializing Real Snake level...');

        // Set up the scene appearance for outdoor jungle environment
        this.scene.background = new THREE.Color(0x87CEEB); // Light blue sky
        this.scene.fog = new THREE.FogExp2(0x8a9a5b, 0.01); // Subtle distance fog with jungle haze

        // Reset camera position and rotation for game start
        this.camera.position.set(0, this.groundLevel, 0); // Start in center
        this.camera.rotation.set(0, 0, 0); // Reset rotation
        this.verticalRotation = 0; // Reset vertical look angle
        this.camera.lookAt(0, this.groundLevel, -1); // Look ahead

        // Create the environment, objects, and lighting
        this.createEnvironment();
        this.setupLighting();
        this.createSnake();
        this.spawnApple();

        // Reset game state
        this.playerAppleCount = 0;
        this.isGameActive = true;
        this.isGameOver = false;

        // Ensure controls are enabled
        if (this.app) {
            this.app.enableControls();
        }

        console.log('Real Snake level initialized');
        return this;
    }

    /**
     * Create the jungle environment
     */
    createEnvironment() {
        console.log('Creating jungle environment...');
        this.environmentObjects = []; // Clear previous objects

        // Create ground with grass-like texture
        const groundGeometry = new THREE.PlaneGeometry(this.GROUND_SIZE, this.GROUND_SIZE);
        const groundMaterial = new THREE.MeshStandardMaterial({
            color: 0x4CAF50,  // Green
            roughness: 0.9,   // Rough like grass
            metalness: 0.0    // Non-metallic
        });
        
        const ground = new THREE.Mesh(groundGeometry, groundMaterial);
        ground.rotation.x = -Math.PI / 2; // Make it horizontal
        ground.position.y = 0.001; // At ground level
        this.scene.add(ground);
        this.environmentObjects.push(ground);

        // Add some random low-poly trees for jungle atmosphere
        this.addTrees();

        // Add a skybox/ceiling above the play area
        const skyGeometry = new THREE.BoxGeometry(this.GROUND_SIZE, this.ROOM_HEIGHT, this.GROUND_SIZE);
        const skyMaterial = new THREE.MeshBasicMaterial({
            color: 0x87CEEB, // Sky blue
            side: THREE.BackSide // Render on inside of box
        });
        
        const skybox = new THREE.Mesh(skyGeometry, skyMaterial);
        skybox.position.y = this.ROOM_HEIGHT / 2; // Position skybox half its height above ground
        this.scene.add(skybox);
        this.environmentObjects.push(skybox);

        console.log('Jungle environment created.');
    }

    /**
     * Add simple low-poly trees to the environment
     */
    addTrees() {
        // Create a simple tree model (low-poly cone + cylinder)
        const createTree = (x, z, scale) => {
            const treeGroup = new THREE.Group();
            
            // Tree trunk (cylinder)
            const trunkGeometry = new THREE.CylinderGeometry(0.3 * scale, 0.5 * scale, 2 * scale, 8);
            const trunkMaterial = new THREE.MeshStandardMaterial({
                color: 0x8B4513,  // Brown
                roughness: 0.9
            });
            const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
            trunk.position.set(0, 1 * scale, 0); // Center trunk at origin, half its height above ground
            treeGroup.add(trunk);
            
            // Tree foliage (cone)
            const foliageGeometry = new THREE.ConeGeometry(1.5 * scale, 4 * scale, 8);
            const foliageMaterial = new THREE.MeshStandardMaterial({
                color: 0x2E8B57,  // Dark green
                roughness: 0.8
            });
            const foliage = new THREE.Mesh(foliageGeometry, foliageMaterial);
            foliage.position.set(0, 3 * scale, 0); // Position foliage on top of trunk
            treeGroup.add(foliage);
            
            // Position the entire tree
            treeGroup.position.set(x, 0, z);
            this.scene.add(treeGroup);
            this.environmentObjects.push(treeGroup);
            
            return treeGroup;
        };
        
        // Add trees around the perimeter with random variation
        const treeCount = 40; // Number of trees to create
        const minDistance = 15; // Keep trees away from center play area
        
        for (let i = 0; i < treeCount; i++) {
            // Generate random position on perimeter
            let x, z;
            
            do {
                x = (Math.random() - 0.5) * (this.GROUND_SIZE - 2); // Keep 1 unit from edge
                z = (Math.random() - 0.5) * (this.GROUND_SIZE - 2);
            } while (Math.sqrt(x*x + z*z) < minDistance); // Ensure minimum distance from center
            
            // Random scale variation
            const scale = 0.8 + Math.random() * 0.5; // Between 0.8 and 1.3
            
            // Create tree
            createTree(x, z, scale);
        }
        
        console.log(`Added ${treeCount} trees to jungle environment`);
    }

    /**
     * Set up lighting for the jungle scene
     */
    setupLighting() {
        console.log('Setting up jungle lighting...');
        this.lights = []; // Clear previous lights

        // Ambient light for base illumination (forest canopy effect)
        const ambientLight = new THREE.AmbientLight(0x6b8e23, 0.4); // Olive green tint, soft intensity
        this.scene.add(ambientLight);
        this.lights.push(ambientLight);

        // Directional light for sunlight through trees
        const sunLight = new THREE.DirectionalLight(0xffffcc, 0.8); // Warm sunlight
        sunLight.position.set(10, 30, 10); // Position high and at an angle
        sunLight.castShadow = false; // Disable shadows for performance
        this.scene.add(sunLight);
        this.lights.push(sunLight);

        // Add a subtle hemisphere light for more natural ambient lighting
        const hemiLight = new THREE.HemisphereLight(0xffffcc, 0x4CAF50, 0.3); // Sky/ground colors
        this.scene.add(hemiLight);
        this.lights.push(hemiLight);

        console.log('Jungle lighting setup complete.');
    }

    /**
     * Create the AI snake
     */
    createSnake() {
        console.log('Creating snake...');
        
        // Create snake body (thick cylinder for simplicity)
        const snakeGeometry = new THREE.CylinderGeometry(
            this.snakeRadius,     // Top radius
            this.snakeRadius,     // Bottom radius
            this.snakeLength,     // Height/length
            16,                   // Segments around radius
            1,                    // Height segments
            false                 // Open-ended
        );
        
        // Rotate cylinder to lie flat (along z-axis)
        snakeGeometry.rotateX(Math.PI / 2);
        
        // Create snake material
        const snakeMaterial = new THREE.MeshStandardMaterial({
            color: 0x558B2F,      // Snake green
            roughness: 0.7,
            metalness: 0.2
        });
        
        // Create snake mesh
        this.snake = new THREE.Mesh(snakeGeometry, snakeMaterial);
        
        // Position the snake away from player start position
        this.snake.position.set(-10, this.snakeHeight, -10);
        this.snake.lookAt(0, this.snakeHeight, 0); // Initially look toward center
        
        // Add property to track snake's apple count
        this.snake.appleCount = 0;
        
        // Add to scene
        this.scene.add(this.snake);
        
        console.log('Snake created and positioned.');
    }
    
    /**
     * Update snake movement to follow the current apple
     */
    updateSnake() {
        if (!this.snake || !this.apple || this.isGameOver) return;
        
        // Get direction from snake to apple
        const direction = new THREE.Vector3();
        direction.subVectors(this.apple.position, this.snake.position);
        direction.y = 0; // Keep movement on xz plane (horizontal only)
        
        // If direction is zero (snake at apple position), do nothing
        if (direction.length() === 0) return;
        
        // Normalize direction and scale by snake speed
        direction.normalize();
        direction.multiplyScalar(this.snakeSpeed);
        
        // Get current rotation of snake (in radians)
        const currentRotation = new THREE.Euler().setFromQuaternion(this.snake.quaternion);
        
        // Move the snake
        this.snake.position.add(direction);
        
        // Keep snake at consistent height
        this.snake.position.y = this.snakeHeight;
        
        // Smoothly rotate snake to face direction of movement
        const targetRotation = Math.atan2(direction.x, direction.z);
        
        // Create quaternion for target rotation
        const targetQuaternion = new THREE.Quaternion();
        targetQuaternion.setFromAxisAngle(new THREE.Vector3(0, 1, 0), targetRotation);
        
        // Smoothly interpolate current rotation to target
        this.snake.quaternion.slerp(targetQuaternion, 0.1); // Adjust 0.1 for rotation speed
    }
    
    /**
     * Spawn an apple at a random location
     */
    spawnApple() {
        console.log('Spawning new apple...');
        
        // Remove previous apple if it exists
        if (this.apple) {
            this.scene.remove(this.apple);
            if (this.apple.geometry) this.apple.geometry.dispose();
            if (this.apple.material) this.apple.material.dispose();
        }
        
        // Create apple geometry (sphere)
        const appleGeometry = new THREE.SphereGeometry(this.appleRadius, 16, 16);
        
        // Create apple material (red and slightly glowing)
        const appleMaterial = new THREE.MeshStandardMaterial({
            color: 0xff0000,      // Red
            emissive: 0xff0000,   // Red glow
            emissiveIntensity: 0.3, // Subtle glow
            roughness: 0.5,
            metalness: 0.8        // Slightly shiny
        });
        
        // Create apple mesh
        this.apple = new THREE.Mesh(appleGeometry, appleMaterial);
        
        // Find a valid position for the apple
        let isValidPosition = false;
        let attempts = 0;
        const maxAttempts = 50; // Prevent infinite loop
        
        while (!isValidPosition && attempts < maxAttempts) {
            // Generate random position within play area (with margin)
            const x = (Math.random() - 0.5) * (this.GROUND_SIZE - this.appleSpawnMargin * 2);
            const z = (Math.random() - 0.5) * (this.GROUND_SIZE - this.appleSpawnMargin * 2);
            
            // Check distance from snake
            const distanceToSnake = new THREE.Vector2(x - this.snake.position.x, z - this.snake.position.z).length();
            
            // Check distance from player
            const distanceToPlayer = new THREE.Vector2(x - this.camera.position.x, z - this.camera.position.z).length();
            
            // Position is valid if it's far enough from both snake and player
            if (distanceToSnake > this.minAppleDistance && distanceToPlayer > this.minAppleDistance) {
                isValidPosition = true;
                this.apple.position.set(x, this.appleRadius, z); // Position apple just above ground
            }
            
            attempts++;
        }
        
        // If we couldn't find a valid position, just place it somewhere
        if (!isValidPosition) {
            console.log('Could not find optimal apple position, placing randomly.');
            const x = (Math.random() - 0.5) * (this.GROUND_SIZE - this.appleSpawnMargin * 2);
            const z = (Math.random() - 0.5) * (this.GROUND_SIZE - this.appleSpawnMargin * 2);
            this.apple.position.set(x, this.appleRadius, z);
        }
        
        // Add a simple bobbing animation by adding userData property
        this.apple.userData = { 
            bobOffset: Math.random() * Math.PI * 2, // Random phase offset
            bobHeight: 0.2, // Height of bob
            bobSpeed: 1.5   // Speed of bobbing
        };
        
        // Add to scene
        this.scene.add(this.apple);
        
        console.log(`Apple spawned at position: (${this.apple.position.x.toFixed(2)}, ${this.apple.position.y.toFixed(2)}, ${this.apple.position.z.toFixed(2)})`);
    }
    
    /**
     * Check if player or snake has collided with the apple
     */
    checkAppleCollision() {
        if (!this.apple || this.isGameOver) return;
        
        // Check if player has eaten the apple
        const playerAppleDistance = new THREE.Vector2(
            this.camera.position.x - this.apple.position.x,
            this.camera.position.z - this.apple.position.z
        ).length();
        
        if (playerAppleDistance < this.playerRadius + this.appleRadius) {
            // Player ate the apple!
            console.log('Player ate the apple!');
            this.playerAppleCount++;
            
            // Play sound effect if available
            if (this.app && typeof this.app.playSound === 'function') {
                this.app.playSound('interaction'); // Use interaction sound for now
            }
            
            // Check for win condition
            if (this.playerAppleCount >= this.applesNeededToWin) {
                this.handleGameOver(true, 'YOU WIN! COLLECTED 5 APPLES');
                return;
            }
            
            // Spawn a new apple
            this.spawnApple();
            
            // Show feedback message
            if (this.app) {
                const remaining = this.applesNeededToWin - this.playerAppleCount;
                this.app.showInteractionFeedback(`You need ${remaining} more apples.`);
            }
            
            return;
        }
        
        // Check if snake has eaten the apple
        const snakeAppleDistance = new THREE.Vector2(
            this.snake.position.x - this.apple.position.x,
            this.snake.position.z - this.apple.position.z
        ).length();
        
        if (snakeAppleDistance < this.snakeRadius + this.appleRadius) {
            // Snake ate the apple!
            console.log('Snake ate the apple!');
            this.snake.appleCount++;
            
            // Check for lose condition
            if (this.snake.appleCount >= this.applesNeededToWin) {
                this.handleGameOver(false, 'GAME OVER! SNAKE GOT 5 APPLES');
                return;
            }
            
            // Spawn a new apple
            this.spawnApple();
            
            // Show feedback message
            if (this.app) {
                const snakeNeeds = this.applesNeededToWin - this.snake.appleCount;
                this.app.showInteractionFeedback(`Snake needs ${snakeNeeds} more apples.`);
            }
        }
    }
    
    /**
     * Check if player has collided with the snake
     */
    checkPlayerSnakeCollision() {
        if (!this.snake || this.isGameOver) return;
        
        // Calculate distance between player and snake (using closest point of snake)
        const playerPos = new THREE.Vector3(this.camera.position.x, 0, this.camera.position.z);
        const snakePos = new THREE.Vector3(this.snake.position.x, 0, this.snake.position.z);
        
        // Project player position onto snake's axis
        // This is a simplification - for a more accurate collision we'd need to calculate
        // the minimum distance from the player to the snake's line segment
        const snakeDirection = new THREE.Vector3(0, 0, 1).applyQuaternion(this.snake.quaternion);
        const snakeStart = snakePos.clone().sub(snakeDirection.clone().multiplyScalar(this.snakeLength / 2));
        const snakeEnd = snakePos.clone().add(snakeDirection.clone().multiplyScalar(this.snakeLength / 2));
        
        const snakeLength = snakeEnd.clone().sub(snakeStart).length();
        const t = Math.max(0, Math.min(1, playerPos.clone().sub(snakeStart).dot(snakeEnd.clone().sub(snakeStart)) / snakeLength / snakeLength));
        const closestPoint = snakeStart.clone().add(snakeEnd.clone().sub(snakeStart).multiplyScalar(t));
        
        const distance = playerPos.distanceTo(closestPoint);
        
        // If player is too close to the snake, game over
        if (distance < this.playerRadius + this.snakeRadius) {
            // Player collided with snake!
            this.handleGameOver(false, 'GAME OVER! YOU TOUCHED THE SNAKE');
        }
    }
    
    /**
     * Handle game over (win or lose)
     * @param {boolean} isWin - Whether the player won
     * @param {string} message - Message to display
     */
    handleGameOver(isWin, message) {
        if (this.isGameOver) return; // Prevent multiple triggers
        
        this.isGameOver = true;
        console.log(`Game over! ${isWin ? 'Player won!' : 'Player lost!'}`);
        
        // Disable game controls
        this.isGameActive = false;
        
        // Show game over message
        if (this.app) {
            this.app.disableControls();
            this.app.showInteractionFeedback(message, !isWin); // Red for loss, green for win
            
            // Play appropriate sound
            if (isWin) {
                // Play win sound if available
                if (this.app.sounds['levelWin']) {
                    this.app.playSound('levelWin');
                } else {
                    this.app.playSound('interaction');
                }
            } else {
                // Play game over sound
                this.app.playSound('gameOver');
            }
            
// Return to corridor after delay with game result
setTimeout(() => {
    if (this.app) {
        // Pass game result data to corridor level
        this.app.transitionToLevel('corridor', {
            isRespawn: true,
            gameResult: {
                result: isWin ? 'win' : 'loss',
                game: 'real_snake',
                doorId: 'corridor-door-10' // This matches the door ID in corridor.js
            }
        });
    }
}, 2500);        }
    }

    /**
     * Update loop for the Snake level
     */
    update() {
        // Skip updates if game is not active
        if (!this.isGameActive) return;
        
        // Handle player movement
        this.handleMovement();
        
        // Update snake AI movement
        this.updateSnake();
        
        // Check for apple collision
        this.checkAppleCollision();
        
        // Check for player-snake collision
        this.checkPlayerSnakeCollision();
        
        // Animate apple bobbing
        if (this.apple && this.apple.userData) {
            const time = performance.now() / 1000; // Convert to seconds
            const bobOffset = this.apple.userData.bobOffset;
            const bobHeight = this.apple.userData.bobHeight;
            const bobSpeed = this.apple.userData.bobSpeed;
            
            // Calculate new Y position with smooth sine wave
            const bobPosition = this.appleRadius + Math.sin((time * bobSpeed) + bobOffset) * bobHeight;
            this.apple.position.y = bobPosition;
        }
    }

    /**
     * Handle player movement and camera rotation based on key states
     * Almost identical to other games, but with boundary checks specific to this level
     */
    handleMovement() {
        // Don't process movement if controls are disabled
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
            pitch = Math.min(pitch + lookSpeed, maxLookDown); // Positive pitch looks down
        } else if (this.keyStates['ArrowDown']) {
            pitch = Math.max(pitch - lookSpeed, -maxLookUp); // Negative pitch looks up
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

        // Apply jumping physics
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
        
        // Ensure player stays on ground level if not jumping
        if (!this.isJumping && this.camera.position.y < this.groundLevel) {
            this.camera.position.y = this.groundLevel;
        }

        // Handle Escape key
        if (this.keyStates['Escape']) {
            console.log('Escape key pressed in Snake level');
            // Return to corridor
            if (this.app) {
                this.app.transitionToLevel('corridor');
            }
        }
    }

    /**
     * Check for collisions with level boundaries
     * @param {THREE.Vector3} potentialPosition - The potential new position
     * @returns {THREE.Vector3} - Adjusted position after collision checks
     */
    checkCollision(potentialPosition) {
        const adjustedPosition = potentialPosition.clone();
        const playerRadius = this.playerRadius;
        
        // Keep player within ground boundaries
        const halfSize = this.GROUND_SIZE / 2;
        
        // X-axis boundary
        if (adjustedPosition.x < -halfSize + playerRadius) {
            adjustedPosition.x = -halfSize + playerRadius;
        } else if (adjustedPosition.x > halfSize - playerRadius) {
            adjustedPosition.x = halfSize - playerRadius;
        }
        
        // Z-axis boundary
        if (adjustedPosition.z < -halfSize + playerRadius) {
            adjustedPosition.z = -halfSize + playerRadius;
        } else if (adjustedPosition.z > halfSize - playerRadius) {
            adjustedPosition.z = halfSize - playerRadius;
        }
        
        return adjustedPosition;
    }

    /**
     * Clean up resources when unloading the level
     */
    unload() {
        console.log('Unloading Real Snake level...');

        // Remove game objects
        const disposeObject = (obj) => {
            if (!obj) return;
            
            if (obj.parent) {
                obj.parent.remove(obj);
            }
            
            if (obj.geometry) {
                obj.geometry.dispose();
            }
            
            if (obj.material) {
                if (Array.isArray(obj.material)) {
                    obj.material.forEach(material => {
                        if (material.map) material.map.dispose();
                        material.dispose();
                    });
                } else {
                    if (obj.material.map) obj.material.map.dispose();
                    obj.material.dispose();
                }
            }
        };

        // Clean up snake
        disposeObject(this.snake);
        this.snake = null;

        // Clean up apple
        disposeObject(this.apple);
        this.apple = null;

        // Clean up environment objects
        this.environmentObjects.forEach(disposeObject);
        this.environmentObjects = [];

        // Remove lights
        this.lights.forEach(light => {
            if (light.parent) {
                light.parent.remove(light);
            }
        });
        this.lights = [];

        console.log('Real Snake level unloaded.');
    }
}

// Make the class available globally for the LevelManager
window.RealSnakeLevel = RealSnakeLevel;