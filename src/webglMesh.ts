import Vector4 from "./vector4";

export default class WebGLMesh
{
    public offset: Vector4;

    public normalBuffer: WebGLBuffer;
    public readonly buffer: WebGLBuffer;
    public readonly indexBuffer: WebGLBuffer;
    public readonly mode: GLenum;
    public readonly length: number;
    public readonly colour: Vector4;
    public readonly pointSize: number;

    constructor (buffer: WebGLBuffer, indexBuffer: WebGLBuffer, mode: GLenum, length: number, colour: number[], pointSize: number)
    {
        this.buffer = buffer;
        this.indexBuffer = indexBuffer;
        this.mode = mode;
        this.length = length;
        this.colour = new Vector4(colour);
        this.pointSize = pointSize;
        this.offset = new Vector4();
    }
}