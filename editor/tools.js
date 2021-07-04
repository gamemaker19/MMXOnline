"use strict";

function switchTool(newTool) {
    tool = newTool;
    canvas1.style.cursor = newTool.cursor;
    redrawCanvas1();
    resetVue();
}

class Tool {

	constructor() {
		this.cursor = "default";
	}

	draw() { 

		//Draw individual borders
		data.selectedInstances.forEach(function(selection) {
			drawRect(c1, selection.getRect(), "", "green", 1, 0.75);
		});

	}

	onMouseMove(deltaX, deltaY) { }
	onMouseUp() { }
	onMouseLeaveCanvas() {}
	onMouseDown() { }
	onKeyDown(key, oneFrame) { }
	onKeyUp(key) { }

	getObjOver() {
		for(let i = data.selectedLevel.instances.length - 1; i >= 0; i--) {
      var instance = data.selectedLevel.instances[i];
      if(inRect(mouseX, mouseY, instance.getRect())) {
				return instance;
			}
		}
		return null;
  }
  
  drawVertices() {
    var points = data.selectedInstances[0].points;
    
    //Top left point
    drawCircle(c1, points[0].x - 10, points[0].y, 5, "white", "black", 1);
    drawCircle(c1, points[0].x, points[0].y - 10, 5, "white", "black", 1);

    //Top right point
    drawCircle(c1, points[1].x + 10, points[1].y, 5, "white", "black", 1);
    drawCircle(c1, points[1].x, points[1].y - 10, 5, "white", "black", 1);

    //Bot right point
    drawCircle(c1, points[2].x + 10, points[2].y, 5, "white", "black", 1);
    drawCircle(c1, points[2].x, points[2].y + 10, 5, "white", "black", 1);

    //Bot left point
    drawCircle(c1, points[3].x - 10, points[3].y, 5, "white", "black", 1);
    drawCircle(c1, points[3].x, points[3].y + 10, 5, "white", "black", 1);
  }

}

class CreateInstanceTool extends Tool {

	constructor(url) {
		super();
		this.cursor = "crosshair";
		this.url = url;
	}

	onMouseDown() {
    var sprite = _.find(data.sprites, (sprite) => { return sprite.name === data.selectedObject.spriteName; });
    if(!sprite) {
      var instance = new Instance(data.selectedObject.name, mouseX, mouseY, undefined, data.selectedObject.image);
    }
    else {
      var instance = new Instance(data.selectedObject.name, mouseX, mouseY, sprite);
    }
    data.selectedLevel.instances.push(instance);
    data.selectedObject = null;
    data.selectedInstances = [instance];
		switchTool(new SelectTool());
	}

	onKeyDown(key, oneFrame) {
		if(key === "escape") {
      data.selectedObject = null;
			switchTool(new SelectTool());
		}
	}

}

/*
class DragSelectTool extends Tool {

	constructor(start_x, start_y) {
		super();
		this.start_x = start_x;
		this.start_y = start_y;
	}

	draw() {
		super.draw();
		draw_rect(this.start_x, this.start_y, mouse_x - this.start_x, mouse_y - this.start_y, 
			 null, "rgba(0, 102, 255, 0.5)", 2);
	}

	onMouseMove() {
		redraw();
	}

	onMouseUp() {

		for(let i = objects.length - 1; i >= 0; i--) {
			var obj = objects[i];

			var rect_x = this.start_x;
			var rect_y = this.start_y;
			var rect_w = mouse_x - this.start_x;
			var rect_h = mouse_y - this.start_y;

			if(rect_w < 0) {
				rect_x += rect_w;
				rect_w *= -1;
			}
			if(rect_h < 0) {
				rect_y += rect_h;
				rect_h *= -1;
			}

			if(
				obj.vertex_box.contains_point(rect_x, rect_y) ||
				obj.vertex_box.contains_point(rect_x + rect_w, rect_y) ||
				obj.vertex_box.contains_point(rect_x + rect_w, rect_y + rect_h) ||
				obj.vertex_box.contains_point(rect_x, rect_y + rect_h)
			  ) {
				add_selection(obj);
			}
		}

		switchTool(new SelectTool());
	}

}
*/

