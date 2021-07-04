let fragment = `
varying vec2 vTextureCoord;
uniform sampler2D uSampler;

uniform float red;
uniform float green;
uniform float blue;

void main(void)
{
    vec4 c = texture2D(uSampler, vTextureCoord);

    vec3 rgb = c.rgb;
    rgb.r = rgb.r + red;
    rgb.g = rgb.g + green;
    rgb.b = rgb.b + blue;
    c.rgb = rgb;
    c.rgb *= c.a;

    gl_FragColor = c;
}
`;

let vertex = `
attribute vec2 aVertexPosition;
attribute vec2 aTextureCoord;

uniform mat3 projectionMatrix;

varying vec2 vTextureCoord;

void main(void)
{
    gl_Position = vec4((projectionMatrix * vec3(aVertexPosition, 1.0)).xy, 0.0, 1.0);
    vTextureCoord = aTextureCoord;
}
`;

///@ts-ignore
export default class AddColorFilter extends PIXI.Filter {
  ///@ts-ignore
    constructor(options) {
        super(vertex, fragment);

        Object.assign(this, {
            /**
             * The amount of red channel
             * @member {number}
             * @memberof PIXI.filters.AddColorFilter#
             * @default 1
             */
            red: 1,

            /**
             * The amount of green channel
             * @member {number}
             * @memberof PIXI.filters.AddColorFilter#
             * @default 1
             */
            green: 1,

            /**
             * The amount of blue channel
             * @member {number}
             * @memberof PIXI.filters.AddColorFilter#
             * @default 1
             */
            blue: 1
        }, options);
    }

    /**
     * Override existing apply method in PIXI.Filter
     * @private
     */
    ///@ts-ignore
    apply(filterManager, input, output, clear) {
      ///@ts-ignore  
      this.uniforms.red = this.red;
      ///@ts-ignore  
      this.uniforms.green = this.green;
      ///@ts-ignore  
      this.uniforms.blue = this.blue;
  
      filterManager.applyFilter(this, input, output, clear);
    }
}
