import React from 'react';
import { WebGLChartState } from './webglChartStore';
import WebGLLineChart from './webglLineChart';
import WebGLChartLeftAxis from './webglChartLeftAxis';
import WebGLChartBottomAxis from './webglChartBottomAxis';

interface Props
{
    readonly chartState: WebGLChartState;
}

export default class WebGLChart extends React.PureComponent<Props>
{
    public webgl: WebGLLineChart;
    private canvas: HTMLCanvasElement;

    private canvasRef: React.RefObject<HTMLCanvasElement> = React.createRef();

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
        this.webgl.render(this.props.chartState.viewport);
    }

    public render()
    {
        if (this.webgl != null)
        {
            if (this.webgl.checkForDataSeriesChanges(this.props.chartState.dataSeries))
            {
                this.webgl.render(this.props.chartState.viewport);
            }
        }

        const { viewport } = this.props.chartState;

        return <div className="webgl-chart">
            <div className="webgl-chart__header">
                <div className="webgl-chart__left-axis-bumper"></div>
                <h1 className="webgl-chart__title">Title</h1>
            </div>
            <div className="webgl-chart__body">
                <WebGLChartLeftAxis minValue={viewport.minValue} maxValue={viewport.maxValue} />
                <canvas className='webgl-chart__canvas' ref={this.canvasRef} />
            </div>
            <div className="webgl-chart__footer">
                <div className="webgl-chart__left-axis-bumper"></div>
                <WebGLChartBottomAxis minValue={viewport.minTime} maxValue={viewport.maxTime} />
            </div>
        </div>;
    }

}