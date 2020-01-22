import React, { CSSProperties } from 'react';
import { WebGLViewport } from './webglChartStore';

interface Props
{
    readonly viewport: WebGLViewport;
}

export default class WebGLChartLeftAxis extends React.PureComponent<Props>
{
    private ref: React.RefObject<HTMLDivElement> = React.createRef();

    public componentDidMount()
    {
        this.forceUpdate();
    }

    public render()
    {
        const ticks: JSX.Element[] = [];
        if (this.ref.current)
        {
            const { viewport } = this.props;
            const valueHeight = viewport.maxValue - viewport.minValue;
            const log = Math.log10(valueHeight);
            const logBase = Math.floor(log);
            const logFactor = Math.pow(10, logBase);
            const logRemainder = log - logBase;
            let step = 1;
            if (logRemainder < 0.3)
            {
                step = 0.1;
            }
            else if (logRemainder < 0.5)
            {
                step = 0.2;
            }
            else if (logRemainder < 0.7)
            {
                step = 0.5;
            }

            step *= logFactor;

            const start = Math.ceil(viewport.maxValue / step) * step;
            const end = Math.floor(viewport.minValue / step) * step;

            for (let value = start, i = 0; value > end; value -= step, i++)
            {
                const percent = (value - viewport.minValue) / valueHeight;
                if (percent < 0 || percent > 1)
                {
                    continue;
                }
                const style: CSSProperties = {
                    top: ((1 - percent) * 100) + '%'
                }

                let nearZero = Math.abs(value) < 1e-10;
                let valueText = nearZero ? '0' : value.toPrecision(2);
                ticks.push(<span key={i} style={style} className="webgl-chart__left-axis-tick">
                    {valueText}
                    <span className="tick" />
                </span>);
            }
        }

        return <div ref={this.ref} className="webgl-chart__left-axis-bumper webgl-chart__left-axis">
            { ticks }
        </div>;
    }
}