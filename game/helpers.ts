import { Rect } from "./rect";
import { Point } from "./point";
import { Shape } from "./shape";
import { Palette } from "./color";
import { game } from "./game";

export function inRect(x: number, y: number, rect: Rect): boolean {
  let rx:number = rect.x1;
  let ry:number = rect.y1;
  let rx2:number = rect.x2;
  let ry2:number = rect.y2;
  return x >= rx && x <= rx2 && y >= ry && y <= ry2;
}

export function inCircle(x: number, y: number, circleX: number, circleY: number, r: number): boolean {

  if(Math.sqrt( Math.pow(x - circleX, 2) + Math.pow(y - circleY, 2)) <= r) {
      return true;
  }
  return false;
}

export function toZero(num: number, inc: number, dir: number) {
  if(dir === 1) {
    num -= inc;
    if(num < 0) num = 0;
    return num;
  }
  else if(dir === -1) {
    num += inc;
    if(num > 0) num = 0;
    return num;
  }
  else {
    throw "Must pass in -1 or 1 for dir";
  }
}

export function incrementRange(num: number, min: number, max: number) {
  num++;
  if(num >= max) num = min;
  return num;
}

export function decrementRange(num: number, min: number, max: number) {
  num--;
  if(num < min) num = max - 1;
  return num;
}

export function clamp01(num: number) {
  if(num < 0) num = 0;
  if(num > 1) num = 1;
  return num;
}

//Inclusive
export function randomRange(start: number, end: number) {
  /*
  end++;
  let dist = end - start;
  return Math.floor(Math.random() * dist) + start;
  */
  //@ts-ignore
  return _.random(start, end);
}

export function clampMax(num: number, max: number) {
  return num < max ? num : max;
}

export function clampMin(num: number, min: number) {
  return num > min ? num : min;
}

export function clampMin0(num: number) {
  return clampMin(num, 0);
}

export function clamp(num: number, min: number, max: number) {
  if(num < min) return min;
  if(num > max) return max;
  return num;
}

export function sin(degrees: number) {
  let rads = degrees * Math.PI / 180;
  return Math.sin(rads);
}

export function cos(degrees: number) {
  let rads = degrees * Math.PI / 180;
  return Math.cos(rads);
}

export function atan(value: number) {
  return Math.atan(value) * 180 / Math.PI;
}

export function moveTo(num: number, dest: number, inc: number) {
  inc *= Math.sign(dest - num);
  num += inc;
  return num;
}

export function lerp(num: number, dest: number, timeScale: number) {
  num = num + (dest - num)*timeScale;
  return num;
}

export function lerpNoOver(num: number, dest: number, timeScale: number) {
  num = num + (dest - num)*timeScale;
  if(Math.abs(num - dest) < 1) num = dest;
  return num;
}

//Expects angle and destAngle to be > 0 and < 360
export function lerpAngle(angle: number, destAngle: number, timeScale: number) {
  let dir = 1;
  if(Math.abs(destAngle - angle) > 180) {
    dir = -1;
  }
  angle = angle + dir*(destAngle - angle) * timeScale;
  return to360(angle);
}

export function to360(angle: number) {
  if(angle < 0) angle += 360;
  if(angle > 360) angle -= 360;
  return angle;
}

export function getHex(r: number, g: number, b: number, a: number) {
  return "#" + r.toString(16) + g.toString(16) + b.toString(16) + a.toString(16);
}

export function roundEpsilon(num: number) {
  let numRound = Math.round(num);
  let diff = Math.abs(numRound - num);
  if(diff < 0.0001) {
    return numRound;
  }
  return num;
}

let autoInc = 0;
export function getAutoIncId() {
  autoInc++;
  return autoInc;
}

export function stringReplace(str: string, pattern: string, replacement: string) {
  return str.replace(new RegExp(pattern, 'g'), replacement);
}

export function noCanvasSmoothing(c: CanvasRenderingContext2D) {
  c.webkitImageSmoothingEnabled = false;
  c.mozImageSmoothingEnabled = false;
  c.imageSmoothingEnabled = false; /// future
}

let helperCanvas = document.createElement("canvas");
let helperCtx = helperCanvas.getContext("2d");
noCanvasSmoothing(helperCtx);

let helperCanvas2 = document.createElement("canvas");
let helperCtx2 = helperCanvas2.getContext("2d");
noCanvasSmoothing(helperCtx2);

