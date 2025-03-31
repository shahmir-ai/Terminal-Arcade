# Corridor Texture Implementation Plan

## Overview
This document outlines the plan for implementing textures for the walls, floor, and ceiling in the corridor area of the Terminal Arcade game.

## Current State
- The corridor currently uses solid colors for walls, floor, and ceiling
- The door texture is already being loaded and applied correctly
- The textures `c_walls.jpg`, `c_ceiling.jpg`, and `c_floor.jpg` are available in the assets/textures folder

## Implementation Details

### 1. Add Texture Repetition Settings
Add configurable texture repetition settings to the `CorridorLevel` class constructor:

```javascript
// Texture repetition settings - easily adjustable
this.textureSettings = {
    // Floor texture repetition
    floor: { repeatX: 4, repeatY: 25 },
    
    // Ceiling texture repetition
    ceiling: { repeatX: 4, repeatY: 25 },
    
    // Wall texture repetition - different for side vs end walls
    leftWall: { repeatX: 25, repeatY: 2 },   // Long side wall (left)
    rightWall: { repeatX: 25, repeatY: 2 },  // Long side wall (right)
    endWall: { repeatX: 4, repeatY: 2 }      // End wall (far end)
};
```

### 2. Modify the `createCorridor` Method
Update the `createCorridor` method to use textures instead of solid colors:

```javascript
createCorridor() {
    console.log('Creating corridor geometry with textures...');
    
    // Corridor dimensions
    const corridorWidth = 6;
    const corridorHeight = 8;
    const corridorLength = 150;
    
    // Create texture loader
    const textureLoader = new THREE.TextureLoader();
    
    // === FLOOR WITH TEXTURE ===
    const floorGeometry = new THREE.PlaneGeometry(corridorWidth, corridorLength);
    
    // Create floor material with texture
    const floorMaterial = new THREE.MeshStandardMaterial({
        color: 0xFFFFFF,  // White base color to show texture properly
        roughness: 1,
        metalness: 0
    });
    
    // Load and apply floor texture
    textureLoader.load(
        'assets/textures/c_floor.jpg',
        (texture) => {
            // Configure texture wrapping and repetition
            texture.wrapS = THREE.RepeatWrapping;
            texture.wrapT = THREE.RepeatWrapping;
            texture.repeat.set(
                this.textureSettings.floor.repeatX,
                this.textureSettings.floor.repeatY
            );
            
            // Apply texture to material
            floorMaterial.map = texture;
            floorMaterial.needsUpdate = true;
            console.log('Floor texture applied');
        },
        undefined,
        (error) => {
            console.error('Error loading floor texture:', error);
        }
    );
    
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = -Math.PI / 2; // Rotate to be horizontal
    floor.position.set(0, 0, -corridorLength / 2);
    this.scene.add(floor);
    this.corridorObjects.push(floor);
    
    // === CEILING WITH TEXTURE ===
    const ceilingGeometry = new THREE.PlaneGeometry(corridorWidth, corridorLength);
    
    // Create ceiling material with texture
    const ceilingMaterial = new THREE.MeshStandardMaterial({
        color: 0xFFFFFF,  // White base color to show texture properly
        roughness: 1,
        metalness: 0
    });
    
    // Load and apply ceiling texture
    textureLoader.load(
        'assets/textures/c_ceiling.jpg',
        (texture) => {
            // Configure texture wrapping and repetition
            texture.wrapS = THREE.RepeatWrapping;
            texture.wrapT = THREE.RepeatWrapping;
            texture.repeat.set(
                this.textureSettings.ceiling.repeatX,
                this.textureSettings.ceiling.repeatY
            );
            
            // Apply texture to material
            ceilingMaterial.map = texture;
            ceilingMaterial.needsUpdate = true;
            console.log('Ceiling texture applied');
        },
        undefined,
        (error) => {
            console.error('Error loading ceiling texture:', error);
        }
    );
    
    const ceiling = new THREE.Mesh(ceilingGeometry, ceilingMaterial);
    ceiling.rotation.x = Math.PI / 2; // Rotate to be horizontal
    ceiling.position.set(0, corridorHeight, -corridorLength / 2);
    this.scene.add(ceiling);
    this.corridorObjects.push(ceiling);
    
    // === WALLS WITH TEXTURE ===
    // Create wall material with texture
    const wallMaterial = new THREE.MeshStandardMaterial({
        color: 0xFFFFFF,  // White base color to show texture properly
        roughness: 0.8,
        metalness: 0.2
    });
    
    // Load and apply wall texture
    textureLoader.load(
        'assets/textures/c_walls.jpg',
        (texture) => {
            // We'll clone this texture for each wall to have independent repetition settings
            console.log('Wall texture loaded, applying to all walls with appropriate repetition');
            
            // Apply to left wall with appropriate repetition
            const leftWallTexture = texture.clone();
            leftWallTexture.wrapS = THREE.RepeatWrapping;
            leftWallTexture.wrapT = THREE.RepeatWrapping;
            leftWallTexture.repeat.set(
                this.textureSettings.leftWall.repeatX,
                this.textureSettings.leftWall.repeatY
            );
            leftWall.material = new THREE.MeshStandardMaterial({
                map: leftWallTexture,
                roughness: 0.8,
                metalness: 0.2
            });
            leftWall.material.needsUpdate = true;
            
            // Apply to right wall with appropriate repetition
            const rightWallTexture = texture.clone();
            rightWallTexture.wrapS = THREE.RepeatWrapping;
            rightWallTexture.wrapT = THREE.RepeatWrapping;
            rightWallTexture.repeat.set(
                this.textureSettings.rightWall.repeatX,
                this.textureSettings.rightWall.repeatY
            );
            rightWall.material = new THREE.MeshStandardMaterial({
                map: rightWallTexture,
                roughness: 0.8,
                metalness: 0.2
            });
            rightWall.material.needsUpdate = true;
            
            // Apply to end wall with appropriate repetition
            const endWallTexture = texture.clone();
            endWallTexture.wrapS = THREE.RepeatWrapping;
            endWallTexture.wrapT = THREE.RepeatWrapping;
            endWallTexture.repeat.set(
                this.textureSettings.endWall.repeatX,
                this.textureSettings.endWall.repeatY
            );
            endWall.material = new THREE.MeshStandardMaterial({
                map: endWallTexture,
                roughness: 0.8,
                metalness: 0.2
            });
            endWall.material.needsUpdate = true;
            
            console.log('Wall textures applied with custom repetition settings');
        },
        undefined,
        (error) => {
            console.error('Error loading wall texture:', error);
        }
    );
    
    // Left wall
    const leftWallGeometry = new THREE.PlaneGeometry(corridorLength, corridorHeight);
    const leftWall = new THREE.Mesh(leftWallGeometry, wallMaterial.clone());
    leftWall.rotation.y = Math.PI / 2; // Rotate to face inward
    leftWall.position.set(-corridorWidth / 2, corridorHeight / 2, -corridorLength / 2);
    this.scene.add(leftWall);
    this.corridorObjects.push(leftWall);
    
    // Right wall
    const rightWallGeometry = new THREE.PlaneGeometry(corridorLength, corridorHeight);
    const rightWall = new THREE.Mesh(rightWallGeometry, wallMaterial.clone());
    rightWall.rotation.y = -Math.PI / 2; // Rotate to face inward
    rightWall.position.set(corridorWidth / 2, corridorHeight / 2, -corridorLength / 2);
    this.scene.add(rightWall);
    this.corridorObjects.push(rightWall);
    
    // End wall
    const endWallGeometry = new THREE.PlaneGeometry(corridorWidth, corridorHeight);
    const endWall = new THREE.Mesh(endWallGeometry, wallMaterial.clone());
    endWall.position.set(0, corridorHeight / 2, -corridorLength);
    this.scene.add(endWall);
    this.corridorObjects.push(endWall);
    
    console.log('Corridor geometry created with textured surfaces');
}
```

