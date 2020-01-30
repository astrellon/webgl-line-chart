import WebGLMesh from "./webglMesh";
import { WebGLDataSeries, WebGLTimeRange, WebGLValueRange, zoomTimeRange } from "./webglChartStore";
import { initShaderProgram, createLineMesh, createMinMaxMesh, getNumberOfIndices, createLineStroke } from "./webglUtils";
import Matrix4x4 from "./matrix4x4";
import Vector4 from "./vector4";

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
    private cameraMatrix: Matrix4x4 = new Matrix4x4();

    private pointSizeUniform: WebGLUniformLocation;
    private viewCameraMatrixUniform: WebGLUniformLocation;
    private offsetUniform: WebGLUniformLocation;
    private viewportUniform: WebGLUniformLocation;
    private fragColourUniform: WebGLUniformLocation;

    private meshes: DataSeriesBufferPair[] = [];
    private prevCharts: WebGLDataSeries[] = null;

    private prevPointSize: number = null;
    private prevFragColour: Vector4 = null;
    private prevOffset: Vector4 = null;
    private prevBuffer: WebGLBuffer = null;
    private prevIndexBuffer: WebGLBuffer = null;

    private uintElementIndexExt: OES_element_index_uint;

    constructor(canvas: HTMLCanvasElement)
    {
        this.canvas = canvas;

        // Premultiplied Alpha fixes an issue in Firefox where transparent
        // chart colours render weirdly.
        this.gl = this.canvas.getContext('webgl', {
            //premultipliedAlpha: false
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
        this.viewCameraMatrixUniform = this.gl.getUniformLocation(this.shaderProgram, 'viewCameraMatrix');
        this.offsetUniform = this.gl.getUniformLocation(this.shaderProgram, 'offset');
        this.fragColourUniform = this.gl.getUniformLocation(this.shaderProgram, 'fragColour');

        this.viewportUniform = this.gl.getUniformLocation(this.shaderProgram, 'viewport');

        this.uintElementIndexExt = this.gl.getExtension('OES_element_index_uint');

        this.gl.bindAttribLocation(this.shaderProgram, 0, 'vertexPos');
        this.gl.enableVertexAttribArray(0);

        this.gl.bindAttribLocation(this.shaderProgram, 1, 'vertexNormal');
        this.gl.enableVertexAttribArray(1);
    }

    public drawMesh(mesh: WebGLMesh)
    {
        if (this.prevBuffer !== mesh.buffer)
        {
            this.gl.bindBuffer(this.gl.ARRAY_BUFFER, mesh.buffer);
            this.gl.vertexAttribPointer(0, 2, this.gl.FLOAT, false, 0, 0);
            this.prevBuffer = mesh.buffer;
        }

        if (this.prevIndexBuffer !== mesh.indexBuffer)
        {
            this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, mesh.indexBuffer);
            this.prevIndexBuffer = mesh.indexBuffer;
        }

        if (mesh.normalBuffer)
        {
            this.gl.bindBuffer(this.gl.ARRAY_BUFFER, mesh.normalBuffer);
            this.gl.vertexAttribPointer(1, 2, this.gl.FLOAT, false, 0, 0);
        }

        if (this.prevPointSize !== mesh.pointSize)
        {
            console.log('Changing point size');
            this.gl.uniform1f(this.pointSizeUniform, mesh.pointSize);
            this.prevPointSize = mesh.pointSize;
        }

        if (!mesh.colour.equals(this.prevFragColour))
        {
            console.log('Changing frag colour');
            this.gl.uniform4fv(this.fragColourUniform, mesh.colour.data);
            this.prevFragColour = mesh.colour;
        }

        if (!mesh.offset.equals(this.prevOffset))
        {
            console.log('Changing offset');
            this.gl.uniform4fv(this.offsetUniform, mesh.offset.data);
            this.prevOffset = mesh.offset;
        }

        const numIndies = getNumberOfIndices(mesh.length);
        this.gl.drawElements(mesh.mode, numIndies, this.gl.UNSIGNED_INT, 0);
    }

    public render(timeViewport: WebGLTimeRange, valueViewport: WebGLValueRange)
    {
        //this.cameraMatrix.ortho(timeViewport.minTime, timeViewport.maxTime, valueViewport.minValue, valueViewport.maxValue, -10, 50);
        //this.cameraMatrix.ortho(0, 1, 0, 1, -10, 50);
        //this.gl.uniformMatrix4fv(this.viewCameraMatrixUniform, false, this.cameraMatrix.data);

        const valueHeight = valueViewport.maxValue - valueViewport.minValue;
        const timeWidth = timeViewport.maxTime - timeViewport.minTime;

        //const ratio = (timeWidth / this.canvas.width);// * this.canvas.height / this.canvas.width;
        //this.gl.uniform1f(this.aspectRatioUniform, ratio);
        const viewport = new Vector4([timeViewport.minTime, 1 / timeWidth, valueViewport.minValue, 1 / valueHeight]);
        this.gl.uniform4fv(this.viewportUniform, viewport.data);

        for (let dataPair of this.meshes)
        {
            this.drawMesh(dataPair.mesh);
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
                    //const mesh = createLineMesh(this.gl, dataSeries, this.gl.LINE_STRIP, dataSeries.pointSize);
                    const mesh = createLineStroke(this.gl, dataSeries);
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