let helperCanvas3 = document.createElement("canvas");
let helperCtx3 = helperCanvas3.getContext("2d");
noCanvasSmoothing(helperCtx3);

export function drawImage(ctx: CanvasRenderingContext2D, imgEl: HTMLImageElement, sX: number, sY: number, sW?: number, sH?: number, 
  x?: number, y?: number, flipX?: number, flipY?: number, options?: string, alpha?: number, palette?: Palette, scaleX?: number, scaleY?: number): void {
  
  if(!sW) {
    ctx.drawImage(imgEl, (sX), sY);
    return;
  }

  ctx.globalAlpha = (alpha === null || alpha === undefined) ? 1 : alpha;

  helperCanvas.width = sW;
  helperCanvas.height = sH;
  
  helperCtx.save();
  scaleX = scaleX || 1;
  scaleY = scaleY || 1;
  flipX = (flipX || 1);
  flipY = (flipY || 1);
  helperCtx.scale(flipX * scaleX, flipY * scaleY);

  helperCtx.clearRect(0, 0, helperCanvas.width, helperCanvas.height);
  helperCtx.drawImage(
    imgEl,
    sX, //source x
    sY, //source y
    sW, //source width
    sH, //source height
    0,  //dest x
    0, //dest y
    flipX * sW, //dest width
    flipY * sH  //dest height
  );

  if(palette) {
    let imageData = helperCtx.getImageData(0, 0, helperCanvas.width, helperCanvas.height);
    let data = imageData.data;
    for (let i = 0; i < data.length; i += 4) {
      let r = data[i];
      let g = data[i+1];
      let b = data[i+2];
      let a = data[i+3];

      let color = palette.colorMap[getHex(r, g, b, a)];
      if(color !== null && color !== undefined) {
        data[i] = color.r;
        data[i+1] = color.g;
        data[i+2] = color.b;
      }
    }
    helperCtx.putImageData(imageData, 0, 0);​
  }

  if(options === "flash") {
    let imageData = helperCtx.getImageData(0, 0, helperCanvas.width, helperCanvas.height);
    let data = imageData.data;
    for (let i = 0; i < data.length; i += 4) {
      let r = data[i];
      let g = data[i+1];
      let b = data[i+2];
      let a = data[i+3];
      data[i] = clampMax(r + 64, 255);
      data[i+1] = clampMax(g + 64, 255);
      data[i+2] = clampMax(b + 128, 255);
    }
    helperCtx.putImageData(imageData, 0, 0);​
  }
  else if(options === "hit") {
    let imageData = helperCtx.getImageData(0, 0, helperCanvas.width, helperCanvas.height);
    let data = imageData.data;
    for (let i = 0; i < data.length; i += 4) {
      let r = data[i];
      let g = data[i+1];
      let b = data[i+2];
      let a = data[i+3];
      data[i] = clampMax(r + 128, 255);
      data[i+1] = clampMax(g + 128, 255);
      data[i+2] = clampMax(b + 128, 255);
    }
    helperCtx.putImageData(imageData, 0, 0);​
  }

  ctx.drawImage(helperCanvas, x, y);
  
  ctx.globalAlpha = 1;
  helperCtx.restore();
}

export function createAndDrawRect(container: PIXI.Container, rect: Rect, fillColor?: number, strokeColor?: number, strokeWidth?: number, fillAlpha?: number): PIXI.Graphics {
  let rectangle = new PIXI.Graphics();
  if(fillAlpha === undefined) fillAlpha = 1;
  //if(!fillColor) fillColor = 0x00FF00;

  if(strokeColor) {
    rectangle.lineStyle(strokeWidth, strokeColor, fillAlpha);
  }

  if(fillColor !== undefined) 
    rectangle.beginFill(fillColor, fillAlpha);
  
  rectangle.drawRect(rect.x1, rect.y1, rect.w, rect.h);
  if(fillColor !== undefined)
    rectangle.endFill();
  
  container.addChild(rectangle);
  return rectangle;
}

