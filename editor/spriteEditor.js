var data = {
  sprites: [],
  selectedSprite: null,
  spritesheets: [],
  selectedSpritesheet: null,
  selectedHitbox: null,
  selectedFrame: null,
  isAnimPlaying: false,
  addPOIMode: false,
  alignments: [ "topleft", "topmid", "topright", "midleft", "center", "midright", "botleft", "botmid", "botright"],
  wrapModes: ["loop", "once", "pingpong", "pingpongonce"],
  zoom: 5,
  offsetX: 0,
  offsetY: 0,
  hideGizmos: false,
  flipX: false,
  flipY: false,
  bulkDuration: 0,
  newSpriteName: "",
  selectedPOI: null,
  ghost: null
};

var canvas1DefaultWidth = 700;
var canvas1DefaultHeight = 600;

var canvas1 = $("#canvas1")[0];
var canvas2 = $("#canvas2")[0];

var helperCanvas = document.createElement("canvas");
var helperCtx = helperCanvas.getContext("2d");

var canvas2Wrapper = $("#canvas2").parent()[0];

var c1 = $("#canvas1")[0].getContext("2d");
var c2 = $("#canvas2")[0].getContext("2d");

c1.webkitImageSmoothingEnabled = false;
c1.mozImageSmoothingEnabled = false;
c1.imageSmoothingEnabled = false; /// future

var dragStartX = 0;
var dragStartY = 0;
var dragEndX = 0;
var dragEndY = 0;

var methods = {
  onSpritesheetChange(newSheet, isNew) {

    var newSpriteAndSheetSel = isNew && this.selectedSpritesheet;
    
    if(newSpriteAndSheetSel) {
      this.selectedSprite.spritesheet = this.selectedSpritesheet;
      this.selectedSprite.spritesheetPath = this.selectedSpritesheet.path;
      return;
    }

    /*
    if(newSheet === this.selectedSpritesheet) {
      return;
    }
    */

    this.selectedSpritesheet = newSheet;

    if(!this.selectedSpritesheet) {
      redrawCanvas1();
      redrawCanvas2();
      return;
    }

    if(this.selectedSprite) {
      this.selectedSprite.spritesheet = newSheet;
      this.selectedSprite.spritesheetPath = newSheet.path;
    }

    if(newSheet.imageEl) {
      return;
    }

    var spritesheetImg = document.createElement("img");
    spritesheetImg.onload = function() { 
      canvas2.width = spritesheetImg.width;
      canvas2.height = spritesheetImg.height;
      c2.drawImage(spritesheetImg, 0, 0);      
      var imageData = c2.getImageData(0,0,canvas2.width,canvas2.height);
      newSheet.imageArr = get2DArrayFromImage(imageData);
      newSheet.imageEl = spritesheetImg;
      redrawCanvas1();
      redrawCanvas2();
    };
    spritesheetImg.src = newSheet.path;
  },
  addSprite() {
    var spritename = prompt("Enter a sprite name");
    var newSprite = new Sprite(spritename);
    this.changeSprite(newSprite, true);
    this.sprites.push(newSprite);
    this.selectedFrame = null;
    this.selectedHitbox = null;
    resetVue();
  },
  changeSprite(newSprite, isNew) {
    this.selectedSprite = newSprite;
    this.onSpritesheetChange(newSprite.spritesheet, isNew);
    this.selectedHitbox = null;
    this.selectedFrame = this.selectedSprite.frames[0];
    redrawCanvas1();
    redrawCanvas2();
  },
  addPOI(spriteOrFrame, x, y) {
    var poi = new POI(x,y);
    spriteOrFrame.POIs.push(poi);
    this.selectPOI(poi);
    redrawCanvas1();
  },
  selectPOI(poi) {
    this.selectedPOI = poi;
    selection = poi;
    redrawCanvas1();
  },
  deletePOI(poiArr, poi) {
    _.pull(poiArr, poi);
    resetVue();
  },
  addHitbox(spriteOrFrame) {
    var hitbox = new Hitbox();
    hitbox.width = this.selectedFrame.rect.w;
    hitbox.height = this.selectedFrame.rect.h;
    spriteOrFrame.hitboxes.push(hitbox);
    this.selectHitbox(hitbox);
    redrawCanvas1();
  },
  selectHitbox(hitbox) {
    this.selectedHitbox = hitbox;
    selection = hitbox;
    redrawCanvas1();
  },
  deleteHitbox(hitboxArr, hitbox) {
    _.pull(hitboxArr, hitbox);
    resetVue();
    redrawCanvas1();
  },
  isSelectedFrameAdded() {
    return _.includes(this.frames, this.selectedFrame);
  },
  addPendingFrame() {
    this.selectedSprite.frames.push(this.selectedFrame);
    redrawCanvas1();
    redrawCanvas2();
  },
  selectFrame(frame) {
    this.selectedFrame = frame;
    redrawCanvas1();
    redrawCanvas2();
    resetVue();
  },
  deleteFrame(frame) {
    _.pull(this.selectedSprite.frames, frame);
    this.selectedFrame = this.selectedSprite.frames[0];
    redrawCanvas1();
    redrawCanvas2();
    resetVue();
  },
  selectNextFrame() {
    this.selectedHitbox = null;
    var frameIndex = this.selectedSprite.frames.indexOf(this.selectedFrame);
    var selectedFrame = this.selectedSprite.frames[frameIndex + 1];
    if(!selectedFrame) selectedFrame = this.selectedSprite.frames[0] || null;
    this.selectFrame(selectedFrame);
  },
  selectPrevFrame() {
    this.selectedHitbox = null;
    var frameIndex = this.selectedSprite.frames.indexOf(this.selectedFrame);
    var selectedFrame = this.selectedSprite.frames[frameIndex - 1];
    if(!selectedFrame) selectedFrame = this.selectedSprite.frames[this.selectedSprite.frames.length-1] || null;
    this.selectFrame(selectedFrame);
  },
  playAnim() {
    this.isAnimPlaying = !this.isAnimPlaying;
  },
  saveSprite() {
    var jsonStr = serializeES6(this.selectedSprite);
    Vue.http.post("save-sprite", JSON.parse(jsonStr)).then(response => {
      console.log("Successfully saved sprite");
    }, error => {
      console.log("Failed to save sprite");
    });
  },
  saveSprites() {

    var jsonStr = "[";
    for(var sprite of this.sprites) {
      jsonStr += serializeES6(sprite);
      jsonStr += ",";
    }
    if(jsonStr[jsonStr.length - 1] === ",") jsonStr = jsonStr.slice(0, -1);
    jsonStr += "]";
    
    Vue.http.post("save-sprites", JSON.parse(jsonStr)).then(response => {
      console.log("Successfully saved sprites");
    }, error => {
      console.log("Failed to save sprites");
    });
  },
  onSpriteAlignmentChange() {
    redrawCanvas1();
  },
  redraw() {
    redrawCanvas1();
    redrawCanvas2();
  },
  onBulkDurationChange() {
    for(var frame of this.selectedSprite.frames) {
      frame.duration = this.bulkDuration;
    }
    resetVue();
  },
  onLoopStartChange() {
    resetVue();
  },
  onWrapModeChange() {
    redrawCanvas1();
    resetVue();
  },
  reverseFrames() {
    _.reverse(this.selectedSprite.frames);
    redrawCanvas1();
    resetVue();
  }
};

