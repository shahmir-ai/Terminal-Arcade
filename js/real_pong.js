/**
 * Real Pong Level - First-Person Dodgeball Pong
 * A 3D first-person version of the classic Pong game where the player must dodge the ball.
 * Dynamically loaded when the player enters through Corridor Door 2.
 */

class RealPongLevel {
    /**
     * Constructor for the Real Pong level
     * @param {ArcadeApp} app - Reference to the main app for shared resources
     */
    constructor(app) {
        console.log("Constructing Real Pong level...");
        // Store references to the main app and its components
        this.app = app;
        this.scene = app.scene;
        this.camera = app.camera;
        this.renderer = app.renderer;
        this.listener = app.listener;
        this.sounds = app.sounds;

        // Define room dimensions as instance properties (not global constants)
        this.ROOM_WIDTH = 20;
        this.ROOM_DEPTH = 40;
        this.ROOM_HEIGHT = 10;

        // Level-specific properties
        this.roomObjects = []; // For walls, floor, ceiling
        this.roomLights = [];  // For lights

        // Player properties
        this.moveSpeed = app.moveSpeed; 
        this.jumpHeight = app.jumpHeight;
        this.jumpVelocity = 0;
        this.gravity = app.gravity;
        this.isJumping = false;
        this.groundLevel = 1.5; // Player height in this room
        this.keyStates = app.keyStates; // Share keyStates with app

        // Camera rotation properties
        this.verticalRotation = 0;
        this.maxVerticalRotation = Math.PI / 9;
        this.minVerticalRotation = -Math.PI / 9;

        // Footstep sound properties
        this.lastFootstepTime = 0;
        this.footstepInterval = 450;

        // Paddle properties - MODIFIED: Swapped height/depth for landscape orientation
        this.paddles = {
            front: null,  // Changed from left (now at front wall)
            back: null    // Changed from right (now at back wall)
        };
        this.paddleWidth = 0.5;    // Thickness of paddle
        this.paddleHeight = 3;     // Now the vertical dimension (shorter)
        this.paddleDepth = 6;      // Now the horizontal dimension (wider)

        // Ball properties
        this.ball = null;
        this.ballRadius = 0.6;
        this.ballAttached = true; // Ball starts attached to paddle
        this.attachedToPaddle = 'front'; // Which paddle the ball is attached to (changed from 'left')
        this.ballOffset = this.paddleWidth / 2 + this.ballRadius + 0.1; // Offset from paddle surface

        // Game state properties
        this.gameStarted = false;
        this.countdownTime = 5; // 5 second countdown
        this.countdownStartTime = 0;
        this.countdownElement = null; // DOM element for countdown display

        // Bind methods
        this.init = this.init.bind(this);
        this.update = this.update.bind(this);
        this.handleMovement = this.handleMovement.bind(this);
        this.checkCollision = this.checkCollision.bind(this);
        this.createPongRoom = this.createPongRoom.bind(this);
        this.setupLighting = this.setupLighting.bind(this);
        this.createPaddles = this.createPaddles.bind(this);
        this.createBall = this.createBall.bind(this);
        this.startCountdown = this.startCountdown.bind(this);
        this.updateCountdown = this.updateCountdown.bind(this);
        this.unload = this.unload.bind(this);

// In constructor after other properties
// Ball physics properties
this.ballVelocity = new THREE.Vector3(0, 0, 0);
this.ballSpeed = 0.3; // Initial ball speed
this.ballSpeedMultiplier = 1.15; // Speed increase after threshold
this.hitCount = 0; // Track consecutive hits
this.hitThreshold = 2; // Increase difficulty every 5 hits

// Paddle AI properties  
this.paddleSpeed = 0.35; // How fast paddles can move
this.paddleMissChance = {
    front: 0.02, // 5% chance to miss initially
    back: 0.02
};
this.paddleMissChanceIncrement = 0.02; // 2% more chance to miss per threshold
this.paddleMaxMissChance = 0.2; // Max 20% chance to miss

// Game state
this.isGameOver = false;

    }

    /**
     * Initialize the Pong level
     */
    init() {
        console.log('Initializing Real Pong level...');

        // Set up the scene appearance
        this.scene.background = new THREE.Color(0x000022); // Dark blue background for futuristic feel
        this.scene.fog = null; // No fog in this room

        // Reset camera position and rotation for room start
        this.camera.position.set(0, this.groundLevel, 0); // Start in center of room
        this.camera.rotation.set(0, 0, 0); // Reset rotation
        this.verticalRotation = 0; // Reset vertical look angle
        this.camera.lookAt(0, this.groundLevel, -1); // Look towards one of the paddles

        // Create the game environment
        this.createPongRoom();
        this.setupLighting();
        this.createPaddles();
        this.createBall();

        // Create countdown display
        this.createCountdownDisplay();

        // Start the countdown
        this.startCountdown();

        // Ensure controls are enabled
        if (this.app) {
            this.app.enableControls();
        }

        console.log('Real Pong level initialized');
        return this;
    }