export function drawRect(ctx: CanvasRenderingContext2D, rect: Rect, fillColor?: string, strokeColor?: string, strokeWidth?: number, fillAlpha?: number): void {
  let rx: number = Math.round(rect.x1);
  let ry: number = Math.round(rect.y1);
  let rx2: number = Math.round(rect.x2);
  let ry2: number = Math.round(rect.y2);

  ctx.beginPath();
  ctx.rect(rx, ry, rx2 - rx, ry2 - ry);

  if(fillAlpha) {
    ctx.globalAlpha = fillAlpha;
  }

  if(strokeColor) {
    strokeWidth = strokeWidth ? strokeWidth : 1;
    ctx.lineWidth = strokeWidth;
    ctx.strokeStyle = strokeColor;
    ctx.stroke();
  }

  if(fillColor) {
    ctx.fillStyle = fillColor;
    ctx.fill();
  }

  ctx.globalAlpha = 1;
}

export function drawPolygon(ctx: CanvasRenderingContext2D, shape: Shape, closed: boolean, fillColor?: string, lineColor?: string, lineThickness?: number, fillAlpha?: number): void {

  let vertices = shape.points;

  if(fillAlpha) {
    ctx.globalAlpha = fillAlpha;
  }

  ctx.beginPath();
  ctx.moveTo(vertices[0].x, vertices[0].y);

  for(let i: number = 1; i < vertices.length; i++) {
      ctx.lineTo(vertices[i].x, vertices[i].y);
  }

  if(closed) {
      ctx.closePath();

      if(fillColor) {
          ctx.fillStyle = fillColor;
          ctx.fill();
      }
  }

  if(lineColor) {
      ctx.lineWidth = lineThickness;
      ctx.strokeStyle = lineColor;
      ctx.stroke();
  }

  ctx.globalAlpha = 1;
}

function isMobile() {
  let check = false;
  //@ts-ignore
  (function(a){if(/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino/i.test(a)||/1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0,4)))check=true;})(navigator.userAgent||navigator.vendor||window.opera);
  return check;
}

export function isSupportedBrowser() {
  //@ts-ignore
  if(isMobile()) {
    return false;
  }

  //Check if browser is IE
  if (navigator.userAgent.search("MSIE") >= 0) {
      // insert conditional IE code here
      return false;
  }
  //Check if browser is Chrome
  else if (navigator.userAgent.search("Chrome") >= 0) {
      // insert conditional Chrome code here
      return true;
  }
  //Check if browser is Firefox 
  else if (navigator.userAgent.search("Firefox") >= 0) {
      // insert conditional Firefox Code here
      return true;
  }
  //Check if browser is Safari
  else if (navigator.userAgent.search("Safari") >= 0 && navigator.userAgent.search("Chrome") < 0) {
      // insert conditional Safari code here
      return false;
  }
  //Check if browser is Opera
  else if (navigator.userAgent.search("Opera") >= 0) {
      // insert conditional Opera code here
      return false;
  }
  return false;
}

export function setTextGradient(text: PIXI.Text, isRed: boolean) {
  let col = "#6090D0";
  if(isRed) col = "#f44256";
  text.style.fill = [col, "#C8D8E8", col];
  text.style.fillGradientType = 	PIXI.TEXT_GRADIENT.LINEAR_VERTICAL;
  text.style.fillGradientStops = [0, 0.5, 1];
}

export function createAndDrawText(container: PIXI.Container, text: string, x: number, y: number, size: number, hAlign: string, vAlign: string, isRed?: boolean, overrideColor?: string) {
  let message = new PIXI.Text(text);

  size = size || 14;
  hAlign = hAlign || "center";  //start,end,left,center,right
  vAlign = vAlign || "middle";  //Top,Bottom,Middle,Alphabetic,Hanging

  let alignX = 1;
  let alignY = 1;
  if(hAlign === "left") alignX = 0;
  if(hAlign === "center") alignX = 0.5;
  if(hAlign === "right") alignX = 1;
  if(vAlign === "top") alignY = 0;
  if(vAlign === "middle") alignY = 0.5;
  if(vAlign === "bottom") alignY = 1;
  message.anchor.set(alignX, alignY);

  let style = new PIXI.TextStyle({
    fontFamily: "mmx_font",
    dropShadow: true,
    dropShadowColor: "#000000",
    dropShadowBlur: 0,
    dropShadowDistance: size/2,
  });
  message.style = style;

  if(!overrideColor) {
    setTextGradient(message, isRed);
  }
  else {
    style.fill = overrideColor;
  }

  style.fontSize = size * 3;
  message.position.set(x, y);
  message.scale.set(1/3, 1/3);
  container.addChild(message);
  return message;
}

