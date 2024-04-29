// Player/enemy state
function st(elem)
{
  this.e=(elem||null); // DOM element

  this.keystate=0; // keyboard bitfield [action][down][right][up][left]
  this.padstate=0; // gamepad bitfield [action][down][right][up][left]

  this.x=0; // x position
  this.y=0; // y position
  this.px=0; // previous x position
  this.py=0; // previous y position
  this.sx=0; // start x position
  this.sy=0; // start y position
  this.w=0; // width
  this.h=0; // height
  this.vs=0; // current vertical speed
  this.hs=0; // current horizontal speed
  this.j=false; // jumping
  this.f=false; // falling
  this.d=false; // ducking
  this.htime=0; // hurt following an enemy collision
  this.dir=0; // direction (-1=left, 0=none, 1=right)
  this.hsp=5; // max horizontal speed
  this.vsp=15; // max vertical speed
  this.speed=5; // walking speed
  this.jumpspeed=15; // jumping speed
  this.c=0; // coyote timer (time after leaving ground where you can still jump)

  this.lf=100; // remaining "life force"
}

// Game state
var gs={
  // animation frame of reference
  step:(1/60), // target step time @ 60 fps
  acc:0, // accumulated time since last frame
  lasttime:0, // time of last frame

  // control state
  gamepad:-1,
  gamepadbuttons:[],
  gamepadaxes:[],
  gamepadassignbutton:-1,
  gamepadlastbutton:-1,

  // physics in pixels per frame @ 60fps
  gravity:0.5,
  terminalvelocity:25,
  friction:1,

  // entities
  player:new st(),
  enemies:[],

  // level related
  level:0,
  tiles:[],
  tilerows:0,
  tilecolumns:0,
  tilewidth:64,
  tileheight:64,
  things:[], // collectables
  score:0,
  scale:1,

  // audio related
  dialler:new dtmf_dial(),
  music:new gen_music(),

  randoms:new randomizer(),
  writer:new textwriter(),
  timeline:new timelineobj(),

  state:0 // state machine, 0=intro, 1=menu, 2=playing, 3=complete
};

// Clear both keyboard and gamepad input state
function clearinputstate(character)
{
  character.keystate=0;
  character.padstate=0;
}

// Check if an input is set in either keyboard or gamepad input state
function ispressed(character, keybit)
{
  return (((character.keystate&keybit)!=0) || ((character.padstate&keybit)!=0));
}

