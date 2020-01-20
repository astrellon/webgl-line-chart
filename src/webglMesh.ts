import WebGL from "./webgl";
import { createMat4 } from "./mat4";
import WebGLChart from "./webglChart";

export default class WebGLMesh
{
    public transform: Float32Array;

    private readonly buffer: WebGLBuffer;
    private readonly mode: GLenum;
    private readonly length: number;
    private readonly colour: Iterable<number>;

    constructor (buffer: WebGLBuffer, mode: GLenum, length: number, colour: Iterable<number>)
    {
        this.buffer = buffer;
        this.mode = mode;
        this.length = length;
        this.colour = colour;
        this.transform = createMat4();
    }

    render(webgl: WebGLChart)
    {
        const gl = webgl.gl;
        gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
        gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
        webgl.changeColour(this.colour);
        webgl.changeModelTransform(this.transform);
        gl.drawArrays(this.mode, 0, this.length);
    }
}