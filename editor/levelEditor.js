var data = {
  spritesheets: [],
  sprites: [],
  levels: [],
  selectedLevel: null,
  backgrounds: [],
  selectedBackground: null,
  objects: objects,
  selectedObject: null,
  selectedInstances: [],
  isPlaying: false,
  zoom: 1,
  hideGizmos: false,
  newLevelName: "",
  showInstanceLabels: true
};

var canvas1DefaultWidth = 700;
var canvas1DefaultHeight = 600;

var canvas1 = $("#level-canvas")[0];
var canvas1Wrapper = $("#level-canvas").parent()[0];
var c1 = $("#level-canvas")[0].getContext("2d");

var methods = {
  sortInstances() {
    this.selectedLevel.instances.sort(function(a,b) {
      var compare = a.name.localeCompare(b.name, "en", { numeric: true });
      if(compare < 0) return -1;
      if(compare > 0) return 1;
      if(compare === 0) return 0;
    });
  },
  changeProperties (e) {
    if(this.selectedInstances.length === 1) {
      this.selectedInstances[0].setPropertiesJson(e.target.value);
    }
  },
  onBackgroundChange(newBackground) {
    this.selectedBackground = newBackground;

    if(!this.selectedBackground) {
      redrawCanvas1();
      return;
    }

    if(this.selectedLevel) {
      this.selectedLevel.background = newBackground;
      this.selectedLevel.backgroundPath = newBackground.path;
    }

    var backgroundImg = document.createElement("img");
    backgroundImg.onload = function() { 
      canvas1.width = backgroundImg.width;
      canvas1.height = backgroundImg.height;
      canvas1.savedWidth = canvas1.width;
      canvas1.savedHeight = canvas1.height;
      c1.drawImage(backgroundImg, 0, 0);      
      newBackground.imageEl = backgroundImg;
      redrawCanvas1();
    };
    backgroundImg.src = newBackground.path;
  },
  addLevel() {
    var newLevel = new Level(this.newLevelName);
    this.changeLevel(newLevel);
    this.levels.push(newLevel);
    this.selectedObject = null;
    this.selectedInstances = [];
    resetVue();
  },
  changeLevel(newLevel) {
    this.selectedLevel = newLevel;
    this.onBackgroundChange(newLevel.background);
    this.selectedObject = null;
    this.selectedInstances = [];
    redrawCanvas1();
  },
  saveLevel() {

    for(var instance of this.selectedLevel.instances) {
      instance.normalizePoints();
    }

    var savedBackground = this.selectedLevel.background;
    this.selectedLevel.background = savedBackground.path;
    var jsonStr = serializeES6(this.selectedLevel);
    Vue.http.post("save-level", JSON.parse(jsonStr)).then(response => {
      console.log("Successfully saved level");
      this.selectedLevel.background = savedBackground;
    }, error => {
      console.log("Failed to save level");
      this.selectedLevel.background = savedBackground;
    });
  },
  play() {
    this.isPlaying = !this.isPlaying;
  },
  redraw() {
    redrawCanvas1();
  },
  changeObject(newObj) {
    this.selectedInstances = [];
    this.selectedObject = newObj;
    if(newObj.isShape) {
      tool = new CreateTool(newObj);
    }
    else {
      tool = new CreateInstanceTool();
    }
    redrawCanvas1();
  },
  onInstanceClick(instance) {
    this.selectedInstances = [instance];
    redrawCanvas1();
  }
};