// Scan for any connected gamepads
function gamepadscan()
{
  var gamepads=navigator.getGamepads();
  var found=0;
  var i=0;

  var gleft=false;
  var gright=false;
  var gup=false;
  var gdown=false;
  var gjump=false;

  // Find active pads
  for (var padid=0; padid<gamepads.length; padid++)
  {
    // Only support first found gamepad
    if ((found==0) && (gamepads[padid] && gamepads[padid].connected))
    {
      found++;

      // If we don't already have this one, add mapping for it
      if (gs.gamepad!=padid)
      {
        console.log("Found new gamepad "+padid+" '"+gamepads[padid].id+"'");

        gs.gamepad=padid;

        if (gamepads[padid].mapping==="standard")
        {
          // Browser supported "standard" gamepad
          gs.gamepadbuttons[0]=14; // left (left) d-left
          gs.gamepadbuttons[1]=15; // right (left) d-right
          gs.gamepadbuttons[2]=12; // top (left) d-up
          gs.gamepadbuttons[3]=13; // bottom (left) d-down
          gs.gamepadbuttons[4]=0;  // bottom button (right) x

          gs.gamepadaxes[0]=0; // left/right axis
          gs.gamepadaxes[1]=1; // up/down axis
          gs.gamepadaxes[2]=2; // cam left/right axis
          gs.gamepadaxes[3]=3; // cam up/down axis
        }
        else
        if (gamepads[padid].id=="054c-0268-Sony PLAYSTATION(R)3 Controller")
        {
          // PS3 DualShock 3
          gs.gamepadbuttons[0]=15; // left (left) d-left
          gs.gamepadbuttons[1]=16; // right (left) d-right
          gs.gamepadbuttons[2]=13; // top (left) d-up
          gs.gamepadbuttons[3]=14; // bottom (left) d-down
          gs.gamepadbuttons[4]=0;  // bottom button (right) x

          gs.gamepadaxes[0]=0; // left/right axis
          gs.gamepadaxes[1]=1; // up/down axis
          gs.gamepadaxes[2]=3; // cam left/right axis
          gs.gamepadaxes[3]=4; // cam up/down axis
        }
        else
        if (gamepads[padid].id=="045e-028e-Microsoft X-Box 360 pad")
        {
          // XBOX 360
          // 8Bitdo GBros. Adapter (XInput mode)
          gs.gamepadbuttons[0]=-1; // left (left) d-left
          gs.gamepadbuttons[1]=-1; // right (left) d-right
          gs.gamepadbuttons[2]=-1; // top (left) d-up
          gs.gamepadbuttons[3]=-1; // bottom (left) d-down
          gs.gamepadbuttons[4]=0;  // bottom button (right) x

          gs.gamepadaxes[0]=6; // left/right axis
          gs.gamepadaxes[1]=7; // up/down axis
          gs.gamepadaxes[2]=3; // cam left/right axis
          gs.gamepadaxes[3]=4; // cam up/down axis
        }
        else
        if (gamepads[padid].id=="0f0d-00c1-  Switch Controller")
        {
          // Nintendo Switch
          gs.gamepadbuttons[0]=-1; // left (left) d-left
          gs.gamepadbuttons[1]=-1; // right (left) d-right
          gs.gamepadbuttons[2]=-1; // top (left) d-up
          gs.gamepadbuttons[3]=-1; // bottom (left) d-down
          gs.gamepadbuttons[4]=1;  // bottom button (right) x

          gs.gamepadaxes[0]=4; // left/right axis
          gs.gamepadaxes[1]=5; // up/down axis
          gs.gamepadaxes[2]=2; // cam left/right axis
          gs.gamepadaxes[3]=3; // cam up/down axis
        }
        else
        if ((gamepads[padid].id=="054c-05c4-Sony Computer Entertainment Wireless Controller") || (gamepads[padid].id=="045e-02e0-8Bitdo SF30 Pro") || (gamepads[padid].id=="045e-02e0-8BitDo GBros Adapter"))
        {
          // PS4 DualShock 4
          // 8Bitdo SF30 Pro GamePad (XInput mode)
          // 8Bitdo GBros. Adapter (XInput mode)
          gs.gamepadbuttons[0]=-1; // left (left) d-left
          gs.gamepadbuttons[1]=-1; // right (left) d-right
          gs.gamepadbuttons[2]=-1; // top (left) d-up
          gs.gamepadbuttons[3]=-1; // bottom (left) d-down
          gs.gamepadbuttons[4]=0;  // bottom button (right) x

          gs.gamepadaxes[0]=0; // left/right axis
          gs.gamepadaxes[1]=1; // up/down axis
          gs.gamepadaxes[2]=3; // cam left/right axis
          gs.gamepadaxes[3]=4; // cam up/down axis
        }
        else
        if ((gamepads[padid].id=="054c-0ce6-Sony Interactive Entertainment Wireless Controller") || (gamepads[padid].id=="054c-0ce6-Wireless Controller"))
        {
          // PS5 DualSense
          gs.gamepadbuttons[0]=-1; // left (left) d-left
          gs.gamepadbuttons[1]=-1; // right (left) d-right
          gs.gamepadbuttons[2]=-1; // top (left) d-up
          gs.gamepadbuttons[3]=-1; // bottom (left) d-down
          gs.gamepadbuttons[4]=1;  // bottom button (right) x

          gs.gamepadaxes[0]=0; // left/right axis
          gs.gamepadaxes[1]=1; // up/down axis
          gs.gamepadaxes[2]=2; // cam left/right axis
          gs.gamepadaxes[3]=5; // cam up/down axis
        }
        else
        if ((gamepads[padid].id=="057e-2009-Pro Controller") || (gamepads[padid].id=="18d1-9400-Google Inc. Stadia Controller") || (gamepads[padid].id=="18d1-9400-Google LLC Stadia Controller rev. A") || (gamepads[padid].id.match("/^18d1-9400-Stadia/i")))
        {
          // Nintendo Switch Pro Controller
          // 8Bitdo SF30 Pro GamePad (Switch mode)
          // 8Bitdo GBros. Adapter (Switch mode)
          // Google Stadia Controller (Wired and Bluetooth)
          gs.gamepadbuttons[0]=-1; // left (left) d-left
          gs.gamepadbuttons[1]=-1; // right (left) d-right
          gs.gamepadbuttons[2]=-1; // top (left) d-up
          gs.gamepadbuttons[3]=-1; // bottom (left) d-down
          gs.gamepadbuttons[4]=0;  // bottom button (right) x (a on Stadia)

          gs.gamepadaxes[0]=0; // left/right axis
          gs.gamepadaxes[1]=1; // up/down axis
          gs.gamepadaxes[2]=2; // cam left/right axis
          gs.gamepadaxes[3]=3; // cam up/down axis
        }
        else
        if (gamepads[padid].id=="2dc8-6100-8Bitdo SF30 Pro")
        {
          // 8Bitdo SF30 Pro GamePad (DInput mode)
          gs.gamepadbuttons[0]=-1; // left (left) d-left
          gs.gamepadbuttons[1]=-1; // right (left) d-right
          gs.gamepadbuttons[2]=-1; // top (left) d-up
          gs.gamepadbuttons[3]=-1; // bottom (left) d-down
          gs.gamepadbuttons[4]=1;  // bottom button (right) x

          gs.gamepadaxes[0]=0; // left/right axis
          gs.gamepadaxes[1]=1; // up/down axis
          gs.gamepadaxes[2]=2; // cam left/right axis
          gs.gamepadaxes[3]=3; // cam up/down axis
        }
        else
        {
          // Unknown non-"standard" mapping
          gs.gamepadbuttons[0]=-1; // left (left) d-left
          gs.gamepadbuttons[1]=-1; // right (left) d-right
          gs.gamepadbuttons[2]=-1; // top (left) d-up
          gs.gamepadbuttons[3]=-1; // bottom (left) d-down
          gs.gamepadbuttons[4]=-1;  // bottom button (right) x

          gs.gamepadaxes[0]=-1; // left/right axis
          gs.gamepadaxes[1]=-1; // up/down axis
          gs.gamepadaxes[2]=-1; // cam left/right axis
          gs.gamepadaxes[3]=-1; // cam up/down axis
        }
      }

      // Check analog axes
      for (i=0; i<gamepads[padid].axes.length; i++)
      {
        var val=gamepads[padid].axes[i];

        if (i==gs.gamepadaxes[0])
        {
          if (val<-0.5) // Left
            gleft=true;

          if (val>0.5) // Right
            gright=true;
        }

        if (i==gs.gamepadaxes[1])
        {
          if (val<-0.5) // Up
            gup=true;

          if (val>0.5) // Down
            gdown=true;
        }
      }

      // Check buttons
      for (i=0; i<gamepads[padid].buttons.length; i++)
      {
        var val=gamepads[padid].buttons[i];
        var pressed=val==1.0;

        if (typeof(val)=="object")
        {
          pressed=val.pressed;
          val=val.value;
        }

        if (pressed)
        {
          switch (i)
          {
            case gs.gamepadbuttons[0]: gleft=true; break;
            case gs.gamepadbuttons[1]: gright=true; break;
            case gs.gamepadbuttons[2]: gup=true; break;
            case gs.gamepadbuttons[3]: gdown=true; break;
            case gs.gamepadbuttons[4]: gjump=true; break;
            default: break;
          }
        }
      }

      // Update padstate
      if (gup)
        gs.player.padstate|=2;
      else
        gs.player.padstate&=~2;

      if (gdown)
        gs.player.padstate|=8;
      else
        gs.player.padstate&=~8;

      if (gleft)
        gs.player.padstate|=1;
      else
        gs.player.padstate&=~1;

      if (gright)
        gs.player.padstate|=4;
      else
        gs.player.padstate&=~4;

      if (gjump)
      {
        gs.player.padstate|=16;

        // If in menu start playing
        if (gs.state==1)
        {
          hide_screen();
          gs.state=2;
          launchgame(0);
        }

        // If in intro, skip to menu
        if (gs.state==0)
        {
          gs.timeline.end();
          hide_screen();
          gs.state=1;
          show_title();
          start_music();
        }
      }
      else
        gs.player.padstate&=~16;

      // Output button debug for unknown gamepads
      if ((gs.gamepadbuttons[0]==-1) && (gs.gamepadaxes[0]==-1))
      {
        if (pressed)
          console.log("Pressed "+i);
      }
    }
  }

  // Detect disconnect
  if ((found==0) && (gs.gamepad!=-1))
  {
    console.log("Disconnected gamepad "+padid);
    
    gs.gamepad=-1;
  }

  window.requestAnimationFrame(gamepadscan);
}

