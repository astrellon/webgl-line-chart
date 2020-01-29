export default class Vector4
{
    public readonly data: Float32Array = new Float32Array(4);

    add(x: number, y: number, z: number = 0, w: number = 0)
    {
        this.data[0] += x;
        this.data[1] += y;
        this.data[2] += z;
        this.data[3] += w;
    }
}