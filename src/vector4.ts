export default class Vector4
{
    public readonly data: Float32Array = new Float32Array(4);

    constructor(initialData?: Iterable<number>)
    {
        if (initialData)
        {
            let i = 0;
            for (let v of initialData)
            {
                this.data[i++] = v;
                if (i >= 4)
                {
                    break;
                }
            }
        }
    }

    add(x: number, y: number, z: number = 0, w: number = 0): Vector4
    {
        const result = new Vector4();
        result.data[0] += x;
        result.data[1] += y;
        result.data[2] += z;
        result.data[3] += w;
        return result;
    }

    equals(other: Vector4)
    {
        if (this === other)
        {
            return true;
        }

        if (other === null)
        {
            return false;
        }

        return this.data[0] === other.data[0] &&
            this.data[1] === other.data[1] &&
            this.data[2] === other.data[2] &&
            this.data[3] === other.data[3];
    }
}