// Has this level been completed?
function levelcomplete()
{
  // Defined as - all enemies defeated and all things collected
  if ((gs.enemies.length==0) && (gs.things.length==0))
    return true;

  return false;
}

// Redraw the game world
function redraw()
{
  // Move the player
  gs.player.e.style.left=gs.player.x+"px";
  gs.player.e.style.top=gs.player.y+"px";

  // Move all the enemies
  for (var i=0; i<gs.enemies.length; i++)
  {
    gs.enemies[i].e.style.left=gs.enemies[i].x+"px";
    gs.enemies[i].e.style.top=gs.enemies[i].y+"px";
  }

  // Scroll the screen to keep the player in view
  if ((gs.player.x!=gs.player.px) || (gs.player.y!=gs.player.py))
  {
    try
    {
      window.scrollTo({left:(gs.player.x*gs.scale)-(window.innerWidth/2), top:(gs.player.y*gs.scale)-(window.innerHeight/2), behaviour:"smooth"});
    }
    catch (e)
    {
      // Fallback to 2 parameters for older browsers
      window.scrollTo((gs.player.x*gs.scale)-(window.innerWidth/2), (gs.player.y*gs.scale)-(window.innerHeight/2));
    }
  }

  // Update previous positions
  gs.player.px=gs.player.x;
  gs.player.py=gs.player.y;
}

// Does DOM element a overlap with element b
function overlap(a, b)
{
  // Check horiz
  if (a.offsetLeft<b.offsetLeft)
    if ((a.offsetLeft+a.clientWidth)<b.offsetLeft) return false;

  if (a.offsetLeft>b.offsetLeft)
    if ((b.offsetLeft+b.clientWidth)<a.offsetLeft) return false;

  // Check vert
  if (a.offsetTop<b.offsetTop)
    if ((a.offsetTop+a.clientHeight)<b.offsetTop) return false;

  if (a.offsetTop>b.offsetTop)
    if ((b.offsetTop+b.clientHeight)<a.offsetTop) return false;

  return true;
}

// Check if character collides with a tile
function collide(character, x, y)
{
  // Make a collision box for the character in the centre/bottom of their sprite
  //  1/2 the width and 1/2 the height to allow for overlaps
  var pos={
    offsetLeft:x+(character.w/3),
    offsetTop:y+(character.h/2),
    clientWidth:(character.w/4),
    clientHeight:(character.h/2)
  };

  // look through all tiles for a collision
  for (var index=0; index<gs.tiles.length; index++)
  {
    // does this tile overlap with character?
    if (overlap(gs.tiles[index], pos))
      return true;
  }

  return false;
}

// Move character by up to horizontal/vertical speeds, stopping when a collision occurs
function collisioncheck(character)
{
  // check for horizontal collisions
  if (collide(character, character.x+character.hs, character.y))
  {
    // A collision occured, so move the character until it hits
    while (!collide(character, character.x+(character.hs>0?1:-1), character.y))
      character.x+=(character.hs>0?1:-1);

    // Stop horizontal movement
    character.hs=0;
  }
  character.x+=character.hs;

/*
  // Climb stairs, TODO - revisit this if time allowing
  if ((character==gs.player) // it's the player
    && ((character.keystate!=0) || (character.padstate!=0)) // key still pressed
    && (character.dir!=0) // was moving
    && (character.hs==0) // horizontal collision occured
    && (!collide(character, character.x, character.y-character.h)) // nothing above us
    && (!collide(character, character.x+(character.w*character.dir), character.y-character.h))) // nothing above and to right
  {
    character.j=true;
    character.vs=-(character.jumpspeed/4);
  }
*/

  // check for vertical collisions
  if (collide(character, character.x, character.y+character.vs))
  {
    // A collision occured, so move the character until it hits
    while (!collide(character, character.x, character.y+(character.vs>0?1:-1)))
      character.y+=(character.vs>0?1:-1);

    // Stop vertical movement
    character.vs=0;
  }
  character.y+=character.vs;
}

// If the player has moved "off" the map, then put them back at a start position
//   this "shouldn't" happen with the border surrounding the level
function offmapcheck(character)
{
  if ((character.x<0) || (character.y>levels[gs.level].height*levels[gs.level].tileheight))
  {
    character.x=character.sx;
    character.y=character.sy;
  }
}

// Check for player being on the ground
function groundcheck(character)
{
  // Check for coyote time
  if (character.c>0)
    character.c--;

  // Check we are on the ground
  if (collide(character, character.x, character.y+1))
  {
    character.vs=0;
    character.j=false;
    character.f=false;
    character.c=15;

    // Check for jump pressed, when not ducking
    if ((ispressed(character, 16)) && (!character.d))
    {
      character.j=true;
      character.vs=-character.jumpspeed;
    }
  }
  else
  {
    // Check for jump pressed, when not ducking, and coyote time not expired
    if ((ispressed(character, 16)) && (!character.d) && (character.j==false) && (character.c>0))
    {
      character.j=true;
      character.vs=-character.jumpspeed;
    }

    // We're in the air, increase falling speed until we're at terminal velocity
    if (character.vs<gs.terminalvelocity)
      character.vs+=gs.gravity;

    // Set falling flag when vertical speed is positive
    if (character.vs>0)
      character.f=true;
  }
}

