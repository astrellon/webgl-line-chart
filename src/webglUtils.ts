import { WebGLDataSeries } from "./webglChartStore";
import WebGLMesh from "./webglMesh";

export const DefaultVertexShader = `attribute vec4 vertexPos;

uniform mat4 viewCameraMatrix;
uniform vec4 offset;
uniform float pointSize;

void main() {
  gl_Position = viewCameraMatrix * (vertexPos + offset);
  gl_PointSize = pointSize;
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
    var buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, arr, gl.STATIC_DRAW);
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
    const webglMesh = new WebGLMesh(meshBuffer, gl.TRIANGLE_STRIP, data.length, colour, 1);
    //webglMesh.transform.translateWorld([dataSeries.startTime, 0, 0]);
    webglMesh.offset.add(dataSeries.startTime, 0);
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
    const webglMesh = new WebGLMesh(meshBuffer, mode, data.length, colour, pointSize);
    //webglMesh.transform.translateWorld([dataSeries.startTime, 0, 0]);
    webglMesh.offset.add(dataSeries.startTime, 0);
    return webglMesh;
}