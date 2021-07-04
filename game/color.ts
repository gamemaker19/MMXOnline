export class Color {

  r: number;
  g: number;
  b: number;
  a: number;

  constructor(r:number, g: number, b: number, a: number) {
    if(r === undefined || g === undefined || b === undefined || a === undefined) throw "Bad color";
    this.r = r;
    this.g = g;
    this.b = b;
    this.a = a;
  }

  get hex() {
    return "#" + this.r.toString(16) + this.g.toString(16) + this.b.toString(16) + this.a.toString(16);
  }

  get number() {
    let rString = this.r.toString(16);
    let gString = this.g.toString(16);
    let bString = this.b.toString(16);
    if(rString.length === 1) rString = "0" + rString;
    if(gString.length === 1) gString = "0" + gString;
    if(bString.length === 1) bString = "0" + bString;
    let hex = "0x" + rString + gString + bString;
    return parseInt(hex, 16);
  }

}

let paletteCanvas = document.createElement("canvas");
let paletteCtx = paletteCanvas.getContext("2d");

export class Palette {

  imageEl: HTMLImageElement;
  imagePath: string = "";
  colorMap: { [color: string]: Color; } = {};
  filter: PIXI.filters.MultiColorReplaceFilter; 

  constructor(path: string) {
    this.imagePath = path;
    this.imageEl = document.createElement("img");
    this.imageEl.src = path;
    this.imageEl.onload = () => this.onLoad();
  }

  onLoad() {

    paletteCanvas.width = this.imageEl.width;
    paletteCanvas.height = this.imageEl.height;
    paletteCtx.clearRect(0, 0, this.imageEl.width, this.imageEl.height);
    paletteCtx.drawImage(this.imageEl, 0, 0);
    let imageData = paletteCtx.getImageData(0, 0, paletteCanvas.width, paletteCanvas.height);
    let data = imageData.data;

    let numberArray = [];
    for (let i = 0, j = 0; i < data.length/2; i += 4, j++) {
      let r = data[i];
      let g = data[i+1];
      let b = data[i+2];
      let a = data[i+3];
      let topColor = new Color(r, g, b, a);

      let r2 = data[i + data.length/2];
      let g2 = data[i + 1 + data.length/2];
      let b2 = data[i + 2 + data.length/2];
      let a2 = data[i + 3 + data.length/2];
      let botColor = new Color(r2, g2, b2, a2);

      this.colorMap[topColor.hex] = botColor;

      numberArray.push([topColor.number, botColor.number]);
      //console.log(topColor.number + "," + botColor.number);
    }
    
    this.filter = new PIXI.filters.MultiColorReplaceFilter(numberArray);
  }

}