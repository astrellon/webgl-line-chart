import React from 'react';
import { WebGLChartState } from './webglChartStore';
import WebGLLineChart from './webglLineChart';

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

        return <div>
            <canvas className='webgl-canvas' ref={this.canvasRef} />
        </div>;
    }

}