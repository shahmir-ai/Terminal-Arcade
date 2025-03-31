# Corridor Implementation Plan

## Current Implementation Analysis

1. **Corridor Structure**:
   - Currently 50 units long, 6 units wide, 8 units high
   - Has 8 ceiling lights evenly spaced throughout
   - Contains 4 doorways (2 on each side wall)
   - Has an elevator at the end

2. **Door System**:
   - Doors are created as mesh objects with textures
   - Interaction is handled via raycasting when 'E' key is pressed
   - The corridor.js currently only handles elevator interaction

3. **Lighting**:
   - Uses ambient light and point lights for ceiling fixtures
   - Lights are evenly distributed along the corridor

## Detailed Implementation Plan

### 1. Extend Corridor Length
- Increase corridor length from 50 to 150 units (3x longer)
- Adjust collision boundaries accordingly
- Update floor, ceiling, and wall geometries

### 2. Implement Lighting Zones
- First 1/3 (0-50 units): Well-lit with ceiling lights
- Middle 1/3 (50-100 units): Dark/pitch black with minimal or no lighting
- Last 1/3 (100-150 units): Well-lit with ceiling lights
- Adjust ambient light to maintain minimal visibility in dark section

### 3. Rearrange Door Placements
- Remove all existing doors
- Add new doors at specific positions:
  - First 1/3: One door on right wall at approximately 25 units in
  - Middle 1/3: No doors (dark section)
  - Last 1/3: 
    - One door on left wall at approximately 125 units
    - One door on right wall at approximately 125 units
    - One door at the end wall at 150 units

### 4. Implement Door Textures and Interaction
- Use existing hallwaydoor.jpg texture for doors until custom textures are added later
- Implement door interaction in the corridor's onKeyDown method
- Add custom messages for each door ("open corridor door 1", etc.)
- Set up userData properties for each door to identify them

### 5. Adjust Camera and Movement
- Ensure the camera and movement controls work properly with the extended corridor
- Adjust collision detection for the new layout

## Implementation Considerations

1. **Performance**:
   - The longer corridor might impact performance, so we should ensure efficient rendering
   - Consider using distance-based rendering for lights and objects

2. **User Experience**:
   - The dark middle section should still allow navigation but create an eerie atmosphere
   - Door interactions should be intuitive and provide clear feedback

3. **Code Structure**:
   - We'll need to modify several methods in the CorridorLevel class:
     - `createCorridor()` - to extend the corridor
     - `setupLighting()` - to create the lighting zones
     - `createDoorways()` - to place doors in new positions
     - `onKeyDown()` - to handle door interactions

4. **Asset Management**:
   - Door textures (c_door1.jpg, etc.) will be added by the user later
   - For now, we'll use the existing hallwaydoor.jpg texture as a placeholder