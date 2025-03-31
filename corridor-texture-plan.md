# Plan to Apply Textures to Corridor in js/corridor.js

This plan outlines the steps to apply textures to the floor, ceiling, and four walls (Left, Right, End, and a new South wall) of the corridor level.

**Texture Files:**

*   Floor: `assets/textures/c_floor.jpg`
*   Ceiling: `assets/textures/c_ceiling.jpg`
*   Walls: `assets/textures/c_walls.jpg`

**Steps:**

1.  **Load Textures:**
    *   Inside the `createCorridor` function, initialize a `THREE.TextureLoader`.
    *   Load the three texture files (`c_floor.jpg`, `c_ceiling.jpg`, `c_walls.jpg`).

2.  **Configure Texture Wrapping & Repetition:**
    *   For each loaded texture (within the loader's callback):
        *   Set `texture.wrapS = THREE.RepeatWrapping;`
        *   Set `texture.wrapT = THREE.RepeatWrapping;`
        *   Define appropriate repetition values using `texture.repeat.set(x, y);`.
            *   Floor/Ceiling: Repeat based on `corridorWidth` and `corridorLength`.
            *   Side Walls (Left/Right): Repeat based on `corridorLength` and `corridorHeight`.
            *   End Walls (North/South): Repeat based on `corridorWidth` and `corridorHeight`.
            *   *(Exact repeat values might need tuning during implementation).*

3.  **Create Materials with Textures:**
    *   Modify the existing material definitions (`floorMaterial`, `ceilingMaterial`, `wallMaterial`) to use the loaded textures via the `map` property.
    *   Remove the `color` property from these materials.

4.  **Apply Materials to Existing Geometry:**
    *   Ensure the updated materials are applied to the existing Floor, Ceiling, Left Wall, Right Wall, and End Wall meshes.

5.  **Create and Texture South Wall:**
    *   Define geometry: `const southWallGeometry = new THREE.PlaneGeometry(corridorWidth, corridorHeight);`
    *   Create mesh: `const southWall = new THREE.Mesh(southWallGeometry, wallMaterial);`
    *   Position the wall behind the elevator (e.g., `z = 1.1`): `southWall.position.set(0, corridorHeight / 2, 1.1);`
    *   Rotate to face into the corridor: `southWall.rotation.y = Math.PI;`
    *   Add to scene: `this.scene.add(southWall);`
    *   Add to collision objects: `this.corridorObjects.push(southWall);`

6.  **Handle Asynchronous Loading:**
    *   Ensure all steps depending on textures occur within the `TextureLoader` callbacks.

**Conceptual Flow Diagram:**

```mermaid
graph TD
    A[Start createCorridor] --> B{Load Textures};
    B --> C[c_floor.jpg];
    B --> D[c_ceiling.jpg];
    B --> E[c_walls.jpg];
    C --> F{Configure Floor Texture (Wrap/Repeat)};
    D --> G{Configure Ceiling Texture (Wrap/Repeat)};
    E --> H{Configure Wall Texture (Wrap/Repeat)};
    F --> I[Update floorMaterial w/ Texture];
    G --> J[Update ceilingMaterial w/ Texture];
    H --> K[Update wallMaterial w/ Texture];
    I --> L[Apply to Floor Mesh];
    J --> M[Apply to Ceiling Mesh];
    K --> N[Apply to Left Wall Mesh];
    K --> O[Apply to Right Wall Mesh];
    K --> P[Apply to End Wall Mesh];
    K --> Q{Create South Wall Geometry};
    Q & K --> R[Create South Wall Mesh w/ wallMaterial];
    R --> S[Position & Rotate South Wall];
    S --> T[Add South Wall to Scene & corridorObjects];
    T --> U[End createCorridor];