class CreateTool extends Tool {

	constructor(obj) {
    super();
    this.obj = obj;
		this.cursor = "crosshair";
	}

	onMouseDown() {
    var v1 = new Point(mouseX,mouseY);
    var v2 = new Point(mouseX+4,mouseY);
    var v3 = new Point(mouseX+4,mouseY+4);
    var v4 = new Point(mouseX,mouseY+4);
    
    var collisionBox = new ShapeInstance(this.obj, [v1, v2, v3, v4]);
    
    data.selectedLevel.instances.push(collisionBox);
    data.selectedInstances.push(collisionBox);
    data.selectedObject = null;
    switchTool(new ResizeTool("se-resize"));
	}

	onKeyDown(key, oneFrame) {
		if(key === 'escape') {
      data.selectedObject = null;
			switchTool(new SelectTool());
		}
	}

}

class ResizeTool extends Tool {

	constructor(resizeDir) {
		super();
		this.resizeDir = resizeDir;
		this.cursor = resizeDir;
		this.init_x = mouseX;
		this.init_y = mouseY;
		//Clear out saved percentages

		data.selectedInstances.forEach(function(selection) {
			selection.clearPointPercents();
		});
	}

	onMouseUp() {
    //normalize points
    for(let i = 0; i < data.selectedInstances.length; i++) {
      data.selectedInstances[i].normalizePoints();
    }
    
		switchTool(new SelectTool());
	}

	onMouseMove(deltaX, deltaY) {
		for(let i = 0; i < data.selectedInstances.length; i++) {
			data.selectedInstances[i].resize(deltaX, deltaY, this.resizeDir);
		}
	}

	onMouseLeaveCanvas() {
		switchTool(new SelectTool());
	}

}

class MoveTool extends Tool {

	constructor() {
		super();
		this.cursor = "default";
	}

	onMouseMove(deltaX, deltaY) {	
		data.selectedInstances.forEach(function(selection) {
			selection.move(deltaX, deltaY);
		});
	}

	onMouseUp() {
    data.selectedInstances.forEach(function(selection) {
			selection.normalizePoints();
		});
		switchTool(new SelectTool());
	}

}

class SelectTool extends Tool {

	constructor() {
		super();
	}

	onKeyDown(key, oneFrame) {
    if(!bodyFocus()) {
      return;
    }

    if(key === "tab" && data.selectedInstances.length === 1 && data.selectedInstances[0].className === "ShapeInstance") {
      console.log("SWITCH");
      switchTool(new SelectVertexTool());
      return;
    }

    if(key === "c" && data.selectedInstances.length === 2) {
      var node1 = data.selectedInstances[0];
      var node2 = data.selectedInstances[1];
      node1.properties.neighbors.push({
        nodeName: node2.name,
      });
      node2.properties.neighbors.push({
        nodeName: node1.name
      });
      resetVue();
      redrawCanvas1();
    }

		if(key === "escape") {
			data.selectedInstances = [];
    }
    
    if(key === "delete") {
      for(var i = data.selectedInstances.length - 1; i >= 0; i--) {
        var instance = data.selectedInstances[i];
        _.pull(data.selectedLevel.instances, instance);
        _.pull(data.selectedInstances, instance);
      }
    }

    if(!keysHeld['shift']) {
      if(key === "a") {
        for(var selection of data.selectedInstances) {
          selection.resize(-1, 0, "w-resize")
        }
      }
      else if(key === "d") {
        for(var selection of data.selectedInstances) {
          selection.resize(1, 0, "w-resize");
        }
      }
      else if(key === "w") {
        for(var selection of data.selectedInstances) {
          selection.resize(0, -1, "n-resize");
        }
      }
      else if(key === "s") {
        for(var selection of data.selectedInstances) {
          selection.resize(0, 1, "n-resize");
        }
      }
    }
    else {
      //resizeDir can be: ["nw-resize", "n-resize", "ne-resize", "e-resize", "se-resize", "s-resize", "sw-resize", "w-resize"];
      if(key === "a") {
        for(var selection of data.selectedInstances) {
          selection.resize(-1, 0, "e-resize")
        }
      }
      else if(key === "d") {
        for(var selection of data.selectedInstances) {
          selection.resize(1, 0, "e-resize");
        }
      }
      else if(key === "w") {
        for(var selection of data.selectedInstances) {
          selection.resize(0, -1, "s-resize");
        }
      }
      else if(key === "s") {
        for(var selection of data.selectedInstances) {
          selection.resize(0, 1, "s-resize");
        }
      }
    }

    if(key === "left") {
      for(var selection of data.selectedInstances) {
        selection.move(-1, 0);
      }
    }
    else if(key === "right") {
      for(var selection of data.selectedInstances) {
        selection.move(1, 0);
      }
    }
    else if(key === "up") {
      for(var selection of data.selectedInstances) {
        selection.move(0, -1);
      }
    }
    else if(key === "down") {
      for(var selection of data.selectedInstances) {
        selection.move(0, 1);
      }
    }

		/*
		else if(keyDown['space']) {
			if(selections.length > 0) {
				$("#canvas_wrapper")[0].scrollLeft = get_selection_center_x() - $("#canvas_wrapper").width()/2;                         
				$("#canvas_wrapper")[0].scrollTop = get_selection_center_y() - $("#canvas_wrapper").height()/2;
			}
		}
		else if(key_down('-')) {
			if(key_down('ctrl')) {
				move_to_back(get_selection());
			}
			else {
				move_backward(get_selection());
			}
		}
		else if(key_down('+')) {
			if(key_down('ctrl')) {
				move_to_front(get_selection());
			}
			else {
				move_forward(get_selection());
			}
		}
    */
    resetVue();
	}

