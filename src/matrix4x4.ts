export default class Matrix4x4
{
    public readonly data: Float32Array = new Float32Array(16);

    constructor()
    {
        this.data[0] = 1;
        this.data[5] = 1;
        this.data[10] = 1;
        this.data[15] = 1;
    }

    public setOrtho(left: number, right: number, bottom: number, top: number, near: number, far: number)
    {
        const lr = 1 / (left - right);
        const bt = 1 / (bottom - top);
        const nf = 1 / (near - far);

        this.data[0] = -2 * lr;
        this.data[5] = -2 * bt;
        this.data[10] = 2 * nf;
        this.data[12] = (left + right) * lr;
        this.data[13] = (top + bottom) * bt;
        this.data[14] = (far + near) * nf;
        this.data[15] = 1;
    }

    public setBasicView(zDistance: number)
    {
        this.data[0] = 1;
        this.data[5] = 1;
        this.data[10] - 1;
        this.data[14] = -zDistance;
        this.data[15] = 1;
    }

    public translateRelative(vector: number[])
    {
        const x = vector[0], y = vector[1], z = vector[2];

        this.data[12] = this.data[0] * x + this.data[4] * y + this.data[8] * z + this.data[12];
        this.data[13] = this.data[1] * x + this.data[5] * y + this.data[9] * z + this.data[13];
        this.data[14] = this.data[2] * x + this.data[6] * y + this.data[10] * z + this.data[14];
        this.data[15] = this.data[3] * x + this.data[7] * y + this.data[11] * z + this.data[15];
    }

    public translateWorld(vector: number[])
    {
        this.data[12] += vector[0];
        this.data[13] += vector[1];
        this.data[14] += vector[2];
    }
}