### 3. Helper Method for Adjusting Texture Settings
Add a helper method to allow easy adjustment of texture repetition settings:

```javascript
/**
 * Update texture repetition settings for a specific surface
 * @param {string} surface - The surface to update ('floor', 'ceiling', 'leftWall', 'rightWall', 'endWall')
 * @param {number} repeatX - The X repetition value
 * @param {number} repeatY - The Y repetition value
 */
updateTextureSettings(surface, repeatX, repeatY) {
    // Check if the surface exists in our settings
    if (this.textureSettings[surface]) {
        console.log(`Updating ${surface} texture settings: repeatX=${repeatX}, repeatY=${repeatY}`);
        
        // Update the settings
        this.textureSettings[surface].repeatX = repeatX;
        this.textureSettings[surface].repeatY = repeatY;
        
        // Find the corresponding object and update its texture
        // This would require keeping references to each surface or finding them in the scene
        // Implementation depends on how you want to handle dynamic updates
    } else {
        console.error(`Surface "${surface}" not found in texture settings`);
    }
}
```

## Implementation Notes

1. **Texture Repetition Settings**:
   - The repetition settings are stored in the `textureSettings` object
   - Each surface has its own X and Y repetition values
   - Different settings for side walls vs. end wall

2. **Texture Loading**:
   - All textures are loaded using THREE.TextureLoader
   - Error handling is included for each texture load
   - Textures are cloned for each wall to allow independent repetition settings

3. **Material Properties**:
   - Floor: High roughness, no metalness
   - Ceiling: High roughness, no metalness
   - Walls: Medium roughness, slight metalness

4. **Future Adjustments**:
   - To adjust texture repetition, modify the values in the `textureSettings` object
   - The `updateTextureSettings` method can be used for runtime adjustments

## Next Steps

1. Switch to Code mode to implement these changes
2. Test the implementation to ensure textures are applied correctly
3. Fine-tune the repetition settings for optimal visual appearance