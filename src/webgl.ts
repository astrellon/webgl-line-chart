import { createMat4, setBasicView, setOrtho, translateMat4World } from "./mat4";
import WebGLMesh from "./webglMesh";

const defaultVertexShader = `attribute vec4 vertexPos;

uniform mat4 view;
uniform mat4 camera;
uniform mat4 model;

void main() {
  gl_Position = camera * view * model * vertexPos;
}`;

const defaultFragShader = `
precision mediump float;
uniform vec4 fragColour;

void main() {
  gl_FragColor = fragColour;
}`;

function initShaderProgram(gl: WebGLRenderingContext, vsSource: string, fsSource: string) {
    const vertexShader = loadShader(gl, gl.VERTEX_SHADER, vsSource);
    const fragmentShader = loadShader(gl, gl.FRAGMENT_SHADER, fsSource);

    // Create the shader program

    const shaderProgram = gl.createProgram();
    gl.attachShader(shaderProgram, vertexShader);
    gl.attachShader(shaderProgram, fragmentShader);
    gl.linkProgram(shaderProgram);

    // If creating the shader program failed, alert

    if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
        alert('Unable to initialize the shader program: ' + gl.getProgramInfoLog(shaderProgram));
        return null;
    }

    return shaderProgram;
}

function loadShader(gl: WebGLRenderingContext, type: GLenum, source: string)
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

function createMesh(gl: WebGLRenderingContext, arr: Iterable<number>)
{
    var buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(arr), gl.STATIC_DRAW);
    return buf;
}

const numPoints = 500_000;

function createSineWave(nPoints: number, xOffset: number, yOffset: number, amplitude: number)
{
    const meshData = new Float32Array(2 * nPoints);
    for (let x = 0, i = 0; x < nPoints; x++)
    {
        const normX = (x / nPoints) * 8 - 4;
        const normY = Math.sin(normX * 10 + xOffset) * amplitude + yOffset + Math.random() * 0.2 - 0.1;
        meshData[i] = normX;
        meshData[i + 1] = normY;
        i += 2;
    }
    return meshData;
}

export default class WebGL
{
    public gl: WebGLRenderingContext;
    private canvas: HTMLCanvasElement;
    private shaderProgram: WebGLProgram;
    private viewMatrix: Float32Array;
    private cameraMatrix: Float32Array;

    private viewUniform: WebGLUniformLocation;
    private cameraUniform: WebGLUniformLocation;
    private modelUniform: WebGLUniformLocation;
    private fragColourUniform: WebGLUniformLocation;

    private meshes: WebGLMesh[] = [];

    constructor(canvas: HTMLCanvasElement)
    {
        this.canvas = canvas;
        this.gl = this.canvas.getContext('webgl');

        this.canvas.width = this.canvas.offsetWidth;
        this.canvas.height = this.canvas.offsetHeight;

        this.viewMatrix = createMat4();
        this.cameraMatrix = createMat4();
    }

    init()
    {
        this.shaderProgram = initShaderProgram(this.gl, defaultVertexShader, defaultFragShader);

        this.gl.useProgram(this.shaderProgram);

        this.gl.clearColor(0.0, 0.0, 0.0, 1.0);  // Clear to black, fully opaque
        // this.gl.clearDepth(1.0);                 // Clear everything
        // this.gl.enable(this.gl.DEPTH_TEST);      // Enable depth testing
        // this.gl.depthFunc(this.gl.LEQUAL);       // Near things obscure far things
        this.gl.disable(this.gl.CULL_FACE);

        this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);

        const top = createSineWave(numPoints, 0, 2, 1);
        const bottom = createSineWave(numPoints, 1, -2, 1.1);
        const middle = createSineWave(numPoints, 0.5, 0, 0.5);
        this.meshes.push(this.createMinMaxMesh(top, bottom, [1, 0, 0, 0.5]));
        this.meshes.push(this.createLineMesh(middle, [1, 0, 0, 1]));

        this.cameraUniform = this.gl.getUniformLocation(this.shaderProgram, 'camera');
        this.viewUniform = this.gl.getUniformLocation(this.shaderProgram, 'view');
        this.modelUniform = this.gl.getUniformLocation(this.shaderProgram, 'model');
        this.fragColourUniform = this.gl.getUniformLocation(this.shaderProgram, 'fragColour');

        setBasicView(this.viewMatrix, 10);
        setOrtho(this.cameraMatrix, -5, 5, -5, 5, 0.1, 50);

        this.gl.uniformMatrix4fv(this.cameraUniform, false, this.cameraMatrix);
        this.gl.uniformMatrix4fv(this.viewUniform, false, this.viewMatrix);

        this.gl.bindAttribLocation(this.shaderProgram, 0, 'vertexPos');
        this.gl.enableVertexAttribArray(0);
    }

    changeColour(colour: Iterable<number>)
    {
        this.gl.uniform4fv(this.fragColourUniform, colour);
    }

    changeModelTransform(model: Float32Array)
    {
        this.gl.uniformMatrix4fv(this.modelUniform, false, model);
    }

    render()
    {
        const xSin = Math.sin(Date.now() / 5000);
        setOrtho(this.cameraMatrix, -5 + xSin, 5 + xSin, -5, 5, 0.1, 50);
        this.gl.uniformMatrix4fv(this.cameraUniform, false, this.cameraMatrix);

        for (let i = 0; i < this.meshes.length; i++)
        {
            //this.meshes[i].render(this);
        }

        requestAnimationFrame(() => this.render());
    }

    createMinMaxMesh(top: Float32Array, bottom: Float32Array, colour: Iterable<number>)
    {
        if (top.length !== bottom.length)
        {
            throw new Error('Must be same leave to create min max mesh');
        }
        const result = new Float32Array(top.length * 2);

        for (let i = 0, j = 0; i < top.length; i += 2)
        {
            result[j++] = top[i];
            result[j++] = top[i + 1];
            result[j++] = bottom[i];
            result[j++] = bottom[i + 1];
        }

        const meshBuffer = createMesh(this.gl, result);
        return new WebGLMesh(meshBuffer, this.gl.TRIANGLE_STRIP, top.length, colour);
    }

    createLineMesh(data: Float32Array, colour: Iterable<number>)
    {
        const meshBuffer = createMesh(this.gl, data);
        return new WebGLMesh(meshBuffer, this.gl.LINE_STRIP, data.length / 2, colour);
    }
}