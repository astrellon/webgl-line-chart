import { WebGLDataSeries } from "./webglChartStore";
import WebGLMesh from "./webglMesh";

export const DefaultVertexShader = `attribute vec4 vertexPos;
attribute vec4 vertexNormal;

//uniform mat4 viewCameraMatrix;
uniform vec4 offset;
uniform vec4 viewport;
//uniform float pointSize;

void main() {
  gl_Position = vec4((vertexPos.x - viewport.x) * viewport.y, (vertexPos.y - viewport.z) * viewport.w, 0, 1) + (vertexNormal * 0.05);
  //gl_PointSize = pointSize;
}`;

export const DefaultFragShader = `
precision mediump float;
uniform vec4 fragColour;

void main() {
  gl_FragColor = fragColour;
}`;

export function initShaderProgram(gl: WebGLRenderingContext, vsSource: string = DefaultVertexShader, fsSource: string = DefaultFragShader)
{
    const vertexShader = loadShader(gl, gl.VERTEX_SHADER, vsSource);
    const fragmentShader = loadShader(gl, gl.FRAGMENT_SHADER, fsSource);

    // Create the shader program
    const shaderProgram = gl.createProgram();
    gl.attachShader(shaderProgram, vertexShader);
    gl.attachShader(shaderProgram, fragmentShader);
    gl.linkProgram(shaderProgram);

    // If creating the shader program failed, alert
    if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS))
    {
        alert('Unable to initialize the shader program: ' + gl.getProgramInfoLog(shaderProgram));
        return null;
    }

    return shaderProgram;
}

export function loadShader(gl: WebGLRenderingContext, type: GLenum, source: string)
{
    const shader = gl.createShader(type);

    // Send the source to the shader object
    gl.shaderSource(shader, source);

    // Compile the shader program
    gl.compileShader(shader);

    // See if it compiled successfully
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS))
    {
        alert('An error occurred compiling the shaders: ' + gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
    }

    return shader;
}

export function createMesh(gl: WebGLRenderingContext, arr: Float32Array)
{
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, arr, gl.STATIC_DRAW);
    return buf;
}

export function getNumberOfQuads(dataLength: number)
{
    return ((dataLength) - 2) / 2;
}

export function getNumberOfIndices(dataLength: number)
{
    const numQuads = getNumberOfQuads(dataLength);
    const numTris = numQuads * 2;
    return numTris * 3;
}

export function createIndexBuffer(gl: WebGLRenderingContext, dataLength: number)
{
    const numQuads = getNumberOfQuads(dataLength);
    const numIndices = getNumberOfIndices(dataLength);
    const indices = new Uint32Array(numIndices);

    for (let quadIndex = 0, i = 0; quadIndex < numQuads; quadIndex++)
    {
        const index = quadIndex * 2;
        indices[i++] = index;
        indices[i++] = index + 1;
        indices[i++] = index + 2;

        indices[i++] = index + 1;
        indices[i++] = index + 2;
        indices[i++] = index + 3;
    }

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buf);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);
    return buf;
}

export function createMinMaxMesh(gl: WebGLRenderingContext, dataSeries: WebGLDataSeries)
{
    const { data, colour } = dataSeries;

    const meshPoints = new Float32Array(data.length * 2);
    const xStep = dataSeries.sqs;
    for (let i = 0, j = 0, x = 0; i < data.length; i += 2, x++)
    {
        const xPos = x * xStep;
        meshPoints[j++] = xPos;
        meshPoints[j++] = data[i];
        meshPoints[j++] = xPos;
        meshPoints[j++] = data[i + 1];
    }

    const meshBuffer = createMesh(gl, meshPoints);
    const indexBuffer = createIndexBuffer(gl, data.length);
    const webglMesh = new WebGLMesh(meshBuffer, indexBuffer, gl.TRIANGLES, data.length, colour, 1);
    webglMesh.offset = webglMesh.offset.add(dataSeries.startTime, 0);
    return webglMesh;
}

export function createLineMesh(gl: WebGLRenderingContext, dataSeries: WebGLDataSeries, mode: GLenum, pointSize: number)
{
    const { data, colour } = dataSeries;

    const meshPoints = new Float32Array(data.length * 2);
    const xStep = dataSeries.sqs;
    for (let i = 0, j = 0, x = 0; i < data.length; i++, x++)
    {
        const xPos = x * xStep;
        meshPoints[j++] = xPos;
        meshPoints[j++] = data[i];
    }

    const meshBuffer = createMesh(gl, meshPoints);
    const webglMesh = new WebGLMesh(meshBuffer, null, mode, data.length, colour, pointSize);
    webglMesh.offset = webglMesh.offset.add(dataSeries.startTime, 0);
    return webglMesh;
}

export function createLineStroke(gl: WebGLRenderingContext, dataSeries: WebGLDataSeries)
{
    const { data, colour } = dataSeries;
    const meshPoints = new Float32Array(data.length * 8);
    const xStep = dataSeries.sqs;

    const meshNormals = new Float32Array(data.length * 8);

    for (let i = 1, j = 0; i < data.length; i++)
    {
        const x1 = (i - 1) * xStep;
        const x2 = (i) * xStep;
        const y1 = data[i - 1];
        const y2 = data[i];

        const dx12 = x2 - x1;
        const dy12 = y2 - y1;

        const normal12 = normalise(-dy12, dx12);
        normal12.x *= 0.1;
        normal12.y *= 0.1;

        meshPoints[j] = x1;
        meshNormals[j++] = normal12.x;
        meshPoints[j] = y1;
        meshNormals[j++] = normal12.y;

        meshPoints[j] = x1;
        meshNormals[j++] = -normal12.x;
        meshPoints[j] = y1;
        meshNormals[j++] = -normal12.y;

        meshPoints[j] = x2;
        meshNormals[j++] = normal12.x;
        meshPoints[j] = y2;
        meshNormals[j++] = normal12.y;

        meshPoints[j] = x2;
        meshNormals[j++] = -normal12.x;
        meshPoints[j] = y2;
        meshNormals[j++] = -normal12.y;
    }

    const meshBuffer = createMesh(gl, meshPoints);
    const indexBuffer = createIndexBuffer(gl, data.length * 4 - 4);
    const webglMesh = new WebGLMesh(meshBuffer, indexBuffer, gl.TRIANGLES, data.length * 4 - 4, colour, 1);
    webglMesh.normalBuffer = createMesh(gl, meshNormals);
    webglMesh.offset = webglMesh.offset.add(dataSeries.startTime, 0);
    return webglMesh;
}

function normalise(x: number, y: number)
{
    const mag = Math.sqrt(x * x + y * y);
    return {x: x / mag, y: y / mag};
}

export function compareArray<T>(arr1: T[], arr2: T[])
{
    if (arr1 === arr2)
    {
        return true;
    }

    if (arr1.length !== arr2.length)
    {
        return false;
    }

    for (let i = 0; i < arr1.length; i++)
    {
        if (arr1[i] !== arr2[i])
        {
            return false;
        }
    }

    return true;
}