var computed = {
  displayZoom: {
    get () {
      return this.zoom * 100;
    },
    set (value) {
      this.zoom = value;
    }
  }
}

var app1 = new Vue({
  el: '#app1',
  data: data,
  computed: computed,
  methods: methods,
  created: function() {
    Vue.http.get("get-spritesheets").then(response => {
      //console.log(response);
      this.spritesheets = _.map(response.data, (spritesheet) => {
        return {
          path: spritesheet
        };
      });

      Vue.http.get("get-sprites").then(response => {
        //console.log(response);
        this.sprites = deserializeES6(response.data);
      }, error => {
        console.log("Error getting sprites");
      });

    }, error => {
      console.log("Error getting sprites");      
    });
    
  }
});

var app2 = new Vue({
  el: '#app2',
  data: data,
  methods: methods,
  computed: computed
});

var app3 = new Vue({
  el: '#app3',
  data: data,
  methods: methods,
  computed: computed
});

function resetVue() {
  app1.$forceUpdate();
  app2.$forceUpdate();
  app3.$forceUpdate();
}

var animFrameIndex = 0;
var animTime = 0;

setInterval(mainLoop, 1000 / 60);

function mainLoop() {
  if(data.isAnimPlaying) {
    animTime += 1000 / 60;
    var frames = data.selectedSprite.frames;
    if(animTime >= frames[animFrameIndex].duration * 1000) {
      animFrameIndex++;
      if(animFrameIndex >= frames.length) {
        animFrameIndex = 0;
      }
      animTime = 0;
    }
    redrawCanvas1();
  }
}

