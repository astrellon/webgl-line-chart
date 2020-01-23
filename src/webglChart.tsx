import React from 'react';
import { WebGLChartState, WebGLTimeRange, WebGLValueRange } from './webglChartStore';
import WebGLLineChart from './webglLineChart';
import WebGLChartLeftAxis from './webglChartLeftAxis';
import WebGLChartBottomAxis from './webglChartBottomAxis';
import WebGLChartSelection from './webglChartSelection';

export interface TimeValuePair
{
    readonly time: number;
    readonly value: number;
}

export type WebGLSelectionState = 'in-progress' | 'done' | 'cancelled';
export type WebGLTimeSelectionHandler = (timeSelectionId: string, selectState: WebGLSelectionState, selection: WebGLTimeRange) => void;
export type WebGLValueSelectionHandler = (valueSelectionId: string, selectState: WebGLSelectionState, selection: WebGLValueRange) => void;
export type ResetTimeViewportHandler = (chartId: string, timeViewportId: string) => void;
export type ResetValueViewportHandler = (chartId: string, valueViewportId: string) => void;

interface Props
{
    readonly chartState: WebGLChartState;
    readonly timeViewport: WebGLTimeRange;
    readonly valueViewport: WebGLValueRange;
    readonly timeSelection: WebGLTimeRange;
    readonly valueSelection: WebGLValueRange;
    readonly onTimeSelect: WebGLTimeSelectionHandler;
    readonly onValueSelect: WebGLValueSelectionHandler;
    readonly onResetTimeViewport: ResetTimeViewportHandler;
    readonly onResetValueViewport: ResetValueViewportHandler;
}

const EmptyMouseDownPair: TimeValuePair = {time: null, value: null}

export default class WebGLChart extends React.PureComponent<Props>
{
    public webgl: WebGLLineChart;
    private canvas: HTMLCanvasElement;

    private canvasRef: React.RefObject<HTMLCanvasElement> = React.createRef();
    private mouseDownPair: TimeValuePair = EmptyMouseDownPair;

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
        this.webgl.render(this.props.timeViewport, this.props.valueViewport);
    }

    public render()
    {
        if (this.webgl != null)
        {
            if (this.webgl.checkForDataSeriesChanges(this.props.chartState.dataSeries))
            {
                this.webgl.render(this.props.timeViewport, this.props.valueViewport);
            }
        }

        const { valueViewport, timeViewport, valueSelection, timeSelection } = this.props;

        return <div className="webgl-chart">
            <div className="webgl-chart__header">
                <div className="webgl-chart__left-axis-bumper"></div>
                <h1 className="webgl-chart__title">Title</h1>
                <div className="webgl-chart__buttons">
                    <button onClick={() => this.resetZoom()}>Reset</button>
                </div>
            </div>
            <div className="webgl-chart__body">
                <WebGLChartLeftAxis minValue={valueViewport.minValue} maxValue={valueViewport.maxValue} />

                <div className='webgl-chart__canvas-holder'
                    onMouseDown={(e) => this.onCanvasMouseDown(e)}
                    onMouseMove={(e) => this.onCanvasMouseMove(e)}
                    onMouseUp={(e) => this.onCanvasMouseUp(e)}
                    >
                    <canvas className='webgl-chart__canvas' ref={this.canvasRef} />
                    <WebGLChartSelection valueViewport={valueViewport} timeViewport={timeViewport} timeSelect={timeSelection} valueSelect={valueSelection} />
                </div>
            </div>
            <div className="webgl-chart__footer">
                <div className="webgl-chart__left-axis-bumper"></div>
                <WebGLChartBottomAxis minValue={timeViewport.minTime} maxValue={timeViewport.maxTime} />
            </div>
        </div>;
    }

    private resetZoom()
    {
        const { chartState } = this.props;
        this.props.onResetTimeViewport(chartState.id, chartState.timeSelectionId);
        this.props.onResetValueViewport(chartState.id, chartState.valueSelectionId);
    }

    private onCanvasMouseDown(event: React.MouseEvent)
    {
        this.cancelSelection();

        this.mouseDownPair = this.getTimeValueAtLocation(event.clientX, event.clientY);
    }

    private onCanvasMouseMove(event: React.MouseEvent)
    {
        if (this.mouseDownPair.value == null)
        {
            return;
        }

        const pair = this.getTimeValueAtLocation(event.clientX, event.clientY);

        const minTime = Math.min(this.mouseDownPair.time, pair.time);
        const maxTime = Math.max(this.mouseDownPair.time, pair.time);
        this.props.onTimeSelect(this.props.chartState.timeSelectionId, 'in-progress', { minTime, maxTime });

        const minValue = Math.min(this.mouseDownPair.value, pair.value);
        const maxValue = Math.max(this.mouseDownPair.value, pair.value);
        this.props.onValueSelect(this.props.chartState.valueSelectionId, 'in-progress', { minValue, maxValue });
    }

    private onCanvasMouseUp(event: React.MouseEvent)
    {
        if (this.mouseDownPair.value == null)
        {
            return;
        }

        const pair = this.getTimeValueAtLocation(event.clientX, event.clientY);

        const minTime = Math.min(this.mouseDownPair.time, pair.time);
        const maxTime = Math.max(this.mouseDownPair.time, pair.time);
        this.props.onTimeSelect(this.props.chartState.timeSelectionId, 'done', { minTime, maxTime });

        const minValue = Math.min(this.mouseDownPair.value, pair.value);
        const maxValue = Math.max(this.mouseDownPair.value, pair.value);
        this.props.onValueSelect(this.props.chartState.valueSelectionId, 'done', { minValue, maxValue });

        this.mouseDownPair = EmptyMouseDownPair;
    }

    private cancelSelection()
    {
        this.mouseDownPair = EmptyMouseDownPair;

        this.props.onTimeSelect(this.props.chartState.id, 'cancelled', null);
        this.props.onValueSelect(this.props.chartState.id, 'cancelled', null);
    }

    private getTimeValueAtLocation(clientX: number, clientY: number): TimeValuePair
    {
        const { timeViewport, valueViewport } = this.props;

        const bounds = (event.target as HTMLElement).getBoundingClientRect();
        const x = clientX - bounds.left;
        const y = clientY - bounds.top;

        const percentX = x / bounds.width;
        const percentY = y / bounds.height;

        const timeWidth = timeViewport.maxTime - timeViewport.minTime;
        const valueHeight = valueViewport.maxValue - valueViewport.minValue;
        const time = percentX * timeWidth + timeViewport.minTime;
        const value = (1 - percentY) * valueHeight + valueViewport.minValue;

        return {time, value}
    }
}