export function drawTextMMX(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, size: number, hAlign: string, vAlign: string, isRed?: boolean, overrideColor?: string) {
  ctx.save();
  
  ctx.shadowColor = "black" // string
  ctx.shadowOffsetX = size/2; // integer
  ctx.shadowOffsetY = size/2; // integer
  ctx.shadowBlur = 0; // integer
  
  if(!overrideColor) {
    let gradient = ctx.createLinearGradient(x, y - size/2, x, y);
    let col = "#6090D0";
    if(isRed) col = "#f44256";
    gradient.addColorStop(0, col);
    gradient.addColorStop(0.5, "#C8D8E8");
    gradient.addColorStop(1.0, col);
    ctx.fillStyle = gradient;
  }
  else {
    ctx.fillStyle = overrideColor;
  }

  size = size || 14;
  hAlign = hAlign || "center";  //start,end,left,center,right
  vAlign = vAlign || "middle";  //Top,Bottom,Middle,Alphabetic,Hanging

  ctx.font = size + "px mmx_font";
  ctx.textAlign = hAlign;
  ctx.textBaseline = vAlign;
  ctx.fillText(text,x,y);
  ctx.restore();
}

export function drawText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, fillColor: string, outlineColor: string, size: number, hAlign: string, vAlign: string, font: string) {
  ctx.save();
  fillColor = fillColor || "black";
  size = size || 14;
  hAlign = hAlign || "center";  //start,end,left,center,right
  vAlign = vAlign || "middle";  //Top,Bottom,Middle,Alphabetic,Hanging
  font = font || "Arial";
  ctx.font = size + "px " + font;
  ctx.fillStyle = fillColor;
  ctx.textAlign = hAlign;
  ctx.textBaseline = vAlign;
  ctx.fillText(text,x,y);
  if(outlineColor) {
    ctx.lineWidth = 1;
    ctx.strokeStyle = outlineColor;
    ctx.strokeText(text,x,y);
  }
  ctx.restore();
}

export function drawCircle(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, fillColor?: string, lineColor?: string, lineThickness?: number) {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, 2*Math.PI, false);
  
  if(fillColor) {
      ctx.fillStyle = fillColor;
      ctx.fill();
  }
  
  if(lineColor) {
      ctx.lineWidth = lineThickness;
      ctx.strokeStyle = lineColor;
      ctx.stroke();
  }

}

export function createAndDrawLine(container: PIXI.Container, x: number, y: number, x2: number, y2: number, color?: number, thickness?: number) {
  let line = new PIXI.Graphics();
  if(!thickness) thickness = 1;
  if(!color) color = 0x000000;
  line.lineStyle(thickness, color, 1);
  line.moveTo(x, y);
  line.lineTo(x2, y2);
  line.x = 0;
  line.y = 0;
  container.addChild(line);
  return line;
}

export function drawLine(ctx: CanvasRenderingContext2D, x: number, y: number, x2: number, y2: number, color?: string, thickness?: number) {

  if(!thickness) thickness = 1;
  if(!color) color = 'black';

  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x2, y2);
  ctx.lineWidth = thickness;
  ctx.strokeStyle = color;
  ctx.stroke();
}

export function linepointNearestMouse(x0: number, y0: number, x1: number, y1: number, x: number, y: number): Point {
  function lerp(a: number,b: number,x: number):number{ return(a+x*(b-a)); };
  let dx: number=x1-x0;
  let dy: number=y1-y0;
  let t: number = ((x-x0)*dx+(y-y0)*dy)/(dx*dx+dy*dy);
  let lineX: number = lerp(x0, x1, t);
  let lineY: number = lerp(y0, y1, t);
  return new Point(lineX,lineY);
}

export function inLine(mouseX: number, mouseY: number, x0: number, y0: number, x1: number, y1: number): boolean {

  let threshold: number = 4;

  let small_x: number = Math.min(x0,x1);
  let big_x: number = Math.max(x0,x1);

  if(mouseX < small_x - (threshold*0.5) || mouseX > big_x + (threshold*0.5)){
    return false;
  }

  let linepoint: Point = linepointNearestMouse(x0, y0, x1, y1, mouseX, mouseY);
  let dx: number = mouseX - linepoint.x;
  let dy: number = mouseY - linepoint.y;
  let distance: number = Math.abs(Math.sqrt(dx*dx+dy*dy));
  if(distance < threshold) {
    return true;
  }
  else {
    return false;
  }
}