function getVisibleHitboxes() {
  var hitboxes = [];
  if(data.selectedSprite) {
    hitboxes = hitboxes.concat(data.selectedSprite.hitboxes);
  }
  if(data.selectedFrame) {
    hitboxes = hitboxes.concat(data.selectedFrame.hitboxes);
  }
  return hitboxes;
}

function getVisiblePOIs() {
  var POIs = [];
  if(data.selectedSprite) {
    POIs = POIs.concat(data.selectedSprite.POIs);
  }
  if(data.selectedFrame) {
    POIs = POIs.concat(data.selectedFrame.POIs);
  }
  return POIs;
}

function getRealMouseX(rawMouseX) {
  var zoomProportion = data.zoom - 1;
  var w = canvas1.width / data.zoom;
  var w2 = (canvas1.width - w)/2;
  return w2 + (rawMouseX * (1/data.zoom));
}

function getRealMouseY(rawMouseY) {
  var zoomProportion = data.zoom - 1;
  var h = canvas1.height / data.zoom;
  var h2 = (canvas1.height - h)/2;
  return h2 + (rawMouseY * (1/data.zoom));
}

function redrawCanvas1() {

  var zoomScale = data.zoom;
  
  c1.setTransform(zoomScale, 0, 0, zoomScale, -(zoomScale - 1) * canvas1.width/2, -(zoomScale - 1) * canvas1.height/2);

  c1.clearRect(0, 0, canvas1.width, canvas1.height);
  drawRect(c1, createRect(0,0,canvas1.width,canvas1.height), "lightgray", "", null);

  var frame;

  if(!data.isAnimPlaying) {
    if(data.selectedFrame && data.selectedSpritesheet && data.selectedSpritesheet.imageEl) {
      frame = data.selectedFrame;
    }
  }
  else {
    frame = data.selectedSprite.frames[animFrameIndex];
  }

  var cX = canvas1.width/2;
  var cY = canvas1.height/2;

  if(frame) {

    data.selectedSprite.draw(c1, frame, cX, cY, data.flipX, data.flipY);

    if(data.ghost) {
      c1.globalAlpha = 0.5;
      data.ghost.sprite.draw(c1, data.ghost.frame, cX, cY, data.flipX, data.flipY);  
      c1.globalAlpha = 1;
    }

    if(!data.hideGizmos) {
      for(var hitbox of getVisibleHitboxes()) {

        var hx; var hY;
        halfW = hitbox.width * 0.5;
        halfH = hitbox.height * 0.5;
        var w = halfW * 2;
        var h = halfH * 2;
        if(data.selectedSprite.alignment === "topleft") {
          hx = cX; hy = cY;
        }
        else if(data.selectedSprite.alignment === "topmid") {
          hx = cX - halfW; hy = cY;
        }
        else if(data.selectedSprite.alignment === "topright") {
          hx = cX - w; hy = cY;
        }
        else if(data.selectedSprite.alignment === "midleft") {
          hx = cX; hy = cY - halfH;
        }
        else if(data.selectedSprite.alignment === "center") {
          hx = cX - halfW; hy = cY - halfH;
        }
        else if(data.selectedSprite.alignment === "midright") {
          hx = cX - w; hy = cY - halfH;
        }
        else if(data.selectedSprite.alignment === "botleft") {
          hx = cX; hy = cY - h;
        }
        else if(data.selectedSprite.alignment === "botmid") {
          hx = cX - halfW; hy = cY - h;
        }
        else if(data.selectedSprite.alignment === "botright") {
          hx = cX - w; hy = cY - h;
        }

        var offsetRect = createRect(
          hx + hitbox.offset.x, hy + hitbox.offset.y, hx + hitbox.width + hitbox.offset.x, hy + hitbox.height + hitbox.offset.y
        );
        hitbox.rect = offsetRect;

        var strokeColor;
        var strokeWidth;
        if(data.selectedHitbox === hitbox) {
          strokeColor = "blue";
          strokeWidth = 2;
        }

        drawRect(c1, offsetRect, "blue", strokeColor, strokeWidth, 0.25);
      }
      
      var len = 1000;
      drawLine(c1, cX, cY - len, cX, cY + len, "red", 1);
      drawLine(c1, cX - len, cY, cX + len, cY, "red", 1);
      drawCircle(c1, cX, cY, 1, "red");
      //drawStroked(c1, "+", cX, cY);

      for(var poi of getVisiblePOIs()) {

        drawCircle(c1, cX + poi.x, cY + poi.y, 1, "green");
      }

    }
    
  }

}