// Check for mid jump when the player is now falling
function jumpcheck(character)
{
  // When jumping ..
  if (character.j)
  {
    // Check if loosing altitude
    if (character.vs>=0)
    {
      character.j=false;
      character.f=true;
    }
  }
}

// Handle ducking and slowing player down by friction
function standcheck(character)
{
  // Check for ducking, or injured
  if ((ispressed(character, 8)) || (character.htime>0))
    character.d=true;
  else
    character.d=false;

  // When no horizontal movement pressed, slow down by friction
  if (((!ispressed(character, 1)) && (!ispressed(character, 4))) ||
      ((ispressed(character, 1)) && (ispressed(character, 4))))
  {
    // Going left
    if (character.dir==-1)
    {
      if (character.hs<0)
      {
        character.hs+=gs.friction;
      }
      else
      {
        character.hs=0;
        character.dir=0;
      }
    }

    // Going right
    if (character.dir==1)
    {
      if (character.hs>0)
      {
        character.hs-=gs.friction;
      }
      else
      {
        character.hs=0;
        character.dir=0;
      }
    }
  }
}

// Process all enemies and simulate keypresses for basic AI when they can move
function updateenemyai(character)
{
  // Check we are on the ground
  if (collide(character, character.x, character.y+1))
  {
    var tmpstate=0;

    // If we're not moving left/right, then start moving
    if (character.dir==0)
    {
      // If nothing to our right, then move right so long as there is no drop
      if ((!collide(character, character.x+1, character.y))
        && ((collide(character, character.x+(character.w/2), character.y+character.h))))
        tmpstate|=4;

      // try left
      if ((tmpstate==0)
        && (!collide(character, character.x-1, character.y))
        && (collide(character, character.x-(character.w/2), character.y+character.h)))
        tmpstate|=1;

      character.keystate|=tmpstate;
    }
    else // if moving right
    if (character.dir==1)
    {
      if ((collide(character, character.x+1, character.y))
        || (!collide(character, character.x+(character.w/2), character.y+character.h)))
        clearinputstate(character);
    }
    else // if moving left
    if (character.dir==-1)
    {
      if ((collide(character, character.x-1, character.y))
      || (!collide(character, character.x-(character.w/2), character.y+character.h)))
        clearinputstate(character);
    }
  }
}

// Update the animation state of players/enemies
//   this is so that the CSS animations or poses are actioned
function updateanimation(character)
{
  switch (character.dir)
  {
    case -1: // Left
      character.e.classList.add("left");
      character.e.classList.remove("right");
      break;

    case 0: // Not moving
      character.e.classList.remove("left");
      character.e.classList.remove("right");
      break;

    case 1: // Right
      character.e.classList.remove("left");
      character.e.classList.add("right");
      break;

    default:
      break;
  }

  // Jumping
  if (character.j)
    character.e.classList.add("jump");
  else
    character.e.classList.remove("jump");

  // Falling
  if (character.f)
    character.e.classList.add("fall");
  else
    character.e.classList.remove("fall");

  // Ducking
  if ((character.d) || (character.htime>0))
    character.e.classList.add("duck");
  else
    character.e.classList.remove("duck");

  // Hurt
  if (character.htime>0)
    character.e.classList.add("hurt");
  else
    character.e.classList.remove("hurt");

  // Not moving
  if ((character.dir==0) && (character.hs==0) && (character.vs==0))
    character.e.classList.add("idle");
  else
    character.e.classList.remove("idle");

  // Walking
  if ((character.dir!=0) && (!character.j) && (!character.f))
    character.e.classList.add("walk");
  else
    character.e.classList.remove("walk");
}

// Update the position of players/enemies
function updatemovements(character)
{
  // Check if player has left the map
  offmapcheck(character);

  // Check if player on the ground or falling
  groundcheck(character);

  // Process jumping
  jumpcheck(character);

  // Move player by appropriate amount, up to a collision
  collisioncheck(character);

  // If no input detected, slow the player using friction
  standcheck(character);

  // Move player when a key is pressed
  if ((character.keystate!=0) || (character.padstate!=0))
  {
    // Left key
    if ((ispressed(character, 1)) && (!ispressed(character, 4)))
    {
      character.hs=character.htime==0?-character.speed:-2;
      character.dir=-1;
    }

    // Right key
    if ((ispressed(character, 4)) && (!ispressed(character, 1)))
    {
      character.hs=character.htime==0?character.speed:2;
      character.dir=1;
    }
  }

  // Decrease hurt timer
  if (character.htime>0) character.htime--;

  // Apply CSS rules to match character state
  updateanimation(character);
}

// Remove all tiles which match given id
function removetilebyid(id)
{
  var removed;

  do
  {
    removed=0;

    for (var i=0; i<gs.tiles.length; i++)
    {
      if (gs.tiles[i].id==id)
      {
        gs.tiles[i].e.remove(); // remove from DOM
        gs.tiles.splice(i, 1); // remove from tile list
        removed++;
        break;
      }
    }
  } while (removed>0);
}

// Determine distance (Hypotenuse) between two lengths in 2d space (using Pythagoras)
function calcHypotenuse(a, b)
{
  return(Math.sqrt((a * a) + (b * b)));
}

// Remove the neareset tile matching a given id to an x,y position
function removenearesttilebyid(x, y, id)
{
  var nearest=-1;
  var neardelta=-1;

  for (var i=0; i<gs.tiles.length; i++)
  {
    if (gs.tiles[i].id==id)
    {
      var delta=calcHypotenuse(Math.abs(x-gs.tiles[i].offsetLeft), Math.abs(y-gs.tiles[i].offsetTop));
      if ((neardelta==-1) || (delta<neardelta))
      {
        nearest=i;
        neardelta=delta;
      }
    }
  }

  // If a tile was found, then remove it
  if (nearest!=-1)
  {
    gs.tiles[nearest].e.remove(); // remove from DOM
    gs.tiles.splice(nearest, 1); // remove from tile list
  }
}

