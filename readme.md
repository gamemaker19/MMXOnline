## Overview

This is the repo for the (now defunct) web version of MMX Online Deathmatch. This was the very first prototype version of MMXOD, even before the desktop version. This version does not have online multiplayer or most of the features in the MMXOD desktop version and only has X and Zero with very limited movepools. However, it does uniquely support local 1v1 multiplayer (something that is not supported in the newer desktop version!).

The game can be run here in the browser: https://gamemaker19.github.io/MMXOnline/

This repo also hosts release builds of the newer desktop version of MMXOD which can be found here: https://gamemaker19.github.io/MMXOnlineDesktop/

## Local development

Run these for the first time:

npm install -g typescript
npm i

Run these in separate terminal tabs:

tsc -w
node server.js

Navigate here to play:
http://localhost:8080/