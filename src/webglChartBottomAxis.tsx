import React, { CSSProperties } from 'react';

interface Props
{
    readonly maxValue: number;
    readonly minValue: number;
}

export default class WebGLChartBottomAxis extends React.PureComponent<Props>
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
            const { maxValue, minValue } = this.props;

            const valueHeight = maxValue - minValue;
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

            const start = Math.ceil(minValue / step) * step;
            const end = Math.floor(maxValue / step) * step;

            for (let value = start, i = 0; value <= end; value += step, i++)
            {
                const percent = (value - minValue) / valueHeight;
                if (percent < 0 || percent > 1)
                {
                    continue;
                }
                const style: CSSProperties = {
                    left: (percent * 100) + '%'
                }

                let nearZero = Math.abs(value) < 1e-10;
                let valueText = nearZero ? '0' : value.toPrecision(3);
                ticks.push(<span key={i} style={style} className="webgl-chart__bottom-axis-tick">
                    <span className="text">{valueText}</span>
                    <span className="tick" />
                </span>);
            }
        }

        return <div ref={this.ref} className="webgl-chart__bottom-axis-bumper webgl-chart__bottom-axis">
            { ticks }
        </div>;
    }
}