import { createMat4, setBasicView, setOrtho } from "./mat4";
import WebGLMesh from "./webglMesh";
import { WebGLDataSeries, WebGLViewport } from "./webglChartStore";
import { initShaderProgram, createLineMesh, createMinMaxMesh } from "./webglUtils";

interface DataSeriesBufferPair
{
    readonly data: WebGLDataSeries;
    readonly mesh: WebGLMesh;
}

export default class WebGLLineChart
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

    private meshes: DataSeriesBufferPair[] = [];
    private prevCharts: WebGLDataSeries[] = null;

    constructor(canvas: HTMLCanvasElement)
    {
        this.canvas = canvas;

        // Premultiplied Alpha fixes an issue in Firefox where transparent
        // chart colours render weirdly.
        this.gl = this.canvas.getContext('webgl', {
            premultipliedAlpha: false
        });

        const width = this.canvas.offsetWidth;
        const height = this.canvas.offsetHeight;
        this.canvas.width = width * window.devicePixelRatio;
        this.canvas.height = height * window.devicePixelRatio;
        this.canvas.style.width = `${width}px`;
        this.canvas.style.height = `${height}px`;

        this.viewMatrix = createMat4();
        this.cameraMatrix = createMat4();
    }

    init()
    {
        this.shaderProgram = initShaderProgram(this.gl);

        this.gl.useProgram(this.shaderProgram);

        this.gl.clearColor(0.0, 0.0, 0.0, 1.0);
        this.gl.disable(this.gl.CULL_FACE);

        this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);

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

    public changeColour(colour: number[])
    {
        this.gl.uniform4fv(this.fragColourUniform, colour);
    }

    public changeModelTransform(model: Float32Array)
    {
        this.gl.uniformMatrix4fv(this.modelUniform, false, model);
    }

    public render(viewport: WebGLViewport)
    {
        setOrtho(this.cameraMatrix, viewport.minTime, viewport.maxTime, viewport.minValue, viewport.maxValue, 0.1, 50);
        this.gl.uniformMatrix4fv(this.cameraUniform, false, this.cameraMatrix);

        for (let dataPair of this.meshes)
        {
            dataPair.mesh.render(this);
        }
    }

    public checkForDataSeriesChanges(chartDataSeries: WebGLDataSeries[]): boolean
    {
        if (this.prevCharts === chartDataSeries)
        {
            return false;
        }

        const meshesToRemove: DataSeriesBufferPair[] = [];
        for (let currentMesh of this.meshes)
        {
            let found = false;
            for (let dataSeries of chartDataSeries)
            {
                if (currentMesh.data === dataSeries)
                {
                    found = true;
                    break;
                }
            }

            if (!found)
            {
                meshesToRemove.push(currentMesh);
            }
        }

        for (let meshToRemove of meshesToRemove)
        {
            const index = this.meshes.indexOf(meshToRemove);
            this.meshes.splice(index, 1);
        }

        for (let dataSeries of chartDataSeries)
        {
            let found = false;
            for (let currentMesh of this.meshes)
            {
                if (currentMesh.data === dataSeries)
                {
                    found = true;
                    break;
                }
            }

            if (!found)
            {
                if (dataSeries.type === 'line')
                {
                    const mesh = createLineMesh(this.gl, dataSeries);
                    this.meshes.push({mesh, data: dataSeries});
                }
                else
                {
                    const mesh = createMinMaxMesh(this.gl, dataSeries);
                    this.meshes.push({mesh, data: dataSeries});
                }
            }
        }

        this.prevCharts = chartDataSeries;
        return true;
    }
}