var computed = {
  displayZoom: {
    get () {
      return this.zoom * 100;
    },
    set (value) {
      this.zoom = value / 100;
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
      console.log("GET SPRITESHEETS");
      this.spritesheets = _.map(response.data, (spritesheet) => {
        var imageEl = document.createElement("img");
        imageEl.src = spritesheet;
        return {
          path: spritesheet,
          imageEl: imageEl
        };
      });
    }, error => {
      console.log("Error getting spritesheets");      
    }).then(response => {
      Vue.http.get("get-sprites").then(response => {
        //console.log(response);
      console.log("GET SPRITES");
        this.sprites = deserializeES6(response.data);
      }, error => {
        console.log("Error getting sprites");
      });
    }).then(response => {
      Vue.http.get("get-backgrounds").then(response => {
        //console.log(response);
        this.backgrounds = _.map(response.data, (background) => {
          return {
            path: background
          };
        });
      }, error => {
        console.log("Error getting backgrounds");
      });
    }).then(response => {
      Vue.http.get("get-levels").then(response => {
        //console.log(response);
        this.levels = deserializeES6(response.data);
      }, error => {
        console.log("Error getting levels");
      });
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

var app4 = new Vue({
  el: '#app4',
  data: data,
  methods: methods,
  computed: computed
});

function resetVue() {
  app1.$forceUpdate();
  app2.$forceUpdate();
  app3.$forceUpdate();
  app4.$forceUpdate();
}

var animFrameIndex = 0;
var animTime = 0;

setInterval(mainLoop, 1000 / 60);

function mainLoop() {
  if(data.isPlaying) {
    animTime++;
    var frames = data.selectedSprite.frames;
    if(animTime >= frames[animFrameIndex].duration) {
      animFrameIndex++;
      if(animFrameIndex >= frames.length) {
        animFrameIndex = 0;
      }
      animTime = 0;
    }
    redrawCanvas1();
  }
}

function getSelectionRect() {
  return data.selectedInstances[0].getRect();
}

function redrawCanvas1() {

  c1.webkitImageSmoothingEnabled = false;
  c1.mozImageSmoothingEnabled = false;
  c1.imageSmoothingEnabled = false; /// future
  
  var zoomScale = data.zoom;
  
  c1.save();

  c1.clearRect(0, 0, canvas1.width, canvas1.height);
  drawRect(c1, createRect(0,0,canvas1.width,canvas1.height), "white", "", null);

  c1.scale(zoomScale, zoomScale);

  if(data.selectedBackground && data.selectedBackground.imageEl) {
    drawImage(c1, data.selectedBackground.imageEl, 0, 0);
  }

  if(data.selectedLevel) {
    for(var instance of data.selectedLevel.instances) {
      //Draw the instance here...
      instance.draw(c1);
    }
  }

  if(tool) tool.draw();

  c1.restore();

}

/*
canvas1.onclick = function(event) {
  //console.log("CLICK");
};
*/

var tool = new SelectTool();
var mouseX = 0;
var mouseY = 0;
var mousedown = false;
var middlemousedown = false;
var rightmousedown = false;

canvas1.onmousemove = function(e) {

  let oldMouseX = mouseX;
  let oldMouseY = mouseY;

  var rect = canvas1.getBoundingClientRect(), root = document.documentElement;
  mouseX = (e.clientX - rect.left - root.scrollLeft) / data.zoom;
  mouseY = (e.clientY - rect.top - root.scrollTop) / data.zoom;

  //mouseX = (event.pageX - canvas1.offsetLeft) / data.zoom;
  //mouseY = (event.pageY - canvas1.offsetTop) / data.zoom;

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
    if(tool) tool.onMouseDown();

    /*
    console.log("Clicked coords " + mouseX + "," + mouseY);

    if(data.selectedLevel) {
      for(var instance of data.selectedLevel.instances) {
        if(inRect(x,y,instance.rect)) {
          data.selectedInstances = [ instance ];
          redrawCanvas1();
          return;
        }
      }
    }
    */
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
  redrawCanvas1();
}

canvas1.onmouseup = function(e) {
  if(e.which === 1) {
    mousedown = false;
    if(tool) tool.onMouseUp();
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
  redrawCanvas1();
  resetVue();
}

canvas1.onmouseleave = function(e) {
  if(tool) tool.onMouseLeaveCanvas(); 
  redrawCanvas1(); 
  resetVue();
}

canvas1.onmousewheel = function(e) {

  if(keysHeld["alt"]) {
    var delta = e.wheelDelta * 0.001;
    data.zoom += delta;
    if(data.zoom < 1) data.zoom = 1;
    if(data.zoom > 5) data.zoom = 5;
    redrawCanvas1();
    resetVue();
    e.preventDefault();
  }

}

document.onkeydown = function(e) {
  var key = inputMap[e.keyCode];
  if(tool) tool.onKeyDown(key, !keysHeld[e.keyCode]);
  keysHeld[key] = true;

  if(key === "e") {
    for(let instance of data.selectedLevel.instances) {
      if(!instance.name.includes("Collision Shape")) continue;
      if(instance.points[0].y === instance.points[1].y && instance.points[2].y === instance.points[3].y && instance.points[1].x === instance.points[2].x && instance.points[3].x === instance.points[0].x) {
        continue;
      }
      for(let instance2 of data.selectedLevel.instances) {
        if(instance === instance2) continue;
        if(!instance2.name.includes("Collision Shape")) continue;
        for(let i = 0; i < instance.points.length; i++) {
          let point = instance.points[i];
          for(let point2 of instance2.points) {
            let dist = Math.sqrt(Math.pow(point2.x - point.x, 2) + Math.pow(point2.y - point.y, 2));
            if(dist < 5) {
              instance.points[i].x = point2.x;
              instance.points[i].y = point2.y;
            }
            
          }
        }
      }
      //if(instance.name.includes("Spawn")) {
      //  instance.properties = {"dir":-1};
      //}
      //data.selectedInstances.add(instance);
      //if(instance.pos) instance.pos.x += 21;
      //else instance.move(21, 0);
    }
  }

  if(key === "+" || key === "-") {
    if(key === "+") delta = 0.1;
    else delta = -0.1;
    data.zoom += delta;
    if(data.zoom < 1) data.zoom = 1;
    if(data.zoom > 5) data.zoom = 5;
  }

  if(bodyFocus() && (key === "space" || key === "tab" || key === "ctrl" || key === "alt")) {
    e.preventDefault();
  }

  redrawCanvas1();
  resetVue();
}

$(window).bind('mousewheel DOMMouseScroll', function (event) {
  if (event.ctrlKey == true) {
    event.preventDefault();
  }
});

document.onkeyup = function(e) {
  keysHeld[inputMap[e.keyCode]] = false;
  if(tool) tool.onKeyUp(inputMap[e.keyCode]);
  redrawCanvas1();
  resetVue();
}

function onMouseMove(deltaX, deltaY) {

  if(tool) tool.onMouseMove(deltaX, deltaY);
  /*
  if(data.selectedInstances.length > 0 && mousedown) {
    for(var instance of data.selectedInstances) {
      instance.move(deltaX, deltaY);
    }
  }
  */
}