// Clear set of items from DOM and array
function clearobjects(items)
{
  for (var i=0; i<items.length; i++)
    items[i].e.remove(); // remove from DOM

  items.splice(0, items.length); // clear array
}

// Check if player collides with a collectable item
function checkplayercollectable(character)
{
  // Make a collision box for the character in the centre/bottom of their sprite
  //  1/2 the width and 1/2 the height to allow for overlaps
  var ppos={
    offsetLeft:character.x+(character.w/4),
    offsetTop:character.y+(character.h/2),
    clientWidth:(character.w/2),
    clientHeight:(character.h/2)
  };

  // look through all enemies for a collision
  for (var i=0; i<gs.things.length; i++)
  {
    var tpos={
      offsetLeft:gs.things[i].x,
      offsetTop:gs.things[i].y,
      clientWidth:gs.things[i].w,
      clientHeight:gs.things[i].h
    };

    // does this thing overlap with character?
    if (overlap(tpos, ppos))
    {
      switch (gs.things[i].id)
      {
        case 21: // cube
          gs.score+=5;
          gs.music.play_collect(0);
          break;

        case 22: // red key
          removenearesttilebyid(gs.things[i].x, gs.things[i].y, 6);
          gs.music.play_collect(1);
          break;

        case 23: // green key
          removenearesttilebyid(gs.things[i].x, gs.things[i].y, 7);
          gs.music.play_collect(1);
          break;

        default:
          break;
      }

      // Remove thing that was collected
      gs.things[i].e.remove();
      gs.things.splice(i, 1);

      return;
    }
  }
}

// Check for collision between player and an enemy
function checkplayerenemy(character)
{
  // Make a collision box for the character in the centre/bottom of their sprite
  //  1/2 the width and 1/2 the height to allow for overlaps
  var ppos={
    offsetLeft:character.x+(character.w/4),
    offsetTop:character.y+(character.h/2),
    clientWidth:(character.w/2),
    clientHeight:(character.h/2)
  };

  // look through all enemies for a collision
  for (var i=0; i<gs.enemies.length; i++)
  {
    var epos={
      offsetLeft:gs.enemies[i].x+(gs.enemies[i].w/4),
      offsetTop:gs.enemies[i].y+(gs.enemies[i].h/2),
      clientWidth:(gs.enemies[i].w/2),
      clientHeight:(gs.enemies[i].h/2)
    };

    // does this enemy overlap with character?
    if (overlap(epos, ppos))
    {
      // Remove enemy if hit from above whilst player falling
      if (((ppos.offsetTop+(ppos.clientHeight/3))<epos.offsetTop) && (character.f))
      {
        gs.enemies[i].e.remove();
        gs.enemies.splice(i, 1);

        character.j=true;
        character.f=false;
        character.vs=-(character.jumpspeed/2);
      }
      else
      {
        // Loose health (if not already hurt)
        if (character.htime==0)
        {
          character.lf-=(character.d==true?5:10);
          showhealth();

          // Check for game over
          if (character.lf<=0)
          {
            gs.state=1;

            // Clear the playfield
            clearplayfield();

            // Clear player
            document.getElementById("player").innerHTML="";

            show_title();
          }

          character.htime=60;
          character.d=true;
        }
      }

      return;
    }
  }
}

// Create a <style> element for text
function buildalphablockstyle(pixelsize)
{
 return "<style>.alphablock { font-size:0px; display:inline-block; margin-bottom: "+(pixelsize/3)+"px; } .block { display:inline-block; width:"+pixelsize+"px; height:"+pixelsize+"px; border-top-left-radius:"+(pixelsize/2)+"px; border-bottom-right-radius:"+(pixelsize/2)+"px; } .filled { background-color:#00ff00; background: linear-gradient(to bottom, rgba(0,255,0,0) 0%,rgba(0,255,0,1) 33%,rgba(0,255,0,1) 66%,rgba(0,255,0,0) 100%); }</style>";
}

// Update the game state prior to rendering
function update()
{
  // Apply keystate/physics to player
  updatemovements(gs.player);

  // Apply keystate/physics to enemies
  for (var i=0; i<gs.enemies.length; i++)
  {
    updateenemyai(gs.enemies[i]);
    updatemovements(gs.enemies[i]);
  }

  // Check for player/enemy collision
  checkplayerenemy(gs.player);

  // Check for player/collectable collision
  checkplayercollectable(gs.player);
}

// Request animation frame callback
function rafcallback(timestamp)
{
  // First time round, just save epoch
  if (gs.lasttime>0)
  {
    // Determine accumulated time since last call
    gs.acc+=((timestamp-gs.lasttime) / 1000);

    // If it's more than 15 seconds since last call, reset
    if ((gs.acc>gs.step) && ((gs.acc/gs.step)>(60*15)))
      gs.acc=gs.step*2;

    // Process "steps" since last call
    while (gs.acc>gs.step)
    {
      update();
      gs.acc-=gs.step;
    }

    // If the update took us out of play state then stop now
    if (gs.state!=2)
      return;

    // Check for level complete
    if (levelcomplete())
    {
      var level=gs.level+1;

      // Check for all levels completed
      if (level>=levels.length)
      {
        // Show game completed screen
        gs.state=3;

        // Clear the playfield
        clearplayfield();

        // Position player on screen and large
        gs.player.e.style.left="33%";
        gs.player.e.style.top="33%";
        gs.player.e.style.width="256px";
        gs.player.e.style.height="256px";
        gs.player.e.classList.remove("left");
        gs.player.e.classList.remove("right");
        gs.player.e.classList.remove("jump");
        gs.player.e.classList.remove("fall");
        gs.player.e.classList.remove("duck");
        gs.player.e.classList.remove("walk");

        var screen=document.getElementById("ui");
        var domtext=buildalphablockstyle(12)+"<div id=\"title\" style=\"background:none;\"></div>";

        // Show which level we are on using a UI overlay
        screen.innerHTML=domtext;
        gs.writer.write("title", "YAY! WE'RE BACK ONLINE!!");

        setTimeout(function(){ document.getElementById("player").innerHTML=""; show_title(); gs.state=1; }, 20000);
      }
      else
        launchgame(level);
    }

    // Redraw the game world
    redraw();
  }

  // Remember when we were last called
  gs.lasttime=timestamp;

  // Request we are called on the next frame, but only if still playing
  if (gs.state==2)
    window.requestAnimationFrame(rafcallback);
}