	onMouseMove() {

		if(data.selectedInstances.length > 0) {
			this.calcMouseOverES();

      var lo = this.lo;
      var to = this.to;
      var bo = this.bo;
      var ro = this.ro;

			var resizeIcons = ["nw-resize", "n-resize", "ne-resize", "e-resize", "se-resize", "s-resize", "sw-resize", "w-resize"];
      var range07 = function(val) { while(val > 7) { val -= 8; } return val; }
      
			if(lo && to) {
				canvas1.style.cursor = resizeIcons[range07(0)];
			}
			else if(lo && bo) {
				canvas1.style.cursor = resizeIcons[range07(6)];
			}
			else if(ro && to) {
				canvas1.style.cursor = resizeIcons[range07(2)];
			}
			else if(ro && bo) {
				canvas1.style.cursor = resizeIcons[range07(4)];
			}
			else if(lo) {
				canvas1.style.cursor = resizeIcons[range07(7)];
			}
			else if(ro) {
				canvas1.style.cursor = resizeIcons[range07(3)];	
			}
			else if(to) {
				canvas1.style.cursor = resizeIcons[range07(1)];
			}
			else if(bo) {
				canvas1.style.cursor = resizeIcons[range07(5)];
			}
			else {
				canvas1.style.cursor = "default";
      }
      redrawCanvas1();
		}
	}

	onMouseDown() {
    
    if(data.selectedInstances.length > 0) {
      this.calcMouseOverES();
      
      var lo = this.lo;
      var to = this.to;
      var bo = this.bo;
      var ro = this.ro;

			if(lo && to) {
				switchTool(new ResizeTool("nw-resize"));
				return;
			}
			else if(lo && bo) {
				switchTool(new ResizeTool("sw-resize"));
				return;
			}
			else if(ro && to) {
				switchTool(new ResizeTool("ne-resize"));
				return;
			}
			else if(ro && bo) {
				switchTool(new ResizeTool("se-resize"));
				return;
			}
			else if(lo) {
				switchTool(new ResizeTool("w-resize"));
				return;
			}
			else if(ro) {
				switchTool(new ResizeTool("e-resize"));	
				return;
			}
			else if(to) {
				switchTool(new ResizeTool("n-resize"));
				return;
			}
			else if(bo) {
				switchTool(new ResizeTool("s-resize"));
				return;
			}
		}

    /*
		if(key_down('ctrl')) {
			switchTool(new DragSelectTool(mouse_x, mouse_y));
			return;
    }
    */

		var clickedObj = this.getObjOver();
		if(clickedObj) {			
			//If not already selected and shift not held, replace current selection
			if(!data.selectedInstances.includes(clickedObj) && !keysHeld["shift"]) {
				data.selectedInstances = [];
			}
			if(!data.selectedInstances.includes(clickedObj)) {
        data.selectedInstances.push(clickedObj);
      }
			switchTool(new MoveTool());
		}	
		else if(data.selectedInstances.length > 0 && inRect(mouseX, mouseY, getSelectionRect())) {
			switchTool(new MoveTool());
		}
		else {
			if(!keysHeld["shift"]) {
				data.selectedInstances = [];
      }
			//switchTool(new DragSelectTool(mouseX, mouseY));
		}
    redrawCanvas1();
    resetVue();

	}