    /**
     * Create the Pong room with futuristic aesthetic
     */
    createPongRoom() {
        console.log('Creating Pong room geometry...');
        this.roomObjects = []; // Clear previous objects

        // Create materials with a futuristic look
        const floorMaterial = new THREE.MeshStandardMaterial({
            color: 0x101020, // Dark blue-gray
            roughness: 0.3,  // Smoother for futuristic feel
            metalness: 0.6   // Somewhat metallic
        });

        const wallMaterial = new THREE.MeshStandardMaterial({
            color: 0x202040, // Slightly lighter blue
            roughness: 0.5,
            metalness: 0.3,
            emissive: 0x000010, // Slight glow
            emissiveIntensity: 0.1
        });

        const ceilingMaterial = new THREE.MeshStandardMaterial({
            color: 0x101020, // Match floor
            roughness: 0.3,
            metalness: 0.6
        });

        // Floor
        const floorGeometry = new THREE.PlaneGeometry(this.ROOM_WIDTH, this.ROOM_DEPTH);
        const floor = new THREE.Mesh(floorGeometry, floorMaterial);
        floor.rotation.x = -Math.PI / 2;
        floor.position.y = 0; // Floor at y=0
        this.scene.add(floor);
        this.roomObjects.push(floor);

        // Ceiling
        const ceilingGeometry = new THREE.PlaneGeometry(this.ROOM_WIDTH, this.ROOM_DEPTH);
        const ceiling = new THREE.Mesh(ceilingGeometry, ceilingMaterial);
        ceiling.rotation.x = Math.PI / 2;
        ceiling.position.y = this.ROOM_HEIGHT;
        this.scene.add(ceiling);
        this.roomObjects.push(ceiling);

        // Walls - using planes for better performance
        // Front Wall (North) - This will have a paddle
        const northWallGeometry = new THREE.PlaneGeometry(this.ROOM_WIDTH, this.ROOM_HEIGHT);
        const northWall = new THREE.Mesh(northWallGeometry, wallMaterial);
        northWall.position.set(0, this.ROOM_HEIGHT/2, -this.ROOM_DEPTH/2);
        this.scene.add(northWall);
        this.roomObjects.push(northWall);

        // Back Wall (South) - This will have a paddle
        const southWallGeometry = new THREE.PlaneGeometry(this.ROOM_WIDTH, this.ROOM_HEIGHT);
        const southWall = new THREE.Mesh(southWallGeometry, wallMaterial);
        southWall.position.set(0, this.ROOM_HEIGHT/2, this.ROOM_DEPTH/2);
        southWall.rotation.y = Math.PI; // Rotate to face inward
        this.scene.add(southWall);
        this.roomObjects.push(southWall);

        // Side Walls (East/West)
        // Left Wall (West)
        const westWallGeometry = new THREE.PlaneGeometry(this.ROOM_DEPTH, this.ROOM_HEIGHT);
        const westWall = new THREE.Mesh(westWallGeometry, wallMaterial);
        westWall.position.set(-this.ROOM_WIDTH/2, this.ROOM_HEIGHT/2, 0);
        westWall.rotation.y = Math.PI/2; // Rotate to face inward
        this.scene.add(westWall);
        this.roomObjects.push(westWall);

        // Right Wall (East)
        const eastWallGeometry = new THREE.PlaneGeometry(this.ROOM_DEPTH, this.ROOM_HEIGHT);
        const eastWall = new THREE.Mesh(eastWallGeometry, wallMaterial);
        eastWall.position.set(this.ROOM_WIDTH/2, this.ROOM_HEIGHT/2, 0);
        eastWall.rotation.y = -Math.PI/2; // Rotate to face inward
        this.scene.add(eastWall);
        this.roomObjects.push(eastWall);

        // Add floor grid for visual reference and depth perception
        const gridSize = this.ROOM_DEPTH;
        const gridDivisions = 40; // More divisions for the longer room
        const gridHelper = new THREE.GridHelper(gridSize, gridDivisions, 0x0088ff, 0x004488);
        gridHelper.position.y = 0.01; // Slightly above floor to avoid z-fighting
        this.scene.add(gridHelper);
        
        // Add center line to mark middle of court
        const centerLineGeometry = new THREE.PlaneGeometry(this.ROOM_WIDTH, 0.1);
        const centerLineMaterial = new THREE.MeshBasicMaterial({ 
            color: 0x0088ff,
            side: THREE.DoubleSide
        });
        const centerLine = new THREE.Mesh(centerLineGeometry, centerLineMaterial);
        centerLine.rotation.x = -Math.PI/2; // Make horizontal
        centerLine.position.y = 0.02; // Just above floor and grid
        this.scene.add(centerLine);


// Add invisible barriers to restrict player movement
// These barriers will keep the player in the center lane of the court
const barrierDepth = 0.2; // Thin invisible barriers
const restrictedZoneStart = this.ROOM_DEPTH / 5; // Distance from center to start restricted zone
const barrierMaterial = new THREE.MeshBasicMaterial({
    color: 0xff0000,
    transparent: true, 
    opacity: 0.1 // Slightly visible for debugging, can set to 0 later
});

// Front barrier
const frontBarrierGeometry = new THREE.BoxGeometry(this.ROOM_WIDTH, this.ROOM_HEIGHT, barrierDepth);
const frontBarrier = new THREE.Mesh(frontBarrierGeometry, barrierMaterial);
frontBarrier.position.set(0, this.ROOM_HEIGHT/2, -restrictedZoneStart);
frontBarrier.userData.isPlayerBarrier = true; // Flag to identify player-only barriers
this.scene.add(frontBarrier);
this.roomObjects.push(frontBarrier);

// Back barrier
const backBarrierGeometry = new THREE.BoxGeometry(this.ROOM_WIDTH, this.ROOM_HEIGHT, barrierDepth);
const backBarrier = new THREE.Mesh(backBarrierGeometry, barrierMaterial);
backBarrier.position.set(0, this.ROOM_HEIGHT/2, restrictedZoneStart);
backBarrier.userData.isPlayerBarrier = true; // Flag to identify player-only barriers
this.scene.add(backBarrier);
this.roomObjects.push(backBarrier);

console.log(`Added invisible movement barriers at z = ±${restrictedZoneStart.toFixed(2)}`);


        console.log(`Added invisible movement barriers at z = ±${restrictedZoneStart.toFixed(2)}`);

        console.log('Pong room geometry created.');
    }



/**
 * Set up lighting for the Pong room with a futuristic feel (optimized for performance)
 */
setupLighting() {
    console.log('Setting up optimized Pong room lighting...');
    this.roomLights = []; // Clear previous lights

    // Stronger ambient light for base illumination
    const ambientLight = new THREE.AmbientLight(0x404080, 0.6); // Brighter blue ambient
    this.scene.add(ambientLight);
    this.roomLights.push(ambientLight);

    // Add directional light instead of multiple point lights
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(0, this.ROOM_HEIGHT - 1, 0);
    directionalLight.target.position.set(0, 0, 0);
    this.scene.add(directionalLight);
    this.scene.add(directionalLight.target);
    this.roomLights.push(directionalLight);
    
    // Create emissive ceiling light fixtures (visual only)
    const numLights = 3; // Reduced from 5 to 3
    const spacing = this.ROOM_DEPTH / (numLights + 1);
    
    for (let i = 1; i <= numLights; i++) {
        // Create physical light fixture with emissive material instead of actual lights
        const lightFixtureGeometry = new THREE.BoxGeometry(this.ROOM_WIDTH - 2, 0.1, 1);
        const lightFixtureMaterial = new THREE.MeshStandardMaterial({
            color: 0xffffff,
            emissive: 0x88aaff,
            emissiveIntensity: 1.0 // Increased emissive to compensate for no point light
        });
        const lightFixture = new THREE.Mesh(lightFixtureGeometry, lightFixtureMaterial);
        lightFixture.position.set(0, this.ROOM_HEIGHT - 0.1, -this.ROOM_DEPTH/2 + i * spacing);
        this.scene.add(lightFixture);
        this.roomObjects.push(lightFixture);
    }

    // Add just two accent lights at each end (reduced from previous)
    const frontAccentLight = new THREE.PointLight(0xff4400, 1, 15); // Reduced range from 30 to 15
    frontAccentLight.position.set(0, this.ROOM_HEIGHT/2, -this.ROOM_DEPTH/2 + 5);
    this.scene.add(frontAccentLight);
    this.roomLights.push(frontAccentLight);
    
    const backAccentLight = new THREE.PointLight(0x0044ff, 1, 15); // Reduced range from 30 to 15
    backAccentLight.position.set(0, this.ROOM_HEIGHT/2, this.ROOM_DEPTH/2 - 5);
    this.scene.add(backAccentLight);
    this.roomLights.push(backAccentLight);

    console.log('Optimized Pong room lighting setup complete.');
}




