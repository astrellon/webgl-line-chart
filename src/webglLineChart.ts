import WebGLMesh from "./webglMesh";
import { WebGLDataSeries, WebGLTimeRange, WebGLValueRange } from "./webglChartStore";
import { initShaderProgram, createLineMesh, createMinMaxMesh } from "./webglUtils";
import Matrix4x4 from "./matrix4x4";

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
    private viewMatrix: Matrix4x4 = new Matrix4x4();
    private cameraMatrix: Matrix4x4 = new Matrix4x4();

    private pointSizeUniform: WebGLUniformLocation;
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
    }

    init()
    {
        this.shaderProgram = initShaderProgram(this.gl);

        this.gl.useProgram(this.shaderProgram);

        this.gl.clearColor(0.0, 0.0, 0.0, 1.0);
        this.gl.disable(this.gl.CULL_FACE);

        this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);

        this.pointSizeUniform = this.gl.getUniformLocation(this.shaderProgram, 'pointSize');
        this.cameraUniform = this.gl.getUniformLocation(this.shaderProgram, 'camera');
        this.viewUniform = this.gl.getUniformLocation(this.shaderProgram, 'view');
        this.modelUniform = this.gl.getUniformLocation(this.shaderProgram, 'model');
        this.fragColourUniform = this.gl.getUniformLocation(this.shaderProgram, 'fragColour');

        this.viewMatrix.setBasicView(10);
        this.cameraMatrix.setOrtho(-5, 5, -5, 5, 0.1, 50);

        this.gl.uniformMatrix4fv(this.cameraUniform, false, this.cameraMatrix.data);
        this.gl.uniformMatrix4fv(this.viewUniform, false, this.viewMatrix.data);

        this.gl.bindAttribLocation(this.shaderProgram, 0, 'vertexPos');
        this.gl.enableVertexAttribArray(0);
    }

    public changePointSize(pointSize: number)
    {
        this.gl.uniform1f(this.pointSizeUniform, pointSize);
    }

    public changeColour(colour: number[])
    {
        this.gl.uniform4fv(this.fragColourUniform, colour);
    }

    public changeModelTransform(model: Float32Array)
    {
        this.gl.uniformMatrix4fv(this.modelUniform, false, model);
    }

    public render(timeViewport: WebGLTimeRange, valueViewport: WebGLValueRange)
    {
        this.cameraMatrix.setOrtho(timeViewport.minTime, timeViewport.maxTime, valueViewport.minValue, valueViewport.maxValue, 0.1, 50);
        this.gl.uniformMatrix4fv(this.cameraUniform, false, this.cameraMatrix.data);

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
                    const mesh = createLineMesh(this.gl, dataSeries, this.gl.LINE_STRIP, dataSeries.pointSize);
                    this.meshes.push({mesh, data: dataSeries});
                }
                else if (dataSeries.type === 'minmax')
                {
                    const mesh = createMinMaxMesh(this.gl, dataSeries);
                    this.meshes.push({mesh, data: dataSeries});
                }
                else if (dataSeries.type === 'dots')
                {
                    const mesh = createLineMesh(this.gl, dataSeries, this.gl.POINTS, dataSeries.pointSize);
                    this.meshes.push({mesh, data: dataSeries});
                }
            }
        }

        this.prevCharts = chartDataSeries;
        return true;
    }
}