export function getInclinePushDir(inclineNormal: Point, pushDir: Point) {
  let bisectingPoint = inclineNormal.normalize().add(pushDir.normalize());
  bisectingPoint = bisectingPoint.normalize();
  //Snap to the nearest axis
  if(Math.abs(bisectingPoint.x) >= Math.abs(bisectingPoint.y)) {
    bisectingPoint.y = 0;
  }
  else {
    bisectingPoint.x = 0;
  }
  return bisectingPoint.normalize();
}

export function keyCodeToString(charCode: number) {

  if(charCode === 0) return "left mouse";
  if(charCode === 1) return "middle mouse";
  if(charCode === 2) return "right mouse";
  if(charCode === 3) return "wheel up";
  if(charCode === 4) return "wheel down";

  if (charCode == 8) return "backspace"; //  backspace
  if (charCode == 9) return "tab"; //  tab
  if (charCode == 13) return "enter"; //  enter
  if (charCode == 16) return "shift"; //  shift
  if (charCode == 17) return "ctrl"; //  ctrl
  if (charCode == 18) return "alt"; //  alt
  if (charCode == 19) return "pause/break"; //  pause/break
  if (charCode == 20) return "caps lock"; //  caps lock
  if (charCode == 27) return "escape"; //  escape
  if (charCode == 33) return "page up"; // page up, to avoid displaying alternate character and confusing people	         
  if (charCode == 34) return "page down"; // page down
  if (charCode == 35) return "end"; // end
  if (charCode == 36) return "home"; // home
  if (charCode == 37) return "left arrow"; // left arrow
  if (charCode == 38) return "up arrow"; // up arrow
  if (charCode == 39) return "right arrow"; // right arrow
  if (charCode == 40) return "down arrow"; // down arrow
  if (charCode == 45) return "insert"; // insert
  if (charCode == 46) return "delete"; // delete
  if (charCode == 91) return "left window"; // left window
  if (charCode == 92) return "right window"; // right window
  if (charCode == 93) return "select key"; // select key
  if (charCode == 96) return "numpad 0"; // numpad 0
  if (charCode == 97) return "numpad 1"; // numpad 1
  if (charCode == 98) return "numpad 2"; // numpad 2
  if (charCode == 99) return "numpad 3"; // numpad 3
  if (charCode == 100) return "numpad 4"; // numpad 4
  if (charCode == 101) return "numpad 5"; // numpad 5
  if (charCode == 102) return "numpad 6"; // numpad 6
  if (charCode == 103) return "numpad 7"; // numpad 7
  if (charCode == 104) return "numpad 8"; // numpad 8
  if (charCode == 105) return "numpad 9"; // numpad 9
  if (charCode == 106) return "multiply"; // multiply
  if (charCode == 107) return "add"; // add
  if (charCode == 109) return "subtract"; // subtract
  if (charCode == 110) return "decimal point"; // decimal point
  if (charCode == 111) return "divide"; // divide
  if (charCode == 112) return "F1"; // F1
  if (charCode == 113) return "F2"; // F2
  if (charCode == 114) return "F3"; // F3
  if (charCode == 115) return "F4"; // F4
  if (charCode == 116) return "F5"; // F5
  if (charCode == 117) return "F6"; // F6
  if (charCode == 118) return "F7"; // F7
  if (charCode == 119) return "F8"; // F8
  if (charCode == 120) return "F9"; // F9
  if (charCode == 121) return "F10"; // F10
  if (charCode == 122) return "F11"; // F11
  if (charCode == 123) return "F12"; // F12
  if (charCode == 144) return "num lock"; // num lock
  if (charCode == 145) return "scroll lock"; // scroll lock
  if (charCode == 186) return ";"; // semi-colon
  if (charCode == 187) return "="; // equal-sign
  if (charCode == 188) return ","; // comma
  if (charCode == 189) return "-"; // dash
  if (charCode == 190) return "."; // period
  if (charCode == 191) return "/"; // forward slash
  if (charCode == 192) return "`"; // grave accent
  if (charCode == 219) return "["; // open bracket
  if (charCode == 220) return "\\"; // back slash
  if (charCode == 221) return "]"; // close bracket
  if (charCode == 222) return "'"; // single quote
  if (charCode == 32) return "space";
  return String.fromCharCode(charCode);
}