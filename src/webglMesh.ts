import Vector4 from "./vector4";

export default class WebGLMesh
{
    public offset: Vector4;

    public readonly buffer: WebGLBuffer;
    public readonly mode: GLenum;
    public readonly length: number;
    public readonly colour: number[];
    public readonly pointSize: number;

    constructor (buffer: WebGLBuffer, mode: GLenum, length: number, colour: number[], pointSize: number)
    {
        this.buffer = buffer;
        this.mode = mode;
        this.length = length;
        this.colour = colour;
        this.pointSize = pointSize;
        this.offset = new Vector4();
    }
}