function redrawCanvas2() {

  c2.clearRect(0, 0, canvas2.width, canvas2.height);
  
  if(mouseDownCanvas2) {
    drawRect(c2, createRect(dragStartX, dragStartY, dragEndX, dragEndY), "", "blue", 1);
  }

  if(data.selectedSpritesheet && data.selectedSpritesheet.imageEl) {
    c2.drawImage(data.selectedSpritesheet.imageEl, 0, 0);
  }

  if(data.selectedSprite) {
    var i = 0;
    for(var frame of data.selectedSprite.frames) {
      drawRect(c2,frame.rect, "", "blue", 1);
      drawText(c2,String(i+1),frame.rect.x1, frame.rect.y1, "red", 12, "left", "Top");
      i++;
    }
  }

  if(data.selectedFrame) {
    drawRect(c2, data.selectedFrame.rect, "", "green", 2);
  }

}

canvas2.onclick = function(event) {

  //console.log("CLICK");

  var x = event.pageX - canvas2.offsetLeft + canvas2Wrapper.scrollLeft;
  var y = event.pageY - canvas2.offsetTop + canvas2Wrapper.scrollTop;

  console.log("Clicked coords " + x + "," + y);

  if(data.selectedSprite === null) return;

  for(var frame of data.selectedSprite.frames) {
    if(inRect(x,y,frame.rect)) {
      data.selectedFrame = frame;
      redrawCanvas1();
      redrawCanvas2();
      return;
    }
  }

  if(data.selectedSpritesheet === null) return;

  //No frame clicked, see if continous image was clicked, if so add to pending
  var rect = getPixelClumpRect(x, y, data.selectedSpritesheet.imageArr);
  if(rect) {
    data.selectedFrame = new Frame(rect, 0.066, new Point(0,0));
    redrawCanvas1();
    redrawCanvas2();
  }

};

function getSelectedPixels() {
  if(!data.selectedSpritesheet) return;
  var rect = getSelectedPixelRect(dragStartX, dragStartY, dragEndX, dragEndY, data.selectedSpritesheet.imageArr);
  if(rect) {
    data.selectedFrame = new Frame(rect, 0.066, new Point(0,0));
    redrawCanvas1();
    redrawCanvas2();
  }
}

var mouseX = 0;
var mouseY = 0;
var mousedown = false;
var middlemousedown = false;
var rightmousedown = false;
var mouseDownCanvas2 = false;

canvas2.onmousedown = function(e) {
  if(e.which === 1) {
      
    if(!mouseDownCanvas2) {
      var x = event.pageX - canvas2.offsetLeft + canvas2Wrapper.scrollLeft;
      var y = event.pageY - canvas2.offsetTop + canvas2Wrapper.scrollTop;
      mouseDownCanvas2 = true;
      dragStartX = x;
      dragStartY = y;
      dragEndX = x;
      dragEndY = y;
    }

    redrawCanvas2();
    event.preventDefault();
  }
}

canvas2.onmouseup = function(e) {
  if(e.which === 1) {
    mouseDownCanvas2 = false;
    getSelectedPixels();
    redrawCanvas2();
    event.preventDefault();
  }
}

canvas2.onmousemove = function(event) {
  if(mouseDownCanvas2) {
    var x = event.pageX - canvas2.offsetLeft + canvas2Wrapper.scrollLeft;
    var y = event.pageY - canvas2.offsetTop + canvas2Wrapper.scrollTop;
    dragEndX = x;
    dragEndY = y;
    redrawCanvas2();
  }
};

canvas2.onmouseleave = function(event) {
  mouseDownCanvas2 = false;
  redrawCanvas2();
}

canvas1.onmousemove = function(e) {

  let oldMouseX = mouseX;
  let oldMouseY = mouseY;

  var rawMouseX = event.pageX - canvas1.offsetLeft;
  var rawMouseY = event.pageY - canvas1.offsetTop;

  mouseX = getRealMouseX(rawMouseX);
  mouseY = getRealMouseY(rawMouseY);

  let deltaX = mouseX - oldMouseX;
  let deltaY = mouseY - oldMouseY;

  var hb = data.selectedHitbox;

  onMouseMove(deltaX, deltaY);
  redrawCanvas1();

}

canvas1.onmousedown = function(e) {
  //console.log(mouseX + "," + mouseY)
  if(e.which === 1) {
    mousedown = true;
    onMouseDown(getVisibleHitboxes());
    e.preventDefault();
  }
  else if(e.which === 2) {
    middlemousedown = true;
    e.preventDefault();
  }
  else if(e.which === 3) {
    rightmousedown = true;
    e.preventDefault();
  }
  
}