    /**
     * Create paddles on the front and back walls (north/south)
     * Now with landscape orientation (wider than tall)
     */
    createPaddles() {
        console.log('Creating paddles...');
        
        // Create paddle material - futuristic white with glow
        const paddleMaterial = new THREE.MeshStandardMaterial({
            color: 0xffffff,
            roughness: 0.1,
            metalness: 0.8,
            emissive: 0xffffff,
            emissiveIntensity: 0.2
        });
        
        // Define paddle dimensions - now in landscape orientation
        // Width is thickness, Height is vertical size, Depth is horizontal size
        const paddleGeometry = new THREE.BoxGeometry(
            this.paddleDepth, // Horizontal dimension (wide)
            this.paddleHeight, // Vertical dimension (short)
            this.paddleWidth  // Thickness dimension (thin)
        );
        
        // Calculate paddle positions - centered on front/back walls
        const paddleY = this.paddleHeight / 2; // Positioned at floor level (half height above floor)
        const paddleZ = this.ROOM_DEPTH / 2 - this.paddleWidth / 2; // Flush against wall
        
        // Create front paddle (north wall)
        this.paddles.front = new THREE.Mesh(paddleGeometry, paddleMaterial);
        this.paddles.front.position.set(0, paddleY, -paddleZ);
        this.scene.add(this.paddles.front);
        
        // Create back paddle (south wall)
        this.paddles.back = new THREE.Mesh(paddleGeometry, paddleMaterial);
        this.paddles.back.position.set(0, paddleY, paddleZ);
        // Rotate the back paddle 180 degrees to face inward
        this.paddles.back.rotation.y = Math.PI;
        this.scene.add(this.paddles.back);
                
        // Add a glow effect to the paddles
        const addPaddleGlow = (paddle) => {
            // Create a slightly larger mesh with transparent, emissive material
            const glowGeometry = new THREE.BoxGeometry(
                this.paddleDepth + 0.1, // Horizontal dimension
                this.paddleHeight + 0.1, // Vertical dimension
                this.paddleWidth + 0.1  // Thickness dimension
            );
            const glowMaterial = new THREE.MeshBasicMaterial({
                color: 0x8888ff,
                transparent: true,
                opacity: 0.3
            });
            const glowMesh = new THREE.Mesh(glowGeometry, glowMaterial);
            paddle.add(glowMesh); // Add as child to inherit transforms
        };
        
        // Add glow to both paddles
        addPaddleGlow(this.paddles.front);
        addPaddleGlow(this.paddles.back);
        
        console.log('Paddles created in landscape orientation on front/back walls.');
    }