	calcMouseOverES() {

		var vertex_box = data.selectedInstances[0].getRect().getPoints();

		this.to = inLine(mouseX, mouseY, vertex_box[0].x, vertex_box[0].y, vertex_box[1].x, vertex_box[1].y, true);
		this.ro = inLine(mouseX, mouseY, vertex_box[1].x, vertex_box[1].y, vertex_box[2].x, vertex_box[2].y, true);
		this.bo = inLine(mouseX, mouseY, vertex_box[2].x, vertex_box[2].y, vertex_box[3].x, vertex_box[3].y, true);
		this.lo = inLine(mouseX, mouseY, vertex_box[3].x, vertex_box[3].y, vertex_box[0].x, vertex_box[0].y, true);

		/*
		//Sprites and objects selected: can't select top or left
		if(selections.some(function(elem) { return elem instanceof Sprite; })) {
			lo = false;
			to = false;
		}
		*/

	}

	onMouseUp() {
	}

	onMouseLeaveCanvas() {
	}

}



class SelectVertexTool extends Tool {

	constructor() {
		super();
  }
  
  draw() {
    this.drawVertices();
  }

	onKeyDown(key, oneFrame) { 
		if(key === "tab" || key === "escape") {
			switchTool(new SelectTool());
    }
	}

	onMouseDown() {

    var points = data.selectedInstances[0].points;
    
    //Top left point
    if(inCircle(mouseX, mouseY, points[0].x - 10, points[0].y, 5)) switchTool(new MoveVertexTool(points[0], "horizontal"));
    if(inCircle(mouseX, mouseY, points[0].x, points[0].y - 10, 5)) switchTool(new MoveVertexTool(points[0], "vertical"));

    //Top right point
    if(inCircle(mouseX, mouseY, points[1].x + 10, points[1].y, 5)) switchTool(new MoveVertexTool(points[1], "horizontal"));
    if(inCircle(mouseX, mouseY, points[1].x, points[1].y - 10, 5)) switchTool(new MoveVertexTool(points[1], "vertical"));

    //Bot right point
    if(inCircle(mouseX, mouseY, points[2].x + 10, points[2].y, 5)) switchTool(new MoveVertexTool(points[2], "horizontal"));
    if(inCircle(mouseX, mouseY, points[2].x, points[2].y + 10, 5)) switchTool(new MoveVertexTool(points[2], "vertical"));

    //Bot left point
    if(inCircle(mouseX, mouseY, points[3].x - 10, points[3].y, 5)) switchTool(new MoveVertexTool(points[3], "horizontal"));
    if(inCircle(mouseX, mouseY, points[3].x, points[3].y + 10, 5)) switchTool(new MoveVertexTool(points[3], "vertical"));

    redrawCanvas1();
    resetVue();

	}

	onMouseUp() {
	}

	onMouseLeaveCanvas() {
	}

}

class MoveVertexTool extends Tool {

  //dir can be horizontal or vertical
	constructor(grabbedVertex, dir) {
		super();
		this.cursor = "default";
    this.grabbedVertex = grabbedVertex;
    this.dir = dir;
  }
  
  draw() {
    this.drawVertices();
  }

	onMouseMove(deltaX, deltaY) {	
    if(this.dir === "horizontal") this.grabbedVertex.x += deltaX;
    else if(this.dir === "vertical") this.grabbedVertex.y += deltaY;
    else throw "Direction not horizontal or vertical";
    redrawCanvas1();
	}

	onMouseUp() {
		switchTool(new SelectVertexTool());
	}

}
