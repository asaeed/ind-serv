# Multi-Character System - Implementation TODO

## Current State
- ✅ playerStore supports multiple characters
- ✅ villagerWoman can be recruited
- ✅ Tab key input is captured
- ✅ Auto-production works for standing characters

## What Needs to be Done

### Architecture Refactoring Required

The current `Player` class is designed for a single character. To support multiple controllable characters, we need:

#### Option 1: Multi-Player Instances
```javascript
// In Game.js or new CharacterController.js
this.characters = {
  player: new Player(this.map, this.input, 'player'),
  villagerWoman: null // Created when recruited
}
this.activeCharacter = 'player'
```

#### Option 2: Character Controller Pattern
```javascript
// Create new CharacterController class that manages:
- Multiple sprite entities (player sprite, villagerWoman sprite)
- Switching active sprite
- Camera following active sprite
- Input routing to active character
```

### Implementation Steps

1. **Refactor Player class** to support character ID
   - Pass characterId to constructor
   - Use playerStore's character-specific state

2. **Create CharacterController** (recommended)
   ```javascript
   class CharacterController {
     constructor(map, input) {
       this.map = map
       this.input = input
       this.characters = new Map()
       this.createCharacter('player', villagerManSprite, startX, startY)
     }

     createCharacter(id, sprite, x, y) {
       const character = {
         id,
         sprite: new SpriteAnimated(layer, sprite, x, y),
         initX: x,
         initY: y
       }
       this.characters.set(id, character)
     }

     switchCharacter(newId) {
       const char = this.characters.get(newId)
       if (char) {
         playerStore.getState().switchCharacter(newId)
         this.panCameraTo(char)
       }
     }

     update() {
       const activeId = playerStore.getState().activeCharacterId
       const activeChar = this.characters.get(activeId)
       // Update only active character with input
       this.updateCharacter(activeChar, this.input)
     }
   }
   ```

3. **Handle Tab key in Game or Player**
   ```javascript
   if (this.input.switchCharacterPress && !this.lastSwitchPress) {
     const chars = playerStore.getState().getControllableCharacters()
     const currentIndex = chars.findIndex(c => c.id === activeCharacterId)
     const nextIndex = (currentIndex + 1) % chars.length
     this.switchCharacter(chars[nextIndex].id)
   }
   this.lastSwitchPress = this.input.switchCharacterPress
   ```

4. **Recruit villagerWoman sprite**
   - When recruited, get villagerWoman's NPC sprite reference
   - Create a Player/Character instance for her
   - Or convert her NPC to player-controlled

5. **Camera panning**
   ```javascript
   panCameraTo(character) {
     // Animate camera moving to new character position
     const targetX = character.sprite.x()
     const targetY = character.sprite.y()
     // Use Konva.Animation or tween library
   }
   ```

## Recommended Approach

Use **Option 2** (Character Controller):
1. Create `CharacterController.js`
2. Move player control logic from `Player.js` into controller
3. `Player.js` becomes just a sprite wrapper
4. villagerWoman's NPC sprite can be "taken over" by CharacterController
5. Tab switches which sprite the controller updates

## Files to Modify
- [ ] Create `src/js/controllers/CharacterController.js`
- [ ] Refactor `src/js/Player.js`
- [ ] Update `src/js/Game.js` to use CharacterController
- [ ] Update `src/js/controllers/NpcController.js` to mark villagerWoman as "controlled"

## Testing Plan
1. Start game, move player around
2. Talk to villagerWoman twice to recruit
3. Press Tab - camera should pan to villagerWoman
4. Move villagerWoman with arrow keys
5. Press Tab - camera should pan back to player
6. Both characters should support auto-production
