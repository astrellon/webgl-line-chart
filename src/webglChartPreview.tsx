import React from 'react';
import { WebGLChartState, WebGLTimeRange, WebGLValueRange } from './webglChartStore';
import WebGLLineChart from './webglLineChart';
import WebGLChartLeftAxis from './webglChartLeftAxis';
import WebGLChartSelection from './webglChartSelection';
import WebGLChartBottomAxis from './webglChartBottomAxis';
import { WebGLTimeSelectionHandler } from './webglChart';

interface Props
{
    readonly chartState: WebGLChartState;
    readonly timeViewport: WebGLTimeRange;
    readonly timeSelection: WebGLTimeRange;
    readonly valueViewport: WebGLValueRange;
    readonly valueSelection: WebGLValueRange;
    readonly onTimeSelect: WebGLTimeSelectionHandler;
}

export default class WebGLChartPreview extends React.PureComponent<Props>
{
    public webgl: WebGLLineChart;
    private canvas: HTMLCanvasElement;

    private canvasRef: React.RefObject<HTMLCanvasElement> = React.createRef();
    private mouseDownTime: number = null;

    public componentDidMount()
    {
        if (!this.canvasRef.current)
        {
            return;
        }
        this.canvas = this.canvasRef.current;
        this.webgl = new WebGLLineChart(this.canvas);
        this.webgl.init();

        this.forceUpdate();
    }

    public componentDidUpdate()
    {
        const { originalTimeViewport, originalValueViewport } = this.props.chartState;
        this.webgl.render(originalTimeViewport, originalValueViewport);
    }

    public render()
    {
        const { timeViewport, timeSelection, chartState, valueSelection, valueViewport } = this.props;
        const { originalValueViewport, originalTimeViewport } = chartState;

        if (this.webgl != null)
        {
            if (this.webgl.checkForDataSeriesChanges(chartState.dataSeries))
            {
                this.webgl.render(originalTimeViewport, originalValueViewport);
            }
        }

        return <div className="webgl-chart is--preview">
            <div className="webgl-chart__body">
                <WebGLChartLeftAxis minValue={originalValueViewport.minValue} maxValue={originalValueViewport.maxValue} />

                <div className='webgl-chart__canvas-holder'
                    onMouseDown={(e) => this.onCanvasMouseDown(e)}
                    onMouseMove={(e) => this.onCanvasMouseMove(e)}
                    onMouseUp={(e) => this.onCanvasMouseUp(e)}
                    >
                    <canvas className='webgl-chart__canvas' ref={this.canvasRef} />
                    <WebGLChartSelection timeViewport={originalTimeViewport} timeSelect={timeSelection} enableTimeSelect={true} enableValueSelect={true} valueSelect={valueSelection} valueViewport={originalValueViewport} />

                    <WebGLChartSelection timeViewport={originalTimeViewport} timeSelect={timeViewport} enableTimeSelect={true} enableValueSelect={true} valueSelect={valueViewport} valueViewport={originalValueViewport} />
                </div>
            </div>
            <div className="webgl-chart__footer">
                <div className="webgl-chart__left-axis-bumper"></div>
                <WebGLChartBottomAxis minValue={originalTimeViewport.minTime} maxValue={originalTimeViewport.maxTime} />
            </div>
        </div>;
    }

    private onCanvasMouseDown(event: React.MouseEvent)
    {
        this.cancelSelection();

        this.mouseDownTime = this.getTimeValueAtLocation(event.clientX, event.clientY);
    }

    private getTimeSelection(currentMouse: number)
    {
        if (!this.props.chartState.enableTimeSelect)
        {
            return this.props.timeViewport;
        }

        const minTime = Math.min(this.mouseDownTime, currentMouse);
        const maxTime = Math.max(this.mouseDownTime, currentMouse);

        return { minTime, maxTime }
    }

    private onCanvasMouseMove(event: React.MouseEvent)
    {
        if (this.mouseDownTime == null)
        {
            return;
        }

        const currentMouse = this.getTimeValueAtLocation(event.clientX, event.clientY);
        const timeSelection = this.getTimeSelection(currentMouse);

        this.props.onTimeSelect(this.props.chartState.timeSelectionId, 'in-progress', timeSelection);
    }

    private onCanvasMouseUp(event: React.MouseEvent)
    {
        if (this.mouseDownTime == null)
        {
            return;
        }

        const currentMouse = this.getTimeValueAtLocation(event.clientX, event.clientY);
        const timeSelection = this.getTimeSelection(currentMouse);

        this.props.onTimeSelect(this.props.chartState.timeSelectionId, 'done', timeSelection);

        this.mouseDownTime = null;
    }

    private cancelSelection()
    {
        this.mouseDownTime = null;

        this.props.onTimeSelect(this.props.chartState.timeSelectionId, 'cancelled', null);
    }

    private getTimeValueAtLocation(clientX: number, clientY: number): number
    {
        const { timeViewport } = this.props;

        const bounds = (event.target as HTMLElement).getBoundingClientRect();
        const x = clientX - bounds.left;

        const percentX = x / bounds.width;

        const timeWidth = timeViewport.maxTime - timeViewport.minTime;
        const time = percentX * timeWidth + timeViewport.minTime;

        return time;
    }
}