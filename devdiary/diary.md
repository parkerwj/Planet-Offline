# Dev Diary / Postmortem

![Planet Figadore has gone OFFLINE](../big_screenshot.png?raw=true "Planet Figadore has gone OFFLINE")

This was my first game jam entry which I found out about via GitHub, also my first HTML5/JS game. Once I'd heard about the jam I watched loads of review videos by [Jupiter Hadley](https://www.youtube.com/watch?v=Izp3Vvx6F2E&list=PLYKU1lvSF85c4UPV3J1onIf-Qv13GJ7H8) from last year's competition and played lots of the games from all previous years.

My main goals were :

* 2D platformer with a retro feel
* Full screen
* No canvas elements
* No 3rd party libraries
* All visual elements vector based
* Use CSS animations
* Procedurally generated music
* Sound effects
* Gamepad support

What follows is a rough diary of progress..

13th August
-----------
I started with a concept of a DTMF modem dialler sound with carrier via web audio as a kind of nod to failing to get online in days gone by. I got the note frequency values from the wikipedia page on [DTMF](https://en.wikipedia.org/wiki/Dual-tone_multi-frequency_signaling). This used a seeded pseudo random number generator to give random digits to dial.

I created a bash script to run the build process which would create a folder, pack everything into it, zip it up and report the resulting file size.

To remain in keeping with the retro theme I decide to incorporate a tiny 8-bit font inspired by the [BBC Micro game Repton](http://www.reptonresourcepage.co.uk/). This was to become the only font used and can be seen in the terminal within the intro. The pixels in the font were converted individually into div elements with gradient fill and rounded corners.

Already being concious of the 13kb limit, I started removing bits of code which would never be executed or reducing bits that would.

The basic player/enemy state was added with a number of physics attributes once I'd decided to make a 2d platform game. I'd recently watched some youtube videos on the physics required. Particularly useful was the [GameMaker Platform tutorial on platform game mechanics](http://youtu.be/CfHmiFUtWT4)

The basic layout and framework for the game loop called by [requestAnimationFrame](https://developer.mozilla.org/en-US/docs/Web/API/window/requestAnimationFrame) was added, it included a notion of accumulated time since the last call so that the game would run as many update steps as necessary but only one redraw would occur.

14th August
-----------
Added keyboard support, which updated a key bitfield that I displayed on-screen in realtime for testing.

After reading up on [gamepads in browsers](https://developer.mozilla.org/en-US/docs/Web/API/Gamepad_API/Using_the_Gamepad_API), I then decided to add support for gamepads, this fed into the same key bitfield so that you can use either control method.

There was a few quirks of gamepad support which I discovered. Firstly that not many gamepads were support out of the box, and only a handful would appear with "standard" mapping. Also some gamepads didn't always give connect events so I needed to add scanning for ones already connected.

15th August
-----------
![Player avatar](aug15.png?raw=true "Player avatar")

Added the player avatar as a single red square and applied physics to him to test the control methods. I simply clamped the ground at 500 pixels to test jumping and gravity.

The player movement felt a little stuttery at times so I added a [CSS 3D transform](https://blog.teamtreehouse.com/increase-your-sites-performance-with-hardware-accelerated-css) to try to force 3D acceleration.

Having previously played a few 2D platformers I wanted to add support for the character ducking, to get through tight spaces. Although I ended up just using duck as a form of defence to lessen health loss on enemy collision.

Added some basic collision detection functions which checked for a pair of DOM elements overlapping.

16th August
-----------
Wrote a small C program to convert the [8 bit font](https://github.com/picosonic/js13k-2018/blob/master/font.js) to hex values to save space.

![Tiny 8 bit font](../alpha.png?raw=true "Tiny 8 bit font")

17th August
-----------
![Test tiles and enemy](aug17.png?raw=true "Test tiles and enemy")

When the player stops moving they get updated to directionless state, this was for future animation so they would look in the direction they were moving or facing.

Added some test tiles and tile collision routines. Also added a test enemy.

I decided that enemy movement would be controlled by them also having a key state bitfield that they would "press" when they had determined they could move in that direction. This made the physics and movement processing easier and more concise.

18th August
-----------
Applied physics and basic patrolling AI to the enemies.

After getting some feedback I changed the jump key to Space and Enter rather than just use the Up key. This was incase I decided to use ladders or ropes later in development.

20th August
-----------
![Tile graphics update](aug20.png?raw=true "Tile graphics update")

Made the enemies move slower than the player.

Decided to use CSS animations so added classes for different player states, such as walking.

I came across the [Kenney.nl](https://kenney.nl/) site and particularly liked the [abstract 2d platformer](https://kenney.nl/assets/abstract-platformer) graphics, so decided to incorporate them into my game since they were CC0 licensed. I achieved this by placing div elements for body, arms, legs, eyes e.t.c. Then using CSS animations to move the div elements.

I thought the background was a bit bland so added a linear gradient to give a feel of night time.

I decided to change the tile size to 64x64 pixels as this can be divided better and fitted the screen better. This did require some rework on the animations and character element positions.

21st August
-----------
![Player ducking](aug21.png?raw=true "Player ducking")

To simplify the various CSS animation transitions, I decided to remove the little changes of class to the characters and instead put it all into a single function which could be applied to all characters.

Reduced the size of the SVG tile as it contained lots of data which wasn't needed to render.

Added player ducking and falling animations, also made the player look up or down depending on if they are jumping or falling. Found that the player seemed more natural when leaning in the direction they are moving.

I found that if I went to a different browser tab then back, the game could freeze up a bit whilst running the simulation update for the elapsed time. To reduce this I limit the update delta to 15 seconds since previous update.

22nd August
-----------
Added test for player/enemy collision detection. This simply checks for an overlap in the collision box for the player and each of the enemies.

I'd now decided on a game title (with help from my son) and basic aim that a character from another planet needed help getting back online.

Added background and foreground div elements with a view to adding parallax scrolling, however I ended up removing these when I ran out of KBs. Also added stars to the background to emphasise the night setting.

To save space I decided to only include a single SVG tile, with the left and right corners and edges being done with CSS rounded corners.

Now I felt it was time to start creating some levels. I used Tiled to create a basic 100x15 tile test level. As the playfield was now increasing in size, I added code to use the browser's built in [scrollto](https://developer.mozilla.org/en-US/docs/Web/API/Window/scrollTo) function to keep the player in the centre of the view.

For Tiled to work I had to create some sprite sheets, these are only used in Tiled and not in the game.

![Character sheet](../charsheet.png?raw=true "Character sheet")
![Collect sheet](../collectsheet.png?raw=true "Collect sheet")
![Tile sheet](../tilesheet.png?raw=true "Tile sheet")

Fixed enemy AI.

23rd August
-----------
![Locks and keys](aug23.png?raw=true "Locks and keys")

Added the ability to climb stairs when 1 tile high steps to make the character flow better.

Allow player to remove enemies from the playfield when jumping on them from above.

Reduced level data size by removing spaces and zeroes.

Added character start point to allow for respawing where they start per level rather than always at 0,0.

I included some more on the game goal and character backstory.

Added some collectable gold cubes and concept of coloured locks and matching keys. The locks are done with div elements, the keys are simplified SVG images. Both have colours changed by text replacement.

Found the levels were taking up too much space, so got rid of some unused Tiled attributes.

The player was getting stuck in larger levels, this turned out to be due to the y value breaching the initial floor which was used for the gravity tests.

Made keys unlock all locks of the same colour and remove them from the DOM.

24th August
-----------
![Level border](aug24.png?raw=true "Level border")

Added scoring, although this is never shown on the UI so I could have taken this out to save space.

Loose health when hit by enemies.

Updated test level to add more tests.

Tested sound when collecting golden cubes, by using DTMF "D" tone, but it didn't sound right. Also tried a random DTMF tone, this also wasn't quite right.

Found an issue with audio.

Added third level.

Also added a border to the Tiled level so that the player couldn't fall out of the level as this was taking away from the pace of the game.

Added clearing of tiles/things/enemies when changing levels.

Tested further minification using [packer](http://dean.edwards.name/packer/). Which although makes files smaller in most cases by using lookup tables for common words/phrases, the resulting file doesn't compress as well in a .zip as a file which hasn't been packed.

Added some very basic procedurally generated music using note digraphs frequency tables to try to make the "music" sound less generated. This was inspired by a chapter in the book [Advanced Programming Techniques For The BBC Micro](http://www.computinghistory.org.uk/det/8866/Advanced-Programming-Techniques-for-the-BBC-Micro/).

Found the enemies were too fast, so slowed them down more.

Fixed the stars not fitting the whole of the level background size.

25th August
-----------
Added a hurt period following enemy collision, this was needed to stop the player loosing all their health really quickly due to multiple hits as part of the same collision. It also makes the character duck and walk lower to the ground to indicate the injured state.

26th August
-----------
Found out that on some browsers and certain platforms that [there is a limit to the number of audio contexts you can use](https://developer.mozilla.org/en-US/docs/Web/API/AudioContext/AudioContext#Usage_notes) and that they don't get garbage collected quickly enough. I changed the audio functions to try and use the least amount possible.

Fixed some issues with levels following play testing, enemies were too hard to squash, keys were in the wrong place and some areas were just plain inaccesible.

27th August
-----------
Improved player and enemy animations including making them both blink so they'd appear more likeable.

Made level 2 more playable.

Added a test for level completion - once there are no more collectables and no more enemies.

28th August
-----------
![Different tile colour scheme](aug28.png?raw=true "Different tile colour scheme")

Realised the obvious, that SVG in text form takes up less space than in base64 form (it takes 4 ascii bytes to represent 3 input bytes).

To make levels feel different, added code to change tile colours by swapping out fill colour in SVG.

I liked the way [anime.js](http://animejs.com/) could create animations from timelines, and wanted to incorporate generic timelines to fire functions at certain predefined points in time. So created my own since anime.js would be way too big to include.

Worked on game state machine and used new timeline to add a basic intro.

29th August
-----------
Added a fourth level.

While thinking of ways to add longevity, I decided to change the key - lock mechanism such that only the nearest lock of the same colour would be unlocked for each key. This allowed me to make the levels much more complicated with more exploring and route planning required by the player.

31st August
-----------
Added a title screen with some character back story. I found that when adding lots of text the browser would be slowed down by the large number of div elements being generated to render the pixel font. I solved this by splitting the terminal into a few different areas rather than adding elements to the same parent element.

1st September
-------------
![Health bar](sep1.png?raw=true "Health bar")

I thought the player could do with a notion of remaining health each time an enemy collision happens, so add an OSD for a health bar. This is shown every time health is lost and the bars represent 10% each. Each level is started with 100% health. This is designed to look like an old CRT TV OSD volume control indicator.

Added a check for game over when the player runs out of health. This clears the play field of collectables, tiles and enemies and returns to the title screen.

Decided to slow the character movement down when they are hit to enhance the feel of them being injured.

2nd September
-------------
Improve the visual appearance of the gold cubes by making them appear to float up and down in mid air. This also draws attention to them to make them stand out from the background.

Some play testing highlighted the character didn't stop quickly enough when controls were released. So decided to increase friction.

Changed tile palettes and fixed key delta calculations.

3rd September
-------------
Decided to move the large test level to level 5 and make the new level 1 a bit harder as it felt to easy to complete. Possibly should have left level 1 as an introductory level and gradually made the levels harder.

I'd originally intended to include code to allow the mapping of non-"standard" gamepads, but it required the addition of a UI which I didn't have much space for, so took out support for it.

Suddenly thought that the project needed some more comments, so went through added them where I felt they were needed.

During play testing with levels that incorporate 1-way tunnels I thought it might be good to be able to get back to the menu without having to press f5 and sit through the intro again. So I added support the Escape key to return to menu.

More level updates, mostly to make the levels harder.

Decided that on some levels where you have to pass an enemy in order to squash them that if you ducked prior to collision, then only half the amount of health would be lost.

Found the intro text wrapped oddly (mid word) when the browser was running at different resolutions. To combat this I added span elements around each word being written, and marked them as non breaking.

A quick check showed that I was over the 13k limit, so time to scale things back. Found the [Google closure compiler](https://closure-compiler.appspot.com/home) excellent for reducing file size. Also after identifying the levels as being a large use of space, I removed loads more attributes that Tiled added which I wasn't going to use.

I read an article on improving zip compression of CSS and it suggested creating repeated sections by moving the order rules appeared in a selector (e.g. alphabetical) to increase the likelyhood of some matches. This didn't seem to have much difference on file sizes.

Reworked CSS generation for font writing to reduce duplication.

Added a basic game completed screen.

4th September
-------------
Feeling close to being able to submit the game, so decided to create the required screenshots.

Added playback of the procedurally generated music.

Removed the browser prefixed CSS rules to save more space. This would only really affect older browsers.

Revisited levels again to make them a bit harder.

Added sound effects when collecting gold cubes and keys.

Unfortunatly I was still way over budget in the 13kb limit so removed the gamepad support. I also compacted the 8 bit font more, by converting the hex to decimal as a max 3 character decimal value is always less than a hex value which always has 4 characters.

Other space savings I did were to remove level 4, reduce the SVG for the key quite severely.

Then late on I discovered [advzip](https://github.com/amadvance/advancecomp) being discussed on one of the links from previous years postmortems. Anyway it saved me enough space to be able to re-add gamepad support - yay.

5th September
-------------
Shrunk level 4 to a small but deadly level to allow for expansion of the final level - level 5.

Play testing revealed a hard to squash enemy on level 4, so removed him.

I was happy with the game as a whole so decided to submit, there was only 94 bytes to spare after all and I wouldn't have been able to fit much more in.

Feeling a great sense of relief that the pressure was off to shrink the game more, I went about documenting the stuff I'd managed to add, the tools I'd used and the stuff I'd have done if I'd have more KBs to play with.


Summary
-------
I really enjoyed the challenge of creating a JS game in 13kb in just a month (although I was done after about 3 weeks). The combination of the filesize and timescale were just about right.

If I had more KBs remaining, I'd have continued by adding the following :

* More types of enemy
* Parallax scrolling backgrounds
* Better music (had to lower volume to make it more acceptable)
* Foliage or other scenery
* Support for going up stairs (this was almost working)
* Better enemy AI (more then just patrolling, perhaps jumping, line-of-sight wake up, e.t.c)
* More sound effects perhaps enhanced with [envelopes](https://en.wikipedia.org/wiki/Synthesizer#ADSR_envelope)
* Mobile/Tablet support
* Better game completed screen
* Animate the stars to twinkle
* Enemy squash and puzzle animations

The list of tools I used during development is :

* [Ubuntu OS](https://www.ubuntu.com/)
* [vim](https://github.com/vim) text editor (also [gedit](https://github.com/GNOME/gedit) a bit)
* [meld](https://github.com/GNOME/meld) visual diff/merge
* [Tiled](https://github.com/bjorn/tiled) map editor
* [Inkscape](https://github.com/inkscape/inkscape) SVG editor
* [GIMP](https://github.com/GNOME/gimp) image editor
* [Google closure compiler](https://closure-compiler.appspot.com/home)
* [advzip](https://github.com/amadvance/advancecomp) (uses [7-Zip](https://sourceforge.net/projects/sevenzip/files/7-Zip/) deflate to compress further)

I had help choosing the main character name and planet name from my 3yr old son.
Also I had help designing some levels from Jessica Vines and play testing from Adrian Purser.

I look forward to entering again next year.