// Update the player key state
function updatekeystate(e, dir)
{
  switch (e.which)
  {
    case 37: // cursor left
    case 65: // A
    case 90: // Z
      if (dir==1)
        gs.player.keystate|=1;
      else
        gs.player.keystate&=~1;
      e.preventDefault();
      break;

    case 38: // cursor up
    case 87: // W
    case 59: // semicolon
      if (dir==1)
        gs.player.keystate|=2;
      else
        gs.player.keystate&=~2;
      e.preventDefault();
      break;

    case 39: // cursor right
    case 68: // D
    case 88: // X
      if (dir==1)
        gs.player.keystate|=4;
      else
        gs.player.keystate&=~4;
      e.preventDefault();
      break;

    case 40: // cursor down
    case 83: // S
    case 190: // dot
      if (dir==1)
        gs.player.keystate|=8;
      else
        gs.player.keystate&=~8;
      e.preventDefault();
      break;

    case 13: // enter
    case 32: // space
      if (dir==1)
        gs.player.keystate|=16;
      else
        gs.player.keystate&=~16;
      e.preventDefault();

      // If in menu start playing
      if (gs.state==1)
      {
        hide_screen();
        gs.state=2;
        launchgame(0);
      }
      break;

    case 27: // escape
      // If in intro, skip to menu
      if (gs.state==0)
      {
        gs.timeline.end();
        hide_screen();
        gs.state=1;
        show_title();
        start_music();
      }

      // If playing, go back to menu
      if (gs.state==2)
      {
        gs.state=1;

        // Clear the playfield
        clearplayfield();

        // Clear player
        document.getElementById("player").innerHTML="";

        show_title();
      }
      e.preventDefault();
      break;

    default:
      break;
  }
}

// Add a single tile as a DIV to the DOM and tiles array
function addtile(x, y, tileid, content)
{
  var tile=document.createElement("div");
  var tileobj={};

  // Set properties for DOM object
  tile.innerHTML=content;
  tile.style.position="absolute";
  tile.style.left=x+"px";
  tile.style.top=y+"px";
  tile.style.width=gs.tilewidth+"px";
  tile.style.height=gs.tileheight+"px";
  tile.classList.add("tile");
  tile.classList.add("tile_"+tileid);

  // Set properties for tiles array entry
  tileobj.e=tile;
  tileobj.id=tileid;
  tileobj.offsetLeft=x;
  tileobj.offsetTop=y;
  tileobj.clientWidth=gs.tilewidth;
  tileobj.clientHeight=gs.tileheight;

  // Add to tiles array
  gs.tiles.push(tileobj);

  document.getElementById("playfield").appendChild(tile);
}

// Add all the tiles to the playfield for a given level
function addtiles(level)
{
  var x, y, tile, content;

  // Add a border
  for (y=0; y<(level.height+2); y++)
  {
    addtile(0, y*level.tileheight, 1, "");
    addtile((level.width+1)*level.tilewidth, y*level.tileheight, 1, "");
  }
  for (x=0; x<(level.width+2); x++)
  {
    addtile(x*level.tilewidth, 0, 1, "");
    addtile(x*level.tilewidth, (level.height+1)*level.tileheight, 1, "");
  }

  // Add all the tiles from level
  for (y=0; y<level.height; y++)
  {
    for (x=0; x<level.width; x++)
    {
      tile=level.layers[0].data[(y*level.width)+x]||0;

      switch (tile)
      {
        case 2:
        case 3:
        case 4:
        case 5:
          var svg='<svg width="64" height="64" xmlns="http://www.w3.org/2000/svg"><path d="m37 19 11 6 11-6 5 3V4H0v18l5 3 11-6 11 6 10-6" fill="#2185d5"/><path d="M64 4V0H0v4h64" fill="#2493ec"/><path d="m27 49-6-3-5-3-11 6-5-3v18h64V46l-5-3-11 6-11-6-10 6" fill="#303841"/><path d="m27 31-6-4-5-3-11 7-5-4v19l5 3 11-6 5 3 6 3 10-6 11 6 11-6 5 3V27l-5-3-11 7-11-7-10 7" fill="#3a4750"/><path d="m48 25-11-6-10 6-11-6-11 6-5-3v5l5 4 11-7 5 3 6 4 10-7 11 7 11-7 5 3v-5l-5-3-11 6" fill="#f3f3f3"/></svg>';

          // Change SVG colours per level
          switch (gs.level % 4)
          {
            case 1:
              svg=svg.replace("#2493ec", "#ff5960");
              svg=svg.replace("#2185d5", "#dd4e54");
              svg=svg.replace("#f3f3f3", "#ead94c");
              svg=svg.replace("#3a4750", "#5d433e");
              svg=svg.replace("#303841", "#4a3632");
              break;

            case 2:
              svg=svg.replace("#2493ec", "#ffe580");
              svg=svg.replace("#2185d5", "#ffd944");
              svg=svg.replace("#f3f3f3", "#94dd4d");
              svg=svg.replace("#3a4750", "#49b47e");
              svg=svg.replace("#303841", "#409f6e");
              break;

            case 3:
              svg=svg.replace("#2493ec", "#3a7080");
              svg=svg.replace("#2185d5", "#2c5460");
              svg=svg.replace("#f3f3f3", "#bbdc2f");
              svg=svg.replace("#3a4750", "#67bd39");
              svg=svg.replace("#303841", "#59a331");
              break;

            default:
              break;
          }

          content=svg;
          break;

        case 6: // Green Lock
        case 7: // Red Lock
         content="<div class=\"boltnw\"></div><div class=\"boltne\"></div><div class=\"boltsw\"></div><div class=\"boltse\"></div><div class=\"keyhole\"></div><div class=\"keyhole2\"></div>";
         break;

        default:
          content="";
          break;
      }

      // If it's not blank space, then add the tile
      if (tile!=0)
        addtile((x+1)*level.tilewidth, (y+1)*level.tileheight, tile, content);
    }
  }
}

