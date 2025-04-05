/**
 * Corridor Level - A separate level accessed via the elevator
 * This file is dynamically loaded only when needed to improve initial load performance
 */
class CorridorLevel {
    /**
     * Constructor for the corridor level
     * @param {ArcadeApp} app - Reference to the main app for shared resources
     */
    constructor(app) {
        // Store references to the main app and its components
        this.app = app;
        this.scene = app.scene;
        this.camera = app.camera;
        this.renderer = app.renderer;
        this.listener = app.listener;
        this.sounds = app.sounds;
        
        // Corridor-specific properties
        this.corridorObjects = [];
        this.corridorLights = [];
        this.doorways = [];
        
        // Player properties (copied from main app)
        this.moveSpeed = app.moveSpeed;
        this.jumpHeight = app.jumpHeight;
        this.jumpVelocity = 0;
        this.gravity = app.gravity;
        this.isJumping = false;
        this.groundLevel = 4; // Same as arcade room
        this.keyStates = app.keyStates;
        
        // Camera rotation properties
        this.verticalRotation = 0; // Current vertical rotation
        this.maxVerticalRotation = Math.PI / 9; // Limit how far up (30 degrees)
        this.minVerticalRotation = -Math.PI / 9; // Limit how far down (-30 degrees)
        
        // Atmospheric effects properties
        this.flickerLights = true; // Enable light flickering for atmosphere
        this.flickerIntensities = {}; // Store original intensities for flickering
        this.lastFlickerTime = 0; // Track time for flickering effect
        this.flickerInterval = 200; // Milliseconds between flicker updates
        
        // Footstep sound properties

        this.lastFootstepTime = 0;     // Tracks when the last footstep sound played

        this.footstepInterval = 450;   // Milliseconds between footstep sounds


// Font for labels
this.labelFont = null;

// Bind methods to this context
this.handleMovement = this.handleMovement.bind(this);
this.checkCollision = this.checkCollision.bind(this);
this.update = this.update.bind(this);
this.onKeyDown = this.onKeyDown.bind(this);
this.updateFogEffect = this.updateFogEffect.bind(this);
this.updateLightFlicker = this.updateLightFlicker.bind(this);
this.createTextLabel = this.createTextLabel.bind(this);
this.loadLabelFont = this.loadLabelFont.bind(this); // Bind font loading method
        this.createTextLabel = this.createTextLabel.bind(this); // Bind new method

        // Narrator message properties
        this.narratorMessageQueue = [];
        this.currentNarratorMessage = null;
        this.isShowingNarratorMessage = false;
        this.narratorMessageElement = null;
        this.narratorMessageTimeout = null;
        this.letterTypingInterval = null;
        this.narratorInitiated = false;

        // UI tracking properties
        this.uiElementsCreated = false;
        this.livesDisplay = null;
        this.winCountDisplay = null;
        this.playerLives = 4;
        this.playerWins = 0;
        this.requiredWins = 3;

        // Game state tracking
        this.completedDoors = {};

// Game progress tracking
this.doorGameStates = {
    // Track which corridor door games have been completed and their result
    'corridor-door-1': { playable: false }, // Not a game door
    'corridor-door-2': { playable: true, played: false, result: null },
    'corridor-door-3': { playable: true, played: false, result: null }, // Asteroids door
    'corridor-door-4': { playable: false },  // Not a game door
    'corridor-door-6': { playable: true, played: false, result: null }, // Pac Man
    'corridor-door-7': { playable: true, played: false, result: null }, // Space Invaders
    'corridor-door-9': { playable: true, played: false, result: null }, // Frogger
    'corridor-door-10': { playable: true, played: false, result: null } // Snake
};    }
    
    /**
     * Initialize the corridor level (async because of font loading)
     * @param {Object} options - Options for initialization
     * @param {boolean} options.isRespawn - Whether this is a respawn from a game
     */
    async init(options = {}) { // Add options parameter with default empty object
        console.log('Initializing corridor level...');

        // Load the font needed for labels first
        await this.loadLabelFont();

        // Clear the scene (should already be done by the level manager)
        this.clearScene();
        
        // Set up the scene
        this.scene.background = new THREE.Color(0x000000); // Darker background (pure black)
        
        // Add fog to the scene to limit visibility
        const fogColor = new THREE.Color(0x000000); // Black fog
        const fogNear = 5; // Fog starts at 5 units from camera (for first zone)
        const fogFar = 50; // Fog ends at 50 units from camera (for first zone)
        this.scene.fog = new THREE.Fog(fogColor, fogNear, fogFar);
        console.log('Added fog for three-zone visibility effect');
        
        // Define corridor dimensions
        const corridorLength = 150;
        const thirdLength = corridorLength / 3;
        
        // Determine spawn position based on whether this is a respawn from a game
        if (options.isRespawn) {
            // Respawn in the middle of the third section (near the doors)
            // Position player in the middle of the third section around z=-125
            this.camera.position.set(0, this.groundLevel, -125);
            this.camera.lookAt(0, this.groundLevel, -135); // Look further into the third section
            console.log('Respawning player in the middle of the third section');
        } else {
            // Regular spawn at the corridor entrance
            this.camera.position.set(0, this.groundLevel, -4);
            this.camera.lookAt(0, this.groundLevel, -10);
            console.log('Spawning player at corridor entrance');
        }


   // Handle respawn from game with result
if (options.isRespawn && options.gameResult) {
    console.log(`Respawning from game with result: ${options.gameResult.result} for door ${options.gameResult.doorId}`);
    console.log('Current doorGameStates:', this.doorGameStates);
    
    // Check if doorId exists in doorGameStates
    if (options.gameResult.doorId) {
        if (this.doorGameStates[options.gameResult.doorId]) {
            console.log(`Found door state for ${options.gameResult.doorId}`);
            this.doorGameStates[options.gameResult.doorId].played = true;
            this.doorGameStates[options.gameResult.doorId].result = options.gameResult.result;
       


            // Update UI based on result
            if (options.gameResult.result === 'win') {
                this.playerWins++;
                this.updateWinCountDisplay();
                
                // Store completion using doorId instead of game name
                this.completedDoors[options.gameResult.doorId] = 'win';
                setTimeout(() => {
                    this.app.showInteractionFeedback('GAME COMPLETED!');
                }, 1000);
            }
            
            else if (options.gameResult.result === 'loss') {
    this.playerLives--;
    this.updateLivesDisplay();
    
    // Check if player has run out of lives
    if (this.playerLives <= 0) {
        // Give a moment for the lives display to update before triggering death sequence
        setTimeout(() => {
            this.triggerPermanentGameOver();
        }, 1500);
        return; // Return early to skip the regular feedback
    }
    
    // Add this line to update completedDoors
    this.completedDoors[options.gameResult.doorId] = 'loss';
    setTimeout(() => {
        this.app.showInteractionFeedback('GAME OVER!', true);
    }, 1000);
}

        } else {
            console.error(`Door state not found for ${options.gameResult.doorId}`);
            
            // Fallback - update UI directly
            if (options.gameResult.result === 'win') {
                this.playerWins++;
                this.updateWinCountDisplay();
                setTimeout(() => {
                    this.app.showInteractionFeedback('GAME COMPLETED!');
                }, 1000);
            } else if (options.gameResult.result === 'loss') {
                this.playerLives--;
                this.updateLivesDisplay();
                setTimeout(() => {
                    this.app.showInteractionFeedback('GAME OVER!', true);
                }, 1000);
            }
        }
    }
}






        // Create the corridor environment
        this.createCorridor();
        this.setupLighting();
        this.createDoorways();
        this.createElevator(); // Add elevator to the south wall
        
        // Add event listener for key presses
        window.addEventListener('keydown', this.onKeyDown);
        
        // Make sure controls are enabled
        if (this.app) {
            this.app.enableControls();
        }
        
        console.log('Corridor level initialized');
        
        // Set up narrator messages with a slight delay after initialization
        // Only show if this is the first time the player has entered the corridor
        // AND it's not a respawn
        setTimeout(() => {
            // Only trigger the sequence if the player hasn't seen it before and this isn't a respawn
            if (!this.app.corridorNarratorShown && !options.isRespawn) {
                this.initiateNarratorSequence();
            }
        }, 500); // Start 0.5 seconds after entering corridor
        
        // Return a reference to this level
        return this;
    }

