

- Navigator.vibrate()
- remove AR
- google login/create account
- generate player stats/XP
-- rebrand
- fitwizard.club/fitwizard.party

## Game tick

The game will "tick" every 5 seconds, sending:

- coordinates
- current state: exploring, fighting, etc

The game server will respond with:

- confirmation
- events (found item, monster attack, etc)

### player events

Beyond game ticks, the player has several optional actions that can be taken depending on their current state

#### any state

- view inventory
- end adventure (stop workout)
- equip weapon/wear armor
- use/drink item
- cast spell

#### fighting
- cast spell
- melee attack
- use item
- flee (requires speed increase to be successful)

Each "fighting" action will have a corresponding monster tick associated. Each action will constitute one simulation turn.

Any monster that is a lower level than the player will be considered "slower" and will have their actions processed last.

Any monster that is a higher level than the player will be consider "faster" and will have their actions processed first.

Items that increase speed for the player can swap this around. Items that slow the monster can also swap this around.

** Example **

```
Player is exploring [l/l].
Player is exploring [l/l].
Player is exploring -> finds monster [l/l, fighting, orc:1]
Player is fighting orc[1] : Attack Melee -> [hit:orc 5/10, orc hits -> [5 = 15/20]]
Player is fighting orc[1]: Attack melee -> [hit: orc 0/10, orc dies = [15 XP, 10 gold, helmet]]
Player is exploring [l/l].
```

## health/healing

On every adventure, we will calculate your "average speed". Healing will only occur every game tick when your current speed is some percentage higher than your average speed. 

### Example

Player Health: 50/100
Average Speed: 1.5mph
Current Speed: 2mph
Health regains slowly per game tick where speed > average speed.

## spells

### Attack:

- Force bolt
- drain life
- magic missile
- cone of cold
- fireball
- finger of death

### Clerical:

- protection
- create monster
- remove curse
- create familiar
- turn undead

### Divination

- detect monsters
- light
- detect food
- clairvoyance
- detect unseen
- identify

### Enchantment:

- sleep
- confuse monster
- slow monster
- cause fear
- charm monster

### Escape:

- jumping
- haste self
- invisibility
- levitation
- teleport away

### Healing:

- healing
- cure blindness
- cure sickness
- extra healing
- restore ability