// Add a single enemy to the DOM and enemies array
function addenemy(x, y, w, h, enemyclass)
{
  var enemy=document.createElement("div");
  var enemyobj=new st(enemy);

  // Set DOM properties
  enemy.innerHTML="<div class=\"body\"><div class=\"eye\"><div class=\"iris\"></div></div></div><div class=\"eyelid\"></div><div class=\"leg rightleg\"></div><div class=\"leg leftleg\"></div>";
  enemy.style.position="absolute";
  enemy.style.left=x+"px";
  enemy.style.top=y+"px";
  enemy.style.width=w+"px";
  enemy.style.height=h+"px";
  enemy.classList.add(enemyclass);

  // Set properties for entry in enemies array
  enemyobj.sx=enemyobj.x=x;
  enemyobj.sy=enemyobj.y=y;
  enemyobj.w=w;
  enemyobj.h=h;
  enemyobj.speed=2;

  // Add to enemies array
  gs.enemies.push(enemyobj);

  document.getElementById("playfield").appendChild(enemy);
}

// Add all enemies and player to the playfield for a given level
function addcharacters(level)
{
  var obj, index;

  for (index=0; index<level.layers[1].objects.length; index++)
  {
    obj=level.layers[1].objects[index];

    switch (obj.gid)
    {
      case 11: // Player
        gs.player.sx=gs.player.x=(obj.x+level.tilewidth);
        gs.player.sy=gs.player.y=obj.y;
        gs.player.e.style.width=level.tilewidth+"px";
        gs.player.e.style.height=level.tileheight+"px";
        gs.player.e.style.left=gs.player.x+"px";
        gs.player.e.style.top=gs.player.y+"px";
        break;

      case 12: // Enemy
        addenemy(obj.x+level.tilewidth, obj.y, level.tilewidth, level.tileheight, "enemy");
        break;

      default:
        break;
    }
  }
}

// Add a single collectable item to the DOM and things array
function addcollectable(x, y, id)
{
  var thing=document.createElement("div");
  var thingobj={};

  // Set properties for DOM object
  thing.innerHTML="";
  thing.style.position="absolute";
  thing.style.left=x+"px";
  thing.style.top=y+"px";
  thing.classList.add("thing");
  thing.classList.add("thing_"+id);

  // Change SVG colours of keys as appropriate
  switch (id)
  {
    case 22:
    case 23:
      var svg='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><path d="M43 20c-4-5-13-4-16 2-1 2-2 6-1 8s-1 4-2 5l-6 6c-2 3 1 6 4 6l4-1c1-1 0-3 2-4 1 0 3 1 3-1l-1-3c4 0 8 1 11-1 5-3 7-11 4-15l-2-2m-11 8c0-4 4-6 7-4 2 2 1 7-2 8-3 0-5-2-5-4z" fill="#dd4e54"/></svg>';
      if (id==22) // make green key green
        svg=svg.replace("#dd4e54", "#49b47e");

      thing.innerHTML=svg;
      break;

    default:
      break;
  }

  // Set properties for new things array item
  thingobj.e=thing;
  thingobj.id=id;
  thingobj.x=x;
  thingobj.y=y;
  thingobj.w=levels[gs.level].tilewidth;
  thingobj.h=levels[gs.level].tileheight;

  // Add to things array
  gs.things.push(thingobj);

  document.getElementById("playfield").appendChild(thing);
}

// Add all the collectables for a given level
function addcollectables(level)
{
  var obj, index;

  for (index=0; index<level.layers[2].objects.length; index++)
  {
    obj=level.layers[2].objects[index];

    addcollectable(obj.x+level.tilewidth, obj.y, obj.gid);
  }
}

// Add a single "star" to the background
function addstar(x, y)
{
  var star=document.createElement("div");

  star.style.left=x+"px";
  star.style.top=y+"px";
  star.classList.add("star");

  document.getElementById("background").appendChild(star);
}

// Clear the playfield
function clearplayfield()
{
  // Clear any existing tiles
  clearobjects(gs.tiles);

  // Clear any existing collectables
  clearobjects(gs.things);

  // Clear any existing characters
  clearobjects(gs.enemies);

  // Clear stars
  var bg=document.getElementById("background");
  bg.innerHTML="";
  bg.style.width="0px";
  bg.style.height="0px";

  // Reset scroll
  window.scrollTo(0,0);
}

// All the processing required to load the current level into the playfield
function loadlevel()
{
  // Set which level we are on
  var level=gs.level;
  gs.tilerows=levels[level].height;
  gs.tilecolumns=levels[level].width;
  document.getElementById("playfield").setAttribute("level", level % 4);

  // Reset collectable
  gs.score=0;

  // Clear the playfield of tiles, things and enemies
  clearplayfield();

  // Add the tiles for the level
  addtiles(levels[level]);

  // Add the collectables
  addcollectables(levels[level]);

  // Add the characters
  addcharacters(levels[level]);

  // Restore health to 100%
  gs.player.lf=100;
}

// Show health when it's lost
function showhealth()
{
  var screen=document.getElementById("ui");
  var domtext=buildalphablockstyle(12)+"<div id=\"health\"></div>";
  var healthdisplay="";

  for (var i=0; i<10; i++)
  {
    if (gs.player.lf>=((i+1)*10))
      healthdisplay+="|";
    else
      healthdisplay+="-";
  }

  screen.innerHTML=domtext;
  gs.writer.write("health", healthdisplay);

  setTimeout(function(){ var hdiv=document.getElementById("health"); if ((hdiv!=undefined) && (hdiv!=null)) hdiv.innerHTML=""; }, 3000);
}