    /**
     * Create the energy ball
     */
    createBall() {
        console.log('Creating energy ball...');
        
        // Create ball geometry
        const ballGeometry = new THREE.SphereGeometry(this.ballRadius, 32, 32);
        
        // Create energy ball material - bright and glowing
        const ballMaterial = new THREE.MeshStandardMaterial({
            color: 0x00ffff, // Cyan
            roughness: 0.1,
            metalness: 0.9,
            emissive: 0x00ffff,
            emissiveIntensity: 1.0
        });
        
        // Create the ball mesh
        this.ball = new THREE.Mesh(ballGeometry, ballMaterial);
        
        // Attach ball to starting paddle (front)
        this.attachBallToPaddle();
        
        // Add outer glow
        const ballGlowGeometry = new THREE.SphereGeometry(this.ballRadius * 1.3, 32, 32);
        const ballGlowMaterial = new THREE.MeshBasicMaterial({
            color: 0x00ffff,
            transparent: true,
            opacity: 0.3
        });
        const ballGlow = new THREE.Mesh(ballGlowGeometry, ballGlowMaterial);
        this.ball.add(ballGlow);
        
        // Add ball to scene
        this.scene.add(this.ball);
        
        console.log('Energy ball created and attached to starting paddle.');
    }

    /**
     * Attach the ball to the specified paddle
     */
    attachBallToPaddle() {
        if (!this.ball) return;
        
        const targetPaddle = this.paddles[this.attachedToPaddle];
        if (!targetPaddle) return;
        
        // Position based on which paddle the ball is attached to
        if (this.attachedToPaddle === 'front') {
            this.ball.position.set(
                targetPaddle.position.x,
                targetPaddle.position.y,
                targetPaddle.position.z + this.ballOffset
            );
        } else {
            this.ball.position.set(
                targetPaddle.position.x,
                targetPaddle.position.y,
                targetPaddle.position.z - this.ballOffset
            );
        }
    }

    /**
     * Create and display the countdown overlay
     */
    createCountdownDisplay() {
        // Create countdown container
        this.countdownElement = document.createElement('div');
        this.countdownElement.id = 'pong-countdown';
        this.countdownElement.style.position = 'fixed';
        this.countdownElement.style.top = '50%';
        this.countdownElement.style.left = '50%';
        this.countdownElement.style.transform = 'translate(-50%, -50%)';
        this.countdownElement.style.fontSize = '72px';
        this.countdownElement.style.fontFamily = "'Press Start 2P', monospace";
        this.countdownElement.style.color = '#00ffff';
        this.countdownElement.style.textShadow = '0 0 10px #00ffff';
        this.countdownElement.style.zIndex = '1000';
        this.countdownElement.style.textAlign = 'center';
        this.countdownElement.style.transition = 'transform 0.2s, opacity 0.2s';
        
        // Add to document body
        document.body.appendChild(this.countdownElement);
    }

    /**
     * Start the countdown timer
     */
    startCountdown() {
        this.countdownStartTime = Date.now();
        this.gameStarted = false;
        
        // Update countdown initially
        this.updateCountdown();
        
        console.log('Countdown started...');
    }

