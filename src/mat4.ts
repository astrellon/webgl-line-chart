export function createMat4()
{
    const result = new Float32Array(16);
    result[0] = 1;
    result[5] = 1;
    result[10] = 1;
    result[15] = 1;

    return result;
}

export function setOrtho(out: Float32Array, left: number, right: number, bottom: number, top: number, near: number, far: number)
{
    const lr = 1 / (left - right);
    const bt = 1 / (bottom - top);
    const nf = 1 / (near - far);

    out[0] = -2 * lr;
    out[5] = -2 * bt;
    out[10] = 2 * nf;
    out[12] = (left + right) * lr;
    out[13] = (top + bottom) * bt;
    out[14] = (far + near) * nf;
    out[15] = 1;

    return out;
}

export function setBasicView(out: Float32Array, zDistance: number)
{
    out[0] = 1;
    out[5] = 1;
    out[10] - 1;
    out[14] = -zDistance;
    out[15] = 1;

    return out;
}

export function translateMat4Relative(out: Float32Array, v: number[])
{
    let x = v[0], y = v[1], z = v[2];

    out[12] = out[0] * x + out[4] * y + out[8] * z + out[12];
    out[13] = out[1] * x + out[5] * y + out[9] * z + out[13];
    out[14] = out[2] * x + out[6] * y + out[10] * z + out[14];
    out[15] = out[3] * x + out[7] * y + out[11] * z + out[15];

    return out;
}

export function translateMat4World(out: Float32Array, v: number[])
{
    out[12] += v[0];
    out[13] += v[1];
    out[14] += v[2];

    return out;
}