canvas1.onmouseup = function(e) {
  if(e.which === 1) {
    mousedown = false;
    //onMouseUp();
    e.preventDefault();
  }
  else if(e.which === 2) {
    middlemousedown = false;
    e.preventDefault();
  }
  else if(e.which === 3) {
    rightmousedown = false;
    e.preventDefault();
  }
}

canvas1.onmouseleave = function(e) {
  //onMouseLeaveCanvas();  
}

canvas1.onmousewheel = function(e) {
  var delta = (e.wheelDelta/180);
  data.zoom += delta;
  if(data.zoom < 1) data.zoom = 1;
  if(data.zoom > 5) data.zoom = 5;
  redrawCanvas1();
  resetVue();
  /*
  if(key_down('ctrl')) {
      set_zoom(zoom + (e.wheelDelta/180)*0.1);
      e.preventDefault();
  }
  */
}

var ctrlHeld = false;
document.onkeydown = function(e) {
  onKeyDown(inputMap[e.keyCode], !keysHeld[e.keyCode]);
  keysHeld[e.keyCode] = true;
  //Prevent SPACEBAR default scroll behavior
  if(e.keyCode === inputMap['space']) {
    e.preventDefault();
  }
  if(e.keyCode === inputMap['ctrl']) {
    ctrlHeld = true;
  }
}

document.onkeyup = function(e) {
  keysHeld[e.keyCode] = false;
  //onKeyUp(e.keyCode);
  if(e.keyCode === inputMap['ctrl']) {
    ctrlHeld = false;
  }
}

function onMouseMove(deltaX, deltaY) {
  if(data.selectedHitbox && mousedown) {
    data.selectedHitbox.move(deltaX, deltaY);
  }
}

function onMouseDown(selectables) {

  if(data.addPOIMode) {
    data.addPOIMode = false;
    var cX = canvas1.width/2;
    var cY = canvas1.height/2;
    app1.addPOI(data.selectedFrame, mouseX - cX, mouseY - cY);
    return;
  }

  var found = false;
  for(var selectable of selectables) {
    if(inRect(mouseX, mouseY, selectable.getRect())) {
      data.selectedHitbox = selectable;
      found = true;
    }
  }
  if(!found) data.selectedHitbox = null;
  redrawCanvas1();
}

function onKeyDown(key, firstFrame) {

  if(key === "escape") {
    data.selectedHitbox = null;
    data.ghost = null;
  }

  if(data.selectedFrame && !app1.isSelectedFrameAdded()) {
    if(key === "f") {
      app1.addPendingFrame();
    }
  }

  if(data.selectedFrame) {
    if(key === "g") {
      data.ghost = {
        frame: data.selectedFrame,
        sprite: data.selectedSprite
      };
    }
  }

  if(data.selectedPOI && firstFrame) {
    if(key === "a") {
      data.selectedPOI.x -= 1;
    }
    else if(key === "d") {
      data.selectedPOI.x += 1;
    }
    else if(key === "w") {
      data.selectedPOI.y -= 1;
    }
    else if(key === "s") {
      data.selectedPOI.y += 1;
    }
  }
  else if(data.selectedHitbox && firstFrame) {
    if(key === "a") {
      data.selectedHitbox.move(-1, 0);
    }
    else if(key === "d") {
      data.selectedHitbox.move(1, 0);
    }
    else if(key === "w") {
      data.selectedHitbox.move(0, -1);
    }
    else if(key === "s") {
      data.selectedHitbox.move(0, 1);
    }
    else if(key === "leftarrow") {
      data.selectedHitbox.resizeCenter(-1, 0);
    }
    else if(key === "rightarrow") {
      data.selectedHitbox.resizeCenter(1, 0);
    }
    else if(key === "downarrow") {
      data.selectedHitbox.resizeCenter(0, -1);
    }
    else if(key === "uparrow") {
      data.selectedHitbox.resizeCenter(0, 1);
    }
  }
  else if(data.selectedFrame && firstFrame) {
    if(key === "a") {
      data.selectedFrame.offset.x -= 1;
    }
    else if(key === "d") {
      data.selectedFrame.offset.x += 1;
    }
    else if(key === "w") {
      data.selectedFrame.offset.y -= 1;
    }
    else if(key === "s") {
      data.selectedFrame.offset.y += 1;
    }
  }
  if(firstFrame) {
    if(key === "e") {
      app1.selectNextFrame();
    } 
    else if(key === "q") {
      app1.selectPrevFrame();
    } 
  }

  redrawCanvas1();

}