    /**
     * Update the countdown display
     */
    updateCountdown() {
        if (this.gameStarted) return;
        
        // Calculate remaining time
        const elapsed = (Date.now() - this.countdownStartTime) / 1000;
        const remaining = this.countdownTime - Math.floor(elapsed);
        
        // Update display
        if (this.countdownElement) {
            if (remaining > 0) {
                this.countdownElement.textContent = remaining.toString();
                
                // Pulse animation effect
                this.countdownElement.style.transform = 'translate(-50%, -50%) scale(1.2)';
                setTimeout(() => {
                    if (this.countdownElement) {
                        this.countdownElement.style.transform = 'translate(-50%, -50%) scale(1)';
                    }
                }, 200);
            } else {
                this.countdownElement.textContent = 'AVOID THE BALL';
                this.countdownElement.style.transform = 'translate(-50%, -50%) scale(1.5)';
                this.countdownElement.style.color = '#ff8800';
                this.countdownElement.style.textShadow = '0 0 20px #ff8800';

// Start the game and launch the ball
this.gameStarted = true;
this.ballAttached = false;

// Set initial ball velocity - launch toward back wall
this.ballVelocity.set(
    (Math.random() * 0.3) - 0.15, // Larger random X component (was 0.1)
    0,                            // No vertical movement
    this.ballSpeed                // Initial speed in Z direction
);

// Hide countdown after a delay
setTimeout(() => {
    if (this.countdownElement) {
        this.countdownElement.style.opacity = '0';
        setTimeout(() => {
            if (this.countdownElement && this.countdownElement.parentNode) {
                this.countdownElement.parentNode.removeChild(this.countdownElement);
                this.countdownElement = null;
            }
        }, 500);
    }
}, 800);

console.log('Countdown complete. Ball launched!');            }
        }
    }

    
    update() {
        // Skip updates if game is over
        if (this.isGameOver) return;
        
        // Handle player movement
        this.handleMovement();
        
        // Update countdown if active
        if (!this.gameStarted && this.countdownStartTime > 0) {
            this.updateCountdown();
            return; // Don't process game logic during countdown
        }
        
        // Once the game has started, handle ball and paddle movement
        if (this.gameStarted) {
            // Move the ball according to its velocity
            if (!this.ballAttached && this.ball) {
                // Update ball position
                this.ball.position.add(this.ballVelocity);
                
                // Check for wall collisions (X-axis, side walls)
                if (this.ball.position.x <= -this.ROOM_WIDTH/2 + this.ballRadius || 
                    this.ball.position.x >= this.ROOM_WIDTH/2 - this.ballRadius) {
                    // Reverse X direction (bounce off side wall)
                    this.ballVelocity.x = -this.ballVelocity.x;
                    
                    // Keep ball within bounds
                    if (this.ball.position.x < -this.ROOM_WIDTH/2 + this.ballRadius) {
                        this.ball.position.x = -this.ROOM_WIDTH/2 + this.ballRadius;
                    } else if (this.ball.position.x > this.ROOM_WIDTH/2 - this.ballRadius) {
                        this.ball.position.x = this.ROOM_WIDTH/2 - this.ballRadius;
                    }
                }
                
                // Check for paddle collisions
                this.checkPaddleCollisions();
                
                // Check for player collision
                this.checkPlayerCollision();
            }
            
            // Update paddle AI
            this.updatePaddleAI();
        }
    }
/**
 * Check if the ball has collided with either paddle
 */
checkPaddleCollisions() {
    if (!this.ball) return;
    
    // Front paddle collision - Make collision detection more forgiving
    if (this.paddles.front && 
        this.ball.position.z < this.paddles.front.position.z + this.paddleWidth/2 + this.ballRadius + 0.2 && // More forgiving distance check
        this.ball.position.z > this.paddles.front.position.z - 0.2 && // Make sure ball hasn't gone through paddle
        this.ballVelocity.z < 0 && // Only check when ball is moving toward the paddle
        Math.abs(this.ball.position.x - this.paddles.front.position.x) < this.paddleDepth/2) {
        
        // Should the paddle miss? (AI difficulty)
        // DISABLED FOR FIRST VOLLEY to ensure game always starts properly
        if (this.hitCount > 0 && Math.random() < this.paddleMissChance.front) {
            console.log('Front paddle intentionally missed!');
            return; // Skip collision, ball will go past paddle
        }
        
        // Ball hit the paddle! Reverse Z direction
        this.ballVelocity.z = -this.ballVelocity.z;
        
// Add "english" to the ball based on where it hit the paddle
// This creates a more dynamic bounce angle
const hitPosition = (this.ball.position.x - this.paddles.front.position.x) / (this.paddleDepth/2);
this.ballVelocity.x += hitPosition * 0.1; // Increased from 0.05 to 0.1

// Add random horizontal movement to create more diagonal patterns
const randomFactor = (Math.random() - 0.5) * 0.15; // Random value between -0.075 and 0.075
this.ballVelocity.x += randomFactor;

// Normalize velocity to maintain consistent speed
const currentSpeed = this.ballVelocity.length();
this.ballVelocity.normalize().multiplyScalar(currentSpeed);

console.log(`Added randomization factor: ${randomFactor.toFixed(3)} to X velocity`);        
        // Increment hit counter and check for difficulty increase
        this.hitCount++;
        this.checkDifficultyIncrease();
        
        // Position ball just after the paddle to prevent multiple collisions
        this.ball.position.z = this.paddles.front.position.z + this.paddleWidth/2 + this.ballRadius + 0.01;
        
        console.log(`Ball hit front paddle! Hit count: ${this.hitCount}`);
    }
    
    // Back paddle collision - Similar changes for forgiveness
    else if (this.paddles.back && 
             this.ball.position.z > this.paddles.back.position.z - this.paddleWidth/2 - this.ballRadius - 0.2 &&
             this.ball.position.z < this.paddles.back.position.z + 0.2 &&
             this.ballVelocity.z > 0 && // Only check when ball is moving toward the paddle
             Math.abs(this.ball.position.x - this.paddles.back.position.x) < this.paddleDepth/2) {
        
        // Should the paddle miss? (AI difficulty)
        // DISABLED FOR FIRST VOLLEY to ensure game always starts properly
        if (this.hitCount > 0 && Math.random() < this.paddleMissChance.back) {
            console.log('Back paddle intentionally missed!');
            return; // Skip collision, ball will go past paddle
        }
        
        // Ball hit the paddle! Reverse Z direction
        this.ballVelocity.z = -this.ballVelocity.z;
        
// Add "english" to the ball based on where it hit the paddle
const hitPosition = (this.ball.position.x - this.paddles.back.position.x) / (this.paddleDepth/2);
this.ballVelocity.x += hitPosition * 0.1; // Increased from 0.05 to 0.1

// Add random horizontal movement to create more diagonal patterns
const randomFactor = (Math.random() - 0.5) * 0.15; // Random value between -0.075 and 0.075
this.ballVelocity.x += randomFactor;

// Normalize velocity to maintain consistent speed
const currentSpeed = this.ballVelocity.length();
this.ballVelocity.normalize().multiplyScalar(currentSpeed);

console.log(`Added randomization factor: ${randomFactor.toFixed(3)} to X velocity`);        
        // Increment hit counter and check for difficulty increase
        this.hitCount++;
        this.checkDifficultyIncrease();
        
        // Position ball just before the paddle to prevent multiple collisions
        this.ball.position.z = this.paddles.back.position.z - this.paddleWidth/2 - this.ballRadius - 0.01;
        
        console.log(`Ball hit back paddle! Hit count: ${this.hitCount}`);
    }
    
    // If ball goes past paddles (out of bounds), player wins
    if (this.ball.position.z < -this.ROOM_DEPTH/2) {
        this.triggerGameOver('PADDLE MISSED. YOU WIN!', false); // false = not game over (it's a win)
    } else if (this.ball.position.z > this.ROOM_DEPTH/2) {
        this.triggerGameOver('PADDLE MISSED. YOU WIN!', false); // false = not game over (it's a win)
    }
}

/**
 * Update the AI-controlled paddles to follow the ball
 */
updatePaddleAI() {
    if (!this.ball) return;
    
    // Update front paddle AI
    if (this.paddles.front) {
        // Only move paddle when ball is coming toward it
        if (this.ballVelocity.z < 0) {
            // Calculate target X position (where paddle should move to)
            const targetX = this.ball.position.x;
            
            // Move paddle toward target at paddleSpeed
            const currentX = this.paddles.front.position.x;
            const moveDirection = targetX > currentX ? 1 : -1;
            const moveAmount = Math.min(this.paddleSpeed, Math.abs(targetX - currentX));
            
            // Update paddle position
            this.paddles.front.position.x += moveDirection * moveAmount;
            
            // Keep paddle within bounds of the room
            const maxX = this.ROOM_WIDTH/2 - this.paddleDepth/2;
            if (this.paddles.front.position.x < -maxX) this.paddles.front.position.x = -maxX;
            if (this.paddles.front.position.x > maxX) this.paddles.front.position.x = maxX;
        }
    }
    
    // Update back paddle AI
    if (this.paddles.back) {
        // Only move paddle when ball is coming toward it
        if (this.ballVelocity.z > 0) {
            // Calculate target X position (where paddle should move to)
            const targetX = this.ball.position.x;
            
            // Move paddle toward target at paddleSpeed
            const currentX = this.paddles.back.position.x;
            const moveDirection = targetX > currentX ? 1 : -1;
            const moveAmount = Math.min(this.paddleSpeed, Math.abs(targetX - currentX));
            
            // Update paddle position
            this.paddles.back.position.x += moveDirection * moveAmount;
            
            // Keep paddle within bounds of the room
            const maxX = this.ROOM_WIDTH/2 - this.paddleDepth/2;
            if (this.paddles.back.position.x < -maxX) this.paddles.back.position.x = -maxX;
            if (this.paddles.back.position.x > maxX) this.paddles.back.position.x = maxX;
        }
    }
}


/**
 * Check if the ball has hit the player
 */
checkPlayerCollision() {
    if (!this.ball) return;
    
    // Calculate distance between ball and player (ignore Y axis for better gameplay)
    const playerPos = new THREE.Vector2(this.camera.position.x, this.camera.position.z);
    const ballPos = new THREE.Vector2(this.ball.position.x, this.ball.position.z);
    const distance = playerPos.distanceTo(ballPos);
    
    // If ball is close enough to player, trigger game over
    if (distance < this.ballRadius + 0.5) { // 0.5 is approximate player radius
        this.triggerGameOver('YOU GOT HIT', true); // true = loss
    }
}

/**
 * Increase difficulty based on hit count
 */
checkDifficultyIncrease() {
    // Check if we've reached a hit threshold
    if (this.hitCount % this.hitThreshold === 0) {
        // Increase ball speed
        const speedVector = this.ballVelocity.clone().normalize();
        this.ballSpeed *= this.ballSpeedMultiplier;
        this.ballVelocity.copy(speedVector.multiplyScalar(this.ballSpeed));
        
        // Increase miss chance
        this.paddleMissChance.front = Math.min(
            this.paddleMaxMissChance, 
            this.paddleMissChance.front + this.paddleMissChanceIncrement
        );
        this.paddleMissChance.back = Math.min(
            this.paddleMaxMissChance, 
            this.paddleMissChance.back + this.paddleMissChanceIncrement
        );
        
        console.log(`Difficulty increased! Speed: ${this.ballSpeed.toFixed(2)}, Miss chance: ${(this.paddleMissChance.front * 100).toFixed(0)}%`);
    }
}

/**
 * Handle game over state
 * @param {string} reason - The reason for game end
 * @param {boolean} isLoss - Whether this is a loss (true) or win (false)
 */
triggerGameOver(reason, isLoss = true) {
    if (this.isGameOver) return; // Prevent multiple triggers
    
    this.isGameOver = true;
    console.log(`Game ${isLoss ? 'over' : 'won'}: ${reason}`);
    
    // Show game over message
    if (this.app) {
        this.app.disableControls();
        this.app.showInteractionFeedback(reason, isLoss); // isLoss determines message color
        
        // Play appropriate sound
        if (isLoss) {
            this.app.playSound('gameOver');
        } else {
            // Use a win sound if available, otherwise use interaction sound
            if (this.app.sounds['levelWin']) {
                this.app.playSound('levelWin');
            } else {
                this.app.playSound('interaction');
            }
        }
        
// Return to corridor after delay with game result
setTimeout(() => {
    if (this.app) {
        // Pass game result data to corridor level
        this.app.transitionToLevel('corridor', {
            isRespawn: true,
            gameResult: {
                result: isLoss ? 'loss' : 'win',
                game: 'real_pong',
                doorId: 'corridor-door-2' // This matches the door ID in corridor.js
            }
        });
    }
}, 2000);        
      
    }
}