   /**
    * Load the font for door labels
    */
   async loadLabelFont() {
       return new Promise((resolve, reject) => {
           if (this.labelFont) {
               console.log('Label font already loaded.');
               resolve(this.labelFont);
               return;
           }
           console.log('Loading label font (hallway.typeface.json)...');
           const loader = new THREE.FontLoader();
           loader.load(
               'assets/fonts/hallway.typeface.json',
               (font) => {
                   console.log('Label font loaded successfully.');
                   this.labelFont = font;
                   resolve(font);
               },
               undefined, // Progress callback (optional)
               (error) => {
                   console.error('Error loading label font:', error);
                   reject(error);
               }
           );
       });
   }




/**
 * Trigger permanent game over when all lives are lost
 */
triggerPermanentGameOver() {
    console.log('Triggering permanent game over - all lives lost');
    
    // Disable all controls permanently
    this.app.disableControls();
    
    // Create overlay for the fade effect
    const overlay = document.createElement('div');
    overlay.style.position = 'fixed';
    overlay.style.top = '0';
    overlay.style.left = '0';
    overlay.style.width = '100%';
    overlay.style.height = '100%';
    overlay.style.backgroundColor = 'rgba(0, 0, 0, 0)';
    overlay.style.transition = 'background-color 2s ease-in-out';
    overlay.style.zIndex = '2000';
    overlay.style.display = 'flex';
    overlay.style.flexDirection = 'column'; // Allow stacking multiple messages
    overlay.style.justifyContent = 'center';
    overlay.style.alignItems = 'center';
    document.body.appendChild(overlay);
    
    // Create first message element
    const message = document.createElement('div');
    message.style.color = '#FF0000'; // Red text
    message.style.fontFamily = "'Press Start 2P', monospace";
    message.style.fontSize = '36px'; // Larger than the Asteroids message
    message.style.opacity = '0';
    message.style.transition = 'opacity 1s ease-in-out';
    message.textContent = "YOU DIED";
    overlay.appendChild(message);
    
    // Create second message element (added later)
    const secondMessage = document.createElement('div');
    secondMessage.style.color = '#FF0000'; // Red text
    secondMessage.style.fontFamily = "'Press Start 2P', monospace";
    secondMessage.style.fontSize = '24px';
    secondMessage.style.marginTop = '40px';
    secondMessage.style.opacity = '0';
    secondMessage.style.transition = 'opacity 1s ease-in-out';
    secondMessage.textContent = "GAME OVER. GO DO SOMETHING ELSE NOW.";
    overlay.appendChild(secondMessage);
    
    // Remove any existing UI elements and interaction feedback
    this.removeUIElements();
    const existingFeedback = document.getElementById('interaction-feedback');
    if (existingFeedback) {
        existingFeedback.style.display = 'none';
    }
    
    // Play game over sound
    if (this.app && typeof this.app.playSound === 'function') {
        setTimeout(() => {
            this.app.playSound('gameOver');
        }, 1000);
    }
    
    // Fade to black
    setTimeout(() => {
        overlay.style.backgroundColor = 'rgba(0, 0, 0, 1)';
        
        // Show first message after fade completes
        setTimeout(() => {
            message.style.opacity = '1';
            
            // Show second message after 10 seconds
            setTimeout(() => {
                secondMessage.style.opacity = '1';
            }, 10000);
            
        }, 2000);
    }, 100);
    
    // Override keyboard handlers to prevent any key input from working
    const blockAllKeys = (event) => {
        event.preventDefault();
        event.stopPropagation();
    };
    
    // Add keydown listener to capture all keys
    window.addEventListener('keydown', blockAllKeys, true);
    
    // Also disable mouse clicks
    window.addEventListener('click', blockAllKeys, true);
    
    console.log('Game permanently over. All inputs disabled.');
}

/**
 * Trigger victory sequence when all games are won
 */
triggerVictorySequence() {
    console.log('Triggering victory sequence - all games completed');
    
    // Disable controls during the sequence
    this.app.disableControls();
    
    // Create overlay for the fade effect
    const overlay = document.createElement('div');
    overlay.style.position = 'fixed';
    overlay.style.top = '0';
    overlay.style.left = '0';
    overlay.style.width = '100%';
    overlay.style.height = '100%';
    overlay.style.backgroundColor = 'rgba(0, 0, 0, 0)';
    overlay.style.transition = 'background-color 2s ease-in-out';
    overlay.style.zIndex = '2000';
    overlay.style.display = 'flex';
    overlay.style.flexDirection = 'column'; // Allow stacking multiple messages
    overlay.style.justifyContent = 'center';
    overlay.style.alignItems = 'center';
    document.body.appendChild(overlay);
    
    // Create first message element
    const message = document.createElement('div');
    message.style.color = '#00FF00'; // Green text
    message.style.fontFamily = "'Press Start 2P', monospace";
    message.style.fontSize = '36px';
    message.style.opacity = '0';
    message.style.transition = 'opacity 1s ease-in-out';
    message.textContent = "YOU SURVIVED";
    overlay.appendChild(message);
    
    // Create second message element (added later)
    const secondMessage = document.createElement('div');
    secondMessage.style.color = '#00FF00'; // Green text
    secondMessage.style.fontFamily = "'Press Start 2P', monospace";
    secondMessage.style.fontSize = '24px';
    secondMessage.style.marginTop = '40px';
    secondMessage.style.opacity = '0';
    secondMessage.style.transition = 'opacity 1s ease-in-out';
    secondMessage.textContent = "YOU GOT SO FAR. BUT IN THE END...";
    overlay.appendChild(secondMessage);
    
    // Create third message element (added even later)
    const thirdMessage = document.createElement('div');
    thirdMessage.style.color = '#00FF00'; // Green text
    thirdMessage.style.fontFamily = "'Press Start 2P', monospace";
    thirdMessage.style.fontSize = '24px';
    thirdMessage.style.marginTop = '20px';
    thirdMessage.style.opacity = '0';
    thirdMessage.style.transition = 'opacity 1s ease-in-out';
    thirdMessage.textContent = "DOES IT EVEN MATTER???";
    overlay.appendChild(thirdMessage);
    
    // Remove UI elements and interaction feedback
    this.removeUIElements();
    const existingFeedback = document.getElementById('interaction-feedback');
    if (existingFeedback) {
        existingFeedback.style.display = 'none';
    }
    
    // Play victory sound if available
    if (this.app && typeof this.app.playSound === 'function') {
        setTimeout(() => {
            if (this.app.sounds['levelWin']) {
                this.app.playSound('levelWin');
            } else {
                this.app.playSound('interaction');
            }
        }, 1000);
    }
    
    // Fade to black
    setTimeout(() => {
        overlay.style.backgroundColor = 'rgba(0, 0, 0, 1)';
        
        // Show first message after fade completes
        setTimeout(() => {
            message.style.opacity = '1';
            
            // Show second message after 3 seconds
            setTimeout(() => {
                secondMessage.style.opacity = '1';
                
                // Show third message after another 3 seconds
                setTimeout(() => {
                    thirdMessage.style.opacity = '1';
                    
                    // Wait 5 more seconds then start transition back to arcade
                    setTimeout(() => {
                        // Start fade out
                        message.style.opacity = '0';
                        secondMessage.style.opacity = '0';
                        thirdMessage.style.opacity = '0';
                        
                        // Fade back from black
                        setTimeout(() => {
                            overlay.style.backgroundColor = 'rgba(0, 0, 0, 0)';
                            
                           // Remove overlay and redirect to arcade website
setTimeout(() => {
    if (overlay.parentNode) {
        document.body.removeChild(overlay);
    }
    
    // Redirect to arcade.shahmir.ca
    window.location.href = "https://arcade.shahmir.ca";
    
    console.log("Redirecting to arcade.shahmir.ca");
}, 2000);
                        }, 1000);
                    }, 5000);
                }, 3000);
            }, 3000);
        }, 2000);
    }, 100);
    
    console.log('Victory sequence initiated. Will return to arcade afterwards.');
}