// Launch game
function launchgame(level)
{
  var screen=document.getElementById("ui");
  var domtext=buildalphablockstyle(12)+"<div id=\"title\" style=\"background:none;\"></div>";

  // Show which level we are on using a UI overlay
  screen.innerHTML=domtext;
  gs.writer.write("title", "Level "+(level+1));
  setTimeout(function(){ if (gs.state==2) document.getElementById("ui").innerHTML=""; }, 3000);

  /////////////////////////////////////////////////////
  // Start game
  gs.level=level;
  gs.player.e=document.getElementById("player");
  gs.player.w=levels[gs.level].tilewidth;
  gs.player.h=levels[gs.level].tileheight;
  gs.player.e.innerHTML="<div class=\"body\"><div class=\"eye\"><div class=\"iris\"></div></div><div class=\"eyelid\"></div></div><div class=\"leg rightleg\"></div><div class=\"leg leftleg\"></div>";

  // Load everything for "current" level
  loadlevel();

  // Resize background to fit playfield
  var bg=document.getElementById("background");
  bg.style.width=((gs.tilecolumns+2)*gs.tilewidth)+"px";
  bg.style.height=((gs.tilerows+2)*gs.tileheight)+"px";

  // Add some stars to the background
  for (var i=0; i<300; i++)
    addstar(gs.randoms.rnd(gs.tilecolumns*gs.tilewidth), gs.randoms.rnd(gs.tilerows*gs.tileheight));

  // Start the game running
  window.requestAnimationFrame(rafcallback);
}

// Display the title screen
function show_title()
{
  /////////////////////////////////////////////////////
  // Main menu
  var screen=document.getElementById("ui");
  var domtext=buildalphablockstyle(12)+"<div id=\"title\"></div><div id=\"backstory\"></div>";

  screen.innerHTML=domtext;
  gs.writer.write("title", "Planet");
  gs.writer.write("title", "FIGADORE");
  gs.writer.write("title", "has gone");
  gs.writer.write("title", "OFFLINE!");

  gs.writer.write("backstory", "Fred lives on planet Figadore in the Hercules cluster, he likes watching cat videos from planet Earth, but the network link has gone OFFLINE!  Help Fred by unlocking doors, solving puzzles and collecting cubes to pay for the entanglement repolarisation required to get his planet back online. Keys unlock nearest lock of same colour, you need to collect all the gold cubes and squash all the guards to progress through the levels."+String.fromCharCode(13)+" "+String.fromCharCode(13)+"WASD or cursors to move, ENTER or SPACE to jump, or browser supported gamepad. Press jump to start");
}

// Show the intro console
function show_screen(pixelsize)
{
  var screen=document.getElementById("ui");
  var domtext=buildalphablockstyle(pixelsize)+"<div id=\"console\">";
  for (var i=1; i<8; i++)
    domtext+="<span id=\"console_"+i+"\"></span>";

  domtext+="<span id=\"cursor\"></span></div>";

  screen.innerHTML=domtext;
}

// Hide the intro console
function hide_screen()
{
  var screen=document.getElementById("ui");
  screen.innerHTML="";
}

function start_music()
{
  // Play some procedurally generated music
  gs.music.play_tune();

  // Set up automatic repeats
  setInterval(function(){ gs.music.randoms.seeda=3; gs.music.randoms.seedb=6; gs.music.randoms.seedc=6; gs.music.randoms.seedd=4; gs.music.play_tune(); }, ((1*60)+42)*1000);
}

// Handle resize events
function playfieldsize()
{
  gs.scale=(window.innerWidth/(gs.tilewidth*12));

  document.getElementById("wrapper").style="width:"+(gs.tilewidth*10)+"px; height:"+(((gs.tilewidth*10)/4)*3)+"px; transform-origin:0px 0px; transform:scale("+gs.scale+");";

  // Move the view if required
  try
  {
    window.scrollTo({left:(gs.player.x*gs.scale)-(window.innerWidth/2), top:(gs.player.y*gs.scale)-(window.innerHeight/2), behaviour:"smooth"});
  }
  catch (e)
  {
    // Fallback to 2 parameters for older browsers
    window.scrollTo((gs.player.x*gs.scale)-(window.innerWidth/2), (gs.player.y*gs.scale)-(window.innerHeight/2));
  }
}

// Initial entry point
function init()
{
  /////////////////////////////////////////////////////
  // Initialise stuff
  document.onkeydown=function(e)
  {
    e = e || window.event;
    updatekeystate(e, 1);
  };

  document.onkeyup=function(e)
  {
    e = e || window.event;
    updatekeystate(e, 0);
  };

  // Stop things from being dragged around
  window.ondragstart=function(e)
  {
    e = e || window.event;
    e.preventDefault();
  };

  // Gamepad support
  if (!!(navigator.getGamepads))
    window.requestAnimationFrame(gamepadscan);

  window.addEventListener("resize", function()
  {
    playfieldsize();
  });

  playfieldsize();

  /////////////////////////////////////////////////////
  // Intro
  show_screen(4);

  gs.timeline.add(0, function(){ gs.writer.write("cursor", "_"); });
  gs.timeline.add(0, function(){ gs.writer.typewrite("console_1", "search 'cat videos'"); });
  gs.timeline.add(3000, function(){ gs.writer.write("console_2", "CONNECTING TO PARALLAX SHIFT..."); });
  gs.timeline.add(3100, function(){ gs.dialler.randomdial(10); });
  gs.timeline.add(3100, function(){ gs.dialler.carriertone(10); });
  gs.timeline.add(11000, function(){ gs.writer.write("console_3", "418 OFFLINE"); });
  gs.timeline.add(12000, function(){ gs.writer.typewrite("console_4", "run project 23"); });
  gs.timeline.add(15000, function(){ gs.writer.write("console_5", "451 PARTICLE ACCELERATOR NOT CHARGED"); });
  gs.timeline.add(16000, function(){ gs.writer.typewrite("console_6", "execute order 66"); });
  gs.timeline.add(19000, function(){ gs.writer.write("console_7", "429 FILE NOT FOUND"); });
  gs.timeline.add(20000, function(){ hide_screen(); gs.state=1; show_title(); start_music(); });

  gs.timeline.addcallback(function(){ gs.writer.typechar(); } );

  gs.timeline.begin();
}

// Run the init() once page has loaded
window.onload=function() { init(); };