    /**
     * Handle player movement and camera rotation based on key states
     * Now with jumping re-enabled
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

        // --- Re-enabled Jump Handling ---
        if (this.keyStates['Space'] && !this.isJumping) {
            // Start jump if we're on the ground
            if (Math.abs(this.camera.position.y - this.groundLevel) < 0.1) {
                this.isJumping = true;
                this.jumpVelocity = 0.2; // Initial upward velocity

                if (this.app && typeof this.app.playSound === 'function') {
                    this.app.playSound('jump');
                }
                
                console.log('Jump initiated in Pong level');
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
        if (!this.isJumping && this.camera.position.y < this.groundLevel) {
            this.camera.position.y = this.groundLevel;
        }

        // Handle Escape key (optional for quick exit)
        if (this.keyStates['Escape']) {
            console.log('Escape key pressed in Pong level');
            // Return to corridor if needed
            if (this.app) {
                this.app.transitionToLevel('corridor');
            }
        }
    }

    /**
     * Check for collisions with room walls and paddles
     * @param {THREE.Vector3} potentialPosition - The potential new position
     * @returns {THREE.Vector3} - Adjusted position after collision checks
     */
    checkCollision(potentialPosition) {
        const adjustedPosition = potentialPosition.clone();
        const playerRadius = 0.5; // Player's collision radius
        
        // Room boundary checks
        // X-axis (side walls)
        if (adjustedPosition.x < -this.ROOM_WIDTH/2 + playerRadius) {
            adjustedPosition.x = -this.ROOM_WIDTH/2 + playerRadius;
        } else if (adjustedPosition.x > this.ROOM_WIDTH/2 - playerRadius) {
            adjustedPosition.x = this.ROOM_WIDTH/2 - playerRadius;
        }
        
// Z-axis (front/back walls + barriers)
if (adjustedPosition.z < -this.ROOM_DEPTH/2 + playerRadius) {
    adjustedPosition.z = -this.ROOM_DEPTH/2 + playerRadius;
} else if (adjustedPosition.z > this.ROOM_DEPTH/2 - playerRadius) {
    adjustedPosition.z = this.ROOM_DEPTH/2 - playerRadius;
} 
// Check player barriers (restricted zones)
else if (adjustedPosition.z < -this.ROOM_DEPTH/5 && this.camera.position.z >= -this.ROOM_DEPTH/5) {
    adjustedPosition.z = -this.ROOM_DEPTH/5;
} else if (adjustedPosition.z > this.ROOM_DEPTH/5 && this.camera.position.z <= this.ROOM_DEPTH/5) {
    adjustedPosition.z = this.ROOM_DEPTH/5;
}        
        // Paddle collision checks - updated for front/back paddles
        // Front paddle
        if (this.paddles.front) {
            const frontBounds = new THREE.Box3().setFromObject(this.paddles.front);
            // Expand bounds by player radius
            frontBounds.min.x -= playerRadius;
            frontBounds.max.x += playerRadius;
            frontBounds.min.y -= playerRadius;
            frontBounds.max.y += playerRadius;
            frontBounds.min.z -= playerRadius;
            frontBounds.max.z += playerRadius;
            
            if (frontBounds.containsPoint(adjustedPosition)) {
                // Find closest face to push out from
                const distances = [
                    Math.abs(adjustedPosition.x - frontBounds.min.x), // Distance to left face
                    Math.abs(adjustedPosition.x - frontBounds.max.x), // Distance to right face
                    Math.abs(adjustedPosition.z - frontBounds.max.z)  // Distance to back face (facing player)
                ];
                
                const minDistance = Math.min(...distances);
                const minIndex = distances.indexOf(minDistance);
                
                if (minIndex === 0) {
                    // Push out from left face
                    adjustedPosition.x = frontBounds.min.x - playerRadius;
                } else if (minIndex === 1) {
                    // Push out from right face
                    adjustedPosition.x = frontBounds.max.x + playerRadius;
                } else {
                    // Push out from back face (towards player)
                    adjustedPosition.z = frontBounds.max.z + playerRadius;
                }
            }
        }
        
        // Back paddle
        if (this.paddles.back) {
            const backBounds = new THREE.Box3().setFromObject(this.paddles.back);
            // Expand bounds by player radius
            backBounds.min.x -= playerRadius;
            backBounds.max.x += playerRadius;
            backBounds.min.y -= playerRadius;
            backBounds.max.y += playerRadius;
            backBounds.min.z -= playerRadius;
            backBounds.max.z += playerRadius;
            
            if (backBounds.containsPoint(adjustedPosition)) {
                // Find closest face to push out from
                const distances = [
                    Math.abs(adjustedPosition.x - backBounds.min.x), // Distance to left face
                    Math.abs(adjustedPosition.x - backBounds.max.x), // Distance to right face
                    Math.abs(adjustedPosition.z - backBounds.min.z)  // Distance to front face (facing player)
                ];
                
                const minDistance = Math.min(...distances);
                const minIndex = distances.indexOf(minDistance);
                
                if (minIndex === 0) {
                    // Push out from left face
                    adjustedPosition.x = backBounds.min.x - playerRadius;
                } else if (minIndex === 1) {
                    // Push out from right face
                    adjustedPosition.x = backBounds.max.x + playerRadius;
                } else {
                    // Push out from front face (towards player)
                    adjustedPosition.z = backBounds.min.z - playerRadius;
                }
            }
        }
        
        return adjustedPosition;
    }

    /**
     * Clean up resources when unloading the level
     */
    unload() {
        console.log('Unloading Real Pong level...');

        // Remove DOM elements
        if (this.countdownElement) {
            if (this.countdownElement.parentNode) {
                this.countdownElement.parentNode.removeChild(this.countdownElement);
            }
            this.countdownElement = null;
        }

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

        // Dispose paddles
        disposeObject(this.paddles.front);
        disposeObject(this.paddles.back);
        this.paddles.front = null;
        this.paddles.back = null;

        // Dispose ball
        disposeObject(this.ball);
        this.ball = null;

        // Dispose room objects
        this.roomObjects.forEach(disposeObject);
        this.roomObjects = [];

        // Remove lights
        this.roomLights.forEach(light => {
            if (light.parent) {
                light.parent.remove(light);
            }
        });
        this.roomLights = [];

        console.log('Real Pong level unloaded.');
    }
}

// Make the class available globally for the LevelManager
// Explicitly export to global scope to fix "RealPongLevel is not defined" error
window.RealPongLevel = RealPongLevel;