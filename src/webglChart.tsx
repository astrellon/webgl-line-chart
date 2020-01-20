import React from 'react';
import WebGLMesh from './webglMesh';
import { initShaderProgram, createMesh } from './webglUtils';
import { setBasicView, setOrtho, createMat4, translateMat4World } from './mat4';
import { WebGLDataSeries, WebGLChartState } from './webglChartStore';

interface DataSeriesBufferPair
{
    readonly data: WebGLDataSeries;
    readonly mesh: WebGLMesh;
}

interface Props
{
    readonly chartState: WebGLChartState;
}

export default class WebGLChart extends React.PureComponent<Props>
{
    public gl: WebGLRenderingContext;
    private canvas: HTMLCanvasElement;

    private canvasRef: React.RefObject<HTMLCanvasElement> = React.createRef();
    private shaderProgram: WebGLProgram;
    private viewMatrix: Float32Array = createMat4();
    private cameraMatrix: Float32Array = createMat4();

    private viewUniform: WebGLUniformLocation;
    private cameraUniform: WebGLUniformLocation;
    private modelUniform: WebGLUniformLocation;
    private fragColourUniform: WebGLUniformLocation;

    private meshes: DataSeriesBufferPair[] = [];
    private prevCharts: WebGLDataSeries[] = null;

    public changeColour(colour: number[])
    {
        this.gl.uniform4fv(this.fragColourUniform, colour);
    }

    public changeModelTransform(model: Float32Array)
    {
        this.gl.uniformMatrix4fv(this.modelUniform, false, model);
    }

    public componentDidMount()
    {
        if (!this.canvasRef.current)
        {
            return;
        }
        this.canvas = this.canvasRef.current;
        this.gl = this.canvas.getContext('webgl');

        this.init();

        this.forceUpdate();
    }

    public componentDidUpdate()
    {
        this.renderDataSeries();
    }

    public render()
    {
        if (this.gl != null)
        {
            this.checkForDataSeriesChanges();
        }

        return <div>
            <canvas className='webgl-canvas' ref={this.canvasRef} />
        </div>;
    }

    private checkForDataSeriesChanges()
    {
        const chartDataSeries = this.props.chartState.dataSeries;
        if (this.prevCharts === chartDataSeries)
        {
            return;
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
                    const mesh = this.createLineMesh(dataSeries);
                    this.meshes.push({mesh, data: dataSeries});
                }
                else
                {
                    const mesh = this.createMinMaxMesh(dataSeries);
                    this.meshes.push({mesh, data: dataSeries});
                }
            }
        }

        this.prevCharts = chartDataSeries;
    }

    private renderDataSeries()
    {
        const { viewport } = this.props.chartState;

        setOrtho(this.cameraMatrix, viewport.minTime, viewport.maxTime, viewport.minValue, viewport.maxValue, 0.1, 50);
        this.gl.uniformMatrix4fv(this.cameraUniform, false, this.cameraMatrix);

        for (let dataPair of this.meshes)
        {
            dataPair.mesh.render(this)
        }
    }

    private init()
    {
        this.canvas.width = this.canvas.offsetWidth;
        this.canvas.height = this.canvas.offsetHeight;

        const gl = this.gl;
        this.shaderProgram = initShaderProgram(gl);

        gl.useProgram(this.shaderProgram);

        gl.clearColor(0.0, 0.0, 0.0, 1.0);  // Clear to black, fully opaque
        // gl.clearDepth(1.0);                 // Clear everything
        // gl.enable(gl.DEPTH_TEST);      // Enable depth testing
        // gl.depthFunc(gl.LEQUAL);       // Near things obscure far things
        gl.disable(gl.CULL_FACE);

        gl.viewport(0, 0, this.canvas.width, this.canvas.height);

        this.cameraUniform = gl.getUniformLocation(this.shaderProgram, 'camera');
        this.viewUniform = gl.getUniformLocation(this.shaderProgram, 'view');
        this.modelUniform = gl.getUniformLocation(this.shaderProgram, 'model');
        this.fragColourUniform = gl.getUniformLocation(this.shaderProgram, 'fragColour');

        setBasicView(this.viewMatrix, 10);
        setOrtho(this.cameraMatrix, -5, 5, -5, 5, 0.1, 50);

        gl.uniformMatrix4fv(this.cameraUniform, false, this.cameraMatrix);
        gl.uniformMatrix4fv(this.viewUniform, false, this.viewMatrix);

        gl.bindAttribLocation(this.shaderProgram, 0, 'vertexPos');
        gl.enableVertexAttribArray(0);
    }

    private createMinMaxMesh(dataSeries: WebGLDataSeries)
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

        const meshBuffer = createMesh(this.gl, meshPoints);
        const webglMesh = new WebGLMesh(meshBuffer, this.gl.TRIANGLE_STRIP, data.length, colour);
        translateMat4World(webglMesh.transform, [dataSeries.startTime, 0, 0]);
        return webglMesh;
    }

    private createLineMesh(dataSeries: WebGLDataSeries)
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

        const meshBuffer = createMesh(this.gl, meshPoints);
        const webglMesh = new WebGLMesh(meshBuffer, this.gl.LINE_STRIP, data.length, colour);
        translateMat4World(webglMesh.transform, [dataSeries.startTime, 0, 0]);
        return webglMesh;
    }
}