    /**
     * Clear the scene of all objects
     */
    clearScene() {
        // Remove all objects from the scene except the camera
        const objectsToRemove = [];
        this.scene.traverse(object => {
            // Don't remove the camera
            if (object !== this.camera) {
                objectsToRemove.push(object);
            }
        });
        
        // Remove objects and dispose of resources
        objectsToRemove.forEach(object => {
            if (object.parent) {
                object.parent.remove(object);
            }
            
            // Dispose of geometries and materials
            if (object.geometry) {
                object.geometry.dispose();
            }
            
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
        
        console.log(`Cleared ${objectsToRemove.length} objects from the scene`);
    }
    
    /**
     * Create the corridor geometry
     */
    createCorridor() {
        console.log('Initiating corridor geometry creation with textures...');

        // --- Loading Manager ---
        const loadingManager = new THREE.LoadingManager();
        
        // --- Corridor Dimensions (defined early, needed in onLoad) ---
        const corridorWidth = 6;
        const corridorHeight = 8;
        const corridorLength = 150;

        // --- Texture References (defined early, assigned by loader) ---
        let floorTexture, ceilingTexture, wallTexture, southWallTexture; // Added southWallTexture

        // Define what happens AFTER all textures are loaded
        loadingManager.onLoad = () => {
            console.log('All corridor textures loaded successfully. Proceeding with geometry creation...');

            // --- Configure Textures (Now that they are loaded) ---
            // Floor Texture
            floorTexture.wrapS = THREE.RepeatWrapping;
            floorTexture.wrapT = THREE.RepeatWrapping;
            floorTexture.repeat.set(corridorWidth / 2, corridorLength / 1.5);

            // Ceiling Texture
            ceilingTexture.wrapS = THREE.RepeatWrapping;
            ceilingTexture.wrapT = THREE.RepeatWrapping;
            ceilingTexture.repeat.set(corridorWidth / 2, corridorLength / 1.5);

            // Wall Texture Base (Now guaranteed to have image data)
            wallTexture.wrapS = THREE.RepeatWrapping;
            wallTexture.wrapT = THREE.RepeatWrapping;
            // Define base repeat factors
            const wallRepeatLengthFactor = 4;
            const wallRepeatHeightFactor = 8;

            // --- Create Materials (Using loaded textures) ---
            const floorMaterial = new THREE.MeshStandardMaterial({
                map: floorTexture,
                roughness: 0.9,
                metalness: 0.1
            });

            const ceilingMaterial = new THREE.MeshStandardMaterial({
                map: ceilingTexture,
                roughness: 0.9,
                metalness: 0.1
            });

            // Material for Left/Right Walls
            const sideWallTexture = wallTexture.clone();
            sideWallTexture.needsUpdate = true;
            // Ensure wrap modes are set on clone (might inherit, but explicit is safer)
            sideWallTexture.wrapS = THREE.RepeatWrapping;
            sideWallTexture.wrapT = THREE.RepeatWrapping;
            sideWallTexture.repeat.set(corridorLength / wallRepeatLengthFactor, corridorHeight / wallRepeatHeightFactor);
            const sideWallMaterial = new THREE.MeshStandardMaterial({
                map: sideWallTexture,
                roughness: 0.8,
                metalness: 0.2
            });

            // Material for Far End Wall (using general wall texture)
            const farEndWallTexture = wallTexture.clone(); // Renamed from endWallTexture
            farEndWallTexture.needsUpdate = true;
            farEndWallTexture.wrapS = THREE.RepeatWrapping;
            farEndWallTexture.wrapT = THREE.RepeatWrapping;
            farEndWallTexture.repeat.set(corridorWidth / wallRepeatLengthFactor, corridorHeight / wallRepeatHeightFactor);
            const farEndWallMaterial = new THREE.MeshStandardMaterial({ // Renamed from endWallMaterial
                map: farEndWallTexture,
                roughness: 0.8,
                metalness: 0.2
            });

            // Material for South Wall (using specific texture)
            // Ensure southWallTexture is configured (it should be loaded by now)
            southWallTexture.wrapS = THREE.RepeatWrapping;
            southWallTexture.wrapT = THREE.RepeatWrapping;
            southWallTexture.repeat.set(2,3); // Adjust repeat factors for south wall
            const southWallMaterial = new THREE.MeshStandardMaterial({
                map: southWallTexture, // Use the specific south wall texture
                roughness: 0.8, // Keep same material properties for now
                metalness: 0.2
            });

            // --- Create Geometry and Meshes ---
            // Create floor
            const floorGeometry = new THREE.PlaneGeometry(corridorWidth, corridorLength);
            const floor = new THREE.Mesh(floorGeometry, floorMaterial);
            floor.rotation.x = -Math.PI / 2;
            floor.position.set(0, 0, -corridorLength / 2);
            this.scene.add(floor);
            this.corridorObjects.push(floor);
            
            // Create ceiling
            const ceilingGeometry = new THREE.PlaneGeometry(corridorWidth, corridorLength);
            const ceiling = new THREE.Mesh(ceilingGeometry, ceilingMaterial);
            ceiling.rotation.x = Math.PI / 2;
            ceiling.position.set(0, corridorHeight, -corridorLength / 2);
            this.scene.add(ceiling);
            this.corridorObjects.push(ceiling);
            
            // Left wall
            const leftWallGeometry = new THREE.PlaneGeometry(corridorLength, corridorHeight);
            const leftWall = new THREE.Mesh(leftWallGeometry, sideWallMaterial);
            leftWall.rotation.y = Math.PI / 2;
            leftWall.position.set(-corridorWidth / 2, corridorHeight / 2, -corridorLength / 2);
            this.scene.add(leftWall);
            this.corridorObjects.push(leftWall);
            
            // Right wall
            const rightWallGeometry = new THREE.PlaneGeometry(corridorLength, corridorHeight);
            const rightWall = new THREE.Mesh(rightWallGeometry, sideWallMaterial);
            rightWall.rotation.y = -Math.PI / 2;
            rightWall.position.set(corridorWidth / 2, corridorHeight / 2, -corridorLength / 2);
            this.scene.add(rightWall);
            this.corridorObjects.push(rightWall);
            
            // End wall
            const endWallGeometry = new THREE.PlaneGeometry(corridorWidth, corridorHeight);
            const endWall = new THREE.Mesh(endWallGeometry, farEndWallMaterial); // Use farEndWallMaterial
            endWall.position.set(0, corridorHeight / 2, -corridorLength);
            this.scene.add(endWall);
            this.corridorObjects.push(endWall);

            // Create South wall
            const southWallGeometry = new THREE.PlaneGeometry(corridorWidth, corridorHeight);
            const southWall = new THREE.Mesh(southWallGeometry, southWallMaterial); // Use southWallMaterial
            southWall.position.set(0, corridorHeight / 2, 0); // Move wall to z=0
            southWall.rotation.y = Math.PI;
            this.scene.add(southWall);
            this.corridorObjects.push(southWall);
            
            console.log('Corridor geometry and textures successfully created.');

        }; // End of loadingManager.onLoad

        // Define error handling for the manager
        loadingManager.onError = (url) => {
            console.error(`Error loading texture: ${url}`);
            // Potentially add fallback logic here if needed
        };

        // --- Texture Loader (using the manager) ---
        const textureLoader = new THREE.TextureLoader(loadingManager);

        // --- Initiate Texture Loading ---
        // Assign results to the variables declared earlier
        floorTexture = textureLoader.load('assets/textures/c_floor.jpg');
        ceilingTexture = textureLoader.load('assets/textures/c_ceiling.jpg');
        wallTexture = textureLoader.load('assets/textures/c_walls.jpg');
        southWallTexture = textureLoader.load('assets/textures/wall_arcade.jpg'); // Load the south wall texture

        // Note: The actual creation now happens inside loadingManager.onLoad
        console.log('Texture loading initiated. Geometry creation deferred until load completes.');

    } // End of createCorridor method
    
    /**
     * Set up lighting for the corridor with three distinct zones:
     * - First 1/3: Fully lit zone
     * - Middle 1/3: Completely dark zone
     * - Last 1/3: Fully lit zone with flickering lights
     */
    setupLighting() {
        console.log('Setting up corridor lighting with three distinct zones...');
        
        // Add minimal ambient light (very dim to enhance darkness in the middle)
        const ambientLight = new THREE.AmbientLight(0x404040, 0.1);
        this.scene.add(ambientLight);
        this.corridorLights.push(ambientLight);
        
        // Corridor dimensions
        const corridorLength = 150;
        const thirdLength = corridorLength / 3;
        
        // Light fixture material (emissive for glow effect)
        const lightFixtureMaterial = new THREE.MeshStandardMaterial({
            color: 0xFFFFFF,
            emissive: 0xFFFFFF,
            emissiveIntensity: 1.0
        });
        
        // --- FIRST THIRD: FULLY LIT ZONE (0 to -50) ---
        console.log('Setting up first third: fully lit zone (0 to -50)');
        
        const firstZoneLights = 5; // Number of lights in first third
        const firstZoneSpacing = thirdLength / firstZoneLights;
        
        for (let i = 0; i < firstZoneLights; i++) {
            // Create light fixture
            const lightGeometry = new THREE.BoxGeometry(0.5, 0.1, 1.0);
            const lightFixture = new THREE.Mesh(lightGeometry, lightFixtureMaterial);
            
            // Position evenly throughout first third
            const zPos = -firstZoneSpacing * (i + 0.5);
            lightFixture.position.set(0, 7.9, zPos);
            this.scene.add(lightFixture);
            this.corridorObjects.push(lightFixture);
            
            // Add point light with good range to fully illuminate the first third
            const pointLight = new THREE.PointLight(0xFFFFFF, 1, 15);
            pointLight.position.set(0, 7.5, zPos);
            this.scene.add(pointLight);
            this.corridorLights.push(pointLight);
        }
        
        // --- MIDDLE THIRD: COMPLETELY DARK ZONE (-50 to -100) ---
        console.log('Setting up middle third: completely dark zone (-50 to -100)');
        // No lights in the middle third to create complete darkness
        
        // --- LAST THIRD: FULLY LIT ZONE WITH FLICKERING (-100 to -150) ---
        console.log('Setting up last third: fully lit zone with flickering (-100 to -150)');
        
        const lastZoneLights = 5; // Number of lights in last third
        const lastZoneSpacing = thirdLength / lastZoneLights;
        
        for (let i = 0; i < lastZoneLights; i++) {
            // Create light fixture
            const lightGeometry = new THREE.BoxGeometry(0.5, 0.1, 1.0);
            const lightFixture = new THREE.Mesh(lightGeometry, lightFixtureMaterial);
            
            // Position evenly throughout last third
            const zPos = -(2 * thirdLength + lastZoneSpacing * (i + 0.5));
            lightFixture.position.set(0, 7.9, zPos);
            this.scene.add(lightFixture);
            this.corridorObjects.push(lightFixture);
            
            // Add point light with good range to fully illuminate the last third
            // These lights will flicker due to the updateLightFlicker method
            const pointLight = new THREE.PointLight(0xFFFFFF, 1.0, 15);
            pointLight.position.set(0, 7.5, zPos);
            // Tag this light as being in the last zone for selective flickering
            pointLight.userData = { zone: 'last' };
            this.scene.add(pointLight);
            this.corridorLights.push(pointLight);
        }
        
        console.log('Three-zone corridor lighting set up');
    }
    
    /**
     * Create doorways along the corridor for the three-zone approach:
     * - One door in the first lit zone
     * - No doors in the dark middle zone
     * - Three doors in the final lit zone
     */
    createDoorways() {
        console.log('Creating doorways for three-zone corridor...');
        
        // Doorway dimensions
        const doorWidth = 2.6;
        const doorHeight = 6.0;
        const corridorLength = 150;
        const corridorWidth = 6;
        const thirdLength = corridorLength / 3;
        
        // Door depth for 3D effect
        const doorDepth = 0.05;
        
        // Door material with texture
        const textureLoader = new THREE.TextureLoader();
        const doorMaterial = new THREE.MeshStandardMaterial({
            color: 0xFFFFFF, // White base color to show texture properly
            roughness: 0.7,
            metalness: 0.3,
            side: THREE.DoubleSide, // Make texture visible from both sides
            emissive: 0x222222, // Slight emissive to make doors more visible in darkness
            emissiveIntensity: 0.2
        });
        
        // Edge material for the sides of the door
        const edgeMaterial = new THREE.MeshStandardMaterial({
            color: 0xC0C0C0, // Brown color for door edges
            roughness: 0.9,
            metalness: 0.1
        });
        
        // Load and apply the door texture
        textureLoader.load(
            'assets/textures/c_door.jpg',
            (texture) => {
                doorMaterial.map = texture;
                doorMaterial.needsUpdate = true;
            },
            undefined,
            (error) => {
                console.error('Error loading door texture:', error);
            }
        );
        
        // Create materials array for the right wall doors - order: right, left, top, bottom, front, back
        const rightWallDoorMaterials = [
            edgeMaterial,     // right
            edgeMaterial,     // left
            edgeMaterial,     // top
            edgeMaterial,     // bottom
            doorMaterial,     // front (facing into corridor)
            edgeMaterial      // back (facing into wall)
        ];

        // Create materials array for the left wall doors - order: right, left, top, bottom, front, back
        const leftWallDoorMaterials = [
            edgeMaterial,     // right
            edgeMaterial,     // left
            edgeMaterial,     // top
            edgeMaterial,     // bottom
            doorMaterial,     // front (facing into corridor after rotation)
            edgeMaterial      // back (facing into wall)
        ];
        
        
        // 1. Door in the first zone (right wall)
        // For side walls, we need width=doorWidth, height=doorHeight, depth=doorDepth
        const firstDoorGeometry = new THREE.BoxGeometry(doorWidth, doorHeight, doorDepth);
        
        const firstDoor = new THREE.Mesh(firstDoorGeometry, rightWallDoorMaterials);
        
        // Position in the middle of the first third
        const firstDoorZ = -thirdLength / 2;
        
        // For right wall doors, we need to rotate and position correctly
        firstDoor.rotation.y = -Math.PI / 2; // Rotate to face inward (right wall)
        firstDoor.position.set(corridorWidth / 2 - doorDepth / 2, doorHeight / 2, firstDoorZ);
        
        // Add user data for interaction
        firstDoor.userData = {
            isDoor: true,
            doorId: 'corridor-door-1',
            name: 'Corridor Door 1',
            message: 'Open corridor door 1',
            url: 'https://www.youtube.com/watch?v=sJNK4VKeoBM',
            confirmationCounter: 0 // Track number of interaction attempts
        };
        
        this.scene.add(firstDoor);
        this.doorways.push(firstDoor);
        // Add label for Door 1
        this.createTextLabel("LEAVE  NOW", firstDoor.position, firstDoor.rotation.y, doorHeight / 2 + 0.3, 0.1);
        // --- NEW DOORS in Last Third (Before existing Doors 2 & 3) ---

        // New Left Wall Doors (IDs 5, 6, 7)
        const newLeftDoorPositions = [-132.5, -137]; // Removed first element to skip Door 5
        for (let i = 0; i < newLeftDoorPositions.length; i++) {
            const newLeftDoorGeometry = new THREE.BoxGeometry(doorWidth, doorHeight, doorDepth);
            const newLeftDoor = new THREE.Mesh(newLeftDoorGeometry, leftWallDoorMaterials); // Use existing materials
            const zPos = newLeftDoorPositions[i];
            const doorIdNum = 6 + i; // Start IDs from 6

            newLeftDoor.rotation.y = Math.PI / 2; // Rotate to face inward (left wall)
            newLeftDoor.position.set(-corridorWidth / 2 + doorDepth / 2, doorHeight / 2, zPos);

            newLeftDoor.userData = {
                isDoor: true,
                doorId: `corridor-door-${doorIdNum}`,
                name: `Corridor Door ${doorIdNum}`,
                message: `Open corridor door ${doorIdNum}`
            };

            this.scene.add(newLeftDoor);
            this.doorways.push(newLeftDoor);
            // Add labels for Doors 6 & 7
            const labelTextLeft = doorIdNum === 6 ? "PAC MAN" : "SPACE INVADERS";
            this.createTextLabel(labelTextLeft, newLeftDoor.position, newLeftDoor.rotation.y, doorHeight / 2 + 0.3, 0.1); // Use positive offset
        }

        // New Right Wall Doors (IDs 8, 9, 10)
        const newRightDoorPositions = [-132.5, -137]; // Removed first element to skip Door 8
        for (let i = 0; i < newRightDoorPositions.length; i++) {
            const newRightDoorGeometry = new THREE.BoxGeometry(doorWidth, doorHeight, doorDepth);
            const newRightDoor = new THREE.Mesh(newRightDoorGeometry, rightWallDoorMaterials); // Use existing materials
            const zPos = newRightDoorPositions[i];
            const doorIdNum = 9 + i; // Start IDs from 9

            newRightDoor.rotation.y = -Math.PI / 2; // Rotate to face inward (right wall)
            newRightDoor.position.set(corridorWidth / 2 - doorDepth / 2, doorHeight / 2, zPos);

            newRightDoor.userData = {
                isDoor: true,
                doorId: `corridor-door-${doorIdNum}`,
                name: `Corridor Door ${doorIdNum}`,
                message: `Open corridor door ${doorIdNum}`
            };

            this.scene.add(newRightDoor);
            this.doorways.push(newRightDoor);
             // Add labels for Doors 9 & 10
            const labelTextRight = doorIdNum === 9 ? "FROGGER" : "SNAKE";
            this.createTextLabel(labelTextRight, newRightDoor.position, newRightDoor.rotation.y, doorHeight / 2 + 0.3, 0.1);
        }

        // --- End of NEW DOORS ---
        
        
        // 2. Door on left wall in the last zone
        const leftDoorGeometry = new THREE.BoxGeometry(doorWidth, doorHeight, doorDepth);
        
        const leftDoor = new THREE.Mesh(leftDoorGeometry, leftWallDoorMaterials);
        
        // Position in the middle of the last third
        const leftDoorZ = -(2 * thirdLength + 2.5 * thirdLength / 3);
        
        // For left wall doors, we need to rotate and position correctly
        leftDoor.rotation.y = Math.PI / 2; // Rotate to face inward (left wall)
        leftDoor.position.set(-corridorWidth / 2 + doorDepth / 2, doorHeight / 2, leftDoorZ);
        
        // Add user data for interaction
        leftDoor.userData = {
            isDoor: true,
            doorId: 'corridor-door-2',
            name: 'Corridor Door 2',
            message: 'Open corridor door 2'
        };
        
        this.scene.add(leftDoor);
        this.doorways.push(leftDoor);
        // Add label for Door 2
        this.createTextLabel("PONG", leftDoor.position, leftDoor.rotation.y, doorHeight / 2 + 0.3, 0.1); // Use positive offset
        
        // 3. Door on right wall in the last zone
        const rightDoorGeometry = new THREE.BoxGeometry(doorWidth, doorHeight, doorDepth);
        const rightDoor = new THREE.Mesh(rightDoorGeometry, rightWallDoorMaterials);
        
        // Position in the middle of the last third
        const rightDoorZ = -(2 * thirdLength + 2.5 * thirdLength / 3);
        
        // For right wall doors, we need to rotate and position correctly
        rightDoor.rotation.y = -Math.PI / 2; // Rotate to face inward (right wall)
        rightDoor.position.set(corridorWidth / 2 - doorDepth / 2, doorHeight / 2, rightDoorZ);
        
        // Add user data for interaction
        rightDoor.userData = {
            isDoor: true,
            doorId: 'corridor-door-3',
            name: 'Corridor Door 3',
            message: 'Open corridor door 3'
        };
        
        this.scene.add(rightDoor);
        this.doorways.push(rightDoor);
        // Add label for Door 3
        this.createTextLabel("ASTEROIDS", rightDoor.position, rightDoor.rotation.y, doorHeight / 2 + 0.3, 0.1);
        
        // 4. Door at the end wall
        const endDoorGeometry = new THREE.BoxGeometry(doorWidth, doorHeight, doorDepth);
        
        // Create materials array for the box - order: right, left, top, bottom, front, back
        const endWallDoorMaterials = [
            edgeMaterial,     // right
            edgeMaterial,     // left
            edgeMaterial,     // top
            edgeMaterial,     // bottom
            doorMaterial,     // front (facing into corridor)
            edgeMaterial      // back (facing into wall)
        ];
        
        const endDoor = new THREE.Mesh(endDoorGeometry, endWallDoorMaterials);
        
        // Position at the end wall
        endDoor.position.set(0, doorHeight / 2, -corridorLength + doorDepth / 2);
        
        // Add user data for interaction
        endDoor.userData = {
            isDoor: true,
            doorId: 'corridor-door-4',
            name: 'Corridor Door 4',
            message: 'Open corridor door 4'
        };
        
        this.scene.add(endDoor);
        this.doorways.push(endDoor);
        // Add label for Door 4
        this.createTextLabel("???", endDoor.position, endDoor.rotation.y, doorHeight / 2 + 0.3, 0.1);
        
        console.log(`Created ${this.doorways.length} doorways for three-zone corridor`);
    }

    /**
     * Creates a 3D text label above a door.
     * @param {string} text - The text content for the label.
     * @param {THREE.Vector3} position - The base position (usually the door's position).
     * @param {number} rotationY - The Y rotation for the text.
     * @param {number} yOffset - Vertical offset above the door center.
     * @param {number} depthOffset - Offset away from the wall.
     */
    createTextLabel(text, position, rotationY, yOffset = 0.5, depthOffset = 0.1) {
        if (!this.labelFont) { // Check for the locally loaded labelFont
            console.error('Neon font not loaded in app, cannot create text label:', text);
            // Fallback: maybe create simple geometry? Or just skip.
            return;
        }

        const textGeometry = new THREE.TextGeometry(text, {
            font: this.labelFont, // Use the locally loaded labelFont
            size: 0.2,   // Adjust size as needed
            height: 0.001, // Make text flat
            curveSegments: 4, // Lower segments for performance
            bevelEnabled: false
        });

        // Center the geometry
        textGeometry.computeBoundingBox();
        const textWidth = textGeometry.boundingBox.max.x - textGeometry.boundingBox.min.x;
        textGeometry.translate(-textWidth / 2, 0, 0);

        // Simple black material
        const textMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 });

        const textMesh = new THREE.Mesh(textGeometry, textMaterial);

        // Calculate position above the door center
        const labelPosition = position.clone();
        labelPosition.y += yOffset; // Position it above the door's vertical center

        // Apply depth offset based on rotation to push it slightly off the wall
        const offsetVector = new THREE.Vector3(0, 0, depthOffset);
        const rotationQuaternion = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), rotationY);
        offsetVector.applyQuaternion(rotationQuaternion);
        labelPosition.add(offsetVector);


        textMesh.position.copy(labelPosition);
        textMesh.rotation.y = rotationY;

        this.scene.add(textMesh);
        this.corridorObjects.push(textMesh); // Add to objects for potential cleanup
    }

    /**
     * Create an elevator on the south wall
     */
    createElevator() {
        console.log('Creating elevator on south wall...');
        
        // Elevator dimensions - match the original elevator
        const elevatorWidth = 2.8;
        const elevatorHeight = 5.5;
        const elevatorDepth = 0.1;
        const frameThickness = 0.15;
        const frameDepth = 0.2;
        
        // Create elevator door group
        const elevatorGroup = new THREE.Group();
        
        // Position at the center of the south wall (z=0)
        // Position slightly in front of the south wall (z=0)
        const elevatorZOffset = elevatorDepth / 2; // e.g., 0.1 / 2 = 0.05
        elevatorGroup.position.set(0, elevatorHeight/2, elevatorZOffset-0.2);
        
        // Create materials
        const elevatorMaterial = new THREE.MeshStandardMaterial({
            color: 0x888888,      // Light gray
            roughness: 0.7,       // More rough/matte
            metalness: 0.3,       // Less metallic
            envMapIntensity: 0.3  // Less reflective
        });
        
        const frameMaterial = new THREE.MeshStandardMaterial({
            color: 0x666666,      // Darker gray
            roughness: 0.6,       // More rough/matte
            metalness: 0.4,       // Less metallic
            envMapIntensity: 0.4  // Less reflective
        });
        
        // Create left door panel
        const leftDoorGeometry = new THREE.BoxGeometry(elevatorWidth/2 - 0.02, elevatorHeight, elevatorDepth);
        const leftDoor = new THREE.Mesh(leftDoorGeometry, elevatorMaterial);
        leftDoor.position.set(-elevatorWidth/4 - 0.01, 0, 0);
        elevatorGroup.add(leftDoor);
        
        // Create right door panel
        const rightDoorGeometry = new THREE.BoxGeometry(elevatorWidth/2 - 0.02, elevatorHeight, elevatorDepth);
        const rightDoor = new THREE.Mesh(rightDoorGeometry, elevatorMaterial);
        rightDoor.position.set(elevatorWidth/4 + 0.01, 0, 0);
        elevatorGroup.add(rightDoor);
        
        // Create door frame (top, left, right)
        // Top frame
        const topFrameGeometry = new THREE.BoxGeometry(elevatorWidth + frameThickness*2, frameThickness, frameDepth);
        const topFrame = new THREE.Mesh(topFrameGeometry, frameMaterial);
        topFrame.position.set(0, elevatorHeight/2 + frameThickness/2, frameDepth/2 - 0.05);
        elevatorGroup.add(topFrame);
        
        // Left frame
        const leftFrameGeometry = new THREE.BoxGeometry(frameThickness, elevatorHeight, frameDepth);
        const leftFrame = new THREE.Mesh(leftFrameGeometry, frameMaterial);
        leftFrame.position.set(-elevatorWidth/2 - frameThickness/2, 0, frameDepth/2 - 0.05);
        elevatorGroup.add(leftFrame);
        
        // Right frame
        const rightFrameGeometry = new THREE.BoxGeometry(frameThickness, elevatorHeight, frameDepth);
        const rightFrame = new THREE.Mesh(rightFrameGeometry, frameMaterial);
        rightFrame.position.set(elevatorWidth/2 + frameThickness/2, 0, frameDepth/2 - 0.05);
        elevatorGroup.add(rightFrame);
        
        // Add user data for interaction
        elevatorGroup.userData = {
            isElevator: true,
            name: 'Elevator'
        };
        
        // Add elevator group to scene
        this.scene.add(elevatorGroup);
        this.corridorObjects.push(elevatorGroup);
        
        // Create triangle indicator above elevator
        console.log('Creating triangle indicator...');
        
        // Create extruded triangle geometry for 3D effect
        const triangleShape = new THREE.Shape();
        triangleShape.moveTo(0, 0);
        triangleShape.lineTo(0.4, 0);
        triangleShape.lineTo(0.2, 0.35);
        triangleShape.lineTo(0, 0);
        
        const extrudeSettings = {
            steps: 1,
            depth: 0.1,
            bevelEnabled: true,
            bevelThickness: 0.03,
            bevelSize: 0.03,
            bevelSegments: 3
        };
        
        const triangleGeometry = new THREE.ExtrudeGeometry(triangleShape, extrudeSettings);
        
        // Create bright red emissive material
        const triangleMaterial = new THREE.MeshStandardMaterial({
            color: 0x4C4C4C,
            emissive: 0xFF0000,
            emissiveIntensity: 0,
            roughness: 1,
            metalness: 0
        });
        
        // Create the triangle mesh
        const triangle = new THREE.Mesh(triangleGeometry, triangleMaterial);
        
        // Create a group to hold the triangle for easier positioning
        const triangleIndicator = new THREE.Group();
        triangleIndicator.add(triangle);
        
        // Position and rotate the triangle group
        triangleIndicator.position.set(
            0.2,                                // X position (left/right)
            elevatorHeight + frameThickness + 0.8, // Y position (up/down)
            elevatorZOffset                   // Z position (align with elevator group)
        );
        
        // Rotate to face forward and flip upside down (point down)
        triangleIndicator.rotation.x = Math.PI / 9; // Rotate to face forward
        triangleIndicator.rotation.z = Math.PI; // Rotate 180 degrees to flip upside down
        
        // Add the triangle group to the scene
        this.scene.add(triangleIndicator);
        this.corridorObjects.push(triangleIndicator);
        
    }
    
    /**
     * Handle key down events for interactions
     * @param {KeyboardEvent} event - The keyboard event
     */
    onKeyDown(event) {
        // Handle interaction with "E" key
        if (event.code === 'KeyE') {
            console.log('E key pressed in corridor - checking for interaction');
            
            // Play interaction sound
            if (this.app.sounds['interaction']) {
                this.app.sounds['interaction'].play();
            }
            
            // Create a raycaster from the camera
            const raycaster = new THREE.Raycaster();
            
            // Set the raycaster to start at camera position and go in the direction
            // the camera is facing
            const direction = new THREE.Vector3();
            this.camera.getWorldDirection(direction);
            
            // Set raycaster's starting point and direction
            raycaster.set(this.camera.position, direction);
            
            // Maximum distance to check for interactions
            const maxDistance = 5;
            
            // Find all intersections in the scene
            const intersects = raycaster.intersectObjects(this.scene.children, true);
            
            // Check if we hit anything within range
            if (intersects.length > 0 && intersects[0].distance < maxDistance) {
                // Get the first (closest) intersected object
                const intersectedObject = intersects[0].object;
                
                // Start checking parent objects to find one with userData
                let currentObject = intersectedObject;
                let foundInteractive = false;
                
                // Traverse up the parent chain to find interactive objects
                while (currentObject && !foundInteractive) {
                    // Check if this is the elevator
                    if (currentObject.userData && currentObject.userData.isElevator) {
                        console.log('Corridor elevator activated - no going back!');
                        
                        // Stop event propagation to prevent the app.js handler from being called
                        event.stopPropagation();

                        // Show "No going back" message in red (without playing game over sound)
                        this.app.showInteractionFeedback('NO GOING BACK', false);
                        
                        // Prevent default behavior
                        event.preventDefault();
                        
                        foundInteractive = true;
                    }
                    // Check if this is a door
                    else if (currentObject.userData && currentObject.userData.isDoor) {
                        // Store the door ID and game name for clarity
                        const doorId = currentObject.userData.doorId;
                        const gameName = currentObject.userData.gameName || doorId;
                        
                        console.log(`Interacting with door: ${doorId}, Game: ${gameName}`);
                        
                        // Check if this door has already been played
                        if (this.completedDoors[gameName]) {
                            const result = this.completedDoors[gameName];
                            if (result === 'win') {
                                this.app.showInteractionFeedback("YOU WON THIS GAME");
                            } else if (result === 'loss') {
                                this.app.showInteractionFeedback("YOU LOST THIS GAME");
                            }
                            foundInteractive = true;
                            event.preventDefault();
                            event.stopPropagation();
                            return;
                        }
                        
                        // Special handling for Asteroids Door (door-3)
                        if (currentObject.userData.doorId === 'corridor-door-3') {
                            console.log('Interacting with Door 3 (Asteroids Door)');
                            
                            // IMPORTANT: immediately prevent propagation and default behavior
                            event.preventDefault();
                            event.stopPropagation();
                            
                            // Initialize interaction counter if it doesn't exist
                            if (typeof currentObject.userData.asteroidsDoorCounter === 'undefined') {
                                currentObject.userData.asteroidsDoorCounter = 0;
                            }
                            
                            // Increment the interaction counter (use door-specific counter)
                            currentObject.userData.asteroidsDoorCounter++;
                            
                            // Show different messages based on interaction count
                            if (currentObject.userData.asteroidsDoorCounter === 1) {
                                // First interaction - Warning
                                this.app.showInteractionFeedback("WARNING: You will suffocate in outer space.");
                            } 
                            else if (currentObject.userData.asteroidsDoorCounter === 2) {
                                // Second interaction - Stronger warning
                                this.app.showInteractionFeedback("Don't. You will die.");
                            } 
                            else if (currentObject.userData.asteroidsDoorCounter >= 3) {
                                // Third interaction - Show final message BEFORE starting death sequence
                                this.app.showInteractionFeedback("Suit yourself.");
                                
                                // Reset counter for next time
                                currentObject.userData.asteroidsDoorCounter = 0;
                                
                                // Mark this door as completed with loss result
                                this.completedDoors[gameName] = 'loss';
                                
// Add a slight delay to show message before starting death sequence
setTimeout(() => {
    // Start the death sequence
    this.startAsteroidsDoorDeathSequence();
    
    // Reduce player lives
    this.playerLives--;
    this.updateLivesDisplay();
    
    // Check if this was the last life
    if (this.playerLives <= 0) {
        // Wait for death sequence to complete before triggering permanent game over
        setTimeout(() => {
            this.triggerPermanentGameOver();
        }, 10000); // Asteroids sequence takes about 8 seconds
    }
}, 200);                            }

                            foundInteractive = true;
                        } 
                        // Check if it's the specific door for the Pac-Man level
                        else if (currentObject.userData.doorId === 'corridor-door-6') {
                            console.log(`Door 6 activated: Entering Pac-Man level`);
                            
                            // Stop event propagation
                            event.stopPropagation();
                            
                            // Show entry message
                            this.app.showInteractionFeedback("Entering Pac-Man, good luck...");
                            
                            // Transition to the real_pacman level
                            this.app.transitionToLevel('real_pacman');
                            
                            // Prevent default behavior
                            event.preventDefault();
                            
                            foundInteractive = true;
                        } else if (currentObject.userData.doorId === 'corridor-door-1') {
                            // Door 1: Multi-step confirmation before redirecting to Google
                            console.log('Interacting with Door 1 (Redirect)');

                            // Initialize confirmation counter if it doesn't exist
                            if (typeof currentObject.userData.confirmationCounter === 'undefined') {
                                currentObject.userData.confirmationCounter = 0;
                            }
                            
                            // Increment confirmation counter
                            currentObject.userData.confirmationCounter++;
                            
                            // Stop event propagation
                            event.stopPropagation();

                            // Show different messages based on confirmation counter
                            if (currentObject.userData.confirmationCounter === 1) {
                                // First interaction
                                this.app.showInteractionFeedback("Too scared to stay?");
                            } else if (currentObject.userData.confirmationCounter === 2) {
                                // Second interaction
                                this.app.showInteractionFeedback("Are you sure you want to leave?");
                            } else if (currentObject.userData.confirmationCounter >= 3) {
                                // Third interaction - proceed with redirection
                                this.app.showInteractionFeedback("Goodbye!");
                                
                                // Redirect after a delay to show the message
                                setTimeout(() => {
                                    window.location.href = currentObject.userData.url || 'https://www.youtube.com/watch?v=sJNK4VKeoBM';
                                }, 1500);
                            }

                            // Prevent default behavior
                            event.preventDefault();

                            foundInteractive = true;
                        } else if (currentObject.userData.doorId === 'corridor-door-7') {
                            // Door 7: Real Space Invaders (Placeholder)
                            console.log('Interacting with Door 7 (Space Invaders Placeholder)');

                            // Stop event propagation
                            event.stopPropagation();

                            // Show entry message
                            this.app.showInteractionFeedback('Entering Space Invaders, good luck...');

                            // Transition to the real_space_invaders level
                            this.app.transitionToLevel('real_space_invaders');

                            // Prevent default behavior
                            event.preventDefault();

                            foundInteractive = true;
                        } else if (currentObject.userData.doorId === 'corridor-door-2') {
                            // Door 2: Real Pong (Placeholder)
                            console.log('Interacting with Door 2 (Pong Placeholder)');

                            // Stop event propagation
                            event.stopPropagation();

                            // Show entry message
                            this.app.showInteractionFeedback('Entering Pong, good luck...');

                            // Transition to the real_pong level
                            this.app.transitionToLevel('real_pong');

                            // Prevent default behavior
                            event.preventDefault();

                            foundInteractive = true;
                        } else if (currentObject.userData.doorId === 'corridor-door-10') {
                            // Door 10: Real Snake (Placeholder)
                            console.log('Interacting with Door 10 (Snake Placeholder)');

                            // Stop event propagation
                            event.stopPropagation();

                            // Show entry message
                            this.app.showInteractionFeedback('Entering Snake, good luck...');

                            // Transition to the real_snake level
                            this.app.transitionToLevel('real_snake');

                            // Prevent default behavior
                            event.preventDefault();

                            foundInteractive = true;
                        } else if (currentObject.userData.doorId === 'corridor-door-9') {
                            // Door 9: Real Frogger (Placeholder)
                            console.log('Interacting with Door 9 (Frogger Placeholder)');

                            // Stop event propagation
                            event.stopPropagation();

                            // Show entry message
                            this.app.showInteractionFeedback('Entering Frogger, good luck...');

                            // Transition to the real_frogger level
                            this.app.transitionToLevel('real_frogger');

                            // Prevent default behavior
                            event.preventDefault();

                            foundInteractive = true;
                        

                        } else if (currentObject.userData.doorId === 'corridor-door-4') {
                            // Door 4: Final Room - Check if unlocked (player has required wins)
                            console.log('Interacting with Door 4 (Final Room)');
                            
                            // Stop event propagation
                            event.stopPropagation();
                            event.preventDefault();
                            
                            // Check if player has enough wins to enter
                            if (this.playerWins >= this.requiredWins) {
                                // Door is unlocked - trigger victory sequence
                                console.log('Door 4 unlocked - player has required wins');
                                this.app.showInteractionFeedback('ENTERING THE FINAL DOOR...');
                                
                                // Play success sound
                                if (this.app && typeof this.app.playSound === 'function') {
                                    this.app.playSound('interaction');
                                }
                                
                                // Start victory sequence after a short delay
                                setTimeout(() => {
                                    this.triggerVictorySequence();
                                }, 1500);
                            } else {
                                // Door is still locked
                                console.log('Door 4 still locked - player needs more wins');
                                this.app.showInteractionFeedback('YOU MUST SURVIVE THRICE TO ENTER');
                                
                                // Play locked sound
                                if (this.app && typeof this.app.playSound === 'function') {
                                    this.app.playSound('doorLocked');
                                }
                            }
                            
                            foundInteractive = true;
                        }

                         else {
                            // Original logic for other doors
                            console.log(`Door activated: ${currentObject.userData.name}`);
                            
                            // Stop event propagation to prevent the app.js handler from being called
                            event.stopPropagation();
                            
                            // Show custom message for this door
                            const message = currentObject.userData.message || `Interacting with ${currentObject.userData.name}`;
                            this.app.showInteractionFeedback(message, false);
                            
                            // Play door sound if available (using interaction sound for now)
                            if (this.app.sounds['interaction']) {
                                this.app.sounds['interaction'].play();
                            }
                            
                            // Prevent default behavior
                            event.preventDefault();
                            
                            foundInteractive = true;
                        }
                    }
                    
                    // Move up to the parent object
                    currentObject = currentObject.parent;
                }
            }
        }
    }
    
    /**
     * Start the death sequence for the Asteroids door (suffocation in space)
     */
    startAsteroidsDoorDeathSequence() {
        console.log('Starting death sequence for Asteroids door');
        
        // Disable controls during the sequence
        this.app.disableControls();
        
        // Create overlay for the fade effect
        const overlay = document.createElement('div');
        overlay.style.position = 'fixed';
        overlay.style.top = '0';
        overlay.style.left = '0';
        overlay.style.width = '100%';
        overlay.style.height = '100%';
        overlay.style.backgroundColor = 'rgba(0, 0, 0, 0)';
        overlay.style.transition = 'background-color 2s ease-in-out';
        overlay.style.zIndex = '2000';
        overlay.style.display = 'flex';
        overlay.style.justifyContent = 'center';
        overlay.style.alignItems = 'center';
        document.body.appendChild(overlay);
        
        // Create message element
        const message = document.createElement('div');
        message.style.color = 'white';
        message.style.fontFamily = "'Press Start 2P', monospace";
        message.style.fontSize = '24px';
        message.style.opacity = '0';
        message.style.transition = 'opacity 1s ease-in-out';
        message.textContent = "You suffocated in outer space...";
        overlay.appendChild(message);
        
        // Play game over sound
        if (this.app && typeof this.app.playSound === 'function') {
            setTimeout(() => {
                this.app.playSound('gameOver');
            }, 1000);
        }
        
        // Remove any existing interaction feedback element to prevent conflict
        const existingFeedback = document.getElementById('interaction-feedback');
        if (existingFeedback) {
            existingFeedback.style.display = 'none';
        }
        
        // Fade to black
        setTimeout(() => {
            overlay.style.backgroundColor = 'rgba(0, 0, 0, 1)';
            
            // Show message after fade completes
            setTimeout(() => {
                message.style.opacity = '1';
                
                // Wait 5 seconds with black screen and message
                setTimeout(() => {
                    // Fade message out
                    message.style.opacity = '0';
                    
                    // Fade back from black
                    setTimeout(() => {
                        overlay.style.backgroundColor = 'rgba(0, 0, 0, 0)';
                        
                        // Remove overlay after fade out completes
                        setTimeout(() => {
                            document.body.removeChild(overlay);
                            
                            // Re-enable controls
                            this.app.enableControls();
                            
                            // Camera is already at appropriate position
                        }, 2000);
                    }, 1000);
                }, 5000);
            }, 2000);
        }, 100);
    }
    
    /**
     * Handle player movement in the corridor
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
        
        // Check for collisions
        const adjustedPosition = this.checkCollision(newPosition);
        
        // Update camera position
        this.camera.position.copy(adjustedPosition);

                  // Play footstep sounds if we're moving and not jumping

        if (moveDirection.length() > 0 && !this.isJumping) {

            const now = performance.now();

            if (now - this.lastFootstepTime > this.footstepInterval) {

                // Use the app's playSound method instead of directly calling play()

                if (this.app && typeof this.app.playSound === 'function') {

                    this.app.playSound('footstep');

                    console.log('Playing footstep sound in corridor using app.playSound');
                }
                this.lastFootstepTime = now;

            }

        }
        
        
        
        // --- IMPROVED ROTATION HANDLING ---
        
        // Extract current rotation components
        const euler = new THREE.Euler().setFromQuaternion(this.camera.quaternion, 'YXZ');
        let yaw = euler.y;   // Horizontal rotation (left/right)
        let pitch = euler.x; // Vertical rotation (up/down)
        
        // Handle horizontal rotation (left/right arrows)
        const rotationSpeed = 0.028;
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
        
        // Check if any keys are pressed to handle auto-return
        const anyKeysPressed = Object.values(this.keyStates).some(state => state);
        
        if (this.keyStates['ArrowUp']) {
            // Look up (negative pitch in Three.js)
            pitch = Math.min(pitch + lookSpeed, maxLookDown);
        } else if (this.keyStates['ArrowDown']) {
            // Look down (positive pitch in Three.js)
            pitch = Math.max(pitch - lookSpeed, -maxLookUp);

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
        
        // Handle jumping with Space key
        if (this.keyStates['Space'] && !this.isJumping) {
            // Start jump if we're on the ground
            if (Math.abs(this.camera.position.y - this.groundLevel) < 0.1) {
                this.isJumping = true;
                this.jumpVelocity = 0.2; // Initial upward velocity
                
                // Play jump sound using app's playSound method

                if (this.app && typeof this.app.playSound === 'function') {

                    this.app.playSound('jump');

                }
                
                console.log('Jump initiated in corridor');
            }
        }
        
        // Handle jumping physics
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
        
        // Handle Escape key
        if (this.keyStates['Escape']) {
            console.log('Escape key pressed in corridor');
            // You can add any escape key functionality here
            // For example, showing a pause menu
        }
    }
    
    /**
     * Check for collisions with corridor walls
     * @param {THREE.Vector3} position - The proposed new position
     * @returns {THREE.Vector3} - The adjusted position after collision detection
     */
    checkCollision(position) {
        // Create a copy of the position that we can modify
        const adjustedPosition = position.clone();
        
        // Corridor boundaries
        const corridorWidth = 6;
        const corridorLength = 150; // Updated to match the new corridor length
        const playerRadius = 0.6; // Same as in arcade room
        
        // Calculate corridor boundaries with buffer for player radius
        const minX = -corridorWidth / 2 + playerRadius;
        const maxX = corridorWidth / 2 - playerRadius;
        const minZ = -corridorLength + playerRadius;
        const maxZ = 0 - playerRadius; // Stop player before hitting the wall at z=0
        
        // Check X boundaries (left/right walls)
        if (position.x < minX) {
            adjustedPosition.x = minX;
        } else if (position.x > maxX) {
            adjustedPosition.x = maxX;
        }
        
        // Check Z boundaries (end wall and entrance)
        if (position.z < minZ) {
            adjustedPosition.z = minZ;
        } else if (position.z > maxZ) {
            adjustedPosition.z = maxZ;
        }
        
        return adjustedPosition;
    }
    
    /**
     * Update function called every frame
     */
    update() {
        // Handle player movement
        this.handleMovement();
        
        // Update fog based on player position
        this.updateFogEffect();
        
        // Update light flickering effect
        this.updateLightFlicker();
        
        // Any other updates specific to the corridor level

        // Check if player has passed the midpoint of the corridor and show UI if needed
        this.checkPositionForUI();
    }
    
    /**
     * Create flickering effect for lights in the last zone with smooth transition
     */
    updateLightFlicker() {
        // Only update at certain intervals to avoid performance issues
        const now = performance.now();
        if (now - this.lastFlickerTime < this.flickerInterval) return;
        this.lastFlickerTime = now;
        
        // Skip if flickering is disabled
        if (!this.flickerLights) return;
        
        // Get player's position for transition calculations
        const playerZ = this.camera.position.z;
        const corridorLength = 150;
        const thirdLength = corridorLength / 3;
        const middleZoneEnd = -(2 * thirdLength);    // -100
        const transitionLength = 10;                 // Same as in updateFogEffect
        
        // Calculate transition factor (0 to 1) when in transition area
        let transitionFactor = 1.0; // Default to full intensity
        
        // If player is in the transition area (-90 to -100)
        if (playerZ > middleZoneEnd && playerZ <= (middleZoneEnd + transitionLength)) {
            // Calculate how far into the transition area the player is (0 to 1)
            transitionFactor = (playerZ - (middleZoneEnd + transitionLength)) / -transitionLength;
        }
        // If player is still in middle zone, lights should be off
        else if (playerZ > middleZoneEnd) {
            transitionFactor = 0;
        }
        
        // Process each light
        this.corridorLights.forEach((light, index) => {
            // Skip ambient light
            if (light.type === 'AmbientLight') return;
            
            // Only apply to lights in the last zone
            if (!light.userData || light.userData.zone !== 'last') return;
            
            // Store original intensity if not already stored
            if (this.flickerIntensities[index] === undefined) {
                this.flickerIntensities[index] = light.intensity;
            }
            
            // Get original intensity
            const originalIntensity = this.flickerIntensities[index];
            
            // Calculate random flicker amount (moderate)
            const flickerAmount = (Math.random() * 0.2) - 0.1; // ±10%
            
            // Apply flicker with transition factor
            light.intensity = originalIntensity * transitionFactor * (1 + flickerAmount);
        });
    }
    
    /**
     * Update fog density based on player position with smooth transitions between zones
     */
    updateFogEffect() {
        // Only update if fog exists
        if (!this.scene.fog) return;
        
        // Get player's position in the corridor
        const playerZ = this.camera.position.z;
        const corridorLength = 150;
        const thirdLength = corridorLength / 3;
        
        // Define zone boundaries
        const firstZoneEnd = -thirdLength;           // -50
        const middleZoneEnd = -(2 * thirdLength);    // -100
        const transitionLength = 10;                 // Length of transition area
        
        // First zone: 0 to -50
        if (playerZ > firstZoneEnd) {
            // First zone - light fog to see within the zone but not beyond
            this.scene.fog.near = 5;
            this.scene.fog.far = 50;
        }
        // Middle zone: -50 to -100 (except transition area)
        else if (playerZ > middleZoneEnd + transitionLength) {
            // Middle zone - dense fog for darkness
            this.scene.fog.near = 1;
            this.scene.fog.far = 8;
        }
        // Transition area: -90 to -100
        else if (playerZ > middleZoneEnd) {
            // Calculate how far into the transition area the player is (0 to 1)
            const transitionProgress = (playerZ - (middleZoneEnd + transitionLength)) / -transitionLength;
            
            // Smoothly interpolate fog values from middle zone to last zone
            this.scene.fog.near = 1 + (4 * transitionProgress); // 1 to 5
            this.scene.fog.far = 8 + (42 * transitionProgress);  // 8 to 50
        }
        // Last zone: -100 to -150
        else {
            // Last zone - light fog again
            this.scene.fog.near = 5;
            this.scene.fog.far = 50;
        }
    }
    
    /**
     * Unload the corridor level and clean up resources
     */
    unload() {
        console.log('Unloading corridor level...');
        
        // Remove event listener for key presses
        window.removeEventListener('keydown', this.onKeyDown);
        
        // Remove all corridor objects from the scene
        [...this.corridorObjects, ...this.corridorLights, ...this.doorways].forEach(object => {
            if (object.parent) {
                object.parent.remove(object);
            }
            
            // Dispose of geometries and materials
            if (object.geometry) {
                object.geometry.dispose();
            }
            
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
        
        // Clear arrays
        this.corridorObjects = [];
        this.corridorLights = [];
        this.doorways = [];
        
        // Clean up narrator system
        this.cleanupNarratorSystem();
        
        // Remove UI elements
        this.removeUIElements();
        
        console.log('Corridor level unloaded');
    }

    /**
     * Start the sequence of narrator messages
     */
    initiateNarratorSequence() {
        if (this.narratorInitiated) return; // Prevent duplicate triggering within this instance
        this.narratorInitiated = true;
        
        // Set the persistent flag on the app to indicate this has been shown
        this.app.corridorNarratorShown = true;
        
        // Queue the four messages (split the last message into two)
        this.queueNarratorMessage("What? How did you get here?");
        this.queueNarratorMessage("You're not supposed to be here.");
        this.queueNarratorMessage("It would be best if you left.");
        this.queueNarratorMessage("First door on your right, please.");
        
        // Start displaying messages
        this.processNarratorMessageQueue();
    }
    
    /**
     * Add a message to the narrator queue
     * @param {string} message - The message to display
     */
    queueNarratorMessage(message) {
        this.narratorMessageQueue.push(message);
    }
    
    /**
     * Process the next message in the queue
     */
    processNarratorMessageQueue() {
        // If we're already showing a message or the queue is empty, return
        if (this.isShowingNarratorMessage || this.narratorMessageQueue.length === 0) {
            return;
        }
        
        // Get the next message and show it
        const message = this.narratorMessageQueue.shift();
        this.showNarratorMessage(message);
    }
    
    /**
     * Show a narrator message with typing animation
     * @param {string} message - Message to display
     */
    showNarratorMessage(message) {
        // Set flag that we're showing a message
        this.isShowingNarratorMessage = true;
        
        // Create message element if it doesn't exist
        if (!this.narratorMessageElement) {
            this.narratorMessageElement = document.createElement('div');
            this.narratorMessageElement.style.position = 'fixed';
            this.narratorMessageElement.style.top = '50%';
            this.narratorMessageElement.style.left = '50%';
            this.narratorMessageElement.style.transform = 'translate(-50%, -50%)';
            this.narratorMessageElement.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
            this.narratorMessageElement.style.color = '#FFFFFF'; // White text
            this.narratorMessageElement.style.padding = '12px 20px';
            this.narratorMessageElement.style.borderRadius = '5px';
            this.narratorMessageElement.style.fontFamily = "'Press Start 2P', monospace";
            this.narratorMessageElement.style.fontSize = '16px';
            this.narratorMessageElement.style.zIndex = '1500';
            this.narratorMessageElement.style.textAlign = 'center';
            this.narratorMessageElement.style.maxWidth = '80%';
            this.narratorMessageElement.style.visibility = 'hidden'; // Start hidden
            document.body.appendChild(this.narratorMessageElement);
        }
        
        // Prepare for typing animation
        this.narratorMessageElement.textContent = '';
        this.narratorMessageElement.style.visibility = 'visible';
        this.currentNarratorMessage = message;
        this.currentLetterIndex = 0;
        
        // Start typing animation
        this.typeNextLetter();
    }
    
    /**
     * Type the next letter in the current message
     */
    typeNextLetter() {
        if (this.currentLetterIndex < this.currentNarratorMessage.length) {
            // Add the next letter
            this.narratorMessageElement.textContent += this.currentNarratorMessage.charAt(this.currentLetterIndex);
            this.currentLetterIndex++;
            
            // Schedule the next letter
            this.letterTypingInterval = setTimeout(() => {
                this.typeNextLetter();
            }, 20); // Typing speed - adjust as needed
        } else {
            // Typing complete, keep message visible for a while
            this.narratorMessageTimeout = setTimeout(() => {
                this.hideNarratorMessage();
            }, 1000); // Keep complete message on screen for 1 second
        }
    }
    
    /**
     * Hide the narrator message and process the next one if available
     */
    hideNarratorMessage() {
        if (this.narratorMessageElement) {
            this.narratorMessageElement.style.visibility = 'hidden';
        }
        
        // Clear any pending timeouts
        if (this.narratorMessageTimeout) {
            clearTimeout(this.narratorMessageTimeout);
            this.narratorMessageTimeout = null;
        }
        
        if (this.letterTypingInterval) {
            clearTimeout(this.letterTypingInterval);
            this.letterTypingInterval = null;
        }
        
        // Reset state
        this.isShowingNarratorMessage = false;
        this.currentNarratorMessage = null;
        this.currentLetterIndex = 0;
        
        // Process the next message (if any) after a short delay
        setTimeout(() => {
            this.processNarratorMessageQueue();
        }, 150); // Small delay between messages
    }
    
    /**
     * Clean up narrator message system
     */
    cleanupNarratorSystem() {
        if (this.narratorMessageElement && this.narratorMessageElement.parentNode) {
            this.narratorMessageElement.parentNode.removeChild(this.narratorMessageElement);
        }
        
        if (this.narratorMessageTimeout) {
            clearTimeout(this.narratorMessageTimeout);
        }
        
        if (this.letterTypingInterval) {
            clearTimeout(this.letterTypingInterval);
        }
        
        this.narratorMessageElement = null;
        this.narratorMessageQueue = [];
        this.isShowingNarratorMessage = false;
        this.currentNarratorMessage = null;
    }

    /**
     * Check if player has passed the midpoint of the corridor and show UI if needed
     */
    checkPositionForUI() {
        // Corridor length is 150 units, so midpoint is at z = -75
        const midpointZ = -75;
        
        // If player has passed the midpoint and UI hasn't been created yet, create it
        if (this.camera.position.z < midpointZ && !this.uiElementsCreated) {
            this.createUIElements();
            }
    }
    
    /**
     * Create UI elements for lives and win count
     */
    createUIElements() {
        console.log('Creating lives and win count UI elements');
        
        // Don't create elements if they already exist
        if (this.uiElementsCreated) {
            console.log('UI elements already exist, skipping creation');
            return;
        }
        
        // Create the lives display
        this.createLivesDisplay();
        
        // Create the win count display
        this.createWinCountDisplay();
        
        // Mark UI elements as created
        this.uiElementsCreated = true;
    }
    
    /**
     * Create the lives display showing 4 heart symbols
     */
    createLivesDisplay() {
        // Create the container
        const livesDisplay = document.createElement('div');
        livesDisplay.id = 'lives-display';
        livesDisplay.style.position = 'fixed';
        livesDisplay.style.top = '100px'; // Position below FPS counter (which is at 60px)
        livesDisplay.style.left = '20px';
        livesDisplay.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
        livesDisplay.style.color = '#00FF00'; // Red for hearts
        livesDisplay.style.padding = '10px 15px';
        livesDisplay.style.borderRadius = '5px';
        livesDisplay.style.fontFamily = "'Press Start 2P', monospace";
        livesDisplay.style.fontSize = '14px';
        livesDisplay.style.zIndex = '1000';
        livesDisplay.style.pointerEvents = 'none'; // Make it non-interactive
        
        // Set the content (LIVES: followed by 5 hearts)
        livesDisplay.innerHTML = `LIVES: ${'❤️'.repeat(this.playerLives)}`;
        
        // Add to document
        document.body.appendChild(livesDisplay);
        
        // Store reference
        this.livesDisplay = livesDisplay;
    }
    
    /**
     * Create the win count display showing WON: 0/3
     */
    createWinCountDisplay() {
        // Create the container
        const winCountDisplay = document.createElement('div');
        winCountDisplay.id = 'win-count-display';
        winCountDisplay.style.position = 'fixed';
        winCountDisplay.style.top = '145px'; // Position below lives display
        winCountDisplay.style.left = '20px';
        winCountDisplay.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
        winCountDisplay.style.color = '#00FF00'; // Green for wins
        winCountDisplay.style.padding = '10px 15px';
        winCountDisplay.style.borderRadius = '5px';
        winCountDisplay.style.fontFamily = "'Press Start 2P', monospace";
        winCountDisplay.style.fontSize = '14px';
        winCountDisplay.style.zIndex = '1000';
        winCountDisplay.style.pointerEvents = 'none'; // Make it non-interactive
        
        // Set the content
        winCountDisplay.textContent = `WON: ${this.playerWins}/${this.requiredWins}`;
        
        // Add to document
        document.body.appendChild(winCountDisplay);
        
        // Store reference
        this.winCountDisplay = winCountDisplay;
    }
    
    

    /**
 * Update the lives display
 */
updateLivesDisplay() {
    console.log('Updating lives display, livesDisplay:', !!this.livesDisplay, 'playerLives:', this.playerLives);
    if (this.livesDisplay) {
        this.livesDisplay.innerHTML = `LIVES: ${'❤️'.repeat(this.playerLives)}`;
        console.log('Lives display updated to:', this.livesDisplay.innerHTML);
    } else {
        console.warn('Lives display element not found, creating UI elements');
        this.createUIElements();
        if (this.livesDisplay) {
            this.livesDisplay.innerHTML = `LIVES: ${'❤️'.repeat(this.playerLives)}`;
        }
    }
}
    /**
 * Update the win count display
 */
updateWinCountDisplay() {
    console.log('Updating win count display, winCountDisplay:', !!this.winCountDisplay, 'playerWins:', this.playerWins);
    if (this.winCountDisplay) {
        this.winCountDisplay.textContent = `WON: ${this.playerWins}/${this.requiredWins}`;
        console.log('Win count display updated to:', this.winCountDisplay.textContent);
    } else {
        console.warn('Win count display element not found, creating UI elements');
        this.createUIElements();
        if (this.winCountDisplay) {
            this.winCountDisplay.textContent = `WON: ${this.playerWins}/${this.requiredWins}`;
        }
    }
}
    
    /**
     * Remove UI elements from the DOM
     */
    removeUIElements() {
        // Remove lives display
        if (this.livesDisplay && this.livesDisplay.parentNode) {
            this.livesDisplay.parentNode.removeChild(this.livesDisplay);
            this.livesDisplay = null;
        }
        
        // Remove win count display
        if (this.winCountDisplay && this.winCountDisplay.parentNode) {
            this.winCountDisplay.parentNode.removeChild(this.winCountDisplay);
            this.winCountDisplay = null;
        }
        
        // Reset UI tracking
        this.uiElementsCreated = false;
    }
}

// Make the class available globally
window.CorridorLevel = CorridorLevel;